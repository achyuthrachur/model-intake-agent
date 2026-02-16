import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  PageBreak,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { GeneratedReport } from '@/types';

const CROWE_INDIGO = '011E41';
const CROWE_AMBER = 'F5A800';

function createTitlePage(bankName: string, modelName: string): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 4000 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: bankName,
          bold: true,
          size: 48,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: 'Model Documentation',
          size: 36,
          color: CROWE_INDIGO,
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: modelName,
          size: 28,
          color: '4F4F4F',
          font: 'Helvetica Neue',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
          size: 22,
          color: '828282',
          font: 'Helvetica Neue',
        }),
      ],
    }),
  ];
}

function parseMarkdownTable(content: string): { headers: string[]; rows: string[][] } | null {
  const lines = content.split('\n').filter((l) => l.trim().startsWith('|'));
  if (lines.length < 2) return null;

  const parseRow = (line: string): string[] =>
    line.split('|').map((c) => c.trim()).filter((c) => c && !c.match(/^-+$/));

  const headers = parseRow(lines[0]);
  const rows = lines
    .slice(1)
    .filter((l) => !l.match(/^\|[\s-|]+\|$/))
    .map(parseRow);

  return rows.length > 0 ? { headers, rows } : null;
}

function createDocxTable(headers: string[], rows: string[][]): Table {
  const headerCells = headers.map(
    (h) =>
      new TableCell({
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: h, bold: true, size: 20, color: 'FFFFFF', font: 'Helvetica Neue' }),
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
      })
  );

  const dataRows = rows.map(
    (row, rowIdx) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ text: cell, size: 20, font: 'Helvetica Neue' }),
                  ],
                }),
              ],
              shading: { fill: rowIdx % 2 === 0 ? 'FFFFFF' : 'F1F5F9' },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                left: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
                right: { style: BorderStyle.SINGLE, size: 1, color: 'E0E0E0' },
              },
            })
        ),
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: headerCells }), ...dataRows],
  });
}

function createSectionContent(content: string): (Paragraph | Table)[] {
  const elements: (Paragraph | Table)[] = [];
  const tableData = parseMarkdownTable(content);

  if (tableData) {
    const textBefore = content.split('\n').filter((l) => !l.trim().startsWith('|')).join('\n').trim();
    if (textBefore) {
      elements.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: textBefore, size: 22, font: 'Helvetica Neue' }),
          ],
        })
      );
    }
    elements.push(createDocxTable(tableData.headers, tableData.rows));
  } else {
    const paragraphs = content.split('\n\n').filter((p) => p.trim());
    for (const para of paragraphs) {
      elements.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: para.trim(), size: 22, font: 'Helvetica Neue' }),
          ],
        })
      );
    }
  }

  return elements;
}

export async function generateDocx(report: GeneratedReport): Promise<void> {
  const titlePageParagraphs = createTitlePage(report.bankName, report.modelName);

  const sectionParagraphs: (Paragraph | Table)[] = [];

  for (const section of report.sections) {
    if (section.id === 'model_summary') {
      sectionParagraphs.push(
        new Paragraph({ children: [new PageBreak()] }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: 'Model Summary', bold: true, size: 28, color: CROWE_INDIGO, font: 'Helvetica Neue' }),
          ],
        })
      );
    } else {
      const parentMatch = section.title.match(/^(\d+)\./);
      const headingLevel = parentMatch ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1;

      sectionParagraphs.push(
        new Paragraph({
          heading: headingLevel,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({ text: section.title, bold: true, size: headingLevel === HeadingLevel.HEADING_1 ? 28 : 24, color: CROWE_INDIGO, font: 'Helvetica Neue' }),
          ],
        })
      );
    }

    sectionParagraphs.push(...createSectionContent(section.content));
  }

  const doc = new Document({
    sections: [
      {
        children: [...titlePageParagraphs, ...sectionParagraphs],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${report.bankName.replace(/\s+/g, '_')}_Model_Documentation.docx`);
}
