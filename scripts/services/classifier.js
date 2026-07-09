import OpenAI from "openai";
import { BRANCHES } from "../../config/constants.js";

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function classifyResource({
  fileName,
  folderPath,
  semester,
  subjectHint,
  categoryHint,
  branchHint,
}) {
  const prompt = `
You are classifying university study resources.

Filename:
${fileName}

Folder Path:
${folderPath}

Semester:
${semester}

Known subject (from folder structure — this is your strongest signal for
the subject; trust it unless the filename clearly contradicts it):
${subjectHint || "Unknown"}

Known category (from folder structure):
${categoryHint || "Unknown"}

Known branch:
${branchHint || "Unknown"}

Allowed categories ONLY:

Notes
PYQs
Books
Assignments
Coding
Lab Files
Others

If the resource is a MidSem, EndSem, Quiz, Test or Previous Year Paper,
ALWAYS return "PYQs".

Never return "Exams".
Never invent categories.

Allowed branches ONLY:
${BRANCHES.join("\n")}

SUBJECT RULES:
- The subject is the actual course name (e.g. "Automata Theory", "Operation
  Research", "Computer Architecture") — NEVER a generic folder/category word
  like "Exams", "Notes", "Papers", "Misc", "Theory", "Assignments", "Books".
- If "Known subject" above is a real course name, use it as the base —
  clean up its casing (Title Case, not ALL CAPS) but do NOT replace it with
  something unrelated. Expanding a known abbreviation (e.g. "OR" ->
  "Operation Research") is fine ONLY if the filename/folder path confirms it.
- If "Known subject" is missing, empty, or itself looks generic, infer the
  real subject from the filename and folder path instead (e.g. a filename
  containing "Automata" belongs to "Automata Theory"). Never leave subject
  blank if the filename or path gives any real clue.

TITLE RULES — the title must be a cleaned-up version of the actual filename,
nothing more:
- Fix spelling, spacing, capitalization, and punctuation only.
- Keep every identifying token from the filename (subject abbreviations like
  "OR", "CA", "DS", "ADE", "OOP" or numbers like "2025", "Q1-Q4" must stay,
  either as-is or expanded — never dropped).
- Do NOT add words that aren't in the filename or clearly implied by it
  (e.g. don't append "Questions", "Notes", "Solutions" unless already there).
- Do NOT shorten or summarize — the title should map 1:1 to the filename's
  content, just tidied up.
- If the filename is already clean, keep it almost unchanged.

Examples (filename -> title):
"or endsem-1.pdf" -> "OR Endsem 1"
"OR End sem Q1-Q2-Q3-Q4.pdf" -> "OR End Sem Q1-Q4"
"CA_MidSem_2025.pdf" -> "CA MidSem 2025"
"ca_after_midsem (2).pdf" -> "CA After Midsem"

DESCRIPTION RULES: one plain factual sentence describing what the file is
(subject + type + semester, if known). No filler, no marketing language.

BRANCH RULE: return "branchHint" as-is unless the filename/folder path
clearly indicates a different branch from the allowed list. If genuinely
unclear, just return the "Known branch" value unchanged.

YEAR RULE: look for a 4-digit calendar year (2000-2099) anywhere in the
filename or folder path (e.g. "OR MidSem 2025.pdf" -> 2025). This is the
year the paper/resource is FROM, not the semester or year of study. If no
year is present anywhere, return an empty string "" — do not guess.

Return ONLY JSON.

{
"title":"",
"description":"",
"subject":"",
"category":"",
"branch":"",
"year":""
}
`;

  const response = await client.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    temperature: 0,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Normalize year to a number (or undefined) — the model returns it as a
  // string per the JSON schema above, and may return "" or something
  // non-numeric if it couldn't find one.
  const parsedYear = parseInt(result.year, 10);
  result.year = Number.isInteger(parsedYear) ? parsedYear : undefined;

  return result;
}
