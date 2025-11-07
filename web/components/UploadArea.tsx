"use client";

import { useRef, useState } from "react";
import { extractTextFromPdf } from "@/lib/pdf";

export function UploadArea({ onText }: { onText: (text: string) => void }) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");

  async function handleFiles(files: FileList | null) {
    setError(null);
    if (!files || files.length === 0) return;
    const file = files[0];
    setFileName(file.name);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    setLoading(true);
    try {
      const text = await extractTextFromPdf(file);
      onText(text);
    } catch (e: any) {
      setError(e?.message || "Failed to read PDF");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div
        className="rounded-lg border border-dashed border-zinc-300 p-6 text-center hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-300">Drop a PDF here or click to upload</p>
        {fileName && (
          <p className="mt-2 text-xs text-zinc-500">Selected: {fileName}</p>
        )}
        {loading && <p className="mt-2 text-sm">Extracting text?</p>}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-1">Or paste text</label>
        <textarea
          className="w-full min-h-[120px] rounded-md border border-zinc-300 p-3 dark:border-zinc-700 bg-white dark:bg-zinc-950"
          placeholder="Paste study text here?"
          value={pasted}
          onChange={(e) => setPasted(e.target.value)}
        />
        <div className="mt-2 flex justify-end">
          <button
            className="rounded-md bg-black text-white px-4 py-2 text-sm dark:bg-white dark:text-black disabled:opacity-50"
            onClick={() => onText(pasted)}
            disabled={!pasted.trim()}
          >
            Use Pasted Text
          </button>
        </div>
      </div>
    </div>
  );
}
