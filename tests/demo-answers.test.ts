import { selectSuggestedDemoMessage, type DemoAnswerEntry } from '@/lib/demo-answers';
import type { ChatMessage } from '@/types';

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
});
