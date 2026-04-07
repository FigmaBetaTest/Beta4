import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import {
  ArrowLeft, Save, Check, AlertTriangle, Info, X, Plus,
  Search, BookOpen, Database, FileCheck, ChevronDown, Loader2, Send,
  Undo2, Redo2, AlignLeft, AlignCenter, AlignRight, ListOrdered, List,
  Type, Settings2, Table, Code, MoreHorizontal, Pencil, PanelLeft, PanelTop,
} from 'lucide-react';
import { repositoryItems, dynamicRepositoryItems, draftParagraphsStore, paragraphsByItemId, dataElements, referenceDefinitions, embeddedVariableEntries } from './mock-data';
import { TypeBadge, StatusBadge } from './type-badge';
import { MetaKV } from './meta-kv';
import { toast } from 'sonner';
import { ConditionCodeEditor } from './condition-code-editor';
import { RichTextEditor } from './rich-text-editor-new';

type EditorTab = 'content' | 'table';
type SidePanelTab = 'settings' | 'metadata';

interface TableCell { id: string; value: string; }
interface DynamicTableRow { id: string; title: string; value: string; mergeWithNext?: boolean; }

interface ParagraphData {
  id: string;
  type?: 'text' | 'table' | 'dynamic-table';
  blockType?: 'h1' | 'h2' | 'label' | 'numbered' | 'list-bullet' | 'list-ordered' | 'sub-component-title';
  titlePrefix?: string;
  clauseNumber?: string;
  content: string;
  indent?: number;
  conditional?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  variants?: { letter: string; content: string }[];
  tableData?: { rows: TableCell[][] };
  dynamicTableData?: { rows: DynamicTableRow[]; headerOrientation?: 'vertical' | 'horizontal' };
}

export function ComponentEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fromPath = searchParams.get('from');
  const nameFromCanvas = searchParams.get('name');
  const isNew = searchParams.get('isNew') === 'true';
  const allItems = [...repositoryItems, ...dynamicRepositoryItems];
  const component = allItems.find(i => i.id === id) || repositoryItems[4];
  const displayName = nameFromCanvas || component.name;

  const [activeTab, setActiveTab] = useState<EditorTab>('content');
  const [activeSidePanelTab, setActiveSidePanelTab] = useState<SidePanelTab>('settings');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDynamicTableDialog, setShowDynamicTableDialog] = useState(false);
  
  // C12.9 — Notice of non-renewal content (only for the C12.9 item, or any non-new item)
  const c129Paragraphs: ParagraphData[] = [
    {
      id: 'p-c129-label',
      blockType: 'label',
      content: 'C12.9',
    },
    {
      id: 'p-c129-title',
      blockType: 'h1',
      content: 'Notice of non-renewal',
    },
    {
      id: 'p-1234',
      content: '12.34\tWithout prejudice to the provisions specified in @Communication, the Agreement may be non-renewed by either the Coverholder or the Lead Insurer giving notice to the other which is not less than:',
    },
    {
      id: 'p-12341',
      indent: 1,
      content: '12.34.1\t[EMB:xlvi]60[/EMB] [EMB:xlvii]business days[/EMB] prior to the expiry date of the Agreement; or',
    },
    {
      id: 'p-12342',
      indent: 1,
      content: '12.34.2\tSuch longer period as may be required by applicable law or regulation.',
    },
    {
      id: 'p-1235',
      content: '12.35\tThe @[notice period] will not apply if the Lead Insurer or the Coverholder is prevented from renewing the Agreement due to any legal or regulatory constraints, including but not limited to changes in applicable law or regulation, loss of a required license or regulatory authorisation, sanctions, or other legal prohibitions, even if such events occur within the @[notice period] in absence of a notice @Communication from the Lead Insurer or the Coverholder.',
    },
    {
      id: 'p-1236',
      content: '12.36\tWhilst the Lead Insurer or the Coverholder may intend to renew the Agreement, upon receiving and / or providing the full pre-renewal submission before the Agreement expires, in accordance with the timings specified in @[Module 4 – Operational Responsibilities], circumstances and intention may evolve during the renewal negotiation and review process. This may result in a subsequent decision not to renew, even if made after the effective notice period has passed.',
    },
    {
      id: 'p-1237',
      content: '12.37\tIn the event that notice of non-renewal is not issued in accordance with the specified @[notice period], except for any prevention due to legal or regulatory constraints noted above, the Coverholder and Insurers agree that:',
    },
    {
      id: 'p-12371',
      indent: 1,
      content: '12.37.1\tThe Lead Insurer and the Coverholder will co-operate in good faith to agree a non-renewal process. This process must aim to minimise disruption, ensure an orderly transition, and comply with all applicable law or regulation.',
    },
    {
      id: 'p-12372',
      indent: 1,
      conditional: true,
      content: '12.37.2\tThe Agreement will be automatically extended for a period of [EMB:xlviii]60[/EMB] [EMB:xlix]business days[/EMB].',
    },
    {
      id: 'p-1238',
      content: '12.38\tUnless otherwise agreed, failure by the Lead Insurer or the Coverholder to provide notice in accordance with the @[notice period], will not result in the [EMB:l]automatic renewal or extension[/EMB] of the Agreement.',
    },
  ];

  // For new blank drafts, start with just a title heading; otherwise load C12.9 content
  const typePrefix = component.type === 'Component-Group' ? 'CG' : component.type === 'Component' ? 'C' : '';
  const titleContent = isNew && typePrefix ? `${typePrefix} ${component.name.replace(new RegExp(`^${typePrefix}\\s+`), '')}` : component.name;
  const defaultParagraphs: ParagraphData[] = isNew
    ? [
        { id: 'p-new-title', blockType: 'h1', content: titleContent, titlePrefix: typePrefix || undefined },
        { id: 'p-new-body', content: '' },
      ]
    : c129Paragraphs;

  // Load from session store, then hard-coded paragraphs, then fall back to defaults
  const initialParagraphs: ParagraphData[] =
    (id && draftParagraphsStore[id]) ? draftParagraphsStore[id] :
    (id && paragraphsByItemId[id]) ? paragraphsByItemId[id] as ParagraphData[] :
    defaultParagraphs;
  
  const [paragraphs, setParagraphsRaw] = useState<ParagraphData[]>(initialParagraphs);
  const historyRef = useRef<ParagraphData[][]>([initialParagraphs]);
  const historyIndexRef = useRef<number>(0);

  const setParagraphs = useCallback((updater: ParagraphData[] | ((prev: ParagraphData[]) => ParagraphData[]), recordHistory = true) => {
    setParagraphsRaw(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (recordHistory) {
        const truncated = historyRef.current.slice(0, historyIndexRef.current + 1);
        historyRef.current = [...truncated, next];
        historyIndexRef.current = historyRef.current.length - 1;
      }
      return next;
    });
  }, []);

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current -= 1;
    setParagraphsRaw(historyRef.current[historyIndexRef.current]);
    setIsDirty(true);
  }, []);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current += 1;
    setParagraphsRaw(historyRef.current[historyIndexRef.current]);
    setIsDirty(true);
  }, []);

  const handleSetAlignment = useCallback((align: 'left' | 'center' | 'right') => {
    const info = cursorInfoRef.current;
    if (!info) return;
    setParagraphs(prev => prev.map(p => p.id === info.paragraphId ? { ...p, textAlign: align } : p));
  }, [setParagraphs]);
  const [isDirty, setIsDirty] = useState(false);
  const [validationState, setValidationState] = useState({ im: true, rules: true, render: false });
  const [isValidated, setIsValidated] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Lifted textarea ref + cursor tracking for cross-component insert
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorPosRef = useRef<number>(0);
  const selectionEndRef = useRef<number>(0);
  const paragraphRefsMap = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const cursorInfoRef = useRef<{ paragraphId: string; start: number; end: number; variantLetter?: string } | null>(null);

  const handleCursorChange = useCallback((paragraphId: string, start: number, end: number, variantLetter?: string) => {
    cursorInfoRef.current = { paragraphId, start, end, variantLetter };
  }, []);

  const handleFormatText = useCallback((tag: string) => {
    const info = cursorInfoRef.current;
    if (!info || info.start === info.end) return;
    const { paragraphId, start, end, variantLetter } = info;
    const openTag = `<${tag}>`;
    const closeTag = `</${tag}>`;
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      if (variantLetter) {
        const variants = p.variants?.map(v => {
          if (v.letter !== variantLetter) return v;
          const selected = v.content.slice(start, end);
          const alreadyWrapped = selected.startsWith(openTag) && selected.endsWith(closeTag);
          const newContent = alreadyWrapped
            ? v.content.slice(0, start) + selected.slice(openTag.length, -closeTag.length) + v.content.slice(end)
            : v.content.slice(0, start) + openTag + selected + closeTag + v.content.slice(end);
          return { ...v, content: newContent };
        });
        return { ...p, variants };
      } else {
        const selected = p.content.slice(start, end);
        const alreadyWrapped = selected.startsWith(openTag) && selected.endsWith(closeTag);
        const newContent = alreadyWrapped
          ? p.content.slice(0, start) + selected.slice(openTag.length, -closeTag.length) + p.content.slice(end)
          : p.content.slice(0, start) + openTag + selected + closeTag + p.content.slice(end);
        return { ...p, content: newContent };
      }
    }));
    setIsDirty(true);
  }, []);
  
  // Convert paragraphs to string for legacy handlers
  const editorContent = paragraphs.map(p => p.content).join('\n\n');

  const saveCursorPosition = useCallback(() => {
    if (textareaRef.current) {
      cursorPosRef.current = textareaRef.current.selectionStart;
      selectionEndRef.current = textareaRef.current.selectionEnd;
    }
  }, []);

  // Helper: apply a content edit to the focused paragraph
  const applyParagraphInsert = useCallback((insertion: string, replaceSelection = false) => {
    const info = cursorInfoRef.current;
    if (!info) return;
    const { paragraphId, start, end } = info;
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      const replaceEnd = replaceSelection ? end : start;
      const newContent = p.content.slice(0, start) + insertion + p.content.slice(replaceEnd);
      return { ...p, content: newContent };
    }));
    const newPos = start + insertion.length;
    cursorInfoRef.current = { paragraphId, start: newPos, end: newPos };
    requestAnimationFrame(() => {
      const el = paragraphRefsMap.current[paragraphId];
      if (el) { el.focus(); el.setSelectionRange(newPos, newPos); }
    });
    setIsDirty(true);
  }, []);

  const handleInsertVariable = useCallback((varName: string) => {
    applyParagraphInsert(`{{${varName}}}`);
  }, [applyParagraphInsert]);

  const handleInsertReference = useCallback((term: string) => {
    const info = cursorInfoRef.current;
    const token = term.includes(' ') ? `@[${term}]` : `@${term}`;
    // If text is selected, replace selection with the reference token
    const replaceSelection = !!(info && info.start !== info.end);
    applyParagraphInsert(token, replaceSelection);
  }, [applyParagraphInsert]);

  const handleInsertEmbeddedVariable = useCallback((refMark: string, label: string) => {
    applyParagraphInsert(`[EMB:${refMark}]${label}[/EMB]`);
    toast.success(`Embedded Variable inserted`);
  }, [applyParagraphInsert]);

  const handleMarkOptional = useCallback(() => {
    const info = cursorInfoRef.current;
    if (!info || info.start === info.end) return;
    const { paragraphId, start, end } = info;
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      const selected = p.content.slice(start, end);
      const alreadyWrapped = selected.startsWith('[OPT]') && selected.endsWith('[/OPT]');
      if (alreadyWrapped) {
        const unwrapped = selected.slice(5, -6);
        return { ...p, content: p.content.slice(0, start) + unwrapped + p.content.slice(end) };
      }
      const wrapped = `[OPT]${selected}[/OPT]`;
      return { ...p, content: p.content.slice(0, start) + wrapped + p.content.slice(end) };
    }));
    setIsDirty(true);
  }, []);

  const handleContentChange = (value: string) => {
    // Update paragraphs structure
    const newParagraphs = value.split('\n\n').map((content, idx) => {
      const existing = paragraphs[idx];
      return existing ? { ...existing, content } : { id: `p-${Date.now()}-${idx}`, content };
    });
    setParagraphs(newParagraphs);
    setIsDirty(true);
    setIsValidated(false);
    setIsValidating(false);
  };
  
  const handleCreateVariant = (paragraphId: string) => {
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      
      const variants = p.variants || [];
      const nextLetter = variants.length === 0 ? 'B' : String.fromCharCode(65 + variants.length + 1);
      if (nextLetter > 'Z') {
        toast.error('Maximum variants reached (A-Z)');
        return p;
      }
      
      return {
        ...p,
        variants: [...variants, { letter: nextLetter, content: p.content }],
      };
    }));
    setIsDirty(true);
    toast.success('Variant created');
  };

  const handleInsertTable = () => {
    const makeCell = (ri: number, ci: number): TableCell => ({ id: `c-${Date.now()}-${ri}-${ci}`, value: '' });
    const newBlock: ParagraphData = {
      id: `p-${Date.now()}`,
      type: 'table',
      content: '',
      tableData: {
        rows: [
          [makeCell(0,0), makeCell(0,1), makeCell(0,2)],
          [makeCell(1,0), makeCell(1,1), makeCell(1,2)],
          [makeCell(2,0), makeCell(2,1), makeCell(2,2)],
        ],
      },
    };
    setParagraphs(prev => [...prev, newBlock]);
    setIsDirty(true);
  };

  const handleUpdateTable = (paragraphId: string, rows: TableCell[][]) => {
    setParagraphs(prev => prev.map(p =>
      p.id === paragraphId ? { ...p, tableData: { rows } } : p
    ));
    setIsDirty(true);
  };

  const handleInsertDynamicTable = () => {
    setShowDynamicTableDialog(true);
  };

  const handleConfirmDynamicTable = (orientation: 'vertical' | 'horizontal', rowTitles: string[]) => {
    const makeRow = (title: string): DynamicTableRow => ({
      id: `dr-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      title,
      value: '',
    });
    const newBlock: ParagraphData = {
      id: `p-${Date.now()}`,
      type: 'dynamic-table',
      content: '',
      dynamicTableData: {
        headerOrientation: orientation,
        rows: rowTitles.map(makeRow),
      },
    };
    setParagraphs(prev => [...prev, newBlock]);
    setIsDirty(true);
    setShowDynamicTableDialog(false);
  };

  const handleUpdateDynamicTable = (paragraphId: string, rows: DynamicTableRow[]) => {
    setParagraphs(prev => prev.map(p =>
      p.id === paragraphId ? { ...p, dynamicTableData: { rows } } : p
    ));
    setIsDirty(true);
  };

  const handleInsertGuidance = (guidanceType: 'TEC' | 'SYS') => {
    const newBlock: ParagraphData = {
      id: `p-${Date.now()}`,
      type: guidanceType === 'TEC' ? 'guidance-tec' : 'guidance-sys',
      content: '',
    };
    setParagraphs(prev => [...prev, newBlock]);
    setIsDirty(true);
  };

  const handleInsertDefinition = () => {
    const newBlock: ParagraphData = {
      id: `p-${Date.now()}`,
      type: 'definition',
      content: '',
    };
    setParagraphs(prev => [...prev, newBlock]);
    setIsDirty(true);
  };

  const handleRemoveVariant = (paragraphId: string, variantLetter: string) => {
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      
      const variants = (p.variants || []).filter(v => v.letter !== variantLetter);
      return {
        ...p,
        variants: variants.length > 0 ? variants : undefined,
      };
    }));
    setIsDirty(true);
    toast.success(`Variant ${variantLetter} removed`);
  };

  const handleDeleteParagraph = (paragraphId: string) => {
    setParagraphs(prev => prev.filter(p => p.id !== paragraphId));
    setIsDirty(true);
  };

  const handleAddParagraph = (): string => {
    const newId = `p-new-${Date.now()}`;
    setParagraphs(prev => [...prev, { id: newId, content: '' }]);
    setIsDirty(true);
    return newId;
  };

  const handleAddSubComponent = (): string => {
    const newId = `p-sub-${Date.now()}`;
    setParagraphs(prev => [...prev, { id: newId, content: '', blockType: 'sub-component-title', titlePrefix: 'SC' }]);
    setIsDirty(true);
    return newId;
  };

  const handleAddParagraphAfter = (afterId: string, data: Partial<ParagraphData>): string => {
    const newId = `p-new-${Date.now()}`;
    setParagraphs(prev => {
      const idx = prev.findIndex(p => p.id === afterId);
      const newParagraph = { id: newId, content: '', ...data };
      if (idx === -1) return [...prev, newParagraph];
      const next = [...prev];
      next.splice(idx + 1, 0, newParagraph);
      return next;
    });
    setIsDirty(true);
    return newId;
  };

  const handleUpdateParagraphFields = (id: string, fields: Partial<ParagraphData>) => {
    setParagraphs(prev => prev.map(p => p.id === id ? { ...p, ...fields } : p));
    setIsDirty(true);
  };

  const handleSetBlockType = (id: string, blockType: ParagraphData['blockType'] | undefined) => {
    setParagraphs(prev => {
      if (blockType !== 'numbered') {
        return prev.map(p => p.id === id ? { ...p, blockType } : p);
      }
      // Auto-derive clauseNumber when converting a paragraph to numbered type.
      // Scan backwards to find the last numbered clause before this one and whether
      // a sub-component-title block lies between them.
      const idx = prev.findIndex(p => p.id === id);
      let clauseNumber: string | undefined;
      let hasSubComponentBetween = false;
      for (let i = idx - 1; i >= 0; i--) {
        if (prev[i].blockType === 'sub-component-title') {
          hasSubComponentBetween = true;
        }
        if (prev[i].blockType === 'numbered' && prev[i].clauseNumber) {
          const parts = prev[i].clauseNumber!.split('.');
          if (hasSubComponentBetween && parts.length > 1) {
            // e.g. 12.39.2.6 → pop → 12.39.2 → increment last → 12.39.3
            parts.pop();
            const last = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(last)) parts[parts.length - 1] = String(last + 1);
          } else {
            // Normal continuation: increment last segment at the same level
            const last = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(last)) parts[parts.length - 1] = String(last + 1);
          }
          clauseNumber = parts.join('.');
          break;
        }
      }
      const indent = clauseNumber ? Math.max(0, clauseNumber.split('.').length - 2) : 0;
      return prev.map(p => p.id === id ? { ...p, blockType, clauseNumber, indent } : p);
    });
    setIsDirty(true);
  };

  const handleUpdateClauseNumber = (id: string, num: string) => {
    setParagraphs(prev => prev.map(p => p.id === id ? { ...p, clauseNumber: num } : p));
    setIsDirty(true);
  };

  const handleUpdateParagraphContent = (paragraphId: string, content: string, variantLetter?: string) => {
    setParagraphs(prev => prev.map(p => {
      if (p.id !== paragraphId) return p;
      
      if (variantLetter) {
        return {
          ...p,
          variants: (p.variants || []).map(v => v.letter === variantLetter ? { ...v, content } : v),
        };
      } else {
        return { ...p, content };
      }
    }));
    setIsDirty(true);
  };

  const handleValidate = () => {
    setIsValidating(true);
    setTimeout(() => {
      setValidationState({ im: true, rules: true, render: true });
      setIsValidated(true);
      setIsValidating(false);
    }, 1500);
  };

  const handleSave = () => {
    // Persist paragraphs to session store
    if (id) {
      draftParagraphsStore[id] = paragraphs;
    }
    setIsDirty(false);
    toast.success('Component saved as Draft');
  };

  const handlePublish = () => {
    setShowSaveDialog(true);
  };

  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'content', label: 'Clause' },
    { key: 'table', label: 'Table' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Editor Header / PrePublishBar */}
      <div className="px-4 py-2 border-b border-[#d1d5db] bg-white flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(fromPath ? `/${fromPath}` : '/')} className="p-1.5 hover:bg-[#F2F2F2]">
            <ArrowLeft size={16} className="text-[#6b7280]" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-[14px] text-[#1F1F1F]">{displayName}</span>
            <StatusBadge status={component.status} />
            {isDirty && <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">Unsaved</span>}
          </div>
        </div>

        {/* PrePublishBar - Validation Status */}
        <div className="flex items-center gap-3">
          {isValidated && <PrePublishBar validationState={validationState} />}
          {isValidating && (
            <span className="flex items-center gap-1.5 text-[12px] text-[#6b7280]">
              <Loader2 size={13} className="animate-spin" /> Validating...
            </span>
          )}
          <button
            onClick={handleValidate}
            disabled={isValidating}
            className={`flex items-center gap-1.5 px-[20px] py-[8px] text-[14px] transition-all duration-200 ${
              isValidating
                ? 'text-[#9ca3af] cursor-not-allowed'
                : 'text-[#6b7280] hover:text-[#1F1F1F] cursor-pointer'
            }`}
            style={{ borderRadius: '0px' }}
          >
            {isValidating ? <Loader2 size={13} className="animate-spin" /> : <FileCheck size={13} />}
            {isValidating ? 'Validating...' : 'Validate'}
          </button>
          <button
            onClick={handleSave}
            disabled={!isValidated}
            className={`flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] transition-all duration-200 ${ 
              isValidated
                ? 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white cursor-pointer'
                : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
            }`}
            style={{ borderRadius: '0px' }}
          >
            <Save size={13} /> Save
          </button>
          <button
            onClick={handlePublish}
            disabled={!isValidated}
            className={`flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] transition-all duration-200 ${ 
              isValidated
                ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
            }`}
            style={{ borderRadius: '0px' }}
          >
            <Send size={13} /> Submit
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {activeTab === 'content' && (
            <RichTextEditor
              paragraphs={paragraphs}
              onChange={handleContentChange}
              onUpdateParagraph={handleUpdateParagraphContent}
              onCreateVariant={handleCreateVariant}
              onRemoveVariant={handleRemoveVariant}
              onDeleteParagraph={handleDeleteParagraph}
              onAddParagraph={handleAddParagraph}
              onAddParagraphAfter={handleAddParagraphAfter}
              onUpdateParagraphFields={handleUpdateParagraphFields}
              onSetBlockType={handleSetBlockType}
              onUpdateClauseNumber={handleUpdateClauseNumber}
              onCursorChange={handleCursorChange}
              onFormatText={handleFormatText}
              onSetAlignment={handleSetAlignment}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onRegisterRef={(id, el) => { paragraphRefsMap.current[id] = el; }}
              onAddSubComponentTitle={handleAddSubComponent}
              onInsertTable={handleInsertTable}
              onUpdateTable={handleUpdateTable}
              onInsertDynamicTable={handleInsertDynamicTable}
              onUpdateDynamicTable={handleUpdateDynamicTable}
              onInsertGuidance={handleInsertGuidance}
              onInsertDefinition={handleInsertDefinition}
              isValidated={isValidated}
              textareaRef={textareaRef}
              saveCursorPosition={saveCursorPosition}
            />
          )}
          {activeTab === 'table' && <TableEditor />}
        </div>

        {/* Right Side Panels */}
        <div className="w-[300px] min-w-[300px] border-l border-[#d1d5db] bg-[#FAFAFA] flex flex-col overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-[#d1d5db] bg-[#FAFAFA] shrink-0">
            <button
              onClick={() => setActiveSidePanelTab('settings')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] border-b-2 transition-colors ${
                activeSidePanelTab === 'settings'
                  ? 'border-[#C5143D] text-[#C5143D] bg-white'
                  : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
              }`}
              style={{ fontFamily: 'var(--font-family)' }}
            >
              <Settings2 size={12} />
              Clause Settings
            </button>
            <button
              onClick={() => setActiveSidePanelTab('metadata')}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] border-b-2 transition-colors ${
                activeSidePanelTab === 'metadata'
                  ? 'border-[#C5143D] text-[#C5143D] bg-white'
                  : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
              }`}
              style={{ fontFamily: 'var(--font-family)' }}
            >
              <Info size={12} />
              Metadata
            </button>
          </div>

          {activeSidePanelTab === 'settings' && (
            <InsertSidePanel
              onInsertVariable={handleInsertVariable}
              onInsertReference={handleInsertReference}
              onInsertEmbeddedVariable={handleInsertEmbeddedVariable}
              onMarkOptional={handleMarkOptional}
              onInsertGuidance={handleInsertGuidance}
            />
          )}

          {activeSidePanelTab === 'metadata' && (
            <EditorMetadataPanel component={component} />
          )}
        </div>
      </div>

      {/* Dynamic Table Setup Dialog */}
      {showDynamicTableDialog && (
        <DynamicTableSetupDialog
          onClose={() => setShowDynamicTableDialog(false)}
          onInsert={handleConfirmDynamicTable}
        />
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <SaveDialogVersionVariant
          component={component}
          onClose={() => setShowSaveDialog(false)}
          onSave={(type) => {
            setShowSaveDialog(false);
            setIsDirty(false);
            setValidationState({ im: true, rules: true, render: true });
            const parts = component.version.split('.');
            const patch = parseInt(parts[2] || '0', 10) + 1;
            const newVersion = `${parts[0]}.${parts[1]}.${patch}`;
            toast.success(`Version ${newVersion} submitted`, {
              description: `${component.name} has been submitted for approval.`,
              duration: 4000,
            });
          }}
        />
      )}
    </div>
  );
}

const DEFAULT_DT_ROWS = [
  'Data Item',
  'CRS Data Number',
  'Data Item Group',
  'Data Item Report Type',
  'Data Definition',
  'Data Guidance',
  'Rationale for Collection',
  'Data Item Format',
  'Format Details',
  'Lists of Values',
  'Reporting Optionality',
  'Reporting Condition',
];

function DynamicTableSetupDialog({ onClose, onInsert }: {
  onClose: () => void;
  onInsert: (orientation: 'vertical' | 'horizontal', rowTitles: string[]) => void;
}) {
  const [govVariable, setGovVariable] = useState('');
  const [orientation, setOrientation] = useState<'vertical' | 'horizontal'>('vertical');
  const [fieldCount, setFieldCount] = useState(6);

  const govVariableOptions = [
    'Jurisdictional Notice Periods',
    'Notice Recipients',
    'Follow Insurer Panel',
  ];

  const inputStyle = "w-full bg-white text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db] transition-colors focus:border-[#2563eb]";
  const labelStyle = "text-[12px] text-[#6b7280] mb-1.5 block";

  const handleInsert = () => {
    if (!govVariable) return;
    const rows = Array.from({ length: fieldCount }, (_, i) =>
      DEFAULT_DT_ROWS[i] ?? `Field ${i + 1}`
    );
    onInsert(orientation, rows);
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white border border-[#d1d5db] w-[480px] overflow-hidden shadow-xl flex flex-col" style={{ borderRadius: '0px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
          <div>
            <h3 className="text-[15px] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>Configure Dynamic Table</h3>
            <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: 'var(--font-family)' }}>Set up the table variable and layout</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2]" type="button">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-5">
          {/* 1. GOV Variable */}
          <div>
            <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
              GOV Variable (Table) <span className="text-[#C5143D]">*</span>
            </label>
            <select
              value={govVariable}
              onChange={(e) => setGovVariable(e.target.value)}
              className={inputStyle}
              style={{ borderRadius: '0px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '14px' }}
            >
              <option value="">Select a variable...</option>
              {govVariableOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* 2. Header Layout Toggle */}
          <div>
            <label className={labelStyle} style={{ fontFamily: 'var(--font-family)' }}>
              Header Layout <span className="text-[#C5143D]">*</span>
            </label>
            <div className="flex border border-[#d1d5db]">
              {(['vertical', 'horizontal'] as const).map(o => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOrientation(o)}
                  title={o === 'vertical' ? 'Vertical (header column left)' : 'Horizontal (header row top)'}
                  className={`flex-1 flex items-center justify-center py-2 transition-colors cursor-pointer ${
                    orientation === o
                      ? 'bg-[#E8E8E8] text-[#1F1F1F]'
                      : 'bg-white text-[#BBBBBB] hover:bg-[#F5F5F5] hover:text-[#6b7280]'
                  }`}
                  style={{ borderRadius: '0px' }}
                >
                  {o === 'vertical' ? <PanelLeft size={16} /> : <PanelTop size={16} />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Header Fields Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className={labelStyle} style={{ fontFamily: 'var(--font-family)', marginBottom: 0 }}>
                Header Fields <span className="text-[#C5143D]">*</span>
              </label>
              <span className="text-[13px] text-[#1F1F1F] font-mono">{fieldCount}</span>
            </div>
            <input
              type="range"
              min={1}
              max={12}
              value={fieldCount}
              onChange={(e) => setFieldCount(Number(e.target.value))}
              className="w-full accent-[#C5143D] cursor-pointer"
              style={{ height: '4px' }}
            />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-[#9ca3af]">1</span>
              <span className="text-[11px] text-[#9ca3af]">12</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#d1d5db]">
          <button
            onClick={onClose}
            className="text-[13px] text-[#6b7280] hover:text-[#1F1F1F] cursor-pointer"
            style={{ fontFamily: 'var(--font-family)' }}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleInsert}
            disabled={!govVariable}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#C5143D] text-white text-[13px] hover:bg-[#a01030] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
            type="button"
          >
            <Plus size={12} /> Insert Table
          </button>
        </div>
      </div>
    </div>
  );
}

function PrePublishBar({ validationState }: { validationState: { im: boolean; rules: boolean; render: boolean } }) {
  const items = [
    { label: 'IM OK', ok: validationState.im },
    { label: 'Rules OK', ok: validationState.rules },
    { label: 'Render OK', ok: validationState.render },
  ];

  return (
    <div className="flex items-center gap-2">
      {items.map(item => (
        <span
          key={item.label}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] ${
            item.ok
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-[#F2F2F2] text-[#6b7280]'
          }`}
        >
          {item.ok ? <Check size={11} /> : <AlertTriangle size={11} />}
          {item.label}
        </span>
      ))}
    </div>
  );
}

function RichTextEditorOld({ content, onChange, isValidated, textareaRef, saveCursorPosition }: { content: string; onChange: (v: string) => void; isValidated: boolean; textareaRef: React.RefObject<HTMLTextAreaElement>; saveCursorPosition: () => void }) {
  const renderHighlighted = (text: string) => {
    // First, split by [OPT]...[/OPT] blocks
    const optRegex = /\[OPT\]([\s\S]*?)\[\/OPT\]/g;
    const topParts: JSX.Element[] = [];
    let topLastIndex = 0;
    let optMatch;

    while ((optMatch = optRegex.exec(text)) !== null) {
      if (optMatch.index > topLastIndex) {
        topParts.push(
          <span key={`t-${topLastIndex}`}>{renderInlineTokens(text.slice(topLastIndex, optMatch.index), topLastIndex)}</span>
        );
      }
      // Render optional block with grey left bar, shaded bg, Optional badge
      const innerContent = optMatch[1];
      topParts.push(
        <div
          key={`opt-${optMatch.index}`}
          className="flex my-2"
        >
          <span className="w-1 shrink-0 bg-gray-400" />
          <div className="flex-1 bg-[#F5F5F5] px-3 py-2 border border-[#e5e7eb] border-l-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[8px] px-1.5 py-0.5 bg-gray-100 text-gray-500 border border-gray-300 italic">Optional</span>
            </div>
            <span className="text-[13px] leading-relaxed text-[#374151]">
              {renderInlineTokens(innerContent, optMatch.index + 5)}
            </span>
          </div>
        </div>
      );
      topLastIndex = optRegex.lastIndex;
    }
    if (topLastIndex < text.length) {
      topParts.push(
        <span key={`t-${topLastIndex}`}>{renderInlineTokens(text.slice(topLastIndex), topLastIndex)}</span>
      );
    }
    return topParts;
  };

  const renderInlineTokens = (text: string, baseKey: number) => {
    const parts: JSX.Element[] = [];
    // Match {{VAR}}, @Reference (single-word or @[bracketed multi-word]), and [EMB:ref]...[/EMB] embedded variables
    const regex = /(\[EMB:(\w+)\]([\s\S]*?)\[\/EMB\])|(\{\{\w+\}\})|(@\[[^\]]+\]|@\w+)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={baseKey + lastIndex}>{text.slice(lastIndex, match.index)}</span>);
      }
      if (match[1]) {
        // Embedded variable: [EMB:ref]text[/EMB] → render as <text> in red
        const innerText = match[3];
        parts.push(
          <span key={baseKey + match.index} className="text-[#C5143D]" style={{ fontWeight: 400 }}>
            <span className="text-[#C5143D]" style={{ fontWeight: 400 }}>&lt;</span>
            {innerText}
            <span className="text-[#C5143D]" style={{ fontWeight: 400 }}>&gt;</span>
          </span>
        );
      } else if (match[4]) {
        // {{VARIABLE}}
        parts.push(
          <span key={baseKey + match.index} className="text-[#C5143D] bg-red-50 px-0.5 border border-red-200">
            {match[0]}
          </span>
        );
      } else {
        // @Reference — strip brackets from @[multi word] form for display
        const refDisplay = match[5].startsWith('@[') ? '@' + match[5].slice(2, -1) : match[5];
        parts.push(
          <span key={baseKey + match.index} className="text-[#2563eb]" style={{ fontWeight: 700 }}>
            {refDisplay}
          </span>
        );
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={baseKey + lastIndex}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-[#d1d5db] bg-[#FAFAFA] flex items-center gap-1 flex-wrap">
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <Undo2 size={13} />
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <Redo2 size={13} />
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        {['B', 'I', 'U', 'S'].map(btn => (
          <button key={btn} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[13px] text-[#6b7280]">
            {btn === 'B' ? <strong>B</strong> : btn === 'I' ? <em>I</em> : btn === 'U' ? <u>U</u> : <s>S</s>}
          </button>
        ))}
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <span>&para;</span> Paragraph
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          H1
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          H2
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <AlignLeft size={13} />
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <AlignCenter size={13} />
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <AlignRight size={13} />
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <ListOrdered size={13} />
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <List size={13} />
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          <Table size={13} />
        </button>
      </div>

      {/* Editor Area */}
      <div className="flex-1 overflow-y-auto p-6 bg-white">
        <div className="max-w-[700px] mx-auto">
          {isValidated && (
            <div className="mb-4 flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700">
              <Check size={13} />
              Information Model schema validated — all required data elements present.
            </div>
          )}

          <textarea
            ref={textareaRef}
            className="w-full min-h-[400px] bg-transparent text-[14px] text-[#1F1F1F] leading-relaxed outline-none resize-none border-none"
            value={content}
            onChange={(e) => { onChange(e.target.value); saveCursorPosition(); }}
            onClick={saveCursorPosition}
            onKeyUp={saveCursorPosition}
            style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
          />

          {/* Preview of rendered content */}
          <div className="mt-6 pt-4 border-t border-[#d1d5db]">
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Live Preview</p>
            <div className="text-[13px] leading-relaxed text-[#374151]">
              {renderHighlighted(content)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableEditor() {
  return (
    <div className="flex-1 flex items-center justify-center p-8 bg-white">
      <div className="text-center max-w-[360px]">
        <div className="w-12 h-12 mx-auto mb-4 bg-[#F2F2F2] flex items-center justify-center">
          <Info size={20} className="text-[#9ca3af]" />
        </div>
        <p className="text-[14px] text-[#1F1F1F] mb-2" style={{ fontFamily: 'var(--font-family)' }}>
          Table Editor — Coming Soon
        </p>
        <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: 'var(--font-family)' }}>
          This feature is pending internal alignment. Table structure and field mapping will be defined after the next stakeholder review.
        </p>
      </div>
    </div>
  );
}

function InsertSidePanel({ onInsertVariable, onInsertReference, onInsertEmbeddedVariable, onMarkOptional, onInsertGuidance }: { onInsertVariable: (varName: string) => void; onInsertReference: (term: string) => void; onInsertEmbeddedVariable: (refMark: string, label: string) => void; onMarkOptional: () => void; onInsertGuidance?: (type: 'TEC' | 'SYS') => void }) {
  const [selectedVariation, setSelectedVariation] = useState('A');
  const [variations, setVariations] = useState(['A', 'B', 'C']);

  // Dropdown open states
  const [openDropdown, setOpenDropdown] = useState<'variable' | 'reference' | 'embeddedvar' | null>(null);
  const [varSearch, setVarSearch] = useState('');
  const [refSearch, setRefSearch] = useState('');
  const [embSearch, setEmbSearch] = useState('');
  const [showCreateEmbedded, setShowCreateEmbedded] = useState(false);
  const [newEmbeddedName, setNewEmbeddedName] = useState('');
  const [editingEmbId, setEditingEmbId] = useState<string | null>(null);
  const [embCodeEdits, setEmbCodeEdits] = useState<Record<string, string>>({});

  // Conditions toggle & per-variation condition expressions (each variation independent)
  const [conditionsEnabledPerVariation, setConditionsEnabledPerVariation] = useState<Record<string, boolean>>({
    A: false,
    B: false,
    C: false,
  });
  const [conditionsPerVariation, setConditionsPerVariation] = useState<Record<string, string>>({
    A: '',
    B: '',
    C: '',
  });
  const conditionsEnabled = conditionsEnabledPerVariation[selectedVariation] ?? false;
  const setConditionsEnabled = (val: boolean) =>
    setConditionsEnabledPerVariation(prev => ({ ...prev, [selectedVariation]: val }));

  const handleAddVariation = () => {
    const nextCharCode = variations.length > 0
      ? variations[variations.length - 1].charCodeAt(0) + 1
      : 65; // 'A'
    if (nextCharCode > 90) return; // max 'Z'
    const nextLetter = String.fromCharCode(nextCharCode);
    setVariations(prev => [...prev, nextLetter]);
    setConditionsEnabledPerVariation(prev => ({ ...prev, [nextLetter]: false }));
    setConditionsPerVariation(prev => ({ ...prev, [nextLetter]: '' }));
    setSelectedVariation(nextLetter);
  };

  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredVars = dataElements.filter(de => {
    if (!varSearch) return true;
    const q = varSearch.toLowerCase();
    return de.name.toLowerCase().includes(q) || de.description.toLowerCase().includes(q);
  });

  const filteredRefs = referenceDefinitions.filter(ref => {
    if (!refSearch) return true;
    const q = refSearch.toLowerCase();
    return ref.term.toLowerCase().includes(q) || ref.definition.toLowerCase().includes(q) || ref.source.toLowerCase().includes(q);
  });

  const filteredEmbs = embeddedVariableEntries.filter(e => {
    if (!embSearch) return true;
    const q = embSearch.toLowerCase();
    return e.label.toLowerCase().includes(q) || e.description.toLowerCase().includes(q);
  });

  const typeColor = (dt: string) => ({
    'String': 'text-blue-700 bg-blue-50',
    'Currency': 'text-emerald-700 bg-emerald-50',
    'Date': 'text-purple-700 bg-purple-50',
    'Number': 'text-amber-700 bg-amber-50',
    'Reference': 'text-cyan-700 bg-cyan-50',
  }[dt] || 'text-gray-600 bg-gray-100');

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setVarSearch('');
        setRefSearch('');
        setEmbSearch('');
        setShowCreateEmbedded(false);
        setEditingEmbId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleDropdown = (type: 'variable' | 'reference' | 'embeddedvar') => {
    if (openDropdown === type) {
      setOpenDropdown(null);
      setVarSearch('');
      setRefSearch('');
      setEmbSearch('');
      setShowCreateEmbedded(false);
      setEditingEmbId(null);
    } else {
      setOpenDropdown(type);
      setVarSearch('');
      setRefSearch('');
      setEmbSearch('');
      setShowCreateEmbedded(false);
      setEditingEmbId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" ref={dropdownRef} style={{ fontFamily: 'var(--font-family)' }}>
      {/* Clause Variation */}
      <div className="px-3 py-3 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] text-[#1F1F1F]">Clause Variation</span>
        </div>
        <div className="flex items-center gap-1">
          {variations.map(v => (
            <button
              key={v}
              onClick={() => setSelectedVariation(v)}
              className={`px-3 py-1 text-[11px] border transition-colors cursor-pointer ${
                selectedVariation === v
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-[#6b7280] border-[#d1d5db] hover:border-[#9ca3af]'
              }`}
              style={{ borderRadius: '0px' }}
            >
              {v}
            </button>
          ))}
          <button
            className="px-1.5 py-1 text-[11px] text-[#9ca3af] border border-dashed border-[#d1d5db] hover:border-[#9ca3af] hover:text-[#6b7280] transition-colors cursor-pointer"
            style={{ borderRadius: '0px' }}
            onClick={handleAddVariation}
          >
            <Plus size={10} />
          </button>
        </div>
        <p className="text-[10px] text-[#6b7280] mt-1.5">
          Editing Variation <span className="text-amber-700">{selectedVariation}</span>
        </p>

        {/* Conditions Toggle */}
        <div className="mt-3">
          <button
            onClick={() => setConditionsEnabled(!conditionsEnabled)}
            className="w-full flex items-center justify-between px-2.5 py-2 text-[12px] text-[#1F1F1F] border border-[#d1d5db] hover:border-[#9ca3af] hover:bg-white transition-colors cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            <span className="flex items-center gap-2">
              <span className="flex-1 text-left">Conditions</span>
              <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5">Var {selectedVariation}</span>
            </span>
            <div
              className={`relative w-8 h-[18px] transition-colors ${
                conditionsEnabled ? 'bg-[#C5143D]' : 'bg-[#d1d5db]'
              }`}
              style={{ borderRadius: '9px' }}
            >
              <div
                className={`absolute top-[2px] w-[14px] h-[14px] bg-white transition-transform ${
                  conditionsEnabled ? 'left-[16px]' : 'left-[2px]'
                }`}
                style={{ borderRadius: '50%' }}
              />
            </div>
          </button>

          {conditionsEnabled && (
            <div className="mt-1.5">
              <ConditionCodeEditor
                value={conditionsPerVariation[selectedVariation] || ''}
                onChange={(value) =>
                  setConditionsPerVariation(prev => ({
                    ...prev,
                    [selectedVariation]: value,
                  }))
                }
                onSave={() => toast.success(`Condition saved for Variation ${selectedVariation}`)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Insert Section Header */}
      <div className="px-4 py-3 border-b border-[#d1d5db]">
        <p className="text-[10px] uppercase tracking-wider text-[#9ca3af]">Insert</p>
      </div>

      {/* Insert Variable Dropdown */}
      <div className="px-3 py-2 border-b border-[#e5e7eb]">
        <button
          onClick={() => toggleDropdown('variable')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] border transition-colors cursor-pointer ${
            openDropdown === 'variable' ? 'border-[#C5143D] bg-red-50/30 text-[#C5143D]' : 'border-[#d1d5db] text-[#1F1F1F] hover:border-[#9ca3af]'
          }`}
          style={{ borderRadius: '0px' }}
        >
          <span className="flex items-center gap-1.5">
            {'{{ }}'} GOV Variable
          </span>
          <ChevronDown size={11} className={`transition-transform ${openDropdown === 'variable' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'variable' && (
          <div className="mt-1 border border-[#d1d5db] bg-white" style={{ borderRadius: '0px' }}>
            <div className="px-2 py-1.5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 border border-[#d1d5db] px-2 py-1 bg-white" style={{ borderRadius: '0px' }}>
                <Search size={10} className="text-[#9ca3af] shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[11px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                  style={{ fontFamily: 'var(--font-family)', fontSize: '11px' }}
                  value={varSearch}
                  onChange={(e) => setVarSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-[180px] overflow-y-auto">
              {filteredVars.length === 0 && (
                <li className="px-3 py-2 text-[10px] text-[#9ca3af] text-center">No results.</li>
              )}
              {filteredVars.map(de => (
                <li key={de.id}>
                  <button
                    onClick={() => { onInsertVariable(de.name); setOpenDropdown(null); setVarSearch(''); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#C5143D]">{'{{'}{de.name}{'}}'}</span>
                      <div className="relative group shrink-0 ml-1">
                        <Info size={11} className="text-[#9ca3af] hover:text-[#6b7280] cursor-help" />
                        <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-30 bg-[#1F1F1F] text-white text-[10px] px-2 py-1 whitespace-nowrap pointer-events-none">
                          System Guidance
                        </div>
                      </div>
                    </div>
                    <p className="text-[9px] text-[#6b7280] mt-0.5">{de.govType}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Insert Embedded Variable Dropdown */}
      <div className="px-3 py-2 border-b border-[#e5e7eb]">
        <button
          onClick={() => { toggleDropdown('embeddedvar'); setShowCreateEmbedded(false); setEditingEmbId(null); }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] border transition-colors cursor-pointer ${
            openDropdown === 'embeddedvar' ? 'border-[#C5143D] bg-red-50/30 text-[#C5143D]' : 'border-[#d1d5db] text-[#1F1F1F] hover:border-[#9ca3af]'
          }`}
          style={{ borderRadius: '0px' }}
        >
          <span className="flex items-center gap-1.5">
            <Code size={11} className={openDropdown === 'embeddedvar' ? 'text-[#C5143D]' : 'text-[#6b7280]'} />
            Embedded Variable
          </span>
          <ChevronDown size={11} className={`transition-transform ${openDropdown === 'embeddedvar' ? 'rotate-180' : ''}`} />
        </button>

        {/* List view */}
        {openDropdown === 'embeddedvar' && !showCreateEmbedded && (
          <div className="mt-1 border border-[#d1d5db] bg-white" style={{ borderRadius: '0px' }}>
            {/* Create button */}
            <button
              onClick={() => { setShowCreateEmbedded(true); setEditingEmbId(null); setNewEmbeddedName(''); }}
              className="w-full flex items-center gap-1.5 px-2.5 py-2 text-[11px] text-[#C5143D] hover:bg-red-50/40 transition-colors cursor-pointer border-b border-[#e5e7eb]"
            >
              <Plus size={10} />
              Create New Embedded Variable
            </button>
            <div className="px-2 py-1.5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 border border-[#d1d5db] px-2 py-1 bg-white" style={{ borderRadius: '0px' }}>
                <Search size={10} className="text-[#9ca3af] shrink-0" />
                <input
                  type="text"
                  placeholder="Search existing..."
                  className="flex-1 bg-transparent text-[11px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                  style={{ fontFamily: 'var(--font-family)', fontSize: '11px' }}
                  value={embSearch}
                  onChange={(e) => setEmbSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-[240px] overflow-y-auto">
              {filteredEmbs.length === 0 && (
                <li className="px-3 py-2 text-[10px] text-[#9ca3af] text-center">No existing embedded variables found.</li>
              )}
              {filteredEmbs.map(emb => (
                <li key={emb.id} className="border-b border-[#f3f4f6] last:border-0 w-full">
                  {/* Insert row */}
                  <div className="relative flex items-center w-full">
                    <button
                      onClick={() => { onInsertEmbeddedVariable(emb.refMark, emb.label); setOpenDropdown(null); setEmbSearch(''); }}
                      className="w-full text-left pl-2.5 pr-8 py-1.5 hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                    >
                      <span className="text-[11px] text-[#1F1F1F] truncate block">{emb.label}</span>
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingEmbId(editingEmbId === emb.id ? null : emb.id); }}
                      className={`absolute right-0 top-0 bottom-0 px-2 flex items-center border-l border-[#f3f4f6] transition-colors cursor-pointer ${
                        editingEmbId === emb.id ? 'bg-red-50 text-[#C5143D]' : 'text-[#9ca3af] hover:text-[#C5143D] hover:bg-red-50/40'
                      }`}
                      title="Edit embedded variable code"
                    >
                      <Pencil size={10} />
                    </button>
                  </div>
                  {/* Inline code editor for this emb */}
                  {editingEmbId === emb.id && (
                    <div className="border-t border-[#e5e7eb]">
                      <ConditionCodeEditor
                        value={embCodeEdits[emb.id] !== undefined ? embCodeEdits[emb.id] : emb.code}
                        onChange={(val) => setEmbCodeEdits(prev => ({ ...prev, [emb.id]: val }))}
                        minHeight="120px"
                        headerLabel={`${emb.label}.wol`}
                        onSave={() => {
                          toast.success(`Embedded Variable "${emb.label}" saved`);
                          setEditingEmbId(null);
                        }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Create new view */}
        {openDropdown === 'embeddedvar' && showCreateEmbedded && (
          <div className="mt-1 border border-[#d1d5db] bg-white" style={{ borderRadius: '0px' }}>
            <div className="px-2.5 py-2 border-b border-[#e5e7eb] bg-red-50/30" style={{ borderRadius: '0px' }}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-[#1F1F1F]" style={{ fontWeight: 600 }}>Create Embedded Variable</span>
                <button onClick={() => setShowCreateEmbedded(false)} className="p-0.5 hover:bg-red-100 cursor-pointer">
                  <X size={10} className="text-[#6b7280]" />
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#6b7280] shrink-0">Name:</span>
                <input
                  type="text"
                  placeholder="e.g. Termination Rights"
                  className="flex-1 bg-white text-[11px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border border-[#d1d5db] px-1.5 py-0.5 focus:border-[#C5143D]"
                  style={{ fontFamily: 'var(--font-family)', fontSize: '11px', borderRadius: '0px' }}
                  value={newEmbeddedName}
                  onChange={(e) => setNewEmbeddedName(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="px-1 py-1">
              <ConditionCodeEditor
                value={conditionsPerVariation['__emb_create'] || ''}
                onChange={(val) => setConditionsPerVariation(prev => ({ ...prev, '__emb_create': val }))}
                minHeight="120px"
                headerLabel="embedded-variable.wol"
                onSave={() => {
                  if (newEmbeddedName.trim()) {
                    const slug = newEmbeddedName.trim().toLowerCase().replace(/\s+/g, '_');
                    onInsertEmbeddedVariable(slug, newEmbeddedName.trim());
                    toast.success(`Embedded Variable "${newEmbeddedName.trim()}" created and applied`);
                    setNewEmbeddedName('');
                    setShowCreateEmbedded(false);
                    setOpenDropdown(null);
                    setConditionsPerVariation(prev => ({ ...prev, '__emb_create': '' }));
                  } else {
                    toast.error('Please enter a name for the Embedded Variable');
                  }
                }}
              />
            </div>
          </div>
        )}

      </div>

      {/* Insert Reference Dropdown */}
      <div className="px-3 py-2 border-b border-[#e5e7eb]">
        <button
          onClick={() => toggleDropdown('reference')}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[12px] border transition-colors cursor-pointer ${
            openDropdown === 'reference' ? 'border-[#2563eb] bg-blue-50/30 text-[#2563eb]' : 'border-[#d1d5db] text-[#1F1F1F] hover:border-[#9ca3af]'
          }`}
          style={{ borderRadius: '0px' }}
        >
          <span className="flex items-center gap-1.5">
            @ Reference
          </span>
          <ChevronDown size={11} className={`transition-transform ${openDropdown === 'reference' ? 'rotate-180' : ''}`} />
        </button>
        {openDropdown === 'reference' && (
          <div className="mt-1 border border-[#d1d5db] bg-white" style={{ borderRadius: '0px' }}>
            <div className="px-2 py-1.5 border-b border-[#e5e7eb]">
              <div className="flex items-center gap-1.5 border border-[#d1d5db] px-2 py-1 bg-white" style={{ borderRadius: '0px' }}>
                <Search size={10} className="text-[#9ca3af] shrink-0" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="flex-1 bg-transparent text-[11px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                  style={{ fontFamily: 'var(--font-family)', fontSize: '11px' }}
                  value={refSearch}
                  onChange={(e) => setRefSearch(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <ul className="max-h-[180px] overflow-y-auto">
              {filteredRefs.length === 0 && (
                <li className="px-3 py-2 text-[10px] text-[#9ca3af] text-center">No results.</li>
              )}
              {filteredRefs.map(ref => (
                <li key={ref.id}>
                  <button
                    onClick={() => { onInsertReference(ref.term); setOpenDropdown(null); setRefSearch(''); }}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#2563eb]">@{ref.term}</span>
                      <span className="text-[9px] px-1 py-px text-[#6b7280]">{ref.source}</span>
                    </div>
                    <p className="text-[9px] text-[#6b7280] mt-0.5 truncate">{ref.definition}</p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </div>
  );
}

function SaveDialogVersionVariant({ component, onClose, onSave }: {
  component: typeof repositoryItems[0];
  onClose: () => void;
  onSave: (type: 'version' | 'variant') => void;
}) {
  const [saveType, setSaveType] = useState<'version' | 'variant'>('version');
  const usedInItems = component.usedIn.map(id => repositoryItems.find(i => i.id === id)).filter(Boolean) as typeof repositoryItems;
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(
    new Set(usedInItems.map(i => i.id))
  );

  const toggleLocation = (id: string) => {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLocations.size === usedInItems.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(usedInItems.map(i => i.id)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white border border-[#d1d5db] w-[560px] max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
          <div>
            <h3 className="text-[15px] text-[#1F1F1F]">Submit Component</h3>
            <p className="text-[12px] text-[#6b7280]">Select which locations receive this update</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2]"><X size={16} className="text-[#6b7280]" /></button>
        </div>

        {/* Usage Impact Panel */}
        <UsageImpactPanel items={usedInItems} />

        {/* Location Selection */}
        <div className="p-4 space-y-3">
          {usedInItems.length > 0 ? (
            <div className="border border-[#d1d5db] bg-[#FAFAFA]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#d1d5db]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.size === usedInItems.length}
                    onChange={toggleAll}
                    className="accent-[#C5143D] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#6b7280] uppercase tracking-wider">
                    Update Locations ({selectedLocations.size}/{usedInItems.length})
                  </span>
                </div>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                {usedInItems.map(item => (
                  <label
                    key={item.id}
                    className={`flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors ${
                      selectedLocations.has(item.id)
                        ? 'bg-white'
                        : 'bg-[#FAFAFA] opacity-60'
                    } hover:bg-[#F2F2F2]`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLocations.has(item.id)}
                      onChange={() => toggleLocation(item.id)}
                      className="accent-[#C5143D] cursor-pointer shrink-0"
                    />
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TypeBadge type={item.type} />
                      <span className="text-[12px] text-[#1F1F1F] truncate">{item.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[#6b7280]">This component is not currently used in any contracts or templates.</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-[#d1d5db]">
          <button
            onClick={onClose}
            className="px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave('version')}
            disabled={usedInItems.length > 0 && selectedLocations.size === 0}
            className={`px-[40px] py-[8px] text-[14px] transition-all duration-200 flex items-center gap-1.5 ${
              usedInItems.length > 0 && selectedLocations.size === 0
                ? 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
            }`}
            style={{ borderRadius: '0px' }}
          >
            <Send size={13} />
            {`Submit${usedInItems.length > 0 ? ` (${selectedLocations.size} location${selectedLocations.size !== 1 ? 's' : ''})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function UsageImpactPanel({ items }: { items: typeof repositoryItems }) {
  if (items.length === 0) return null;

  return (
    <div className="p-4 border-b border-[#d1d5db]">
      <div className="flex items-center gap-2 mb-2">
        <Info size={13} className="text-amber-600" />
        <span className="text-[12px] text-amber-700">Usage Impact Analysis</span>
      </div>
      <p className="text-[11px] text-[#6b7280] mb-2">
        This component is currently used in {items.length} location(s):
      </p>
      <div className="space-y-1">
        {items.map(item => (
          <div key={item.id} className="flex items-center justify-between p-2 bg-[#F2F2F2]">
            <div className="flex items-center gap-2">
              <TypeBadge type={item.type} />
              <span className="text-[12px] text-[#1F1F1F]">{item.name}</span>
            </div>
            <StatusBadge status={item.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function EditorMetadataPanel({ component }: { component: typeof repositoryItems[0] }) {

  const typeToClass: Record<string, string> = {
    'Contract': 'CTR',
    'Component-Group': 'CG',
    'Component': 'CMP',
    'Clause': 'CLS',
    'Analogue Document': 'ANA',
  };
  const objectClass = typeToClass[component.type] ?? component.type;

  const isDigital = component.format !== 'analogue';

  // Derive a synthetic versionId from id + version
  const versionSuffix = component.version.replace(/\./g, '');
  const versionId = `${component.id}_${versionSuffix}`;

  // Derive a numeric version from semver string (major as number)
  const versionNum = parseInt(component.version.split('.')[0], 10) || 1;

  // Format ISO date for display
  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' (UTC)';
    } catch { return iso; }
  };

  const lifecycleColors: Record<string, string> = {
    PUBLISHED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-blue-100 text-blue-700 border-blue-200',
    WITHDRAWN: 'bg-red-100 text-red-700 border-red-200',
  };
  const lcChip = lifecycleColors[component.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  // Extended / optional attributes
  const extended: [string, string][] = [
    ['Jurisdiction', component.jurisdiction],
    ['Class of Business', component.classOfBusiness],
    ['Owner', component.owner],
    ['Last Modified', formatDate(component.lastModified)],
    ...(component.source ? [['Source', component.source] as [string, string]] : []),
    ...(component.externalUrl ? [['External URL', component.externalUrl] as [string, string]] : []),
  ];

  const SysRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '110px', fontFamily: "'DM Sans', system-ui" }}>{label}</span>
      <span className="text-[12px] text-[#1F1F1F] flex-1 break-all" style={{ fontFamily: "'DM Sans', system-ui" }}>{value}</span>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-y-auto" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#d1d5db]">
        <h4 className="text-[13px] font-semibold text-[#1F1F1F] mb-1.5">{component.name}</h4>
        <div className="flex items-center gap-2">
          <TypeBadge type={component.type} />
          <StatusBadge status={component.status} />
        </div>
      </div>

      {/* Group 1: Systemattribute */}
      <div className="px-4 py-3 border-b border-[#d1d5db]">
        <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">System Attributes</p>
        <div className="space-y-0">
          <SysRow label="ID" value={component.id} />
          <SysRow label="Version ID" value={versionId} />
          <SysRow label="Version" value={versionNum} />
          <SysRow label="Digital" value={
            <span className={isDigital ? 'text-emerald-700' : 'text-gray-500'}>
              {isDigital ? 'true' : 'false'}
            </span>
          } />
          <SysRow label="Created At" value={formatDate(component.lastModified)} />
          {extended.map(([label, val]) => (
            <SysRow key={label} label={label} value={val} />
          ))}
        </div>
      </div>
    </div>
  );
}