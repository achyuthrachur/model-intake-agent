import { INTAKE_SCHEMA } from '@/lib/intake-schema';
import type { FieldUpdate, IntakeFormState } from '@/types';

type DemoAutofillValue = string | string[];

interface DemoScalarAutofillEntry {
  kind: 'scalar';
  value: DemoAutofillValue;
  response: string;
}

interface DemoTableAutofillEntry {
  kind: 'table';
  rows: Array<Record<string, string>>;
  response: string;
}

type DemoAutofillEntry = DemoScalarAutofillEntry | DemoTableAutofillEntry;

const ORDERED_FIELD_PATHS: string[] = INTAKE_SCHEMA.flatMap((section) =>
  section.fields.map((field) => `${section.id}.${field.name}`),
);

const CECL_DEMO_AUTOFILL_BY_PATH: Partial<Record<string, DemoAutofillEntry>> = {
  'modelSummary.modelOwner': {
    kind: 'scalar',
    value: 'Finance Controllership (Allowance Methodology Lead), with Credit Risk and MRM oversight.',
    response:
      'Model owner: Finance Controllership (Allowance Methodology Lead), with Credit Risk and MRM oversight.',
  },
  'modelSummary.upstreamModels': {
    kind: 'scalar',
    value:
      'No direct upstream predictive model. Primary upstream inputs are source-system extracts plus approved macro scenario packages.',
    response:
      'Upstream dependencies: no direct upstream predictive model; inputs come from source-system data extracts and approved macro scenario packages.',
  },
  'modelSummary.downstreamModels': {
    kind: 'scalar',
    value:
      'Downstream consumers include ACL/ALLL allowance reporting, GL reconciliation, close governance packs, and model risk monitoring artifacts.',
    response:
      "Downstream consumers include allowance reporting, GL reconciliation, close-cycle governance packs, and model risk monitoring outputs.",
  },
  'modelSummary.riskRating': {
    kind: 'scalar',
    value: 'Tier 1 (Critical)',
    response:
      'Risk rating is Tier 1 (Critical) because the CECL estimate directly affects financial reporting and reserve governance.',
  },
  'modelSummary.modelValidator': {
    kind: 'scalar',
    value: 'Client Model Risk Management (MRM) independent validation team.',
    response: 'Independent validator: Client Model Risk Management (MRM) team.',
  },
  'modelSummary.dateOfValidation': {
    kind: 'scalar',
    value: '2026-02-17',
    response: 'Most recent validation date recorded for intake is 2026-02-17.',
  },
  'modelSummary.validationRating': {
    kind: 'scalar',
    value: 'Not Yet Validated',
    response: 'Validation rating: Not Yet Validated.',
  },
  'modelSummary.dateOfImplementation': {
    kind: 'scalar',
    value: '2026-02-17',
    response: 'Initial production implementation date recorded for intake is 2026-02-17.',
  },
  'modelDesign.candidateVariables': {
    kind: 'scalar',
    value:
      'Candidate drivers include delinquency/DPD, balance trajectory, risk grade, non-accrual flags, charge-off and recovery behavior, collateral indicators, utilization/payment trends, and macroeconomic scenario variables.',
    response:
      'Candidate variables include DPD, balances, risk grade, non-accrual status, charge-off/recovery behavior, collateral indicators, utilization/payment trends, and macroeconomic factors.',
  },
  'modelDesign.variableSelectionProcess': {
    kind: 'scalar',
    value:
      'Variables are screened for business relevance, data quality, stability, and redundancy, then finalized using out-of-time performance, segmentation fit, and governance review documented in methodology and monitoring packs.',
    response:
      'Variable selection uses business relevance, data quality/stability screening, redundancy checks, and out-of-time performance/governance review.',
  },
  'modelDesign.estimationMethodology': {
    kind: 'scalar',
    value:
      'The model applies a hybrid CECL cash-flow architecture that estimates PD/LGD/EAD components, projects lifetime losses under scenario paths, discounts expected cash shortfalls, and aggregates to segment and portfolio allowance.',
    response:
      'Estimation methodology is a hybrid PD/LGD/EAD CECL cash-flow framework with lifetime projection, discounting, and portfolio aggregation.',
  },
  'modelDesign.variableSources': {
    kind: 'scalar',
    value:
      'Variables are sourced from ACCOUNT_SNAPSHOT, TRANSACTION, CHARGEOFF, RECOVERY, COLLATERAL, SCORE, and configuration/lookup tables, plus approved external macroeconomic scenario series mapped in the ETL specification.',
    response:
      'Variable sources are internal snapshot/transaction/charge-off/recovery/collateral/score tables plus approved external macro scenario series.',
  },
  'modelDesign.iterativeSteps': {
    kind: 'scalar',
    value:
      'Process flow: ingest files/API feeds; run QC and reconciliations; standardize mappings/derived fields; assign segments; run PD/LGD/EAD calculations; apply approved scenarios/weights and overlays; produce ECL outputs; complete sign-off and evidence archiving.',
    response:
      'Iterative flow is ingest -> QC/reconciliation -> transforms/segmentation -> PD/LGD/EAD run -> scenarios/overlays -> output and sign-off evidence.',
  },
  'developmentData.dataApplicability': {
    kind: 'scalar',
    value:
      'Vendor development reflects consortium history and is calibrated to client portfolio behavior through mapping, applicability review, and local recalibration when sufficient client loss history is available.',
    response:
      'Vendor development data is treated as broadly applicable with client-specific mapping and local recalibration where client history is sufficient.',
  },
  'developmentData.personalInfoUsed': {
    kind: 'scalar',
    value: 'Yes — Direct PII',
    response:
      'Personal information usage: Yes — Direct PII may be included in source extracts under transmission, access, and retention controls.',
  },
  'developmentData.dataDictionaryAvailable': {
    kind: 'scalar',
    value: 'Yes — Complete',
    response: 'Data dictionary status: Yes — Complete (canonical schema and mapping definitions are documented).',
  },
  'developmentData.qualityAssessment': {
    kind: 'scalar',
    value:
      'Quality controls include completeness checks, record-count and control-total reconciliations, range/validity rules (for example DPD bounds and non-negative balances), threshold-based exception reviews, and pre-run QC sign-off.',
    response:
      'Quality checks include completeness, reconciliations, validity/range tests, exception management, and formal pre-run QC sign-off.',
  },
  'developmentData.dataCertification': {
    kind: 'scalar',
    value:
      'Each production cycle includes a signed data certification memo from the data owner (or delegate), countersigned by the model owner after reconciliation and QC exception resolution.',
    response:
      'Data is formally certified each cycle via a signed data owner memo, countersigned by the model owner after reconciliation/QC review.',
  },
  'developmentData.treatmentsTransformations': {
    kind: 'scalar',
    value:
      'Transformations include canonical field mapping, date and amount standardization, derivations such as DPD buckets and segment overrides, null handling conventions, and normalization of scenario identifiers and metadata.',
    response:
      'Treatments include canonical mapping, date/amount standardization, DPD bucket derivation, null handling, and scenario metadata normalization.',
  },
  'developmentData.cleansingProcess': {
    kind: 'scalar',
    value:
      'Cleansing applies deduplication, missing-value and stale-value handling rules, outlier/error flags, reconciliation to authoritative totals, and documented exception remediation prior to model execution.',
    response:
      'Cleansing steps cover deduplication, missing/outlier handling, reconciliation to source totals, and documented exception remediation before runs.',
  },
  'outputUse.backTestingApproach': {
    kind: 'scalar',
    value: 'Both',
    response: 'Back-testing approach: Both in-sample and out-of-sample.',
  },
  'outputUse.backTestingDescription': {
    kind: 'scalar',
    value:
      'Back-testing compares modeled loss rates and segment-level ECL to realized outcomes across consecutive periods, using predefined relative-difference and variance thresholds with tiered escalation when breaches persist.',
    response:
      'Back-testing compares modeled vs realized outcomes by segment across periods using defined thresholds and escalation tiers.',
  },
  'outputUse.backTestingResults': {
    kind: 'scalar',
    value:
      'Back-testing is acceptable overall for governance use, with deviations investigated through attribution analysis and overlay/recalibration review when threshold breaches are sustained.',
    response:
      'High-level result: acceptable overall, with any sustained threshold breaches investigated and governed through overlays or recalibration review.',
  },
  'outputUse.sensitivityPerformed': {
    kind: 'scalar',
    value: 'Yes — Comprehensive',
    response: 'Sensitivity analysis status: Yes — Comprehensive.',
  },
  'outputUse.sensitivityDescription': {
    kind: 'scalar',
    value:
      'Sensitivity testing shocks key drivers (macro paths, PD/LGD assumptions, segmentation choices, and overlay assumptions) and measures directional and magnitude impacts on segment and total ECL.',
    response:
      'Sensitivity testing shocks macro, PD/LGD, segmentation, and overlay assumptions and measures the ECL impact by segment and portfolio.',
  },
  'outputUse.benchmarkModel': {
    kind: 'scalar',
    value:
      'Benchmarks include prior/legacy CECL process outputs, segment-level historical loss trend baselines, and developer portfolio health diagnostics where applicable.',
    response:
      'Benchmarking uses legacy CECL outputs, historical trend baselines, and developer-level diagnostics where applicable.',
  },
  'outputUse.benchmarkResults': {
    kind: 'scalar',
    value:
      'Benchmark comparisons are directionally consistent overall; material deltas are attributed to scenario mix, segmentation effects, and approved overlays with documented rationale.',
    response:
      'Benchmark results are directionally consistent overall, with material differences explained by scenario, segmentation, and approved overlay effects.',
  },
  'outputUse.parallelRun': {
    kind: 'scalar',
    value: 'Yes',
    response:
      'Parallel run: Yes. The runbook recommends and documents parallel operation against the prior process before production reliance.',
  },
  'outputUse.comparisonToDeveloper': {
    kind: 'scalar',
    value:
      'Bank monitoring is institution-specific and close-cycle focused, while developer monitoring is cross-client and aggregated; client monitoring remains primary for SR 11-7 compliance with vendor diagnostics used as context.',
    response:
      "Bank monitoring is institution-specific and primary; developer monitoring is aggregated benchmark context and does not replace the bank's own oversight.",
  },
  'outputUse.tuningProcess': {
    kind: 'scalar',
    value:
      'Recalibration evaluation is triggered by sustained back-test failures, persistent overlays, or scheduled annual review. The process includes trigger memo, scoped analysis, approval workflow, versioned release, and post-change monitoring.',
    response:
      'Retuning is triggered by sustained back-test/overlay signals or annual review, then executed through documented analysis, approvals, version release, and post-change monitoring.',
  },
  'implementation.standardSettings': {
    kind: 'scalar',
    value:
      'Standard settings include monthly close cadence, approved scenario package and weights, QC tolerances, reconciliation thresholds, and access roles. Changes require documented approvals and version-controlled release steps.',
    response:
      'Standard settings cover run cadence, scenario/weight package, QC tolerances, and access roles; changes require controlled approvals and release governance.',
  },
  'implementation.implementationTesting': {
    kind: 'scalar',
    value:
      'Implementation testing includes UAT in non-production, multi-period month-end dry runs, reconciliation checks, QC pass criteria, and where applicable a parallel run versus the legacy process before go-live sign-off.',
    response:
      'Implementation testing included UAT, multi-period dry runs, reconciliation/QC checks, and parallel run evidence before go-live approval.',
  },
  'implementation.socReport': {
    kind: 'scalar',
    value: 'Available — No Issues',
    response:
      'SOC status: Available — No Issues. The documents reference SOC 1 Type II and SOC 2 Type II with no material exceptions noted for the cited period.',
  },
  'implementation.materialChangeDefinition': {
    kind: 'scalar',
    value:
      'A material change is any update expected to materially affect ECL outputs or controls, including methodology/parameter changes, segmentation redesign, data pipeline/control changes, or scenario framework changes requiring governance review.',
    response:
      'Material change is defined as any methodology, parameter, segmentation, data/control, or scenario-framework change expected to materially affect outputs or controls.',
  },
  'implementation.stepByStepGuide': {
    kind: 'scalar',
    value: 'Available',
    response:
      'Step-by-step guide status: Available (the runbook includes monthly operating procedures and sign-off checklist steps).',
  },
  'performance.adjustmentsDetails': {
    kind: 'scalar',
    value:
      'Adjustments are documented by type (data override, parameter override, segmentation override, or post-model overlay), with affected components, direction/magnitude, evidence, approvals, duration, and persistence tracking in the overlay log.',
    response:
      'Adjustments are tracked by type, impact, rationale, approvals, duration, and persistence in the override/overlay governance log.',
  },
  'governance.staffingChanges': {
    kind: 'scalar',
    value:
      'No significant staffing change is assumed for this demo baseline. If a significant role change occurs, the documented protocol requires knowledge transfer, successor onboarding, governance disclosure, and updated role designations.',
    response:
      'Staffing changes: none material assumed for this demo baseline; documented continuity protocol applies if critical role transitions occur.',
  },
  'governance.references': {
    kind: 'table',
    response:
      'Reference set includes methodology, ETL specification, implementation runbook, and monitoring/governance guide used for this CECL intake.',
    rows: [
      {
        id: 'ref_cecl_1',
        name: 'Vendor_Methodology_Model_Development_Report.docx',
        type: 'Methodology Report',
        description:
          'Model architecture, development rationale, assumptions, limitations, and monitoring framework for CECL Suite v4.2.',
      },
      {
        id: 'ref_cecl_2',
        name: 'Vendor_Data_Requirements_Mapping_ETL_Specification.docx',
        type: 'Data/ETL Specification',
        description:
          'Canonical schema, mappings, extraction approach, reconciliations, QC rules, and certification controls for production data loads.',
      },
      {
        id: 'ref_cecl_3',
        name: 'Vendor_Implementation_Production_Runbook.docx',
        type: 'Implementation Runbook',
        description:
          'Implementation lifecycle, UAT and parallel run expectations, production operating procedures, and release governance.',
      },
      {
        id: 'ref_cecl_4',
        name: 'Vendor_Model_Monitoring_Governance_Guide.docx',
        type: 'Monitoring/Governance Guide',
        description:
          'Monitoring metrics, overlay governance, recalibration triggers, role responsibilities, and contingency expectations.',
      },
    ],
  },
};

function toSnakeCase(value: string): string {
  return value.replace(/([A-Z])/g, '_$1').toLowerCase();
}

function getValueAtPath(formState: IntakeFormState, path: string): unknown {
  const [sectionKey, fieldKey] = path.split('.');
  if (!sectionKey || !fieldKey) return undefined;

  const section = (formState as unknown as Record<string, unknown>)[sectionKey];
  if (!section || typeof section !== 'object') return undefined;

  return (section as Record<string, unknown>)[fieldKey];
}

function isFilledValue(value: unknown): boolean {
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0;
  return true;
}

function buildFieldUpdate(path: string, value: DemoAutofillValue): FieldUpdate | null {
  const [sectionKey, fieldKey] = path.split('.');
  if (!sectionKey || !fieldKey) return null;
  return {
    section: toSnakeCase(sectionKey),
    field: toSnakeCase(fieldKey),
    value,
    action: 'set',
  };
}

export function getCeclDemoAutofillResponseForFieldPath(path: string): string | undefined {
  return CECL_DEMO_AUTOFILL_BY_PATH[path]?.response;
}

export function getCeclDemoAutofillResponsesForUnfilledFields(formState: IntakeFormState): string[] {
  const responses: string[] = [];
  const seen = new Set<string>();

  for (const path of ORDERED_FIELD_PATHS) {
    const value = getValueAtPath(formState, path);
    if (isFilledValue(value)) continue;

    const response = CECL_DEMO_AUTOFILL_BY_PATH[path]?.response?.trim();
    if (!response || seen.has(response)) continue;

    seen.add(response);
    responses.push(response);
  }

  return responses;
}

export function buildCeclDemoAutofillUpdates(formState: IntakeFormState): FieldUpdate[] {
  const updates: FieldUpdate[] = [];

  for (const path of ORDERED_FIELD_PATHS) {
    const currentValue = getValueAtPath(formState, path);
    if (isFilledValue(currentValue)) continue;

    const entry = CECL_DEMO_AUTOFILL_BY_PATH[path];
    if (!entry) continue;

    if (entry.kind === 'scalar') {
      const update = buildFieldUpdate(path, entry.value);
      if (update) {
        updates.push(update);
      }
      continue;
    }

    const [sectionKey, fieldKey] = path.split('.');
    if (!sectionKey || !fieldKey) continue;

    const section = toSnakeCase(sectionKey);
    const field = toSnakeCase(fieldKey);
    for (const row of entry.rows) {
      updates.push({
        section,
        field,
        value: row,
        action: 'add_row',
      });
    }
  }

  return updates;
}
