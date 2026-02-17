// ---------------------------------------------------------------------------
// Shared Crowe brand color constants
// Used by docx-export, pdf-export, and any other non-CSS contexts.
// CSS contexts should use the Tailwind / CSS-variable equivalents instead.
// ---------------------------------------------------------------------------

// DOCX colors (hex without #)
export const DOCX_CROWE_INDIGO = '011E41';
export const DOCX_CROWE_AMBER = 'F5A800';
export const DOCX_CROWE_MUTED = '828282';
export const DOCX_CROWE_SECONDARY_TEXT = '4F4F4F';
export const DOCX_CROWE_BORDER = 'E0E0E0';
export const DOCX_CROWE_STRIPE = 'F1F5F9';

// PDF colors (RGB tuples)
export const PDF_INDIGO = { r: 1, g: 30, b: 65 } as const;
export const PDF_AMBER = { r: 245, g: 168, b: 0 } as const;
export const PDF_TEXT = { r: 51, g: 51, b: 51 } as const;
export const PDF_MUTED = { r: 130, g: 130, b: 130 } as const;

// ---------------------------------------------------------------------------
// Required fields — displayed with asterisks + used for step validation.
// Paths are `sectionKey.fieldName`.
// ---------------------------------------------------------------------------

export const REQUIRED_FIELDS = new Set<string>([
  // Model Summary (critical identifiers)
  'modelSummary.modelType',
  'modelSummary.modelDeveloper',
  'modelSummary.modelOwner',
  'modelSummary.riskRating',
  // Executive Summary
  'executiveSummary.businessPurpose',
  'executiveSummary.regulatoryStandards',
  // Model Design
  'modelDesign.theoryAndApproach',
  'modelDesign.estimationMethodology',
]);

// Minimum required fields for Step 1 → Step 2 transition
export const STEP1_REQUIRED_FIELDS = new Set<string>([
  'modelSummary.modelType',
  'modelSummary.modelOwner',
]);
