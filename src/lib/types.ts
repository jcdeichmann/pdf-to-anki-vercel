/**
 * TypeScript types and interfaces for PDF to ANKI application
 */

export interface HighYieldPoint {
  id: string;
  point: string;
}

export interface ClozeCard {
  id: string;
  front: string;
  back: string;
  explanation: string;
}

export interface WorkflowState {
  currentStep: 0 | 1 | 2 | 3; // 0: upload, 1: review points, 2: review cards, 3: download
  sessionId: string | null;
  filename: string | null;
  rawText: string | null;
  highYieldPoints: HighYieldPoint[];
  clozeCards: ClozeCard[];
  loading: boolean;
  error: string | null;
}

export interface ExtractPointsResponse {
  points: HighYieldPoint[];
  rawText: string;
}

export interface GenerateCardsResponse {
  cards: ClozeCard[];
}

export interface GenerateAnkiResponse {
  status: string;
  message: string;
  success: boolean;
}

// API request/response types
export interface ExtractPointsRequest {
  pdfText: string;
}

export interface GenerateCardsRequest {
  points: HighYieldPoint[];
}

export interface GenerateAnkiRequest {
  cards: ClozeCard[];
  deckName?: string;
}
