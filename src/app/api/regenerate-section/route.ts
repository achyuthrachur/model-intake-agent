import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { AIModel, IntakeFormState, ParsedDocument } from '@/types';

export const runtime = 'nodejs';

interface RegenerateSectionPayload {
  sectionId: string;
  sectionTitle: string;
  sectionDescription: string;
  formData: IntakeFormState;
  parsedDocuments: ParsedDocument[];
  bankName: string;
  model?: AIModel;
}

interface RegenerateSectionResponse {
  id: string;
  title: string;
  content: string;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured');
  return new OpenAI({ apiKey });
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
          ? doc.sectionsCovered.filter((v): v is string => typeof v === 'string')
          : [],
        coverageDetail:
          doc.coverageDetail && typeof doc.coverageDetail === 'object' ? doc.coverageDetail : {},
        documentSummary:
          typeof doc.documentSummary === 'string' ? doc.documentSummary : 'No summary available.',
      } satisfies ParsedDocument;
    });
}

function buildSectionPrompt(
  sectionId: string,
  sectionTitle: string,
  sectionDescription: string,
  bankName: string,
  formData: IntakeFormState,
  parsedDocuments: ParsedDocument[],
): string {
  const docContext = parsedDocuments.map((doc) => ({
    filename: doc.filename,
    documentSummary: doc.documentSummary,
    excerpt: doc.extractedText.slice(0, 3000),
  }));

  const isTableSection = ['1.4', '1.5', '7.3'].includes(sectionId);

  const tableInstruction = {
    '1.4':
      'Return ONLY a markdown table with columns: Assumption | Evidence | Operational Impact. No prose before or after.',
    '1.5':
      'Return ONLY a markdown table with columns: Limitation | Impact | Mitigating Risk. No prose before or after.',
    '7.3':
      'Return ONLY a markdown table with columns: Name | Type | Description. No prose before or after.',
  }[sectionId];

  const contentInstruction = isTableSection
    ? tableInstruction
    : 'Write 3–5 substantive paragraphs (minimum 200 words total). Be specific and ground every claim in the intake data or document evidence.';

  return [
    `You are a senior model risk documentation writer generating a single section for ${bankName}'s formal model documentation.`,
    '',
    `Section ID: ${sectionId}`,
    `Section Title: ${sectionTitle}`,
    `Section Description: ${sectionDescription}`,
    '',
    'Requirements:',
    `- ${contentInstruction}`,
    '- Explicitly reference concrete details from the intake form: model names, dates, system names, thresholds, ownership, cadence, data lineage.',
    '- If using document evidence, cite inline as "(Source: filename.docx)".',
    '- Avoid vague filler such as "controls are in place" unless backed by specific evidence.',
    '- If data is genuinely missing use: [Information not provided - to be completed by model owner].',
    '',
    'Return strict JSON only:',
    '{ "content": "..." }',
    '',
    'INTAKE DATA:',
    JSON.stringify(formData, null, 2),
    '',
    'DOCUMENT CONTEXT:',
    JSON.stringify(docContext, null, 2),
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<RegenerateSectionPayload>;

    const sectionId = typeof body.sectionId === 'string' ? body.sectionId : '';
    const sectionTitle = typeof body.sectionTitle === 'string' ? body.sectionTitle : '';
    const sectionDescription = typeof body.sectionDescription === 'string' ? body.sectionDescription : '';
    const bankName =
      typeof body.bankName === 'string' && body.bankName.trim() ? body.bankName.trim() : 'Acme Bank';

    if (!sectionId || !body.formData) {
      return NextResponse.json({ error: 'sectionId and formData are required' }, { status: 400 });
    }

    const parsedDocuments = sanitizeParsedDocuments(body.parsedDocuments);
    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-5-chat-latest';
    const client = getOpenAIClient();

    const prompt = buildSectionPrompt(
      sectionId,
      sectionTitle,
      sectionDescription,
      bankName,
      body.formData as IntakeFormState,
      parsedDocuments,
    );

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.25,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    let parsed: { content?: unknown } = {};
    try {
      parsed = JSON.parse(raw) as { content?: unknown };
    } catch {
      parsed = {};
    }

    const content =
      typeof parsed.content === 'string' && parsed.content.trim().length >= 80
        ? parsed.content.trim()
        : '[Information not provided - to be completed by model owner]';

    const result: RegenerateSectionResponse = { id: sectionId, title: sectionTitle, content };
    return NextResponse.json(result);
  } catch (error) {
    console.error('regenerate-section route error:', error);
    return NextResponse.json({ error: 'Failed to regenerate section' }, { status: 500 });
  }
}
