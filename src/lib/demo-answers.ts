let demoAnswersCache: string[] | null = null;

function sanitizeDemoAnswers(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .filter((value): value is string => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export async function loadDemoAnswers(): Promise<string[]> {
  if (demoAnswersCache) {
    return demoAnswersCache;
  }

  const response = await fetch('/demo/demo-answers.json', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to load demo answers: ${response.status} ${response.statusText}`);
  }

  const data: unknown = await response.json();
  demoAnswersCache = sanitizeDemoAnswers(data);
  return demoAnswersCache;
}
