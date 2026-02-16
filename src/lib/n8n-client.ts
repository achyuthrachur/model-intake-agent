import type {
  ChatMessage,
  FieldUpdate,
  IntakeFormState,
  ParsedDocument,
  CoverageAnalysis,
  GeneratedReport,
} from '@/types';
import { mockSendChatMessage, mockProcessDocuments, mockGenerateReport } from './mock-client';
import { parseFieldUpdates } from './field-update-parser';

// ============================================================
// Client Configuration
// ============================================================

interface ClientConfig {
  n8nBaseUrl: string;
  openaiApiKey: string;
  selectedModel: string;
  useMockData: boolean;
}

// ============================================================
// Chat Response Type
// ============================================================

interface ChatResponse {
  aiReply: string;
  fieldUpdates: FieldUpdate[];
}

// ============================================================
// Document Processing Response Type
// ============================================================

interface DocumentProcessingResponse {
  documents: ParsedDocument[];
  overallCoverage: CoverageAnalysis['overallCoverage'];
  gaps: string[];
}

// ============================================================
// Helper: Get Unfilled Fields
// ============================================================

export function getUnfilledFields(formState: IntakeFormState): string[] {
  const unfilled: string[] = [];

  for (const [sectionKey, sectionValue] of Object.entries(formState)) {
    if (typeof sectionValue !== 'object' || sectionValue === null) {
      continue;
    }

    for (const [fieldKey, fieldValue] of Object.entries(sectionValue as Record<string, unknown>)) {
      const path = `${sectionKey}.${fieldKey}`;

      if (fieldValue === undefined || fieldValue === null) {
        unfilled.push(path);
      } else if (typeof fieldValue === 'string' && fieldValue.trim() === '') {
        unfilled.push(path);
      } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
        unfilled.push(path);
      }
    }
  }

  return unfilled;
}

// ============================================================
// Helper: File to Base64
// ============================================================

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]); // Strip data:xxx;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ============================================================
// 1. Send Chat Message
// ============================================================

export async function sendChatMessage(
  config: ClientConfig,
  message: string,
  conversationHistory: ChatMessage[],
  formState: IntakeFormState,
): Promise<ChatResponse> {
  if (config.useMockData) {
    return mockSendChatMessage(message, conversationHistory, formState);
  }

  const unfilledFields = getUnfilledFields(formState);

  const response = await fetch(`${config.n8nBaseUrl}/webhook/intake-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory,
      formState,
      unfilledFields,
    }),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const rawReply: string = data.reply || data.response || data.message || '';
  const { cleanReply, fieldUpdates } = parseFieldUpdates(rawReply);

  return {
    aiReply: cleanReply,
    fieldUpdates,
  };
}

// ============================================================
// 2. Process Documents
// ============================================================

export async function processDocuments(
  config: ClientConfig,
  files: File[],
): Promise<DocumentProcessingResponse> {
  if (config.useMockData) {
    return mockProcessDocuments(files);
  }

  const encodedFiles = await Promise.all(
    files.map(async (file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
      content: await fileToBase64(file),
    })),
  );

  const response = await fetch(`${config.n8nBaseUrl}/webhook/process-docs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ files: encodedFiles }),
  });

  if (!response.ok) {
    throw new Error(`Document processing failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  return {
    documents: data.documents,
    overallCoverage: data.overallCoverage,
    gaps: data.gaps,
  };
}

// ============================================================
// 3. Generate Report
// ============================================================

export async function generateReport(
  config: ClientConfig,
  intakeData: IntakeFormState,
  parsedDocuments: ParsedDocument[],
  bankName: string,
): Promise<GeneratedReport> {
  if (config.useMockData) {
    return mockGenerateReport(intakeData, parsedDocuments, bankName);
  }

  const response = await fetch(`${config.n8nBaseUrl}/webhook/generate-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intakeData,
      parsedDocuments,
      bankName,
    }),
  });

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.status} ${response.statusText}`);
  }

  const data: GeneratedReport = await response.json();

  return data;
}
