"use client";

import { useState, useEffect } from "react";
import { useWorkflowState, clearWorkflowState } from "@/lib/hooks";
import { WorkflowState, ClozeCard, HighYieldPoint } from "@/lib/types";

// Force dynamic rendering to avoid server-side prerendering issues with pdfjs-dist
export const dynamic = "force-dynamic";

const INITIAL_STATE: WorkflowState = {
  currentStep: 0,
  sessionId: null,
  filename: null,
  rawText: null,
  highYieldPoints: [],
  clozeCards: [],
  loading: false,
  error: null,
};

export default function Home() {
  const [state, setState, isLoaded] = useWorkflowState(INITIAL_STATE);

  const handlePdfUpload = async (file: File) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      console.log("[APP] Starting PDF extraction...");
      // Dynamically import PDFProcessor to avoid server-side loading issues
      const { PDFProcessor } = await import("@/lib/pdf-processor");
      const rawText = await PDFProcessor.extractText(file);
      console.log(`[APP] PDF extracted: ${rawText.length} characters`);

      // Call API to extract high-yield points
      const response = await fetch("/api/extract-points", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfText: rawText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to extract points");
      }

      const data = await response.json();
      console.log(`[APP] Extracted ${data.points.length} high-yield points`);

      setState((prev) => ({
        ...prev,
        currentStep: 1,
        sessionId: Math.random().toString(36).substring(7),
        filename: file.name,
        rawText,
        highYieldPoints: data.points,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }));
    }
  };

  const handleStep1Confirm = async (editedPoints: HighYieldPoint[]) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Call API to generate cloze cards
      const response = await fetch("/api/generate-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ points: editedPoints }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate cards");
      }

      const data = await response.json();
      console.log(`[APP] Generated ${data.cards.length} cloze cards`);

      setState((prev) => ({
        ...prev,
        currentStep: 2,
        clozeCards: data.cards,
        highYieldPoints: editedPoints,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }));
    }
  };

  const handleStep2Confirm = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Call API to generate ANKI package
      const response = await fetch("/api/generate-anki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: state.clozeCards,
          deckName: "PDF Study Deck",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate ANKI deck");
      }

      setState((prev) => ({
        ...prev,
        currentStep: 3,
        loading: false,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Unknown error",
        loading: false,
      }));
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch("/api/generate-anki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards: state.clozeCards,
          deckName: "PDF Study Deck",
        }),
      });

      if (!response.ok) throw new Error("Failed to download file");

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "study_deck.apkg";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Download failed",
      }));
    }
  };

  const handleStartOver = () => {
    clearWorkflowState();
    setState(INITIAL_STATE);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📚 PDF to ANKI Converter
          </h1>
          <p className="text-gray-600">
            Transform your PDFs into high-yield study flashcards
          </p>
        </div>

        {/* Error Display */}
        {state.error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <strong>Error:</strong> {state.error}
          </div>
        )}

        {/* Step 0: PDF Upload */}
        {state.currentStep === 0 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Step 1: Upload Your PDF
            </h2>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
                disabled={state.loading}
                className="hidden"
                id="pdf-input"
              />
              <label htmlFor="pdf-input" className="cursor-pointer">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-xl text-gray-700 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-gray-500">PDF files only</p>
              </label>
            </div>
            {state.loading && (
              <div className="mt-4 text-center">
                <p className="text-gray-600">Processing PDF...</p>
              </div>
            )}
          </div>
        )}

        {/* Step 1: Review High-Yield Points */}
        {state.currentStep === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Step 2: Review High-Yield Points
            </h2>
            <p className="text-gray-600 mb-6">
              Edit the extracted facts as needed, then proceed to card generation.
            </p>

            <PointsEditor
              points={state.highYieldPoints}
              onConfirm={handleStep1Confirm}
              loading={state.loading}
            />
          </div>
        )}

        {/* Step 2: Review Cloze Cards */}
        {state.currentStep === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Step 3: Review Cloze Cards
            </h2>
            <p className="text-gray-600 mb-6">
              Review and edit the generated Anki cards as needed.
            </p>

            <CardsEditor
              cards={state.clozeCards}
              onUpdate={(cards) =>
                setState((prev) => ({ ...prev, clozeCards: cards }))
              }
            />

            <div className="flex gap-4 mt-8">
              <button
                onClick={handleStep2Confirm}
                disabled={state.loading}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {state.loading ? "Generating..." : "Generate ANKI Deck"}
              </button>
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, currentStep: 1 }))
                }
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Download */}
        {state.currentStep === 3 && (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ANKI Deck Ready!
            </h2>
            <p className="text-gray-600 mb-8">
              Your study deck has been successfully generated and is ready to
              import into ANKI.
            </p>

            <div className="bg-gray-50 p-4 rounded-lg mb-8 text-left">
              <p className="text-gray-700 mb-2">
                <strong>Deck Name:</strong> PDF Study Deck
              </p>
              <p className="text-gray-700">
                <strong>Total Cards:</strong> {state.clozeCards.length}
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700"
              >
                📥 Download ANKI Package
              </button>
              <button
                onClick={handleStartOver}
                className="flex-1 bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-400"
              >
                Start Over
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Component: PointsEditor
 * Allows editing of high-yield points
 */
function PointsEditor({
  points,
  onConfirm,
  loading,
}: {
  points: HighYieldPoint[];
  onConfirm: (points: HighYieldPoint[]) => void;
  loading: boolean;
}) {
  const [editedPoints, setEditedPoints] = useState(points);

  const handleUpdate = (index: number, text: string) => {
    const updated = [...editedPoints];
    updated[index].point = text;
    setEditedPoints(updated);
  };

  const handleRemove = (index: number) => {
    setEditedPoints(editedPoints.filter((_, i) => i !== index));
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        {editedPoints.map((point, index) => (
          <div key={point.id} className="flex gap-4">
            <span className="text-gray-500 font-semibold flex-shrink-0">
              {index + 1}.
            </span>
            <textarea
              value={point.point}
              onChange={(e) => handleUpdate(index, e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
            />
            <button
              onClick={() => handleRemove(index)}
              className="text-red-600 hover:text-red-800 font-semibold px-3 py-1"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => onConfirm(editedPoints)}
          disabled={loading}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Next: Generate Cards"}
        </button>
      </div>
    </>
  );
}

/**
 * Component: CardsEditor
 * Allows editing of cloze cards
 */
function CardsEditor({
  cards,
  onUpdate,
}: {
  cards: ClozeCard[];
  onUpdate: (cards: ClozeCard[]) => void;
}) {
  const handleUpdate = (index: number, field: "front" | "back", value: string) => {
    const updated = [...cards];
    updated[index][field] = value;
    if (field === "back") {
      updated[index].explanation = value;
    }
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 mb-8 max-h-96 overflow-y-auto">
      {cards.map((card, index) => (
        <div key={card.id} className="border border-gray-300 rounded-lg p-4">
          <div className="font-semibold text-gray-900 mb-3">Card {index + 1}</div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Front (Cloze Question):
            </label>
            <textarea
              value={card.front}
              onChange={(e) => handleUpdate(index, "front", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Back (Explanation):
            </label>
            <textarea
              value={card.back}
              onChange={(e) => handleUpdate(index, "back", e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
