import { promises as fs } from 'node:fs';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface DemoDocumentManifestEntry {
  filename: string;
  url: string;
  mimeType: string;
}

const DEMO_DOCUMENTS_DIR = path.join(process.cwd(), 'Demo Documents');
const DEMO_WORD_EXTENSIONS = new Set(['.docx', '.doc']);

const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.doc': 'application/msword',
  '.txt': 'text/plain; charset=utf-8',
};

function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

function getMimeType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream';
}

function sanitizeFilename(rawFilename: string): string | null {
  const filename = rawFilename.trim();
  if (!filename || filename.includes('\0')) {
    return null;
  }

  // Restrict requests to files directly under Demo Documents.
  if (path.basename(filename) !== filename) {
    return null;
  }

  return filename;
}

async function readManifest(): Promise<DemoDocumentManifestEntry[]> {
  const entries = await fs.readdir(DEMO_DOCUMENTS_DIR, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((filename) => DEMO_WORD_EXTENSIONS.has(path.extname(filename).toLowerCase()))
    .sort((a, b) => a.localeCompare(b))
    .map((filename) => ({
      filename,
      url: `/api/demo-docs?filename=${encodeURIComponent(filename)}`,
      mimeType: getMimeType(filename),
    }));
}

export async function GET(request: NextRequest) {
  try {
    const manifest = await readManifest();
    const requestedFilename = request.nextUrl.searchParams.get('filename');

    if (!requestedFilename) {
      return NextResponse.json(manifest, {
        headers: {
          'Cache-Control': 'no-store',
        },
      });
    }

    const safeFilename = sanitizeFilename(requestedFilename);
    if (!safeFilename) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const target = manifest.find((entry) => entry.filename === safeFilename);
    if (!target) {
      return NextResponse.json({ error: 'Demo document not found' }, { status: 404 });
    }

    const filePath = path.join(DEMO_DOCUMENTS_DIR, target.filename);
    const fileBuffer = await fs.readFile(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': target.mimeType,
        'Content-Length': String(fileBuffer.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('demo-docs route error:', error);

    if (isErrnoException(error) && error.code === 'ENOENT') {
      return NextResponse.json({ error: 'Demo Documents folder not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to load demo documents' }, { status: 500 });
  }
}
