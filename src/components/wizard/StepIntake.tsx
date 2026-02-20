'use client';

import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { getUnfilledFields, sendChatMessage } from '@/lib/api-client';
import {
  buildRemainingDemoAnswerBatch,
  loadDemoAnswers,
  selectSuggestedDemoMessage,
  type DemoAnswerEntry,
} from '@/lib/demo-answers';
import { INTAKE_SCHEMA } from '@/lib/intake-schema';
import { useAnimeStagger } from '@/lib/anime-motion';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { IntakeFormPanel } from '@/components/intake-form/IntakeFormPanel';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { ChatMessage, IntakeFormState } from '@/types';

const CHAT_REQUEST_TIMEOUT_MS = 45000;

const FIELD_PROMPT_BY_PATH = new Map<string, string>(
  INTAKE_SCHEMA.flatMap((section) =>
    section.fields.map((field) => [`${section.id}.${field.name}`, field.aiHint ?? field.label] as const),
  ),
);

const TOTAL_FIELD_COUNT = INTAKE_SCHEMA.reduce((sum, section) => sum + section.fields.length, 0);

function buildInitialGreeting(formData: IntakeFormState): string {
  const unfilledFields = getUnfilledFields(formData);
  const filledCount = Math.max(TOTAL_FIELD_COUNT - unfilledFields.length, 0);

  if (unfilledFields.length === 0) {
    return "I reviewed the uploaded documents and all tracked intake fields are already populated. If you want, I can help refine wording or add context before you generate the report.";
  }

  const firstPrompt =
    FIELD_PROMPT_BY_PATH.get(unfilledFields[0]) ??
    'Could you share the next missing detail so I can complete the intake form?';
  const normalizedPrompt = firstPrompt.trim().endsWith('?') ? firstPrompt.trim() : `${firstPrompt.trim()}?`;

  if (filledCount > 0) {
    return `I reviewed the uploaded documents and pre-filled ${filledCount} of ${TOTAL_FIELD_COUNT} intake fields. I will only ask about remaining gaps.\n\nFirst question: ${normalizedPrompt}`;
  }

  return `I could not prefill many fields from documents, so I will guide the intake questions manually.\n\nFirst question: ${normalizedPrompt}`;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Chat request timed out after ${Math.round(timeoutMs / 1000)}s`));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

export function StepIntake() {
  const store = useIntakeStore();
  const lastUserMessageRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [demoAnswers, setDemoAnswers] = useState<DemoAnswerEntry[]>([]);
  const [isBatchFilling, setIsBatchFilling] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ completed: number; total: number } | null>(null);

  useAnimeStagger(rootRef, [store.messages.length, store.isStreaming], '[data-reveal]', {
    delay: 60,
    duration: 440,
    y: 14,
  });

  // Add a context-aware opening question when no assistant prompt exists yet.
  useEffect(() => {
    const hasAssistantPrompt = store.messages.some((message) => message.role === 'assistant');
    if (!hasAssistantPrompt) {
      store.addMessage({
        id: `greeting-${Date.now()}`,
        role: 'assistant',
        content: buildInitialGreeting(store.formData),
        timestamp: Date.now(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (store.sessionMode !== 'demo') {
      return () => {
        cancelled = true;
      };
    }

    void loadDemoAnswers()
      .then((answers) => {
        if (!cancelled) {
          setDemoAnswers(answers);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDemoAnswers([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [store.sessionMode]);

  const sendIntakeReply = useCallback(
    async (text: string, options?: { deferRecentUpdateClear?: boolean }): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;

      const stateBeforeSend = useIntakeStore.getState();
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };
      store.addMessage(userMessage);
      lastUserMessageRef.current = trimmed;

      store.setIsStreaming(true);

      try {
        const config = {
          selectedModel: stateBeforeSend.selectedModel,
          useMockData: stateBeforeSend.sessionMode === 'mock',
        };

        const response = await withTimeout(
          sendChatMessage(
            config,
            trimmed,
            stateBeforeSend.messages,
            stateBeforeSend.formData,
          ),
          CHAT_REQUEST_TIMEOUT_MS,
        );

        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.aiReply,
          timestamp: Date.now(),
          fieldUpdates: response.fieldUpdates,
        };
        store.addMessage(assistantMessage);

        if (response.fieldUpdates.length > 0) {
          store.applyFieldUpdates(response.fieldUpdates);
        }

        return true;
      } catch (error) {
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response.'} Use the retry button below to try again.`,
          timestamp: Date.now(),
        };
        store.addMessage(errorMessage);
        return false;
      } finally {
        store.setIsStreaming(false);

        if (!options?.deferRecentUpdateClear) {
          setTimeout(() => {
            useIntakeStore.getState().clearRecentUpdates();
          }, 3000);
        }
      }
    },
    [store],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (isBatchFilling) return;
      await sendIntakeReply(text);
    },
    [isBatchFilling, sendIntakeReply],
  );

  const lastMessageIsError =
    store.messages.length > 0 && store.messages[store.messages.length - 1].role === 'system';
  const suggestedMessage =
    store.sessionMode === 'demo'
      ? selectSuggestedDemoMessage(store.messages, demoAnswers)
      : undefined;
  const remainingDemoReplies = useMemo(
    () =>
      store.sessionMode === 'demo'
        ? buildRemainingDemoAnswerBatch(store.messages, demoAnswers)
        : [],
    [store.sessionMode, store.messages, demoAnswers],
  );
  const fullDemoReplies = useMemo(
    () => (store.sessionMode === 'demo' ? buildRemainingDemoAnswerBatch([], demoAnswers) : []),
    [store.sessionMode, demoAnswers],
  );
  const batchCandidates = remainingDemoReplies.length > 0 ? remainingDemoReplies : fullDemoReplies;

  const handleRetry = () => {
    if (isBatchFilling) return;
    if (lastUserMessageRef.current) {
      void handleSend(lastUserMessageRef.current);
    }
  };

  const handleBatchFillRemaining = useCallback(async () => {
    if (store.sessionMode !== 'demo') return;
    if (store.isStreaming || isBatchFilling) return;
    if (batchCandidates.length === 0) return;

    setIsBatchFilling(true);
    setBatchProgress({ completed: 0, total: batchCandidates.length });
    let failures = 0;

    try {
      for (let idx = 0; idx < batchCandidates.length; idx += 1) {
        if (useIntakeStore.getState().sessionMode !== 'demo') {
          break;
        }

        const success = await sendIntakeReply(batchCandidates[idx], {
          deferRecentUpdateClear: true,
        });
        setBatchProgress({ completed: idx + 1, total: batchCandidates.length });

        if (!success) {
          failures += 1;
        }
      }
    } finally {
      if (failures > 0) {
        store.addMessage({
          id: `system-batch-fill-${Date.now()}`,
          role: 'system',
          content: `Batch fill completed with ${failures} failed request(s). You can click the batch button again to continue.`,
          timestamp: Date.now(),
        });
      }
      setIsBatchFilling(false);
      setTimeout(() => {
        useIntakeStore.getState().clearRecentUpdates();
      }, 3000);
    }
  }, [
    store,
    store.sessionMode,
    store.isStreaming,
    isBatchFilling,
    batchCandidates,
    sendIntakeReply,
  ]);

  return (
    <div
      ref={rootRef}
      className="grid h-[calc(100vh-148px)] grid-cols-1 gap-3 px-3 py-3 lg:grid-cols-[54fr_46fr]"
    >
      {/* Left panel: Chat */}
      <div data-reveal className="surface-card flex min-h-0 flex-col overflow-hidden rounded-2xl">
        <div className="min-h-0 flex-1">
          <ChatWindow messages={store.messages} isStreaming={store.isStreaming} />
        </div>
        {lastMessageIsError && !store.isStreaming && (
          <div className="flex justify-center border-t border-border/70 bg-destructive/6 py-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={handleRetry}
              disabled={isBatchFilling}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Last Message
            </Button>
          </div>
        )}
        {store.sessionMode === 'demo' && (
          <div className="flex items-center justify-between gap-3 border-t border-border/70 bg-muted/35 px-4 py-2">
            <p className="text-[11px] text-muted-foreground">
              {isBatchFilling && batchProgress
                ? `Batch filling demo answers (${batchProgress.completed}/${batchProgress.total})`
                : 'Demo shortcut: use suggested replies or batch-fill all remaining answers.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBatchFillRemaining}
              disabled={store.isStreaming || isBatchFilling || batchCandidates.length === 0}
            >
              {isBatchFilling
                ? 'Batch Filling...'
                : remainingDemoReplies.length > 0
                  ? 'Batch Fill Remaining'
                  : 'Batch Fill Again'}
            </Button>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={store.isStreaming || isBatchFilling}
          suggestedMessage={suggestedMessage}
        />
      </div>

      {/* Right panel: Intake Form */}
      <div data-reveal className="surface-card min-h-0 overflow-hidden rounded-2xl">
        <IntakeFormPanel />
      </div>
    </div>
  );
}
