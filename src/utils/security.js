export const SECURITY_QUESTIONS = [
  "What is your mother's first name?",
  "What was the name of your primary school?",
  "In which town or village were you born?",
  "What is the name of your best childhood friend?",
  "What was the name of your first teacher?",
];

// Answers are compared in lower case with extra spaces removed
export function normalizeAnswer(answer) {
  return String(answer || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}
