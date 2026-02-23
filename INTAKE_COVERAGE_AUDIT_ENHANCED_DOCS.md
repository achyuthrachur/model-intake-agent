# Intake Coverage Audit (Enhanced Demo Documents)

Generated from live `/api/process-docs` output with the enhanced demo DOCX set.

- Total intake fields: **91**
- Prefilled fields: **50**
- Missing fields: **41**
- Processed documents: **4**
- Prefill updates returned: **50**

## Missing By Section

| Section | Missing / Total |
|---|---:|
| Model Summary (`modelSummary`) | 11 / 13 |
| Section 1: Executive Summary (`executiveSummary`) | 2 / 15 |
| Section 2: Model Design (`modelDesign`) | 5 / 12 |
| Section 3: Development Data (`developmentData`) | 5 / 13 |
| Section 4: Output & Use (`outputUse`) | 10 / 12 |
| Section 5: Implementation (`implementation`) | 5 / 14 |
| Section 6: Performance (`performance`) | 1 / 6 |
| Section 7: Governance (`governance`) | 2 / 6 |

## Missing "Simple" Questions (Model Summary + Executive Summary non-table)

- `modelSummary.modelDeveloper`: Who originally built this model — a third-party vendor or an internal team?
- `modelSummary.modelOwner`: Who is the designated business owner accountable for the model?
- `modelSummary.modelUsage`: What business decisions does this model directly inform?
- `modelSummary.upstreamModels`: Does this model take input from any other models?
- `modelSummary.downstreamModels`: Do any other models or processes depend on this model's output?
- `modelSummary.riskRating`: How has this model been classified in terms of materiality and risk to the institution?
- `modelSummary.policyCoverage`: Which internal policies, regulatory guidelines, or frameworks govern the use of this model?
- `modelSummary.modelValidator`: Who is responsible for the independent validation of this model?
- `modelSummary.dateOfValidation`: When was the most recent independent validation completed?
- `modelSummary.validationRating`: What was the overall rating or conclusion from the last validation?
- `modelSummary.dateOfImplementation`: When was this model first put into production use?

## Full Missing Question List

- `modelSummary.modelDeveloper` (text): Who originally built this model — a third-party vendor or an internal team?
- `modelSummary.modelOwner` (text): Who is the designated business owner accountable for the model?
- `modelSummary.modelUsage` (textarea): What business decisions does this model directly inform?
- `modelSummary.upstreamModels` (text): Does this model take input from any other models?
- `modelSummary.downstreamModels` (text): Do any other models or processes depend on this model's output?
- `modelSummary.riskRating` (select): How has this model been classified in terms of materiality and risk to the institution?
- `modelSummary.policyCoverage` (textarea): Which internal policies, regulatory guidelines, or frameworks govern the use of this model?
- `modelSummary.modelValidator` (text): Who is responsible for the independent validation of this model?
- `modelSummary.dateOfValidation` (date): When was the most recent independent validation completed?
- `modelSummary.validationRating` (select): What was the overall rating or conclusion from the last validation?
- `modelSummary.dateOfImplementation` (date): When was this model first put into production use?
- `executiveSummary.assumptions` (table): What key assumptions underlie this model, and what evidence supports each assumption?
- `executiveSummary.limitations` (table): What are the known limitations of this model and how is the associated risk mitigated?
- `modelDesign.candidateVariables` (textarea): What candidate variables were considered and what is the business rationale for each?
- `modelDesign.variableSelectionProcess` (textarea): What process was used to narrow down candidate variables to the final set?
- `modelDesign.estimationMethodology` (textarea): Describe the estimation method in detail — how are parameters fitted or calibrated?
- `modelDesign.variableSources` (textarea): Where does the data for each variable come from? Are there any derived or computed inputs?
- `modelDesign.iterativeSteps` (textarea): For non-statistical or rules-based models, describe the step-by-step process flow.?
- `developmentData.dataDictionaryAvailable` (select): Is there a data dictionary that defines all fields used in the model?
- `developmentData.qualityAssessment` (textarea): What data quality checks and assessments were performed on the development data?
- `developmentData.dataCertification` (textarea): Has the data been formally certified or attested? By whom and when?
- `developmentData.treatmentsTransformations` (textarea): What treatments or transformations were applied to the raw data before modeling?
- `developmentData.cleansingProcess` (textarea): What cleansing steps are applied to handle missing values, outliers, or errors?
- `outputUse.backTestingApproach` (select): Was back-testing performed in-sample, out-of-sample, or both?
- `outputUse.backTestingDescription` (textarea): How does back-testing work for this model? What confidence intervals or thresholds are used?
- `outputUse.backTestingResults` (textarea): What were the high-level results of back-testing? Did the model pass or fail?
- `outputUse.sensitivityPerformed` (select): Was a sensitivity analysis conducted? If so, how comprehensive was it?
- `outputUse.sensitivityDescription` (textarea): How are input changes tested to understand their impact on model output?
- `outputUse.benchmarkModel` (textarea): What alternative or challenger models is this model compared against?
- `outputUse.benchmarkResults` (textarea): What were the key findings when comparing this model to benchmarks?
- `outputUse.parallelRun` (select): Was this model run in parallel with the existing model or process before going live?
- `outputUse.comparisonToDeveloper` (textarea): For vendor models, how does the bank's monitoring compare to the vendor's own monitoring?
- `outputUse.tuningProcess` (textarea): What triggers recalibration or retuning of this model? What is the process?
- `implementation.standardSettings` (textarea): What are the standard configuration settings and under what conditions are they changed?
- `implementation.implementationTesting` (textarea): What testing was performed to ensure the model was correctly implemented in production?
- `implementation.socReport` (select): Is a SOC report available for the vendor or platform? Were any issues noted?
- `implementation.materialChangeDefinition` (textarea): How does the organization define a "material change" to this model?
- `implementation.stepByStepGuide` (select): Is there a step-by-step guide available for end users of this model?
- `performance.adjustmentsDetails` (textarea): Describe the specific adjustments or overlays in detail.?
- `governance.staffingChanges` (textarea): Have there been any significant staffing changes related to this model in the last 3 years?
- `governance.references` (table): List all reference documents, papers, or materials related to this model.?