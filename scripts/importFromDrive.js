// Imports files from a Google Drive folder tree into StudentHub as real,
// browsable Resource entries — the same kind created by the "Upload a
// Resource" form, just filled in automatically instead of by hand:
//
//   Title        -> AI-cleaned, spell-checked version of the filename
//   Description  -> AI-written 1-2 sentence summary
//   Subject      -> folder-name heuristic, corrected/filled by AI
//   Branch       -> --branch=XXX flag (default CSE), corrected by AI only
//                   if the filename/path clearly indicates otherwise
//   Semester     -> folder-name detection first, else --semester=N flag,
//                   else defaults to 3 (never guessed by AI — it's a
//                   required field, a wrong guess is worse than skipping
//                   the file for manual review)
//   Year         -> 4-digit calendar year pulled from the filename/path
//                   (e.g. "OR MidSem 2025.pdf" -> 2025) by AI or regex
//                   fallback. Left blank if none is found — never guessed.
//   Category     -> folder-name heuristic, corrected/filled by AI,
//                   always one of the app's real categories
//   File         -> downloaded from Drive (exporting Google Docs/Slides/
//                   Sheets/Drawings to a supported format first) and
//                   re-uploaded to Cloudinary, exactly like a manual upload
//
// Safe to re-run: already-imported files (matched by driveFileId) are
// skipped, so you can fix a missing env var or a transient failure and
// just run it again.
//
// Usage:
//   npm run import:drive                        # the real thing
//   npm run import:drive:dry                     # preview classification, no writes/uploads
//   node scripts/importFromDrive.js --branch=ME  # override the default branch (CSE)
//   node scripts/importFromDrive.js --semester=5 # override the fallback semester (3)
//
// Required env vars (see .env.example):
//   MONGO_URI, DRIVE_FOLDER_ID, DRIVE_IMPORT_UPLOADER_EMAIL
// Recommended:
//   GROQ_API_KEY (without it, titles/descriptions/subjects fall back to
//   plain filename heuristics and files that need a subject/category the
//   heuristics can't determine will be skipped for manual review instead)
// Optional:
//   DRIVE_IMPORT_CONCURRENCY (default: 3)

import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { google } from "googleapis";
import connectDB from "../config/db.js";
import Resource from "../models/Resource.js";
import User from "../models/User.js";
import { BRANCHES } from "../config/constants.js";
import { isSemesterFolder, classifyPathParts } from "./driveClassify.js";
import { classifyResource } from "./services/classifier.js";
import { uploadBufferToCloudinary } from "./services/cloudinaryUpload.js";
import { resolveDownloadPlan, downloadDriveFile } from "./services/driveDownload.js";
import { withRetry, runWithConcurrency } from "./services/retry.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const TOKEN_PATH = path.resolve("scripts/token.json");
const REPORT_PATH = path.resolve("scripts/importReport.json");

const DRY_RUN = process.argv.includes("--dry");
const CONCURRENCY = 1; // Ek baar mein ek hi request taaki server overload na ho

// --flag=value CLI parsing (only --dry was ever wired up before; --semester
// shown in usage examples was silently ignored and always fell back to 3).
function getArgValue(flag) {
  const prefix = `--${flag}=`;
  const found = process.argv.find((arg) => arg.startsWith(prefix));
  return found ? found.slice(prefix.length) : null;
}

const CLI_BRANCH = (getArgValue("branch") || "CSE").toUpperCase();
if (!BRANCHES.includes(CLI_BRANCH)) {
  throw new Error(`--branch=${CLI_BRANCH} isn't valid. Must be one of: ${BRANCHES.join(", ")}`);
}

const CLI_SEMESTER = (() => {
  const raw = getArgValue("semester");
  if (raw === null) return null;
  const n = parseInt(raw, 10);
  if (Number.isNaN(n) || n < 1 || n > 8) {
    throw new Error(`--semester=${raw} isn't valid. Must be an integer between 1 and 8.`);
  }
  return n;
})();

// ---------------------------------------------------------------------------
// Drive client + traversal
// ---------------------------------------------------------------------------

async function createDriveClient() {
  let token;
  try {
    token = JSON.parse(await fs.readFile(TOKEN_PATH, "utf8"));
  } catch {
    throw new Error(
      `Couldn't read ${TOKEN_PATH}. Run "node scripts/generateToken.js" first to authorize Drive access.`
    );
  }

  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials({ refresh_token: token.refresh_token });

  return google.drive({ version: "v3", auth });
}

async function listFolderContents(drive, folderId) {
  const files = [];
  let pageToken;

  do {
    const { data } = await withRetry(
      () =>
        drive.files.list(
          {
            q: `'${folderId}' in parents and trashed=false`,
            fields: "nextPageToken,files(id,name,mimeType,size,shortcutDetails(targetId,targetMimeType))",
            pageSize: 1000,
            pageToken,
            supportsAllDrives: true,
            includeItemsFromAllDrives: false,
          },
          { timeout: 20_000 }
        ),
      { label: `list folder ${folderId}` }
    );

    files.push(...(data.files || []));
    pageToken = data.nextPageToken;
  } while (pageToken);

  return files;
}

const IGNORED_FOLDERS = new Set([
  'node_modules',
  '.git',
  '.vscode',
  '__pycache__',
  'dist',
  'build'
]);

async function collectFileJobs(drive, folderId, pathParts = [], semester = null, jobs = []) {
  const label = pathParts.length ? pathParts.join("/") : "(root)";
  console.log(`🔎 Scanning "${label}"...`);

  const items = await listFolderContents(drive, folderId);
  console.log(
    `Folder "${pathParts.join("/") || "ROOT"}" has ${items.length} items`
  );
  for (const item of items) {
    let mimeType = item.mimeType;
    let currentId = item.id;
    console.log(item.name, item.mimeType);
    if (mimeType === "application/vnd.google-apps.shortcut") {
      if (!item.shortcutDetails?.targetId) continue;
      currentId = item.shortcutDetails.targetId;
      mimeType = item.shortcutDetails.targetMimeType;
    }

    if (mimeType === "application/vnd.google-apps.folder") {
      const folderName = item.name.trim();
      
      if (IGNORED_FOLDERS.has(folderName.toLowerCase())) {
        console.log(`⏭  Skipping folder exploration for vendor/junk directory: "${label}/${folderName}"`);
        continue;
      }

      const detectedSemester = isSemesterFolder(folderName) ? folderName.toUpperCase() : semester;
      await collectFileJobs(drive, currentId, [...pathParts, folderName], detectedSemester, jobs);
      continue;
    }

    jobs.push({
      item: { ...item, id: currentId, mimeType },
      pathParts,
      semester,
    });
  }

  if (jobs.length && jobs.length % 25 === 0) {
    console.log(`   ...${jobs.length} file(s) found so far`);
  }

  return jobs;
}

// ---------------------------------------------------------------------------
// Per-file processing
// ---------------------------------------------------------------------------

function humanizeFileName(name) {
  const withoutExt = name.replace(/\.[^./]+$/, "");
  const spaced = withoutExt.replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();
  return spaced
    .split(" ")
    .map((word) => (word.length > 3 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// Only reformats folder names that are ALL CAPS (the convention this Drive
// tree's subject folders use, e.g. "AUTOMATA THEORY") into Title Case, so
// the fallback path (used only when the AI call fails) doesn't show raw
// shouty folder names to users. Already mixed-case hints are left alone.
function humanizeSubjectHint(raw) {
  if (!raw) return raw;
  if (raw !== raw.toUpperCase()) return raw;
  return raw
    .toLowerCase()
    .split(" ")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

// Fallback year extraction (used when the AI call fails entirely) — pulls
// the first standalone 4-digit 20xx year out of the filename or folder
// path. Never guesses; returns undefined if nothing looks like a year.
function extractYearFallback(...sources) {
  for (const source of sources) {
    const match = (source || "").match(/\b(20\d{2})\b/);
    if (match) return parseInt(match[1], 10);
  }
  return undefined;
}

function buildFallbackDescription({ subject, category, semester }) {
  const subjectPart = subject ? ` for ${subject}` : "";
  return `A ${category} resource${subjectPart} (Semester ${semester}), imported from Google Drive.`;
}

async function processJob(job, ctx) {
  const { item, pathParts, semester } = job;
  const { drive, uploaderId, report } = ctx;

  const skip = (reason) => {
    report.skipped.push({ file: item.name, path: pathParts.join("/"), reason });
    console.log(`⏭  Skipped "${item.name}": ${reason}`);
  };

  // 1. Already imported?
  const existing = await Resource.exists({ driveFileId: item.id });
  if (existing) {
    report.alreadyImported++;
    return;
  }

  // 2. Can we even represent this file type?
  const plan = resolveDownloadPlan(item);
  if (!plan.supported) return skip(plan.reason);

  // 3. Semester Detection & Bypass
  let semesterNumber = parseInt(semester, 10);
  if (!semester || Number.isNaN(semesterNumber)) {
    semesterNumber = CLI_SEMESTER ?? 3; // --semester=N flag, else default 3
  }

  // 4. Deterministic heuristics from folder names
  const { subject: subjectHint, category: categoryHint } = classifyPathParts(pathParts);

  // 🔥 CRITICAL FIX: Gemini call ko try-catch block mein wrap kiya hai fallback ke sath
  let ai = null;

try {
    ai = await classifyResource({
        fileName: item.name,
        folderPath: pathParts.join("/"),
        semester: semesterNumber,
        subjectHint,
        categoryHint,
        branchHint: CLI_BRANCH,
    });
} catch (err) {
    console.warn(
        `⚠ AI classification failed for "${item.name}". Using folder heuristics.`
    );
    ai = null;
}
  // Fallback setup agar AI data na de paye ya API block ho jaye
  const category = ai?.category || categoryHint || (item.name.toLowerCase().includes("paper") || item.name.toLowerCase().includes("exam") ? "PYQs" : "Notes");
  
  // Folder tree se primary folder ka naam as subject uthao agar standard heuristic khali ho
  const fallbackSubject = pathParts.length > 0 ? pathParts[0].replace(/[_\-]+/g, " ") : "Others";
  const subject = ai?.subject || humanizeSubjectHint(subjectHint) || fallbackSubject;

  const branch = ai?.branch && BRANCHES.includes(ai.branch) ? ai.branch : CLI_BRANCH;
  const year = ai?.year || extractYearFallback(item.name, pathParts.join("/"));

  const title = ai?.title || humanizeFileName(item.name);
  const description = ai?.description || buildFallbackDescription({ subject, category, semester: semesterNumber });

  if (!subject) {
    return skip("no subject could be determined — needs manual review");
  }

  if (DRY_RUN) {
    report.wouldImport.push({
      file: item.name,
      title,
      subject,
      branch,
      year,
      category,
      semester: semesterNumber,
      aiUsed: Boolean(ai),
    });
    console.log(`📝 [dry run] "${item.name}" -> "${title}" | ${subject} | ${branch} | Sem ${semesterNumber}${year ? ` | ${year}` : ""} | ${category}`);
    return;
  }

  // 5. Download
  let buffer;
  try {
    buffer = await withRetry(() => downloadDriveFile(drive, item, plan), {
      label: `download "${item.name}"`,
    });
  } catch (err) {
    report.failed.push({ file: item.name, path: pathParts.join("/"), stage: "download", error: err.message });
    console.error(`❌ Failed to download "${item.name}": ${err.message}`);
    return;
  }

  // 6. Upload to Cloudinary
  let uploadResult;
  try {
    // 🔥 Naya Strict Code:
let currentExtension = plan.extension;
// Agar file PDF hai toh strictly extension ko safe image bucket ke liye setup karo
if (item.name.toLowerCase().endsWith('.pdf')) {
  currentExtension = 'pdf';
}

uploadResult = await withRetry(() => uploadBufferToCloudinary(buffer, { extension: currentExtension }), {
  label: `upload "${item.name}"`,
});
  } catch (err) {
    report.failed.push({
      file: item.name,
      path: pathParts.join("/"),
      stage: "upload",
      error: err.message,
    });
  
    console.error(`❌ Failed to upload "${item.name}"`);
    console.error(err);
    console.error(err.stack);
  
    return;
  }

  // 7. Create the Resource in MongoDB
  const fileName = plan.isGoogleNative ? `${item.name}.${plan.extension}` : item.name;

  try {
    await Resource.create({
      title,
      description,
      subject,
      branch,
      semester: semesterNumber,
      year,
      category,
      fileUrl: uploadResult.secure_url,
      fileName,
      uploadedBy: uploaderId,
      driveFileId: item.id,
    });
  } catch (err) {
    report.failed.push({ file: item.name, path: pathParts.join("/"), stage: "db-save", error: err.message });
    console.error(`❌ Failed to save "${item.name}" to the database: ${err.message}`);
    return;
  }

  report.imported.push({ file: item.name, title, subject, branch, year, category, semester: semesterNumber, aiUsed: Boolean(ai) });
  console.log(`✅ Imported "${title}"  [Sem ${semesterNumber} | ${subject} | ${branch}${year ? ` | ${year}` : ""} | ${category}]${ai ? "" : "  (heuristic fallback)"}`);
}

// ---------------------------------------------------------------------------
// Main execution
// ---------------------------------------------------------------------------

async function main() {
  const TARGET_FOLDER_ID = "1Pp4s77tPpihWMnP43DZvTfUH6I7ezbpa"; 
  
  if (!process.env.DRIVE_IMPORT_UPLOADER_EMAIL) {
    throw new Error(
      "DRIVE_IMPORT_UPLOADER_EMAIL missing in .env — set it to the email of an existing StudentHub user to attribute imported resources to."
    );
  }

  await connectDB();
  console.log("✅ MongoDB connected");

  const uploader = await User.findOne({ email: process.env.DRIVE_IMPORT_UPLOADER_EMAIL.toLowerCase() });
  if (!uploader) {
    throw new Error(`No user found with email ${process.env.DRIVE_IMPORT_UPLOADER_EMAIL}`);
  }
  console.log(`✅ Imported resources will be attributed to: ${uploader.name} <${uploader.email}>`);
  console.log(`   Branch: ${CLI_BRANCH}${CLI_SEMESTER ? ` | Semester fallback: ${CLI_SEMESTER}` : " | Semester fallback: 3 (default)"}`);

  console.log("Connecting to Google Drive...");
  const drive = await createDriveClient();

  console.log(`Scanning target Drive folder tree [ID: ${TARGET_FOLDER_ID}]...\n`);
  
  const jobs = await collectFileJobs(drive, TARGET_FOLDER_ID); 
  console.log(`Found ${jobs.length} file(s) to consider.${DRY_RUN ? "  (dry run — no changes will be made)" : ""}\n`);

  const report = {
    startedAt: new Date().toISOString(),
    dryRun: DRY_RUN,
    imported: [],
    wouldImport: [],
    skipped: [],
    failed: [],
    alreadyImported: 0,
  };

  await runWithConcurrency(jobs, CONCURRENCY, (job) => processJob(job, { drive, uploaderId: uploader._id, report }));

  report.finishedAt = new Date().toISOString();
  await fs.writeFile(REPORT_PATH, JSON.stringify(report, null, 2));

  console.log("\n----- Import summary -----");
  console.log(`Imported:         ${DRY_RUN ? report.wouldImport.length + " (dry run)" : report.imported.length}`);
  console.log(`Already imported: ${report.alreadyImported}`);
  console.log(`Skipped:          ${report.skipped.length}`);
  console.log(`Failed:           ${report.failed.length}`);
  console.log(`Full report:      ${REPORT_PATH}`);
  console.log("---------------------------\n");

  console.log(DRY_RUN ? "✅ Dry run complete — nothing was written." : "✅ Import completed.");
  process.exit(0);
}

main().catch((err) => {
  console.error("\nImport failed.");
  console.error(err.message);
  if (err.response?.data) console.error(err.response.data);
  process.exit(1);
});
