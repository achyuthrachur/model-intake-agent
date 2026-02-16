'use client';

import { useEffect, useCallback } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { sendChatMessage } from '@/lib/n8n-client';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { IntakeFormPanel } from '@/components/intake-form/IntakeFormPanel';
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

  // Add initial greeting on mount if no messages exist
  useEffect(() => {
    if (store.messages.length === 0) {
      store.addMessage(INITIAL_GREETING);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      // 2. Set streaming state
      store.setIsStreaming(true);

      try {
        // 3. Call sendChatMessage with config from store
        const config = {
          n8nBaseUrl: store.n8nBaseUrl,
          openaiApiKey: store.openaiApiKey,
          selectedModel: store.selectedModel,
          useMockData: store.useMockData,
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
        // Add error message as system message
        const errorMessage: ChatMessage = {
          id: `error-${Date.now()}`,
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'Failed to get AI response. Please try again.'}`,
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
      store.n8nBaseUrl,
      store.openaiApiKey,
      store.selectedModel,
      store.useMockData,
      store.messages,
      store.formData,
    ],
  );

  return (
    <div className="grid h-[calc(100vh-140px)] grid-cols-[55fr_45fr] gap-0">
      {/* Left panel: Chat */}
      <div className="flex flex-col border-r border-border">
        <div className="min-h-0 flex-1">
          <ChatWindow messages={store.messages} isStreaming={store.isStreaming} />
        </div>
        <ChatInput onSend={handleSend} disabled={store.isStreaming} />
      </div>

      {/* Right panel: Intake Form */}
      <div className="min-h-0 overflow-auto">
        <IntakeFormPanel />
      </div>
    </div>
  );
}
