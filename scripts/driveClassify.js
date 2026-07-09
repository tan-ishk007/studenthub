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
  SYLLABUS: "Notes",
  PYQ: "PYQs",
  PYQS: "PYQs",
  PAPERS: "PYQs",
  PAPER: "PYQs",
  EXAMS: "PYQs",
  EXAM: "PYQs",
  MIDSEM: "PYQs",
  ENDSEM: "PYQs",
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
  return Boolean(matchCategory(name));
}

// Exact match first ("Exams" -> EXAMS -> PYQs). If that misses, split on
// non-alphanumeric characters and check each token, so compound folder
// names like "Theory(Notes)" or "assignments questions pdfs" still match
// ("Notes" / "Assignments" respectively) instead of falling through and
// getting misread as a subject name.
function matchCategory(name) {
  const upper = name.trim().toUpperCase();
  if (CATEGORY_MAP[upper]) return CATEGORY_MAP[upper];

  const tokens = upper.split(/[^A-Z0-9]+/).filter(Boolean);
  for (const token of tokens) {
    if (CATEGORY_MAP[token]) return CATEGORY_MAP[token];
  }
  return null;
}

/**
 * Walk a list of folder-name path parts and derive { subject, category }.
 *
 * Rule: the first folder that both (a) isn't a semester folder and (b)
 * isn't a category folder is the subject. The first category-matching
 * folder encountered becomes the category and stops the subject search
 * (deeper subfolders under a category, e.g. "Misc/Assignment Questions",
 * don't get treated as a new subject).
 * If no category folder is ever found, category defaults to "Others".
 * If no subject folder is found before a category folder, subject is
 * left null (file sits directly in a category folder, no subject dir).
 *
 * Note: a semester folder can appear anywhere in the chain (or not at
 * all — many Drive trees put subject folders straight at the root with
 * semester tracked separately) — it's skipped wherever it shows up rather
 * than assumed to always be pathParts[0]. Assuming position 0 was always
 * the semester folder used to silently swallow the real subject folder
 * whenever a tree didn't have a semester layer, which produced garbage
 * subjects like "Exams" or "Theory" instead of e.g. "AUTOMATA THEORY".
 */
export function classifyPathParts(pathParts) {
  let subject = null;
  let category = null;

  for (const part of pathParts) {
    const raw = part.trim();
    if (!raw || isSemesterFolder(raw)) continue;

    const matchedCategory = matchCategory(raw);
    if (matchedCategory) {
      if (!category) category = matchedCategory;
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
