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
    excerpt: doc.extractedText.slice(0, 4500),
    coverageDetail: Object.entries(doc.coverageDetail).map(([sectionId, detail]) => ({
      sectionId,
      covered: detail.covered,
      confidence: detail.confidence,
      summary: detail.summary,
    })),
  }));

  const sectionTargets = TEMPLATE_SECTIONS
    .filter((section) => section.id !== 'model_summary')
    .map((section) => ({
      id: section.id,
      title: section.title,
      parentSection: section.parentSection ?? '',
      description: section.description,
    }));

  return [
    `You are generating a formal bank model documentation report for ${bankName}.`,
    'You are a senior model risk documentation writer and must produce detailed, section-accurate content.',
    'Use intake data and document evidence together. Do not write boilerplate or generic filler.',
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
    '- Match each section to its specific title and description from the section plan below.',
    '- Do not shift implementation text into back-testing sections, or governance text into design sections.',
    '- Narrative sections MUST be detailed and specific: write at least 3–5 substantive paragraphs (minimum 200 words) per subsection.',
    '- Explicitly reference concrete details from the intake form: model names, dates, system names, thresholds, ownership, cadence, and data lineage.',
    '- Ground every claim in document evidence or intake responses. If using document evidence, cite inline as "(Source: filename.docx)".',
    '- Avoid all vague filler such as "controls are in place", "processes exist", or "the model performs well" unless backed by specific evidence.',
    '- If data is genuinely missing, use exactly: [Information not provided - to be completed by model owner].',
    '- For section 1.4 produce ONLY a markdown assumptions table with columns: Assumption | Evidence | Operational Impact.',
    '  Example: | The PD calibration remains stable across economic cycles | (Source: Vendor_Model_Guide.docx) | Recalibration required if macro regime shifts significantly |',
    '- For section 1.5 produce ONLY a markdown limitations table with columns: Limitation | Impact | Mitigating Risk.',
    '  Example: | Model trained on pre-2020 data only | Potential underestimation of tail losses | Annual back-test comparison to current cohort |',
    '- For section 7.3 produce ONLY a markdown references table with columns: Name | Type | Description.',
    '  Example: | SR 11-7 | Regulatory Guidance | Federal Reserve guidance on model risk management |',
    '',
    'SECTION PLAN (authoritative mapping for IDs):',
    JSON.stringify(sectionTargets, null, 2),
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
    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-5-chat-latest';
    const client = getOpenAIClient();

    const modelSummaryContent = buildModelSummaryTable(intakeData as IntakeFormState);
    const prompt = buildPrompt(bankName, intakeData as IntakeFormState, parsedDocuments);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 16000,
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
      const trimmed = aiContent?.trim() ?? '';
      return {
        id: section.id,
        title: section.title,
        content:
          trimmed.length >= 80
            ? trimmed
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
