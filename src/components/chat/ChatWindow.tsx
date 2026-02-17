'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';
import { ScrollArea } from '@/components/ui/scroll-area';
import { prefersReducedMotion } from '@/lib/anime-motion';
import { ChatMessage } from '@/components/chat/ChatMessage';
import type { ChatMessage as ChatMessageType } from '@/types';
import { Bot } from 'lucide-react';

interface ChatWindowProps {
  messages: ChatMessageType[];
  isStreaming: boolean;
}

export function ChatWindow({ messages, isStreaming }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive or streaming starts
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  useEffect(() => {
    if (prefersReducedMotion() || !listRef.current) return;
    if (messages.length <= prevLengthRef.current) {
      prevLengthRef.current = messages.length;
      return;
    }

    const latest = listRef.current.querySelector('[data-chat-message]:last-of-type');
    if (!latest) {
      prevLengthRef.current = messages.length;
      return;
    }

    anime.remove(latest);
    anime({
      targets: latest,
      opacity: [0, 1],
      translateY: [10, 0],
      duration: 360,
      easing: 'cubicBezier(0.22, 1, 0.36, 1)',
    });
    prevLengthRef.current = messages.length;
  }, [messages]);

  return (
    <ScrollArea className="custom-scrollbar h-full">
      <div ref={listRef} className="flex flex-col px-2 py-2">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isStreaming && (
          <div className="flex gap-3 px-4 py-3">
            <div className="soft-breathe flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-crowe-teal)]/25 bg-[var(--color-crowe-teal)]/15 text-[var(--color-crowe-teal)]">
              <Bot className="h-4 w-4" />
            </div>
            <div className="surface-panel flex items-center rounded-xl px-4 py-2.5">
              <div className="flex gap-1">
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="inline-block h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  );
}
