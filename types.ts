export enum Tab {
  DASHBOARD = 'DASHBOARD',
  UPLOAD = 'UPLOAD',
  ANALYSIS = 'ANALYSIS',
  CHAT = 'CHAT',
  LIVE = 'LIVE',
}

export interface FinancialData {
  category: string;
  partyAAmount: number;
  partyBAmount: number;
  discrepancy: number;
  notes: string;
}

export interface AnalysisReport {
  summary: string;
  standardOfLivingAssessment: string;
  californiaCodeReferences: string[];
  chartData: FinancialData[];
  lifestyleMetaphorPrompt?: string; // For image generation
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
}