import { mockGenerateReport, mockProcessDocuments, mockSendChatMessage } from '@/lib/mock-client';
import { useIntakeStore } from '@/stores/intake-store';

describe('mock integration flow', () => {
  beforeEach(() => {
    useIntakeStore.getState().resetSession();
  });

  it(
    'runs chat -> document processing -> report generation',
    async () => {
      const state = useIntakeStore.getState();

      const chat = await mockSendChatMessage('This is a FICO credit scorecard model', []);
      state.applyFieldUpdates(chat.fieldUpdates);

      const formAfterChat = useIntakeStore.getState().formData;
      expect(formAfterChat.modelSummary.modelType).toBe('Credit Risk');

      const files = [
        new File(['Model methodology content'], 'Vendor_Methodology.pdf', {
          type: 'application/pdf',
        }),
        new File(['Validation report content'], 'Validation_Report.docx', {
          type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      ];

      const docs = await mockProcessDocuments(files);
      expect(docs.documents.length).toBeGreaterThan(0);
      expect(Object.keys(docs.overallCoverage).length).toBeGreaterThan(0);

      const report = await mockGenerateReport(
        useIntakeStore.getState().formData,
        docs.documents,
        'Acme Bank',
      );

      expect(report.bankName).toBe('Acme Bank');
      expect(report.sections.length).toBeGreaterThan(0);
      expect(report.generationNotes.length).toBeGreaterThan(0);
    },
    20000,
  );
});
