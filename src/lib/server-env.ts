function normalizeEnvValue(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function getServerEnv(name: string): string | undefined {
  const candidates = [name];

  if (name.includes('_')) {
    candidates.push(name.replace(/_/g, '-'));
  }

  for (const candidate of candidates) {
    const value = normalizeEnvValue(process.env[candidate]);
    if (value) {
      return value;
    }
  }

  return undefined;
}

export function getRequiredServerEnv(name: string): string {
  const value = getServerEnv(name);
  if (value) {
    return value;
  }

  const alternateName = name.includes('_') ? name.replace(/_/g, '-') : name;
  throw new Error(`${name} is not configured. Also accepts ${alternateName}.`);
}
