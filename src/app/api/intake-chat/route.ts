import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseFieldUpdates } from '@/lib/field-update-parser';
import { INTAKE_SCHEMA } from '@/lib/intake-schema';
import type { AIModel, ChatMessage, IntakeFormState } from '@/types';

export const runtime = 'nodejs';

interface IntakeChatPayload {
  message: string;
  conversationHistory: ChatMessage[];
  formState: IntakeFormState;
  unfilledFields: string[];
  model?: AIModel;
}

const API_SECTION_TO_STORE_SECTION: Record<string, string> = {
  model_summary: 'modelSummary',
  executive_summary: 'executiveSummary',
  model_design: 'modelDesign',
  development_data: 'developmentData',
  output_use: 'outputUse',
  implementation: 'implementation',
  performance: 'performance',
  governance: 'governance',
};

const ORDERED_FIELD_PATHS: string[] = INTAKE_SCHEMA.flatMap((section) =>
  section.fields.map((field) => `${section.id}.${field.name}`),
);

const FIELD_QUESTION_BY_PATH = new Map<string, string>(
  INTAKE_SCHEMA.flatMap((section) =>
    section.fields.map((field) => [
      `${section.id}.${field.name}`,
      field.aiHint?.trim() || field.label.trim(),
    ]),
  ),
);

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

function sanitizeConversationHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const role = record.role;
      const content = record.content;
      if (
        (role !== 'user' && role !== 'assistant' && role !== 'system') ||
        typeof content !== 'string'
      ) {
        return null;
      }
      return {
        id: typeof record.id === 'string' ? record.id : `history-${Date.now()}`,
        role,
        content,
        timestamp: typeof record.timestamp === 'number' ? record.timestamp : Date.now(),
      } satisfies ChatMessage;
    })
    .filter((entry): entry is ChatMessage => entry !== null);
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
}

function getValueAtPath(formState: IntakeFormState, path: string): unknown {
  const [sectionKey, fieldKey] = path.split('.');
  if (!sectionKey || !fieldKey) return undefined;

  const section = (formState as unknown as Record<string, unknown>)[sectionKey];
  if (!section || typeof section !== 'object') return undefined;

  return (section as Record<string, unknown>)[fieldKey];
}

function setValueAtPath(formState: IntakeFormState, path: string, value: unknown): void {
  const [sectionKey, fieldKey] = path.split('.');
  if (!sectionKey || !fieldKey) return;

  const stateRecord = formState as unknown as Record<string, unknown>;
  const section = stateRecord[sectionKey];
  if (!section || typeof section !== 'object') return;

  (section as Record<string, unknown>)[fieldKey] = value;
}

function isFilledValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function getOrderedUnfilledFields(formState: IntakeFormState): string[] {
  return ORDERED_FIELD_PATHS.filter((fieldPath) => !isFilledValue(getValueAtPath(formState, fieldPath)));
}

function cloneFormState(formState: IntakeFormState): IntakeFormState {
  if (typeof structuredClone === 'function') {
    return structuredClone(formState);
  }
  return JSON.parse(JSON.stringify(formState)) as IntakeFormState;
}

function applyFieldUpdatesToFormState(
  formState: IntakeFormState,
  fieldUpdates: ReturnType<typeof parseFieldUpdates>['fieldUpdates'],
): IntakeFormState {
  const projected = cloneFormState(formState);

  for (const update of fieldUpdates) {
    const sectionKey = API_SECTION_TO_STORE_SECTION[update.section] ?? update.section;
    const fieldKey = snakeToCamel(update.field);
    if (!sectionKey || !fieldKey) continue;
    const path = `${sectionKey}.${fieldKey}`;

    if (update.action === 'add_row') {
      const current = getValueAtPath(projected, path);
      const rows = Array.isArray(current) ? current : [];
      setValueAtPath(projected, path, [...rows, update.value]);
      continue;
    }

    setValueAtPath(projected, path, update.value);
  }

  return projected;
}

function buildNextQuestion(fieldPath: string | undefined): string | undefined {
  if (!fieldPath) return undefined;
  const base = FIELD_QUESTION_BY_PATH.get(fieldPath)?.trim();
  if (!base) return undefined;
  return base.endsWith('?') ? base : `${base}?`;
}

function appendDeterministicFollowUp(reply: string, nextQuestion: string | undefined): string {
  const trimmedReply = reply.trim();

  if (!nextQuestion) {
    return (
      trimmedReply ||
      'All tracked intake fields are currently populated. Let me know if you want to revise any response.'
    );
  }

  const normalizedReply = trimmedReply.toLowerCase();
  const normalizedQuestion = nextQuestion.toLowerCase();
  if (normalizedReply.includes(normalizedQuestion)) {
    return trimmedReply;
  }

  if (!trimmedReply) {
    return nextQuestion;
  }

  return `${trimmedReply}\n\nNext question: ${nextQuestion}`;
}

function buildIntakeSystemPrompt(
  formState: IntakeFormState,
  orderedUnfilledFields: string[],
  nextFieldPath: string | undefined,
  nextQuestion: string | undefined,
): string {
  return [
    'You are an experienced Model Risk Management (MRM) analyst running a model intake interview.',
    'You should capture structured values and keep the user moving through missing fields in order.',
    '',
    'CURRENT FORM STATE:',
    JSON.stringify(formState, null, 2),
    '',
    `ORDERED UNFILLED FIELDS (${orderedUnfilledFields.length}):`,
    orderedUnfilledFields.join(', ') || '[none]',
    '',
    `PRIMARY TARGET FIELD THIS TURN: ${nextFieldPath ?? '[none]'}`,
    `PRIMARY TARGET QUESTION THIS TURN: ${nextQuestion ?? '[none]'}`,
    '',
    'When you learn structured data, emit updates in this exact format:',
    '<<<FIELD_UPDATE>>>',
    '{"section":"model_summary","field":"model_type","value":"Credit Risk","action":"set"}',
    '<<<END_FIELD_UPDATE>>>',
    '',
    'Guidelines:',
    '- Keep responses conversational and concise.',
    '- Prioritize ordered unfilled fields.',
    '- Focus first on the primary target field unless the user explicitly asks to revise another field.',
    '- Do not ask for fields that are already filled, unless the user asks to revise them.',
    '- Ask one primary question at a time.',
    '- Emit add_row actions for table data where relevant.',
    '- Do not return JSON outside FIELD_UPDATE blocks.',
    '- If the user provided data for multiple fields, capture all of them with FIELD_UPDATE blocks.',
  ].join('\n');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<IntakeChatPayload>;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    const conversationHistory = sanitizeConversationHistory(body.conversationHistory);
    const formState =
      body.formState && typeof body.formState === 'object'
        ? (body.formState as IntakeFormState)
        : ({} as IntakeFormState);
    const orderedUnfilledBefore = getOrderedUnfilledFields(formState);
    const nextFieldBefore = orderedUnfilledBefore[0];
    const nextQuestionBefore = buildNextQuestion(nextFieldBefore);
    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-5-chat-latest';

    const client = getOpenAIClient();
    const systemPrompt = buildIntakeSystemPrompt(
      formState,
      orderedUnfilledBefore,
      nextFieldBefore,
      nextQuestionBefore,
    );
    const historyMessages: OpenAI.Chat.ChatCompletionMessageParam[] = conversationHistory.map(
      (entry) => {
        if (entry.role === 'user') {
          return { role: 'user', content: entry.content };
        }
        if (entry.role === 'assistant') {
          return { role: 'assistant', content: entry.content };
        }
        return { role: 'system', content: entry.content };
      },
    );

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 1800,
      messages: [
        { role: 'system', content: systemPrompt },
        ...historyMessages,
        { role: 'user', content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content ?? '';
    const parsed = parseFieldUpdates(reply);
    const projectedState = applyFieldUpdatesToFormState(formState, parsed.fieldUpdates);
    const orderedUnfilledAfter = getOrderedUnfilledFields(projectedState);
    const nextQuestionAfter = buildNextQuestion(orderedUnfilledAfter[0]);
    const aiReply = appendDeterministicFollowUp(parsed.cleanReply, nextQuestionAfter);

    return NextResponse.json({
      aiReply,
      fieldUpdates: parsed.fieldUpdates,
    });
  } catch (error) {
    console.error('intake-chat route error:', error);
    return NextResponse.json({ error: 'Failed to process intake chat' }, { status: 500 });
  }
}
