// Shared folder-classification logic for the Drive import pipeline.
// Used by both importFromDrive.js (live traversal) and
// backfillDriveCategories.js (re-classifying already-imported docs
// from their stored `path` field, no Drive API calls needed).

import { RESOURCE_CATEGORIES } from "../config/constants.js";

export const SEMESTER_REGEX =
  /^(1(ST)?|2(ND)?|3(RD)?|4(TH)?|5(TH)?|6(TH)?|7(TH)?|8(TH)?)\s*SEM(ESTER)?$/i;

// Folder names that describe a *category*, not a subject. Mapped to one of
// the app's actual RESOURCE_CATEGORIES (config/constants.js) — this used to
// map some folder names to labels like "Videos" / "Slides" / "Misc" that
// don't exist in the app's category enum, so those resources would never
// show up correctly in the site's category filters. Every value below is
// now guaranteed to be a real category.
export const CATEGORY_MAP = {
  BOOKS: "Books",
  TEXTBOOK: "Books",
  TEXTBOOKS: "Books",
  REFERENCE: "Books",
  REFERENCES: "Books",
  NOTES: "Notes",
  SLIDES: "Notes",
  PPT: "Notes",
  PPTS: "Notes",
  PYQ: "PYQs",
  PYQS: "PYQs",
  PAPERS: "PYQs",
  IMPORTANT: "PYQs",
  ASSIGNMENTS: "Assignments",
  ASSIGNMENT: "Assignments",
  CODING: "Coding",
  CODE: "Coding",
  PROGRAMS: "Coding",
  PRACTICALS: "Lab Files",
  PRACTICAL: "Lab Files",
  LAB: "Lab Files",
  LABS: "Lab Files",
  TUTORIALS: "Lab Files",
  VIDEOS: "Others",
  MISC: "Others",
};

// Defensive check, mostly to catch future edits to CATEGORY_MAP that
// introduce a typo or a value outside the app's real category enum.
for (const value of Object.values(CATEGORY_MAP)) {
  if (!RESOURCE_CATEGORIES.includes(value)) {
    throw new Error(
      `driveClassify CATEGORY_MAP has an invalid category "${value}" — must be one of: ${RESOURCE_CATEGORIES.join(", ")}`
    );
  }
}

export function isSemesterFolder(name) {
  return SEMESTER_REGEX.test(name.trim());
}

export function isGenericFolder(name) {
  return Object.prototype.hasOwnProperty.call(
    CATEGORY_MAP,
    name.trim().toUpperCase()
  );
}

/**
 * Walk a list of folder-name path parts (semester folder first) and
 * derive { subject, category }.
 *
 * Rule: the first non-category folder encountered is the subject.
 * The first category-matching folder encountered becomes the category
 * and stops the subject search (deeper subfolders under a category,
 * e.g. "Misc/Assignment Questions", don't get treated as a new subject).
 * If no category folder is ever found, category defaults to "Others".
 * If no subject folder is found before a category folder, subject is
 * left null (file sits directly in a category folder, no subject dir).
 */
export function classifyPathParts(pathParts) {
  let subject = null;
  let category = null;

  // pathParts[0] is the semester folder itself; start scanning after it.
  for (let i = 1; i < pathParts.length; i++) {
    const raw = pathParts[i].trim();
    const upper = raw.toUpperCase();

    if (CATEGORY_MAP[upper]) {
      if (!category) category = CATEGORY_MAP[upper];
    } else if (!subject && !category) {
      subject = raw;
    }
  }

  if (!category) category = "Others";

  return { subject, category };
}

export function classifyPathString(pathString) {
  const parts = pathString
    .split("/")
    .map((p) => p.trim())
    .filter(Boolean);

  return classifyPathParts(parts);
}
