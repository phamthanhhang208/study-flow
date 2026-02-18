import { getYouComClient } from "./youcom";
import type {
  TutorContext,
  TutorResponse,
  SubModule,
  Citation,
} from "./types";

function buildTutorPrompt(question: string, context: TutorContext): string {
  const articlesText =
    context.availableArticles
      .map((a, i) => `[${i + 1}] ${a.title} - ${a.url}`)
      .join("\n") || "None";

  const videosText =
    context.availableVideos
      .map(
        (v, i) =>
          `[${i + 1 + context.availableArticles.length}] ${v.title} - ${v.url}`,
      )
      .join("\n") || "None";

  const conversationText =
    context.conversationHistory
      .slice(-4)
      .map(
        (msg) =>
          `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.content}`,
      )
      .join("\n") || "This is the first question.";

  return `You are an expert tutor helping a student learn about a specific topic.
Your role is to answer questions about the current learning module with:
- Clear, concise explanations (2-3 paragraphs maximum)
- References to the module content when relevant
- Citations to available resources using [1], [2], [3] format
- Focus on the current learning objective

Current Context:
Topic: ${context.topic}
Module: ${context.moduleTitle}
Module Focus: ${context.moduleDescription}

Module Content (excerpt):
${context.moduleContent.slice(0, 800)}

Available Resources:
Articles:
${articlesText}

Videos:
${videosText}

Conversation History:
${conversationText}

Instructions:
1. Answer the student's question directly and concisely
2. Reference specific parts of the module content when helpful
3. Cite sources using [1], [2] format - these must match the Available Resources
4. If the question is outside this module's scope, briefly answer but suggest which module would cover it better
5. End with 1-2 optional follow-up questions if appropriate
6. Keep answers focused and practical

Student Question: ${question}

Respond in this JSON format:
{
  "answer": "Your answer here with citations [1][2]",
  "citations": [
    {"id": 1, "url": "exact URL from available resources", "title": "Resource title"}
  ],
  "suggestedFollowUps": ["Follow-up question 1?", "Follow-up question 2?"]
}`;
}

export async function askTutorQuestion(
  question: string,
  context: TutorContext,
  apiKey?: string,
): Promise<TutorResponse> {
  const client = getYouComClient(apiKey);
  const prompt = buildTutorPrompt(question, context);

  const response = await client.runAgent(prompt, "express", [
    { type: "web_search" },
  ]);

  // Extract text from output
  const responseText = response.output
    .filter((item) => item.type === "message.answer")
    .map((item) => ("text" in item ? item.text : ""))
    .join("\n");

  // Extract citations from search results
  const searchCitations: Citation[] = response.output
    .filter((item) => item.type === "web_search.results")
    .flatMap((item) => ("content" in item ? item.content : []));

  // Try to parse JSON from response
  const jsonText = responseText
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  let parsed: {
    answer: string;
    citations?: Array<{ id: number; url: string; title: string }>;
    suggestedFollowUps?: string[];
  };

  try {
    parsed = JSON.parse(jsonText);
  } catch {
    // Fallback: use raw text as answer
    return {
      answer: responseText,
      citations: searchCitations,
      suggestedFollowUps: [],
    };
  }

  // Map parsed citations back to Citation format, preferring search citations
  const allResources = [
    ...context.availableArticles,
    ...context.availableVideos,
  ];
  const mappedCitations: Citation[] = (parsed.citations || [])
    .map((c) => {
      const resource = allResources.find((r) => r.url === c.url);
      if (resource) {
        return {
          source_type: "web",
          citation_uri: resource.url,
          title: resource.title,
          snippet: "description" in resource ? resource.description : "",
          url: resource.url,
        };
      }
      return null;
    })
    .filter((c): c is Citation => c !== null);

  // Use search citations if we couldn't map any
  const finalCitations =
    mappedCitations.length > 0 ? mappedCitations : searchCitations;

  return {
    answer: parsed.answer,
    citations: finalCitations,
    suggestedFollowUps: parsed.suggestedFollowUps || [],
  };
}

export function generateSuggestedQuestions(module: SubModule): string[] {
  return [
    `What are the key concepts in ${module.title}?`,
    `Can you explain this with a real-world example?`,
    `What's the most important thing to understand here?`,
    `How does this connect to the other modules?`,
  ];
}
