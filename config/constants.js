// Single source of truth for the values used across the Resource schema,
// the resource-upload form, the Drive folder classifier, and the AI
// classifier. Keeping this in one place means the Drive import can never
// drift out of sync with what the app's "Upload a Resource" form actually
// accepts.

export const RESOURCE_CATEGORIES = [
  'Notes',
  'PYQs',
  'Books',
  'Assignments',
  'Coding',
  'Lab Files',
  'Others',
];

export const BRANCHES = ['CSE', 'ECE', 'EE', 'CE', 'CHE', 'MECH', 'BT', 'PIE'];

export const MIN_SEMESTER = 1;
export const MAX_SEMESTER = 8;

// Loose bounds for the optional "year" field (the calendar/exam year a PYQ,
// paper, or dated resource is from — e.g. 2025 — not the student's year of
// study). Wide enough to cover old scanned papers without being meaningless.
export const MIN_YEAR = 2000;
export const MAX_YEAR = new Date().getFullYear() + 1;
