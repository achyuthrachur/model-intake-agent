'use client';

import { CheckCircle, AlertCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TEMPLATE_SECTIONS } from '@/data/template-structure';
import type { CoverageAnalysis } from '@/types';

interface CoverageAnalysisGridProps {
  coverage: CoverageAnalysis;
}

function StatusIcon({ status }: { status: 'covered' | 'partial' | 'gap' }) {
  switch (status) {
    case 'covered':
      return <CheckCircle className="h-4 w-4 text-[var(--color-crowe-teal)]" />;
    case 'partial':
      return <AlertCircle className="h-4 w-4 text-[var(--color-crowe-amber-core)]" />;
    case 'gap':
      return <XCircle className="h-4 w-4 text-destructive" />;
  }
}

function StatusBadge({ status }: { status: 'covered' | 'partial' | 'gap' }) {
  switch (status) {
    case 'covered':
      return (
        <Badge className="bg-[var(--color-crowe-teal)]/10 text-[var(--color-crowe-teal-dark)] border-[var(--color-crowe-teal)]/20">
          Covered
        </Badge>
      );
    case 'partial':
      return (
        <Badge className="bg-[var(--color-crowe-amber-core)]/10 text-[var(--color-crowe-amber-dark)] border-[var(--color-crowe-amber-core)]/20">
          Partial
        </Badge>
      );
    case 'gap':
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          Gap
        </Badge>
      );
  }
}

export function CoverageAnalysisGrid({ coverage }: CoverageAnalysisGridProps) {
  const gapCount = coverage.gaps.length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Coverage Analysis
        </h3>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3 text-[var(--color-crowe-teal)]" />
            Covered
          </span>
          <span className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3 text-[var(--color-crowe-amber-core)]" />
            Partial
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3 text-destructive" />
            Gap
          </span>
        </div>
      </div>

      {/* Grid */}
      <div className="rounded-lg border border-border">
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 border-b border-border bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <span>Section</span>
          <span>Status</span>
          <span>Source Documents</span>
        </div>

        <div className="divide-y divide-border">
          {TEMPLATE_SECTIONS.map((section) => {
            const entry = coverage.overallCoverage[section.id];
            const status = entry?.status ?? 'gap';
            const sources = entry?.sources ?? [];

            return (
              <div
                key={section.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 px-4 py-2.5"
              >
                <div className="flex items-center gap-2">
                  <StatusIcon status={status} />
                  <span className="text-sm text-foreground">{section.title}</span>
                </div>

                <StatusBadge status={status} />

                <div className="text-xs text-muted-foreground">
                  {sources.length > 0 ? sources.join(', ') : '--'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gap warnings banner */}
      {gapCount > 0 && (
        <div className="flex items-start gap-3 rounded-lg border border-[var(--color-crowe-amber-core)]/30 bg-[var(--color-crowe-amber-core)]/5 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-crowe-amber-dark)]" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium text-foreground">
              {gapCount} section{gapCount !== 1 ? 's' : ''} with documentation gaps
            </p>
            <p className="text-xs text-muted-foreground">
              The following sections are not covered by any uploaded document:{' '}
              {coverage.gaps
                .map((gapId) => {
                  const section = TEMPLATE_SECTIONS.find((s) => s.id === gapId);
                  return section?.title ?? gapId;
                })
                .join(', ')}
              . Consider uploading additional documentation or addressing these gaps in
              the intake interview.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
