'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { processDocuments } from '@/lib/api-client';
import { DropZone } from '@/components/upload/DropZone';
import { FileList } from '@/components/upload/FileList';
import { CoverageAnalysisGrid } from '@/components/upload/CoverageAnalysis';
import { Button } from '@/components/ui/button';
import { Loader2, FileSearch, AlertTriangle, RefreshCw } from 'lucide-react';

export function StepUpload() {
  const uploadedFiles = useIntakeStore((s) => s.uploadedFiles);
  const coverageAnalysis = useIntakeStore((s) => s.coverageAnalysis);
  const addUploadedFile = useIntakeStore((s) => s.addUploadedFile);
  const updateFileStatus = useIntakeStore((s) => s.updateFileStatus);
  const removeUploadedFile = useIntakeStore((s) => s.removeUploadedFile);
  const setParsedDocuments = useIntakeStore((s) => s.setParsedDocuments);
  const setCoverageAnalysis = useIntakeStore((s) => s.setCoverageAnalysis);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const autoProcessTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        useMockData: latestState.useMockData,
      };

      const rawFiles = currentFiles.map((f) => f.file);
      const result = await processDocuments(config, rawFiles);

      // Store parsed documents
      setParsedDocuments(result.documents);

      // Store coverage analysis
      setCoverageAnalysis({
        overallCoverage: result.overallCoverage,
        gaps: result.gaps,
      });

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

  const handleFilesAdded = (files: File[]) => {
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
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-6">
      {/* Drop Zone */}
      <DropZone onFilesAdded={handleFilesAdded} />

      {/* File List */}
      {hasFiles && (
        <FileList
          files={uploadedFiles}
          onRemove={(id) => removeUploadedFile(id)}
        />
      )}

      {/* Process Documents Button */}
      {hasFiles && !hasCoverage && (
        <Button
          onClick={handleProcessDocuments}
          disabled={isProcessing || uploadedFiles.length === 0}
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
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
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
        <div className="flex flex-col gap-3">
          <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
          <div className="flex flex-col gap-2 rounded-lg border border-border p-4">
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
        <CoverageAnalysisGrid coverage={coverageAnalysis} />
      )}

      {/* Gap warnings section */}
      {hasCoverage && coverageAnalysis && coverageAnalysis.gaps.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground">
            Gaps identified above will be flagged in the generated report. You can address
            them by uploading additional documents or providing information during the
            intake interview in Step 1.
          </p>
        </div>
      )}
    </div>
  );
}

