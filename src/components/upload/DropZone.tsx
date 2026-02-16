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
        'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed px-6 py-10 transition-colors',
        isDragActive
          ? 'border-[var(--color-crowe-amber-core)] bg-[var(--color-crowe-amber-core)]/5'
          : 'border-border bg-muted/30 hover:border-muted-foreground/40 hover:bg-muted/50',
      )}
    >
      <input {...getInputProps()} />

      <div
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full transition-colors',
          isDragActive
            ? 'bg-[var(--color-crowe-amber-core)]/10 text-[var(--color-crowe-amber-core)]'
            : 'bg-muted text-muted-foreground',
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
