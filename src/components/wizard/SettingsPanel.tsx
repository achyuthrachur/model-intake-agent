'use client';

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
import { X } from 'lucide-react';
import type { AIModel } from '@/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const store = useIntakeStore();

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-sm flex-col border-l border-border bg-card shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold text-foreground">Settings</h2>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          {/* Bank Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Bank Name</label>
            <Input
              value={store.bankName}
              onChange={(e) => store.setBankName(e.target.value)}
              placeholder="e.g., First National Bank"
            />
          </div>

          {/* Model */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground">Model</label>
            <Select
              value={store.selectedModel}
              onValueChange={(v) => store.setSelectedModel(v as AIModel)}
              disabled={store.useMockData}
            >
              <SelectTrigger className={store.useMockData ? 'opacity-50' : ''}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mock Mode */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Mock Mode</span>
            <button
              onClick={() => store.setUseMockData(!store.useMockData)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                store.useMockData ? 'bg-[var(--color-crowe-teal)]' : 'bg-border'
              }`}
            >
              <div
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                  store.useMockData ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          {store.useMockData && (
            <p className="rounded-md bg-[var(--color-crowe-teal)]/10 px-3 py-2 text-xs text-[var(--color-crowe-teal-dark)] dark:text-[var(--color-crowe-teal-bright)]">
              Mock mode enabled. Internal API routes are bypassed and deterministic test data is used.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-destructive hover:bg-destructive/5"
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
      </div>
    </>
  );
}
