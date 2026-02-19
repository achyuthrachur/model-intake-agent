'use client';

import { useState, useRef, useCallback } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { generateReport } from '@/lib/api-client';
import { useAnimeStagger } from '@/lib/anime-motion';
import { ReportPreview } from '@/components/report/ReportPreview';
import { ExportControls } from '@/components/report/ExportControls';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText, RefreshCw } from 'lucide-react';
import type { AIModel } from '@/types';

const TOTAL_SECTIONS = 7;

export function StepGenerate() {
  const store = useIntakeStore();
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const isGenerating = store.reportStatus === 'generating';
  const isComplete = store.reportStatus === 'complete';
  const progressPercent = isGenerating
    ? Math.round((store.currentGeneratingSection / TOTAL_SECTIONS) * 100)
    : isComplete
      ? 100
      : 0;

  const cleanupInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useAnimeStagger(rootRef, [store.reportStatus, store.currentGeneratingSection, error], '[data-reveal]', {
    delay: 60,
    duration: 440,
    y: 12,
  });

  const handleGenerate = async () => {
    setError(null);
    store.setReportStatus('generating');
    store.setCurrentGeneratingSection(0);

    // Simulate section-by-section progress
    let currentSection = 0;
    intervalRef.current = setInterval(() => {
      currentSection += 1;
      if (currentSection <= TOTAL_SECTIONS) {
        store.setCurrentGeneratingSection(currentSection);
      }
    }, 400);

    try {
      const config = {
        selectedModel: store.selectedModel,
        useMockData: store.sessionMode === 'mock',
      };

      const report = await generateReport(
        config,
        store.formData,
        store.parsedDocuments,
        store.bankName,
      );

      cleanupInterval();
      store.setCurrentGeneratingSection(TOTAL_SECTIONS);
      store.setGeneratedReport(report);
      store.setReportStatus('complete');
    } catch (err) {
      cleanupInterval();
      const message = err instanceof Error ? err.message : 'Report generation failed';
      setError(message);
      store.setReportStatus('error');
    }
  };

  return (
    <div
      ref={rootRef}
      className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-6"
    >
      {/* Model Selector */}
      <div data-reveal className="surface-card flex flex-col gap-1.5 rounded-2xl p-4 md:p-5">
        <label className="text-sm font-medium text-foreground">AI Model</label>
        <Select
          value={store.selectedModel}
          onValueChange={(v) => store.setSelectedModel(v as AIModel)}
          disabled={isGenerating || store.sessionMode === 'mock'}
        >
          <SelectTrigger
            className={`w-48 ${store.sessionMode === 'mock' ? 'opacity-60' : ''}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">GPT-4o</SelectItem>
            <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Generate Button */}
      {!isComplete && (
        <Button
          data-reveal
          onClick={handleGenerate}
          disabled={isGenerating}
          className="gap-2 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)] disabled:opacity-40"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate Document
            </>
          )}
        </Button>
      )}

      {/* Progress Bar */}
      {isGenerating && (
        <div data-reveal className="surface-card flex flex-col gap-2 rounded-2xl p-4 md:p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Generating Section {store.currentGeneratingSection} of {TOTAL_SECTIONS}
            </span>
            <span>{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} />
        </div>
      )}

      {/* Loading Skeleton */}
      {isGenerating && (
        <div data-reveal className="surface-card flex flex-col gap-4 rounded-2xl p-6">
          <div className="h-6 w-2/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/4 animate-pulse rounded bg-muted" />
          <div className="my-2 h-px bg-border" />
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          data-reveal
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/6 px-4 py-3"
        >
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-destructive">Generation Error</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleGenerate}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Report Preview + Export Controls */}
      {isComplete && store.generatedReport && (
        <>
          <div data-reveal className="surface-card rounded-2xl p-4 md:p-5">
            <ExportControls report={store.generatedReport} />
          </div>
          <div data-reveal className="surface-card rounded-2xl p-4 md:p-5">
            <ReportPreview report={store.generatedReport} />
          </div>
        </>
      )}
    </div>
  );
}

