// ============================================================
// Model Intake Portal — Type Definitions
// ============================================================

// --- Chat Types ---
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  fieldUpdates?: FieldUpdate[];
}

export interface FieldUpdate {
  section: string;
  field: string;
  value: string | string[] | Record<string, string>;
  action?: 'set' | 'add_row' | 'remove_row';
}

// --- Model Summary Fields ---
export interface ModelSummaryFields {
  modelType: string;
  estimationTechnique: string;
  modelDeveloper: string;
  modelOwner: string;
  modelUsage: string;
  upstreamModels: string;
  downstreamModels: string;
  riskRating: string;
  policyCoverage: string;
  modelValidator: string;
  dateOfValidation: string;
  validationRating: string;
  dateOfImplementation: string;
}

// --- Executive Summary Fields ---
export interface AssumptionRow {
  id: string;
  description: string;
  evidence: string;
}

export interface LimitationRow {
  id: string;
  limitation: string;
  mitigatingRisk: string;
}

export interface ExecutiveSummaryFields {
  businessPurpose: string;
  regulatoryStandards: string;
  reportingImpact: string;
  businessUnits: string[];
  usageFrequency: string;
  productsCovered: string;
  methodologySummary: string;
  keyModelDrivers: string;
  dataSourcesSummary: string;
  dataPeriod: string;
  outputDescription: string;
  modelInterdependencies: string;
  alternativesConsidered: string;
  assumptions: AssumptionRow[];
  limitations: LimitationRow[];
}

// --- Model Design Fields ---
export interface ModelDesignFields {
  theoryAndApproach: string;
  candidateVariables: string;
  variableSelectionProcess: string;
  estimationMethodology: string;
  methodologyJustification: string;
  modelStructure: string;
  variableSources: string;
  segmentation: string;
  iterativeSteps: string;
  adjustmentsDescription: string;
  overrideFrequency: string;
  overrideDocumentation: string;
}

// --- Development Data Fields ---
export interface DevelopmentDataFields {
  internalDataSources: string;
  externalData: string;
  dataVolume: string;
  dataApplicability: string;
  personalInfoUsed: string;
  dataDictionaryAvailable: string;
  proxyConsortiumData: string;
  qualityAssessment: string;
  dataCertification: string;
  treatmentsTransformations: string;
  extractionProcess: string;
  cleansingProcess: string;
  etlDocumentation: string;
}

// --- Output & Use Fields ---
export interface OutputUseFields {
  backTestingApproach: string;
  backTestingDescription: string;
  backTestingResults: string;
  sensitivityPerformed: string;
  sensitivityDescription: string;
  benchmarkModel: string;
  benchmarkResults: string;
  parallelRun: string;
  monitoringApproach: string;
  monitoringFrequency: string;
  comparisonToDeveloper: string;
  tuningProcess: string;
}

// --- Implementation Fields ---
export interface ImplementationFields {
  implementationOverview: string;
  systemFlowDiagram: string;
  standardSettings: string;
  implementationTesting: string;
  thirdPartyCertification: string;
  accessControls: string;
  securityControls: string;
  socReport: string;
  changeManagement: string;
  materialChangeDefinition: string;
  versionReleaseProcess: string;
  operatingProcedures: string;
  uatTesting: string;
  stepByStepGuide: string;
}

// --- Performance Fields ---
export interface PerformanceFields {
  adjustmentsPurpose: string;
  adjustmentsDetails: string;
  adjustmentsRationale: string;
  reportingStructure: string;
  reportingMetrics: string;
  reportingFrequency: string;
}

// --- Governance Fields ---
export interface ReferenceRow {
  id: string;
  name: string;
  type: string;
  description: string;
}

export interface GovernanceFields {
  designatedResources: string;
  backgroundExperience: string;
  staffingChanges: string;
  fallbackProcess: string;
  contingencyDetails: string;
  references: ReferenceRow[];
}

// --- Intake Form State ---
export interface IntakeFormState {
  modelSummary: ModelSummaryFields;
  executiveSummary: ExecutiveSummaryFields;
  modelDesign: ModelDesignFields;
  developmentData: DevelopmentDataFields;
  outputUse: OutputUseFields;
  implementation: ImplementationFields;
  performance: PerformanceFields;
  governance: GovernanceFields;
}

// --- Document Types ---
export interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'parsed' | 'error';
  progress: number;
  errorMessage?: string;
}

export interface ParsedDocument {
  id: string;
  filename: string;
  extractedText: string;
  sectionsCovered: string[];
  coverageDetail: Record<string, CoverageEntry>;
  documentSummary: string;
}

export interface CoverageEntry {
  covered: boolean;
  confidence: 'high' | 'medium' | 'low';
  summary: string;
}

export interface CoverageAnalysis {
  overallCoverage: Record<string, {
    status: 'covered' | 'partial' | 'gap';
    sources: string[];
    confidence?: 'high' | 'medium' | 'low';
  }>;
  gaps: string[];
}

// --- Report Types ---
export interface ReportSection {
  id: string;
  title: string;
  content: string;
}

export interface GeneratedReport {
  bankName: string;
  modelName: string;
  sections: ReportSection[];
  generationNotes: string[];
  generatedAt: number;
}

// --- Config Types ---
export type AIModel = 'gpt-4o' | 'gpt-4o-mini';

export interface PortalConfig {
  selectedModel: AIModel;
  bankName: string;
  useMockData: boolean;
}
