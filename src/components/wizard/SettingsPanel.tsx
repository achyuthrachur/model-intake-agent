'use client';

import { useEffect, useRef } from 'react';
import anime from 'animejs/lib/anime.es.js';

import { useIntakeStore } from '@/stores/intake-store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, SlidersHorizontal } from 'lucide-react';
import { prefersReducedMotion } from '@/lib/anime-motion';
import type { AIModel, SessionMode } from '@/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const store = useIntakeStore();
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || prefersReducedMotion()) return;
    if (!backdropRef.current || !panelRef.current) return;

    anime.remove([backdropRef.current, panelRef.current]);
    anime({
      targets: backdropRef.current,
      opacity: [0, 1],
      duration: 220,
      easing: 'linear',
    });
    anime({
      targets: panelRef.current,
      opacity: [0, 1],
      translateX: [28, 0],
      duration: 380,
      easing: 'cubicBezier(0.22, 1, 0.36, 1)',
    });
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-[rgba(1,30,65,0.4)] backdrop-blur-[2px]"
        onClick={onClose}
      />

      <aside
        ref={panelRef}
        className="surface-card fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border/75"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="rounded-md border border-border/70 bg-muted p-1.5">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            </div>
            <h2 className="text-base font-bold text-foreground">Session Settings</h2>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="custom-scrollbar flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Bank Name</label>
            <Input
              value={store.bankName}
              onChange={(e) => store.setBankName(e.target.value)}
              placeholder="e.g., First National Bank"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Model</label>
            <Select
              value={store.selectedModel}
              onValueChange={(v) => store.setSelectedModel(v as AIModel)}
              disabled={store.sessionMode === 'mock'}
            >
              <SelectTrigger className={store.sessionMode === 'mock' ? 'opacity-60' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-5-chat-latest">GPT-5 Chat (Best Writing)</SelectItem>
                <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">Session Mode</label>
            <Select
              value={store.sessionMode}
              onValueChange={(value) => store.setSessionMode(value as SessionMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="live">Live (AI)</SelectItem>
                <SelectItem value="demo">Demo (AI + Prefill)</SelectItem>
                <SelectItem value="mock">Offline Mock (No AI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {store.sessionMode === 'mock' ? (
            <p className="rounded-lg border border-[var(--color-crowe-teal)]/25 bg-[var(--color-crowe-teal)]/12 px-3 py-2 text-xs text-[var(--color-crowe-teal-dark)] dark:text-[var(--color-crowe-teal-bright)]">
              Offline Mock uses deterministic sample data and bypasses internal AI routes.
            </p>
          ) : (
            <p className="rounded-lg border border-[var(--color-crowe-indigo-bright)]/20 bg-[var(--color-crowe-indigo-bright)]/10 px-3 py-2 text-xs text-[var(--color-crowe-indigo-core)] dark:text-[var(--color-crowe-cyan-bright)]">
              {store.sessionMode === 'demo'
                ? 'Demo mode runs real AI routes with scripted chat prefills and demo document loading.'
                : 'Live mode runs real AI routes with manual chat and manual document uploads.'}{' '}
              OPENAI_API_KEY must be configured server-side.
            </p>
          )}
        </div>

        <div className="border-t border-border/70 px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/10"
            onClick={() => {
              if (confirm('Reset all session data? This cannot be undone.')) {
                store.resetSession();
                onClose();
              }
            }}
          >
            Reset Session
          </Button>
        </div>
      </aside>
    </>
  );
}
