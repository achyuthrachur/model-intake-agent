import { parseFieldUpdates } from '@/lib/field-update-parser';

describe('parseFieldUpdates', () => {
  it('extracts structured field updates and returns clean reply text', () => {
    const aiResponse = [
      'Thanks, I captured those details.',
      '<<<FIELD_UPDATE>>>{"section":"model_summary","field":"model_type","value":"Credit Risk","action":"set"}<<<END_FIELD_UPDATE>>>',
      '<<<FIELD_UPDATE>>>{"section":"model_summary","field":"risk_rating","value":"Tier 1 (Critical)"}<<<END_FIELD_UPDATE>>>',
      'What is the model owner name?',
    ].join('\n');

    const result = parseFieldUpdates(aiResponse);

    expect(result.cleanReply).toContain('Thanks, I captured those details.');
    expect(result.cleanReply).toContain('What is the model owner name?');
    expect(result.cleanReply).not.toContain('<<<FIELD_UPDATE>>>');
    expect(result.fieldUpdates).toHaveLength(2);
    expect(result.fieldUpdates[0]).toEqual({
      section: 'model_summary',
      field: 'model_type',
      value: 'Credit Risk',
      action: 'set',
    });
    expect(result.fieldUpdates[1]).toEqual({
      section: 'model_summary',
      field: 'risk_rating',
      value: 'Tier 1 (Critical)',
      action: 'set',
    });
  });

  it('ignores malformed JSON blocks', () => {
    const aiResponse =
      '<<<FIELD_UPDATE>>>{invalid json}<<<END_FIELD_UPDATE>>>Keep going with intake.';
    const result = parseFieldUpdates(aiResponse);

    expect(result.fieldUpdates).toHaveLength(0);
    expect(result.cleanReply).toContain('Keep going with intake.');
  });

  it('collapses excessive blank lines in clean reply', () => {
    const aiResponse = [
      'Thank you for providing the model name and type.',
      '',
      '',
      '',
      '<<<FIELD_UPDATE>>>{"section":"model_summary","field":"model_type","value":"Credit Risk","action":"set"}<<<END_FIELD_UPDATE>>>',
      '',
      '',
      '',
      'Next, could you specify the estimation technique used in this model?',
    ].join('\n');

    const result = parseFieldUpdates(aiResponse);

    expect(result.cleanReply).toBe(
      'Thank you for providing the model name and type.\n\nNext, could you specify the estimation technique used in this model?',
    );
  });
});
