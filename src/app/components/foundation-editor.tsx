import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, FileCheck, Save, Send, Loader2, Plus,
  AlignLeft, AlignCenter, AlignRight,
  ListOrdered, List, ChevronDown, Edit3,
} from 'lucide-react';
import { foundationTypeLabels, dynamicFoundationItems, foundationItems, riskCodes, cobOptions, jurisdictionOptions, type FoundationType } from './mock-data';
import { StatusBadge } from './type-badge';
import { ConditionCodeEditor } from './condition-code-editor';
import { toast } from 'sonner';

// GV-specific options
const GV_TYPE_OPTIONS = [
  { value: 'boolean', label: 'Boolean' },
  { value: 'integer', label: 'Integer' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'string', label: 'String' },
  { value: 'date', label: 'Date' },
  { value: 'duration', label: 'Duration' },
];

const GV_TYPESPECIFICA_OPTIONS: Record<string, { value: string; label: string }[]> = {
  boolean: [
    { value: 'condition', label: 'Condition Expression' },
    { value: 'selection', label: 'True / False Selection' },
  ],
  integer: [
    { value: 'direct', label: 'Direct Numeric Input' },
    { value: 'computed', label: 'Computed / Derived' },
    { value: 'lov', label: 'LOV-Bound' },
  ],
  decimal: [
    { value: 'direct', label: 'Direct Numeric Input' },
    { value: 'computed', label: 'Computed / Derived' },
    { value: 'lov', label: 'LOV-Bound' },
  ],
  string: [
    { value: 'freetext', label: 'Free Text' },
    { value: 'lov', label: 'LOV-Bound' },
    { value: 'conditional', label: 'Conditional Expression' },
  ],
  date: [
    { value: 'calendar', label: 'Calendar Date' },
    { value: 'relative', label: 'Relative Date' },
    { value: 'system', label: 'System Date' },
  ],
  duration: [
    { value: 'fixed', label: 'Fixed Period' },
    { value: 'computed', label: 'Computed Period' },
  ],
};



// DM-specific options
const DM_TYPE_OPTIONS = [
  { value: 'free-text', label: 'Free Text' },
  { value: 'single-select', label: 'Single-Select' },
  { value: 'multi-select', label: 'Multi-Select' },
];

const DM_APPLICABILITY_OPTIONS = [
  { value: 'contract', label: 'Contract' },
  { value: 'component-group', label: 'Component Group' },
  { value: 'component', label: 'Component' },
  { value: 'all', label: 'All Object Types' },
];

function RichTextFieldHeader() {
  return (
    <div className="flex items-center gap-0.5 border border-b-0 border-[#d1d5db] bg-[#FAFAFA] px-1.5 py-0.5 flex-wrap">
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280] font-bold text-[12px]" style={{ fontFamily: 'var(--font-family)' }}>B</button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280] italic text-[12px]" style={{ fontFamily: 'var(--font-family)' }}>I</button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280] underline text-[12px]" style={{ fontFamily: 'var(--font-family)' }}>U</button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280] line-through text-[12px]" style={{ fontFamily: 'var(--font-family)' }}>S</button>
      <div className="w-px h-3.5 bg-[#d1d5db] mx-0.5" />
      <button type="button" className="px-1.5 py-0.5 hover:bg-[#E8E8E8] text-[#6b7280] text-[11px] flex items-center gap-0.5" style={{ fontFamily: 'var(--font-family)' }}>
        <span>¶</span>&nbsp;Paragraph&nbsp;<ChevronDown size={9} />
      </button>
      <button type="button" className="px-1.5 py-0.5 hover:bg-[#E8E8E8] text-[#6b7280] text-[11px]" style={{ fontFamily: 'var(--font-family)' }}>H1</button>
      <button type="button" className="px-1.5 py-0.5 hover:bg-[#E8E8E8] text-[#6b7280] text-[11px]" style={{ fontFamily: 'var(--font-family)' }}>H2</button>
      <div className="w-px h-3.5 bg-[#d1d5db] mx-0.5" />
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280]" title="Align left"><AlignLeft size={12} /></button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280]" title="Align center"><AlignCenter size={12} /></button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280]" title="Align right"><AlignRight size={12} /></button>
      <div className="w-px h-3.5 bg-[#d1d5db] mx-0.5" />
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280]" title="Ordered list"><ListOrdered size={12} /></button>
      <button type="button" className="p-1 hover:bg-[#E8E8E8] text-[#6b7280]" title="Unordered list"><List size={12} /></button>
    </div>
  );
}

const BODY_LABELS: Record<FoundationType, string> = {
  DEF: 'Definition Text',
  VAR: 'Variable Expression',
  LOV: 'Values',
  ATT: 'Metadata Description',
  TEC: 'Technical Content',
  SYS: 'System Content',
};

const TITLE_PLACEHOLDERS: Record<FoundationType, string> = {
  DEF: 'e.g. Total Loss, Named Insured, Deductible...',
  VAR: 'e.g. Coverage Limit, Deductible Amount...',
  LOV: 'e.g. Permitted Vessel Types, Coverage Classes...',
  ATT: 'e.g. Risk Classification, Segment Attributes...',
  TEC: 'e.g. Drafting Guidelines, Clause Numbering Rules...',
  SYS: 'e.g. Workflow Instructions, Approval Process...',
};

const BODY_PLACEHOLDERS: Record<FoundationType, string> = {
  DEF: 'Enter the definition text. Describe the term clearly and concisely as it applies across contracts...',
  VAR: 'Enter the variable expression or formula. Use {{VARIABLE_NAME}} syntax to reference data elements...',
  LOV: 'Enter each permitted value on a new line, or as a comma-separated list...',
  ATT: 'Describe the metadata attributes and their meaning for this object type...',
  TEC: 'Enter technical guidance, drafting notes, or system-level instructions...',
  SYS: 'Enter operational guidance, process instructions, or workflow notes...',
};

export function FoundationEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('isNew') === 'true';
  const [isViewMode, setIsViewMode] = useState(searchParams.get('mode') === 'view');

  const existingItem =
    dynamicFoundationItems.find(i => i.id === id) ??
    foundationItems.find(i => i.id === id);
  const typeParam = searchParams.get('type') as FoundationType | null;
  const itemType: FoundationType = existingItem?.type ?? typeParam ?? 'DEF';
  const targetTab = itemType === 'ATT' ? 'metadata' : 'foundations';
  const typeLabel = foundationTypeLabels[itemType];
  const bodyLabel = BODY_LABELS[itemType];
  const titlePlaceholder = TITLE_PLACEHOLDERS[itemType];
  const bodyPlaceholder = BODY_PLACEHOLDERS[itemType];

  // For freshly-created items the name is the type label; treat that as empty title
  const initialTitle = existingItem && existingItem.name !== typeLabel ? existingItem.name : '';

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(existingItem?.body ?? existingItem?.summary ?? '');
  const [isDirty, setIsDirty] = useState(false);
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [itemStatus, setItemStatus] = useState<'DRAFT' | 'PENDING_APPROVAL'>(existingItem?.status as 'DRAFT' | 'PENDING_APPROVAL' ?? 'DRAFT');

  // GV-specific fields
  const [gvQuestion, setGvQuestion] = useState(existingItem?.question ?? '');
  const [gvType, setGvType] = useState(existingItem?.valueType ?? '');
  const [gvTypespecifica, setGvTypespecifica] = useState(existingItem?.listSource ?? '');
  const [gvWolExpression, setGvWolExpression] = useState(existingItem?.wolExpression ?? '');
  const [gvSysGuidanceMode, setGvSysGuidanceMode] = useState<'' | 'none' | 'embedded' | 'linked'>(existingItem?.systemGuidanceMode ?? '');
  const [gvSystemGuidance, setGvSystemGuidance] = useState(existingItem?.systemGuidance ?? '');

  // DM-specific fields
  const [dmType, setDmType] = useState(existingItem?.dmType ?? '');
  const [dmApplicability, setDmApplicability] = useState<string[]>(existingItem?.dmApplicability ?? []);
  const [showApplicabilityDropdown, setShowApplicabilityDropdown] = useState(false);
  const applicabilityBtnRef = useRef<HTMLButtonElement>(null);
  const applicabilityPanelRef = useRef<HTMLDivElement>(null);
  const [applicabilityDropdownPos, setApplicabilityDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [dmDescription, setDmDescription] = useState(existingItem?.body ?? '');
  const [dmWolExpression, setDmWolExpression] = useState(existingItem?.wolExpression ?? '');

  // DEF-specific fields
  const [defDefinedTerm, setDefDefinedTerm] = useState(existingItem?.definedTerm ?? '');
  const [defAliases, setDefAliases] = useState<string[]>(existingItem?.aliases ?? []);
  const [defAliasInput, setDefAliasInput] = useState('');
  const aliasInputRef = useRef<HTMLInputElement>(null);

  const handleAliasKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = defAliasInput.trim();
      if (val && !defAliases.includes(val)) {
        setDefAliases(prev => [...prev, val]);
        setIsDirty(true);
      }
      setDefAliasInput('');
    }
  };

  // Descriptive Metadata fields (from creation setup)
  const [dmRiskCodes, setDmRiskCodes] = useState<string[]>(existingItem?.riskCodes ?? []);
  const [dmCob, setDmCob] = useState(existingItem?.cob ?? existingItem?.segment ?? '');
  const [dmJurisdictions, setDmJurisdictions] = useState<string[]>(existingItem?.jurisdictions ?? []);
  const [dmWolNotes, setDmWolNotes] = useState(existingItem?.wolPublicationNotes ?? '');

  useEffect(() => {
    if (!showApplicabilityDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const insideBtn = applicabilityBtnRef.current?.contains(e.target as Node);
      const insidePanel = applicabilityPanelRef.current?.contains(e.target as Node);
      if (!insideBtn && !insidePanel) setShowApplicabilityDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showApplicabilityDropdown]);

  const toggleApplicability = (v: string) => {
    setDmApplicability(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    setIsDirty(true);
  };

  const displayTitle = title.trim() || (isNew ? `New ${typeLabel}` : typeLabel);

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setIsValidating(false);
      setIsValidated(true);
      toast.success('Validation passed');
    }, 800);
  };

  const buildFields = () => {
    const gvFields = itemType === 'VAR' ? {
      question: gvQuestion || undefined,
      valueType: gvType || undefined,
      listSource: gvTypespecifica || undefined,
      wolExpression: gvWolExpression || undefined,
      systemGuidanceMode: gvSysGuidanceMode || undefined,
      systemGuidance: gvSystemGuidance || undefined,
    } : {};
    const dmFields = itemType === 'ATT' ? {
      dmType: dmType || undefined,
      dmApplicability: dmApplicability.length > 0 ? dmApplicability : undefined,
      body: dmDescription || undefined,
      wolExpression: dmWolExpression || undefined,
    } : {};
    const bodyFields = (itemType === 'TEC' || itemType === 'SYS')
      ? { summary: body || undefined }
      : (itemType === 'LOV')
        ? { body: body || undefined }
        : itemType === 'DEF'
          ? {
              body: body || undefined,
              definedTerm: defDefinedTerm.trim() || undefined,
              aliases: defAliases.length > 0 ? defAliases : undefined,
            }
          : {};
    const descriptiveFields = {
      riskCodes: dmRiskCodes.length > 0 ? dmRiskCodes : undefined,
      cob: dmCob || undefined,
      jurisdictions: dmJurisdictions.length > 0 ? dmJurisdictions : undefined,
      wolPublicationNotes: dmWolNotes.trim() || undefined,
    };
    return { ...gvFields, ...dmFields, ...bodyFields, ...descriptiveFields };
  };

  const handleSave = () => {
    const today = new Date().toISOString().split('T')[0];
    if (existingItem) {
      existingItem.name = title.trim() || typeLabel;
      existingItem.status = 'DRAFT';
      Object.assign(existingItem, buildFields());
    } else {
      dynamicFoundationItems.push({
        id: `found-new-${Date.now()}`,
        name: title.trim() || typeLabel,
        type: itemType,
        status: 'DRAFT',
        version: '0.1.0',
        lastModified: today,
        owner: 'R. Pyke',
        usages: 0,
        ...buildFields(),
      });
    }
    setIsDirty(false);
    setItemStatus('DRAFT');
    toast.success(`${typeLabel} saved as Draft`);
  };

  const handleSubmit = () => {
    if (existingItem) {
      existingItem.status = 'PENDING_APPROVAL';
      existingItem.name = title.trim() || typeLabel;
    }
    setItemStatus('PENDING_APPROVAL');
    toast.success(`${typeLabel} submitted`, { description: 'Sent for approval.' });
    navigate(`/?tab=${targetTab}`);
  };

  const handleGoBack = () => navigate(`/?tab=${targetTab}`);

  const handleCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (existingItem) {
      existingItem.name = title.trim() || typeLabel;
      existingItem.status = 'PENDING_APPROVAL';
      Object.assign(existingItem, buildFields());
    } else {
      dynamicFoundationItems.push({
        id: `found-new-${Date.now()}`,
        name: title.trim() || typeLabel,
        type: itemType,
        status: 'PENDING_APPROVAL',
        version: '0.1.0',
        lastModified: today,
        owner: 'R. Pyke',
        usages: 0,
        ...buildFields(),
      });
    }
    toast.success(`${typeLabel} created`, { description: 'Submitted for approval.' });
    navigate(`/?tab=${targetTab}`);
  };

  const inputStyle =
    'w-full bg-white text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db] transition-colors focus:border-[#2563eb]';
  const inputViewStyle =
    'w-full bg-[#FAFAFA] text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db]';
  const activeInputStyle = isViewMode ? inputViewStyle : inputStyle;
  const labelStyle = 'text-[12px] text-[#6b7280] mb-1.5 block';

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return iso; }
  };

  const SysRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px' }}>{label}</span>
      <span className="text-[12px] text-[#1F1F1F] flex-1 truncate">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-[#d1d5db] bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={handleGoBack} className="p-1.5 hover:bg-[#F2F2F2]">
            <ArrowLeft size={16} className="text-[#6b7280]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>
              {displayTitle}
            </span>
            <StatusBadge status={itemStatus} />
            {isDirty && (
              <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">
                Unsaved
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isViewMode ? (
            <>
              <button
                onClick={() => setIsViewMode(false)}
                className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
                style={{ borderRadius: '0px' }}
              >
                <Edit3 size={13} /> Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
                style={{ borderRadius: '0px' }}
              >
                <Save size={13} /> Save
              </button>
              {!isNew && (
                <button
                  onClick={handleSubmit}
                  className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                >
                  <Send size={13} /> Submit
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex overflow-hidden bg-white">
        {/* Main form */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[620px] mx-auto py-12 px-6">
          <h2
            className="text-[18px] text-[#1F1F1F] mb-8"
            style={{ fontFamily: 'var(--font-family)', fontWeight: 400 }}
          >
            {isNew ? `Create New ${typeLabel}` : isViewMode ? `View ${itemType === 'ATT' ? 'Descriptive Metadata' : typeLabel}` : `Edit ${itemType === 'ATT' ? 'Descriptive Metadata' : typeLabel}`}
          </h2>

          <div className="space-y-5">
            {/* Title (+ Defined Term side-by-side for DEF) */}
            {itemType === 'DEF' ? (
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Title {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => { if (!isViewMode) { setTitle(e.target.value); setIsDirty(true); setIsValidated(false); } }}
                    readOnly={isViewMode}
                    placeholder={isViewMode ? '' : titlePlaceholder}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                    autoFocus={!isViewMode}
                  />
                </div>
                <div className="flex-1">
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Defined Term {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <input
                    type="text"
                    value={defDefinedTerm}
                    onChange={(e) => { if (!isViewMode) { setDefDefinedTerm(e.target.value); setIsDirty(true); } }}
                    readOnly={isViewMode}
                    placeholder={isViewMode ? '' : 'e.g. Coverholder'}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                  Title {!isViewMode && <span className="text-[#C5143D]">*</span>}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    if (isViewMode) return;
                    setTitle(e.target.value);
                    setIsDirty(true);
                    setIsValidated(false);
                  }}
                  readOnly={isViewMode}
                  placeholder={isViewMode ? '' : titlePlaceholder}
                  className={activeInputStyle}
                  style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  autoFocus={!isViewMode}
                />
              </div>
            )}

            {itemType === 'VAR' ? (
              /* GV-specific fields */
              <>
                {/* Question or Statement */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Question or Statement {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <textarea
                    value={gvQuestion}
                    onChange={(e) => { if (!isViewMode) { setGvQuestion(e.target.value); setIsDirty(true); } }}
                    readOnly={isViewMode}
                    rows={4}
                    placeholder={isViewMode ? '' : 'e.g. What is the notice period in business days?'}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px', resize: isViewMode ? 'none' : 'vertical', lineHeight: '1.6' }}
                  />
                </div>

                {/* Type */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Type {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <select
                    value={gvType}
                    onChange={(e) => { if (!isViewMode) { setGvType(e.target.value); setGvTypespecifica(''); setIsDirty(true); } }}
                    disabled={isViewMode}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  >
                    <option value="">Select type</option>
                    {GV_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Typespecifica */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Typespecifica {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <select
                    value={gvTypespecifica}
                    onChange={(e) => { if (!isViewMode) { setGvTypespecifica(e.target.value); setIsDirty(true); } }}
                    disabled={isViewMode || !gvType}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px', opacity: (!isViewMode && !gvType) ? 0.5 : 1 }}
                  >
                    <option value="">Select typespecifica</option>
                    {(GV_TYPESPECIFICA_OPTIONS[gvType] || []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* WOL Expression */}
                <div>
                  <ConditionCodeEditor
                    value={gvWolExpression}
                    onChange={(v) => { if (!isViewMode) { setGvWolExpression(v); setIsDirty(true); } }}
                    headerLabel="VARIABLE.WOL"
                    minHeight="120px"
                  />
                </div>

                {/* System Guidance */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    System Guidance
                  </label>

                  {/* Step 1: Select guidance type */}
                  <select
                    value={gvSysGuidanceMode}
                    onChange={(e) => {
                      if (!isViewMode) {
                        setGvSysGuidanceMode(e.target.value as '' | 'none' | 'embedded' | 'linked');
                        setGvSystemGuidance('');
                        setIsDirty(true);
                      }
                    }}
                    disabled={isViewMode}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  >
                    <option value="">Select type</option>
                    <option value="none">None</option>
                    <option value="embedded">Embedded</option>
                    <option value="linked">Linked</option>
                  </select>

                  {/* Step 2a: Embedded → rich-text field */}
                  {gvSysGuidanceMode === 'embedded' && (
                    <div className="mt-3">
                      {!isViewMode && <RichTextFieldHeader />}
                      <textarea
                        value={gvSystemGuidance}
                        onChange={(e) => { if (!isViewMode) { setGvSystemGuidance(e.target.value); setIsDirty(true); } }}
                        readOnly={isViewMode}
                        rows={5}
                        placeholder={isViewMode ? '' : 'Enter embedded system guidance...'}
                        className={activeInputStyle}
                        style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px', resize: isViewMode ? 'none' : 'vertical', lineHeight: '1.6', borderTop: isViewMode ? undefined : 'none' }}
                      />
                    </div>
                  )}

                  {/* Step 2b: Linked → dropdown of SYS foundation objects */}
                  {gvSysGuidanceMode === 'linked' && (
                    <select
                      value={gvSystemGuidance}
                      onChange={(e) => { if (!isViewMode) { setGvSystemGuidance(e.target.value); setIsDirty(true); } }}
                      disabled={isViewMode}
                      className={`${activeInputStyle} mt-3`}
                      style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                    >
                      <option value="">Select System Guidance object...</option>
                      <option value="sys-001">Version Numbering Convention — v1.0.0 · PUBLISHED</option>
                      <option value="sys-drafting">Drafting Standards — v2.1.0 · PUBLISHED</option>
                      <option value="sys-approval">Approval Workflow — v1.3.0 · PUBLISHED</option>
                    </select>
                  )}
                </div>
              </>
            ) : itemType === 'ATT' ? (
              /* DM-specific fields */
              <>
                {/* Type */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Type {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <select
                    value={dmType}
                    onChange={(e) => { if (!isViewMode) { setDmType(e.target.value); setIsDirty(true); } }}
                    disabled={isViewMode}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  >
                    <option value="">Select type</option>
                    {DM_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Applicability */}
                <div className="relative">
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Applicability {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <button
                    ref={applicabilityBtnRef}
                    type="button"
                    disabled={isViewMode}
                    onClick={() => {
                      if (!showApplicabilityDropdown && applicabilityBtnRef.current) {
                        const r = applicabilityBtnRef.current.getBoundingClientRect();
                        setApplicabilityDropdownPos({ top: r.bottom, left: r.left, width: r.width });
                      }
                      setShowApplicabilityDropdown(o => !o);
                    }}
                    className={`${activeInputStyle} text-left flex items-center justify-between cursor-pointer`}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px' }}
                  >
                    <span className={dmApplicability.length > 0 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}>
                      {dmApplicability.length > 0
                        ? dmApplicability.map(v => DM_APPLICABILITY_OPTIONS.find(o => o.value === v)?.label ?? v).join(', ')
                        : 'Select applicability...'}
                    </span>
                    {!isViewMode && <ChevronDown size={14} className={`text-[#6b7280] transition-transform ${showApplicabilityDropdown ? 'rotate-180' : ''}`} />}
                  </button>
                  {showApplicabilityDropdown && applicabilityDropdownPos && (
                    <div
                      ref={applicabilityPanelRef}
                      className="bg-white border border-[#d1d5db] shadow-lg"
                      style={{
                        position: 'fixed',
                        top: applicabilityDropdownPos.top + 2,
                        left: applicabilityDropdownPos.left,
                        width: applicabilityDropdownPos.width,
                        zIndex: 9999,
                        borderRadius: '0px',
                      }}
                    >
                      {DM_APPLICABILITY_OPTIONS.map(opt => (
                        <label
                          key={opt.value}
                          className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F2F2F2] cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={dmApplicability.includes(opt.value)}
                            onChange={() => toggleApplicability(opt.value)}
                            className="accent-[#C5143D] cursor-pointer"
                          />
                          <span className="text-[13px] text-[#1F1F1F]">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Description {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  <textarea
                    value={dmDescription}
                    onChange={(e) => { if (!isViewMode) { setDmDescription(e.target.value); setIsDirty(true); } }}
                    readOnly={isViewMode}
                    rows={5}
                    placeholder={isViewMode ? '' : 'Describe the metadata attribute and its purpose...'}
                    className={activeInputStyle}
                    style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px', resize: isViewMode ? 'none' : 'vertical', lineHeight: '1.6' }}
                  />
                </div>

                {/* WOL Expression */}
                <div>
                  <ConditionCodeEditor
                    value={dmWolExpression}
                    onChange={(v) => { if (!isViewMode) { setDmWolExpression(v); setIsDirty(true); } }}
                    headerLabel="DESCRIPTIVE-METADATA.WOL"
                    minHeight="120px"
                  />
                </div>
              </>
            ) : itemType === 'DEF' ? (
              /* DEF-specific fields (Title + Defined Term already rendered above) */
              <>
                {/* Alias */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>Alias</label>
                  {isViewMode ? (
                    defAliases.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {defAliases.map(alias => (
                          <span key={alias} className="px-2 py-0.5 text-[12px] bg-[#F2F2F2] border border-[#d1d5db] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>{alias}</span>
                        ))}
                      </div>
                    ) : <span className="text-[13px] text-[#9ca3af]">—</span>
                  ) : (
                    <div
                      className={activeInputStyle + ' flex items-center gap-1.5 cursor-text'}
                      style={{ borderRadius: '0px', fontFamily: 'var(--font-family)', fontSize: '14px', minHeight: '38px', padding: '4px 12px' }}
                      onClick={() => aliasInputRef.current?.focus()}
                    >
                      <input
                        ref={aliasInputRef}
                        type="text"
                        value={defAliasInput}
                        onChange={(e) => setDefAliasInput(e.target.value)}
                        onKeyDown={handleAliasKeyDown}
                        placeholder={defAliases.length === 0 ? 'Type an alias and press Enter…' : ''}
                        className="flex-1 min-w-0 bg-transparent outline-none text-[14px] text-[#1F1F1F] placeholder:text-[#9ca3af]"
                        style={{ fontFamily: 'var(--font-family)' }}
                      />
                      {/* Show up to 3 badges on the right; overflow as +n */}
                      {defAliases.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                          {defAliases.slice(0, 3).map(alias => (
                            <span
                              key={alias}
                              className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-[#F2F2F2] border border-[#d1d5db] text-[#1F1F1F] whitespace-nowrap"
                              style={{ fontFamily: 'var(--font-family)' }}
                            >
                              {alias}
                              <button
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={(e) => { e.stopPropagation(); setDefAliases(prev => prev.filter(a => a !== alias)); setIsDirty(true); }}
                                className="text-[#9ca3af] hover:text-[#C5143D] leading-none ml-0.5"
                              >&times;</button>
                            </span>
                          ))}
                          {defAliases.length > 3 && (
                            <span className="px-1.5 py-0.5 text-[11px] bg-[#F2F2F2] border border-[#d1d5db] text-[#6b7280] whitespace-nowrap" style={{ fontFamily: 'var(--font-family)' }}>
                              +{defAliases.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Definition Text */}
                <div>
                  <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                    Definition Text {!isViewMode && <span className="text-[#C5143D]">*</span>}
                  </label>
                  {!isViewMode && <RichTextFieldHeader />}
                  <textarea
                    value={body}
                    onChange={(e) => { if (!isViewMode) { setBody(e.target.value); setIsDirty(true); setIsValidated(false); } }}
                    readOnly={isViewMode}
                    rows={10}
                    placeholder={isViewMode ? '' : bodyPlaceholder}
                    className={activeInputStyle}
                    style={{
                      borderRadius: '0px',
                      fontFamily: 'var(--font-family)',
                      fontSize: '14px',
                      resize: isViewMode ? 'none' : 'vertical',
                      lineHeight: '1.6',
                      borderTop: isViewMode ? undefined : 'none',
                    }}
                  />
                </div>
              </>
            ) : (
              /* Default body text for LOV, TEC, SYS */
              <div>
                <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
                  {bodyLabel} {!isViewMode && <span className="text-[#C5143D]">*</span>}
                </label>
                <textarea
                  value={body}
                  onChange={(e) => {
                    if (isViewMode) return;
                    setBody(e.target.value);
                    setIsDirty(true);
                    setIsValidated(false);
                  }}
                  readOnly={isViewMode}
                  rows={10}
                  placeholder={isViewMode ? '' : bodyPlaceholder}
                  className={activeInputStyle}
                  style={{
                    borderRadius: '0px',
                    fontFamily: 'var(--font-family)',
                    fontSize: '14px',
                    resize: isViewMode ? 'none' : 'vertical',
                    lineHeight: '1.6',
                  }}
                />
              </div>
            )}
          </div>
        </div>
        </div>

        {/* Metadata side panel — hidden for ATT (Descriptive Metadata) */}
        {itemType !== 'ATT' && (
        <div className="w-[280px] min-w-[280px] border-l border-[#d1d5db] bg-[#FAFAFA] flex flex-col overflow-hidden">
          {/* Panel body */}
          <div className="flex-1 overflow-y-auto" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {/* Name + badges */}
            <div className="px-4 pt-4 pb-3 border-b border-[#d1d5db]">
              <h4 className="text-[13px] font-semibold text-[#1F1F1F] mb-1.5 truncate">{displayTitle}</h4>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-1.5 py-0.5 text-[11px] font-mono bg-[#F2F2F2] text-[#6b7280] border border-[#d1d5db]">{itemType}</span>
                <StatusBadge status={itemStatus} />
              </div>
            </div>

            {/* System Metadata */}
            <div className="px-4 py-3 border-b border-[#d1d5db]">
              <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">System Metadata</p>
              <div className="space-y-0">
                <SysRow label="ID" value={existingItem?.id ?? '—'} />
                <SysRow label="Version" value={existingItem?.version ?? '0.1.0'} />
                <SysRow label="Type" value={foundationTypeLabels[itemType]} />
                <SysRow label="Last Modified" value={existingItem ? formatDate(existingItem.lastModified) : '—'} />
                <SysRow label="Owner" value={existingItem?.owner ?? 'R. Pyke'} />
                <SysRow label="Usages" value={String(existingItem?.usages ?? 0)} />
              </div>
            </div>

            {/* Descriptive Metadata */}
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-3">Descriptive Metadata</p>
              <div className="space-y-3">
                {/* Risk Code */}
                <div>
                  <p className="text-[10px] text-[#9ca3af] mb-1" style={{ fontFamily: 'var(--font-family)' }}>Risk Code</p>
                  {dmRiskCodes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {dmRiskCodes.map(rc => (
                        <span key={rc} className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-[#F2F2F2] border border-[#d1d5db] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>
                          {rc}
                          {!isViewMode && (
                            <button onClick={() => { setDmRiskCodes(prev => prev.filter(x => x !== rc)); setIsDirty(true); }} className="ml-0.5 text-[#9ca3af] hover:text-[#C5143D] leading-none">&times;</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {!isViewMode && (
                    <select
                      value=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v && !dmRiskCodes.includes(v)) { setDmRiskCodes(prev => [...prev, v]); setIsDirty(true); }
                      }}
                      className="w-full text-[12px] border border-[#d1d5db] px-2 py-1 bg-white text-[#6b7280] outline-none focus:border-[#2563eb]"
                      style={{ borderRadius: 0, fontFamily: 'var(--font-family)' }}
                    >
                      <option value="">+ Add risk code</option>
                      {riskCodes.filter(rc => !dmRiskCodes.includes(rc.id)).map(rc => (
                        <option key={rc.id} value={rc.id}>{rc.id}</option>
                      ))}
                    </select>
                  )}
                  {isViewMode && dmRiskCodes.length === 0 && <span className="text-[12px] text-[#9ca3af]">—</span>}
                </div>

                {/* Class of Business */}
                <div>
                  <p className="text-[10px] text-[#9ca3af] mb-1" style={{ fontFamily: 'var(--font-family)' }}>Class of Business</p>
                  {isViewMode ? (
                    <span className="text-[12px] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>{dmCob || '—'}</span>
                  ) : (
                    <select
                      value={dmCob}
                      onChange={(e) => { setDmCob(e.target.value); setIsDirty(true); }}
                      className="w-full text-[12px] border border-[#d1d5db] px-2 py-1 bg-white text-[#1F1F1F] outline-none focus:border-[#2563eb]"
                      style={{ borderRadius: 0, fontFamily: 'var(--font-family)' }}
                    >
                      <option value="">—</option>
                      {cobOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  )}
                </div>

                {/* Jurisdiction */}
                <div>
                  <p className="text-[10px] text-[#9ca3af] mb-1" style={{ fontFamily: 'var(--font-family)' }}>Jurisdiction</p>
                  {dmJurisdictions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1.5">
                      {dmJurisdictions.map(j => (
                        <span key={j} className="flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] bg-[#F2F2F2] border border-[#d1d5db] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>
                          {j}
                          {!isViewMode && (
                            <button onClick={() => { setDmJurisdictions(prev => prev.filter(x => x !== j)); setIsDirty(true); }} className="ml-0.5 text-[#9ca3af] hover:text-[#C5143D] leading-none">&times;</button>
                          )}
                        </span>
                      ))}
                    </div>
                  )}
                  {!isViewMode && (
                    <select
                      value=""
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v && !dmJurisdictions.includes(v)) { setDmJurisdictions(prev => [...prev, v]); setIsDirty(true); }
                      }}
                      className="w-full text-[12px] border border-[#d1d5db] px-2 py-1 bg-white text-[#6b7280] outline-none focus:border-[#2563eb]"
                      style={{ borderRadius: 0, fontFamily: 'var(--font-family)' }}
                    >
                      <option value="">+ Add jurisdiction</option>
                      {jurisdictionOptions.filter(j => !dmJurisdictions.includes(j)).map(j => (
                        <option key={j} value={j}>{j}</option>
                      ))}
                    </select>
                  )}
                  {isViewMode && dmJurisdictions.length === 0 && <span className="text-[12px] text-[#9ca3af]">—</span>}
                </div>

                {/* WOL Publication Notes */}
                <div>
                  <p className="text-[10px] text-[#9ca3af] mb-1" style={{ fontFamily: 'var(--font-family)' }}>WOL Publication Notes</p>
                  {isViewMode ? (
                    <span className="text-[12px] text-[#1F1F1F] whitespace-pre-wrap" style={{ fontFamily: 'var(--font-family)' }}>{dmWolNotes || '—'}</span>
                  ) : (
                    <textarea
                      value={dmWolNotes}
                      onChange={(e) => { setDmWolNotes(e.target.value); setIsDirty(true); }}
                      rows={3}
                      placeholder="Optional notes..."
                      className="w-full text-[12px] border border-[#d1d5db] px-2 py-1.5 bg-white text-[#1F1F1F] outline-none focus:border-[#2563eb] resize-none"
                      style={{ borderRadius: 0, fontFamily: 'var(--font-family)', lineHeight: '1.5' }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
