interface DemoDocumentManifestEntry {
  filename: string;
  url: string;
  mimeType: string;
}

function isManifestEntry(value: unknown): value is DemoDocumentManifestEntry {
  if (!value || typeof value !== 'object') return false;

  const entry = value as Record<string, unknown>;
  return (
    typeof entry.filename === 'string' &&
    entry.filename.trim().length > 0 &&
    typeof entry.url === 'string' &&
    entry.url.trim().length > 0 &&
    typeof entry.mimeType === 'string' &&
    entry.mimeType.trim().length > 0
  );
}

async function fetchDemoManifest(endpoint: string): Promise<DemoDocumentManifestEntry[]> {
  const response = await fetch(endpoint, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to load demo document manifest: ${response.status} ${response.statusText}`);
  }

  const manifestRaw: unknown = await response.json();
  if (!Array.isArray(manifestRaw)) {
    throw new Error('Demo document manifest must be an array.');
  }

  const manifest = manifestRaw.filter(isManifestEntry);
  if (manifest.length === 0) {
    throw new Error('Demo document manifest is empty or invalid.');
  }

  return manifest;
}

export async function loadDemoFiles(): Promise<File[]> {
  const manifest = await fetchDemoManifest('/api/demo-docs');

  const files = await Promise.all(
    manifest.map(async (entry) => {
      const response = await fetch(entry.url, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(
          `Failed to load demo document "${entry.filename}": ${response.status} ${response.statusText}`,
        );
      }

      const blob = await response.blob();
      const typedBlob = blob.type === entry.mimeType ? blob : blob.slice(0, blob.size, entry.mimeType);

      return new File([typedBlob], entry.filename, {
        type: entry.mimeType,
        lastModified: Date.now(),
      });
    }),
  );

  return files;
}
