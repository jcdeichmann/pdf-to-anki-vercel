/**
 * API Route: /api/generate-cards
 * Generates cloze-style flashcards from high-yield points
 */

import { NextRequest, NextResponse } from "next/server";
import { createLLMService } from "@/lib/llm-service";
import { GenerateCardsRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateCardsRequest = await request.json();

    if (!body.points || body.points.length === 0) {
      return NextResponse.json(
        { error: "High-yield points are required" },
        { status: 400 }
      );
    }

    console.log(`[API] /api/generate-cards - Processing ${body.points.length} points`);

    try {
      const llmService = createLLMService();
      console.log(`[API] Generating cloze cards...`);
      const cards = await llmService.generateClozeCards(body.points);
      console.log(`[API] Successfully generated ${cards.length} cards`);

      return NextResponse.json({ cards }, { status: 200 });
    } catch (error) {
      console.error(`[API] ERROR in card generation:`, error);
      return NextResponse.json(
        {
          error: `Card generation error: ${
            error instanceof Error ? error.message : String(error)
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(`[API] UNEXPECTED ERROR:`, error);
    return NextResponse.json(
      {
        error: `Error processing request: ${
          error instanceof Error ? error.message : String(error)
        }`,
      },
      { status: 500 }
    );
  }
}
