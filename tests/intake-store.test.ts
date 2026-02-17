import { useIntakeStore } from '@/stores/intake-store';

describe('intake store', () => {
  beforeEach(() => {
    useIntakeStore.getState().resetSession();
  });

  it('applies snake_case field updates and tracks recent updates', () => {
    const store = useIntakeStore.getState();
    store.applyFieldUpdates([
      {
        section: 'model_summary',
        field: 'model_type',
        value: 'Credit Risk',
        action: 'set',
      },
    ]);

    const state = useIntakeStore.getState();
    expect(state.formData.modelSummary.modelType).toBe('Credit Risk');
    expect(state.recentlyUpdatedFields.has('modelSummary.modelType')).toBe(true);
  });

  it('adds manual edit system messages and de-duplicates immediate repeats', () => {
    const store = useIntakeStore.getState();
    store.addManualEditSystemMessage('modelSummary', 'modelType', 'Credit Risk');
    store.addManualEditSystemMessage('modelSummary', 'modelType', 'Credit Risk');

    const systemMessages = useIntakeStore
      .getState()
      .messages.filter((msg) => msg.role === 'system');
    expect(systemMessages).toHaveLength(1);
    expect(systemMessages[0].content).toContain('Manual field edit: modelSummary.modelType');
  });

  it('resets session state to defaults', () => {
    const store = useIntakeStore.getState();
    store.updateField('modelSummary', 'modelType', 'Credit Risk');
    store.addManualEditSystemMessage('modelSummary', 'modelType', 'Credit Risk');
    store.setStep(3);
    store.resetSession();

    const state = useIntakeStore.getState();
    expect(state.currentStep).toBe(1);
    expect(state.messages).toHaveLength(0);
    expect(state.formData.modelSummary.modelType).toBe('');
  });
});
