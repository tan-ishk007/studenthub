import path from "path";

// Extensions the app actually accepts (config/cloudinary.js `allowed_formats`
// + the "PDF, DOC, DOCX, PPT, PPTX, JPG, or PNG" copy on the upload form).
export const SUPPORTED_EXTENSIONS = new Set(["pdf", "doc", "docx", "ppt", "pptx", "jpg", "jpeg", "png"]);

// Google-native types can't be downloaded directly — they have to be
// exported to a real file format first. We export to the closest format the
// app supports; native Sheets have no supported spreadsheet format, so they
// export to PDF (still readable/shareable, just not editable as a sheet).
const GOOGLE_EXPORT_MAP = {
  "application/vnd.google-apps.document": {
    exportMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    extension: "docx",
  },
  "application/vnd.google-apps.presentation": {
    exportMime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    extension: "pptx",
  },
  "application/vnd.google-apps.spreadsheet": {
    exportMime: "application/pdf",
    extension: "pdf",
  },
  "application/vnd.google-apps.drawing": {
    exportMime: "image/png",
    extension: "png",
  },
};

const MIME_TO_EXTENSION = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "image/jpeg": "jpg",
  "image/png": "png",
};

/**
 * Figure out how (or whether) a Drive item can be turned into a file this
 * app supports, without downloading anything yet.
 * Returns { supported: false, reason } or
 *         { supported: true, isGoogleNative, exportMime|null, extension }.
 */
export function resolveDownloadPlan(item) {
  if (GOOGLE_EXPORT_MAP[item.mimeType]) {
    const { exportMime, extension } = GOOGLE_EXPORT_MAP[item.mimeType];
    return { supported: true, isGoogleNative: true, exportMime, extension };
  }

  if (item.mimeType?.startsWith("application/vnd.google-apps.")) {
    // Forms, Sites, Apps Script, Jamboard, folders-as-shortcuts, etc — no
    // sane export target.
    return { supported: false, reason: `unsupported Google-native type (${item.mimeType})` };
  }

  const nameExt = path.extname(item.name || "").replace(".", "").toLowerCase();
  const mimeExt = MIME_TO_EXTENSION[item.mimeType];
  const extension = SUPPORTED_EXTENSIONS.has(nameExt) ? nameExt : mimeExt;

  if (!extension || !SUPPORTED_EXTENSIONS.has(extension)) {
    return { supported: false, reason: `unsupported file type (.${nameExt || "?"}, ${item.mimeType})` };
  }

  return { supported: true, isGoogleNative: false, exportMime: null, extension };
}

/**
 * Download the actual bytes for a Drive item per a plan from resolveDownloadPlan().
 * Returns a Node Buffer.
 */
export async function downloadDriveFile(drive, item, plan) {
  const { data } = plan.isGoogleNative
    ? await drive.files.export(
        { fileId: item.id, mimeType: plan.exportMime },
        { responseType: "arraybuffer" }
      )
    : await drive.files.get(
        { fileId: item.id, alt: "media", supportsAllDrives: true },
        { responseType: "arraybuffer" }
      );

  return Buffer.from(data);
}
