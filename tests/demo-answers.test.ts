import {
  buildRemainingDemoAnswerBatch,
  selectSuggestedDemoMessage,
  type DemoAnswerEntry,
} from '@/lib/demo-answers';
import type { ChatMessage } from '@/types';
import { useIntakeStore } from '@/stores/intake-store';

function msg(
  role: ChatMessage['role'],
  content: string,
  id: string,
): ChatMessage {
  return {
    id,
    role,
    content,
    timestamp: Number(id.replace(/\D/g, '')) || 1,
  };
}

const ANSWERS: DemoAnswerEntry[] = [
  {
    id: 'model_identity',
    intents: ['model_type'],
    text: 'Model type answer',
  },
  {
    id: 'developer_owner',
    intents: ['model_developer', 'model_owner'],
    text: 'Developer and owner answer',
  },
  {
    id: 'regulatory',
    intents: ['regulatory_standards'],
    text: 'Regulatory answer',
  },
  {
    id: 'fallback_1',
    intents: ['fallback'],
    text: 'Fallback answer one',
  },
  {
    id: 'fallback_2',
    intents: ['fallback'],
    text: 'Fallback answer two',
  },
];

function getFreshFormState() {
  const state = useIntakeStore.getState();
  state.resetSession();
  return structuredClone(useIntakeStore.getState().formData);
}

describe('demo answer selector', () => {
  it('matches question intent for model type', () => {
    const messages: ChatMessage[] = [
      msg('assistant', 'Can you tell me the name and type of the model?', 'a1'),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS);
    expect(suggested).toBe('Model type answer');
  });

  it('keeps returning owner answer when owner question repeats', () => {
    const messages: ChatMessage[] = [
      msg('assistant', 'Can you tell me the name and type of the model?', 'a1'),
      msg('user', 'Model type is CECL.', 'u1'),
      msg('assistant', 'Who is the model owner?', 'a2'),
      msg('user', 'Some unrelated note.', 'u2'),
      msg('assistant', 'Please provide the model owner.', 'a3'),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS);
    expect(suggested).toBe('Developer and owner answer');
  });

  it('rotates fallback answers when intent is unknown across turns', () => {
    const messagesTurn1: ChatMessage[] = [
      msg('assistant', 'Could you expand on that?', 'a1'),
    ];
    expect(selectSuggestedDemoMessage(messagesTurn1, ANSWERS)).toBe('Fallback answer one');

    const messagesTurn2: ChatMessage[] = [
      msg('assistant', 'Could you expand on that?', 'a1'),
      msg('user', 'Reply one', 'u1'),
      msg('assistant', 'Can you add more detail?', 'a2'),
    ];
    expect(selectSuggestedDemoMessage(messagesTurn2, ANSWERS)).toBe('Fallback answer two');
  });

  it('prioritizes the latest question sentence over recap text', () => {
    const messages: ChatMessage[] = [
      msg(
        'assistant',
        'Thanks for the regulatory details. Could you provide the model owner?',
        'a1',
      ),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS);
    expect(suggested).toBe('Developer and owner answer');
  });

  it('builds a remaining batch and skips replies already sent by user', () => {
    const messages: ChatMessage[] = [
      msg('assistant', 'Can you tell me the name and type of the model?', 'a1'),
      msg('user', 'Model type answer', 'u1'),
      msg('assistant', 'Who is the model owner?', 'a2'),
    ];

    const batch = buildRemainingDemoAnswerBatch(messages, ANSWERS);

    expect(batch).toEqual([
      'Developer and owner answer',
      'Regulatory answer',
      'Fallback answer one',
      'Fallback answer two',
    ]);
  });

  it('prefers prefilled form values for suggested message when available', () => {
    const formState = getFreshFormState();
    formState.modelSummary.modelType = 'CECL/IFRS9';

    const messages: ChatMessage[] = [
      msg('assistant', 'Can you tell me the name and type of the model?', 'a1'),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS, formState);
    expect(suggested).toBe('Model Type: CECL/IFRS9');
  });

  it('matches prefilled suggestion to the specific field asked in the question', () => {
    const formState = getFreshFormState();
    formState.modelSummary.modelType = 'CECL/IFRS9';
    formState.modelSummary.estimationTechnique = 'Hybrid';

    const messages: ChatMessage[] = [
      msg(
        'assistant',
        'Thank you for the model type. Next, could you specify the estimation technique used in this model?',
        'a1',
      ),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS, formState);
    expect(suggested).toBe('Estimation Technique: Hybrid');
  });

  it('returns multiple calibrated fields when the question asks for both', () => {
    const formState = getFreshFormState();
    formState.modelSummary.modelDeveloper = 'Northstar Analytics';
    formState.modelSummary.modelOwner = 'Finance Controllership';

    const messages: ChatMessage[] = [
      msg('assistant', 'Who is the model developer and model owner?', 'a1'),
    ];

    const suggested = selectSuggestedDemoMessage(messages, ANSWERS, formState);
    expect(suggested).toContain('Model Developer: Northstar Analytics');
    expect(suggested).toContain('Model Owner: Finance Controllership');
  });

  it('uses schema field matching when wording does not hit intent regex directly', () => {
    const customAnswers: DemoAnswerEntry[] = [
      {
        id: 'estimation',
        intents: ['estimation_technique'],
        text: 'Estimation technique answer',
      },
      {
        id: 'fallback',
        intents: ['fallback'],
        text: 'Fallback answer',
      },
    ];
    const messages: ChatMessage[] = [
      msg('assistant', 'What primary modeling method does this use?', 'a1'),
    ];

    const suggested = selectSuggestedDemoMessage(messages, customAnswers);
    expect(suggested).toBe('Estimation technique answer');
  });

  it('targets missing-field intents in batch mode when form state is provided', () => {
    const formState = getFreshFormState();
    formState.modelSummary.modelType = 'CECL/IFRS9';
    formState.modelSummary.estimationTechnique = 'Cash Flow Analysis';
    formState.modelSummary.modelDeveloper = 'Northstar Analytics';
    formState.modelSummary.modelOwner = 'Finance';
    formState.modelSummary.policyCoverage = '';

    const batch = buildRemainingDemoAnswerBatch([], ANSWERS, formState);
    expect(batch).toContain('Regulatory answer');
    expect(batch).toContain('Fallback answer one');
  });

  it('deduplicates duplicate answer text in batch mode', () => {
    const duplicatedAnswers: DemoAnswerEntry[] = [
      ...ANSWERS,
      {
        id: 'duplicate_regulatory',
        intents: ['regulatory_standards'],
        text: 'Regulatory answer',
      },
    ];

    const batch = buildRemainingDemoAnswerBatch([], duplicatedAnswers);
    const regulatoryCount = batch.filter((entry) => entry === 'Regulatory answer').length;

    expect(regulatoryCount).toBe(1);
  });
});
