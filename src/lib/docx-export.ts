import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';
import type { GeneratedReport } from '@/types';
import {
  DOCX_CROWE_BORDER,
  DOCX_CROWE_INDIGO,
  DOCX_CROWE_MUTED,
  DOCX_CROWE_SECONDARY_TEXT,
  DOCX_CROWE_STRIPE,
} from './constants';

const CROWE_INDIGO = DOCX_CROWE_INDIGO;

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

function createDocxTable(headers: string[], rows: string[][]): Table {
  const headerCells = headers.map(
    (header) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: header,
                bold: true,
                size: 20,
                color: 'FFFFFF',
                font: 'Helvetica Neue',
              }),
            ],
          }),
        ],
        shading: { fill: CROWE_INDIGO },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: CROWE_INDIGO },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: CROWE_INDIGO },
          left: { style: BorderStyle.SINGLE, size: 1, color: CROWE_INDIGO },
          right: { style: BorderStyle.SINGLE, size: 1, color: CROWE_INDIGO },
        },
      }),
  );

  const dataRows = rows.map(
    (row, rowIndex) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cell,
                      size: 20,
                      font: 'Helvetica Neue',
                    }),
                  ],
                }),
              ],
              shading: { fill: rowIndex % 2 === 0 ? 'FFFFFF' : DOCX_CROWE_STRIPE },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: DOCX_CROWE_BORDER },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: DOCX_CROWE_BORDER },
                left: { style: BorderStyle.SINGLE, size: 1, color: DOCX_CROWE_BORDER },
                right: { style: BorderStyle.SINGLE, size: 1, color: DOCX_CROWE_BORDER },
              },
            }),
        ),
      }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows],
  });
}

function createParagraph(text: string, size = 22): Paragraph {
  return new Paragraph({
    spacing: { after: 200 },
    children: [new TextRun({ text, size, font: 'Helvetica Neue' })],
  });
}

function createSectionContent(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const tableData = parseMarkdownTable(content);

  if (!tableData) {
    const paragraphs = content.split('\n\n').map((p) => p.trim()).filter(Boolean);
    for (const paragraph of paragraphs) {
      elements.push(createParagraph(paragraph));
    }
    return elements;
  }

  const textOnlyLines = content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('|'));

  if (textOnlyLines.length > 0) {
    elements.push(createParagraph(textOnlyLines.join('\n')));
  }

  elements.push(createDocxTable(tableData.headers, tableData.rows));
  return elements;
}

function buildCoverPage(report: GeneratedReport): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const modelSummary = report.sections.find((section) => section.id === 'model_summary');
  const tableData = modelSummary ? parseMarkdownTable(modelSummary.content) : null;

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 160 },
      children: [
        new TextRun({
          text: report.bankName,
          bold: true,
          size: 44,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
  );

  elements.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 260 },
      children: [
        new TextRun({
          text: 'MODEL SUMMARY',
          bold: true,
          size: 30,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
  );

  if (tableData) {
    elements.push(createDocxTable(tableData.headers, tableData.rows));
  } else if (modelSummary) {
    elements.push(...createSectionContent(modelSummary.content));
  } else {
    elements.push(createParagraph('Model summary content was not generated.'));
  }

  return elements;
}

function buildTitleAndTocPage(report: GeneratedReport): Paragraph[] {
  const sections = report.sections.filter((section) => section.id !== 'model_summary');

  return [
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1800, after: 200 },
      children: [
        new TextRun({
          text: report.bankName,
          bold: true,
          size: 42,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({
          text: 'Model Documentation',
          size: 34,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: report.modelName,
          size: 26,
          color: DOCX_CROWE_SECONDARY_TEXT,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 420 },
      children: [
        new TextRun({
          text: new Date(report.generatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 22,
          color: DOCX_CROWE_MUTED,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: 'Table of Contents',
          bold: true,
          size: 26,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    ...sections.map((section) =>
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: section.title,
            size: 22,
            color: DOCX_CROWE_SECONDARY_TEXT,
            font: 'Helvetica Neue',
          }),
        ],
      }),
    ),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

function buildBodySections(report: GeneratedReport): (Paragraph | Table)[] {
  const bodyElements: (Paragraph | Table)[] = [];
  const sections = report.sections.filter((section) => section.id !== 'model_summary');
  let lastMajorSection: string | null = null;

  for (const section of sections) {
    const majorMatch = section.id.match(/^(\d+)\./);
    const major = majorMatch?.[1] ?? null;

    if (major && major !== lastMajorSection) {
      const majorTitle = MAJOR_SECTION_TITLES[major] ?? `${major}. Section`;
      bodyElements.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          children: [
            new TextRun({
              text: majorTitle,
              bold: true,
              size: 30,
              color: CROWE_INDIGO,
              font: 'Helvetica Neue',
            }),
          ],
        }),
      );
      lastMajorSection = major;
    }

    bodyElements.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 220, after: 120 },
        children: [
          new TextRun({
            text: section.title,
            bold: true,
            size: 24,
            color: CROWE_INDIGO,
            font: 'Helvetica Neue',
          }),
        ],
      }),
    );

    bodyElements.push(...createSectionContent(section.content));
  }

  return bodyElements;
}

export async function generateDocx(report: GeneratedReport): Promise<void> {
  const coverPage = buildCoverPage(report);
  const titleAndTocPage = buildTitleAndTocPage(report);
  const bodySections = buildBodySections(report);

  const doc = new Document({
    sections: [
      {
        children: [...coverPage, ...titleAndTocPage, ...bodySections],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.bankName.replace(/\s+/g, '_')}_Model_Documentation.docx`);
}
