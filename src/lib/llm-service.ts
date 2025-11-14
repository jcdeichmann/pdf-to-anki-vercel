/**
 * LLM Service - Handles OpenRouter API integration
 */

import { HighYieldPoint, ClozeCard } from "./types";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "openai/gpt-4.1-mini";

export class LLMService {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "OpenRouter API key not provided. Set OPENROUTER_API_KEY environment variable."
      );
    }
    this.apiKey = apiKey;
  }

  private async makeRequest(
    prompt: string,
    systemPrompt: string = ""
  ): Promise<string> {
    console.log(`[LLM_SERVICE] makeRequest: API Key length=${this.apiKey?.length}, starts with=${this.apiKey?.substring(0, 10)}`);
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://pdf-to-anki.vercel.app",
      "X-Title": "PDF-to-ANKI",
    };
    console.log(`[LLM_SERVICE] Authorization header: Bearer ${this.apiKey?.substring(0, 15)}...`);

    const messages: any[] = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const payload = {
      model: MODEL,
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    try {
      console.log(`[LLM_SERVICE] Sending request to ${MODEL}`);
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: response.statusText,
        }));
        throw new Error(
          `OpenRouter API error: ${response.status} - ${JSON.stringify(
            errorData
          )}`
        );
      }

      const responseJson = await response.json();
      const content = responseJson.choices?.[0]?.message?.content || "";

      if (!content) {
        throw new Error("Empty response from LLM");
      }

      console.log(`[LLM_SERVICE] Received response: ${content.length} chars`);
      return content;
    } catch (error) {
      console.error("[LLM_SERVICE] Request error:", error);
      throw error;
    }
  }

  async extractHighYieldPoints(text: string): Promise<HighYieldPoint[]> {
    console.log(
      `[LLM_SERVICE] Starting fact extraction. Text length: ${text.length}`
    );

    const systemPrompt = `You are an expert educator. Your task is to identify and extract the 15 most important facts from the provided text that students must learn.
Focus on facts that are testable, memorable, and have clear learning value.`;

    const prompt = `Extract the TOP 15 MOST IMPORTANT FACTS from this text.

Requirements for each fact:
- Concise (1-2 sentences maximum)
- Standalone and testable
- Core to understanding the material
- Clear and specific

OUTPUT FORMAT: Return a numbered list with ONLY the facts. No explanations, titles, or other text.

Example format:
1. Fact one here
2. Fact two here
3. Fact three here

TEXT:
${text}`;

    console.log(`[LLM_SERVICE] Sending request to ${MODEL}`);
    const response = await this.makeRequest(prompt, systemPrompt);
    console.log(`[LLM_SERVICE] Received response: ${response.length} characters`);

    // Parse the response into structured format
    const points: HighYieldPoint[] = [];
    const lines = response.split("\n");
    console.log(`[LLM_SERVICE] Response has ${lines.length} lines`);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        // Remove numbering if present
        const cleaned = line.replace(/^\d+[\.\)\-\s]+/, "").trim();
        if (cleaned && cleaned.length > 5) {
          points.push({ id: String(i), point: cleaned });
          console.log(`[LLM_SERVICE] Fact ${points.length}: ${cleaned.slice(0, 80)}...`);
        }
      }
    }

    console.log(`[LLM_SERVICE] Extracted ${points.length} facts total`);
    return points.slice(0, 15); // Ensure max 15
  }

  async generateClozeCards(points: HighYieldPoint[]): Promise<ClozeCard[]> {
    console.log(`[LLM_SERVICE] Starting card generation for ${points.length} points`);

    const systemPrompt = `You are an expert at creating high-quality Anki cloze deletion flashcards.
Anki cloze format uses {{c1::answer}}, {{c2::answer}}, etc. to mark deletions.
Each card should test ONE key concept with a natural-sounding front and clear explanation on back.`;

    const pointsText = points
      .map((p, i) => `${i + 1}. ${p.point}`)
      .join("\n");

    const prompt = `Convert each fact into an Anki cloze deletion flashcard.

Return ONLY a JSON array with no other text. Each object should have:
- "front": A complete sentence with {{{{c1::key_term}}}} cloze markers
- "back": Brief explanation of the answer

Example JSON format:
[
  {{"front": "The capital of France is {{{{c1::Paris}}}}", "back": "Paris is the capital and largest city of France."}},
  {{"front": "The speed of light is approximately {{{{c1::299,792,458}}}} meters per second.", "back": "This is denoted by the symbol c in physics equations."}}
]

Facts to convert:
${pointsText}

Requirements:
- Each card tests ONE concept
- Use Anki format: {{{{c1::text}}}} (double braces)
- Front reads naturally with blanks
- Back explains and reinforces the answer
- Keep explanations concise
- Return ONLY the JSON array, no other text`;

    const response = await this.makeRequest(prompt, systemPrompt);

    // Parse JSON response into cards
    const cards: ClozeCard[] = [];
    try {
      // Extract JSON from response (in case there's extra text)
      const jsonStart = response.indexOf("[");
      const jsonEnd = response.lastIndexOf("]") + 1;

      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = response.substring(jsonStart, jsonEnd);
        const cardData = JSON.parse(jsonStr);

        for (let i = 0; i < cardData.length; i++) {
          const item = cardData[i];
          if (item.front && item.back) {
            cards.push({
              id: String(i),
              front: item.front,
              back: item.back,
              explanation: item.back,
            });
          }
        }
      }
    } catch (error) {
      console.error("[LLM_SERVICE] Error parsing JSON response:", error);
      console.error(`[LLM_SERVICE] Response was: ${response.substring(0, 500)}`);
    }

    console.log(`[LLM_SERVICE] Parsed ${cards.length} cloze cards`);
    return cards;
  }
}

export function createLLMService(): LLMService {
  const apiKey = process.env.OPENROUTER_API_KEY;
  console.log(`[LLM_SERVICE] createLLMService called. API Key exists: ${!!apiKey}`);
  if (!apiKey) {
    console.error(`[LLM_SERVICE] OPENROUTER_API_KEY not found in environment variables`);
    console.error(`[LLM_SERVICE] Available env vars: ${Object.keys(process.env).filter(k => k.includes('OPENROUTER') || k.includes('API')).join(', ')}`);
    throw new Error(
      "OPENROUTER_API_KEY environment variable is not set"
    );
  }
  console.log(`[LLM_SERVICE] API Key found, length: ${apiKey.length}`);
  return new LLMService(apiKey);
}
