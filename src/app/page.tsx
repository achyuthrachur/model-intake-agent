'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useIntakeStore } from '@/stores/intake-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Brain,
  FileText,
  Shield,
  Sun,
  Moon,
  ArrowRight,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import type { AIModel } from '@/types';

export default function LandingPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const store = useIntakeStore();
  const [showApiKey, setShowApiKey] = useState(false);

  const handleStart = () => {
    if (!store.bankName.trim()) return;
    router.push('/intake');
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="fixed right-6 top-6 z-50 rounded-full border border-border bg-card p-2.5 transition-colors hover:bg-accent"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      {/* Hero background accent */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-[600px] w-[600px] rounded-full bg-[var(--color-crowe-amber-core)] opacity-[0.04] blur-3xl" />
        <div className="absolute -bottom-20 -left-40 h-[400px] w-[400px] rounded-full bg-[var(--color-crowe-indigo-bright)] opacity-[0.06] blur-3xl" />
      </div>

      <div className="relative z-10 flex w-full max-w-xl flex-col items-center gap-10 px-6 py-16">
        {/* Branding */}
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Model Intake Portal
            </h1>
          </div>
          <p className="max-w-md text-base text-muted-foreground">
            AI-powered model documentation for Model Risk Management. Streamline your
            intake interviews, document analysis, and report generation.
          </p>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2">
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Brain className="h-3.5 w-3.5" />
            AI-Guided Interview
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <FileText className="h-3.5 w-3.5" />
            Document Analysis
          </Badge>
          <Badge variant="secondary" className="gap-1.5 px-3 py-1">
            <Shield className="h-3.5 w-3.5" />
            Regulatory Compliant
          </Badge>
        </div>

        {/* Config panel */}
        <div className="w-full rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-5">
            {/* Bank Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Bank Name <span className="text-destructive">*</span>
              </label>
              <Input
                placeholder="e.g., First National Bank"
                value={store.bankName}
                onChange={(e) => store.setBankName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Used in document headers and cover pages
              </p>
            </div>

            {/* n8n Instance URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                n8n Instance URL
              </label>
              <Input
                placeholder="http://localhost:5678"
                value={store.n8nBaseUrl}
                onChange={(e) => store.setN8nBaseUrl(e.target.value)}
                disabled={store.useMockData}
                className={store.useMockData ? 'opacity-50' : ''}
              />
            </div>

            {/* OpenAI API Key */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                OpenAI API Key
              </label>
              <div className="relative">
                <Input
                  type={showApiKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={store.openaiApiKey}
                  onChange={(e) => store.setApiKey(e.target.value)}
                  disabled={store.useMockData}
                  className={`pr-10 ${store.useMockData ? 'opacity-50' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!store.useMockData && store.openaiApiKey && !store.openaiApiKey.startsWith('sk-') && (
              <p className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="h-3 w-3" />
                API key should start with &quot;sk-&quot;
              </p>
            )}

            {/* Model + Mock mode row */}
            <div className="flex items-end gap-4">
              <div className="flex flex-1 flex-col gap-1.5">
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

              <div className="flex items-center gap-2 pb-1">
                <button
                  onClick={() => store.setUseMockData(!store.useMockData)}
                  className={`relative h-6 w-11 rounded-full transition-colors ${
                    store.useMockData
                      ? 'bg-[var(--color-crowe-teal)]'
                      : 'bg-border'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      store.useMockData ? 'translate-x-[22px]' : 'translate-x-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-muted-foreground">Mock Mode</span>
              </div>
            </div>

            {store.useMockData && (
              <p className="rounded-md bg-[var(--color-crowe-teal)]/10 px-3 py-2 text-xs text-[var(--color-crowe-teal-dark)]">
                Mock mode enabled — all AI responses use realistic pre-built data. No n8n instance or API key required.
              </p>
            )}
          </div>
        </div>

        {/* Start button */}
        <Button
          size="lg"
          onClick={handleStart}
          disabled={!store.bankName.trim()}
          className="gap-2 bg-[var(--color-crowe-amber-core)] px-8 text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)] disabled:opacity-40"
        >
          Start Intake
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
