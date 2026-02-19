import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import mammoth from 'mammoth';
import { TEMPLATE_SECTIONS } from '@/data/template-structure';
import type { AIModel, CoverageAnalysis, CoverageEntry, ParsedDocument } from '@/types';

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

  // DOCX/DOC fallback: byte decode only; replace with rich extraction if needed.
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<ProcessDocumentsPayload>;
    const files = sanitizeFiles(body.files);
    if (files.length === 0) {
      return NextResponse.json({ error: 'files are required' }, { status: 400 });
    }

    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-4o';
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

    return NextResponse.json({
      documents: parsedDocuments,
      overallCoverage,
      gaps,
    });
  } catch (error) {
    console.error('process-docs route error:', error);
    return NextResponse.json({ error: 'Failed to process documents' }, { status: 500 });
  }
}
