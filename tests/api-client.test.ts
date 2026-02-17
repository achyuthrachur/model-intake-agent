import {
  buildGenerateReportPayload,
  buildIntakeChatPayload,
  normalizeChatApiResponse,
  sendChatMessage,
} from '@/lib/api-client';
import { useIntakeStore } from '@/stores/intake-store';
import type { ClientConfig } from '@/lib/api-client';

function getBaseConfig(): ClientConfig {
  return {
    selectedModel: 'gpt-4o',
    useMockData: false,
  };
}

function getFreshFormState() {
  const state = useIntakeStore.getState();
  state.resetSession();
  return structuredClone(useIntakeStore.getState().formData);
}

describe('api client helpers', () => {
  it('builds intake-chat payload with model', () => {
    const formState = getFreshFormState();
    const payload = buildIntakeChatPayload(getBaseConfig(), 'hello', [], formState);

    expect(payload.message).toBe('hello');
    expect(payload.model).toBe('gpt-4o');
    expect(payload.unfilledFields.length).toBeGreaterThan(0);
  });

  it('normalizes strict chat response contract', () => {
    const normalized = normalizeChatApiResponse({
      aiReply: 'Captured. <<<FIELD_UPDATE>>>{"section":"model_summary","field":"model_type","value":"Credit Risk"}<<<END_FIELD_UPDATE>>>',
      fieldUpdates: [
        { section: 'model_summary', field: 'risk_rating', value: 'Tier 1 (Critical)' },
      ],
    });

    expect(normalized.aiReply).toBe('Captured.');
    expect(normalized.fieldUpdates).toHaveLength(2);
  });

  it('throws when strict response contract is violated', () => {
    expect(() => normalizeChatApiResponse({})).toThrow(
      'Invalid intake-chat response',
    );
  });

  it('builds generate-report payload with model passthrough', () => {
    const formState = getFreshFormState();
    const payload = buildGenerateReportPayload(getBaseConfig(), formState, [], 'Acme Bank');
    expect(payload.bankName).toBe('Acme Bank');
    expect(payload.model).toBe('gpt-4o');
  });
});

describe('sendChatMessage', () => {
  it('posts strict payload and returns normalized response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          aiReply:
            'Thanks. <<<FIELD_UPDATE>>>{"section":"model_summary","field":"model_type","value":"Credit Risk"}<<<END_FIELD_UPDATE>>>',
          fieldUpdates: [],
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const formState = getFreshFormState();
    const result = await sendChatMessage(getBaseConfig(), 'hello', [], formState);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/intake-chat');
    expect(init.method).toBe('POST');

    const body = JSON.parse(String(init.body));
    expect(body.model).toBe('gpt-4o');
    expect(Array.isArray(body.unfilledFields)).toBe(true);
    expect(result.aiReply).toBe('Thanks.');
    expect(result.fieldUpdates).toHaveLength(1);
  });
});

