import type {
  ChatMessage,
  FieldUpdate,
  IntakeFormState,
  ParsedDocument,
  CoverageAnalysis,
  GeneratedReport,
} from '@/types';

// ============================================================
// Simulated Delay
// ============================================================
function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function randomDelay(min: number, max: number): Promise<void> {
  return delay(min + Math.random() * (max - min));
}

// ============================================================
// 1. Mock Chat — Turn-based State Machine
// ============================================================

export async function mockSendChatMessage(
  message: string,
  conversationHistory: ChatMessage[],
): Promise<{ aiReply: string; fieldUpdates: FieldUpdate[] }> {
  await randomDelay(800, 1500);

  const turnCount = conversationHistory.filter((m) => m.role === 'user').length;
  const lowerMsg = message.toLowerCase();

  switch (turnCount) {
    case 0:
      return {
        aiReply:
          "Thank you for starting the intake process. Based on what you've shared, it sounds like we're dealing with a credit risk model. I've captured some initial details in the form on the right.\n\nCan you tell me more about the business purpose — what specific decisions does this model inform? And who is the designated model owner responsible for this model?",
        fieldUpdates: [
          ...(lowerMsg.includes('fico') || lowerMsg.includes('vendor')
            ? [{ section: 'model_summary', field: 'model_developer', value: 'FICO', action: 'set' as const }]
            : []),
          ...(lowerMsg.includes('credit') || lowerMsg.includes('scorecard')
            ? [{ section: 'model_summary', field: 'model_type', value: 'Credit Risk', action: 'set' as const }]
            : [{ section: 'model_summary', field: 'model_type', value: 'Credit Risk', action: 'set' as const }]),
          ...(lowerMsg.includes('logistic') || lowerMsg.includes('regression') || lowerMsg.includes('scorecard')
            ? [{ section: 'model_summary', field: 'estimation_technique', value: 'Logistic Regression', action: 'set' as const }]
            : [{ section: 'model_summary', field: 'estimation_technique', value: 'Scorecard', action: 'set' as const }]),
        ],
      };

    case 1:
      return {
        aiReply:
          "That's very helpful. So the model is used for credit decisioning in your retail lending portfolio. I've captured the business purpose and model usage.\n\nNow, regarding the risk rating — given that this model directly impacts credit decisions and has financial reporting implications, would you classify it as Tier 1 (Critical) or Tier 2 (High)? Also, which business units rely on this model's output?",
        fieldUpdates: [
          {
            section: 'executive_summary',
            field: 'business_purpose',
            value: 'The model is used for credit risk assessment and scoring of retail lending applicants. It supports origination decisioning by predicting the probability of default for prospective borrowers.',
            action: 'set',
          },
          {
            section: 'model_summary',
            field: 'model_usage',
            value: 'Credit origination decisioning for retail lending — consumer loans, credit cards, and home equity lines of credit',
            action: 'set',
          },
        ],
      };

    case 2:
      return {
        aiReply:
          "Good, I've noted the Tier 1 risk rating and the retail banking unit. Now let's discuss the data. For a vendor scorecard model like this, it's important to understand both the vendor's development data and how it applies to your institution.\n\nWhat internal data systems feed into this model? And does FICO use any external or consortium data in the model development that may differ from your bank's portfolio characteristics?",
        fieldUpdates: [
          {
            section: 'model_summary',
            field: 'risk_rating',
            value: 'Tier 1 (Critical)',
            action: 'set',
          },
          {
            section: 'model_summary',
            field: 'model_owner',
            value: 'Sarah Chen, VP Model Risk Management',
            action: 'set',
          },
          {
            section: 'executive_summary',
            field: 'reporting_impact',
            value: 'Direct Impact',
            action: 'set',
          },
          {
            section: 'executive_summary',
            field: 'business_units',
            value: ['Retail Banking', 'Risk Management'],
            action: 'set',
          },
        ],
      };

    case 3:
      return {
        aiReply:
          "Excellent detail on the data sources. Every model has assumptions and limitations — and for MRM purposes, this is one of the most scrutinized areas. For a FICO scorecard model, common assumptions include stable macroeconomic conditions, representative sample populations, and stationary borrower behavior patterns.\n\nWhat specific assumptions does your implementation of this model make? And what limitations have been identified — either by FICO or by your internal validation team?",
        fieldUpdates: [
          {
            section: 'development_data',
            field: 'internal_data_sources',
            value: 'Core banking system (FIS Horizon), loan origination system (Ellie Mae Encompass), credit bureau data (TransUnion, Equifax)',
            action: 'set',
          },
          {
            section: 'development_data',
            field: 'external_data',
            value: 'FICO proprietary development dataset — national consumer credit sample, supplemented with bureau consortium data',
            action: 'set',
          },
          {
            section: 'development_data',
            field: 'data_volume',
            value: 'Approximately 2.5 million consumer records spanning 2012–2023',
            action: 'set',
          },
        ],
      };

    case 4:
      return {
        aiReply:
          "Those are well-articulated assumptions. I've captured them in the form. Let me also note the key limitation around geographic concentration.\n\nNow let's move to model design. Can you describe the model structure at a high level? I understand it's a logistic regression-based scorecard, but I'd like to know more about the key variables, how they were selected, and whether any segmentation is applied across different product types or borrower segments.",
        fieldUpdates: [
          {
            section: 'executive_summary',
            field: 'assumptions',
            action: 'add_row',
            value: {
              id: 'a1',
              description: 'Macroeconomic conditions remain within historical range observed during development period (2012-2023)',
              evidence: '10-year historical average default rates used as baseline; stress testing performed under adverse scenarios',
            },
          },
          {
            section: 'executive_summary',
            field: 'assumptions',
            action: 'add_row',
            value: {
              id: 'a2',
              description: 'Borrower credit behavior patterns are stationary over time',
              evidence: 'Vintage analysis shows consistent rank-ordering across development and recent validation samples',
            },
          },
          {
            section: 'executive_summary',
            field: 'assumptions',
            action: 'add_row',
            value: {
              id: 'a3',
              description: 'FICO national development sample is representative of the bank\'s retail portfolio',
              evidence: 'Population stability index (PSI) analysis performed quarterly; most recent PSI = 0.08 (within acceptable range)',
            },
          },
          {
            section: 'executive_summary',
            field: 'limitations',
            action: 'add_row',
            value: {
              id: 'l1',
              limitation: 'Model does not capture rapid shifts in economic conditions (e.g., pandemic-driven defaults)',
              mitigatingRisk: 'Qualitative overlay process in place; model monitoring triggers recalibration when PSI exceeds 0.25',
            },
          },
        ],
      };

    default:
      return {
        aiReply:
          "That's helpful information — I've captured it in the form. Looking at the completion status, we've made good progress on the Model Summary, Executive Summary, and Development Data sections. There are still some gaps in Implementation (Section 5), Performance (Section 6), and Governance (Section 7).\n\nWould you like to continue discussing these areas, or are you ready to proceed to document upload? If you have vendor documentation that covers implementation and governance details, those can be extracted automatically in the next step.",
        fieldUpdates: [
          {
            section: 'executive_summary',
            field: 'usage_frequency',
            value: 'Real-time/Continuous',
            action: 'set',
          },
        ],
      };
  }
}

// ============================================================
// 2. Mock Document Processing
// ============================================================

export async function mockProcessDocuments(
  files: File[],
): Promise<{
  documents: ParsedDocument[];
  overallCoverage: CoverageAnalysis['overallCoverage'];
  gaps: string[];
}> {
  await delay(2500);

  const methodologyDoc: ParsedDocument = {
    id: 'doc_1',
    filename: files[0]?.name ?? 'Vendor_Methodology.pdf',
    extractedText: '[Extracted methodology content]',
    sectionsCovered: ['model_summary', '1.1', '1.2', '1.4', '2.1', '2.2', '2.3', '2.4'],
    coverageDetail: {
      model_summary: { covered: true, confidence: 'high', summary: 'Contains model type, estimation technique, and developer information' },
      '1.1': { covered: true, confidence: 'high', summary: 'Detailed business purpose and intended use cases for credit scoring' },
      '1.2': { covered: true, confidence: 'high', summary: 'Comprehensive model description including methodology and key drivers' },
      '1.4': { covered: true, confidence: 'medium', summary: 'Several model assumptions documented in methodology section' },
      '2.1': { covered: true, confidence: 'high', summary: 'Thorough description of logistic regression approach and theoretical foundation' },
      '2.2': { covered: true, confidence: 'high', summary: 'Detailed estimation methodology including MLE and variable selection' },
      '2.3': { covered: true, confidence: 'high', summary: 'Final model structure with scorecard points and variable weights' },
      '2.4': { covered: true, confidence: 'medium', summary: 'Segmentation by product type mentioned but not fully detailed' },
    },
    documentSummary: 'Comprehensive vendor methodology document covering the FICO credit scorecard design, estimation approach, and model structure.',
  };

  const validationDoc: ParsedDocument = {
    id: 'doc_2',
    filename: files[1]?.name ?? 'Validation_Report.docx',
    extractedText: '[Extracted validation content]',
    sectionsCovered: ['4.1', '4.2', '4.3'],
    coverageDetail: {
      '4.1': { covered: true, confidence: 'high', summary: 'Back-testing results with KS, Gini, and AUC metrics across validation samples' },
      '4.2': { covered: true, confidence: 'high', summary: 'Sensitivity analysis on key input variables with stress scenarios' },
      '4.3': { covered: true, confidence: 'medium', summary: 'Benchmarking against previous model version and industry averages' },
    },
    documentSummary: 'Third-party validation report with back-testing results, sensitivity analysis, and benchmarking.',
  };

  const documents: ParsedDocument[] = files.length >= 2
    ? [methodologyDoc, validationDoc]
    : [methodologyDoc];

  const allCoveredSections = new Set(documents.flatMap((d) => d.sectionsCovered));

  const allSections = [
    'model_summary', '1.1', '1.2', '1.3', '1.4', '1.5',
    '2.1', '2.2', '2.3', '2.4', '2.5', '2.6',
    '3.1', '3.2', '3.3',
    '4.1', '4.2', '4.3', '4.4',
    '5.1', '5.2', '5.3', '5.4',
    '6.1', '6.2',
    '7.1', '7.2', '7.3',
  ];

  const overallCoverage: CoverageAnalysis['overallCoverage'] = {};
  const gaps: string[] = [];

  for (const section of allSections) {
    if (allCoveredSections.has(section)) {
      const sources = documents
        .filter((d) => d.sectionsCovered.includes(section))
        .map((d) => d.filename);
      overallCoverage[section] = { status: 'covered', sources, confidence: 'high' };
    } else {
      overallCoverage[section] = { status: 'gap', sources: [] };
      gaps.push(section);
    }
  }

  return { documents, overallCoverage, gaps };
}

// ============================================================
// 3. Mock Report Generation
// ============================================================

export async function mockGenerateReport(
  intakeData: IntakeFormState,
  _parsedDocuments: ParsedDocument[],
  bankName: string,
): Promise<GeneratedReport> {
  await delay(3000);

  const ms = intakeData.modelSummary;
  const es = intakeData.executiveSummary;
  const modelName = `${ms.modelDeveloper || 'FICO'} ${ms.modelType || 'Credit Risk'} Scorecard`;
  const effectiveBankName = bankName || 'Acme Bank';

  return {
    bankName: effectiveBankName,
    modelName,
    generatedAt: Date.now(),
    generationNotes: [
      'Sections 5.1-5.4: Limited source material — marked as incomplete',
      'Section 1.4: 3 assumptions captured from intake interview',
      'Section 4.1-4.3: Content sourced primarily from validation report',
      'Sections 6.1-6.2: Based on intake form responses only; no vendor documentation available',
      'Section 7.1-7.3: Governance sections partially complete — recommend follow-up with model owner',
    ],
    sections: [
      {
        id: 'model_summary',
        title: 'Model Summary',
        content: `| Field | Value |\n|-------|-------|\n| Model Type | ${ms.modelType || '[Information not provided]'} |\n| Estimation Technique | ${ms.estimationTechnique || '[Information not provided]'} |\n| Model Developer(s) | ${ms.modelDeveloper || '[Information not provided]'} |\n| Model Owner | ${ms.modelOwner || '[Information not provided]'} |\n| Model Usage | ${ms.modelUsage || '[Information not provided]'} |\n| Upstream Models | ${ms.upstreamModels || 'None identified'} |\n| Downstream Models | ${ms.downstreamModels || 'None identified'} |\n| Risk Rating | ${ms.riskRating || '[Information not provided]'} |\n| Policy Coverage | ${ms.policyCoverage || '[Information not provided]'} |\n| Model Validator | ${ms.modelValidator || '[Information not provided]'} |\n| Date of Validation | ${ms.dateOfValidation || '[Information not provided]'} |\n| Validation Rating | ${ms.validationRating || '[Information not provided]'} |\n| Date of Implementation | ${ms.dateOfImplementation || '[Information not provided]'} |`,
      },
      {
        id: '1.1',
        title: '1.1 Business Purpose and Use',
        content: es.businessPurpose
          ? `${es.businessPurpose}\n\nThe model output directly ${es.reportingImpact === 'Direct Impact' ? 'impacts' : 'informs'} financial and regulatory reporting, consistent with SR 11-7 and OCC 2011-12 guidance on model risk management. The model is utilized by ${es.businessUnits.length > 0 ? es.businessUnits.join(', ') : 'the Retail Banking division'} on a ${es.usageFrequency || 'continuous'} basis for credit origination decisioning.`
          : '[Information not provided — to be completed by model owner]',
      },
      {
        id: '1.2',
        title: '1.2 Model Description',
        content: es.methodologySummary
          ? `The ${modelName} is designed to assess the creditworthiness of retail lending applicants. ${es.methodologySummary}\n\nKey model drivers include: ${es.keyModelDrivers || '[Information not provided]'}.\n\nThe model covers the following products and portfolios: ${es.productsCovered || '[Information not provided]'}. Data inputs are sourced from ${es.dataSourcesSummary || '[Information not provided]'}, covering the period ${es.dataPeriod || '[Information not provided]'}.\n\nThe model output consists of: ${es.outputDescription || 'a credit risk score indicating the probability of default for each applicant'}.`
          : 'The model is a vendor-developed credit risk scorecard utilizing logistic regression methodology. It produces a numerical score representing the estimated probability of default for each applicant, which is used in the bank\'s credit origination workflow.\n\n[Additional detail to be completed by model owner]',
      },
      {
        id: '1.3',
        title: '1.3 Alternatives Considered',
        content: es.alternativesConsidered
          ? es.alternativesConsidered
          : 'Alternative approaches considered during the model selection process included internally developed logistic regression models, machine learning-based approaches (gradient boosting, random forest), and competing vendor solutions. The FICO scorecard was selected based on its established regulatory acceptance, proven track record in the industry, and the availability of comprehensive validation documentation.\n\n[Information not provided — to be completed by model owner]',
      },
      {
        id: '1.4',
        title: '1.4 Model Assumptions',
        content: es.assumptions.length > 0
          ? `The following key assumptions underlie the model:\n\n| Assumption | Supporting Evidence |\n|-----------|--------------------|\n${es.assumptions.map((a) => `| ${a.description} | ${a.evidence} |`).join('\n')}`
          : '| Assumption | Supporting Evidence |\n|-----------|--------------------|\n| [Information not provided] | [Information not provided] |',
      },
      {
        id: '1.5',
        title: '1.5 Model Limitations',
        content: es.limitations.length > 0
          ? `The following known limitations have been identified:\n\n| Limitation | Mitigating Risk |\n|-----------|----------------|\n${es.limitations.map((l) => `| ${l.limitation} | ${l.mitigatingRisk} |`).join('\n')}`
          : '| Limitation | Mitigating Risk |\n|-----------|----------------|\n| [Information not provided] | [Information not provided] |',
      },
      {
        id: '2.1',
        title: '2.1 Model Theory and Approach',
        content: intakeData.modelDesign.theoryAndApproach
          ? intakeData.modelDesign.theoryAndApproach
          : 'The model employs a logistic regression framework, which is well-established in the credit risk literature and supported by extensive academic research. The logistic function maps a linear combination of predictor variables to a probability between 0 and 1, representing the estimated probability of default.\n\nThe approach is consistent with industry best practices as described in Siddiqi (2006) "Credit Risk Scorecards" and regulatory expectations outlined in SR 11-7. The vendor\'s methodology documentation describes the theoretical foundation in detail, including the maximum likelihood estimation procedure and the scorecard points derivation methodology.',
      },
      {
        id: '2.2',
        title: '2.2 Model Estimation',
        content: intakeData.modelDesign.estimationMethodology
          ? intakeData.modelDesign.estimationMethodology
          : 'The model parameters are estimated using maximum likelihood estimation (MLE) on the vendor\'s proprietary development dataset. The estimation process involves iterative optimization to find parameter values that maximize the log-likelihood function.\n\nThe methodology was selected based on its strong theoretical properties (consistency, asymptotic normality), interpretability of coefficients, and widespread regulatory acceptance in credit risk modeling applications.',
      },
      {
        id: '2.3',
        title: '2.3 Model Structure',
        content: intakeData.modelDesign.modelStructure
          ? intakeData.modelDesign.modelStructure
          : 'The final model structure is a point-based scorecard derived from the logistic regression coefficients. Each predictor variable is binned into discrete ranges, and scorecard points are assigned to each bin based on the Weight of Evidence (WOE) transformation and the regression coefficient.\n\nThe final score is computed as the sum of individual variable points plus a base score offset. The score is then mapped to a probability of default through the logistic function.\n\n[Detailed model equation and variable weights to be provided by model owner]',
      },
      {
        id: '2.4',
        title: '2.4 Segmentation',
        content: intakeData.modelDesign.segmentation
          ? intakeData.modelDesign.segmentation
          : '[Information not provided — to be completed by model owner]',
      },
      {
        id: '2.5',
        title: '2.5 Iterative Steps',
        content: intakeData.modelDesign.iterativeSteps
          ? intakeData.modelDesign.iterativeSteps
          : 'Not applicable — the model uses a statistical estimation approach (logistic regression) rather than an iterative calculation methodology.',
      },
      {
        id: '2.6',
        title: '2.6 Judgmental/Qualitative Adjustments and Overrides',
        content: intakeData.modelDesign.adjustmentsDescription
          ? `${intakeData.modelDesign.adjustmentsDescription}\n\nOverride frequency: ${intakeData.modelDesign.overrideFrequency || '[Information not provided]'}.\n\n${intakeData.modelDesign.overrideDocumentation || ''}`
          : '[Information not provided — to be completed by model owner]\n\nPer SR 11-7 guidance, all adjustments and overrides should be clearly identified, supported with analysis, and continuously assessed as part of the ongoing monitoring plan.',
      },
      {
        id: '3.1',
        title: '3.1 Data Sources',
        content: intakeData.developmentData.internalDataSources
          ? `**Internal Data Sources:** ${intakeData.developmentData.internalDataSources}\n\n**External/Third-Party Data:** ${intakeData.developmentData.externalData || '[Information not provided]'}\n\n**Data Volume:** ${intakeData.developmentData.dataVolume || '[Information not provided]'}\n\n**Data Applicability:** ${intakeData.developmentData.dataApplicability || 'For vendor models, the applicability of the vendor\'s development data to the bank\'s specific portfolio, products, and geography should be assessed and documented.'}\n\n**Personal Information:** ${intakeData.developmentData.personalInfoUsed || '[Information not provided]'}\n\n**Data Dictionary:** ${intakeData.developmentData.dataDictionaryAvailable || '[Information not provided]'}`
          : '[Information not provided — to be completed by model owner]',
      },
      {
        id: '3.2',
        title: '3.2 Data Quality',
        content: intakeData.developmentData.qualityAssessment || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '3.3',
        title: '3.3 Data Preparation',
        content: intakeData.developmentData.extractionProcess || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '4.1',
        title: '4.1 Back-testing',
        content: intakeData.outputUse.backTestingDescription
          ? `**Approach:** ${intakeData.outputUse.backTestingApproach || 'Both in-sample and out-of-sample'}\n\n${intakeData.outputUse.backTestingDescription}\n\n**Results:** ${intakeData.outputUse.backTestingResults || '[Information not provided]'}`
          : 'Back-testing was performed using both in-sample and out-of-sample validation techniques. The vendor\'s validation report demonstrates model performance across multiple hold-out samples and time periods.\n\nKey metrics include:\n- KS Statistic: 0.42 (development), 0.39 (validation)\n- Gini Coefficient: 0.58 (development), 0.55 (validation)\n- AUC-ROC: 0.79 (development), 0.77 (validation)\n\nAll metrics fall within acceptable ranges, indicating stable discriminatory power across samples.',
      },
      {
        id: '4.2',
        title: '4.2 Sensitivity Analysis',
        content: intakeData.outputUse.sensitivityDescription || 'Sensitivity analysis was performed by varying key input variables within observed ranges and stress scenarios. Results indicate that the model output is most sensitive to credit utilization ratio, payment history, and length of credit history. No unexpected interactions between variables were identified.\n\n[Additional bank-specific sensitivity analysis to be completed by model owner]',
      },
      {
        id: '4.3',
        title: '4.3 Benchmarking',
        content: intakeData.outputUse.benchmarkModel || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '4.4',
        title: '4.4 Ongoing Monitoring Plan',
        content: intakeData.outputUse.monitoringApproach || '[Information not provided — to be completed by model owner]\n\nPer regulatory guidance, ongoing monitoring should be based on the bank\'s own implementation experience, not solely on the vendor\'s testing. The monitoring plan should include population stability analysis, performance metric tracking, and defined thresholds that trigger recalibration.',
      },
      {
        id: '5.1',
        title: '5.1 Implementation Overview',
        content: intakeData.implementation.implementationOverview || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '5.2',
        title: '5.2 Implementation Testing',
        content: intakeData.implementation.implementationTesting || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '5.3',
        title: '5.3 Controls',
        content: intakeData.implementation.accessControls || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '5.4',
        title: '5.4 Operating Procedures',
        content: intakeData.implementation.operatingProcedures || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '6.1',
        title: '6.1 Adjustments and Overlays',
        content: intakeData.performance.adjustmentsPurpose || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '6.2',
        title: '6.2 Model Reporting',
        content: intakeData.performance.reportingStructure || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '7.1',
        title: '7.1 Roles and Responsibilities',
        content: intakeData.governance.designatedResources || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '7.2',
        title: '7.2 Business Contingency/Continuity',
        content: intakeData.governance.contingencyDetails || '[Information not provided — to be completed by model owner]',
      },
      {
        id: '7.3',
        title: '7.3 References',
        content: intakeData.governance.references.length > 0
          ? `| Name | Type | Description |\n|------|------|-------------|\n${intakeData.governance.references.map((r) => `| ${r.name} | ${r.type} | ${r.description} |`).join('\n')}`
          : '| Name | Type | Description |\n|------|------|-------------|\n| SR 11-7 | Regulatory Guidance | OCC/FRB Supervisory Guidance on Model Risk Management |\n| OCC 2011-12 | Regulatory Guidance | Sound Practices for Model Risk Management |\n| FICO Score Technical Documentation | Vendor Documentation | [To be provided by model owner] |',
      },
    ],
  };
}
