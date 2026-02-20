import type {
  ChatMessage,
  FieldUpdate,
  IntakeFormState,
  ParsedDocument,
  CoverageAnalysis,
  GeneratedReport,
  AIModel,
} from '@/types';
import { mockSendChatMessage, mockProcessDocuments, mockGenerateReport } from './mock-client';
import { parseFieldUpdates } from './field-update-parser';

// ============================================================
// Client Configuration
// ============================================================

export interface ClientConfig {
  selectedModel: AIModel;
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
  fieldUpdates: FieldUpdate[];
  prefillNotes: string[];
}

interface IntakeChatPayload {
  message: string;
  conversationHistory: ChatMessage[];
  formState: IntakeFormState;
  unfilledFields: string[];
  model?: AIModel;
}

interface ProcessDocumentsPayload {
  files: {
    filename: string;
    mimeType: string;
    contentBase64: string;
  }[];
  model?: AIModel;
}

interface GenerateReportPayload {
  intakeData: IntakeFormState;
  parsedDocuments: ParsedDocument[];
  bankName: string;
  model?: AIModel;
}

interface RawChatApiResponse {
  aiReply?: unknown;
  fieldUpdates?: unknown;
}

interface RawProcessDocumentsApiResponse {
  documents?: unknown;
  overallCoverage?: unknown;
  gaps?: unknown;
  fieldUpdates?: unknown;
  prefillNotes?: unknown;
}

function getAiConfigPayload(config: ClientConfig): {
  model?: AIModel;
} {
  const payload: { model?: AIModel } = {
    model: config.selectedModel,
  };

  return payload;
}

function sanitizeFieldUpdates(raw: unknown): FieldUpdate[] {
  if (!Array.isArray(raw)) return [];

  const updates: FieldUpdate[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;

    const record = entry as Record<string, unknown>;
    if (typeof record.section !== 'string' || typeof record.field !== 'string') continue;

    const action: NonNullable<FieldUpdate['action']> =
      record.action === 'set' || record.action === 'add_row' || record.action === 'remove_row'
        ? record.action
        : 'set';

    updates.push({
      section: record.section,
      field: record.field,
      value: record.value as FieldUpdate['value'],
      action,
    });
  }

  return updates;
}

export function normalizeChatApiResponse(data: RawChatApiResponse): ChatResponse {
  if (typeof data.aiReply === 'string') {
    const responseFieldUpdates = sanitizeFieldUpdates(data.fieldUpdates);
    const parsed = parseFieldUpdates(data.aiReply);
    return {
      aiReply: parsed.cleanReply,
      fieldUpdates: [...responseFieldUpdates, ...parsed.fieldUpdates],
    };
  }

  throw new Error('Invalid intake-chat response: expected { aiReply, fieldUpdates[] }');
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

export function buildIntakeChatPayload(
  config: ClientConfig,
  message: string,
  conversationHistory: ChatMessage[],
  formState: IntakeFormState,
): IntakeChatPayload {
  return {
    message,
    conversationHistory,
    formState,
    unfilledFields: getUnfilledFields(formState),
    ...getAiConfigPayload(config),
  };
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

export async function buildProcessDocumentsPayload(
  config: ClientConfig,
  files: File[],
): Promise<ProcessDocumentsPayload> {
  const encodedFiles = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      contentBase64: await fileToBase64(file),
    })),
  );

  return {
    files: encodedFiles,
    ...getAiConfigPayload(config),
  };
}

export function buildGenerateReportPayload(
  config: ClientConfig,
  intakeData: IntakeFormState,
  parsedDocuments: ParsedDocument[],
  bankName: string,
): GenerateReportPayload {
  return {
    intakeData,
    parsedDocuments,
    bankName,
    ...getAiConfigPayload(config),
  };
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
    return mockSendChatMessage(message, conversationHistory);
  }
  const payload = buildIntakeChatPayload(config, message, conversationHistory, formState);

  const response = await fetch('/api/intake-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.status} ${response.statusText}`);
  }

  const data: RawChatApiResponse = await response.json();
  return normalizeChatApiResponse(data);
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
  const payload = await buildProcessDocumentsPayload(config, files);

  const response = await fetch('/api/process-docs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Document processing failed: ${response.status} ${response.statusText}`);
  }

  const data: RawProcessDocumentsApiResponse = await response.json();

  const prefillNotes = Array.isArray(data.prefillNotes)
    ? data.prefillNotes.filter((entry): entry is string => typeof entry === 'string')
    : [];
  const overallCoverage =
    data.overallCoverage && typeof data.overallCoverage === 'object'
      ? (data.overallCoverage as CoverageAnalysis['overallCoverage'])
      : ({} as CoverageAnalysis['overallCoverage']);

  return {
    documents: Array.isArray(data.documents) ? data.documents : [],
    overallCoverage,
    gaps: Array.isArray(data.gaps) ? data.gaps : [],
    fieldUpdates: sanitizeFieldUpdates(data.fieldUpdates),
    prefillNotes,
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
  const payload = buildGenerateReportPayload(config, intakeData, parsedDocuments, bankName);

  const response = await fetch('/api/generate-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Report generation failed: ${response.status} ${response.statusText}`);
  }

  const data: GeneratedReport = await response.json();

  return data;
}
