'use client';

import { FileText, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { UploadedFile } from '@/types';

interface FileListProps {
  files: UploadedFile[];
  onRemove: (id: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: UploadedFile['status'] }) {
  switch (status) {
    case 'uploading':
      return (
        <Badge className="bg-[var(--color-crowe-blue)]/10 text-[var(--color-crowe-blue)] border-[var(--color-crowe-blue)]/20">
          Uploading
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="animate-pulse bg-[var(--color-crowe-amber-core)]/10 text-[var(--color-crowe-amber-dark)] border-[var(--color-crowe-amber-core)]/20">
          Processing
        </Badge>
      );
    case 'parsed':
      return (
        <Badge className="bg-[var(--color-crowe-teal)]/10 text-[var(--color-crowe-teal-dark)] border-[var(--color-crowe-teal)]/20">
          Parsed
        </Badge>
      );
    case 'error':
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          Error
        </Badge>
      );
  }
}

export function FileList({ files, onRemove }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm font-medium text-foreground">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>

            <StatusBadge status={file.status} />

            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => onRemove(file.id)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>

          {file.status === 'uploading' && (
            <Progress value={file.progress} className="h-1.5" />
          )}
        </div>
      ))}
    </div>
  );
}
