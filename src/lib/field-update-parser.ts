import type { FieldUpdate } from '@/types';

interface ParseResult {
  cleanReply: string;
  fieldUpdates: FieldUpdate[];
}

export function parseFieldUpdates(aiResponse: string): ParseResult {
  const fieldUpdates: FieldUpdate[] = [];
  const regex = /<<<FIELD_UPDATE>>>([\s\S]*?)<<<END_FIELD_UPDATE>>>/g;
  let match;

  while ((match = regex.exec(aiResponse)) !== null) {
    try {
      const update = JSON.parse(match[1].trim());
      fieldUpdates.push({
        section: update.section,
        field: update.field,
        value: update.value,
        action: update.action || 'set',
      });
    } catch {
      // Skip malformed updates
    }
  }

  const cleanReply = aiResponse
    .replace(/<<<FIELD_UPDATE>>>[\s\S]*?<<<END_FIELD_UPDATE>>>/g, '')
    .trim();

  return { cleanReply, fieldUpdates };
}
