'use client';

import { useRef, useState, useCallback, type KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    // Max 4 rows (~80px for text-sm with leading)
    const maxHeight = 96;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    // Reset textarea height after clearing
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    });
  }, [value, disabled, onSend]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const isSendDisabled = disabled || value.trim().length === 0;

  return (
    <div className="surface-muted flex items-end gap-2 border-t border-border/70 px-4 py-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          adjustHeight();
        }}
        onKeyDown={handleKeyDown}
        placeholder="Describe your model or answer the AI's questions..."
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-xl border border-input/80 bg-background/85 px-3 py-2 text-sm leading-relaxed placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] transition-[background-color,border-color,box-shadow] duration-200 ease-out focus-visible:border-ring focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35 focus-visible:shadow-[var(--ring-glow)] disabled:cursor-not-allowed disabled:opacity-50"
        style={{ minHeight: '40px', maxHeight: '96px' }}
      />
      <Button
        onClick={handleSend}
        disabled={isSendDisabled}
        size="icon"
        className="h-10 w-10 shrink-0 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)] disabled:opacity-40"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}
