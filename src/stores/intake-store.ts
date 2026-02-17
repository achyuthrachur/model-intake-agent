import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  ChatMessage,
  FieldUpdate,
  IntakeFormState,
  ModelSummaryFields,
  ExecutiveSummaryFields,
  ModelDesignFields,
  DevelopmentDataFields,
  OutputUseFields,
  ImplementationFields,
  PerformanceFields,
  GovernanceFields,
  UploadedFile,
  ParsedDocument,
  CoverageAnalysis,
  GeneratedReport,
  AIModel,
  AssumptionRow,
  LimitationRow,
  ReferenceRow,
} from '@/types';

// ============================================================
// Initial Form State Factory
// ============================================================

function createInitialFormState(): IntakeFormState {
  const modelSummary: ModelSummaryFields = {
    modelType: '',
    estimationTechnique: '',
    modelDeveloper: '',
    modelOwner: '',
    modelUsage: '',
    upstreamModels: '',
    downstreamModels: '',
    riskRating: '',
    policyCoverage: '',
    modelValidator: '',
    dateOfValidation: '',
    validationRating: '',
    dateOfImplementation: '',
  };

  const executiveSummary: ExecutiveSummaryFields = {
    businessPurpose: '',
    regulatoryStandards: '',
    reportingImpact: '',
    businessUnits: [],
    usageFrequency: '',
    productsCovered: '',
    methodologySummary: '',
    keyModelDrivers: '',
    dataSourcesSummary: '',
    dataPeriod: '',
    outputDescription: '',
    modelInterdependencies: '',
    alternativesConsidered: '',
    assumptions: [],
    limitations: [],
  };

  const modelDesign: ModelDesignFields = {
    theoryAndApproach: '',
    candidateVariables: '',
    variableSelectionProcess: '',
    estimationMethodology: '',
    methodologyJustification: '',
    modelStructure: '',
    variableSources: '',
    segmentation: '',
    iterativeSteps: '',
    adjustmentsDescription: '',
    overrideFrequency: '',
    overrideDocumentation: '',
  };

  const developmentData: DevelopmentDataFields = {
    internalDataSources: '',
    externalData: '',
    dataVolume: '',
    dataApplicability: '',
    personalInfoUsed: '',
    dataDictionaryAvailable: '',
    proxyConsortiumData: '',
    qualityAssessment: '',
    dataCertification: '',
    treatmentsTransformations: '',
    extractionProcess: '',
    cleansingProcess: '',
    etlDocumentation: '',
  };

  const outputUse: OutputUseFields = {
    backTestingApproach: '',
    backTestingDescription: '',
    backTestingResults: '',
    sensitivityPerformed: '',
    sensitivityDescription: '',
    benchmarkModel: '',
    benchmarkResults: '',
    parallelRun: '',
    monitoringApproach: '',
    monitoringFrequency: '',
    comparisonToDeveloper: '',
    tuningProcess: '',
  };

  const implementation: ImplementationFields = {
    implementationOverview: '',
    systemFlowDiagram: '',
    standardSettings: '',
    implementationTesting: '',
    thirdPartyCertification: '',
    accessControls: '',
    securityControls: '',
    socReport: '',
    changeManagement: '',
    materialChangeDefinition: '',
    versionReleaseProcess: '',
    operatingProcedures: '',
    uatTesting: '',
    stepByStepGuide: '',
  };

  const performance: PerformanceFields = {
    adjustmentsPurpose: '',
    adjustmentsDetails: '',
    adjustmentsRationale: '',
    reportingStructure: '',
    reportingMetrics: '',
    reportingFrequency: '',
  };

  const governance: GovernanceFields = {
    designatedResources: '',
    backgroundExperience: '',
    staffingChanges: '',
    fallbackProcess: '',
    contingencyDetails: '',
    references: [],
  };

  return {
    modelSummary,
    executiveSummary,
    modelDesign,
    developmentData,
    outputUse,
    implementation,
    performance,
    governance,
  };
}

// ============================================================
// Section Name Mapping (snake_case API → camelCase store)
// ============================================================

const SECTION_MAP: Record<string, keyof IntakeFormState> = {
  model_summary: 'modelSummary',
  executive_summary: 'executiveSummary',
  model_design: 'modelDesign',
  development_data: 'developmentData',
  output_use: 'outputUse',
  implementation: 'implementation',
  performance: 'performance',
  governance: 'governance',
};

// ============================================================
// Utility: snake_case → camelCase
// ============================================================

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
}

// ============================================================
// Store Interface
// ============================================================

interface IntakeStore {
  // Config
  n8nBaseUrl: string;
  setN8nBaseUrl: (url: string) => void;
  openaiApiKey: string;
  setApiKey: (key: string) => void;
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  bankName: string;
  setBankName: (name: string) => void;
  useMockData: boolean;
  setUseMockData: (v: boolean) => void;

  // Wizard
  currentStep: 1 | 2 | 3;
  setStep: (step: 1 | 2 | 3) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  clearMessages: () => void;
  isStreaming: boolean;
  setIsStreaming: (v: boolean) => void;

  // Form
  formData: IntakeFormState;
  updateField: (section: keyof IntakeFormState, field: string, value: unknown) => void;
  applyFieldUpdates: (updates: FieldUpdate[]) => void;
  addTableRow: (section: keyof IntakeFormState, field: string, row: AssumptionRow | LimitationRow | ReferenceRow) => void;
  removeTableRow: (section: keyof IntakeFormState, field: string, rowId: string) => void;
  getCompletionPercentage: () => number;
  getUnfilledFields: () => string[];
  recentlyUpdatedFields: Set<string>;
  markFieldUpdated: (fieldKey: string) => void;
  clearRecentUpdates: () => void;

  // Documents
  uploadedFiles: UploadedFile[];
  addUploadedFile: (file: UploadedFile) => void;
  updateFileStatus: (fileId: string, status: UploadedFile['status'], progress?: number) => void;
  removeUploadedFile: (fileId: string) => void;
  parsedDocuments: ParsedDocument[];
  setParsedDocuments: (docs: ParsedDocument[]) => void;
  coverageAnalysis: CoverageAnalysis | null;
  setCoverageAnalysis: (analysis: CoverageAnalysis) => void;

  // Report
  generatedReport: GeneratedReport | null;
  setGeneratedReport: (report: GeneratedReport) => void;
  reportStatus: 'idle' | 'generating' | 'complete' | 'error';
  setReportStatus: (status: 'idle' | 'generating' | 'complete' | 'error') => void;
  currentGeneratingSection: number;
  setCurrentGeneratingSection: (n: number) => void;

  // Session
  resetSession: () => void;
}

// ============================================================
// Zustand Store with localStorage persistence
// ============================================================

export const useIntakeStore = create<IntakeStore>()(
  persist(
    (set, get) => ({
      // --------------------------------------------------------
      // Config
      // --------------------------------------------------------
      n8nBaseUrl: 'http://localhost:5678',
      setN8nBaseUrl: (url: string) => set({ n8nBaseUrl: url }),

      openaiApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY ?? '',
      setApiKey: (key: string) => set({ openaiApiKey: key }),

      selectedModel: 'gpt-4o' as AIModel,
      setSelectedModel: (model: AIModel) => set({ selectedModel: model }),

      bankName: '',
      setBankName: (name: string) => set({ bankName: name }),

      useMockData: true,
      setUseMockData: (v: boolean) => set({ useMockData: v }),

      // --------------------------------------------------------
      // Wizard
      // --------------------------------------------------------
      currentStep: 1 as 1 | 2 | 3,
      setStep: (step: 1 | 2 | 3) => set({ currentStep: step }),

      // --------------------------------------------------------
      // Chat
      // --------------------------------------------------------
      messages: [],
      addMessage: (msg: ChatMessage) =>
        set((state) => ({ messages: [...state.messages, msg] })),
      clearMessages: () => set({ messages: [] }),

      isStreaming: false,
      setIsStreaming: (v: boolean) => set({ isStreaming: v }),

      // --------------------------------------------------------
      // Form
      // --------------------------------------------------------
      formData: createInitialFormState(),

      updateField: (section: keyof IntakeFormState, field: string, value: unknown) =>
        set((state) => ({
          formData: {
            ...state.formData,
            [section]: {
              ...state.formData[section],
              [field]: value,
            },
          },
        })),

      applyFieldUpdates: (updates: FieldUpdate[]) => {
        const store = get();

        for (const update of updates) {
          // Map snake_case section name to camelCase store key
          const sectionKey = SECTION_MAP[update.section] ?? (update.section as keyof IntakeFormState);
          // Map snake_case field name to camelCase
          const fieldKey = snakeToCamel(update.field);

          if (update.action === 'add_row') {
            store.addTableRow(sectionKey, fieldKey, update.value as unknown as AssumptionRow | LimitationRow | ReferenceRow);
          } else {
            // Default action is "set"
            store.updateField(sectionKey, fieldKey, update.value);
          }

          // Mark the field as recently updated for highlight animation
          store.markFieldUpdated(`${sectionKey}.${fieldKey}`);
        }
      },

      addTableRow: (section: keyof IntakeFormState, field: string, row: AssumptionRow | LimitationRow | ReferenceRow) =>
        set((state) => {
          const sectionData = state.formData[section];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentRows = (sectionData as any)[field];
          const rowsArray = Array.isArray(currentRows) ? currentRows : [];

          return {
            formData: {
              ...state.formData,
              [section]: {
                ...sectionData,
                [field]: [...rowsArray, row],
              },
            },
          };
        }),

      removeTableRow: (section: keyof IntakeFormState, field: string, rowId: string) =>
        set((state) => {
          const sectionData = state.formData[section];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const currentRows = (sectionData as any)[field];
          const rowsArray = Array.isArray(currentRows) ? currentRows : [];

          return {
            formData: {
              ...state.formData,
              [section]: {
                ...sectionData,
                [field]: rowsArray.filter((r: { id: string }) => r.id !== rowId),
              },
            },
          };
        }),

      getCompletionPercentage: (): number => {
        const { formData } = get();
        let totalFields = 0;
        let filledFields = 0;

        for (const sectionKey of Object.keys(formData) as (keyof IntakeFormState)[]) {
          const section = formData[sectionKey];

          for (const [, value] of Object.entries(section)) {
            totalFields++;

            if (Array.isArray(value)) {
              if (value.length > 0) {
                filledFields++;
              }
            } else if (typeof value === 'string') {
              if (value.trim() !== '') {
                filledFields++;
              }
            }
          }
        }

        if (totalFields === 0) return 0;
        return Math.round((filledFields / totalFields) * 100);
      },

      getUnfilledFields: (): string[] => {
        const { formData } = get();
        const unfilled: string[] = [];

        for (const sectionKey of Object.keys(formData) as (keyof IntakeFormState)[]) {
          const section = formData[sectionKey];

          for (const [fieldKey, value] of Object.entries(section)) {
            const isFilled = Array.isArray(value)
              ? value.length > 0
              : typeof value === 'string' && value.trim() !== '';

            if (!isFilled) {
              unfilled.push(`${sectionKey}.${fieldKey}`);
            }
          }
        }

        return unfilled;
      },

      recentlyUpdatedFields: new Set<string>(),

      markFieldUpdated: (fieldKey: string) =>
        set((state) => {
          const updated = new Set(state.recentlyUpdatedFields);
          updated.add(fieldKey);
          return { recentlyUpdatedFields: updated };
        }),

      clearRecentUpdates: () => set({ recentlyUpdatedFields: new Set<string>() }),

      // --------------------------------------------------------
      // Documents
      // --------------------------------------------------------
      uploadedFiles: [],

      addUploadedFile: (file: UploadedFile) =>
        set((state) => ({ uploadedFiles: [...state.uploadedFiles, file] })),

      updateFileStatus: (fileId: string, status: UploadedFile['status'], progress?: number) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.map((f) =>
            f.id === fileId
              ? { ...f, status, ...(progress !== undefined ? { progress } : {}) }
              : f
          ),
        })),

      removeUploadedFile: (fileId: string) =>
        set((state) => ({
          uploadedFiles: state.uploadedFiles.filter((f) => f.id !== fileId),
        })),

      parsedDocuments: [],
      setParsedDocuments: (docs: ParsedDocument[]) => set({ parsedDocuments: docs }),

      coverageAnalysis: null,
      setCoverageAnalysis: (analysis: CoverageAnalysis) => set({ coverageAnalysis: analysis }),

      // --------------------------------------------------------
      // Report
      // --------------------------------------------------------
      generatedReport: null,
      setGeneratedReport: (report: GeneratedReport) => set({ generatedReport: report }),

      reportStatus: 'idle' as const,
      setReportStatus: (status: 'idle' | 'generating' | 'complete' | 'error') =>
        set({ reportStatus: status }),

      currentGeneratingSection: 0,
      setCurrentGeneratingSection: (n: number) => set({ currentGeneratingSection: n }),

      // --------------------------------------------------------
      // Session reset
      // --------------------------------------------------------
      resetSession: () =>
        set({
          currentStep: 1,
          messages: [],
          formData: createInitialFormState(),
          uploadedFiles: [],
          parsedDocuments: [],
          coverageAnalysis: null,
          generatedReport: null,
          reportStatus: 'idle',
          currentGeneratingSection: 0,
          recentlyUpdatedFields: new Set<string>(),
        }),
    }),
    {
      name: 'model-intake-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persist only what matters for session recovery
        n8nBaseUrl: state.n8nBaseUrl,
        openaiApiKey: state.openaiApiKey,
        selectedModel: state.selectedModel,
        bankName: state.bankName,
        useMockData: state.useMockData,
        currentStep: state.currentStep,
        messages: state.messages,
        formData: state.formData,
        // Exclude: isStreaming, recentlyUpdatedFields, uploadedFiles (contain File objects),
        //          reportStatus (transient), currentGeneratingSection (transient)
        parsedDocuments: state.parsedDocuments,
        coverageAnalysis: state.coverageAnalysis,
        generatedReport: state.generatedReport,
      }),
    },
  ),
);
