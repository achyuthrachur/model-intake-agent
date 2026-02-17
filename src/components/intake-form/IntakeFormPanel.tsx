'use client';

import { useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { INTAKE_SCHEMA, type FieldDefinition, type SectionSchema } from '@/lib/intake-schema';
import { REQUIRED_FIELDS } from '@/lib/constants';
import { useIntakeStore } from '@/stores/intake-store';
import type { IntakeFormState, AssumptionRow, LimitationRow, ReferenceRow } from '@/types';

import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ---------------------------------------------------------------------------
// Helper: generate a UUID (v4-ish, crypto-safe when available)
// ---------------------------------------------------------------------------
function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// ---------------------------------------------------------------------------
// Helper: get the risk-rating badge color from the riskRating value
// ---------------------------------------------------------------------------
function getRiskBadgeStyles(riskRating: string): { bg: string; text: string; label: string } {
  if (riskRating.startsWith('Tier 1')) {
    return { bg: 'bg-red-600', text: 'text-white', label: riskRating };
  }
  if (riskRating.startsWith('Tier 2')) {
    return { bg: 'bg-orange-500', text: 'text-white', label: riskRating };
  }
  if (riskRating.startsWith('Tier 3')) {
    return { bg: 'bg-yellow-400', text: 'text-yellow-900', label: riskRating };
  }
  if (riskRating.startsWith('Tier 4')) {
    return { bg: 'bg-green-500', text: 'text-white', label: riskRating };
  }
  return { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Not Rated' };
}

// ---------------------------------------------------------------------------
// Helper: compute per-section completion
// ---------------------------------------------------------------------------
function computeSectionCompletion(
  sectionSchema: SectionSchema,
  sectionData: Record<string, unknown>,
): { filled: number; total: number } {
  let filled = 0;
  const total = sectionSchema.fields.length;

  for (const field of sectionSchema.fields) {
    const value = sectionData[field.name];
    if (Array.isArray(value)) {
      if (value.length > 0) filled++;
    } else if (typeof value === 'string' && value.trim() !== '') {
      filled++;
    }
  }

  return { filled, total };
}

// ---------------------------------------------------------------------------
// Helper: create an empty row for a given table schema
// ---------------------------------------------------------------------------
function createEmptyRow(
  columns: { key: string; label: string }[],
): AssumptionRow | LimitationRow | ReferenceRow {
  const row: Record<string, string> = { id: generateId() };
  for (const col of columns) {
    row[col.key] = '';
  }
  return row as unknown as AssumptionRow | LimitationRow | ReferenceRow;
}

// ---------------------------------------------------------------------------
// SectionFields — renders all fields for one section based on the schema
// ---------------------------------------------------------------------------
interface SectionFieldsProps {
  schema: SectionSchema;
}

function SectionFields({ schema }: SectionFieldsProps) {
  const formData = useIntakeStore((s) => s.formData);
  const updateField = useIntakeStore((s) => s.updateField);
  const addTableRow = useIntakeStore((s) => s.addTableRow);
  const removeTableRow = useIntakeStore((s) => s.removeTableRow);
  const addManualEditSystemMessage = useIntakeStore((s) => s.addManualEditSystemMessage);
  const recentlyUpdatedFields = useIntakeStore((s) => s.recentlyUpdatedFields);
  const dirtyFieldsRef = useRef<Set<string>>(new Set());

  const sectionKey = schema.id as keyof IntakeFormState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sectionData = formData[sectionKey] as any as Record<string, unknown>;

  const isFieldPulsing = useCallback(
    (fieldName: string): boolean => {
      return recentlyUpdatedFields.has(`${sectionKey}.${fieldName}`);
    },
    [recentlyUpdatedFields, sectionKey],
  );

  const markDirty = useCallback((key: string) => {
    dirtyFieldsRef.current.add(key);
  }, []);

  const flushDirty = useCallback(
    (key: string, fieldName: string, value: unknown) => {
      if (!dirtyFieldsRef.current.has(key)) return;
      dirtyFieldsRef.current.delete(key);
      addManualEditSystemMessage(sectionKey, fieldName, value);
    },
    [addManualEditSystemMessage, sectionKey],
  );

  // --- Render a single field by type ---
  const renderField = useCallback(
    (field: FieldDefinition) => {
      const fieldKey = `${sectionKey}.${field.name}`;
      const pulsing = isFieldPulsing(field.name);
      const currentValue = sectionData[field.name];
      const isRequired = REQUIRED_FIELDS.has(fieldKey);

      switch (field.type) {
        // ---- TEXT ----
        case 'text': {
          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md')}>
                <Input
                  value={(currentValue as string) ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => {
                    markDirty(field.name);
                    updateField(sectionKey, field.name, e.target.value);
                  }}
                  onBlur={(e) => flushDirty(field.name, field.name, e.target.value)}
                />
              </div>
            </div>
          );
        }

        // ---- TEXTAREA ----
        case 'textarea': {
          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md')}>
                <Textarea
                  value={(currentValue as string) ?? ''}
                  placeholder={field.placeholder}
                  rows={3}
                  onChange={(e) => {
                    markDirty(field.name);
                    updateField(sectionKey, field.name, e.target.value);
                  }}
                  onBlur={(e) => flushDirty(field.name, field.name, e.target.value)}
                />
              </div>
            </div>
          );
        }

        // ---- SELECT ----
        case 'select': {
          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md')}>
                <Select
                  value={(currentValue as string) ?? ''}
                  onValueChange={(val) => {
                    updateField(sectionKey, field.name, val);
                    addManualEditSystemMessage(sectionKey, field.name, val);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={field.placeholder ?? 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          );
        }

        // ---- DATE ----
        case 'date': {
          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md')}>
                <Input
                  type="date"
                  value={(currentValue as string) ?? ''}
                  placeholder={field.placeholder}
                  onChange={(e) => {
                    markDirty(field.name);
                    updateField(sectionKey, field.name, e.target.value);
                  }}
                  onBlur={(e) => flushDirty(field.name, field.name, e.target.value)}
                />
              </div>
            </div>
          );
        }

        // ---- MULTI-SELECT (checkboxes) ----
        case 'multi-select': {
          const selectedValues = Array.isArray(currentValue) ? (currentValue as string[]) : [];

          const handleToggle = (option: string) => {
            const next = selectedValues.includes(option)
              ? selectedValues.filter((v) => v !== option)
              : [...selectedValues, option];
            updateField(sectionKey, field.name, next);
            addManualEditSystemMessage(sectionKey, field.name, next);
          };

          return (
            <div key={fieldKey} className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md p-2 border border-input')}>
                <div className="flex flex-wrap gap-2">
                  {field.options?.map((option) => {
                    const checked = selectedValues.includes(option);
                    return (
                      <label
                        key={option}
                        className={cn(
                          'inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                          checked
                            ? 'border-[#05AB8C] bg-[#05AB8C]/12 text-[#05AB8C]'
                            : 'border-border/75 bg-background/80 text-muted-foreground hover:bg-accent/65',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggle(option)}
                          className="sr-only"
                        />
                        <span
                          className={cn(
                            'flex h-3.5 w-3.5 items-center justify-center rounded-sm border',
                            checked
                              ? 'border-[#05AB8C] bg-[#05AB8C] text-white'
                              : 'border-muted-foreground/40',
                          )}
                        >
                          {checked && (
                            <svg
                              className="h-2.5 w-2.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </span>
                        {option}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        }

        // ---- TABLE ----
        case 'table': {
          const columns = field.tableColumns ?? [];
          const rows = Array.isArray(currentValue)
            ? (currentValue as Record<string, string>[])
            : [];

          const handleAddRow = () => {
            const newRow = createEmptyRow(columns);
            addTableRow(sectionKey, field.name, newRow);
            addManualEditSystemMessage(
              sectionKey,
              field.name,
              `Added row. Total rows: ${rows.length + 1}`,
            );
          };

          const handleCellChange = (rowIndex: number, colKey: string, value: string) => {
            const updatedRows = rows.map((row, i) =>
              i === rowIndex ? { ...row, [colKey]: value } : row,
            );
            markDirty(`${field.name}:${rowIndex}:${colKey}`);
            updateField(sectionKey, field.name, updatedRows);
          };

          const handleRemoveRow = (rowId: string) => {
            removeTableRow(sectionKey, field.name, rowId);
            addManualEditSystemMessage(
              sectionKey,
              field.name,
              `Removed row. Total rows: ${Math.max(rows.length - 1, 0)}`,
            );
          };

          return (
            <div key={fieldKey} className="space-y-2">
              <label className="text-sm font-medium text-foreground">{field.label}{isRequired && <span className="text-destructive"> *</span>}</label>
              <div className={cn(pulsing && 'field-pulse', 'rounded-md')}>
                {rows.length > 0 && (
                    <div className="overflow-x-auto rounded-md border border-border/75">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/55">
                          {columns.map((col) => (
                            <th
                              key={col.key}
                              className="px-3 py-2 text-left text-xs font-medium text-muted-foreground"
                            >
                              {col.label}
                            </th>
                          ))}
                          <th className="w-10 px-2 py-2" />
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIndex) => (
                          <tr
                            key={row.id ?? rowIndex}
                            className="border-b border-border/70 last:border-b-0 hover:bg-accent/35"
                          >
                            {columns.map((col) => (
                              <td key={col.key} className="px-3 py-1.5">
                                <Input
                                  value={row[col.key] ?? ''}
                                  onChange={(e) =>
                                    handleCellChange(rowIndex, col.key, e.target.value)
                                  }
                                  onBlur={(e) =>
                                    flushDirty(
                                      `${field.name}:${rowIndex}:${col.key}`,
                                      field.name,
                                      `Updated row ${rowIndex + 1}, ${col.label}: ${e.target.value}`,
                                    )
                                  }
                                  className="h-8 text-xs"
                                  placeholder={col.label}
                                />
                              </td>
                            ))}
                            <td className="px-2 py-1.5">
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                onClick={() => handleRemoveRow(row.id)}
                                className="text-muted-foreground hover:text-destructive"
                                aria-label="Remove row"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRow}
                  className="mt-2 gap-1.5 text-xs"
                >
                  <Plus className="size-3.5" />
                  Add Row
                </Button>
              </div>
            </div>
          );
        }

        default:
          return null;
      }
    },
    [
      sectionKey,
      sectionData,
      isFieldPulsing,
      updateField,
      addTableRow,
      removeTableRow,
      markDirty,
      flushDirty,
      addManualEditSystemMessage,
    ],
  );

  return <div className="space-y-4 pb-2">{schema.fields.map(renderField)}</div>;
}

// ---------------------------------------------------------------------------
// IntakeFormPanel — the main exported component
// ---------------------------------------------------------------------------
export function IntakeFormPanel() {
  const formData = useIntakeStore((s) => s.formData);
  const getCompletionPercentage = useIntakeStore((s) => s.getCompletionPercentage);

  const overallCompletion = getCompletionPercentage();

  // Risk rating comes from modelSummary.riskRating
  const riskRating = formData.modelSummary.riskRating;
  const riskBadge = getRiskBadgeStyles(riskRating);

  // Pre-compute per-section completion stats
  const sectionStats = useMemo(() => {
    return INTAKE_SCHEMA.map((section) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sectionData = formData[section.id as keyof IntakeFormState] as any as Record<string, unknown>;
      return computeSectionCompletion(section, sectionData);
    });
  }, [formData]);

  return (
    <div className="flex h-full flex-col">
      {/* ---- Header: completion + risk badge ---- */}
      <div className="shrink-0 space-y-3 border-b border-border/75 bg-muted/45 px-4 py-4">
        {/* Risk Rating badge */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Intake Form</h2>
          <Badge
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
              riskBadge.bg,
              riskBadge.text,
            )}
          >
            {riskBadge.label}
          </Badge>
        </div>

        {/* Overall completion */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall Completion</span>
            <span className="font-medium tabular-nums">{overallCompletion}%</span>
          </div>
          <Progress
            value={overallCompletion}
            className="h-2 bg-muted [&_[data-slot=progress-indicator]]:bg-[var(--color-crowe-amber-core)]"
          />
        </div>
      </div>

      {/* ---- Scrollable accordion body ---- */}
      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-2">
        <Accordion type="multiple" className="w-full">
          {INTAKE_SCHEMA.map((section, idx) => {
            const stats = sectionStats[idx];
            return (
              <AccordionItem key={section.id} value={section.id}>
                <AccordionTrigger className="py-3 text-sm">
                  <div className="flex flex-1 items-center justify-between pr-2">
                    <span className="font-medium">{section.title}</span>
                    <span
                      className={cn(
                        'ml-2 text-[11px] tabular-nums',
                        stats.filled === stats.total && stats.total > 0
                          ? 'font-semibold text-[#05AB8C]'
                          : 'text-muted-foreground',
                      )}
                    >
                      {stats.filled}/{stats.total}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <SectionFields schema={section} />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
