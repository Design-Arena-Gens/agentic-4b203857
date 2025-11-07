import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { fallbackGenerateMCQs } from "@/lib/generate";
import { Difficulty, GenerateRequest, GenerateResponse, MCQItem } from "@/lib/types";

const requestSchema = z.object({
  text: z.string().min(20),
  numQuestions: z.number().int().min(1).max(50).optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
});

function getOpenAI(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const json = (await req.json()) as GenerateRequest;
    const { text, numQuestions = 10, difficulty = "medium" } = requestSchema.parse(json);

    const client = getOpenAI();

    if (client) {
      try {
        const system = `You are a precise item writer for competitive exams. Generate high-quality multiple-choice questions (MCQs) from the provided study text. Requirements:\n- Questions must be unambiguous and test important concepts\n- Provide exactly 4 options with one correct answer\n- Include a short explanation for the correct answer\n- Tailor difficulty to: ${difficulty}\n- Return strictly JSON matching this TypeScript type:\ninterface MCQItem { id: string; question: string; options: { id: string; text: string; correct: boolean; }[]; explanation?: string; difficulty: "easy"|"medium"|"hard" }`;

        const user = `Text to convert into MCQs (limit to the most essential concepts):\n---\n${text.slice(0, 8000)}\n---\nGenerate ${numQuestions} MCQs.`;

        const response = await client.chat.completions.create({
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          temperature: difficulty === "easy" ? 0.3 : difficulty === "medium" ? 0.5 : 0.7,
          response_format: { type: "json_object" },
          max_tokens: 2000,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content) as { mcqs?: MCQItem[] } | MCQItem[];
        const mcqs: MCQItem[] = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed.mcqs)
          ? parsed.mcqs
          : [];

        const normalized: MCQItem[] = mcqs.slice(0, numQuestions).map((q, idx) => ({
          id: q.id || `q_${idx + 1}`,
          question: q.question,
          options: q.options?.slice(0, 4) || [],
          explanation: q.explanation,
          difficulty,
        }));

        if (normalized.length >= Math.min(3, numQuestions)) {
          const body: GenerateResponse = { source: "openai", mcqs: normalized };
          return NextResponse.json(body, { status: 200 });
        }
        // fallthrough to fallback on poor output
      } catch (err) {
        // fall back
      }
    }

    const mcqs = fallbackGenerateMCQs(text, numQuestions, difficulty as Difficulty);
    const body: GenerateResponse = { source: "fallback", mcqs };
    return NextResponse.json(body, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Bad request" }, { status: 400 });
  }
}
