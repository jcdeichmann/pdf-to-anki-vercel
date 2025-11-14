"use client";

/**
 * PDF Processor - Client-side PDF text extraction
 */

import * as pdfjsLib from "pdfjs-dist";

// Set up the worker - use the official PDF.js CDN with matching version
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export class PDFProcessor {
  static async extractText(pdfFile: File | Blob): Promise<string> {
    console.log(
      `[PDF_PROCESSOR] Starting PDF extraction from ${pdfFile.size} bytes`
    );

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      const totalPages = pdf.numPages;
      console.log(`[PDF_PROCESSOR] Found ${totalPages} pages in PDF`);

      const extractedText: string[] = [];

      for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");

        console.log(
          `[PDF_PROCESSOR] Page ${pageNum}: extracted ${pageText.length} characters`
        );

        if (pageText.trim()) {
          extractedText.push(`--- Page ${pageNum} ---\n${pageText}`);
        }
      }

      const fullText = extractedText.join("\n\n");
      console.log(`[PDF_PROCESSOR] Total extracted text: ${fullText.length} characters`);

      return fullText;
    } catch (error) {
      console.error("[PDF_PROCESSOR] ERROR:", error);
      throw new Error(
        `Failed to extract text from PDF: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}
