import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { parseFieldUpdates } from '@/lib/field-update-parser';
import type { AIModel, ChatMessage, IntakeFormState } from '@/types';

export const runtime = 'nodejs';

interface IntakeChatPayload {
  message: string;
  conversationHistory: ChatMessage[];
  formState: IntakeFormState;
  unfilledFields: string[];
  model?: AIModel;
}

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

function buildIntakeSystemPrompt(formState: IntakeFormState, unfilledFields: string[]): string {
  return [
    'You are an experienced Model Risk Management (MRM) analyst running a model intake interview.',
    'You should ask focused, professional follow-up questions and capture structured data.',
    '',
    'CURRENT FORM STATE:',
    JSON.stringify(formState, null, 2),
    '',
    `UNFILLED FIELDS (${unfilledFields.length}):`,
    unfilledFields.join(', ') || '[none]',
    '',
    'When you learn structured data, emit updates in this exact format:',
    '<<<FIELD_UPDATE>>>',
    '{"section":"model_summary","field":"model_type","value":"Credit Risk","action":"set"}',
    '<<<END_FIELD_UPDATE>>>',
    '',
    'Guidelines:',
    '- Keep responses conversational and concise.',
    '- Prioritize unfilled fields.',
    '- Do not ask for fields that are already filled, unless the user asks to revise them.',
    '- Ask one primary question at a time.',
    '- Emit add_row actions for table data where relevant.',
    '- Do not return JSON outside FIELD_UPDATE blocks.',
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
    const unfilledFields = Array.isArray(body.unfilledFields)
      ? body.unfilledFields.filter((entry): entry is string => typeof entry === 'string')
      : [];
    const model = body.model || (process.env.DEFAULT_AI_MODEL as AIModel) || 'gpt-5-chat-latest';

    const client = getOpenAIClient();
    const systemPrompt = buildIntakeSystemPrompt(formState, unfilledFields);
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

    return NextResponse.json({
      aiReply: parsed.cleanReply,
      fieldUpdates: parsed.fieldUpdates,
    });
  } catch (error) {
    console.error('intake-chat route error:', error);
    return NextResponse.json({ error: 'Failed to process intake chat' }, { status: 500 });
  }
}
