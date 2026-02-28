import { getYouComClient } from "./youcom";
import { supabase } from "../supabase";

// ── Question types ──

export type QuestionType = "multiple_choice" | "true_false" | "fill_blank";

export interface MultipleChoiceQuestion {
  id: number;
  type: "multiple_choice";
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface TrueFalseQuestion {
  id: number;
  type: "true_false";
  question: string;
  correct: boolean;
  explanation: string;
}

export interface FillBlankQuestion {
  id: number;
  type: "fill_blank";
  question: string;
  answer: string;
  acceptedAnswers: string[];
  explanation: string;
}

export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | FillBlankQuestion;

export interface Quiz {
  moduleId: string;
  questions: Question[];
}

// ── System prompt ──

const QUIZ_SYSTEM_PROMPT = `You are an expert educator generating a comprehension quiz.

Given a learning module's title and content, generate between 5 and 10 questions
that test deep understanding — not just surface recall.

Use a mix of these question types:
- multiple_choice: 4 options, one correct
- true_false: a statement that is either true or false
- fill_blank: a sentence with ___ where one key term belongs

Vary the difficulty: include some straightforward questions and some that
require applying or connecting concepts.

Return ONLY valid JSON in this exact structure, no other text:
{
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    },
    {
      "id": 2,
      "type": "true_false",
      "question": "string",
      "correct": true,
      "explanation": "string"
    },
    {
      "id": 3,
      "type": "fill_blank",
      "question": "Quantum gates must be ___ to preserve the total probability of quantum states.",
      "answer": "unitary",
      "acceptedAnswers": ["unitary matrices", "unitary operators"],
      "explanation": "string"
    }
  ]
}

Rules:
- Generate 5–10 questions depending on the richness of the module content
- Never repeat the same concept twice
- Make wrong options plausible — no obviously silly distractors
- Explanations should be 1–2 sentences teaching why the answer is correct
- Return ONLY the JSON object, nothing else`;

// ── Generator ──

export async function generateQuiz(module: {
  id: string;
  title: string;
  content: string;
}, apiKey?: string): Promise<Quiz> {
  // 1. Check Supabase cache first
  const { data: cached } = await supabase
    .from("module_quizzes")
    .select("questions")
    .eq("module_id", module.id)
    .maybeSingle();

  if (cached) {
    return { moduleId: module.id, questions: cached.questions as Question[] };
  }

  // 2. Call You.com Agents API (non-streaming, same pattern as tutorAgent)
  const client = getYouComClient(apiKey);
  const userPrompt = `Module title: ${module.title}\n\nModule content:\n${module.content}`;

  const response = await client.runAgent(
    `${QUIZ_SYSTEM_PROMPT}\n\n${userPrompt}`,
    "express",
  );

  const responseText = response.output
    .filter((item) => item.type === "message.answer")
    .map((item) => ("text" in item ? item.text : ""))
    .join("\n");

  // 3. Parse JSON response
  const clean = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed: { questions: Question[] } = JSON.parse(clean);
  const questions = parsed.questions;

  // 4. Cache in Supabase
  await supabase.from("module_quizzes").upsert({
    module_id: module.id,
    questions,
  });

  return { moduleId: module.id, questions };
}
