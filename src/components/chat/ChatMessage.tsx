'use client';

import type { ChatMessage as ChatMessageType } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  // System messages
  if (message.role === 'system') {
    return (
      <div className="flex justify-center px-4 py-2">
        <p className="text-center text-xs italic text-muted-foreground">
          {message.content}
        </p>
      </div>
    );
  }

  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser
            ? 'bg-[var(--color-crowe-indigo-dark)] text-white'
            : 'bg-[var(--color-crowe-teal)]/15 text-[var(--color-crowe-teal)]'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={`flex max-w-[80%] flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`}
      >
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-[var(--color-crowe-amber-core)]/10 text-foreground'
              : 'border border-border bg-card text-foreground'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Field update badges */}
        {message.fieldUpdates && message.fieldUpdates.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.fieldUpdates.map((update, idx) => (
              <Badge
                key={`${update.section}-${update.field}-${idx}`}
                variant="secondary"
                className="gap-1 bg-[var(--color-crowe-teal)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-crowe-teal-dark)]"
              >
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-crowe-teal)]" />
                {formatFieldName(update.field)} updated
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Convert snake_case or camelCase field name to human-readable form.
 */
function formatFieldName(field: string): string {
  return field
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
