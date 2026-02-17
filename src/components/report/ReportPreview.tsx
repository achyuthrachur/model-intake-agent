'use client';

import type { GeneratedReport, ReportSection } from '@/types';

interface ReportPreviewProps {
  report: GeneratedReport;
}

function isTableContent(content: string): boolean {
  const lines = content.trim().split('\n');
  return lines.length >= 2 && lines[0].includes('|') && lines[1].includes('---');
}

function renderTable(content: string): React.ReactNode {
  const lines = content.trim().split('\n');
  // Find the table portion
  const tableStartIdx = lines.findIndex((line) => line.includes('|'));
  if (tableStartIdx === -1) return null;

  // Text before the table
  const preText = lines.slice(0, tableStartIdx).join('\n').trim();

  // Extract table lines
  const tableLines: string[] = [];
  for (let i = tableStartIdx; i < lines.length; i++) {
    if (lines[i].includes('|')) {
      tableLines.push(lines[i]);
    } else {
      break;
    }
  }

  // Parse header row
  const headerRow = tableLines[0]
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean);

  // Parse data rows (skip separator at index 1)
  const dataRows = tableLines.slice(2).map((line) =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean),
  );

  // Text after the table
  const afterTableIdx = tableStartIdx + tableLines.length;
  const postText = lines.slice(afterTableIdx).join('\n').trim();

  return (
    <>
      {preText && <p className="mb-3 text-sm leading-relaxed text-foreground">{preText}</p>}
      <table className="w-full border-collapse border border-border text-sm">
        <thead>
          <tr className="bg-primary/95">
            {headerRow.map((cell, i) => (
              <th
                key={i}
                className="border border-border px-3 py-2 text-left text-xs font-semibold text-white"
              >
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataRows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted'}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="border border-border px-3 py-2 text-foreground"
                >
                  {cell === '[Information not provided]' ? (
                    <span className="italic text-muted-foreground">{cell}</span>
                  ) : (
                    cell
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {postText && <p className="mt-3 text-sm leading-relaxed text-foreground">{postText}</p>}
    </>
  );
}

function renderTextContent(content: string): React.ReactNode {
  // Split by double newlines to create paragraphs
  const blocks = content.split('\n\n');

  return blocks.map((block, idx) => {
    const trimmed = block.trim();
    if (!trimmed) return null;

    // Check if this block contains a table segment
    if (trimmed.includes('|') && trimmed.includes('---')) {
      return <div key={idx}>{renderTable(trimmed)}</div>;
    }

    // Bold text markers
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={idx} className="text-sm leading-relaxed text-foreground">
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

function SectionBlock({ section, isFirst }: { section: ReportSection; isFirst: boolean }) {
  const hasTable = isTableContent(section.content);

  return (
    <div className={isFirst ? '' : 'mt-8'}>
      <h2
        className="mb-3 border-b border-border pb-2 text-base font-bold text-primary"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {section.title}
      </h2>
      <div className="flex flex-col gap-3">
        {hasTable ? renderTable(section.content) : renderTextContent(section.content)}
      </div>
    </div>
  );
}

export function ReportPreview({ report }: ReportPreviewProps) {
  const modelSummarySection = report.sections.find((s) => s.id === 'model_summary');
  const bodySections = report.sections.filter((s) => s.id !== 'model_summary');

  return (
    <div className="rounded-xl border border-border/75 bg-background/65 p-6 md:p-8">
      {/* Bank Name Header */}
      <div className="mb-2 text-center">
        <p
          className="text-lg font-bold tracking-wide text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {report.bankName}
        </p>
      </div>

      {/* Title */}
      <div className="mb-8 text-center">
        <h1
          className="text-2xl font-bold tracking-tight text-primary"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          MODEL DOCUMENTATION
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {report.modelName}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Generated {new Date(report.generatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      {/* Divider */}
      <hr className="mb-8 border-primary/25" />

      {/* Model Summary Table */}
      {modelSummarySection && (
        <div className="mb-8">
          <h2
            className="mb-3 border-b border-border pb-2 text-base font-bold text-primary"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Model Summary
          </h2>
          <div className="flex flex-col gap-3">
            {renderTable(modelSummarySection.content)}
          </div>
        </div>
      )}

      {/* Body Sections */}
      {bodySections.map((section, idx) => (
        <SectionBlock key={section.id} section={section} isFirst={idx === 0 && !modelSummarySection} />
      ))}

      {/* Generation Notes */}
      {report.generationNotes.length > 0 && (
        <div className="mt-10 rounded-xl border border-border/75 bg-muted/55 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Generation Notes
          </p>
          <ul className="flex flex-col gap-1">
            {report.generationNotes.map((note, idx) => (
              <li key={idx} className="text-xs text-foreground">
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
