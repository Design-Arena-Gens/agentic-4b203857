"use client";

import { useMemo, useState } from "react";
import { Difficulty, MCQItem } from "@/lib/types";
import { saveResult, saveSet } from "@/lib/storage";

function download(filename: string, text: string, type = "application/json") {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function Quiz({
  items,
  difficulty,
  onReset,
}: {
  items: MCQItem[];
  difficulty: Difficulty;
  onReset: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    let correct = 0;
    for (const q of items) {
      const chosen = answers[q.id];
      const option = q.options.find((o) => o.id === chosen);
      if (option?.correct) correct++;
    }
    return { correct, total: items.length };
  }, [answers, items]);

  function handleSubmit() {
    setSubmitted(true);
    saveResult({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      total: items.length,
      correct: score.correct,
      difficulty,
    });
  }

  function handleSaveSet() {
    const title = prompt("Save set as:", `MCQ Set (${new Date().toLocaleString()})`);
    if (!title) return;
    saveSet({ id: crypto.randomUUID(), title, createdAt: Date.now(), difficulty, items });
    alert("Saved! Find it in local storage on this device.");
  }

  function handleExportJSON() {
    download(
      `mcqs-${Date.now()}.json`,
      JSON.stringify({ difficulty, items }, null, 2),
      "application/json"
    );
  }

  function handleExportCSV() {
    const header = ["question", "option_id", "option_text", "correct", "explanation", "difficulty"];
    const rows = items.flatMap((q) =>
      q.options.map((o) => [
        JSON.stringify(q.question).slice(1, -1),
        o.id,
        JSON.stringify(o.text).slice(1, -1),
        o.correct ? "true" : "false",
        JSON.stringify(q.explanation || "").slice(1, -1),
        q.difficulty,
      ])
    );
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    download(`mcqs-${Date.now()}.csv`, csv, "text/csv");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-between">
        <div className="text-sm text-zinc-600 dark:text-zinc-300">
          Difficulty: <span className="font-medium">{difficulty}</span> ? Questions: {items.length}
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-2 rounded-md border" onClick={handleSaveSet}>Save</button>
          <button className="px-3 py-2 rounded-md border" onClick={handleExportJSON}>Export JSON</button>
          <button className="px-3 py-2 rounded-md border" onClick={handleExportCSV}>Export CSV</button>
          <button className="px-3 py-2 rounded-md border" onClick={onReset}>Reset</button>
        </div>
      </div>

      <ol className="space-y-6">
        {items.map((q, idx) => {
          const chosen = answers[q.id];
          const isCorrect = submitted && q.options.find((o) => o.id === chosen)?.correct;
          return (
            <li key={q.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-sm text-zinc-500 mt-1">{idx + 1}.</span>
                <p className="font-medium leading-relaxed">{q.question}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {q.options.map((o) => {
                  const selected = answers[q.id] === o.id;
                  const correct = submitted && o.correct;
                  const wrong = submitted && selected && !o.correct;
                  return (
                    <button
                      key={o.id}
                      className={`text-left px-3 py-2 rounded-md border transition-colors ${
                        selected ? "border-black dark:border-white" : "border-zinc-300 dark:border-zinc-700"
                      } ${correct ? "bg-green-50 dark:bg-green-900/30" : ""} ${wrong ? "bg-red-50 dark:bg-red-900/30" : ""}`}
                      onClick={() => !submitted && setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      disabled={submitted}
                    >
                      <span className="font-medium mr-2">{o.id}.</span> {o.text}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className={`text-sm ${isCorrect ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                  {isCorrect ? "Correct" : "Incorrect"}
                  {q.explanation && <span className="block mt-1 text-zinc-600 dark:text-zinc-300">Explanation: {q.explanation}</span>}
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {!submitted ? (
        <div className="flex justify-end">
          <button
            className="rounded-md bg-black text-white px-5 py-2 text-sm dark:bg-white dark:text-black"
            onClick={handleSubmit}
          >
            Submit Answers
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Your Score</div>
            <div className="text-2xl font-bold">{score.correct} / {score.total}</div>
          </div>
          <button className="px-4 py-2 rounded-md border" onClick={onReset}>New Quiz</button>
        </div>
      )}
    </div>
  );
}
