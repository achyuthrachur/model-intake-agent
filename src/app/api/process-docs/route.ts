import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { TEMPLATE_SECTIONS } from '@/data/template-structure';
import { INTAKE_SCHEMA } from '@/lib/intake-schema';
import type {
  AIModel,
  CoverageAnalysis,
  CoverageEntry,
  FieldUpdate,
  ParsedDocument,
  PrefillDiagnostics,
  PrefillDiagnosticsPass,
} from '@/types';

export const runtime = 'nodejs';

interface ProcessDocumentsPayload {
  files: {
    filename: string;
    mimeType: string;
    contentBase64: string;
  }[];
  model?: AIModel;
}

type Confidence = 'high' | 'medium' | 'low';
type CoverageStatus = 'covered' | 'partial' | 'gap';

interface ClassifiedCoverageEntry {
  status: CoverageStatus;
  confidence: Confidence;
  summary: string;
}

interface ClassifiedDocument {
  documentSummary: string;
  coverage: Record<string, ClassifiedCoverageEntry>;
}

interface FieldCatalogEntry {
  section: string;
  field: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'multi-select' | 'table';
  options: string[];
  tableColumns: string[];
  aiHint: string;
}

interface PrefillSourceDocument {
  filename: string;
  documentSummary: string;
  excerpt: string;
}

interface PrefillExtractionPassResult {
  rawFieldUpdates: unknown[];
  notes: string[];
}

interface PrefillExtractionBatchResult extends PrefillExtractionPassResult {
  passDiagnostics: PrefillDiagnosticsPass;
}

interface PrefillExtractionResult {
  fieldUpdates: FieldUpdate[];
  notes: string[];
  diagnostics: PrefillDiagnostics;
}

const SECTION_KEY_TO_API_SECTION: Record<string, string> = {
  modelSummary: 'model_summary',
  executiveSummary: 'executive_summary',
  modelDesign: 'model_design',
  developmentData: 'development_data',
  outputUse: 'output_use',
  implementation: 'implementation',
  performance: 'performance',
  governance: 'governance',
};

function camelToSnake(value: string): string {
  return value.replace(/[A-Z]/g, (ch) => `_${ch.toLowerCase()}`);
}

const FIELD_CATALOG: FieldCatalogEntry[] = INTAKE_SCHEMA.flatMap((section) => {
  const sectionName = SECTION_KEY_TO_API_SECTION[section.id] ?? section.id;
  return section.fields.map((field) => ({
    section: sectionName,
    field: camelToSnake(field.name),
    label: field.label,
    type: field.type,
    options: field.options ?? [],
    tableColumns: field.tableColumns?.map((column) => column.key) ?? [],
    aiHint: field.aiHint ?? '',
  }));
});

const FIELD_CATALOG_INDEX: Map<string, FieldCatalogEntry> = new Map(
  FIELD_CATALOG.map((entry) => [`${entry.section}.${entry.field}`, entry] as const),
);

const PREFILL_SECTION_ORDER = INTAKE_SCHEMA.map(
  (section) => SECTION_KEY_TO_API_SECTION[section.id] ?? section.id,
);

const PREFILL_SECTION_HINTS: Record<string, string[]> = {
  model_summary: [
    'overview',
    'purpose',
    'prepared by',
    'document control',
    'model owner',
    'risk',
    'validation',
  ],
  executive_summary: [
    'business',
    'regulatory',
    'reporting',
    'use',
    'products',
    'drivers',
    'output',
    'assumptions',
    'limitations',
  ],
  model_design: [
    'conceptual framework',
    'architecture',
    'segmentation',
    'pd',
    'lgd',
    'ead',
    'calibration',
    'benchmarking',
    'methodology',
  ],
  development_data: [
    'data requirements',
    'etl',
    'source systems',
    'data dictionary',
    'mapping',
    'quality controls',
    'reconciliation',
  ],
  output_use: [
    'back-testing',
    'sensitivity',
    'benchmarking',
    'parallel run',
    'monitoring',
    'threshold',
    'tuning',
  ],
  implementation: [
    'implementation',
    'production',
    'runbook',
    'system',
    'testing',
    'access controls',
    'security',
    'change management',
    'operating procedures',
  ],
  performance: [
    'adjustments',
    'overlays',
    'reporting metrics',
    'reporting frequency',
    'monitoring cadence',
  ],
  governance: [
    'governance',
    'roles',
    'raci',
    'contingency',
    'business continuity',
    'disaster recovery',
    'references',
  ],
};

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function sanitizeFiles(input: unknown): ProcessDocumentsPayload['files'] {
  if (!Array.isArray(input)) return [];

  return input
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const file = entry as Record<string, unknown>;
      const filename = typeof file.filename === 'string' ? file.filename : '';
      const mimeType =
        typeof file.mimeType === 'string' ? file.mimeType : 'application/octet-stream';
      const contentBase64 = typeof file.contentBase64 === 'string' ? file.contentBase64 : '';
      if (!filename || !contentBase64) return null;
      return { filename, mimeType, contentBase64 };
    })
    .filter((entry): entry is ProcessDocumentsPayload['files'][number] => entry !== null);
}

async function extractTextFromFile(file: ProcessDocumentsPayload['files'][number]): Promise<string> {
  const buffer = Buffer.from(file.contentBase64, 'base64');
  const lowerName = file.filename.toLowerCase();

  if (file.mimeType === 'application/pdf' || lowerName.endsWith('.pdf')) {
    const parsed = await pdf(buffer);
    return parsed.text || '';
  }

  if (
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lowerName.endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || '';
    } catch (error) {
      console.error(`DOCX extraction failed for ${file.filename}`, error);
      return buffer.toString('utf8');
    }
  }

  if (file.mimeType.startsWith('text/') || lowerName.endsWith('.txt')) {
    return buffer.toString('utf8');
  }

  return buffer.toString('utf8');
}

function normalizeConfidence(raw: unknown): Confidence {
  return raw === 'high' || raw === 'medium' || raw === 'low' ? raw : 'low';
}

function normalizeCoverageStatus(raw: unknown): CoverageStatus {
  return raw === 'covered' || raw === 'partial' || raw === 'gap' ? raw : 'gap';
}

function getConfidenceRank(value: Confidence): number {
  if (value === 'high') return 3;
  if (value === 'medium') return 2;
  return 1;
}

function normalizeSelectValue(raw: unknown, options: string[]): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (options.length === 0) return trimmed;

  const normalized = trimmed.toLowerCase();
  const exact = options.find((option) => option.toLowerCase() === normalized);
  if (exact) return exact;

  const compact = normalized.replace(/[^a-z0-9]/g, '');
  const compactMatch = options.find(
    (option) => option.toLowerCase().replace(/[^a-z0-9]/g, '') === compact,
  );
  return compactMatch ?? null;
}

function normalizeDateValue(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (isoMatch) return isoMatch[0];

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

function sanitizeExtractionNotes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function sanitizeExtractedFieldUpdates(raw: unknown): FieldUpdate[] {
  if (!Array.isArray(raw)) return [];

  const updates: FieldUpdate[] = [];
  const seenScalarKeys = new Set<string>();
  const seenTableRows = new Set<string>();
  let tableRowCounter = 0;

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue;
    const record = entry as Record<string, unknown>;
    if (typeof record.section !== 'string' || typeof record.field !== 'string') continue;

    const section = record.section.trim();
    const field = record.field.trim();
    if (!section || !field) continue;

    const key = `${section}.${field}`;
    const catalog = FIELD_CATALOG_INDEX.get(key);
    if (!catalog) continue;

    if (catalog.type === 'table') {
      if (record.action !== 'add_row') continue;
      if (!record.value || typeof record.value !== 'object') continue;

      const value = record.value as Record<string, unknown>;
      const row: Record<string, string> = {
        id: `doc_row_${Date.now()}_${tableRowCounter + 1}`,
      };

      for (const column of catalog.tableColumns) {
        const rawColumnValue = value[column];
        row[column] = typeof rawColumnValue === 'string' ? rawColumnValue.trim() : '';
      }

      const hasContent = catalog.tableColumns.some((column) => (row[column] ?? '').length > 0);
      if (!hasContent) continue;

      const dedupeSignature = `${key}|${catalog.tableColumns
        .map((column) => (row[column] ?? '').toLowerCase())
        .join('|')}`;
      if (seenTableRows.has(dedupeSignature)) continue;
      seenTableRows.add(dedupeSignature);

      updates.push({
        section,
        field,
        action: 'add_row',
        value: row,
      });
      tableRowCounter += 1;
      continue;
    }

    if (seenScalarKeys.has(key)) continue;

    if (catalog.type === 'multi-select') {
      const rawValues = Array.isArray(record.value)
        ? record.value
        : typeof record.value === 'string'
          ? record.value.split(/[,;|]/)
          : [];

      const normalizedValues = rawValues
        .map((value) => normalizeSelectValue(value, catalog.options))
        .filter((value): value is string => value !== null);
      const deduped = [...new Set(normalizedValues)];
      if (deduped.length === 0) continue;

      updates.push({
        section,
        field,
        action: 'set',
        value: deduped,
      });
      seenScalarKeys.add(key);
      continue;
    }

    if (catalog.type === 'date') {
      const normalized = normalizeDateValue(record.value);
      if (!normalized) continue;

      updates.push({
        section,
        field,
        action: 'set',
        value: normalized,
      });
      seenScalarKeys.add(key);
      continue;
    }

    if (catalog.type === 'select') {
      const normalized = normalizeSelectValue(record.value, catalog.options);
      if (!normalized) continue;

      updates.push({
        section,
        field,
        action: 'set',
        value: normalized,
      });
      seenScalarKeys.add(key);
      continue;
    }

    if (typeof record.value !== 'string') continue;
    const textValue = record.value.trim();
    if (!textValue) continue;

    updates.push({
      section,
      field,
      action: 'set',
      value: textValue,
    });
    seenScalarKeys.add(key);
  }

  return updates.slice(0, 120);
}

function createEmptyPrefillDiagnostics(): PrefillDiagnostics {
  return {
    requestedFields: FIELD_CATALOG.length,
    extractedUpdates: 0,
    scalarFieldsFilled: 0,
    tableRowsAdded: 0,
    passes: [],
  };
}

function sanitizeRawFieldUpdateEntries(raw: unknown): unknown[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((entry) => entry && typeof entry === 'object');
}

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  if (chunkSize <= 0) return [items];

  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += chunkSize) {
    chunks.push(items.slice(index, index + chunkSize));
  }
  return chunks;
}

function scoreDocumentForSection(section: string, document: PrefillSourceDocument): number {
  const hints = PREFILL_SECTION_HINTS[section] ?? [];
  if (hints.length === 0) return 0;

  const filename = document.filename.toLowerCase();
  const haystack = `${filename}\n${document.documentSummary}\n${document.excerpt}`.toLowerCase();
  let score = 0;

  for (const hint of hints) {
    const normalizedHint = hint.toLowerCase();
    if (!haystack.includes(normalizedHint)) continue;
    score += filename.includes(normalizedHint) ? 3 : 1;
  }

  return score;
}

function selectDocumentsForSection(
  section: string,
  documents: PrefillSourceDocument[],
): PrefillSourceDocument[] {
  if (documents.length <= 2) {
    return documents;
  }

  const scored = documents.map((document) => ({
    document,
    score: scoreDocumentForSection(section, document),
  }));

  const highSignal = scored
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.document.excerpt.length - a.document.excerpt.length)
    .map((entry) => entry.document);

  if (highSignal.length >= 2) {
    return highSignal.slice(0, Math.min(highSignal.length, 4));
  }

  return scored
    .sort((a, b) => b.score - a.score || b.document.excerpt.length - a.document.excerpt.length)
    .map((entry) => entry.document)
    .slice(0, Math.min(documents.length, 3));
}

function selectRemainingCatalog(
  catalog: FieldCatalogEntry[],
  updates: FieldUpdate[],
): FieldCatalogEntry[] {
  const scalarKeys = new Set<string>();
  const tableKeys = new Set<string>();

  for (const update of updates) {
    const key = `${update.section}.${update.field}`;
    if (update.action === 'add_row') {
      tableKeys.add(key);
      continue;
    }
    scalarKeys.add(key);
  }

  return catalog.filter((entry) => {
    const key = `${entry.section}.${entry.field}`;
    return entry.type === 'table' ? !tableKeys.has(key) : !scalarKeys.has(key);
  });
}

async function runPrefillExtractionPass(
  client: OpenAI,
  model: AIModel,
  pass: string,
  fieldCatalog: FieldCatalogEntry[],
  documents: PrefillSourceDocument[],
): Promise<PrefillExtractionBatchResult> {
  const emptyPass: PrefillDiagnosticsPass = {
    pass,
    requestedFields: fieldCatalog.length,
    extractedUpdates: 0,
    noteCount: 0,
    docCount: documents.length,
  };

  if (fieldCatalog.length === 0 || documents.length === 0) {
    return {
      rawFieldUpdates: [],
      notes: [],
      passDiagnostics: emptyPass,
    };
  }

  const prompt = [
    'You extract intake-form field updates from banking model documentation.',
    `Current extraction pass: ${pass}`,
    'Return strict JSON only with this shape:',
    '{',
    '  "fieldUpdates": [',
    '    { "section": "model_summary", "field": "model_type", "action": "set", "value": "CECL/IFRS9" }',
    '  ],',
    '  "notes": ["string"]',
    '}',
    '',
    'Rules:',
    '- Use only explicit evidence from provided documents.',
    '- Never fabricate values; skip uncertain fields.',
    '- Use exact section and field names from FIELD CATALOG.',
    '- For non-table fields, action must be "set".',
    '- For table fields, action must be "add_row" with required table column keys.',
    '- For select and multi-select fields, choose only listed options exactly.',
    '- For date fields, output YYYY-MM-DD only when explicit in source.',
    '- Avoid duplicate scalar updates in this pass.',
    '- Keep notes concise and factual.',
    '',
    `FIELD CATALOG FOR THIS PASS (${fieldCatalog.length}):`,
    JSON.stringify(fieldCatalog, null, 2),
    '',
    `DOCUMENTS FOR THIS PASS (${documents.length}):`,
    JSON.stringify(documents, null, 2),
  ].join('\n');

  const completion = await client.chat.completions.create({
    model,
    temperature: 0,
    max_tokens: 4200,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const record = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const rawFieldUpdates = sanitizeRawFieldUpdateEntries(record.fieldUpdates);
  const notes = sanitizeExtractionNotes(record.notes);
  const extractedUpdates = sanitizeExtractedFieldUpdates(rawFieldUpdates).length;

  return {
    rawFieldUpdates,
    notes,
    passDiagnostics: {
      ...emptyPass,
      extractedUpdates,
      noteCount: notes.length,
    },
  };
}

async function classifyDocument(
  client: OpenAI,
  model: AIModel,
  filename: string,
  text: string,
): Promise<ClassifiedDocument> {
  const sectionIds = TEMPLATE_SECTIONS.map((section) => section.id);

  const prompt = [
    'You are classifying a banking model document against template sections.',
    `Document: ${filename}`,
    `Section IDs: ${sectionIds.join(', ')}`,
    '',
    'Return strict JSON with this shape:',
    '{',
    '  "documentSummary": "short summary",',
    '  "coverage": {',
    '    "1.1": { "status": "covered|partial|gap", "confidence": "high|medium|low", "summary": "evidence summary" }',
    '  }',
    '}',
    '',
    'Rules:',
    '- Include every known section ID in coverage.',
    '- Use "covered" when the document clearly addresses the section.',
    '- Use "partial" when evidence is limited or indirect.',
    '- Use "gap" when no meaningful evidence exists.',
    '',
    'Document excerpt (first 12000 chars):',
    text.slice(0, 12000),
  ].join('\n');

  const completion = await client.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [{ role: 'user', content: prompt }],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const record = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const rawCoverage =
    record.coverage && typeof record.coverage === 'object'
      ? (record.coverage as Record<string, unknown>)
      : {};

  const coverage: Record<string, ClassifiedCoverageEntry> = {};
  for (const section of TEMPLATE_SECTIONS) {
    const entry = rawCoverage[section.id];
    const entryRecord = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
    coverage[section.id] = {
      status: normalizeCoverageStatus(entryRecord.status),
      confidence: normalizeConfidence(entryRecord.confidence),
      summary:
        typeof entryRecord.summary === 'string' && entryRecord.summary.trim()
          ? entryRecord.summary.trim()
          : 'No clear evidence found.',
    };
  }

  const documentSummary =
    typeof record.documentSummary === 'string' && record.documentSummary.trim()
      ? record.documentSummary.trim()
      : 'Document processed and classified.';

  return {
    documentSummary,
    coverage,
  };
}

async function extractPrefillFieldUpdates(
  client: OpenAI,
  model: AIModel,
  parsedDocuments: ParsedDocument[],
): Promise<PrefillExtractionResult> {
  const docsWithText = parsedDocuments
    .map((doc) => ({
      filename: doc.filename,
      documentSummary: doc.documentSummary,
      excerpt: doc.extractedText.slice(0, 8500),
    }))
    .filter((doc) => doc.excerpt.trim().length > 0);

  if (docsWithText.length === 0) {
    return {
      fieldUpdates: [],
      notes: [],
      diagnostics: createEmptyPrefillDiagnostics(),
    };
  }

  const notes: string[] = [];
  const passDiagnostics: PrefillDiagnosticsPass[] = [];
  const rawFieldUpdates: unknown[] = [];

  const sectionCatalogMap = new Map<string, FieldCatalogEntry[]>();
  for (const entry of FIELD_CATALOG) {
    const current = sectionCatalogMap.get(entry.section) ?? [];
    current.push(entry);
    sectionCatalogMap.set(entry.section, current);
  }

  const orderedSections = [...new Set(PREFILL_SECTION_ORDER)];
  for (const section of orderedSections) {
    const catalog = sectionCatalogMap.get(section) ?? [];
    if (catalog.length === 0) continue;

    const docsForSection = selectDocumentsForSection(section, docsWithText);
    const passName = `section_${section}`;
    try {
      const result = await runPrefillExtractionPass(client, model, passName, catalog, docsForSection);
      rawFieldUpdates.push(...result.rawFieldUpdates);
      notes.push(...result.notes.map((note) => `[${passName}] ${note}`));
      passDiagnostics.push(result.passDiagnostics);
    } catch (error) {
      console.error(`process-docs: prefill section pass failed (${passName})`, error);
      notes.push(`[${passName}] extraction failed.`);
      passDiagnostics.push({
        pass: passName,
        requestedFields: catalog.length,
        extractedUpdates: 0,
        noteCount: 1,
        docCount: docsForSection.length,
      });
    }
  }

  let consolidatedUpdates = sanitizeExtractedFieldUpdates(rawFieldUpdates);

  const scalarCatalog = FIELD_CATALOG.filter((entry) => entry.type !== 'table');
  const remainingScalarCatalog = selectRemainingCatalog(scalarCatalog, consolidatedUpdates);
  const scalarBatches = chunkArray(remainingScalarCatalog, 40).slice(0, 2);
  for (let index = 0; index < scalarBatches.length; index += 1) {
    const batch = scalarBatches[index];
    const passName = `remaining_scalar_${index + 1}`;
    try {
      const result = await runPrefillExtractionPass(client, model, passName, batch, docsWithText);
      rawFieldUpdates.push(...result.rawFieldUpdates);
      notes.push(...result.notes.map((note) => `[${passName}] ${note}`));
      passDiagnostics.push(result.passDiagnostics);
      consolidatedUpdates = sanitizeExtractedFieldUpdates(rawFieldUpdates);
    } catch (error) {
      console.error(`process-docs: prefill remaining scalar pass failed (${passName})`, error);
      notes.push(`[${passName}] extraction failed.`);
      passDiagnostics.push({
        pass: passName,
        requestedFields: batch.length,
        extractedUpdates: 0,
        noteCount: 1,
        docCount: docsWithText.length,
      });
    }
  }

  const tableCatalog = FIELD_CATALOG.filter((entry) => entry.type === 'table');
  const remainingTableCatalog = selectRemainingCatalog(tableCatalog, consolidatedUpdates);
  if (remainingTableCatalog.length > 0) {
    const passName = 'remaining_tables';
    try {
      const result = await runPrefillExtractionPass(
        client,
        model,
        passName,
        remainingTableCatalog,
        docsWithText,
      );
      rawFieldUpdates.push(...result.rawFieldUpdates);
      notes.push(...result.notes.map((note) => `[${passName}] ${note}`));
      passDiagnostics.push(result.passDiagnostics);
    } catch (error) {
      console.error(`process-docs: prefill table pass failed (${passName})`, error);
      notes.push(`[${passName}] extraction failed.`);
      passDiagnostics.push({
        pass: passName,
        requestedFields: remainingTableCatalog.length,
        extractedUpdates: 0,
        noteCount: 1,
        docCount: docsWithText.length,
      });
    }
  }

  const finalUpdates = sanitizeExtractedFieldUpdates(rawFieldUpdates);
  const scalarFieldsFilled = new Set(
    finalUpdates
      .filter((update) => update.action !== 'add_row')
      .map((update) => `${update.section}.${update.field}`),
  ).size;
  const tableRowsAdded = finalUpdates.filter((update) => update.action === 'add_row').length;

  const diagnostics: PrefillDiagnostics = {
    requestedFields: FIELD_CATALOG.length,
    extractedUpdates: finalUpdates.length,
    scalarFieldsFilled,
    tableRowsAdded,
    passes: passDiagnostics,
  };

  const summaryNotes = [
    `Prefill extraction scanned ${docsWithText.length} document(s) using ${passDiagnostics.length} pass(es).`,
    `Captured ${scalarFieldsFilled} scalar field(s) and ${tableRowsAdded} table row(s).`,
  ];

  return {
    fieldUpdates: finalUpdates,
    notes: [...summaryNotes, ...notes.slice(0, 24)],
    diagnostics,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ProcessDocumentsPayload>;
    const files = sanitizeFiles(body.files);
    if (files.length === 0) {
      return NextResponse.json({ error: 'files are required' }, { status: 400 });
    }

    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-5-chat-latest';
    const client = getOpenAIClient();
    const parsedDocuments: ParsedDocument[] = [];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      try {
        const extractedText = await extractTextFromFile(file);
        const classified = await classifyDocument(client, model, file.filename, extractedText);

        const sectionsCovered = Object.entries(classified.coverage)
          .filter(([, value]) => value.status !== 'gap')
          .map(([key]) => key);

        const coverageDetail: Record<string, CoverageEntry> = {};
        for (const [sectionId, entry] of Object.entries(classified.coverage)) {
          if (entry.status === 'gap') continue;
          coverageDetail[sectionId] = {
            covered: entry.status === 'covered',
            confidence: entry.confidence,
            summary: entry.summary,
          };
        }

        parsedDocuments.push({
          id: `doc_${index + 1}`,
          filename: file.filename,
          extractedText,
          sectionsCovered,
          coverageDetail,
          documentSummary: classified.documentSummary,
        });
      } catch (error) {
        console.error(`process-docs: failed to process ${file.filename}`, error);
        parsedDocuments.push({
          id: `doc_${index + 1}`,
          filename: file.filename,
          extractedText: '',
          sectionsCovered: [],
          coverageDetail: {},
          documentSummary: 'Failed to process this document.',
        });
      }
    }

    const overallCoverage: CoverageAnalysis['overallCoverage'] = {};
    const gaps: string[] = [];

    for (const section of TEMPLATE_SECTIONS) {
      const entries = parsedDocuments
        .map((doc) => ({
          filename: doc.filename,
          entry: doc.coverageDetail[section.id],
        }))
        .filter((item) => item.entry !== undefined);

      if (entries.length === 0) {
        overallCoverage[section.id] = { status: 'gap', sources: [] };
        gaps.push(section.id);
        continue;
      }

      const hasCovered = entries.some((item) => item.entry?.covered === true);
      const status: CoverageStatus = hasCovered ? 'covered' : 'partial';
      const topConfidence = entries.reduce<Confidence>(
        (best, current) =>
          getConfidenceRank(current.entry!.confidence) > getConfidenceRank(best)
            ? current.entry!.confidence
            : best,
        'low',
      );

      overallCoverage[section.id] = {
        status,
        sources: entries.map((item) => item.filename),
        confidence: topConfidence,
      };
    }

    let fieldUpdates: FieldUpdate[] = [];
    let prefillNotes: string[] = [];
    let prefillDiagnostics: PrefillDiagnostics = createEmptyPrefillDiagnostics();
    try {
      const extracted = await extractPrefillFieldUpdates(client, model, parsedDocuments);
      fieldUpdates = extracted.fieldUpdates;
      prefillNotes = extracted.notes;
      prefillDiagnostics = extracted.diagnostics;
    } catch (error) {
      console.error('process-docs: failed to extract prefill field updates', error);
    }

    return NextResponse.json({
      documents: parsedDocuments,
      overallCoverage,
      gaps,
      fieldUpdates,
      prefillNotes,
      prefillDiagnostics,
    });
  } catch (error) {
    console.error('process-docs route error:', error);
    return NextResponse.json({ error: 'Failed to process documents' }, { status: 500 });
  }
}
