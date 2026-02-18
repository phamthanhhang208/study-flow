import { getYouComClient } from "./youcom";
import type { LLMModuleOutline } from "./types";

const SYSTEM_PROMPT = `You are a curriculum designer. Break the following topic into 3-5 progressive learning sub-modules.
Return ONLY valid JSON with this structure:
{
  "topic": string,
  "overview": string (2-3 sentences),
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedTotalMinutes": number,
  "modules": [
    {
      "order": number,
      "title": string,
      "description": string (1-2 sentences),
      "estimatedMinutes": number,
      "searchQuery": string (specific optimized search query for finding resources),
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ]
}
Rules: modules must be progressive, 3 minimum 5 maximum, return ONLY JSON no other text.`;

const STRICT_PROMPT = `You are a curriculum designer. Break the following topic into 3-5 progressive learning sub-modules.
You MUST return ONLY a valid JSON object. No markdown, no code fences, no explanation. Just raw JSON.
{
  "topic": string,
  "overview": string,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "estimatedTotalMinutes": number,
  "modules": [
    {
      "order": number,
      "title": string,
      "description": string,
      "estimatedMinutes": number,
      "searchQuery": string,
      "difficulty": "beginner" | "intermediate" | "advanced"
    }
  ]
}
Rules: modules must be progressive, 3 minimum 5 maximum. Return ONLY valid JSON, nothing else.`;

function stripCodeFences(text: string): string {
  // Remove ```json ... ``` or ``` ... ``` wrappers
  const fenced = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenced) return fenced[1].trim();
  return text.trim();
}

function validateOutline(data: unknown): LLMModuleOutline {
  const obj = data as Record<string, unknown>;

  if (typeof obj.topic !== "string" || !obj.topic) {
    throw new Error("Missing or invalid 'topic' field");
  }
  if (typeof obj.overview !== "string" || !obj.overview) {
    throw new Error("Missing or invalid 'overview' field");
  }
  if (!["beginner", "intermediate", "advanced"].includes(obj.difficulty as string)) {
    throw new Error("Invalid 'difficulty' field");
  }
  if (typeof obj.estimatedTotalMinutes !== "number") {
    throw new Error("Missing or invalid 'estimatedTotalMinutes' field");
  }

  const modules = obj.modules;
  if (!Array.isArray(modules) || modules.length < 3 || modules.length > 5) {
    throw new Error(`Expected 3-5 modules, got ${Array.isArray(modules) ? modules.length : 0}`);
  }

  for (const mod of modules) {
    const m = mod as Record<string, unknown>;
    if (typeof m.order !== "number") throw new Error("Module missing 'order'");
    if (typeof m.title !== "string" || !m.title) throw new Error("Module missing 'title'");
    if (typeof m.description !== "string" || !m.description) throw new Error("Module missing 'description'");
    if (typeof m.estimatedMinutes !== "number") throw new Error("Module missing 'estimatedMinutes'");
    if (typeof m.searchQuery !== "string" || !m.searchQuery) throw new Error("Module missing 'searchQuery'");
    if (!["beginner", "intermediate", "advanced"].includes(m.difficulty as string)) {
      throw new Error("Module has invalid 'difficulty'");
    }
  }

  return data as LLMModuleOutline;
}

async function callAgent(topic: string, prompt: string, apiKey?: string): Promise<string> {
  const client = getYouComClient(apiKey);
  const input = `${prompt}\n\nTopic: ${topic}`;

  const response = await client.runAgent(input, "express");

  // Extract text from agent output
  for (const output of response.output) {
    if (output.type === "message.answer") {
      return output.text;
    }
  }

  throw new Error("No answer text in agent response");
}

export async function generateModuleOutline(
  topic: string,
  apiKey?: string,
): Promise<LLMModuleOutline> {
  // First attempt
  try {
    const raw = await callAgent(topic, SYSTEM_PROMPT, apiKey);
    const cleaned = stripCodeFences(raw);
    const parsed = JSON.parse(cleaned);
    return validateOutline(parsed);
  } catch (firstError) {
    console.warn("First module generation attempt failed, retrying with stricter prompt:", firstError);
  }

  // Retry with stricter prompt
  const raw = await callAgent(topic, STRICT_PROMPT, apiKey);
  const cleaned = stripCodeFences(raw);
  const parsed = JSON.parse(cleaned);
  return validateOutline(parsed);
}
