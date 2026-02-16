export interface TemplateSection {
  id: string;
  title: string;
  parentSection?: string;
  description: string;
}

export const TEMPLATE_SECTIONS: TemplateSection[] = [
  {
    id: 'model_summary',
    title: 'Model Summary',
    description: 'Cover page table with key model metadata',
  },
  {
    id: '1.1',
    title: '1.1 Business Purpose and Use',
    parentSection: '1. Executive Summary',
    description: 'Business purpose, regulatory standards, reporting impact, business units, usage frequency',
  },
  {
    id: '1.2',
    title: '1.2 Model Description',
    parentSection: '1. Executive Summary',
    description: 'Products/portfolios covered, methodology, key drivers, data sources, output description',
  },
  {
    id: '1.3',
    title: '1.3 Alternatives Considered',
    parentSection: '1. Executive Summary',
    description: 'Alternative approaches evaluated and rationale for rejection',
  },
  {
    id: '1.4',
    title: '1.4 Model Assumptions',
    parentSection: '1. Executive Summary',
    description: 'Key assumptions and supporting analytical evidence (table)',
  },
  {
    id: '1.5',
    title: '1.5 Model Limitations',
    parentSection: '1. Executive Summary',
    description: 'Known limitations and mitigating risks (table)',
  },
  {
    id: '2.1',
    title: '2.1 Model Theory and Approach',
    parentSection: '2. Model Design',
    description: 'Design, theory, and logic underlying the model',
  },
  {
    id: '2.2',
    title: '2.2 Model Estimation',
    parentSection: '2. Model Design',
    description: 'Estimation methodology and how it was determined',
  },
  {
    id: '2.3',
    title: '2.3 Model Structure',
    parentSection: '2. Model Design',
    description: 'Final model structure including equations and variables',
  },
  {
    id: '2.4',
    title: '2.4 Segmentation',
    parentSection: '2. Model Design',
    description: 'Segmentation details and justification',
  },
  {
    id: '2.5',
    title: '2.5 Iterative Steps',
    parentSection: '2. Model Design',
    description: 'Process flow for non-statistical models',
  },
  {
    id: '2.6',
    title: '2.6 Judgmental/Qualitative Adjustments',
    parentSection: '2. Model Design',
    description: 'Manual adjustments, override frequency, documentation',
  },
  {
    id: '3.1',
    title: '3.1 Data Sources',
    parentSection: '3. Development Data',
    description: 'Internal and external data sources, volume, applicability',
  },
  {
    id: '3.2',
    title: '3.2 Data Quality',
    parentSection: '3. Development Data',
    description: 'Quality assessment, certification, treatments',
  },
  {
    id: '3.3',
    title: '3.3 Data Preparation',
    parentSection: '3. Development Data',
    description: 'Extraction, cleansing, ETL documentation',
  },
  {
    id: '4.1',
    title: '4.1 Back-testing',
    parentSection: '4. Output & Use',
    description: 'Back-testing approach, description, and results',
  },
  {
    id: '4.2',
    title: '4.2 Sensitivity Analysis',
    parentSection: '4. Output & Use',
    description: 'Sensitivity testing approach and results',
  },
  {
    id: '4.3',
    title: '4.3 Benchmarking',
    parentSection: '4. Output & Use',
    description: 'Benchmark models/data, results, parallel run status',
  },
  {
    id: '4.4',
    title: '4.4 Ongoing Monitoring Plan',
    parentSection: '4. Output & Use',
    description: 'Monitoring approach, frequency, tuning process',
  },
  {
    id: '5.1',
    title: '5.1 Implementation Overview',
    parentSection: '5. Implementation',
    description: 'Platform, system flow, standard settings',
  },
  {
    id: '5.2',
    title: '5.2 Implementation Testing',
    parentSection: '5. Implementation',
    description: 'Testing performed for implementation consistency',
  },
  {
    id: '5.3',
    title: '5.3 Controls',
    parentSection: '5. Implementation',
    description: 'Security, access controls, change management',
  },
  {
    id: '5.4',
    title: '5.4 Operating Procedures',
    parentSection: '5. Implementation',
    description: 'Step-by-step implementation procedures, UAT testing',
  },
  {
    id: '6.1',
    title: '6.1 Adjustments and Overlays',
    parentSection: '6. Performance',
    description: 'Purpose, details, and rationale for adjustments',
  },
  {
    id: '6.2',
    title: '6.2 Model Reporting',
    parentSection: '6. Performance',
    description: 'Reporting structure, metrics, and frequency',
  },
  {
    id: '7.1',
    title: '7.1 Roles and Responsibilities',
    parentSection: '7. Governance',
    description: 'Designated resources, background, staffing changes',
  },
  {
    id: '7.2',
    title: '7.2 Business Contingency/Continuity',
    parentSection: '7. Governance',
    description: 'Contingency and continuity plan',
  },
  {
    id: '7.3',
    title: '7.3 References',
    parentSection: '7. Governance',
    description: 'Applicable references (table)',
  },
];

export const SECTION_GROUPS = [
  { id: 'model_summary', title: 'Model Summary', sections: ['model_summary'] },
  { id: 'executive_summary', title: '1. Executive Summary', sections: ['1.1', '1.2', '1.3', '1.4', '1.5'] },
  { id: 'model_design', title: '2. Model Design', sections: ['2.1', '2.2', '2.3', '2.4', '2.5', '2.6'] },
  { id: 'development_data', title: '3. Development Data', sections: ['3.1', '3.2', '3.3'] },
  { id: 'output_use', title: '4. Output & Use', sections: ['4.1', '4.2', '4.3', '4.4'] },
  { id: 'implementation', title: '5. Implementation', sections: ['5.1', '5.2', '5.3', '5.4'] },
  { id: 'performance', title: '6. Performance', sections: ['6.1', '6.2'] },
  { id: 'governance', title: '7. Governance', sections: ['7.1', '7.2', '7.3'] },
];
