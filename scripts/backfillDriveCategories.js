// One-off backfill: re-classify subject/category for every DriveResource
// already in the DB, using the improved logic in driveClassify.js.
// Reads only the stored `path` field — does NOT call the Drive API,
// so it's fast and works even if OAuth tokens have expired.
//
// Run with: npm run backfill:drive
// Add --dry to preview changes without writing: npm run backfill:drive -- --dry

import "dotenv/config";
import connectDB from "../config/db.js";
import DriveResource from "../models/DriveResource.js";
import { classifyPathString } from "./driveClassify.js";

const DRY_RUN = process.argv.includes("--dry");

async function main() {
  await connectDB();
  console.log(`✅ MongoDB Connected${DRY_RUN ? " (dry run — no writes)" : ""}`);

  const cursor = DriveResource.find({}).cursor();

  let examined = 0;
  let changed = 0;
  let subjectFixed = 0;
  let categoryFixed = 0;
  const sampleChanges = [];

  for await (const doc of cursor) {
    examined++;

    const { subject: newSubjectRaw, category: newCategory } =
      classifyPathString(doc.path || "");
    const newSubject = newSubjectRaw || "Unknown";
    const newNeedsReview = !newSubjectRaw;

    const subjectChanged = doc.subject !== newSubject;
    const categoryChanged = doc.category !== newCategory;
    const reviewChanged = Boolean(doc.needsReview) !== newNeedsReview;

    if (!subjectChanged && !categoryChanged && !reviewChanged) {
      continue;
    }

    changed++;
    if (subjectChanged) subjectFixed++;
    if (categoryChanged) categoryFixed++;

    if (sampleChanges.length < 15) {
      sampleChanges.push({
        title: doc.title,
        path: doc.path,
        subject: `${doc.subject} -> ${newSubject}`,
        category: `${doc.category} -> ${newCategory}`,
      });
    }

    if (!DRY_RUN) {
      await DriveResource.updateOne(
        { _id: doc._id },
        {
          $set: {
            subject: newSubject,
            category: newCategory,
            needsReview: newNeedsReview,
          },
        }
      );
    }
  }

  console.log("\n----- Backfill summary -----");
  console.log(`Examined:         ${examined}`);
  console.log(`Changed:          ${changed}`);
  console.log(`  subject fixed:  ${subjectFixed}`);
  console.log(`  category fixed: ${categoryFixed}`);
  console.log("-----------------------------\n");

  if (sampleChanges.length) {
    console.log(`Sample of changes (first ${sampleChanges.length}):`);
    for (const s of sampleChanges) {
      console.log(`- ${s.title}`);
      console.log(`    path: ${s.path}`);
      console.log(`    subject: ${s.subject}`);
      console.log(`    category: ${s.category}`);
    }
  }

  if (DRY_RUN) {
    console.log("\nDry run only — no documents were modified. Re-run without --dry to apply.");
  } else {
    console.log("\n✅ Backfill complete.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("\nBackfill failed.");
  console.error(err);
  process.exit(1);
});
