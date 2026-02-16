'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Copy, Check } from 'lucide-react';
import type { GeneratedReport } from '@/types';

interface ExportControlsProps {
  report: GeneratedReport;
}

export function ExportControls({ report }: ExportControlsProps) {
  const [copied, setCopied] = useState(false);

  const handleDownloadDocx = async () => {
    try {
      const { generateDocx } = await import('@/lib/docx-export');
      await generateDocx(report);
    } catch (err) {
      console.error('DOCX export failed:', err);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { generatePdf } = await import('@/lib/pdf-export');
      await generatePdf(report);
    } catch (err) {
      console.error('PDF export failed:', err);
    }
  };

  const handleCopyToClipboard = async () => {
    const plainText = report.sections
      .map((section) => `${section.title}\n\n${section.content}`)
      .join('\n\n---\n\n');

    try {
      await navigator.clipboard.writeText(plainText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy to clipboard failed:', err);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadDocx}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Download DOCX
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPdf}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={handleCopyToClipboard}
        className="gap-2"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4 text-[var(--color-crowe-teal)]" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy to Clipboard
          </>
        )}
      </Button>

      {copied && (
        <Badge className="bg-[var(--color-crowe-teal)]/10 text-[var(--color-crowe-teal-dark)] border-[var(--color-crowe-teal)]/20">
          Copied to clipboard
        </Badge>
      )}
    </div>
  );
}
