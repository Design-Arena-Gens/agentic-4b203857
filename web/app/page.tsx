"use client";

import { useMemo, useState } from "react";
import { UploadArea } from "@/components/UploadArea";
import { Settings } from "@/components/Settings";
import { Quiz } from "@/components/Quiz";
import { Progress } from "@/components/Progress";
import { Difficulty, MCQItem } from "@/lib/types";

export default function Home() {
  const [rawText, setRawText] = useState("");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<MCQItem[] | null>(null);
  const [source, setSource] = useState<"openai" | "fallback" | null>(null);

  const canGenerate = useMemo(() => rawText.trim().length >= 40, [rawText]);

  async function handleGenerate() {
    if (!canGenerate) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: rawText, numQuestions, difficulty }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { source: "openai" | "fallback"; mcqs: MCQItem[] };
      setItems(data.mcqs);
      setSource(data.source);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e?.message || "Failed to generate questions");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-950 dark:text-zinc-50">
      <header className="border-b bg-white/80 dark:bg-black/50 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">PDF ? MCQ</h1>
          <div className="text-xs text-zinc-500">Generate quizzes from PDFs</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-6 space-y-6">
        {!items && (
          <section className="space-y-6">
            <UploadArea onText={setRawText} />
            <Settings
              numQuestions={numQuestions}
              setNumQuestions={setNumQuestions}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-300">
                {canGenerate ? "Ready to generate." : "Upload a PDF or paste text to begin."}
              </div>
              <button
                className="rounded-md bg-black text-white px-5 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50"
                onClick={handleGenerate}
                disabled={!canGenerate || loading}
              >
                {loading ? "Generating?" : "Generate MCQs"}
              </button>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Progress />
          </section>
        )}

        {items && (
          <section className="space-y-4">
            <div className="text-xs text-zinc-500">Source: {source}</div>
            <Quiz items={items} difficulty={difficulty} onReset={() => { setItems(null); setSource(null); }} />
          </section>
        )}
      </main>

      <footer className="py-8 text-center text-xs text-zinc-500">
        v1.0 ? Built for study practice
      </footer>
    </div>
  );
}
