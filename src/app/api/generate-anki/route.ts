/**
 * API Route: /api/generate-anki
 * Generates ANKI package (.apkg) file from cloze cards
 */

import { NextRequest, NextResponse } from "next/server";
import { generateAnkiPackage } from "@/lib/anki-generator";
import { GenerateAnkiRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAnkiRequest = await request.json();

    if (!body.cards || body.cards.length === 0) {
      return NextResponse.json(
        { error: "Cards are required" },
        { status: 400 }
      );
    }

    const deckName = body.deckName || "PDF Study Deck";
    console.log(`[API] /api/generate-anki - Generating ANKI package for ${body.cards.length} cards`);

    try {
      console.log(`[API] Creating ANKI deck...`);
      const ankiBlob = await generateAnkiPackage(body.cards, deckName);
      console.log(`[API] ANKI deck generated successfully`);

      // Return the .apkg file
      return new NextResponse(ankiBlob, {
        status: 200,
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": 'attachment; filename="study_deck.apkg"',
        },
      });
    } catch (error) {
      console.error(`[API] ERROR generating ANKI deck:`, error);
      return NextResponse.json(
        {
          error: `ANKI generation error: ${
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
