'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { sendChatMessage } from '@/lib/api-client';
import { loadDemoAnswers, selectSuggestedDemoMessage, type DemoAnswerEntry } from '@/lib/demo-answers';
import { useAnimeStagger } from '@/lib/anime-motion';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { IntakeFormPanel } from '@/components/intake-form/IntakeFormPanel';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { ChatMessage } from '@/types';

const INITIAL_GREETING: ChatMessage = {
  id: 'greeting-1',
  role: 'assistant',
  content:
    "Hello! I'm your AI assistant for the model intake process. I'll help you document your model by asking targeted questions about its design, data, performance, and governance.\n\nLet's start with the basics. Can you tell me the name and type of the model you're documenting? For example, is it a credit risk model, a pricing model, an ALM model, or something else?",
  timestamp: Date.now(),
};

export function StepIntake() {
  const store = useIntakeStore();
  const lastUserMessageRef = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const [demoAnswers, setDemoAnswers] = useState<DemoAnswerEntry[]>([]);

  useAnimeStagger(rootRef, [store.messages.length, store.isStreaming], '[data-reveal]', {
    delay: 60,
    duration: 440,
    y: 14,
  });

  // Add initial greeting on mount if no messages exist
  useEffect(() => {
    if (store.messages.length === 0) {
      store.addMessage(INITIAL_GREETING);
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

  const handleSend = useCallback(
    async (text: string) => {
      // 1. Add user message to store
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      store.addMessage(userMessage);
      lastUserMessageRef.current = text;

      // 2. Set streaming state
      store.setIsStreaming(true);

      try {
        // 3. Call sendChatMessage with config from store
        const config = {
          selectedModel: store.selectedModel,
          useMockData: store.sessionMode === 'mock',
        };

        const response = await sendChatMessage(
          config,
          text,
          store.messages,
          store.formData,
        );

        // 4. Add AI response to store with fieldUpdates
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: response.aiReply,
          timestamp: Date.now(),
          fieldUpdates: response.fieldUpdates,
        };
        store.addMessage(assistantMessage);

        // 5. Apply field updates
        if (response.fieldUpdates.length > 0) {
          store.applyFieldUpdates(response.fieldUpdates);
        }
      } catch (error) {
        // Add error message as system message with retry hint
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response.'} Use the retry button below to try again.`,
          timestamp: Date.now(),
        };
        store.addMessage(errorMessage);
      } finally {
        // 6. Set streaming false
        store.setIsStreaming(false);

        // 7. Clear recent updates after 3 seconds
        setTimeout(() => {
          store.clearRecentUpdates();
        }, 3000);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      store.selectedModel,
      store.sessionMode,
      store.messages,
      store.formData,
    ],
  );

  const lastMessageIsError =
    store.messages.length > 0 && store.messages[store.messages.length - 1].role === 'system';
  const suggestedMessage =
    store.sessionMode === 'demo'
      ? selectSuggestedDemoMessage(store.messages, demoAnswers)
      : undefined;

  const handleRetry = () => {
    if (lastUserMessageRef.current) {
      handleSend(lastUserMessageRef.current);
    }
  };

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
            <Button variant="outline" size="sm" className="gap-2" onClick={handleRetry}>
              <RefreshCw className="h-3.5 w-3.5" />
              Retry Last Message
            </Button>
          </div>
        )}
        <ChatInput
          onSend={handleSend}
          disabled={store.isStreaming}
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

