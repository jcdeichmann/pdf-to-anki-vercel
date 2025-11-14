/**
 * API Route: /api/extract-points
 * Extracts high-yield points from PDF text using LLM
 */

import { NextRequest, NextResponse } from "next/server";
import { createLLMService } from "@/lib/llm-service";
import { ExtractPointsRequest } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body: ExtractPointsRequest = await request.json();

    if (!body.pdfText) {
      return NextResponse.json(
        { error: "PDF text is required" },
        { status: 400 }
      );
    }

    console.log(`[API] /api/extract-points - Received PDF text of ${body.pdfText.length} characters`);

    // Initialize LLM service
    try {
      const llmService = createLLMService();
      console.log(`[API] Extracting high-yield points...`);
      const points = await llmService.extractHighYieldPoints(body.pdfText);
      console.log(`[API] Successfully extracted ${points.length} points`);

      return NextResponse.json({ points }, { status: 200 });
    } catch (error) {
      console.error(`[API] ERROR in LLM processing:`, error);
      return NextResponse.json(
        {
          error: `LLM processing error: ${
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
