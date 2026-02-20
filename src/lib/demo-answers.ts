import type { ChatMessage } from '@/types';

export type DemoAnswerIntent =
  | 'model_type'
  | 'estimation_technique'
  | 'model_developer'
  | 'model_owner'
  | 'risk_rating'
  | 'validation_details'
  | 'model_usage'
  | 'business_purpose'
  | 'regulatory_standards'
  | 'business_units'
  | 'upstream_downstream'
  | 'key_model_drivers'
  | 'data_sources'
  | 'output_description'
  | 'scenario_governance'
  | 'assumptions_limitations'
  | 'monitoring'
  | 'change_management'
  | 'contingency'
  | 'fallback';

export interface DemoAnswerEntry {
  id: string;
  text: string;
  intents: DemoAnswerIntent[];
}

const KNOWN_INTENTS = new Set<DemoAnswerIntent>([
  'model_type',
  'estimation_technique',
  'model_developer',
  'model_owner',
  'risk_rating',
  'validation_details',
  'model_usage',
  'business_purpose',
  'regulatory_standards',
  'business_units',
  'upstream_downstream',
  'key_model_drivers',
  'data_sources',
  'output_description',
  'scenario_governance',
  'assumptions_limitations',
  'monitoring',
  'change_management',
  'contingency',
  'fallback',
]);

const INTENT_RULES: Array<{ intent: DemoAnswerIntent; patterns: RegExp[] }> = [
  {
    intent: 'model_owner',
    patterns: [/model owner/i, /who.*own/i, /responsible party/i, /owner accountable/i],
  },
  {
    intent: 'model_developer',
    patterns: [
      /model developer/i,
      /developer of (this )?model/i,
      /who is the developer/i,
      /vendor/i,
      /who.*built/i,
      /developed/i,
    ],
  },
  {
    intent: 'risk_rating',
    patterns: [/risk rating/i, /risk tier/i, /tier [1-4]/i, /materiality and risk/i],
  },
  {
    intent: 'validation_details',
    patterns: [
      /model validator/i,
      /who.*validat/i,
      /validation rating/i,
      /date of validation/i,
      /independent validation/i,
    ],
  },
  {
    intent: 'model_type',
    patterns: [/name and type/i, /model type/i, /what.*model/i, /model.*documenting/i],
  },
  {
    intent: 'estimation_technique',
    patterns: [/estimation technique/i, /methodolog/i, /how.*model works/i, /pd\/lgd\/ead/i],
  },
  {
    intent: 'model_usage',
    patterns: [
      /model usage/i,
      /primary usage/i,
      /how.*used/i,
      /decisions.*supports/i,
      /used within/i,
    ],
  },
  {
    intent: 'business_purpose',
    patterns: [/business purpose/i, /why.*created/i, /business problem/i],
  },
  {
    intent: 'regulatory_standards',
    patterns: [/regulatory/i, /standards/i, /frameworks/i, /policy/i, /sr 11-7/i, /asc 326/i],
  },
  {
    intent: 'business_units',
    patterns: [/business units/i, /departments/i, /which teams/i, /who uses/i],
  },
  {
    intent: 'upstream_downstream',
    patterns: [/upstream/i, /downstream/i, /interact/i, /depends on/i, /provides outputs/i],
  },
  {
    intent: 'key_model_drivers',
    patterns: [/key model drivers/i, /main factors/i, /variables.*influence/i],
  },
  {
    intent: 'data_sources',
    patterns: [/data sources/i, /internal.*external/i, /source systems/i, /sftp/i, /etl/i],
  },
  {
    intent: 'output_description',
    patterns: [/what does.*produce/i, /outputs?/i, /output format/i, /results/i],
  },
  {
    intent: 'scenario_governance',
    patterns: [/scenario/i, /forecast package/i, /weights/i, /macro inputs/i],
  },
  {
    intent: 'assumptions_limitations',
    patterns: [/assumptions?/i, /limitations?/i, /mitigating risk/i, /overlays?/i],
  },
  {
    intent: 'monitoring',
    patterns: [/monitoring/i, /drift/i, /threshold/i, /escalation/i, /kpi/i],
  },
  {
    intent: 'change_management',
    patterns: [/change management/i, /release/i, /version/i, /material change/i],
  },
  {
    intent: 'contingency',
    patterns: [/fallback/i, /contingency/i, /disaster recovery/i, /business continuity/i, /bcp/i],
  },
];

let demoAnswersCache: DemoAnswerEntry[] | null = null;

function sanitizeIntent(value: unknown): DemoAnswerIntent | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim() as DemoAnswerIntent;
  return KNOWN_INTENTS.has(normalized) ? normalized : null;
}

function sanitizeDemoAnswerEntry(raw: unknown, index: number): DemoAnswerEntry | null {
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return null;
    return {
      id: `legacy_${index + 1}`,
      text,
      intents: ['fallback'],
    };
  }

  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const text = typeof record.text === 'string' ? record.text.trim() : '';
  if (!text) return null;

  const idCandidate = typeof record.id === 'string' ? record.id.trim() : '';
  const rawIntents = Array.isArray(record.intents) ? record.intents : [];
  const intents = rawIntents
    .map((entry) => sanitizeIntent(entry))
    .filter((entry): entry is DemoAnswerIntent => entry !== null);

  return {
    id: idCandidate || `answer_${index + 1}`,
    text,
    intents: intents.length > 0 ? intents : ['fallback'],
  };
}

function sanitizeDemoAnswers(raw: unknown): DemoAnswerEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry, index) => sanitizeDemoAnswerEntry(entry, index))
    .filter((entry): entry is DemoAnswerEntry => entry !== null);
}

export async function loadDemoAnswers(): Promise<DemoAnswerEntry[]> {
  if (demoAnswersCache) {
    return demoAnswersCache;
  }

  const response = await fetch('/demo/demo-answers.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load demo answers: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  demoAnswersCache = sanitizeDemoAnswers(data);
  return demoAnswersCache;
}

function inferIntents(question: string): DemoAnswerIntent[] {
  const questionSentences = extractQuestionSentences(question);
  const candidates =
    questionSentences.length > 0
      ? [...questionSentences].reverse()
      : [question.trim()].filter((entry) => entry.length > 0);

  for (const candidate of candidates) {
    const hits: DemoAnswerIntent[] = [];
    for (const rule of INTENT_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(candidate))) {
        hits.push(rule.intent);
      }
    }

    if (hits.length > 0) {
      hits.push('fallback');
      return [...new Set(hits)];
    }
  }

  return ['fallback'];
}

function extractQuestionSentences(content: string): string[] {
  const trimmed = content.trim();
  if (!trimmed) return [];

  const matches = trimmed.match(/[^?]+\?/g);
  if (!matches || matches.length === 0) return [];

  return matches
    .map((entry) => {
      const lineParts = entry
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0);
      const lastLine = lineParts.length > 0 ? lineParts[lineParts.length - 1] : entry.trim();

      const sentenceParts = lastLine
        .split(/[.!]\s+/)
        .map((part) => part.trim())
        .filter((part) => part.length > 0);
      return sentenceParts.length > 0 ? sentenceParts[sentenceParts.length - 1] : lastLine;
    })
    .filter((entry) => entry.endsWith('?'));
}

interface SelectionState {
  fallbackIndex: number;
}

function selectEntryForQuestion(
  question: string,
  answers: DemoAnswerEntry[],
  state: SelectionState,
): DemoAnswerEntry | undefined {
  const intents = inferIntents(question);

  for (const intent of intents) {
    if (intent === 'fallback') continue;
    const matched = answers.find((entry) => entry.intents.includes(intent));
    if (matched) return matched;
  }

  const fallbackEntries = answers.filter((entry) => entry.intents.includes('fallback'));
  if (fallbackEntries.length === 0) {
    return answers[0];
  }

  const selected = fallbackEntries[state.fallbackIndex % fallbackEntries.length];
  state.fallbackIndex += 1;
  return selected;
}

export function selectSuggestedDemoMessage(
  messages: ChatMessage[],
  answers: DemoAnswerEntry[],
): string | undefined {
  if (answers.length === 0) return undefined;

  let latestAssistantQuestion = '';
  const state: SelectionState = { fallbackIndex: 0 };

  for (const message of messages) {
    if (message.role === 'assistant') {
      latestAssistantQuestion = message.content;
      continue;
    }

    if (message.role === 'user') {
      void selectEntryForQuestion(latestAssistantQuestion, answers, state);
    }
  }

  const selected = selectEntryForQuestion(latestAssistantQuestion, answers, state);
  return selected?.text;
}

function normalizeAnswerText(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

export function buildRemainingDemoAnswerBatch(
  messages: ChatMessage[],
  answers: DemoAnswerEntry[],
): string[] {
  if (answers.length === 0) return [];

  const usedUserReplies = new Set(
    messages
      .filter((message) => message.role === 'user')
      .map((message) => normalizeAnswerText(message.content))
      .filter((content) => content.length > 0),
  );

  const orderedAnswers = [
    ...answers.filter((entry) => !entry.intents.includes('fallback')),
    ...answers.filter((entry) => entry.intents.includes('fallback')),
  ];

  const batch: string[] = [];
  const seen = new Set<string>();

  for (const entry of orderedAnswers) {
    const normalized = normalizeAnswerText(entry.text);
    if (!normalized) continue;
    if (usedUserReplies.has(normalized)) continue;
    if (seen.has(normalized)) continue;

    seen.add(normalized);
    batch.push(entry.text.trim());
  }

  return batch;
}
