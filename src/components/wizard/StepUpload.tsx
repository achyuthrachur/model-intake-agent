'use client';

import { useState } from 'react';
import { useIntakeStore } from '@/stores/intake-store';
import { processDocuments } from '@/lib/n8n-client';
import { DropZone } from '@/components/upload/DropZone';
import { FileList } from '@/components/upload/FileList';
import { CoverageAnalysisGrid } from '@/components/upload/CoverageAnalysis';
import { Button } from '@/components/ui/button';
import { Loader2, FileSearch, AlertTriangle } from 'lucide-react';

export function StepUpload() {
  const store = useIntakeStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  const hasFiles = store.uploadedFiles.length > 0;
  const hasCoverage = store.coverageAnalysis !== null;

  const handleFilesAdded = (files: File[]) => {
    for (const file of files) {
      const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      store.addUploadedFile({
        id,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'uploading',
        progress: 0,
      });

      // Simulate upload progress (instant since mock)
      store.updateFileStatus(id, 'uploading', 50);

      // Simulate completion
      setTimeout(() => {
        store.updateFileStatus(id, 'parsed', 100);
      }, 300);
    }
  };

  const handleProcessDocuments = async () => {
    setIsProcessing(true);
    setProcessingError(null);

    // Set all files to processing status
    for (const file of store.uploadedFiles) {
      store.updateFileStatus(file.id, 'processing');
    }

    try {
      const config = {
        n8nBaseUrl: store.n8nBaseUrl,
        openaiApiKey: store.openaiApiKey,
        selectedModel: store.selectedModel,
        useMockData: store.useMockData,
      };

      const rawFiles = store.uploadedFiles.map((f) => f.file);
      const result = await processDocuments(config, rawFiles);

      // Store parsed documents
      store.setParsedDocuments(result.documents);

      // Store coverage analysis
      store.setCoverageAnalysis({
        overallCoverage: result.overallCoverage,
        gaps: result.gaps,
      });

      // Set all files back to parsed
      for (const file of store.uploadedFiles) {
        store.updateFileStatus(file.id, 'parsed', 100);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document processing failed';
      setProcessingError(message);

      // Set all files to error status
      for (const file of store.uploadedFiles) {
        store.updateFileStatus(file.id, 'error');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Drop Zone */}
      <DropZone onFilesAdded={handleFilesAdded} />

      {/* File List */}
      {hasFiles && (
        <FileList
          files={store.uploadedFiles}
          onRemove={(id) => store.removeUploadedFile(id)}
        />
      )}

      {/* Process Documents Button */}
      {hasFiles && !hasCoverage && (
        <Button
          onClick={handleProcessDocuments}
          disabled={isProcessing || store.uploadedFiles.length === 0}
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
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">Processing Error</p>
            <p className="text-xs text-muted-foreground">{processingError}</p>
          </div>
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
      {hasCoverage && store.coverageAnalysis && (
        <CoverageAnalysisGrid coverage={store.coverageAnalysis} />
      )}

      {/* Gap warnings section */}
      {hasCoverage && store.coverageAnalysis && store.coverageAnalysis.gaps.length > 0 && (
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
