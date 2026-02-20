'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { processDocuments } from '@/lib/api-client';
import { loadDemoFiles } from '@/lib/demo-docs';
import { useAnimeStagger } from '@/lib/anime-motion';
import { DropZone } from '@/components/upload/DropZone';
import { FileList } from '@/components/upload/FileList';
import { CoverageAnalysisGrid } from '@/components/upload/CoverageAnalysis';
import { Button } from '@/components/ui/button';
import { Loader2, FileSearch, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';

export function StepUpload() {
  const sessionMode = useIntakeStore((s) => s.sessionMode);
  const uploadedFiles = useIntakeStore((s) => s.uploadedFiles);
  const coverageAnalysis = useIntakeStore((s) => s.coverageAnalysis);
  const applyFieldUpdates = useIntakeStore((s) => s.applyFieldUpdates);
  const addMessage = useIntakeStore((s) => s.addMessage);
  const addUploadedFile = useIntakeStore((s) => s.addUploadedFile);
  const updateFileStatus = useIntakeStore((s) => s.updateFileStatus);
  const removeUploadedFile = useIntakeStore((s) => s.removeUploadedFile);
  const setParsedDocuments = useIntakeStore((s) => s.setParsedDocuments);
  const setCoverageAnalysis = useIntakeStore((s) => s.setCoverageAnalysis);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingDemoFiles, setIsLoadingDemoFiles] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const autoProcessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const hasFiles = uploadedFiles.length > 0;
  const hasCoverage = coverageAnalysis !== null;

  const clearAutoProcessTimer = useCallback(() => {
    if (autoProcessTimeoutRef.current) {
      clearTimeout(autoProcessTimeoutRef.current);
      autoProcessTimeoutRef.current = null;
    }
  }, []);

  const handleProcessDocuments = useCallback(async () => {
    if (isProcessing) return;
    const latestState = useIntakeStore.getState();
    const currentFiles = latestState.uploadedFiles;
    if (currentFiles.length === 0) return;

    setIsProcessing(true);
    setProcessingError(null);

    // Set all files to processing status
    for (const file of currentFiles) {
      updateFileStatus(file.id, 'processing');
    }

    try {
      const config = {
        selectedModel: latestState.selectedModel,
        useMockData: latestState.sessionMode === 'mock',
      };

      const rawFiles = currentFiles.map((f) => f.file);
      const result = await processDocuments(config, rawFiles);

      // Store parsed documents
      setParsedDocuments(result.documents);

      // Store coverage analysis
      setCoverageAnalysis({
        overallCoverage: result.overallCoverage,
        gaps: result.gaps,
        prefillDiagnostics: result.prefillDiagnostics,
      });

      if (result.fieldUpdates.length > 0) {
        applyFieldUpdates(result.fieldUpdates);

        const remainingCount = useIntakeStore.getState().getUnfilledFields().length;
        const scalarFilled = result.prefillDiagnostics.scalarFieldsFilled;
        const tableRowsAdded = result.prefillDiagnostics.tableRowsAdded;
        const prefillSummary =
          tableRowsAdded > 0
            ? `${scalarFilled} scalar fields and ${tableRowsAdded} table row${tableRowsAdded === 1 ? '' : 's'}`
            : `${scalarFilled} scalar fields`;
        addMessage({
          id: `system-doc-prefill-${Date.now()}`,
          role: 'system',
          content: `Document prefill applied ${result.fieldUpdates.length} updates (${prefillSummary}). ${remainingCount} fields remain for intake follow-up.`,
          timestamp: Date.now(),
        });
      } else {
        addMessage({
          id: `system-doc-prefill-none-${Date.now()}`,
          role: 'system',
          content:
            'Documents were processed, but no high-confidence field values were extracted. The intake chat will collect remaining details.',
          timestamp: Date.now(),
        });
      }

      // Mark files parsed when returned by backend, otherwise keep as error for visibility.
      const parsedNames = new Set(result.documents.map((d) => d.filename.toLowerCase()));
      for (const file of currentFiles) {
        if (parsedNames.has(file.name.toLowerCase())) {
          updateFileStatus(file.id, 'parsed', 100);
        } else {
          updateFileStatus(file.id, 'error', 100);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document processing failed';
      setProcessingError(message);

      // Set all files to error status
      for (const file of currentFiles) {
        updateFileStatus(file.id, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [
    isProcessing,
    applyFieldUpdates,
    addMessage,
    setParsedDocuments,
    setCoverageAnalysis,
    updateFileStatus,
  ]);

  const queueAutoProcess = useCallback(() => {
    clearAutoProcessTimer();
    autoProcessTimeoutRef.current = setTimeout(() => {
      void handleProcessDocuments();
    }, 500);
  }, [clearAutoProcessTimer, handleProcessDocuments]);

  useEffect(() => {
    return () => clearAutoProcessTimer();
  }, [clearAutoProcessTimer]);

  useAnimeStagger(rootRef, [uploadedFiles.length, isProcessing, hasCoverage], '[data-reveal]', {
    delay: 60,
    duration: 430,
    y: 12,
  });

  const handleFilesAdded = useCallback((files: File[]) => {
    setProcessingError(null);

    // Reset previous processing outputs and rerun on latest upload set.
    setParsedDocuments([]);
    setCoverageAnalysis(null);

    for (const file of files) {
      const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      addUploadedFile({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      });

      // Lightweight upload status transition before processing.
      updateFileStatus(id, 'uploading', 50);
      setTimeout(() => {
        updateFileStatus(id, 'uploading', 100);
      }, 300);
    }

    queueAutoProcess();
  }, [
    addUploadedFile,
    queueAutoProcess,
    setParsedDocuments,
    setCoverageAnalysis,
    updateFileStatus,
  ]);

  const handleLoadDemoDocuments = useCallback(async () => {
    if (isLoadingDemoFiles || isProcessing) return;

    setIsLoadingDemoFiles(true);
    setProcessingError(null);

    try {
      const demoFiles = await loadDemoFiles();
      if (demoFiles.length === 0) {
        throw new Error('No demo documents were available to load.');
      }

      handleFilesAdded(demoFiles);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load demo documents';
      setProcessingError(message);
    } finally {
      setIsLoadingDemoFiles(false);
    }
  }, [handleFilesAdded, isLoadingDemoFiles, isProcessing]);

  return (
    <div
      ref={rootRef}
      className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-4 md:gap-5 md:px-6 md:py-6"
    >
      {/* Drop Zone */}
      <div data-reveal className="surface-card rounded-2xl p-4 md:p-5">
        {sessionMode === 'demo' && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-crowe-indigo-bright)]/20 bg-[var(--color-crowe-indigo-bright)]/8 px-3 py-2">
            <p className="text-xs text-[var(--color-crowe-indigo-core)] dark:text-[var(--color-crowe-cyan-bright)]">
              Demo mode: load the preloaded document set instantly.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={handleLoadDemoDocuments}
              disabled={isLoadingDemoFiles || isProcessing}
            >
              {isLoadingDemoFiles ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Load Demo Documents
                </>
              )}
            </Button>
          </div>
        )}
        <DropZone onFilesAdded={handleFilesAdded} />
      </div>

      {/* File List */}
      {hasFiles && (
        <div data-reveal className="surface-card rounded-2xl p-4 md:p-5">
          <FileList files={uploadedFiles} onRemove={(id) => removeUploadedFile(id)} />
        </div>
      )}

      {/* Process Documents Button */}
      {hasFiles && !hasCoverage && (
        <Button
          data-reveal
          onClick={handleProcessDocuments}
          disabled={isProcessing || isLoadingDemoFiles || uploadedFiles.length === 0}
          className="gap-2 bg-[var(--color-crowe-amber-core)] text-[var(--color-crowe-indigo-dark)] hover:bg-[var(--color-crowe-amber-bright)] disabled:opacity-40"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing Documents...
            </>
          ) : (
            <>
              <FileSearch className="h-4 w-4" />
              Process Documents
            </>
          )}
        </Button>
      )}

      {/* Processing Error */}
      {processingError && (
        <div
          data-reveal
          className="flex items-start gap-3 rounded-xl border border-destructive/35 bg-destructive/8 px-4 py-3"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex flex-1 flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Processing Error</p>
            <p className="text-xs text-muted-foreground">{processingError}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={handleProcessDocuments}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isProcessing && (
        <div data-reveal className="surface-card flex flex-col gap-3 rounded-2xl p-4 md:p-5">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-2 rounded-lg border border-border/70 p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-4 w-4 animate-pulse rounded-full bg-muted" />
                <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coverage Analysis Grid */}
      {hasCoverage && coverageAnalysis && (
        <div data-reveal className="surface-card rounded-2xl p-4 md:p-5">
          <CoverageAnalysisGrid coverage={coverageAnalysis} />
        </div>
      )}

      {/* Gap warnings section */}
      {hasCoverage && coverageAnalysis && coverageAnalysis.gaps.length > 0 && (
        <div data-reveal className="surface-muted rounded-xl px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Gaps identified above will be flagged in the generated report. You can address
            them by uploading additional documents or providing information during the
            intake interview in Step 2.
          </p>
        </div>
      )}
    </div>
  );
}

