# Intake Question Bank

This file is generated from `src/lib/intake-schema.ts`.
Each question is the exact `aiHint` used by the intake flow (or the field label when no `aiHint` is present).

## Model Summary (`modelSummary`)

| # | Field Path | Question |
|---:|---|---|
| 1 | `modelSummary.modelType` | What category of risk or business function does this model address? |
| 2 | `modelSummary.estimationTechnique` | What statistical or computational method does the model use to produce its estimates? |
| 3 | `modelSummary.modelDeveloper` | Who originally built this model — a third-party vendor or an internal team? |
| 4 | `modelSummary.modelOwner` | Who is the designated business owner accountable for the model? |
| 5 | `modelSummary.modelUsage` | What business decisions does this model directly inform? |
| 6 | `modelSummary.upstreamModels` | Does this model take input from any other models? |
| 7 | `modelSummary.downstreamModels` | Do any other models or processes depend on this model's output? |
| 8 | `modelSummary.riskRating` | How has this model been classified in terms of materiality and risk to the institution? |
| 9 | `modelSummary.policyCoverage` | Which internal policies, regulatory guidelines, or frameworks govern the use of this model? |
| 10 | `modelSummary.modelValidator` | Who is responsible for the independent validation of this model? |
| 11 | `modelSummary.dateOfValidation` | When was the most recent independent validation completed? |
| 12 | `modelSummary.validationRating` | What was the overall rating or conclusion from the last validation? |
| 13 | `modelSummary.dateOfImplementation` | When was this model first put into production use? |

## Section 1: Executive Summary (`executiveSummary`)

| # | Field Path | Question |
|---:|---|---|
| 14 | `executiveSummary.businessPurpose` | What business problem does this model solve? Why was it created? |
| 15 | `executiveSummary.regulatoryStandards` | Does this model relate to specific regulatory or accounting standards (e.g., CECL, Basel, CCAR)? |
| 16 | `executiveSummary.reportingImpact` | Does this model directly or indirectly affect financial or regulatory reporting? |
| 17 | `executiveSummary.businessUnits` | Which business units or departments rely on the output of this model? |
| 18 | `executiveSummary.usageFrequency` | How frequently is this model executed or its results consumed? |
| 19 | `executiveSummary.productsCovered` | What specific products or portfolios does this model cover? |
| 20 | `executiveSummary.methodologySummary` | Can you provide a plain-language summary of how the model works at a high level? |
| 21 | `executiveSummary.keyModelDrivers` | What are the most important variables or factors that drive the model output? |
| 22 | `executiveSummary.dataSourcesSummary` | What are the primary data sources feeding into this model? |
| 23 | `executiveSummary.dataPeriod` | What time period does the development or calibration data cover? |
| 24 | `executiveSummary.outputDescription` | What does the model produce? Describe the output format and how it is interpreted.? |
| 25 | `executiveSummary.modelInterdependencies` | How does this model interact with other models or systems in the model ecosystem? |
| 26 | `executiveSummary.alternativesConsidered` | What other approaches were evaluated before selecting this methodology? Why were they rejected? |
| 27 | `executiveSummary.assumptions` | What key assumptions underlie this model, and what evidence supports each assumption? |
| 28 | `executiveSummary.limitations` | What are the known limitations of this model and how is the associated risk mitigated? |

## Section 2: Model Design (`modelDesign`)

| # | Field Path | Question |
|---:|---|---|
| 29 | `modelDesign.theoryAndApproach` | What is the theoretical or academic foundation behind the chosen modeling approach? |
| 30 | `modelDesign.candidateVariables` | What candidate variables were considered and what is the business rationale for each? |
| 31 | `modelDesign.variableSelectionProcess` | What process was used to narrow down candidate variables to the final set? |
| 32 | `modelDesign.estimationMethodology` | Describe the estimation method in detail — how are parameters fitted or calibrated? |
| 33 | `modelDesign.methodologyJustification` | Why was this particular methodology chosen over other viable approaches? |
| 34 | `modelDesign.modelStructure` | What is the final model structure? Include equations, decision rules, or algorithm descriptions.? |
| 35 | `modelDesign.variableSources` | Where does the data for each variable come from? Are there any derived or computed inputs? |
| 36 | `modelDesign.segmentation` | Is the model segmented by product, geography, risk grade, or other criteria? Describe the segmentation.? |
| 37 | `modelDesign.iterativeSteps` | For non-statistical or rules-based models, describe the step-by-step process flow.? |
| 38 | `modelDesign.adjustmentsDescription` | Is model output ever manually adjusted? By whom and under what circumstances? |
| 39 | `modelDesign.overrideFrequency` | How frequently are model outputs overridden by human judgment? |
| 40 | `modelDesign.overrideDocumentation` | How are manual overrides tracked, documented, and reviewed? |

## Section 3: Development Data (`developmentData`)

| # | Field Path | Question |
|---:|---|---|
| 41 | `developmentData.internalDataSources` | What internal data systems or databases provide data for this model? |
| 42 | `developmentData.externalData` | Is external or vendor-provided data used? Which vendors and what data? |
| 43 | `developmentData.dataVolume` | Approximately how many records and what time periods are covered by the development data? |
| 44 | `developmentData.dataApplicability` | For vendor models, how applicable is the vendor's development data to your institution's specific portfolio? |
| 45 | `developmentData.personalInfoUsed` | Does the model use personally identifiable information (PII), de-identified data, or neither? |
| 46 | `developmentData.dataDictionaryAvailable` | Is there a data dictionary that defines all fields used in the model? |
| 47 | `developmentData.proxyConsortiumData` | Is any proxy or consortium data used in lieu of direct observations? Describe.? |
| 48 | `developmentData.qualityAssessment` | What data quality checks and assessments were performed on the development data? |
| 49 | `developmentData.dataCertification` | Has the data been formally certified or attested? By whom and when? |
| 50 | `developmentData.treatmentsTransformations` | What treatments or transformations were applied to the raw data before modeling? |
| 51 | `developmentData.extractionProcess` | How is data extracted from source systems? Is it automated or manual? |
| 52 | `developmentData.cleansingProcess` | What cleansing steps are applied to handle missing values, outliers, or errors? |
| 53 | `developmentData.etlDocumentation` | Is the extract-transform-load (ETL) process fully documented? |

## Section 4: Output & Use (`outputUse`)

| # | Field Path | Question |
|---:|---|---|
| 54 | `outputUse.backTestingApproach` | Was back-testing performed in-sample, out-of-sample, or both? |
| 55 | `outputUse.backTestingDescription` | How does back-testing work for this model? What confidence intervals or thresholds are used? |
| 56 | `outputUse.backTestingResults` | What were the high-level results of back-testing? Did the model pass or fail? |
| 57 | `outputUse.sensitivityPerformed` | Was a sensitivity analysis conducted? If so, how comprehensive was it? |
| 58 | `outputUse.sensitivityDescription` | How are input changes tested to understand their impact on model output? |
| 59 | `outputUse.benchmarkModel` | What alternative or challenger models is this model compared against? |
| 60 | `outputUse.benchmarkResults` | What were the key findings when comparing this model to benchmarks? |
| 61 | `outputUse.parallelRun` | Was this model run in parallel with the existing model or process before going live? |
| 62 | `outputUse.monitoringApproach` | What is the plan for ongoing performance monitoring of this model? |
| 63 | `outputUse.monitoringFrequency` | How often is the model monitored for performance degradation? |
| 64 | `outputUse.comparisonToDeveloper` | For vendor models, how does the bank's monitoring compare to the vendor's own monitoring? |
| 65 | `outputUse.tuningProcess` | What triggers recalibration or retuning of this model? What is the process? |

## Section 5: Implementation (`implementation`)

| # | Field Path | Question |
|---:|---|---|
| 66 | `implementation.implementationOverview` | What platform, technology, or environment is this model deployed on? |
| 67 | `implementation.systemFlowDiagram` | Can you describe the data flow from source systems through the model to downstream consumers? |
| 68 | `implementation.standardSettings` | What are the standard configuration settings and under what conditions are they changed? |
| 69 | `implementation.implementationTesting` | What testing was performed to ensure the model was correctly implemented in production? |
| 70 | `implementation.thirdPartyCertification` | Is there a third-party or vendor certification for the implementation? |
| 71 | `implementation.accessControls` | What access controls are in place to restrict who can run, modify, or view the model? |
| 72 | `implementation.securityControls` | What security measures protect the model, its data, and its output? |
| 73 | `implementation.socReport` | Is a SOC report available for the vendor or platform? Were any issues noted? |
| 74 | `implementation.changeManagement` | What is the change management process for model updates or configuration changes? |
| 75 | `implementation.materialChangeDefinition` | How does the organization define a "material change" to this model? |
| 76 | `implementation.versionReleaseProcess` | What is the process for releasing new versions of the model? |
| 77 | `implementation.operatingProcedures` | Are there step-by-step operating procedures for running the model? |
| 78 | `implementation.uatTesting` | Was user acceptance testing (UAT) performed? Describe the approach and results.? |
| 79 | `implementation.stepByStepGuide` | Is there a step-by-step guide available for end users of this model? |

## Section 6: Performance (`performance`)

| # | Field Path | Question |
|---:|---|---|
| 80 | `performance.adjustmentsPurpose` | What is the purpose of any post-model adjustments or overlays applied? |
| 81 | `performance.adjustmentsDetails` | Describe the specific adjustments or overlays in detail.? |
| 82 | `performance.adjustmentsRationale` | What is the rationale or justification for these adjustments? |
| 83 | `performance.reportingStructure` | What is the reporting structure for communicating model results to stakeholders? |
| 84 | `performance.reportingMetrics` | What specific metrics or KPIs are reported based on the model output? |
| 85 | `performance.reportingFrequency` | How frequently are model reports generated and distributed? |

## Section 7: Governance (`governance`)

| # | Field Path | Question |
|---:|---|---|
| 86 | `governance.designatedResources` | Who are the designated resources (individuals or teams) responsible for maintaining this model? |
| 87 | `governance.backgroundExperience` | What relevant background and experience do the model team members have? |
| 88 | `governance.staffingChanges` | Have there been any significant staffing changes related to this model in the last 3 years? |
| 89 | `governance.fallbackProcess` | Is there a defined fallback or contingency process if the model becomes unavailable? |
| 90 | `governance.contingencyDetails` | Describe the contingency plan in detail — what happens if the model fails or is unavailable? |
| 91 | `governance.references` | List all reference documents, papers, or materials related to this model.? |

Total questions: **91**
