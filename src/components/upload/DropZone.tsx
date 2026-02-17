'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

export function DropZone({ onFilesAdded }: DropZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFilesAdded(acceptedFiles);
      }
    },
    [onFilesAdded],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'interactive-lift flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 transition-colors',
        isDragActive
          ? 'border-[var(--color-crowe-amber-core)] bg-[var(--color-crowe-amber-core)]/10'
          : 'border-border/70 bg-[var(--surface-muted)] hover:border-[var(--color-crowe-indigo-bright)]/45 hover:bg-accent/55',
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full border transition-colors',
          isDragActive
            ? 'border-[var(--color-crowe-amber-core)]/35 bg-[var(--color-crowe-amber-core)]/18 text-[var(--color-crowe-amber-dark)]'
            : 'border-border/70 bg-muted text-muted-foreground',
        )}
      >
        <Upload className="h-6 w-6" />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-sm font-medium text-foreground">
          {isDragActive
            ? 'Drop files here...'
            : 'Drag and drop vendor documentation here, or click to browse'}
        </p>
        <p className="text-xs text-muted-foreground">
          Supported formats: PDF, DOCX, DOC, TXT
        </p>
      </div>
    </div>
  );
}
