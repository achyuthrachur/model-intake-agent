import jsPDF from 'jspdf';
import type { GeneratedReport } from '@/types';
import { PDF_INDIGO, PDF_AMBER, PDF_TEXT, PDF_MUTED } from './constants';

const INDIGO_R = PDF_INDIGO.r, INDIGO_G = PDF_INDIGO.g, INDIGO_B = PDF_INDIGO.b;
const AMBER_R = PDF_AMBER.r, AMBER_G = PDF_AMBER.g, AMBER_B = PDF_AMBER.b;
const TEXT_R = PDF_TEXT.r, TEXT_G = PDF_TEXT.g, TEXT_B = PDF_TEXT.b;
const MUTED_R = PDF_MUTED.r, MUTED_G = PDF_MUTED.g, MUTED_B = PDF_MUTED.b;

const PAGE_W = 210;
const MARGIN = 20;
const CONTENT_W = PAGE_W - 2 * MARGIN;

function addPageNumber(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(MUTED_R, MUTED_G, MUTED_B);
    doc.text(`Page ${i} of ${pageCount}`, PAGE_W / 2, 285, { align: 'center' });
  }
}

export async function generatePdf(report: GeneratedReport): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 0;

  function checkPageBreak(needed: number): void {
    if (y + needed > 270) {
      doc.addPage();
      y = MARGIN;
    }
  }

  // ---- Cover Page ----
  doc.setFillColor(INDIGO_R, INDIGO_G, INDIGO_B);
  doc.rect(0, 0, PAGE_W, 297, 'F');

  y = 100;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.text(report.bankName, PAGE_W / 2, y, { align: 'center' });

  y += 20;
  doc.setFontSize(18);
  doc.text('Model Documentation', PAGE_W / 2, y, { align: 'center' });

  y += 15;
  doc.setFontSize(14);
  doc.setTextColor(AMBER_R, AMBER_G, AMBER_B);
  doc.text(report.modelName, PAGE_W / 2, y, { align: 'center' });

  y += 20;
  doc.setFontSize(11);
  doc.setTextColor(200, 200, 200);
  doc.text(
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    PAGE_W / 2,
    y,
    { align: 'center' }
  );

  // Amber accent line
  doc.setFillColor(AMBER_R, AMBER_G, AMBER_B);
  doc.rect(PAGE_W / 2 - 30, y + 10, 60, 1, 'F');

  // ---- TOC Page ----
  doc.addPage();
  y = MARGIN;

  doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
  doc.setFontSize(20);
  doc.text('Table of Contents', MARGIN, y);
  y += 15;

  doc.setFontSize(11);
  doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
  for (const section of report.sections) {
    doc.text(section.title, MARGIN + 5, y);
    y += 7;
  }

  // ---- Content Pages ----
  doc.addPage();
  y = MARGIN;

  for (const section of report.sections) {
    checkPageBreak(30);

    // Section heading
    const isMainSection = !section.id.includes('.') || section.id === 'model_summary';
    doc.setTextColor(INDIGO_R, INDIGO_G, INDIGO_B);
    doc.setFontSize(isMainSection ? 16 : 13);
    doc.text(section.title, MARGIN, y);

    // Amber underline for main sections
    if (isMainSection) {
      y += 2;
      doc.setFillColor(AMBER_R, AMBER_G, AMBER_B);
      doc.rect(MARGIN, y, 40, 0.5, 'F');
    }
    y += 8;

    // Section content
    doc.setTextColor(TEXT_R, TEXT_G, TEXT_B);
    doc.setFontSize(10);

    const lines = doc.splitTextToSize(section.content, CONTENT_W);
    for (const line of lines) {
      checkPageBreak(6);
      doc.text(line, MARGIN, y);
      y += 5;
    }
    y += 8;
  }

  addPageNumber(doc);

  doc.save(`${report.bankName.replace(/\s+/g, '_')}_Model_Documentation.pdf`);
}
