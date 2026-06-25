export type ItemType = 'Contract' | 'Component-Group' | 'Component';
export type ItemStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'ARCHIVED' | 'WITHDRAWN';

export type FoundationType = 'DEF' | 'VAR' | 'LOV' | 'TEC' | 'SYS' | 'ATT';

export const foundationTypeLabels: Record<FoundationType, string> = {
  DEF: 'Definition',
  VAR: 'Variable',
  LOV: 'List of Values',
  TEC: 'Technical Guidance',
  SYS: 'System Guidance',
  ATT: 'Attribute',
};

export interface FoundationItem {
  id: string;
  name: string;
  type: FoundationType;
  status: ItemStatus;
  version: string;
  lastModified: string;
  owner: string;
  segment?: string;
  usages: number;
  // DEF
  body?: string;
  crossReferences?: string[];
  usedIn?: string[];
  // GV
  valueType?: string;
  listSource?: string;
  listSourceLabel?: string;
  hasDerivation?: boolean;
  dependencyNote?: string;
  question?: string;
  wolExpression?: string;
  systemGuidance?: string;
  // LOV
  schemaColumns?: string[];
  rowCount?: number;
  versionPinned?: boolean;
  // TEC / SYS
  summary?: string;
  linkedUsages?: string[];
  // DM
  dmType?: string;
  dmApplicability?: string[];
  // GV System Guidance
  systemGuidanceMode?: 'none' | 'embedded' | 'linked';
  // Descriptive Metadata (from creation setup)
  riskCodes?: string[];
  cob?: string;
  jurisdictions?: string[];
  wolPublicationNotes?: string;
}

export const foundationItems: FoundationItem[] = [
  {
    id: 'def-001',
    name: 'Insured Vessel',
    type: 'DEF',
    status: 'ACTIVE',
    version: '2.1.0',
    lastModified: '2026-02-14',
    owner: 'R. Pyke',
    segment: 'Marine Hull',
    usages: 14,
    body: 'The vessel described in the Schedule, including any machinery, gear, equipment and outfits, bunkers, stores and provisions, owned or for the account of the Assured.',
    crossReferences: ['VAR: Vessel IMO Number', 'LOV: Vessel Categories'],
    usedIn: ['ctr-001'],
  },
  {
    id: 'gv-001',
    name: 'Notice Days',
    type: 'VAR',
    status: 'ACTIVE',
    version: '1.1.0',
    lastModified: '2026-01-15',
    owner: 'R. Pyke',
    segment: 'General',
    usages: 18,
    valueType: 'integer',
    listSource: 'instances',
    listSourceLabel: 'Direct numeric input',
    hasDerivation: false,
    dependencyNote: 'Used downstream by Notice Period definition and C12.9 component.',
    usedIn: ['ctr-001', 'cmp-002', 'cl-001'],
  },
  {
    id: 'lov-001',
    name: 'Vessel Categories',
    type: 'LOV',
    status: 'ACTIVE',
    version: '2.0.0',
    lastModified: '2026-02-01',
    owner: 'R. Pyke',
    segment: 'Marine Hull',
    usages: 6,
    schemaColumns: ['id (string)', 'label (string)', 'parentCategory (string|null)'],
    rowCount: 12,
    versionPinned: true,
    usedIn: ['ctr-001', 'cg-001', 'def-001'],
  },
  {
    id: 'tec-001',
    name: 'Rendering Rules for Optional Clauses',
    type: 'TEC',
    status: 'ACTIVE',
    version: '1.2.0',
    lastModified: '2026-02-20',
    owner: 'R. Pyke',
    segment: 'General',
    usages: 4,
    summary: 'Specifies how [OPT]…[/OPT] blocks are rendered in digital and analogue outputs. Optional blocks appear with a shaded left bar and an "Optional" badge in preview; they are excluded from analogue exports unless explicitly included.',
    linkedUsages: [],
    usedIn: ['ctr-001', 'ctr-002', 'cg-001'],
  },
  {
    id: 'sys-001',
    name: 'Version Numbering Convention',
    type: 'SYS',
    status: 'ACTIVE',
    version: '1.0.0',
    lastModified: '2025-10-01',
    owner: 'C. Wise',
    segment: 'General',
    usages: 2,
    summary: 'Objects follow semantic versioning (MAJOR.MINOR.PATCH). MAJOR increments on breaking schema changes; MINOR on additive content changes; PATCH on corrections.',
    linkedUsages: [],
    usedIn: ['ctr-001', 'ctr-002'],
  },
  {
    id: 'def-002',
    name: 'Trading Area',
    type: 'DEF',
    status: 'ACTIVE',
    version: '1.3.0',
    lastModified: '2026-02-28',
    owner: 'R. Pyke',
    segment: 'Marine Hull',
    usages: 11,
    body: 'The geographical limits within which the insured vessel is permitted to operate, as specified in the policy schedule and any applicable Institute Warranty Limits.',
    crossReferences: ['VAR: Navigation Limits Exception', 'LOV: Trading Area Codes'],
    usedIn: ['ctr-001', 'cg-001'],
  },
  {
    id: 'gv-002',
    name: 'Cancellation Notice Period',
    type: 'VAR',
    status: 'ACTIVE',
    version: '1.0.0',
    lastModified: '2026-03-02',
    owner: 'C. Wise',
    segment: 'General',
    usages: 7,
    valueType: 'integer',
    listSource: 'instances',
    listSourceLabel: 'Direct numeric input',
    hasDerivation: false,
    dependencyNote: 'Drives cancellation and non-renewal timeline text in contract clauses.',
    usedIn: ['ctr-001', 'cl-001', 'cmp-002'],
  },
  {
    id: 'lov-002',
    name: 'Trading Area Codes',
    type: 'LOV',
    status: 'ACTIVE',
    version: '1.2.0',
    lastModified: '2026-03-01',
    owner: 'R. Pyke',
    segment: 'Marine Hull',
    usages: 8,
    schemaColumns: ['code (string)', 'label (string)', 'region (string)'],
    rowCount: 24,
    versionPinned: true,
    usedIn: ['ctr-001', 'cg-001', 'cmp-004', 'def-002'],
  },
  {
    id: 'tec-002',
    name: 'Fallback Rules for Legacy Analog Clauses',
    type: 'TEC',
    status: 'DRAFT',
    version: '0.4.0',
    lastModified: '2026-03-12',
    owner: 'C. Wise',
    segment: 'General',
    usages: 3,
    summary: 'Defines rendering and downgrade behavior when analogue-only clauses are referenced in digital policy outputs.',
    linkedUsages: [],
    usedIn: ['doc-001', 'doc-002'],
  },
  {
    id: 'sys-002',
    name: 'Approval SLA for Clause Changes',
    type: 'SYS',
    status: 'PENDING_APPROVAL',
    version: '0.9.0',
    lastModified: '2026-03-15',
    owner: 'A. Lloyd',
    segment: 'General',
    usages: 1,
    summary: 'Defines expected turnaround times and escalation paths for draft, urgent, and regulatory clause approvals.',
    linkedUsages: [],
    usedIn: ['ctr-001', 'ctr-002'],
  },
];

export const dynamicFoundationItems: FoundationItem[] = [
  {
    id: 'dm-001',
    name: 'Class of Business',
    type: 'ATT',
    status: 'ACTIVE',
    version: '1.2.0',
    lastModified: '2026-04-01',
    owner: 'R. Pyke',
    segment: 'General',
    usages: 14,
    dmType: 'single-select',
    dmApplicability: ['contract', 'component-group', 'component'],
    body: 'Classifies the line of business to which a wording object belongs. Used for filtering, routing, and portfolio segmentation. Values: Marine, Aviation, Non-Marine, General.',
    wolExpression: 'DM.ClassOfBusiness := LOV.ClassesOfBusiness[status = "active"]',
    usedIn: ['ctr-001', 'cg-001', 'ctr-002', 'cmp-001'],
    dmWeighting: 90,
  },
  {
    id: 'dm-002',
    name: 'Jurisdiction',
    type: 'ATT',
    status: 'ACTIVE',
    version: '1.0.0',
    lastModified: '2026-03-15',
    owner: 'R. Pyke',
    segment: 'General',
    usages: 11,
    dmType: 'single-select',
    dmApplicability: ['contract', 'component'],
    body: 'Specifies the legal jurisdiction applicable to a wording object, governing which legal framework and regulatory requirements apply.',
    wolExpression: 'DM.Jurisdiction := LOV.Jurisdictions[isActive = true]',
    usedIn: ['ctr-001', 'ctr-002', 'cmp-003'],
    dmWeighting: 75,
  },
  {
    id: 'dm-003',
    name: 'Country',
    type: 'ATT',
    status: 'ACTIVE',
    version: '1.0.0',
    lastModified: '2026-03-20',
    owner: 'A. Lloyd',
    segment: 'General',
    usages: 8,
    dmType: 'multi-select',
    dmApplicability: ['contract', 'component'],
    body: 'Specifies the country or countries of operation or risk location to which this wording object applies.',
    wolExpression: 'DM.Country := LOV.Countries[isEnabled = true]',
    usedIn: ['ctr-001', 'cmp-003', 'cmp-013'],
    dmWeighting: 60,
  },
  {
    id: 'dm-004',
    name: 'Contract Family',
    type: 'ATT',
    status: 'ACTIVE',
    version: '0.9.0',
    lastModified: '2026-04-10',
    owner: 'C. Wise',
    segment: 'General',
    usages: 7,
    dmType: 'single-select',
    dmApplicability: ['contract', 'component-group'],
    body: 'Groups contracts into families for portfolio management, version inheritance, and cross-contract governance purposes.',
    wolExpression: 'DM.ContractFamily := LOV.ContractFamilies[isActive = true]',
    usedIn: ['ctr-001', 'ctr-002', 'cg-001'],
    dmWeighting: 70,
  },
  {
    id: 'dm-005',
    name: 'Component Family',
    type: 'ATT',
    status: 'DRAFT',
    version: '0.5.0',
    lastModified: '2026-05-02',
    owner: 'C. Wise',
    segment: 'General',
    usages: 3,
    dmType: 'single-select',
    dmApplicability: ['component-group', 'component'],
    body: 'Associates a component with a named exclusion or coverage family (e.g. Cyber, Terrorism, Sanctions). Used for quick-preview filtering and component catalogue navigation.',
    wolExpression: 'DM.ComponentFamily := LOV.ComponentFamilies[isEnabled = true]',
    usedIn: ['cg-001', 'cmp-001', 'cmp-003'],
    dmWeighting: 80,
  },
];

export const statusLabels: Record<ItemStatus, string> = {
  'DRAFT': 'Draft',
  'PENDING_APPROVAL': 'Pending Approval',
  'ACTIVE': 'Active',
  'ARCHIVED': 'Archived',
  'WITHDRAWN': 'Withdrawn',
};

export interface RepositoryItem {
  id: string;
  name: string;
  type: ItemType;
  status: ItemStatus;
  classOfBusiness: string;
  version: string;
  lastModified: string;
  owner: string;
  jurisdiction: string;
  description: string;
  usedIn: string[];
  externalUrl?: string;
  source?: string;
  format?: 'digital' | 'analogue';
  fileUrl?: string;
  // Descriptive Metadata (from creation setup)
  riskCodes?: string[];
  jurisdictions?: string[];
  wolPublicationNotes?: string;
}

export const repositoryItems: RepositoryItem[] = [
  { id: 'ctr-001', name: 'LMA5400 Marine Hull Policy', type: 'Contract', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '3.2.0', lastModified: '2026-03-08', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Standard marine hull policy wording for London Market.', usedIn: [] },
  { id: 'cg-001', name: 'Marine Perils Group', type: 'Component-Group', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '4.0.0', lastModified: '2026-03-07', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Group of marine peril components including standard and war risks.', usedIn: ['ctr-001'] },
  { id: 'cmp-002', name: 'C Notice of non-renewal', type: 'Component', status: 'DRAFT', classOfBusiness: 'Marine Hull', version: '0.1.0', lastModified: '2026-03-30', owner: 'R. Pyke', jurisdiction: 'UK', description: '', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'ctr-002', name: 'LMA5405 Cargo Open Cover', type: 'Contract', status: 'PENDING_APPROVAL', classOfBusiness: 'Marine Cargo', version: '1.4.0', lastModified: '2026-03-19', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Open cover wording for recurring cargo shipments.', usedIn: [] },
  { id: 'cg-002', name: 'Cargo Transit Group', type: 'Component-Group', status: 'DRAFT', classOfBusiness: 'Marine Cargo', version: '0.6.0', lastModified: '2026-03-21', owner: 'C. Wise', jurisdiction: 'UK', description: 'Transit risk clauses and handling terms for cargo contracts.', usedIn: ['ctr-002'] },
  { id: 'cmp-003', name: 'C Sanctions Compliance Warranty', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '2.0.0', lastModified: '2026-03-11', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Warranty requiring sanctions compliance checks before attachment.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-004', name: 'C Trading Area Extension', type: 'Component', status: 'PENDING_APPROVAL', classOfBusiness: 'Marine Hull', version: '1.0.0', lastModified: '2026-03-17', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Optional extension for seasonal trading area expansion.', usedIn: ['cg-001'], format: 'digital' },
  { id: 'cl-001', name: '12.8 Cancellation Terms', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.7.0', lastModified: '2026-02-26', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Clause text governing cancellation rights and notice periods.', usedIn: ['cmp-002'], format: 'digital' },
  { id: 'doc-001', name: 'ITC Hulls 10/83 Reference PDF', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '5.1.0', lastModified: '2026-01-10', owner: 'C. Wise', jurisdiction: 'UK', description: 'Reference analogue wording source document.', usedIn: ['ctr-001'], format: 'digital' },
  { id: 'doc-002', name: 'Cargo Claims Handling Manual', type: 'Component', status: 'ARCHIVED', classOfBusiness: 'Marine Cargo', version: '2.9.0', lastModified: '2025-12-04', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Legacy manual for claims process wording references.', usedIn: ['ctr-002'], format: 'digital' },
  { id: 'cmp-005', name: 'C Claims Cooperation Clause', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.3.0', lastModified: '2026-03-22', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Obligations for assured cooperation during claims handling and investigation.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-006', name: 'C Prompt Notice of Loss', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.2.0', lastModified: '2026-03-20', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Sets timing requirements for notifying underwriters of loss events.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-007', name: 'C Constructive Total Loss Trigger', type: 'Component', status: 'DRAFT', classOfBusiness: 'Marine Hull', version: '0.5.0', lastModified: '2026-03-27', owner: 'C. Wise', jurisdiction: 'UK', description: 'Defines constructive total loss threshold and recovery mechanics.', usedIn: ['cg-001'], format: 'digital' },
  { id: 'cmp-008', name: 'C Sue and Labour Expenses', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '2.1.0', lastModified: '2026-03-18', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Recovery terms for sue and labour charges incurred to avert loss.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-009', name: 'C Breach of Warranty Relief', type: 'Component', status: 'PENDING_APPROVAL', classOfBusiness: 'Marine Hull', version: '0.9.0', lastModified: '2026-03-25', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Defines effects of remedied warranty breaches on ongoing cover.', usedIn: ['cg-001'], format: 'digital' },
  { id: 'cmp-010', name: 'C Partial Loss Settlement Basis', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.6.0', lastModified: '2026-03-16', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Establishes valuation basis for partial loss and repair settlements.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-011', name: 'C General Average Contribution', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Cargo', version: '1.1.0', lastModified: '2026-03-23', owner: 'C. Wise', jurisdiction: 'UK', description: 'General average and salvage contribution treatment for cargo interests.', usedIn: ['cg-002', 'ctr-002'], format: 'digital' },
  { id: 'cmp-012', name: 'C Transit Delay Exclusion', type: 'Component', status: 'DRAFT', classOfBusiness: 'Marine Cargo', version: '0.3.0', lastModified: '2026-03-29', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Excludes indirect losses caused solely by delay in transit.', usedIn: ['cg-002'], format: 'digital' },
  { id: 'cmp-013', name: 'C Warehouse-to-Warehouse Scope', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Cargo', version: '2.0.0', lastModified: '2026-03-14', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Defines warehouse-to-warehouse attachment and termination points.', usedIn: ['cg-002', 'ctr-002'], format: 'digital' },
  { id: 'cmp-014', name: 'C Temperature Control Warranty', type: 'Component', status: 'PENDING_APPROVAL', classOfBusiness: 'Marine Cargo', version: '0.8.0', lastModified: '2026-03-24', owner: 'C. Wise', jurisdiction: 'UK', description: 'Warranty language for temperature-sensitive cargo handling.', usedIn: ['cg-002'], format: 'digital' },
  { id: 'cmp-015', name: 'C Pair and Set Limitation', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Cargo', version: '1.4.0', lastModified: '2026-03-13', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Limits recovery for partial damage to matched pairs or sets.', usedIn: ['cg-002', 'ctr-002'], format: 'digital' },
  { id: 'cmp-016', name: 'C Accumulation Control Endorsement', type: 'Component', status: 'DRAFT', classOfBusiness: 'Property', version: '0.2.0', lastModified: '2026-03-30', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Draft accumulation controls for concentration exposure management.', usedIn: ['ctr-001', 'ctr-002'], format: 'digital' },
  { id: 'cmp-017', name: 'C Catastrophe Event Definition', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Property', version: '1.0.0', lastModified: '2026-03-21', owner: 'C. Wise', jurisdiction: 'UK', description: 'Defines catastrophe event boundaries for aggregation and deductible.', usedIn: ['ctr-001', 'ctr-002'], format: 'digital' },
  { id: 'cmp-018', name: 'C Cyber Carve-Out Clarification', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Casualty', version: '1.5.0', lastModified: '2026-03-19', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Clarifies cyber exclusion carve-backs for accidental non-malicious events.', usedIn: ['ctr-001', 'ctr-002'], format: 'digital' },
  { id: 'cmp-019', name: 'C Named Insured Amendment', type: 'Component', status: 'PENDING_APPROVAL', classOfBusiness: 'Casualty', version: '0.7.0', lastModified: '2026-03-28', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Amends named insured schedule and affiliate coverage provisions.', usedIn: ['ctr-001', 'ctr-002'], format: 'digital' },
  { id: 'cmp-020', name: 'C War Risks Buy-Back Conditions', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.9.0', lastModified: '2026-03-12', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Conditions and pricing hooks for war risks buy-back options.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  { id: 'cmp-021', name: 'C Institute Notice Clause Adaptation', type: 'Component', status: 'ARCHIVED', classOfBusiness: 'Marine Cargo', version: '1.0.0', lastModified: '2025-11-20', owner: 'C. Wise', jurisdiction: 'UK', description: 'Superseded adaptation of institute notice language.', usedIn: ['ctr-002'], format: 'digital' },
  { id: 'cmp-022', name: 'C Crew Competency Warranty', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.1.0', lastModified: '2026-03-15', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Requires minimum competency and certification standards for crew.', usedIn: ['cg-001'], format: 'digital' },
  { id: 'cmp-023', name: 'C Survey Requirement Trigger', type: 'Component', status: 'DRAFT', classOfBusiness: 'Marine Hull', version: '0.4.0', lastModified: '2026-03-31', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Defines triggers for mandatory condition surveys after incidents.', usedIn: ['cg-001'], format: 'digital' },
  { id: 'cmp-024', name: 'C Sanctions Reinstatement Condition', type: 'Component', status: 'PENDING_APPROVAL', classOfBusiness: 'Marine Hull', version: '0.6.0', lastModified: '2026-03-26', owner: 'C. Wise', jurisdiction: 'UK', description: 'Specifies preconditions for reinstating cover after sanctions suspension.', usedIn: ['cg-001', 'ctr-001'], format: 'digital' },
  // Analogue examples — one per object type
  { id: 'ctr-ana-001', name: 'LMA 5402 Marine Hull Policy', type: 'Contract', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '2.0.0', lastModified: '2026-01-15', owner: 'R. Pyke', jurisdiction: 'UK', description: 'Legacy analogue contract wording scanned from original LMA 5402 document.', usedIn: [], format: 'analogue' },
  { id: 'cg-ana-001', name: 'Standard War Perils Group (Legacy)', type: 'Component-Group', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.0.0', lastModified: '2025-11-30', owner: 'C. Wise', jurisdiction: 'UK', description: 'Analogue component group covering standard war peril clauses from pre-digitalisation archive.', usedIn: ['ctr-ana-001'], format: 'analogue' },
  { id: 'cmp-ana-001', name: 'C Institute War Clauses (Hulls)', type: 'Component', status: 'ACTIVE', classOfBusiness: 'Marine Hull', version: '1.0.0', lastModified: '2025-10-22', owner: 'A. Lloyd', jurisdiction: 'UK', description: 'Scanned analogue version of the Institute War Clauses (Hulls) 1/10/83 standard wording.', usedIn: ['cg-ana-001', 'ctr-ana-001'], format: 'analogue' },
];

// Mutable in-memory store for items created at runtime (persists across route changes within the session)
export const dynamicRepositoryItems: RepositoryItem[] = [];

// Shared descriptor metadata options (used in creation dialogs and editors)
export const riskCodes = [
  { id: '1', name: '1: AVIATION HULL AND LIAB INCL WAR EXCL WRO NO PROPOR RI' },
  { id: '1E', name: '1E: OVERSEAS LEG TERRORISM ENERGY OFFSHORE PROPERTY' },
  { id: '1T', name: '1T: OVERSEAS LEG TERRORISM ACCIDENT AND HEALTH' },
  { id: '2', name: '2: AVIATION HULL AND LIAB INCL WAR EXCL WRO NO PROPOR RI' },
];

export const cobOptions = [
  'Marine Hull',
  'Marine Cargo',
  'Aviation',
  'Property',
  'Casualty',
  'Energy',
  'Political Risk',
];

export const jurisdictionOptions = ['UK', 'US', 'EU', 'Singapore', 'Global'];

// Mutable in-memory store for editor paragraph content (keyed by component id)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const draftParagraphsStore: Record<string, any[]> = {};

// Hard-coded paragraph content for specific items (permanent, survives refresh)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const paragraphsByItemId: Record<string, any[]> = {
  'cmp-002': [
    { id: 'p-cmp002-title', blockType: 'h1', content: 'C Notice of non-renewal', titlePrefix: 'C' },
    { id: 'p-cmp002-1234', blockType: 'numbered', clauseNumber: '12.34', indent: 0, content: 'Without prejudice to the provisions specified in @[Communication], the Agreement may be non-renewed by either the Coverholder or the Lead Insurer giving notice to the other which is not less than:' },
    { id: 'p-cmp002-12341', blockType: 'numbered', clauseNumber: '12.34.1', indent: 1, content: '[EMB:xlvi]60[/EMB] [EMB:xlvii]business days[/EMB] prior to the expiry date of the Agreement, or' },
    { id: 'p-cmp002-12342', blockType: 'numbered', clauseNumber: '12.34.2', indent: 1, content: 'Such longer period as may be required by applicable law or regulation.' },
    { id: 'p-cmp002-1235', blockType: 'numbered', clauseNumber: '12.35', indent: 0, content: 'The @[notice period] will not apply if the Lead Insurer or the Coverholder is prevented from renewing the Agreement due to any legal or regulatory constraints, including but not limited to changes in applicable law or regulation, loss of a required license or regulatory authorisation, sanctions, or other legal prohibitions, even if such events occur within the notice period in absence of a notice @[Communication] from the Lead Insurer or the Coverholder.' },
    { id: 'p-cmp002-sc1', blockType: 'sub-component-title', titlePrefix: 'SC', content: 'SC What happens during the notice period – Effect of Non-renewal' },
    { id: 'p-cmp002-1239', blockType: 'numbered', clauseNumber: '12.39', indent: 0, content: 'In the event that notice of non-renewal of the Agreement is served, in accordance with\n@[Communication], the Coverholder and the Insurers agree that at any time during the notice period:' },
    { id: 'p-cmp002-12391', blockType: 'numbered', clauseNumber: '12.39.1', indent: 1, content: 'The Coverholder will have NO authority, without the prior written consent of the Lead Insurer, to:' },
    { id: 'p-cmp002-123911', blockType: 'numbered', clauseNumber: '12.39.1.1', indent: 2, content: 'Cancel, and then replace under the Agreement, any existing policy.' },
    { id: 'p-cmp002-123912', blockType: 'numbered', clauseNumber: '12.39.1.2', indent: 2, content: 'Offer any new or renewal terms and / or quotations and / or bind any new policies or renew any existing policies other than where terms or quotations have been issued and the quotation period is still valid (or are due to be issued imminently) and / or the Coverholder is legally obliged to honour.' },
    { id: 'p-cmp002-123913', blockType: 'numbered', clauseNumber: '12.39.1.3', indent: 2, content: "[EMB:I]Free text, bespoke, effect of termination 'NO authority to…' additional provision(s)[/EMB]" },
    { id: 'p-cmp002-12392', blockType: 'numbered', clauseNumber: '12.39.2', indent: 1, content: 'The Coverholder will have authority, unless specifically agreed otherwise by the Lead Insurer, to:' },
    { id: 'p-cmp002-123921', blockType: 'numbered', clauseNumber: '12.39.2.1', indent: 2, content: "Service existing policies, including making any amendments which do not have the effect of increasing or extending the Insurers' risk exposure.", variants: [{ letter: 'B', content: 'Service existing policies, including making any amendments which are within the scope of @[Module 5 – Scope of Underwriting Authority].' }] },
    { id: 'p-cmp002-123922', blockType: 'numbered', clauseNumber: '12.39.2.2', indent: 2, content: 'Utilise any existing production methods, electronic or otherwise, for the ongoing production of policy documentation and other documents evidencing cover, to effect any authorised amendments to existing policies' },
    { id: 'p-cmp002-sc2', blockType: 'sub-component-title', titlePrefix: 'SC', content: 'SC (Termination special considerations for Automatic and Tacit Renewals What\nhappens during any notice period)' },
    { id: 'p-cmp002-12393', blockType: 'numbered', clauseNumber: '12.39.3', indent: 1, content: 'For all policies subject to Automatic or Tacit Renewal the Coverholder must:' },
    { id: 'p-cmp002-123931', blockType: 'numbered', clauseNumber: '12.39.3.1', indent: 2, content: 'Provide the Insurers with an initial report, within [EMB:I]10[/EMB] [EMB:I] business days[/EMB] detailing:' },
    { id: 'p-cmp002-1239311', blockType: 'numbered', clauseNumber: '12.39.3.1.1', indent: 3, content: 'All policies in force, both during the notice period and at the expiry date of the Agreement, which are or may be subject to Automatic or Tacit Renewal.' },
    { id: 'p-cmp002-1239312', blockType: 'numbered', clauseNumber: '12.39.3.1.2', indent: 3, content: 'All policies for which quotations have been offered prior to the expiry date of the Agreement, which could be bound and may be subject to Automatic or Tacit Renewal.' },
  ],
};

/** Returns sub-component titles (SC blocks) from a component's stored paragraphs */
export function getSubComponentsForItem(itemId: string): { id: string; title: string }[] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paragraphs: any[] = draftParagraphsStore[itemId] || paragraphsByItemId[itemId] || [];
  return paragraphs
    .filter((p: any) => p.blockType === 'sub-component-title')
    .map((p: any) => ({
      id: p.id,
      title: ((p.content as string) || '').replace(/^SC\s*/, '').trim() || 'Untitled Sub-Component',
    }));
}

export interface ContractSection {
  id: string;
  number: string;
  title: string;
  type: 'section' | 'clause' | 'sub-component';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paragraphs?: any[]; // authored ParagraphData[] — used when item has hard-coded content
  content?: string;
  variations?: string[];
  optional?: boolean;
  optionalCondition?: string;
  variables?: { name: string; value: string }[];
  definedTerms?: string[];
  references?: { term: string; definition: string }[];
  children?: ContractSection[];
}

export const contractSections: ContractSection[] = [
  {
    id: 'sec-1',
    number: '1',
    title: 'Preamble',
    type: 'section',
    children: [
      {
        id: 'sec-1-1',
        number: '1.1',
        title: 'Parties & Recitals',
        type: 'clause',
        content: 'This insurance is effected between the ASSURED and the UNDERWRITERS as identified in the Schedule hereto. In consideration of the premium paid, the UNDERWRITERS agree to insure the VESSEL_NAME against the perils hereinafter described.',
        variations: ['A', 'B'],
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: ['ASSURED', 'UNDERWRITERS'],
        references: [
          { term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.' }
        ],
      },
      {
        id: 'sec-1-2',
        number: '1.2',
        title: 'Scope of Cover',
        type: 'clause',
        content: 'Subject to the terms, conditions and exclusions of this policy, the UNDERWRITERS hereby agree to indemnify the ASSURED for a SUM_INSURED in respect of loss or damage to the vessel and its equipment.',
        variables: [{ name: 'SUM_INSURED', value: 'USD 15,000,000' }],
        definedTerms: ['UNDERWRITERS', 'ASSURED'],
      },
    ],
  },
  {
    id: 'sec-2',
    number: '2',
    title: 'Perils Covered',
    type: 'section',
    children: [
      {
        id: 'sec-2-1',
        number: '2.1',
        title: 'Standard Perils',
        type: 'clause',
        content: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion; violent theft by persons from outside the VESSEL_NAME; jettison; piracy; contact with land conveyance, dock or harbour equipment.',
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: [],
      },
      {
        id: 'sec-2-2',
        number: '2.2',
        title: 'Additional Perils',
        type: 'clause',
        content: 'Loss of or damage to the subject-matter insured caused by earthquakes, volcanic eruptions, or lightning shall also be covered under this POLICY, provided the ASSURED has declared the TRADING_AREA in advance.',
        variations: ['A', 'B', 'C'],
        variables: [{ name: 'TRADING_AREA', value: 'IWL' }],
        definedTerms: ['POLICY', 'ASSURED'],
      },
    ],
  },
  {
    id: 'sec-3',
    number: '3',
    title: 'Exclusions',
    type: 'section',
    children: [
      {
        id: 'sec-3-1',
        number: '3.1',
        title: 'War Exclusion',
        type: 'clause',
        content: 'In no case shall this insurance cover loss, damage, liability or expense caused by war, civil war, revolution, rebellion, insurrection, or civil strife arising therefrom, or any hostile act by or against a belligerent power.',
      },
      {
        id: 'sec-3-2',
        number: '3.2',
        title: 'Nuclear Exclusion',
        type: 'clause',
        content: 'In no case shall this insurance cover loss, damage, liability or expense arising from the use of any weapon or device employing atomic or nuclear fission and/or fusion or other like reaction.',
        optional: true,
        optionalCondition: 'GOV: Nuclear risk territory = true',
      },
    ],
  },
  {
    id: 'sec-4',
    number: '4',
    title: 'Claims',
    type: 'section',
    children: [
      {
        id: 'sec-4-1',
        number: '4.1',
        title: 'Notice of Loss',
        type: 'clause',
        content: 'The ASSURED shall give prompt notice to the UNDERWRITERS of any loss or damage that may give rise to a claim under this POLICY. The DEDUCTIBLE_AMOUNT shall apply to each and every claim.',
        variables: [{ name: 'DEDUCTIBLE_AMOUNT', value: 'USD 50,000' }],
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'POLICY'],
      },
    ],
  },
  {
    id: 'sec-5',
    number: '5',
    title: 'General Conditions',
    type: 'section',
    children: [
      {
        id: 'sec-5-1',
        number: '5.1',
        title: 'Classification',
        type: 'clause',
        content: 'The VESSEL_NAME shall be classed with a CLASSIFICATION_SOCIETY which is a member of the International Association of Classification Societies (IACS).',
        optional: true,
        optionalCondition: 'GOV: Classification required = true',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'CLASSIFICATION_SOCIETY', value: 'Lloyd\'s Register' },
        ],
        definedTerms: [],
      },
      {
        id: 'sec-5-2',
        number: '5.2',
        title: 'Navigation Limits',
        type: 'clause',
        content: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits. Breach of the navigation limits shall not void this insurance provided notice is given to the UNDERWRITERS within 10 days.',
        variations: ['A', 'B'],
        variables: [{ name: 'TRADING_AREA', value: 'IWL' }],
        definedTerms: ['UNDERWRITERS'],
        references: [
          { term: 'Institute Warranty Limits', definition: 'The geographical trading limits defined by the Institute of London Underwriters.' }
        ],
      },
    ],
  },
  {
    id: 'sec-6',
    number: '6',
    title: 'Deductibles',
    type: 'section',
    children: [
      {
        id: 'sec-6-1',
        number: '6.1',
        title: 'Standard Deductible',
        type: 'clause',
        content: 'A deductible of DEDUCTIBLE_AMOUNT shall apply to each and every claim arising under this insurance. The ASSURED shall bear the deductible in respect of each occurrence.',
        variables: [{ name: 'DEDUCTIBLE_AMOUNT', value: 'USD 50,000' }],
        definedTerms: ['ASSURED'],
      },
      {
        id: 'sec-6-2',
        number: '6.2',
        title: 'Aggregate Deductible',
        type: 'clause',
        content: 'Where multiple claims arise from a single event, they shall be treated as one occurrence for deductible purposes. The aggregate deductible shall not exceed SUM_INSURED multiplied by the applicable PREMIUM_RATE.',
        variables: [
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
          { name: 'PREMIUM_RATE', value: '0.35%' },
        ],
        optional: true,
        optionalCondition: 'GOV: Aggregate deductible applies = true',
      },
    ],
  },
  {
    id: 'sec-7',
    number: '7',
    title: 'Salvage & Sue and Labour',
    type: 'section',
    children: [
      {
        id: 'sec-7-1',
        number: '7.1',
        title: 'Duty of Assured',
        type: 'clause',
        content: 'It is the duty of the ASSURED and their servants and agents to take such measures as may be reasonable for the purpose of averting or minimising a loss which would be recoverable under this insurance.',
        definedTerms: ['ASSURED'],
      },
      {
        id: 'sec-7-2',
        number: '7.2',
        title: 'Waiver',
        type: 'clause',
        content: 'Measures taken by the ASSURED or the UNDERWRITERS with the object of saving, protecting or recovering the subject-matter insured shall not be considered as a waiver or acceptance of abandonment or otherwise prejudice the rights of either party.',
        definedTerms: ['ASSURED', 'UNDERWRITERS'],
      },
    ],
  },
  {
    id: 'sec-8',
    number: '8',
    title: 'Termination & Cancellation',
    type: 'section',
    children: [
      {
        id: 'sec-8-1',
        number: '8.1',
        title: 'Automatic Termination',
        type: 'clause',
        content: 'This insurance shall terminate automatically upon change of the Classification Society of the VESSEL_NAME, change of ownership or flag, requisition for title or use by any government authority, or upon POLICY_EXPIRY whichever occurs first.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'POLICY_EXPIRY', value: '31 March 2027' },
        ],
        variations: ['A', 'B'],
      },
      {
        id: 'sec-8-2',
        number: '8.2',
        title: 'Notice of Cancellation',
        type: 'clause',
        content: 'This insurance may be cancelled by either the ASSURED or the UNDERWRITERS giving 30 days written notice. A pro-rata return of premium shall be made to the ASSURED for the unexpired period.',
        definedTerms: ['ASSURED', 'UNDERWRITERS'],
      },
    ],
  },
  {
    id: 'sec-9',
    number: '9',
    title: 'Premium & Payment',
    type: 'section',
    children: [
      {
        id: 'sec-9-1',
        number: '9.1',
        title: 'Premium Calculation',
        type: 'clause',
        content: 'The premium payable under this POLICY shall be calculated at a rate of PREMIUM_RATE on the SUM_INSURED. Payment shall be due upon POLICY_INCEPTION or as otherwise agreed between the parties.',
        variables: [
          { name: 'PREMIUM_RATE', value: '0.35%' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
          { name: 'POLICY_INCEPTION', value: '1 April 2026' },
        ],
        definedTerms: ['POLICY'],
      },
    ],
  },
  {
    id: 'sec-10',
    number: '10',
    title: 'War & Strikes',
    type: 'section',
    children: [
      {
        id: 'sec-10-1',
        number: '10.1',
        title: 'War Risks Coverage',
        type: 'clause',
        content: 'Subject to the conditions of this section, this insurance covers loss of or damage to the VESSEL_NAME caused by war, civil war, revolution, rebellion or insurrection, or hostile acts, mines, torpedoes, bombs or other weapons of war.',
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'sec-10-2',
        number: '10.2',
        title: 'Strikes Coverage',
        type: 'clause',
        content: 'This insurance covers loss of or damage caused by strikers, locked-out workmen, or persons taking part in labour disturbances, riots or civil commotions.',
        optional: true,
        optionalCondition: 'GOV: Strikes cover requested = true',
      },
    ],
  },
  {
    id: 'sec-11',
    number: '11',
    title: 'Dispute Resolution',
    type: 'section',
    children: [
      {
        id: 'sec-11-1',
        number: '11.1',
        title: 'Arbitration',
        type: 'clause',
        content: 'Any dispute arising under or in connection with this POLICY shall be referred to arbitration in London in accordance with the Arbitration Act 1996. Each party shall appoint one arbitrator and the two so appointed shall appoint a third.',
        definedTerms: ['POLICY'],
        references: [
          { term: 'Arbitration Act 1996', definition: 'The UK statute governing the law of arbitration.' }
        ],
      },
      {
        id: 'sec-11-2',
        number: '11.2',
        title: 'Governing Law',
        type: 'clause',
        content: 'This insurance shall be subject to English law and practice.',
      },
    ],
  },
  {
    id: 'sec-12',
    number: '12',
    title: 'Schedule & Endorsements',
    type: 'section',
    children: [
      {
        id: 'sec-12-1',
        number: '12.1',
        title: 'Schedule of Particulars',
        type: 'clause',
        content: 'The Schedule attached hereto forms part of this POLICY. All particulars including the VESSEL_NAME, SUM_INSURED, DEDUCTIBLE_AMOUNT, TRADING_AREA, POLICY_INCEPTION and POLICY_EXPIRY dates are as stated therein.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
          { name: 'DEDUCTIBLE_AMOUNT', value: 'USD 50,000' },
          { name: 'TRADING_AREA', value: 'IWL' },
          { name: 'POLICY_INCEPTION', value: '1 April 2026' },
          { name: 'POLICY_EXPIRY', value: '31 March 2027' },
        ],
        definedTerms: ['POLICY'],
        references: [
          { term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.' }
        ],
      },
      {
        id: 'sec-12-2',
        number: '12.2',
        title: 'Endorsement Clause',
        type: 'clause',
        content: 'Any endorsement to this POLICY shall be agreed in writing between the ASSURED and the UNDERWRITERS and shall be attached hereto. Endorsements take effect from the date specified therein.',
        definedTerms: ['POLICY', 'ASSURED', 'UNDERWRITERS'],
        optional: true,
        optionalCondition: 'GOV: Endorsements attached = true',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component Group Sections (4 chapters)                              */
/* ------------------------------------------------------------------ */

export const componentGroupSections: ContractSection[] = [
  {
    id: 'cg-sec-1',
    number: '1',
    title: 'Marine Perils — Standard Coverage',
    type: 'section',
    children: [
      {
        id: 'cg-sec-1-1',
        number: '1.1',
        title: 'Perils of the Seas',
        type: 'clause',
        content: 'This component covers loss of or damage to the subject-matter insured caused by: perils of the seas, rivers, lakes or other navigable waters; fire, explosion; violent theft by persons from outside the VESSEL_NAME; jettison; piracy.',
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: [],
      },
      {
        id: 'cg-sec-1-2',
        number: '1.2',
        title: 'Contact & Collision',
        type: 'clause',
        content: 'Loss or damage caused by contact with land conveyance, dock or harbour equipment or installation; earthquakes, volcanic eruptions or lightning; accidents in loading, discharging or shifting cargo or fuel.',
      },
    ],
  },
  {
    id: 'cg-sec-2',
    number: '2',
    title: 'War Risks Components',
    type: 'section',
    children: [
      {
        id: 'cg-sec-2-1',
        number: '2.1',
        title: 'War Perils',
        type: 'clause',
        content: 'Subject to the conditions of this group, coverage extends to loss of or damage caused by war, civil war, revolution, rebellion or insurrection, or hostile acts by or against a belligerent power, mines, torpedoes, bombs or other weapons of war.',
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'cg-sec-2-2',
        number: '2.2',
        title: 'Detainment',
        type: 'clause',
        content: 'Loss or damage caused by capture, seizure, arrest, restraint or detainment, and the consequences thereof or any attempt thereat. The UNDERWRITERS shall be liable for such losses provided they arise from an act of war.',
        definedTerms: ['UNDERWRITERS'],
        optional: true,
        optionalCondition: 'GOV: Detainment cover = true',
      },
    ],
  },
  {
    id: 'cg-sec-3',
    number: '3',
    title: 'Strikes & Civil Commotion',
    type: 'section',
    children: [
      {
        id: 'cg-sec-3-1',
        number: '3.1',
        title: 'Strikes Clause',
        type: 'clause',
        content: 'This insurance covers loss of or damage to the VESSEL_NAME caused by strikers, locked-out workmen, or persons taking part in labour disturbances, riots or civil commotions.',
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        variations: ['A', 'B'],
      },
      {
        id: 'cg-sec-3-2',
        number: '3.2',
        title: 'Terrorism Coverage',
        type: 'clause',
        content: 'Loss or damage caused by any person acting from a political, ideological or religious motive. This coverage is subject to an additional premium of PREMIUM_RATE applied to the SUM_INSURED.',
        variables: [
          { name: 'PREMIUM_RATE', value: '0.15%' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
        ],
        optional: true,
        optionalCondition: 'GOV: Terrorism cover requested = true',
      },
    ],
  },
  {
    id: 'cg-sec-4',
    number: '4',
    title: 'Exclusions & Limitations',
    type: 'section',
    children: [
      {
        id: 'cg-sec-4-1',
        number: '4.1',
        title: 'Nuclear Exclusion',
        type: 'clause',
        content: 'In no case shall any component within this group cover loss, damage, liability or expense arising from the use of any weapon or device employing atomic or nuclear fission and/or fusion or other like reaction.',
      },
      {
        id: 'cg-sec-4-2',
        number: '4.2',
        title: 'Cyber Exclusion',
        type: 'clause',
        content: 'In no case shall this group cover loss, damage, liability or expense directly or indirectly caused by or contributed to by the use or operation of any computer, electronic system, software programme or network as a means of inflicting harm.',
        variations: ['A', 'B'],
        references: [
          { term: 'Institute Warranty Limits', definition: 'The geographical trading limits defined by the Institute of London Underwriters.' }
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Component Sections (1 chapter)                                     */
/* ------------------------------------------------------------------ */

export const componentSections: ContractSection[] = [
  {
    id: 'comp-sec-1',
    number: '1',
    title: 'Institute Time Clauses — Hulls',
    type: 'section',
    children: [
      {
        id: 'comp-sec-1-1',
        number: '1.1',
        title: 'Perils Clause',
        type: 'clause',
        content: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion; violent theft by persons from outside the VESSEL_NAME; jettison; piracy; contact with land conveyance, dock or harbour equipment or installation; earthquake volcanic eruption or lightning; accidents in loading discharging or shifting cargo or fuel.',
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: [],
      },
      {
        id: 'comp-sec-1-2',
        number: '1.2',
        title: 'Indemnity',
        type: 'clause',
        content: 'The UNDERWRITERS agree to indemnify the ASSURED for the insured value of SUM_INSURED subject to the terms and conditions set forth herein. The DEDUCTIBLE_AMOUNT shall apply to each and every claim.',
        variables: [
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
          { name: 'DEDUCTIBLE_AMOUNT', value: 'USD 50,000' },
        ],
        definedTerms: ['UNDERWRITERS', 'ASSURED'],
        variations: ['A', 'B'],
      },
      {
        id: 'comp-sec-1-3',
        number: '1.3',
        title: 'Navigation',
        type: 'clause',
        content: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits. Breach of the navigation limits shall not void this insurance provided notice is given to the UNDERWRITERS within 10 days.',
        variables: [{ name: 'TRADING_AREA', value: 'IWL' }],
        definedTerms: ['UNDERWRITERS'],
        references: [
          { term: 'Institute Warranty Limits', definition: 'The geographical trading limits defined by the Institute of London Underwriters.' }
        ],
        optional: true,
        optionalCondition: 'GOV: Extended navigation = true',
      },
      {
        id: 'comp-sec-1-4',
        number: '1.4',
        title: 'Classification',
        type: 'clause',
        content: 'The VESSEL_NAME shall be classed with a CLASSIFICATION_SOCIETY which is a member of the International Association of Classification Societies (IACS). Any change of classification shall be notified to the UNDERWRITERS promptly.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'CLASSIFICATION_SOCIETY', value: 'Lloyd\'s Register' },
        ],
        definedTerms: ['UNDERWRITERS'],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  M12 Contract Sections (unified)                                    */
/* ------------------------------------------------------------------ */

export const m12ContractSections: ContractSection[] = [
  {
    id: 'm12-sec-1',
    number: '1',
    title: 'C12.1 — Institute Time Clauses – Hulls',
    type: 'section',
    children: [
      {
        id: 'm12-sec-1-1',
        number: '1.1',
        title: 'Perils Clause',
        type: 'clause',
        content: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion; violent theft by persons from outside the VESSEL_NAME; jettison; piracy; contact with land conveyance, dock or harbour equipment or installation; earthquake volcanic eruption or lightning; accidents in loading discharging or shifting cargo or fuel.',
        variations: ['A', 'B', 'C'],
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: ['ASSURED', 'SCHEDULE'],
        references: [
          { term: 'Schedule (PDF)', definition: 'LMA5400 Marine Hull Policy schedule document (PDF).' }
        ],
      },
      {
        id: 'm12-sec-1-2',
        number: '1.2',
        title: 'Indemnity',
        type: 'clause',
        content: 'The UNDERWRITERS agree to indemnify the ASSURED for the insured value of SUM_INSURED subject to the terms and conditions set forth herein and the applicable governing variables.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
        ],
        definedTerms: ['UNDERWRITERS', 'ASSURED'],
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'm12-sec-1-3',
        number: '1.3',
        title: 'Navigation',
        type: 'clause',
        content: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits. Breach of the navigation limits shall not void this insurance provided notice is given to the UNDERWRITERS within the applicable period.',
        variables: [{ name: 'TRADING_AREA', value: 'IWL' }],
        definedTerms: ['UNDERWRITERS'],
        optional: true,
        optionalCondition: 'GOV: territory = UK OR territory = EU',
      },
    ],
  },
  {
    id: 'm12-sec-2',
    number: '2',
    title: 'C12.1.1 — War & Strikes Clause',
    type: 'section',
    children: [
      {
        id: 'm12-sec-2-1',
        number: '2.1',
        title: 'War Risks',
        type: 'clause',
        content: 'Subject to the conditions of this clause, coverage extends to loss of or damage to the VESSEL_NAME caused by war, civil war, revolution, rebellion or insurrection, or hostile acts by or against a belligerent power, mines, torpedoes, bombs or other weapons of war.',
        variations: ['A', 'B', 'C'],
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        definedTerms: ['ASSURED'],
      },
      {
        id: 'm12-sec-2-2',
        number: '2.2',
        title: 'Strikes & Labour Disturbances',
        type: 'clause',
        content: 'This clause covers loss of or damage caused by strikers, locked-out workmen, or persons taking part in labour disturbances, riots or civil commotions affecting the VESSEL_NAME.',
        variations: ['A', 'B', 'C'],
        variables: [{ name: 'VESSEL_NAME', value: 'MV Ocean Voyager' }],
        optional: true,
        optionalCondition: 'GOV: territory = UK',
      },
      {
        id: 'm12-sec-2-3',
        number: '2.3',
        title: 'Cross-Reference: War Exclusion',
        type: 'clause',
        content: 'For the avoidance of doubt, the coverage provided under this clause is subject to the War Exclusion (C12.3). Where the War Exclusion applies, the provisions of this clause shall be read down accordingly.',
        references: [
          { term: 'War Exclusion', definition: 'Cross-reference to component C12.3 — standard war exclusion clause.' }
        ],
      },
    ],
  },
  {
    id: 'm12-sec-3',
    number: '3',
    title: 'C12.1.2 — Notice Period',
    type: 'section',
    children: [
      {
        id: 'm12-sec-3-1',
        number: '3.1',
        title: 'Notice Requirements',
        type: 'clause',
        content: 'The ASSURED shall give NOTICE_DAYS days written notice to the UNDERWRITERS of any cancellation, amendment or modification of this insurance. The notice period shall be calculated from the date of receipt of written NOTICE by the UNDERWRITERS.',
        variations: ['A', 'B', 'C'],
        variables: [{ name: 'NOTICE_DAYS', value: '30' }],
        definedTerms: ['NOTICE'],
      },
      {
        id: 'm12-sec-3-2',
        number: '3.2',
        title: 'Deemed Receipt',
        type: 'clause',
        content: 'Notice shall be deemed to have been received: (a) if delivered by hand, upon delivery; (b) if sent by registered post, 5 business days after posting; (c) if sent by electronic means, upon confirmed receipt by the recipient system.',
        variations: ['A', 'B', 'C'],
      },
    ],
  },
  {
    id: 'm12-sec-4',
    number: '4',
    title: 'C12.2 — Additional Perils',
    type: 'section',
    children: [
      {
        id: 'm12-sec-4-1',
        number: '4.1',
        title: 'Extended Perils Coverage',
        type: 'clause',
        content: 'Loss of or damage to the subject-matter insured caused by earthquakes, volcanic eruptions, or lightning shall also be covered under this insurance, subject to the applicable LIMIT_AMOUNT and the territorial conditions specified by the governing variable.',
        variations: ['A', 'B'],
        variables: [{ name: 'LIMIT_AMOUNT', value: 'USD 5,000,000' }],
      },
      {
        id: 'm12-sec-4-2',
        number: '4.2',
        title: 'Contamination & Pollution',
        type: 'clause',
        content: 'Loss of or damage caused by contamination or pollution arising from a peril covered under this insurance shall be recoverable, provided the contamination or pollution results directly from an insured peril and notification is given within 72 hours.',
        optional: true,
        optionalCondition: 'GOV: territory = UK OR territory = EU',
        variations: ['A', 'B'],
      },
      {
        id: 'm12-sec-4-3',
        number: '4.3',
        title: 'Limit of Liability',
        type: 'clause',
        content: 'The liability of the UNDERWRITERS under this section shall in no case exceed the LIMIT_AMOUNT in the aggregate for all claims arising from Additional Perils during the period of insurance.',
        variables: [{ name: 'LIMIT_AMOUNT', value: 'USD 5,000,000' }],
        optional: true,
        optionalCondition: 'GOV: territory = Global',
      },
    ],
  },
  {
    id: 'm12-sec-5',
    number: '5',
    title: 'C12.3 — War Exclusion',
    type: 'section',
    children: [
      {
        id: 'm12-sec-5-1',
        number: '5.1',
        title: 'War Exclusion Clause',
        type: 'clause',
        content: 'In no case shall this insurance cover loss, damage, liability or expense caused by WAR, civil war, revolution, rebellion, insurrection, or civil strife arising therefrom, or any hostile act by or against a belligerent power. This exclusion shall apply regardless of any other provision in this insurance.',
        definedTerms: ['WAR'],
      },
      {
        id: 'm12-sec-5-2',
        number: '5.2',
        title: 'Detention & Confiscation',
        type: 'clause',
        content: 'This exclusion extends to capture, seizure, arrest, restraint or detainment (barratry and piracy excepted), and the consequences thereof or any attempt thereat, as well as confiscation or expropriation by any government or public authority.',
        definedTerms: ['WAR'],
      },
    ],
  },
  {
    id: 'm12-sec-6',
    number: '6',
    title: 'C12.T1 — Perils Matrix (Table)',
    type: 'section',
    children: [
      {
        id: 'm12-sec-6-1',
        number: '6.1',
        title: 'Peril Classification Table',
        type: 'clause',
        content: 'The following table classifies the perils applicable under this contract. Each peril is assigned a code and marked as covered or excluded.\n\nPeril Code WP — War Perils: Excluded\nPeril Code SP — Strikes Perils: Covered\nPeril Code FE — Fire & Explosion: Covered\nPeril Code EQ — Earthquake & Volcanic: Covered\nPeril Code PI — Piracy: Covered\nPeril Code CT — Contamination: Covered (conditional)',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  M12 Termination / Automatic Suspension Contract Sections (unified)   */
/* ------------------------------------------------------------------ */

export const m12TermContractSections: ContractSection[] = [
  {
    id: 'm12-term-sec-1',
    number: '1',
    title: 'Scope & Interpretation',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-1-1',
        number: '1.1',
        title: 'Scope',
        type: 'clause',
        content: 'This Module sets out the provisions governing the termination, automatic suspension and reinstatement of this insurance. It shall apply to the POLICY and all endorsements thereto, and shall be read in conjunction with the Schedule and any applicable governing variables.',
        definedTerms: ['POLICY', 'SCHEDULE'],
        references: [
          { term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.' }
        ],
      },
      {
        id: 'm12-term-sec-1-2',
        number: '1.2',
        title: 'Definitions & Interpretation',
        type: 'clause',
        content: 'In this contract, unless the context otherwise requires, the following terms shall have the meanings set forth below:\n\nASSURED: The person(s) or entity named in the Schedule as the party insured under this policy.\nUNDERWRITERS: The insurer(s) subscribing to this policy as listed in the Schedule.\nPOLICY: This contract of marine insurance including the Schedule, clauses and endorsements.\nVESSEL: The ship or watercraft identified in the Schedule.\nSCHEDULE: The schedule of particulars attached to and forming part of this policy.\nPREMIUM: The consideration payable for this insurance.\nCLAIM: A demand for indemnity under this policy.\nLOSS: Diminution, destruction or deprivation of the insured subject-matter.\nBROKER: The insurance intermediary named in the Schedule.\nPERIOD OF INSURANCE: The duration specified in the Schedule during which cover applies.\nWAR: War, civil war, revolution, rebellion, insurrection, or civil strife arising therefrom, or any hostile act.\nNOTICE: Written communication delivered in accordance with the notice provisions of this insurance.',
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'POLICY', 'VESSEL', 'SCHEDULE', 'PREMIUM', 'CLAIM', 'LOSS', 'BROKER', 'PERIOD OF INSURANCE', 'WAR', 'NOTICE'],
      },
    ],
  },
  {
    id: 'm12-term-sec-2',
    number: '2',
    title: 'Voluntary Termination',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-2-1',
        number: '2.1',
        title: 'Termination by Assured',
        type: 'clause',
        content: 'The ASSURED may terminate this insurance at any time by giving not less than NOTICE_DAYS days\' written NOTICE to the UNDERWRITERS. Such notice shall specify the requested date of termination and shall be irrevocable once delivered.',
        variables: [{ name: 'NOTICE_DAYS', value: '30' }],
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'NOTICE'],
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'm12-term-sec-2-2',
        number: '2.2',
        title: 'Termination by Underwriters',
        type: 'clause',
        content: 'The UNDERWRITERS may terminate this insurance by giving not less than NOTICE_DAYS days\' written NOTICE to the ASSURED, provided that:\n\n(a) such termination shall not affect any CLAIM arising from an event occurring prior to the effective date of termination;\n(b) the UNDERWRITERS shall provide written reasons for the termination upon request by the ASSURED or the BROKER; and\n(c) where the ASSURED has paid premium in advance, a pro-rata return of premium shall be made for the unexpired PERIOD OF INSURANCE.',
        variables: [{ name: 'NOTICE_DAYS', value: '30' }],
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'NOTICE', 'CLAIM', 'BROKER', 'PERIOD OF INSURANCE'],
        variations: ['A', 'B', 'C'],
      },
    ],
  },
  {
    id: 'm12-term-sec-3',
    number: '3',
    title: 'Automatic Suspension',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-3-1',
        number: '3.1',
        title: 'Triggering Events',
        type: 'clause',
        content: 'This insurance shall automatically suspend upon any of the following events:\n\n(a) Change of the Classification Society of the VESSEL_NAME.\n(b) Change of ownership or flag of the VESSEL_NAME.\n(c) Requisition for title or use by any government authority.\n(d) Upon POLICY_EXPIRY whichever occurs first.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'POLICY_EXPIRY', value: '31 March 2027' },
        ],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-3-2',
        number: '3.2',
        title: 'Effect of Suspension',
        type: 'clause',
        content: 'During any period of suspension:\n\n(a) the UNDERWRITERS shall not be liable for any LOSS or CLAIM arising from events occurring during the suspension period;\n(b) the obligation to pay PREMIUM shall continue to accrue unless the UNDERWRITERS agree otherwise in writing;\n(c) the ASSURED shall continue to comply with all reporting and notification obligations under this POLICY.',
        definedTerms: ['UNDERWRITERS', 'LOSS', 'CLAIM', 'PREMIUM', 'ASSURED', 'POLICY'],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-3-3',
        number: '3.3',
        title: 'Notification of Suspension',
        type: 'clause',
        content: 'The ASSURED shall notify the UNDERWRITERS and the BROKER promptly upon becoming aware of any Suspension Event. Failure to provide prompt notification shall not affect the automatic operation of the suspension but may give rise to a CLAIM by the UNDERWRITERS for any loss suffered as a result of late notification.',
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'BROKER', 'CLAIM'],
      },
    ],
  },
  {
    id: 'm12-term-sec-4',
    number: '4',
    title: 'Reinstatement',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-4-1',
        number: '4.1',
        title: 'Conditions for Reinstatement',
        type: 'clause',
        content: 'This insurance may be reinstated upon the occurrence of any of the following events:\n\n(a) Restoration of the Classification Society of the VESSEL_NAME to a member of the International Association of Classification Societies (IACS).\n(b) Restoration of ownership or flag of the VESSEL_NAME to the original insured party.\n(c) Release from requisition for title or use by any government authority.\n(d) Upon request by the ASSURED within NOTICE_DAYS days of the suspension.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'NOTICE_DAYS', value: '30' },
        ],
        definedTerms: ['ASSURED'],
      },
      {
        id: 'm12-term-sec-4-2',
        number: '4.2',
        title: 'Reinstatement Premium',
        type: 'clause',
        content: 'Upon reinstatement, the UNDERWRITERS may require payment of an additional premium calculated at a rate of PREMIUM_RATE on the SUM_INSURED for the period of suspension, or such other amount as may be agreed between the parties.',
        variables: [
          { name: 'PREMIUM_RATE', value: '0.35%' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
        ],
        definedTerms: ['UNDERWRITERS'],
        optional: true,
        optionalCondition: 'GOV: territory = UK OR territory = EU',
      },
      {
        id: 'm12-term-sec-4-3',
        number: '4.3',
        title: 'Automatic Termination on Prolonged Suspension',
        type: 'clause',
        content: 'If any suspension continues for a period exceeding SUSPENSION_MAX_DAYS consecutive days without reinstatement, this insurance shall terminate automatically at the expiry of such period without further notice. Any return of premium shall be calculated on a pro-rata basis from the date of the original Suspension Event.',
        variables: [{ name: 'SUSPENSION_MAX_DAYS', value: '180' }],
      },
    ],
  },
  {
    id: 'm12-term-sec-5',
    number: '5',
    title: 'Effects of Termination',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-5-1',
        number: '5.1',
        title: 'Cessation of Cover',
        type: 'clause',
        content: 'Upon termination of this insurance, whether by notice or by operation of this Module:\n\n(a) cover shall cease with effect from the date of termination;\n(b) no CLAIM shall be recoverable in respect of any LOSS arising from events occurring after the date of termination;\n(c) all existing CLAIMS notified prior to the date of termination shall continue to be handled in accordance with the POLICY terms.',
        definedTerms: ['CLAIM', 'LOSS', 'POLICY'],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-5-2',
        number: '5.2',
        title: 'Return of Premium',
        type: 'clause',
        content: 'Where this insurance is terminated prior to POLICY_EXPIRY, the UNDERWRITERS shall return to the ASSURED a pro-rata proportion of the PREMIUM for the unexpired PERIOD OF INSURANCE, less any deductions for:\n\n(a) claims paid or reserves established;\n(b) brokerage and commissions due to the BROKER; and\n(c) any minimum and deposit premium as specified in the Schedule.',
        variables: [{ name: 'POLICY_EXPIRY', value: '31 March 2027' }],
        definedTerms: ['UNDERWRITERS', 'ASSURED', 'PREMIUM', 'PERIOD OF INSURANCE', 'BROKER'],
        references: [
          { term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.' }
        ],
      },
      {
        id: 'm12-term-sec-5-3',
        number: '5.3',
        title: 'Surviving Obligations',
        type: 'clause',
        content: 'Termination shall not affect:\n\n(a) any rights or obligations which have accrued prior to the date of termination;\n(b) the obligations of the ASSURED under Section 5.2 (Return of Premium) and Section 11 (Dispute Resolution);\n(c) any indemnity or hold harmless provision which by its nature is intended to survive termination.',
        definedTerms: ['ASSURED'],
        optional: true,
        optionalCondition: 'GOV: territory = UK',
      },
    ],
  },
  {
    id: 'm12-term-sec-6',
    number: '6',
    title: 'Non-Renewal',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-6-1',
        number: '6.1',
        title: 'Non-Renewal Notice',
        type: 'clause',
        content: 'Either party may elect not to renew this insurance at the expiry of the current PERIOD OF INSURANCE by giving not less than NOTICE_DAYS days\' written NOTICE to the other party prior to POLICY_EXPIRY.',
        variables: [
          { name: 'NOTICE_DAYS', value: '90' },
          { name: 'POLICY_EXPIRY', value: '31 March 2027' },
        ],
        definedTerms: ['PERIOD OF INSURANCE', 'NOTICE'],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-6-2',
        number: '6.2',
        title: 'Deemed Renewal',
        type: 'clause',
        content: 'In the absence of a valid notice of non-renewal served in accordance with clause 6.1, this insurance shall be deemed to renew on the same terms and conditions for a further period of 12 months, subject to any adjustment of PREMIUM_RATE and SUM_INSURED as may be agreed between the parties.',
        variables: [
          { name: 'PREMIUM_RATE', value: '0.35%' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
        ],
        optional: true,
        optionalCondition: 'GOV: auto_renewal = true',
      },
      {
        id: 'm12-term-sec-6-3',
        number: '6.3',
        title: 'Run-Off Period',
        type: 'clause',
        content: 'Following non-renewal, CLAIMS arising from events occurring during the PERIOD OF INSURANCE may be notified to the UNDERWRITERS for a further period of RUN_OFF_MONTHS months from POLICY_EXPIRY (the "Run-Off Period"). The UNDERWRITERS shall handle such CLAIMS in accordance with the terms of the expired POLICY.',
        variables: [
          { name: 'RUN_OFF_MONTHS', value: '24' },
          { name: 'POLICY_EXPIRY', value: '31 March 2027' },
        ],
        definedTerms: ['CLAIM', 'PERIOD OF INSURANCE', 'UNDERWRITERS', 'POLICY'],
        variations: ['A', 'B'],
      },
    ],
  },
  {
    id: 'm12-term-sec-7',
    number: '7',
    title: 'Regulatory Termination',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-7-1',
        number: '7.1',
        title: 'Regulatory Direction',
        type: 'clause',
        content: 'The UNDERWRITERS shall be entitled to terminate this insurance immediately upon receipt of a direction or order from a Competent Authority requiring or necessitating such termination, provided that the UNDERWRITERS shall:\n\n(a) give written NOTICE to the ASSURED as soon as reasonably practicable;\n(b) provide the ASSURED with a copy of the direction or order (to the extent not prohibited by law); and\n(c) co-operate with the ASSURED in any orderly wind-down of the insurance arrangement.',
        definedTerms: ['UNDERWRITERS', 'NOTICE', 'ASSURED'],
        references: [
          { term: 'Competent Authority', definition: 'The regulatory authority having jurisdiction, e.g. PRA, FCA or EIOPA.' }
        ],
      },
      {
        id: 'm12-term-sec-7-2',
        number: '7.2',
        title: 'Sanctions Compliance',
        type: 'clause',
        content: 'Notwithstanding any other provision of this POLICY, the UNDERWRITERS shall not provide cover, pay any CLAIM or provide any benefit under this insurance to the extent that doing so would expose the UNDERWRITERS to any sanction, prohibition or restriction under United Nations resolutions, or the trade or economic sanctions laws or regulations of the European Union, United Kingdom or United States of America.',
        definedTerms: ['POLICY', 'UNDERWRITERS', 'CLAIM'],
        variations: ['A', 'B'],
      },
    ],
  },
  {
    id: 'm12-term-sec-8',
    number: '8',
    title: 'Change of Control',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-8-1',
        number: '8.1',
        title: 'Notification of Change of Control',
        type: 'clause',
        content: 'The ASSURED shall give written NOTICE to the UNDERWRITERS within NOTICE_DAYS days of any Material Change occurring in respect of the VESSEL_NAME or the ASSURED, including but not limited to:\n\n(a) a change in the beneficial ownership of 50% or more of the shares or voting rights in the ASSURED;\n(b) a change in the management company or technical manager of the VESSEL_NAME;\n(c) a change of flag state or port of registry;\n(d) a change of CLASSIFICATION_SOCIETY.',
        variables: [
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
          { name: 'NOTICE_DAYS', value: '14' },
          { name: 'CLASSIFICATION_SOCIETY', value: 'Lloyd\'s Register' },
        ],
        definedTerms: ['ASSURED', 'NOTICE', 'UNDERWRITERS'],
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'm12-term-sec-8-2',
        number: '8.2',
        title: 'Underwriters\' Options',
        type: 'clause',
        content: 'Upon receipt of a notification under clause 8.1, the UNDERWRITERS may, within 30 days:\n\n(a) confirm continuation of cover on existing terms;\n(b) propose amended terms and/or additional premium, subject to acceptance by the ASSURED; or\n(c) terminate this insurance by giving not less than 14 days\' written NOTICE to the ASSURED.\n\nIf the UNDERWRITERS fail to respond within the 30-day period, cover shall continue on existing terms.',
        definedTerms: ['UNDERWRITERS', 'ASSURED', 'NOTICE'],
        variations: ['A', 'B'],
      },
    ],
  },
  {
    id: 'm12-term-sec-9',
    number: '9',
    title: 'Force Majeure',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-9-1',
        number: '9.1',
        title: 'Force Majeure Events',
        type: 'clause',
        content: 'Neither party shall be in breach of this insurance or liable for any failure or delay in performing its obligations if such failure or delay results from a Force Majeure Event. A "Force Majeure Event" means any event beyond the reasonable control of the affected party, including but not limited to:\n\n(a) acts of God, flood, earthquake, volcanic eruption, storm or other natural disaster;\n(b) epidemic, pandemic or quarantine restrictions;\n(c) war, armed conflict, terrorism, riot or civil commotion;\n(d) government sanctions, embargo, blockade or other state action;\n(e) failure of telecommunications, power supply or other essential infrastructure.',
        variations: ['A', 'B', 'C'],
      },
      {
        id: 'm12-term-sec-9-2',
        number: '9.2',
        title: 'Mitigation & Notification',
        type: 'clause',
        content: 'The party affected by a Force Majeure Event shall:\n\n(a) give written NOTICE to the other party as soon as reasonably practicable, specifying the nature and expected duration of the event;\n(b) use all reasonable endeavours to mitigate the effect of the Force Majeure Event on its obligations under this insurance; and\n(c) resume performance of its obligations as soon as reasonably practicable after the Force Majeure Event ceases.',
        definedTerms: ['NOTICE'],
      },
      {
        id: 'm12-term-sec-9-3',
        number: '9.3',
        title: 'Prolonged Force Majeure',
        type: 'clause',
        content: 'If a Force Majeure Event persists for a continuous period exceeding FORCE_MAJEURE_DAYS days, either party may terminate this insurance by giving 14 days\' written NOTICE to the other party. The provisions of Section 5 (Effects of Termination) shall apply to any such termination.',
        variables: [{ name: 'FORCE_MAJEURE_DAYS', value: '90' }],
        definedTerms: ['NOTICE'],
        optional: true,
        optionalCondition: 'GOV: territory = UK OR territory = EU',
      },
    ],
  },
  {
    id: 'm12-term-sec-10',
    number: '10',
    title: 'Premium Adjustment',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-10-1',
        number: '10.1',
        title: 'Adjustment Events',
        type: 'clause',
        content: 'The PREMIUM payable under this insurance shall be subject to adjustment upon the occurrence of any of the following:\n\n(a) a change in the SUM_INSURED or DEDUCTIBLE_AMOUNT;\n(b) a change in the TRADING_AREA or operational profile of the VESSEL_NAME;\n(c) reinstatement of cover following a suspension under Section 3;\n(d) any amendment, endorsement or variation to the terms of this insurance.',
        variables: [
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
          { name: 'DEDUCTIBLE_AMOUNT', value: 'USD 50,000' },
          { name: 'TRADING_AREA', value: 'IWL' },
          { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
        ],
        definedTerms: ['PREMIUM'],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-10-2',
        number: '10.2',
        title: 'Calculation Method',
        type: 'clause',
        content: 'Any premium adjustment shall be calculated at a rate of PREMIUM_RATE on the adjusted SUM_INSURED, applied pro-rata for the remaining PERIOD OF INSURANCE. The UNDERWRITERS shall provide the ASSURED with a written calculation of any adjustment within 30 days of the adjustment event.',
        variables: [
          { name: 'PREMIUM_RATE', value: '0.35%' },
          { name: 'SUM_INSURED', value: 'USD 15,000,000' },
        ],
        definedTerms: ['UNDERWRITERS', 'ASSURED', 'PERIOD OF INSURANCE'],
      },
      {
        id: 'm12-term-sec-10-3',
        number: '10.3',
        title: 'Minimum Premium',
        type: 'clause',
        content: 'Notwithstanding any adjustment under this Section, the total PREMIUM payable in respect of any PERIOD OF INSURANCE shall not be less than the minimum and deposit premium specified in the Schedule.',
        definedTerms: ['PREMIUM', 'PERIOD OF INSURANCE'],
        optional: true,
        optionalCondition: 'GOV: minimum_deposit_premium = true',
        references: [
          { term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.' }
        ],
      },
    ],
  },
  {
    id: 'm12-term-sec-11',
    number: '11',
    title: 'Dispute Resolution',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-11-1',
        number: '11.1',
        title: 'Arbitration',
        type: 'clause',
        content: 'Any dispute arising under or in connection with this Module or any termination, suspension or reinstatement hereunder shall be referred to arbitration in London in accordance with the Arbitration Act 1996 or any statutory modification or re-enactment thereof. Each party shall appoint one arbitrator and the two so appointed shall appoint a third. The arbitral tribunal shall have the power to award costs and interest.',
        definedTerms: ['POLICY'],
        references: [
          { term: 'Arbitration Act 1996', definition: 'The UK statute governing the law of arbitration.' }
        ],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-11-2',
        number: '11.2',
        title: 'Governing Law',
        type: 'clause',
        content: 'This Module and any dispute or CLAIM arising out of or in connection with it shall be governed by and construed in accordance with English law. The courts of England and Wales shall have non-exclusive jurisdiction in respect of any dispute not referred to arbitration.',
        definedTerms: ['CLAIM'],
      },
      {
        id: 'm12-term-sec-11-3',
        number: '11.3',
        title: 'Mediation',
        type: 'clause',
        content: 'Prior to the commencement of any arbitration proceedings under clause 11.1, the parties shall endeavour in good faith to resolve any dispute through mediation conducted in accordance with the CEDR Model Mediation Procedure. Neither party shall commence arbitration until MEDIATION_DAYS days have elapsed from the date of a written request for mediation.',
        variables: [{ name: 'MEDIATION_DAYS', value: '28' }],
        optional: true,
        optionalCondition: 'GOV: mediation_required = true',
        references: [
          { term: 'CEDR', definition: 'Centre for Effective Dispute Resolution \u2014 UK-based mediation body.' }
        ],
      },
    ],
  },
  {
    id: 'm12-term-sec-12',
    number: '12',
    title: 'Transitional Provisions',
    type: 'section',
    children: [
      {
        id: 'm12-term-sec-12-1',
        number: '12.1',
        title: 'Pending Claims',
        type: 'clause',
        content: 'All CLAIMS notified to the UNDERWRITERS prior to the effective date of termination or during any applicable Run-Off Period shall continue to be handled, adjusted and (if payable) settled by the UNDERWRITERS in accordance with the terms of this POLICY as if the insurance had not been terminated.',
        definedTerms: ['CLAIM', 'UNDERWRITERS', 'POLICY'],
        variations: ['A', 'B'],
      },
      {
        id: 'm12-term-sec-12-2',
        number: '12.2',
        title: 'Co-operation',
        type: 'clause',
        content: 'Following termination, the ASSURED shall continue to:\n\n(a) provide to the UNDERWRITERS all information and assistance reasonably required for the handling of pending CLAIMS;\n(b) preserve and make available all documents and records relevant to any CLAIM;\n(c) co-operate fully with the UNDERWRITERS, their agents and any appointed loss adjusters or surveyors.',
        definedTerms: ['ASSURED', 'UNDERWRITERS', 'CLAIM'],
      },
      {
        id: 'm12-term-sec-12-3',
        number: '12.3',
        title: 'Portfolio Transfer',
        type: 'clause',
        content: 'The UNDERWRITERS may, with the prior written consent of the ASSURED (such consent not to be unreasonably withheld), transfer or novate any obligations under this Module to a successor insurer, provided that the successor insurer is authorised by the Competent Authority to carry on the relevant class of insurance business.',
        definedTerms: ['UNDERWRITERS', 'ASSURED'],
        optional: true,
        optionalCondition: 'GOV: territory = UK',
        references: [
          { term: 'Competent Authority', definition: 'The regulatory authority having jurisdiction, e.g. PRA, FCA or EIOPA.' }
        ],
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Section lookup by item ID (for item-specific canvas content)       */
/* ------------------------------------------------------------------ */

export const sectionsByItemId: Record<string, ContractSection[]> = {
  'ctr-m12': m12ContractSections,
  'ctr-m12-term': m12TermContractSections,
};

export interface DataElement {
  id: string;
  name: string;
  dataType: 'String' | 'Currency' | 'Date' | 'Number' | 'Reference';
  govType: 'BOOLEAN' | 'SINGLE_SELECT' | 'MULTI_SELECT' | 'INTEGER' | 'DECIMAL' | 'PERCENTAGE' | 'DATE' | 'DATE_RANGE' | 'DURATION' | 'CURRENCY_AMOUNT' | 'FREE_TEXT' | 'TABLE';
  description: string;
  required: boolean;
}

export const dataElements: DataElement[] = [
  { id: 'de-01', name: 'VESSEL_NAME', dataType: 'String', govType: 'FREE_TEXT', description: 'Name of the insured vessel', required: true },
  { id: 'de-02', name: 'SUM_INSURED', dataType: 'Currency', govType: 'CURRENCY_AMOUNT', description: 'Total insured value', required: true },
  { id: 'de-03', name: 'DEDUCTIBLE_AMOUNT', dataType: 'Currency', govType: 'CURRENCY_AMOUNT', description: 'Deductible per claim', required: true },
  { id: 'de-04', name: 'TRADING_AREA', dataType: 'String', govType: 'SINGLE_SELECT', description: 'Institute Warranty Limits zone code', required: true },
  { id: 'de-05', name: 'CLASSIFICATION_SOCIETY', dataType: 'String', govType: 'MULTI_SELECT', description: 'IACS classification society', required: false },
  { id: 'de-06', name: 'POLICY_INCEPTION', dataType: 'Date', govType: 'DATE', description: 'Policy start date', required: true },
  { id: 'de-07', name: 'POLICY_EXPIRY', dataType: 'Date', govType: 'DATE_RANGE', description: 'Policy end date', required: true },
  { id: 'de-08', name: 'PREMIUM_RATE', dataType: 'Number', govType: 'PERCENTAGE', description: 'Premium rate as percentage', required: true },
  { id: 'de-09', name: 'NOTICE_DAYS', dataType: 'Number', govType: 'INTEGER', description: 'Number of days for notice period', required: true },
  { id: 'de-10', name: 'LIMIT_AMOUNT', dataType: 'Currency', govType: 'DECIMAL', description: 'Maximum limit of liability per section', required: false },
];

export interface ReferenceDefinition {
  id: string;
  term: string;
  definition: string;
  source: string;
}

export const referenceDefinitions: ReferenceDefinition[] = [
  { id: 'ref-01', term: 'ASSURED', definition: 'The person(s) or entity named in the Schedule as the party insured under this policy.', source: 'MIA 1906' },
  { id: 'ref-02', term: 'UNDERWRITERS', definition: 'The insurer(s) subscribing to this policy as listed in the Schedule.', source: 'MIA 1906' },
  { id: 'ref-03', term: 'POLICY', definition: 'This contract of marine insurance including the Schedule, clauses and endorsements.', source: 'LMA' },
  { id: 'ref-04', term: 'Institute Warranty Limits', definition: 'Geographical trading limits as defined by the Institute of London Underwriters.', source: 'ILU' },
  { id: 'ref-05', term: 'Schedule', definition: 'The schedule of particulars attached to and forming part of this policy.', source: 'LMA' },
  { id: 'ref-06', term: 'Communication', definition: 'Any written notice, instruction or communication issued between the Coverholder and the Lead Insurer under the terms of the Agreement, as specified in the applicable Communication provisions.', source: 'C12.9' },
  { id: 'ref-07', term: 'notice period', definition: 'The minimum advance notice period required for non-renewal of the Agreement, as specified in clause 12.34 (not less than 60 business days prior to expiry, or such longer period required by law).', source: 'C12.9' },
  { id: 'ref-08', term: 'Module 4 – Operational Responsibilities', definition: 'The module governing pre-renewal submission timelines, operational responsibilities of the Coverholder and Lead Insurer, and related administrative procedures under the Coverholder Agreement.', source: 'M4' },
];

export interface DefinedTermEntry {
  id: string;
  term: string;
  description: string;
}

export const definedTermEntries: DefinedTermEntry[] = [
  { id: 'dt-01', term: 'ASSURED', description: 'The named insured party under this policy.' },
  { id: 'dt-02', term: 'UNDERWRITERS', description: 'The insurer(s) subscribing to this policy.' },
  { id: 'dt-03', term: 'POLICY', description: 'This contract of insurance including Schedule and clauses.' },
  { id: 'dt-04', term: 'VESSEL', description: 'The ship or watercraft identified in the Schedule.' },
  { id: 'dt-05', term: 'SCHEDULE', description: 'The schedule of particulars attached to and forming part of this policy.' },
  { id: 'dt-06', term: 'PREMIUM', description: 'The consideration payable for this insurance.' },
  { id: 'dt-07', term: 'CLAIM', description: 'A demand for indemnity under this policy.' },
  { id: 'dt-08', term: 'LOSS', description: 'Diminution, destruction or deprivation of the insured subject-matter.' },
  { id: 'dt-09', term: 'BROKER', description: 'The insurance intermediary named in the Schedule.' },
  { id: 'dt-10', term: 'PERIOD OF INSURANCE', description: 'The duration specified in the Schedule during which cover applies.' },
  { id: 'dt-11', term: 'WAR', description: 'War, civil war, revolution, rebellion, insurrection, or civil strife arising therefrom, or any hostile act.' },
  { id: 'dt-12', term: 'NOTICE', description: 'Written communication delivered in accordance with the notice provisions of this insurance.' },
];

export interface EmbeddedVariableEntry {
  id: string;
  label: string;
  refMark: string;
  description: string;
  code: string;
}

export const embeddedVariableEntries: EmbeddedVariableEntry[] = [
  { id: 'emb-01', label: 'Termination Rights', refMark: 'i', description: 'Variable clause for termination, suspension, or non-renewal rights.', code: 'IF policy.type == "renewable" THEN\n  INCLUDE "terminate, automatically suspend or non-renew"\nELSE\n  INCLUDE "terminate"' },
  { id: 'emb-02', label: 'Regulatory Authority', refMark: 'ii', description: 'Competent regulatory authority based on jurisdiction.', code: 'IF jurisdiction == "UK" THEN\n  INCLUDE "Prudential Regulation Authority"\nELSE IF jurisdiction == "EU" THEN\n  INCLUDE "EIOPA"\nELSE\n  INCLUDE "relevant regulatory authority"' },
  { id: 'emb-03', label: 'Coverage Trigger', refMark: 'iii', description: 'Occurrence or claims-made trigger based on policy configuration.', code: 'IF trigger_basis == "occurrence" THEN\n  INCLUDE "occurring during the period of insurance"\nELSE\n  INCLUDE "first made against the Assured during the period"' },
  { id: 'emb-04', label: 'Limit of Liability', refMark: 'iv', description: 'Dynamic liability limit phrasing based on policy structure.', code: 'IF aggregate_limit == true THEN\n  INCLUDE "in the aggregate for all claims"\nELSE\n  INCLUDE "any one occurrence"' },
  { id: 'emb-05', label: '60', refMark: 'xlvi', description: 'Configurable number of days (default: 60).', code: 'RETURN notice_period_days ?? 60' },
  { id: 'emb-06', label: 'business days', refMark: 'xlvii', description: 'Unit of time for notice and extension periods (default: business days).', code: 'RETURN notice_period_unit ?? "business days"' },
  { id: 'emb-07', label: 'automatic renewal or extension', refMark: 'l', description: 'Renewal or extension outcome under clause 12.38.', code: 'IF policy.renewal_type == "extension_only" THEN\n  INCLUDE "automatic extension"\nELSE\n  INCLUDE "automatic renewal or extension"' },
];

export interface GoverningRule {
  id: string;
  field: string;
  operator: string;
  value: string;
  action: string;
}

export const governingRules: GoverningRule[] = [
  { id: 'rule-01', field: 'SUM_INSURED', operator: 'greater_than', value: '10000000', action: 'Require additional survey report' },
  { id: 'rule-02', field: 'TRADING_AREA', operator: 'equals', value: 'EXCL_ZONE', action: 'Apply War Risk premium surcharge' },
  { id: 'rule-03', field: 'CLASSIFICATION_SOCIETY', operator: 'not_equals', value: '', action: 'Flag for manual review if non-IACS' },
];

export interface ApprovalChange {
  type: 'text' | 'metadata' | 'variable' | 'rule';
  field: string;
  oldValue: string;
  newValue: string;
}

export interface AffectedItem {
  name: string;
  type: ItemType;
  changes: ApprovalChange[];
}

export interface ApprovalItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  version: string;
  previousVersion: string;
  submittedBy: string;
  submittedDate: string;
  classOfBusiness: string;
  imOk: boolean;
  usedIn: string[];
  changes: ApprovalChange[];
  renderedContent: string;
  renderedVariables?: { name: string; value: string }[];
  renderedDefinedTerms?: string[];
  affectedItems?: AffectedItem[];
}

export const approvalQueue: ApprovalItem[] = [
  {
    id: 'appr-001',
    name: 'Institute Time Clauses – Hulls',
    type: 'Component',
    description: 'Updated perils wording and indemnity variable to align with 2026 standards. Bundled publish across 2 locations.',
    version: '5.2.0',
    previousVersion: '5.1.0',
    submittedBy: 'R. Pyke',
    submittedDate: '2026-03-12',
    classOfBusiness: 'Marine Hull',
    imOk: true,
    usedIn: ['LMA5400 Marine Hull Policy', 'Marine Perils Group'],
    changes: [
      { type: 'text', field: '1.1 Perils Clause', oldValue: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion.', newValue: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion; volcanic eruption or lightning; malicious acts by third parties.' },
      { type: 'variable', field: 'SUM_INSURED default', oldValue: 'USD 15,000,000', newValue: 'USD 20,000,000' },
      { type: 'metadata', field: 'Effective Date', oldValue: '2026-01-01', newValue: '2026-04-01' },
    ],
    renderedContent: 'This insurance covers loss of or damage to the subject-matter insured caused by: perils of the seas rivers lakes or other navigable waters; fire, explosion; volcanic eruption or lightning; malicious acts by third parties; violent theft by persons from outside the VESSEL_NAME; jettison; piracy; contact with land conveyance, dock or harbour equipment or installation.\\\\\\\\n\\\\\\\\nThe UNDERWRITERS agree to indemnify the ASSURED for the insured value of SUM_INSURED subject to the terms and conditions set forth herein.',
    renderedVariables: [
      { name: 'VESSEL_NAME', value: 'MV Ocean Voyager' },
      { name: 'SUM_INSURED', value: 'USD 20,000,000' },
    ],
    renderedDefinedTerms: ['UNDERWRITERS', 'ASSURED'],
    affectedItems: [
      {
        name: 'LMA5400 Marine Hull Policy',
        type: 'Contract',
        changes: [
          { type: 'text', field: '2.1 Standard Perils (inherits from ITC Hulls)', oldValue: 'Perils of the seas rivers lakes or other navigable waters; fire, explosion.', newValue: 'Perils of the seas rivers lakes or other navigable waters; fire, explosion; volcanic eruption or lightning; malicious acts by third parties.' },
          { type: 'variable', field: 'SUM_INSURED in Scope of Cover (\u00a71.2)', oldValue: 'USD 15,000,000', newValue: 'USD 20,000,000' },
          { type: 'variable', field: 'SUM_INSURED in Premium Calculation (\u00a79.1)', oldValue: 'USD 15,000,000', newValue: 'USD 20,000,000' },
        ],
      },
      {
        name: 'Marine Perils Group',
        type: 'Component-Group',
        changes: [
          { type: 'text', field: '1.1 Perils of the Seas (inherits from ITC Hulls)', oldValue: 'Perils of the seas, rivers, lakes or other navigable waters; fire, explosion.', newValue: 'Perils of the seas, rivers, lakes or other navigable waters; fire, explosion; volcanic eruption or lightning; malicious acts by third parties.' },
          { type: 'metadata', field: 'Component Version Reference', oldValue: 'ITC Hulls v5.1.0', newValue: 'ITC Hulls v5.2.0' },
        ],
      },
    ],
  },
  {
    id: 'appr-002',
    name: 'Navigation Limits Clause',
    type: 'Component',
    description: 'Extended navigation limits to include Arctic passages.',
    version: '2.0.0',
    previousVersion: '1.5.0',
    submittedBy: 'C. Wise',
    submittedDate: '2026-03-04',
    classOfBusiness: 'Marine Hull',
    imOk: true,
    usedIn: ['LMA5400 Marine Hull Policy'],
    changes: [
      { type: 'text', field: 'Navigation Clause Body', oldValue: 'The vessel is covered within the trading area as defined by the Institute Warranty Limits.', newValue: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits, including transits through designated Arctic passages subject to ice class certification.' },
      { type: 'rule', field: 'Arctic Transit Rule', oldValue: '\u2014', newValue: 'When TRADING_AREA includes Arctic passages, require Ice Class certification' },
    ],
    renderedContent: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits. Breach of the navigation limits shall not void this insurance provided notice is given to the UNDERWRITERS within 10 days.\\\\n\\\\nTransits through designated Arctic passages are permitted subject to the vessel holding valid Ice Class certification from a recognised CLASSIFICATION_SOCIETY.',
    renderedVariables: [
      { name: 'TRADING_AREA', value: 'IWL + Arctic' },
      { name: 'CLASSIFICATION_SOCIETY', value: 'Lloyd\'s Register' },
    ],
    renderedDefinedTerms: ['UNDERWRITERS'],
    affectedItems: [
      {
        name: 'LMA5400 Marine Hull Policy',
        type: 'Contract',
        changes: [
          { type: 'text', field: 'Navigation Clause Body', oldValue: 'The vessel is covered within the trading area as defined by the Institute Warranty Limits.', newValue: 'The vessel is covered within the TRADING_AREA as defined by the Institute Warranty Limits, including transits through designated Arctic passages subject to ice class certification.' },
          { type: 'rule', field: 'Arctic Transit Rule', oldValue: '\u2014', newValue: 'When TRADING_AREA includes Arctic passages, require Ice Class certification' },
        ],
      },
    ],
  },
  {
    id: 'appr-003',
    name: 'Deductible Clause (Cargo)',
    type: 'Component',
    description: 'New deductible provisions for cargo policies with variable thresholds.',
    version: '1.3.0',
    previousVersion: '1.2.0',
    submittedBy: 'R. Pyke',
    submittedDate: '2026-03-09',
    classOfBusiness: 'Marine Cargo',
    imOk: true,
    usedIn: [],
    changes: [
      { type: 'text', field: 'Deductible Provision', oldValue: 'A deductible of the stated amount shall apply to each and every claim.', newValue: 'A deductible of DEDUCTIBLE_AMOUNT shall apply to each and every claim. Where the claim exceeds SUM_INSURED, the deductible shall be waived.' },
      { type: 'variable', field: 'DEDUCTIBLE_AMOUNT', oldValue: 'Fixed: USD 25,000', newValue: 'Variable: {{DEDUCTIBLE_AMOUNT}} with configurable threshold' },
    ],
    renderedContent: 'A deductible of DEDUCTIBLE_AMOUNT shall apply to each and every claim arising under this insurance. Where the claim amount exceeds SUM_INSURED, the deductible shall be waived in full.\\\\n\\\\nThe ASSURED shall bear the DEDUCTIBLE_AMOUNT in respect of each occurrence. Multiple claims arising from a single event shall be treated as one occurrence for deductible purposes.',
    renderedVariables: [
      { name: 'DEDUCTIBLE_AMOUNT', value: 'USD 25,000' },
      { name: 'SUM_INSURED', value: 'USD 5,000,000' },
    ],
    renderedDefinedTerms: ['ASSURED'],
  },
];

export type ApprovalDecision = 'approved' | 'rejected';

export interface ApprovalHistoryItem {
  id: string;
  name: string;
  type: ItemType;
  description: string;
  version: string;
  previousVersion: string;
  submittedBy: string;
  submittedDate: string;
  classOfBusiness: string;
  decision: ApprovalDecision;
  decidedBy: string;
  decidedDate: string;
  rationale?: string;
  changes: ApprovalChange[];
  usedIn: string[];
  affectedItems?: AffectedItem[];
}

export const approvalHistory: ApprovalHistoryItem[] = [
  {
    id: 'hist-001',
    name: 'War & Strikes Clause',
    type: 'Component',
    description: 'Revised strikes coverage wording for clarity.',
    version: '2.3.0',
    previousVersion: '2.2.0',
    submittedBy: 'C. Wise',
    submittedDate: '2026-02-20',
    classOfBusiness: 'Marine Hull',
    decision: 'approved',
    decidedBy: 'A. Lloyd',
    decidedDate: '2026-02-22',
    rationale: 'Approved. The revised wording is clearer and aligns with current market practice. No material change in coverage scope.',
    changes: [
      { type: 'text', field: 'Strikes Clause Body', oldValue: 'Coverage extends to strikes by workmen.', newValue: 'Coverage extends to strikers, locked-out workmen, or persons taking part in labour disturbances, riots or civil commotions.' },
    ],
    usedIn: ['LMA5400 Marine Hull Policy', 'Marine Perils Group'],
    affectedItems: [
      {
        name: 'LMA5400 Marine Hull Policy',
        type: 'Contract',
        changes: [
          { type: 'text', field: '10.2 Strikes Coverage', oldValue: 'Coverage extends to strikes by workmen.', newValue: 'Coverage extends to strikers, locked-out workmen, or persons taking part in labour disturbances, riots or civil commotions.' },
        ],
      },
    ],
  },
  {
    id: 'hist-002',
    name: 'Marine Perils Group',
    type: 'Component-Group',
    description: 'Added Cyber Exclusion clause to the group.',
    version: '3.5.0',
    previousVersion: '3.4.0',
    submittedBy: 'R. Pyke',
    submittedDate: '2026-01-15',
    classOfBusiness: 'Marine Hull',
    decision: 'approved',
    decidedBy: 'A. Lloyd',
    decidedDate: '2026-01-18',
    rationale: 'Approved. Cyber exclusion is consistent with LMA guidance and market-wide adoption.',
    changes: [
      { type: 'text', field: 'New Clause: Cyber Exclusion', oldValue: '(none)', newValue: 'In no case shall this group cover loss directly or indirectly caused by the use or operation of any computer system as a means of inflicting harm.' },
    ],
    usedIn: ['LMA5400 Marine Hull Policy'],
    affectedItems: [
      {
        name: 'LMA5400 Marine Hull Policy',
        type: 'Contract',
        changes: [
          { type: 'text', field: 'Exclusions — new Cyber Exclusion clause added', oldValue: '(none)', newValue: 'Cyber Exclusion clause added per Marine Perils Group v3.5.0' },
        ],
      },
    ],
  },
  {
    id: 'hist-003',
    name: 'Deductible Clause (Cargo)',
    type: 'Component',
    description: 'Attempted to lower minimum deductible below LMA threshold.',
    version: '1.2.0',
    previousVersion: '1.1.0',
    submittedBy: 'R. Pyke',
    submittedDate: '2026-01-05',
    classOfBusiness: 'Marine Cargo',
    decision: 'rejected',
    decidedBy: 'A. Lloyd',
    decidedDate: '2026-01-08',
    rationale: 'Rejected. The proposed minimum deductible of USD 5,000 is below the LMA recommended floor of USD 10,000 for cargo policies. Please revise to meet minimum threshold requirements.',
    changes: [
      { type: 'variable', field: 'DEDUCTIBLE_AMOUNT minimum', oldValue: 'USD 10,000', newValue: 'USD 5,000' },
    ],
    usedIn: [],
  },
];