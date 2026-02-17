import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { TEMPLATE_SECTIONS } from '@/data/template-structure';
import type { AIModel, GeneratedReport, IntakeFormState, ParsedDocument, ReportSection } from '@/types';

export const runtime = 'nodejs';

interface GenerateReportPayload {
  intakeData: IntakeFormState;
  parsedDocuments: ParsedDocument[];
  bankName: string;
  model?: AIModel;
}

interface RawGeneratedSection {
  id: string;
  content: string;
}

interface RawGenerateResponse {
  modelName?: unknown;
  generationNotes?: unknown;
  sections?: unknown;
}

const SECTION_ORDER = TEMPLATE_SECTIONS.map((section) => ({
  id: section.id,
  title: section.title,
}));

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function buildModelName(intakeData: IntakeFormState): string {
  const developer = intakeData.modelSummary.modelDeveloper?.trim() || 'Model';
  const type = intakeData.modelSummary.modelType?.trim() || 'Risk';
  return `${developer} ${type} Documentation`;
}

function buildModelSummaryTable(intakeData: IntakeFormState): string {
  const ms = intakeData.modelSummary;
  return [
    '| Field | Value |',
    '|-------|-------|',
    `| Model Type | ${ms.modelType || '[Information not provided]'} |`,
    `| Estimation Technique | ${ms.estimationTechnique || '[Information not provided]'} |`,
    `| Model Developer(s) | ${ms.modelDeveloper || '[Information not provided]'} |`,
    `| Model Owner | ${ms.modelOwner || '[Information not provided]'} |`,
    `| Model Usage | ${ms.modelUsage || '[Information not provided]'} |`,
    `| Upstream Models | ${ms.upstreamModels || '[Information not provided]'} |`,
    `| Downstream Models | ${ms.downstreamModels || '[Information not provided]'} |`,
    `| Risk Rating | ${ms.riskRating || '[Information not provided]'} |`,
    `| Policy Coverage | ${ms.policyCoverage || '[Information not provided]'} |`,
    `| Model Validator | ${ms.modelValidator || '[Information not provided]'} |`,
    `| Date of Validation | ${ms.dateOfValidation || '[Information not provided]'} |`,
    `| Validation Rating | ${ms.validationRating || '[Information not provided]'} |`,
    `| Date of Implementation | ${ms.dateOfImplementation || '[Information not provided]'} |`,
  ].join('\n');
}

function sanitizeParsedDocuments(parsedDocuments: unknown): ParsedDocument[] {
  if (!Array.isArray(parsedDocuments)) return [];

  return parsedDocuments
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry, index) => {
      const doc = entry as Partial<ParsedDocument>;
      return {
        id: typeof doc.id === 'string' ? doc.id : `doc_${index + 1}`,
        filename: typeof doc.filename === 'string' ? doc.filename : `Document ${index + 1}`,
        extractedText: typeof doc.extractedText === 'string' ? doc.extractedText : '',
        sectionsCovered: Array.isArray(doc.sectionsCovered)
          ? doc.sectionsCovered.filter((value): value is string => typeof value === 'string')
          : [],
        coverageDetail:
          doc.coverageDetail && typeof doc.coverageDetail === 'object'
            ? doc.coverageDetail
            : {},
        documentSummary:
          typeof doc.documentSummary === 'string'
            ? doc.documentSummary
            : 'No summary available.',
      } satisfies ParsedDocument;
    });
}

function buildPrompt(
  bankName: string,
  intakeData: IntakeFormState,
  parsedDocuments: ParsedDocument[],
): string {
  const docContext = parsedDocuments.map((doc) => ({
    filename: doc.filename,
    sectionsCovered: doc.sectionsCovered,
    documentSummary: doc.documentSummary,
    excerpt: doc.extractedText.slice(0, 1800),
  }));

  const sectionTargets = SECTION_ORDER.filter((section) => section.id !== 'model_summary');

  return [
    `You are generating a formal bank model documentation report for ${bankName}.`,
    'Use intake data first, supplement with document evidence when available.',
    '',
    'Return strict JSON only with this shape:',
    '{',
    '  "modelName": "string",',
    '  "generationNotes": ["string"],',
    '  "sections": [',
    '    { "id": "1.1", "content": "..." }',
    '  ]',
    '}',
    '',
    'Requirements:',
    '- Include every requested section ID exactly once.',
    '- Keep section content concise and professional (1-3 paragraphs).',
    '- If data is missing, use: [Information not provided - to be completed by model owner].',
    '- For section 1.4 produce a markdown assumptions table.',
    '- For section 1.5 produce a markdown limitations table with Mitigating Risk.',
    '',
    `Requested section IDs: ${sectionTargets.map((section) => section.id).join(', ')}`,
    '',
    'INTAKE DATA:',
    JSON.stringify(intakeData, null, 2),
    '',
    'DOCUMENT CONTEXT:',
    JSON.stringify(docContext, null, 2),
  ].join('\n');
}

function normalizeGeneratedSections(raw: unknown): RawGeneratedSection[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      if (typeof record.id !== 'string' || typeof record.content !== 'string') return null;
      return {
        id: record.id,
        content: record.content,
      } satisfies RawGeneratedSection;
    })
    .filter((entry): entry is RawGeneratedSection => entry !== null);
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<GenerateReportPayload>;
    const intakeData = body.intakeData;
    const bankName =
      typeof body.bankName === 'string' && body.bankName.trim()
        ? body.bankName.trim()
        : 'Acme Bank';

    if (!intakeData || typeof intakeData !== 'object') {
      return NextResponse.json({ error: 'intakeData is required' }, { status: 400 });
    }

    const parsedDocuments = sanitizeParsedDocuments(body.parsedDocuments);
    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-4o';
    const client = getOpenAIClient();

    const modelSummaryContent = buildModelSummaryTable(intakeData as IntakeFormState);
    const prompt = buildPrompt(bankName, intakeData as IntakeFormState, parsedDocuments);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 5000,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0]?.message?.content || '{}';
    let parsed: RawGenerateResponse = {};
    try {
      parsed = JSON.parse(content) as RawGenerateResponse;
    } catch {
      parsed = {};
    }

    const generatedSections = normalizeGeneratedSections(parsed.sections);
    const generatedSectionMap = new Map(generatedSections.map((section) => [section.id, section.content]));

    const reportSections: ReportSection[] = SECTION_ORDER.map((section) => {
      if (section.id === 'model_summary') {
        return {
          id: section.id,
          title: section.title,
          content: modelSummaryContent,
        };
      }

      const aiContent = generatedSectionMap.get(section.id);
      return {
        id: section.id,
        title: section.title,
        content:
          aiContent && aiContent.trim()
            ? aiContent.trim()
            : '[Information not provided - to be completed by model owner]',
      };
    });

    const generationNotes = Array.isArray(parsed.generationNotes)
      ? parsed.generationNotes.filter((note): note is string => typeof note === 'string')
      : [];

    const report: GeneratedReport = {
      bankName,
      modelName:
        typeof parsed.modelName === 'string' && parsed.modelName.trim()
          ? parsed.modelName
          : buildModelName(intakeData as IntakeFormState),
      sections: reportSections,
      generationNotes:
        generationNotes.length > 0
          ? generationNotes
          : ['Generated using intake responses and uploaded document evidence.'],
      generatedAt: Date.now(),
    };

    return NextResponse.json(report);
  } catch (error) {
    console.error('generate-report route error:', error);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
