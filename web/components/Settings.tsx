"use client";

import { Difficulty } from "@/lib/types";

export function Settings({
  numQuestions,
  setNumQuestions,
  difficulty,
  setDifficulty,
}: {
  numQuestions: number;
  setNumQuestions: (n: number) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-1">Number of questions</label>
        <input
          type="range"
          min={5}
          max={30}
          step={1}
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          className="w-full"
        />
        <div className="text-sm text-zinc-600 dark:text-zinc-300">{numQuestions}</div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Difficulty</label>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDifficulty(d)}
              className={`px-3 py-2 rounded-md text-sm border ${
                difficulty === d
                  ? "bg-black text-white dark:bg-white dark:text-black"
                  : "bg-white dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
