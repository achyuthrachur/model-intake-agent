import jsPDF from 'jspdf';
import type { GeneratedReport } from '@/types';
import { PDF_AMBER, PDF_INDIGO, PDF_MUTED, PDF_TEXT } from './constants';

const INDIGO_R = PDF_INDIGO.r;
const INDIGO_G = PDF_INDIGO.g;
const INDIGO_B = PDF_INDIGO.b;
const AMBER_R = PDF_AMBER.r;
const AMBER_G = PDF_AMBER.g;
const AMBER_B = PDF_AMBER.b;
const TEXT_R = PDF_TEXT.r;
const TEXT_G = PDF_TEXT.g;
const TEXT_B = PDF_TEXT.b;
const MUTED_R = PDF_MUTED.r;
const MUTED_G = PDF_MUTED.g;
const MUTED_B = PDF_MUTED.b;

const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;

const MAJOR_SECTION_TITLES: Record<string, string> = {
  '1': '1. Executive Summary',
  '2': '2. Model Design',
  '3': '3. Development Data',
  '4': '4. Output & Use',
  '5': '5. Implementation',
  '6': '6. Performance',
  '7': '7. Governance',
};

function parseMarkdownTable(content: string): { headers: string[]; rows: string[][] } | null {
  const lines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'));

  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line
      .split('|')
      .map((cell) => cell.trim())
      .filter((cell) => cell !== '');

  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .filter((line) => !/^\|[\s\-:|]+\|$/.test(line))
    .map(parseRow);

  if (headers.length === 0 || rows.length === 0) return null;
  return { headers, rows };
}

function addPageNumber(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W / 2, 285, { align: 'center' });
  }
}

export async function generatePdf(report: GeneratedReport): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN;

  const checkPageBreak = (neededHeight: number): void => {
    if (y + neededHeight > 270) {
      doc.addPage();
      y = MARGIN;
    }
  };

  // Cover page: bank header + model summary table
  const modelSummary = report.sections.find((section) => section.id === 'model_summary');
  const modelSummaryTable = modelSummary ? parseMarkdownTable(modelSummary.content) : null;

  doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
  doc.setFontSize(24);
  doc.text(report.bankName, PAGE_W / 2, y, { align: 'center' });
  y += 12;

  doc.setFontSize(16);
  doc.text('MODEL SUMMARY', PAGE_W / 2, y, { align: 'center' });
  y += 8;

  doc.setDrawColor(AMBER_R, AMBER_G, AMBER_B);
  doc.setLineWidth(0.6);
  doc.line(PAGE_W / 2 - 30, y, PAGE_W / 2 + 30, y);
  y += 8;

  if (modelSummaryTable) {
    doc.setFontSize(10);
    doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
    for (const row of modelSummaryTable.rows) {
      if (row.length < 2) continue;
      checkPageBreak(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`${row[0]}:`, MARGIN, y);
      doc.setFont('helvetica', 'normal');
      const valueLines = doc.splitTextToSize(row[1], CONTENT_W - 45);
      doc.text(valueLines, MARGIN + 45, y);
      y += Math.max(6, valueLines.length * 5);
    }
  } else {
    doc.setFontSize(10);
    doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
    const fallbackText = modelSummary?.content || 'Model summary section was not generated.';
    const lines = doc.splitTextToSize(fallbackText, CONTENT_W);
    doc.text(lines, MARGIN, y);
  }

  // Title + TOC page
  doc.addPage();
  y = 80;

  doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
  doc.setFontSize(22);
  doc.text(report.bankName, PAGE_W / 2, y, { align: 'center' });
  y += 14;

  doc.setFontSize(16);
  doc.text('Model Documentation', PAGE_W / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(12);
  doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
  doc.text(report.modelName, PAGE_W / 2, y, { align: 'center' });
  y += 16;

  doc.setFontSize(14);
  doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
  doc.text('Table of Contents', MARGIN, y);
  y += 8;

  doc.setFontSize(10);
  doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
  const tocSections = report.sections.filter((section) => section.id !== 'model_summary');
  for (const section of tocSections) {
    checkPageBreak(6);
    doc.text(section.title, MARGIN + 4, y);
    y += 6;
  }

  // Body pages
  doc.addPage();
  y = MARGIN;
  const bodySections = report.sections.filter((section) => section.id !== 'model_summary');
  let lastMajorSection: string | null = null;

  for (const section of bodySections) {
    const majorMatch = section.id.match(/^(\d+)\./);
    const major = majorMatch?.[1] ?? null;

    if (major && major !== lastMajorSection) {
      checkPageBreak(14);
      doc.setFontSize(15);
      doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
      doc.setFont('helvetica', 'bold');
      doc.text(MAJOR_SECTION_TITLES[major] ?? `${major}. Section`, MARGIN, y);
      y += 8;
      lastMajorSection = major;
    }

    checkPageBreak(12);
    doc.setFontSize(12);
    doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
    doc.setFont('helvetica', 'bold');
    doc.text(section.title, MARGIN, y);
    y += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);

    const lines = doc.splitTextToSize(section.content, CONTENT_W);
    for (const line of lines) {
      checkPageBreak(5);
      doc.text(line, MARGIN, y);
      y += 5;
    }
    y += 4;
  }

  addPageNumber(doc);
  doc.save(`${report.bankName.replace(/\s+/g, '_')}_Model_Documentation.pdf`);
}
