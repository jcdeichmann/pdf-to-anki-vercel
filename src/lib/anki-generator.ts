/**
 * ANKI Generator - Generates .apkg (ANKI deck) files
 */

import { ClozeCard } from "./types";
import AdmZip from "adm-zip";

interface AnkiNote {
  id: number;
  guid: string;
  mid: number;
  mod: number;
  usn: number;
  tags: string;
  flds: string;
  sfld: string;
  csum: number;
  flags: number;
  data: string;
  odue: number;
  odid: number;
  did: number;
  omod: number;
  type: number;
  queue: number;
  left: number;
}

export class AnkiGenerator {
  private deckId: number;
  private modelId: number;
  private deckName: string;

  constructor(deckName: string = "PDF Study Deck") {
    this.deckName = deckName;
    this.deckId = 1684567890;
    this.modelId = 1684567891;
  }

  validateCards(cards: ClozeCard[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!cards || cards.length === 0) {
      errors.push("No cards provided");
      return { valid: false, errors };
    }

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      // Check for cloze markers
      const hasCloze =
        card.front.includes("{{c") ||
        card.front.includes("{c");
      if (!card.front || !hasCloze) {
        errors.push(
          `Card ${i + 1}: Missing cloze deletion marker ({{c1::text}} format)`
        );
      }

      if (!card.back || card.back.trim() === "") {
        errors.push(`Card ${i + 1}: Missing explanation/answer`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async generateDeck(cards: ClozeCard[]): Promise<Blob> {
    console.log(`[ANKI_GENERATOR] Starting ANKI deck generation for ${cards.length} cards`);

    // Validate cards
    const validation = this.validateCards(cards);
    if (!validation.valid) {
      throw new Error(`Card validation failed: ${validation.errors.join(", ")}`);
    }

    const zip = new AdmZip();
    const now = Math.floor(Date.now() / 1000);

    // Create collection data (deck.json)
    const deckData = {
      1: {
        id: this.deckId,
        mod: now,
        name: this.deckName,
        usn: -1,
        lrnToday: [0, 0],
        revToday: [0, 0],
        newToday: [0, 0],
        timeToday: [0, 0],
        collapsed: false,
        browserCollapsed: false,
        lastSaved: now,
        desc: "PDF to ANKI generated deck",
        dyn: false,
        conf: 1,
        extendNew: 0,
        extendRev: 0,
      },
    };

    // Create model data
    const modelData = {
      1: {
        id: this.modelId,
        name: "Cloze with Explanation",
        type: 1,
        did: this.deckId,
        mod: now,
        usn: -1,
        sortf: 0,
        latexPre:
          "\\documentclass[12pt]{article}\\usepackage[utf-8]{inputenc}\\usepackage{amssymb}\\pagestyle{empty}\\geometry{margin=1cm}\\usepackage{geometry}\\begin{document}",
        latexPost: "\\end{document}",
        latexsvg: false,
        req: [[0, "any", [0]]],
        flds: [
          { name: "Text", ord: 0, sticky: false, rtl: false, font: "Arial", media: [], size: 20 },
          { name: "Extra", ord: 1, sticky: false, rtl: false, font: "Arial", media: [], size: 20 },
        ],
        tmpls: [
          {
            name: "Cloze",
            ord: 0,
            qfmt: "{{cloze:Text}}",
            afmt:
              '{{cloze:Text}}<br><br><div class="extra">{{Extra}}</div>',
            did: null,
            bafmt: "",
            bqfmt: "",
          },
        ],
        css: `
.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
}
.extra {
  margin-top: 1.5em;
  font-size: 14px;
  color: #333;
  text-align: left;
  background-color: #f5f5f5;
  padding: 0.5em;
  border-radius: 4px;
}
.cloze {
  font-weight: bold;
  color: blue;
}
`,
      },
    };

    // Create notes
    const notes: AnkiNote[] = [];
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const noteId = this.deckId + i + 1;
      const guid = `pdf-anki-${noteId}`;

      const note: AnkiNote = {
        id: noteId,
        guid: guid,
        mid: this.modelId,
        mod: now,
        usn: -1,
        tags: "pdf-to-anki",
        flds: `${card.front}\x1f${card.back}`, // \x1f is field separator
        sfld: card.front,
        csum: 0,
        flags: 0,
        data: "",
        odue: 0,
        odid: 0,
        did: this.deckId,
        omod: 0,
        type: 0,
        queue: 0,
        left: 0,
      };

      notes.push(note);
    }

    // Create collection.json
    const collectionData = {
      decks: deckData,
      dconf: {
        1: {
          name: "Default",
          new: {
            delays: [1, 10],
            ints: [1, 4, 7],
            initialFactor: 2500,
            separate: true,
          },
          lapse: {
            delays: [10],
            mult: 0.5,
            minInt: 1,
            leechFails: 8,
          },
          rev: {
            perDay: 200,
            ease4: 1.3,
            mult: 1,
            hardPenalty: 1.2,
          },
          timer: 0,
          autoplay: true,
          replayq: true,
          mod: now,
          id: 1,
          usn: 0,
        },
      },
      models: modelData,
      col: [now, 0, 0, 11, ""],
    };

    // Add media manifest (empty)
    const mediaData = {};

    // Add files to zip
    zip.addFile("collection.json", Buffer.from(JSON.stringify(collectionData)), "");
    zip.addFile("media", Buffer.from(JSON.stringify(mediaData)), "");

    // Create a minimal notes.json for reference (ANKI uses SQLite in production, but we'll create JSON)
    zip.addFile(
      "notes.json",
      Buffer.from(JSON.stringify({ notes })),
      ""
    );

    console.log(`[ANKI_GENERATOR] Created deck with ${notes.length} notes`);

    // Convert to blob
    const zipBuffer = zip.toBuffer();
    return new Blob([new Uint8Array(zipBuffer)], { type: "application/octet-stream" });
  }
}

export async function generateAnkiPackage(
  cards: ClozeCard[],
  deckName: string = "PDF Study Deck"
): Promise<Blob> {
  const generator = new AnkiGenerator(deckName);
  return await generator.generateDeck(cards);
}
