// ---------------------------------------------------------------------------
// intake-schema.ts
// Defines every intake-form field organised by section.
// Each field carries rendering metadata (type, options, placeholder) and an
// optional AI probing hint that the assistant uses when gathering information.
// The exported INTAKE_SCHEMA array drives form rendering, completion
// calculation, and AI-guided interview logic.
// ---------------------------------------------------------------------------

export interface FieldDefinition {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'date' | 'multi-select' | 'table';
  options?: string[];
  placeholder?: string;
  aiHint?: string;
  tableColumns?: { key: string; label: string }[];
}

export interface SectionSchema {
  id: string;
  title: string;
  fields: FieldDefinition[];
}

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

export const INTAKE_SCHEMA: SectionSchema[] = [
  // =========================================================================
  // 0 — Model Summary (Cover Page)
  // =========================================================================
  {
    id: 'modelSummary',
    title: 'Model Summary',
    fields: [
      {
        name: 'modelType',
        label: 'Model Type',
        type: 'select',
        options: [
          'Credit Risk',
          'Market Risk',
          'Operational Risk',
          'Liquidity Risk',
          'ALM/Interest Rate Risk',
          'Fraud Detection',
          'AML/BSA',
          'Fair Lending',
          'Pricing',
          'Valuation',
          'Stress Testing',
          'CECL/IFRS9',
          'Cash Flow',
          'Roll Rate',
          'Climate Risk',
          'Other',
        ],
        placeholder: 'Select the primary model type',
        aiHint:
          'What category of risk or business function does this model address?',
      },
      {
        name: 'estimationTechnique',
        label: 'Estimation Technique',
        type: 'select',
        options: [
          'Regression',
          'Logistic Regression',
          'Cash Flow Analysis',
          'Algorithm/Rules-Based',
          'Decision Tree/Random Forest',
          'Gradient Boosting',
          'Neural Network/Deep Learning',
          'Monte Carlo Simulation',
          'Time Series (ARIMA/GARCH)',
          'Roll Rate',
          'Scorecard',
          'Bayesian Methods',
          'Hybrid',
          'Other',
        ],
        placeholder: 'Select the primary estimation technique',
        aiHint:
          'What statistical or computational method does the model use to produce its estimates?',
      },
      {
        name: 'modelDeveloper',
        label: 'Model Developer',
        type: 'text',
        placeholder: 'Vendor name or internal team',
        aiHint:
          'Who originally built this model — a third-party vendor or an internal team?',
      },
      {
        name: 'modelOwner',
        label: 'Model Owner',
        type: 'text',
        placeholder: 'Name and title',
        aiHint:
          'Who is the designated business owner accountable for the model?',
      },
      {
        name: 'modelUsage',
        label: 'Model Usage',
        type: 'textarea',
        placeholder: 'Describe how the model output is used in business decisions',
        aiHint:
          'What business decisions does this model directly inform?',
      },
      {
        name: 'upstreamModels',
        label: 'Upstream Models',
        type: 'text',
        placeholder: 'List any models that feed into this model',
        aiHint:
          'Does this model take input from any other models?',
      },
      {
        name: 'downstreamModels',
        label: 'Downstream Models',
        type: 'text',
        placeholder: 'List any models or processes that consume this model\'s output',
        aiHint:
          'Do any other models or processes depend on this model\'s output?',
      },
      {
        name: 'riskRating',
        label: 'Risk Rating',
        type: 'select',
        options: [
          'Tier 1 (Critical)',
          'Tier 2 (High)',
          'Tier 3 (Medium)',
          'Tier 4 (Low)',
        ],
        placeholder: 'Select the model risk tier',
        aiHint:
          'How has this model been classified in terms of materiality and risk to the institution?',
      },
      {
        name: 'policyCoverage',
        label: 'Policy Coverage',
        type: 'textarea',
        placeholder: 'Applicable internal policies and regulatory frameworks',
        aiHint:
          'Which internal policies, regulatory guidelines, or frameworks govern the use of this model?',
      },
      {
        name: 'modelValidator',
        label: 'Model Validator',
        type: 'text',
        placeholder: 'Name/team responsible for validation',
        aiHint:
          'Who is responsible for the independent validation of this model?',
      },
      {
        name: 'dateOfValidation',
        label: 'Date of Validation',
        type: 'date',
        placeholder: 'Select validation date',
        aiHint:
          'When was the most recent independent validation completed?',
      },
      {
        name: 'validationRating',
        label: 'Validation Rating',
        type: 'select',
        options: [
          'Satisfactory',
          'Satisfactory with Recommendations',
          'Needs Improvement',
          'Unsatisfactory',
          'Not Yet Validated',
        ],
        placeholder: 'Select the most recent validation rating',
        aiHint:
          'What was the overall rating or conclusion from the last validation?',
      },
      {
        name: 'dateOfImplementation',
        label: 'Date of Implementation',
        type: 'date',
        placeholder: 'Select implementation date',
        aiHint:
          'When was this model first put into production use?',
      },
    ],
  },

  // =========================================================================
  // 1 — Executive Summary
  // =========================================================================
  {
    id: 'executiveSummary',
    title: 'Section 1: Executive Summary',
    fields: [
      // 1.1 Business Purpose and Use ----------------------------------------
      {
        name: 'businessPurpose',
        label: 'Business Purpose',
        type: 'textarea',
        placeholder: 'Describe the business problem this model solves',
        aiHint:
          'What business problem does this model solve? Why was it created?',
      },
      {
        name: 'regulatoryStandards',
        label: 'Regulatory Standards',
        type: 'textarea',
        placeholder: 'Applicable regulatory or accounting standards',
        aiHint:
          'Does this model relate to specific regulatory or accounting standards (e.g., CECL, Basel, CCAR)?',
      },
      {
        name: 'reportingImpact',
        label: 'Reporting Impact',
        type: 'select',
        options: ['Direct Impact', 'Indirect Impact', 'No Impact'],
        placeholder: 'Select the impact on financial reporting',
        aiHint:
          'Does this model directly or indirectly affect financial or regulatory reporting?',
      },
      {
        name: 'businessUnits',
        label: 'Business Units',
        type: 'multi-select',
        options: [
          'Retail Banking',
          'Commercial Banking',
          'Wealth Management',
          'Capital Markets',
          'Treasury',
          'Risk Management',
          'Operations',
          'Compliance',
          'Other',
        ],
        placeholder: 'Select all business units that use this model',
        aiHint:
          'Which business units or departments rely on the output of this model?',
      },
      {
        name: 'usageFrequency',
        label: 'Usage Frequency',
        type: 'select',
        options: [
          'Real-time/Continuous',
          'Daily',
          'Weekly',
          'Monthly',
          'Quarterly',
          'Annually',
          'Ad-hoc',
        ],
        placeholder: 'Select how often the model is run',
        aiHint:
          'How frequently is this model executed or its results consumed?',
      },

      // 1.2 Model Description ------------------------------------------------
      {
        name: 'productsCovered',
        label: 'Products Covered',
        type: 'textarea',
        placeholder: 'Describe the specific products or portfolios',
        aiHint:
          'What specific products or portfolios does this model cover?',
      },
      {
        name: 'methodologySummary',
        label: 'Methodology Summary',
        type: 'textarea',
        placeholder: 'High-level methodology overview',
        aiHint:
          'Can you provide a plain-language summary of how the model works at a high level?',
      },
      {
        name: 'keyModelDrivers',
        label: 'Key Model Drivers',
        type: 'textarea',
        placeholder: 'List the most important variables or factors',
        aiHint:
          'What are the most important variables or factors that drive the model output?',
      },
      {
        name: 'dataSourcesSummary',
        label: 'Data Sources Summary',
        type: 'textarea',
        placeholder: 'Brief overview of data sources',
        aiHint:
          'What are the primary data sources feeding into this model?',
      },
      {
        name: 'dataPeriod',
        label: 'Data Period',
        type: 'text',
        placeholder: 'e.g., January 2010 – December 2024',
        aiHint:
          'What time period does the development or calibration data cover?',
      },
      {
        name: 'outputDescription',
        label: 'Output Description',
        type: 'textarea',
        placeholder: 'What the model produces (scores, estimates, classifications, etc.)',
        aiHint:
          'What does the model produce? Describe the output format and how it is interpreted.',
      },
      {
        name: 'modelInterdependencies',
        label: 'Model Interdependencies',
        type: 'textarea',
        placeholder: 'Links to upstream and downstream models or processes',
        aiHint:
          'How does this model interact with other models or systems in the model ecosystem?',
      },

      // 1.3 Alternatives Considered ------------------------------------------
      {
        name: 'alternativesConsidered',
        label: 'Alternatives Considered',
        type: 'textarea',
        placeholder: 'Other approaches evaluated and reasons for rejection',
        aiHint:
          'What other approaches were evaluated before selecting this methodology? Why were they rejected?',
      },

      // 1.4 Model Assumptions ------------------------------------------------
      {
        name: 'assumptions',
        label: 'Model Assumptions',
        type: 'table',
        tableColumns: [
          { key: 'description', label: 'Description' },
          { key: 'evidence', label: 'Evidence' },
        ],
        aiHint:
          'What key assumptions underlie this model, and what evidence supports each assumption?',
      },

      // 1.5 Model Limitations ------------------------------------------------
      {
        name: 'limitations',
        label: 'Model Limitations',
        type: 'table',
        tableColumns: [
          { key: 'limitation', label: 'Limitation' },
          { key: 'mitigatingRisk', label: 'Mitigating Risk' },
        ],
        aiHint:
          'What are the known limitations of this model and how is the associated risk mitigated?',
      },
    ],
  },

  // =========================================================================
  // 2 — Model Design
  // =========================================================================
  {
    id: 'modelDesign',
    title: 'Section 2: Model Design',
    fields: [
      // 2.1–2.5 -------------------------------------------------------------
      {
        name: 'theoryAndApproach',
        label: 'Theory and Approach',
        type: 'textarea',
        placeholder: 'Describe the theoretical foundation',
        aiHint:
          'What is the theoretical or academic foundation behind the chosen modeling approach?',
      },
      {
        name: 'candidateVariables',
        label: 'Candidate Variables',
        type: 'textarea',
        placeholder: 'Candidate variables and business rationale',
        aiHint:
          'What candidate variables were considered and what is the business rationale for each?',
      },
      {
        name: 'variableSelectionProcess',
        label: 'Variable Selection Process',
        type: 'textarea',
        placeholder: 'Process used to select final variables',
        aiHint:
          'What process was used to narrow down candidate variables to the final set?',
      },
      {
        name: 'estimationMethodology',
        label: 'Estimation Methodology',
        type: 'textarea',
        placeholder: 'Detailed estimation method',
        aiHint:
          'Describe the estimation method in detail — how are parameters fitted or calibrated?',
      },
      {
        name: 'methodologyJustification',
        label: 'Methodology Justification',
        type: 'textarea',
        placeholder: 'Why this methodology was chosen',
        aiHint:
          'Why was this particular methodology chosen over other viable approaches?',
      },
      {
        name: 'modelStructure',
        label: 'Model Structure',
        type: 'textarea',
        placeholder: 'Final model structure, equations, or algorithm description',
        aiHint:
          'What is the final model structure? Include equations, decision rules, or algorithm descriptions.',
      },
      {
        name: 'variableSources',
        label: 'Variable Sources',
        type: 'textarea',
        placeholder: 'Data sources for each model variable',
        aiHint:
          'Where does the data for each variable come from? Are there any derived or computed inputs?',
      },
      {
        name: 'segmentation',
        label: 'Segmentation',
        type: 'textarea',
        placeholder: 'Segmentation details (if applicable)',
        aiHint:
          'Is the model segmented by product, geography, risk grade, or other criteria? Describe the segmentation.',
      },
      {
        name: 'iterativeSteps',
        label: 'Iterative Steps',
        type: 'textarea',
        placeholder: 'Process flow for non-statistical or rules-based models',
        aiHint:
          'For non-statistical or rules-based models, describe the step-by-step process flow.',
      },

      // 2.6 Judgmental Adjustments -------------------------------------------
      {
        name: 'adjustmentsDescription',
        label: 'Judgmental Adjustments Description',
        type: 'textarea',
        placeholder: 'Describe any manual adjustments to model output',
        aiHint:
          'Is model output ever manually adjusted? By whom and under what circumstances?',
      },
      {
        name: 'overrideFrequency',
        label: 'Override Frequency',
        type: 'select',
        options: [
          'Never',
          'Rarely (< 5%)',
          'Sometimes (5-20%)',
          'Frequently (> 20%)',
        ],
        placeholder: 'How often is the model output overridden?',
        aiHint:
          'How frequently are model outputs overridden by human judgment?',
      },
      {
        name: 'overrideDocumentation',
        label: 'Override Documentation',
        type: 'textarea',
        placeholder: 'How overrides are tracked and documented',
        aiHint:
          'How are manual overrides tracked, documented, and reviewed?',
      },
    ],
  },

  // =========================================================================
  // 3 — Development Data
  // =========================================================================
  {
    id: 'developmentData',
    title: 'Section 3: Development Data',
    fields: [
      // 3.1 Data Sources -----------------------------------------------------
      {
        name: 'internalDataSources',
        label: 'Internal Data Sources',
        type: 'textarea',
        placeholder: 'Describe internal data systems used',
        aiHint:
          'What internal data systems or databases provide data for this model?',
      },
      {
        name: 'externalData',
        label: 'External Data',
        type: 'textarea',
        placeholder: 'External or vendor data sources',
        aiHint:
          'Is external or vendor-provided data used? Which vendors and what data?',
      },
      {
        name: 'dataVolume',
        label: 'Data Volume',
        type: 'text',
        placeholder: 'e.g., 1.2 million records, 10 years of monthly data',
        aiHint:
          'Approximately how many records and what time periods are covered by the development data?',
      },
      {
        name: 'dataApplicability',
        label: 'Data Applicability',
        type: 'textarea',
        placeholder: 'For vendor models: applicability to the bank\'s portfolio',
        aiHint:
          'For vendor models, how applicable is the vendor\'s development data to your institution\'s specific portfolio?',
      },
      {
        name: 'personalInfoUsed',
        label: 'Personal Information Used',
        type: 'select',
        options: ['Yes — Direct PII', 'Yes — De-identified', 'No'],
        placeholder: 'Does the model use personal information?',
        aiHint:
          'Does the model use personally identifiable information (PII), de-identified data, or neither?',
      },
      {
        name: 'dataDictionaryAvailable',
        label: 'Data Dictionary Available',
        type: 'select',
        options: ['Yes — Complete', 'Yes — Partial', 'No'],
        placeholder: 'Is a data dictionary available?',
        aiHint:
          'Is there a data dictionary that defines all fields used in the model?',
      },
      {
        name: 'proxyConsortiumData',
        label: 'Proxy / Consortium Data',
        type: 'textarea',
        placeholder: 'Describe any proxy or consortium data used',
        aiHint:
          'Is any proxy or consortium data used in lieu of direct observations? Describe.',
      },

      // 3.2–3.3 Data Quality and Preparation --------------------------------
      {
        name: 'qualityAssessment',
        label: 'Quality Assessment',
        type: 'textarea',
        placeholder: 'Describe the data quality assessment performed',
        aiHint:
          'What data quality checks and assessments were performed on the development data?',
      },
      {
        name: 'dataCertification',
        label: 'Data Certification',
        type: 'textarea',
        placeholder: 'Data certification details',
        aiHint:
          'Has the data been formally certified or attested? By whom and when?',
      },
      {
        name: 'treatmentsTransformations',
        label: 'Treatments and Transformations',
        type: 'textarea',
        placeholder: 'Describe data treatments and transformations applied',
        aiHint:
          'What treatments or transformations were applied to the raw data before modeling?',
      },
      {
        name: 'extractionProcess',
        label: 'Extraction Process',
        type: 'textarea',
        placeholder: 'How data is extracted from source systems',
        aiHint:
          'How is data extracted from source systems? Is it automated or manual?',
      },
      {
        name: 'cleansingProcess',
        label: 'Cleansing Process',
        type: 'textarea',
        placeholder: 'How data is cleansed and prepared',
        aiHint:
          'What cleansing steps are applied to handle missing values, outliers, or errors?',
      },
      {
        name: 'etlDocumentation',
        label: 'ETL Documentation',
        type: 'select',
        options: ['Fully Documented', 'Partially Documented', 'Not Documented'],
        placeholder: 'Select ETL documentation status',
        aiHint:
          'Is the extract-transform-load (ETL) process fully documented?',
      },
    ],
  },

  // =========================================================================
  // 4 — Output & Use
  // =========================================================================
  {
    id: 'outputUse',
    title: 'Section 4: Output & Use',
    fields: [
      // 4.1 Back-testing -----------------------------------------------------
      {
        name: 'backTestingApproach',
        label: 'Back-testing Approach',
        type: 'select',
        options: [
          'In-Sample Only',
          'Out-of-Sample Only',
          'Both',
          'Not Performed',
        ],
        placeholder: 'Select the back-testing approach used',
        aiHint:
          'Was back-testing performed in-sample, out-of-sample, or both?',
      },
      {
        name: 'backTestingDescription',
        label: 'Back-testing Description',
        type: 'textarea',
        placeholder: 'Describe the back-testing methodology and confidence intervals',
        aiHint:
          'How does back-testing work for this model? What confidence intervals or thresholds are used?',
      },
      {
        name: 'backTestingResults',
        label: 'Back-testing Results',
        type: 'textarea',
        placeholder: 'Summarize key back-testing results',
        aiHint:
          'What were the high-level results of back-testing? Did the model pass or fail?',
      },

      // 4.2 Sensitivity Analysis ---------------------------------------------
      {
        name: 'sensitivityPerformed',
        label: 'Sensitivity Analysis Performed',
        type: 'select',
        options: ['Yes — Comprehensive', 'Yes — Limited', 'No'],
        placeholder: 'Was sensitivity analysis performed?',
        aiHint:
          'Was a sensitivity analysis conducted? If so, how comprehensive was it?',
      },
      {
        name: 'sensitivityDescription',
        label: 'Sensitivity Analysis Description',
        type: 'textarea',
        placeholder: 'Describe how input changes are tested',
        aiHint:
          'How are input changes tested to understand their impact on model output?',
      },

      // 4.3 Benchmarking -----------------------------------------------------
      {
        name: 'benchmarkModel',
        label: 'Benchmark Model',
        type: 'textarea',
        placeholder: 'Describe benchmark or challenger models used for comparison',
        aiHint:
          'What alternative or challenger models is this model compared against?',
      },
      {
        name: 'benchmarkResults',
        label: 'Benchmark Results',
        type: 'textarea',
        placeholder: 'Key findings from benchmarking',
        aiHint:
          'What were the key findings when comparing this model to benchmarks?',
      },
      {
        name: 'parallelRun',
        label: 'Parallel Run',
        type: 'select',
        options: ['Yes', 'No', 'Not Applicable'],
        placeholder: 'Was a parallel run conducted?',
        aiHint:
          'Was this model run in parallel with the existing model or process before going live?',
      },

      // 4.4 Ongoing Monitoring -----------------------------------------------
      {
        name: 'monitoringApproach',
        label: 'Monitoring Approach',
        type: 'textarea',
        placeholder: 'Describe the plan for ongoing performance monitoring',
        aiHint:
          'What is the plan for ongoing performance monitoring of this model?',
      },
      {
        name: 'monitoringFrequency',
        label: 'Monitoring Frequency',
        type: 'select',
        options: ['Real-time', 'Daily', 'Weekly', 'Monthly', 'Quarterly'],
        placeholder: 'Select monitoring frequency',
        aiHint:
          'How often is the model monitored for performance degradation?',
      },
      {
        name: 'comparisonToDeveloper',
        label: 'Comparison to Developer Monitoring',
        type: 'textarea',
        placeholder: 'Describe how bank monitoring relates to vendor monitoring',
        aiHint:
          'For vendor models, how does the bank\'s monitoring compare to the vendor\'s own monitoring?',
      },
      {
        name: 'tuningProcess',
        label: 'Tuning / Recalibration Process',
        type: 'textarea',
        placeholder: 'Describe what triggers recalibration',
        aiHint:
          'What triggers recalibration or retuning of this model? What is the process?',
      },
    ],
  },

  // =========================================================================
  // 5 — Implementation
  // =========================================================================
  {
    id: 'implementation',
    title: 'Section 5: Implementation',
    fields: [
      // 5.1–5.4 -------------------------------------------------------------
      {
        name: 'implementationOverview',
        label: 'Implementation Overview',
        type: 'textarea',
        placeholder: 'Describe the platform and technology used',
        aiHint:
          'What platform, technology, or environment is this model deployed on?',
      },
      {
        name: 'systemFlowDiagram',
        label: 'System / Data Flow',
        type: 'textarea',
        placeholder: 'Describe the system and data flow',
        aiHint:
          'Can you describe the data flow from source systems through the model to downstream consumers?',
      },
      {
        name: 'standardSettings',
        label: 'Standard Settings',
        type: 'textarea',
        placeholder: 'Standard settings and conditions for change',
        aiHint:
          'What are the standard configuration settings and under what conditions are they changed?',
      },
      {
        name: 'implementationTesting',
        label: 'Implementation Testing',
        type: 'textarea',
        placeholder: 'Describe implementation testing performed',
        aiHint:
          'What testing was performed to ensure the model was correctly implemented in production?',
      },
      {
        name: 'thirdPartyCertification',
        label: 'Third-party Certification',
        type: 'textarea',
        placeholder: 'Vendor certification information',
        aiHint:
          'Is there a third-party or vendor certification for the implementation?',
      },
      {
        name: 'accessControls',
        label: 'Access Controls',
        type: 'textarea',
        placeholder: 'Describe access control measures',
        aiHint:
          'What access controls are in place to restrict who can run, modify, or view the model?',
      },
      {
        name: 'securityControls',
        label: 'Security Controls',
        type: 'textarea',
        placeholder: 'Describe security measures',
        aiHint:
          'What security measures protect the model, its data, and its output?',
      },
      {
        name: 'socReport',
        label: 'SOC Report',
        type: 'select',
        options: [
          'Available — No Issues',
          'Available — With Issues',
          'Not Available',
          'N/A',
        ],
        placeholder: 'Select SOC report status',
        aiHint:
          'Is a SOC report available for the vendor or platform? Were any issues noted?',
      },
      {
        name: 'changeManagement',
        label: 'Change Management',
        type: 'textarea',
        placeholder: 'Describe the change management process',
        aiHint:
          'What is the change management process for model updates or configuration changes?',
      },
      {
        name: 'materialChangeDefinition',
        label: 'Material Change Definition',
        type: 'textarea',
        placeholder: 'How material changes are defined',
        aiHint:
          'How does the organization define a "material change" to this model?',
      },
      {
        name: 'versionReleaseProcess',
        label: 'Version Release Process',
        type: 'textarea',
        placeholder: 'Describe the version release process',
        aiHint:
          'What is the process for releasing new versions of the model?',
      },
      {
        name: 'operatingProcedures',
        label: 'Operating Procedures',
        type: 'textarea',
        placeholder: 'Step-by-step operating procedures',
        aiHint:
          'Are there step-by-step operating procedures for running the model?',
      },
      {
        name: 'uatTesting',
        label: 'UAT Testing',
        type: 'textarea',
        placeholder: 'Describe user acceptance testing',
        aiHint:
          'Was user acceptance testing (UAT) performed? Describe the approach and results.',
      },
      {
        name: 'stepByStepGuide',
        label: 'Step-by-step Guide',
        type: 'select',
        options: ['Available', 'Partial', 'Not Available'],
        placeholder: 'Is a step-by-step user guide available?',
        aiHint:
          'Is there a step-by-step guide available for end users of this model?',
      },
    ],
  },

  // =========================================================================
  // 6 — Performance
  // =========================================================================
  {
    id: 'performance',
    title: 'Section 6: Performance',
    fields: [
      // 6.1 Adjustments and Overlays ----------------------------------------
      {
        name: 'adjustmentsPurpose',
        label: 'Adjustments Purpose',
        type: 'textarea',
        placeholder: 'Purpose of adjustments or overlays',
        aiHint:
          'What is the purpose of any post-model adjustments or overlays applied?',
      },
      {
        name: 'adjustmentsDetails',
        label: 'Adjustments Details',
        type: 'textarea',
        placeholder: 'Details of adjustments or overlays',
        aiHint:
          'Describe the specific adjustments or overlays in detail.',
      },
      {
        name: 'adjustmentsRationale',
        label: 'Adjustments Rationale',
        type: 'textarea',
        placeholder: 'Rationale for adjustments or overlays',
        aiHint:
          'What is the rationale or justification for these adjustments?',
      },

      // 6.2 Model Reporting --------------------------------------------------
      {
        name: 'reportingStructure',
        label: 'Reporting Structure',
        type: 'textarea',
        placeholder: 'Describe the reporting structure for model results',
        aiHint:
          'What is the reporting structure for communicating model results to stakeholders?',
      },
      {
        name: 'reportingMetrics',
        label: 'Reporting Metrics',
        type: 'textarea',
        placeholder: 'Metrics reported to management or regulators',
        aiHint:
          'What specific metrics or KPIs are reported based on the model output?',
      },
      {
        name: 'reportingFrequency',
        label: 'Reporting Frequency',
        type: 'select',
        options: [
          'Real-time',
          'Daily',
          'Weekly',
          'Monthly',
          'Quarterly',
          'Annually',
        ],
        placeholder: 'Select how often reports are generated',
        aiHint:
          'How frequently are model reports generated and distributed?',
      },
    ],
  },

  // =========================================================================
  // 7 — Governance
  // =========================================================================
  {
    id: 'governance',
    title: 'Section 7: Governance',
    fields: [
      // 7.1 Roles ------------------------------------------------------------
      {
        name: 'designatedResources',
        label: 'Designated Resources',
        type: 'textarea',
        placeholder: 'List designated resources responsible for the model',
        aiHint:
          'Who are the designated resources (individuals or teams) responsible for maintaining this model?',
      },
      {
        name: 'backgroundExperience',
        label: 'Background and Experience',
        type: 'textarea',
        placeholder: 'Background and experience of model team',
        aiHint:
          'What relevant background and experience do the model team members have?',
      },
      {
        name: 'staffingChanges',
        label: 'Staffing Changes',
        type: 'textarea',
        placeholder: 'Staffing changes in the last 3 years',
        aiHint:
          'Have there been any significant staffing changes related to this model in the last 3 years?',
      },

      // 7.2 Business Contingency ---------------------------------------------
      {
        name: 'fallbackProcess',
        label: 'Fallback Process',
        type: 'select',
        options: ['Fully Defined', 'Partially Defined', 'Not Defined'],
        placeholder: 'Select fallback process status',
        aiHint:
          'Is there a defined fallback or contingency process if the model becomes unavailable?',
      },
      {
        name: 'contingencyDetails',
        label: 'Contingency Details',
        type: 'textarea',
        placeholder: 'Describe the contingency plan',
        aiHint:
          'Describe the contingency plan in detail — what happens if the model fails or is unavailable?',
      },

      // 7.3 References -------------------------------------------------------
      {
        name: 'references',
        label: 'References',
        type: 'table',
        tableColumns: [
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'description', label: 'Description' },
        ],
        aiHint:
          'List all reference documents, papers, or materials related to this model.',
      },
    ],
  },
];
