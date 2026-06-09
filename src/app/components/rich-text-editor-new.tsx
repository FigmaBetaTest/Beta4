import React, { useRef, useState, useEffect, useLayoutEffect } from 'react';
import {
  Check, AlignLeft, AlignCenter, AlignRight, ListOrdered, List,
  Table, Undo2, Redo2, ChevronDown, Plus, Minus, X, BookOpen, FileText, ArrowLeftRight, Code,
} from 'lucide-react';
import { toast } from 'sonner';
import { ParagraphInlineMenu } from './paragraph-inline-menu';
import { ConditionCodeEditor } from './condition-code-editor';

interface TableCell {
  id: string;
  value: string;
  condition?: string;
}

interface TableData {
  rows: TableCell[][];
}

interface DynamicTableRow {
  id: string;
  title: string;
  value: string;
  mergeWithNext?: boolean;
  condition?: string;
}

interface ParagraphData {
  id: string;
  type?: 'text' | 'table' | 'dynamic-table' | 'guidance-tec' | 'guidance-sys' | 'definition';
  blockType?: 'h1' | 'h2' | 'label' | 'numbered' | 'list-bullet' | 'list-ordered' | 'sub-component-title';
  titlePrefix?: string;
  clauseNumber?: string;
  content: string;
  indent?: number;
  conditional?: boolean;
  textAlign?: 'left' | 'center' | 'right';
  variants?: { letter: string; content: string }[];
  tableData?: TableData;
  dynamicTableData?: { rows: DynamicTableRow[]; headerOrientation?: 'vertical' | 'horizontal' };
}

interface RichTextEditorProps {
  paragraphs: ParagraphData[];
  onChange: (value: string) => void;
  onUpdateParagraph: (paragraphId: string, content: string, variantLetter?: string) => void;
  onCreateVariant: (paragraphId: string) => void;
  onRemoveVariant: (paragraphId: string, variantLetter: string) => void;
  onInsertTable: () => void;
  onUpdateTable: (paragraphId: string, rows: TableCell[][]) => void;
  onDeleteParagraph: (paragraphId: string) => void;
  onInsertDynamicTable: () => void;
  onUpdateDynamicTable: (paragraphId: string, rows: DynamicTableRow[]) => void;
  onInsertGuidance?: (guidanceType: 'TEC' | 'SYS') => void;
  onInsertDefinition?: () => void;
  onAddParagraph: () => string;
  onAddParagraphAfter: (afterId: string, data: Partial<ParagraphData>) => string;
  onUpdateParagraphFields: (id: string, fields: Partial<ParagraphData>) => void;
  onSetBlockType: (id: string, blockType: ParagraphData['blockType'] | undefined) => void;
  onUpdateClauseNumber: (id: string, num: string) => void;
  onCursorChange?: (paragraphId: string, start: number, end: number, variantLetter?: string) => void;
  onFormatText?: (tag: string) => void;
  onSetAlignment?: (align: 'left' | 'center' | 'right') => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onRegisterRef?: (paragraphId: string, el: HTMLTextAreaElement | null) => void;
  onAddSubComponentTitle?: () => string;
  isValidated: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  saveCursorPosition: () => void;
}

function AutoResizeTextarea({ value, onChange, className, style, placeholder, innerRef, onFocus, onKeyDown, onSelect, onMouseUp }: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  innerRef?: React.Ref<HTMLTextAreaElement>;
  onFocus?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSelect?: (e: React.SyntheticEvent<HTMLTextAreaElement>) => void;
  onMouseUp?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  });

  return (
    <textarea
      ref={(el) => {
        (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
        if (typeof innerRef === 'function') (innerRef as (el: HTMLTextAreaElement | null) => void)(el);
        else if (innerRef) (innerRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = el;
      }}
      className={className}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onSelect={onSelect}
      onMouseUp={onMouseUp}
      placeholder={placeholder}
      rows={1}
      style={{
        resize: 'none',
        overflow: 'hidden',
        display: 'block',
        ...style,
      }}
    />
  );
}

function RowConditionButton({ id, condition, onChange }: {
  id: string;
  condition: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(condition);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setDraft(condition);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const hasCondition = condition.trim().length > 0;

  const handleApply = () => {
    onChange(draft);
    setOpen(false);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`p-0.5 transition-colors cursor-pointer group-hover/hcell:opacity-100 ${
          hasCondition
            ? 'opacity-100 text-[#C5143D]'
            : 'opacity-0 text-[#9ca3af] hover:text-[#C5143D]'
        }`}
        title="Row/Column Condition"
      >
        <Code size={11} />
      </button>
      {open && (
        <div
          className="absolute z-50 bg-white border border-[#d1d5db] shadow-xl"
          style={{ top: '100%', left: 0, width: '320px', borderRadius: '0px' }}
        >
          <ConditionCodeEditor
            value={draft}
            onChange={setDraft}
            minHeight="120px"
            headerLabel="row.condition"
          />
          <div className="flex items-center justify-end gap-2 px-2 py-1.5 border-t border-[#e5e7eb] bg-[#FAFAFA]">
            <button
              type="button"
              onClick={handleCancel}
              className="text-[11px] text-[#6b7280] hover:text-[#1F1F1F] cursor-pointer px-2 py-1"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1 px-2 py-1 text-[11px] bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all cursor-pointer"
              style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StaticTableBlock({ tableData, onChange, onRemove }: {
  tableData: TableData;
  onChange: (rows: TableCell[][]) => void;
  onRemove?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const newRows = tableData.rows.map((row, ri) =>
      row.map((cell, ci) => (ri === rowIdx && ci === colIdx) ? { ...cell, value } : cell)
    );
    onChange(newRows);
  };

  const updateCellCondition = (rowIdx: number, colIdx: number, condition: string) => {
    const newRows = tableData.rows.map((row, ri) =>
      row.map((cell, ci) => (ri === rowIdx && ci === colIdx) ? { ...cell, condition } : cell)
    );
    onChange(newRows);
  };

  const addRow = () => {
    const colCount = tableData.rows[0]?.length ?? 3;
    const newRow: TableCell[] = Array.from({ length: colCount }, (_, ci) => ({
      id: `cell-${Date.now()}-r-${ci}`,
      value: '',
    }));
    onChange([...tableData.rows, newRow]);
  };

  const addColumn = () => {
    const ts = Date.now();
    const newRows = tableData.rows.map((row, ri) => [
      ...row,
      { id: `cell-${ts}-c-${ri}`, value: '' },
    ]);
    onChange(newRows);
  };

  const deleteRow = () => {
    if (tableData.rows.length <= 1) return;
    onChange(tableData.rows.slice(0, -1));
  };

  const deleteColumn = () => {
    if ((tableData.rows[0]?.length ?? 0) <= 1) return;
    onChange(tableData.rows.map(row => row.slice(0, -1)));
  };

  return (
    <div
      className="relative my-2"
      style={{ paddingBottom: '28px', paddingRight: '36px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 z-10 p-0.5 text-[#9ca3af] hover:text-[#C5143D] hover:bg-red-50 transition-colors cursor-pointer"
          style={{ right: '38px' }}
          title="Delete table"
          type="button"
        >
          <X size={11} />
        </button>
      )}
      <table className="w-full border-collapse border border-[#d1d5db]">
        <tbody>
          {tableData.rows.map((row, rowIdx) => (
            <tr key={rowIdx} className={rowIdx === 0 ? 'bg-[#FAFAFA]' : ''}>
              {row.map((cell, colIdx) => (
                <td key={cell.id} className="border border-[#d1d5db] p-0 align-top">
                  {rowIdx === 0 ? (
                    <div className="relative group/hcell">
                      <textarea
                        className="w-full px-2 py-1.5 text-[13px] text-[#1F1F1F] outline-none bg-transparent focus:bg-blue-50/10 leading-relaxed"
                        value={cell.value}
                        onChange={(e) => {
                          e.target.style.height = 'auto';
                          e.target.style.height = e.target.scrollHeight + 'px';
                          updateCell(rowIdx, colIdx, e.target.value);
                        }}
                        style={{
                          fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                          minHeight: '36px',
                          resize: 'none',
                          overflow: 'hidden',
                          display: 'block',
                        }}
                        rows={1}
                      />
                      <div className="absolute top-1 left-1">
                        <RowConditionButton
                          id={cell.id}
                          condition={cell.condition ?? ''}
                          onChange={(val) => updateCellCondition(rowIdx, colIdx, val)}
                        />
                      </div>
                    </div>
                  ) : (
                    <CellCodeEditor
                      value={cell.value}
                      onChange={(val) => updateCell(rowIdx, colIdx, val)}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Add Row / Delete Row buttons */}
      {hovered && (
        <div
          className="absolute bottom-0 flex items-center justify-center gap-1"
          style={{ left: 0, right: '36px', height: '28px' }}
        >
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            <Plus size={9} /> Add Row
          </button>
          <button
            onClick={deleteRow}
            disabled={tableData.rows.length <= 1}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderRadius: '0px' }}
          >
            <Minus size={9} /> Del Row
          </button>
        </div>
      )}

      {/* Add Column / Delete Column buttons */}
      {hovered && (
        <div
          className="absolute top-0 right-0 flex flex-col items-center justify-center gap-1"
          style={{ width: '36px', bottom: '28px' }}
        >
          <button
            onClick={addColumn}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer w-full flex-1"
            style={{ borderRadius: '0px' }}
          >
            <Plus size={9} />
            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Col</span>
          </button>
          <button
            onClick={deleteColumn}
            disabled={(tableData.rows[0]?.length ?? 0) <= 1}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer w-full flex-1 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderRadius: '0px' }}
          >
            <Minus size={9} />
            <span style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>Col</span>
          </button>
        </div>
      )}
    </div>
  );
}

function CellCodeEditor({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const lineNumRef = useRef<HTMLDivElement>(null);
  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 1);

  const handleScroll = () => {
    if (textRef.current && lineNumRef.current) {
      lineNumRef.current.scrollTop = textRef.current.scrollTop;
    }
  };

  return (
    <div className="flex bg-white" style={{ minHeight: '48px' }}>
      <div
        ref={lineNumRef}
        className="shrink-0 bg-[#FAFAFA] border-r border-[#d1d5db] select-none overflow-hidden"
        style={{ padding: '8px 0' }}
      >
        {Array.from({ length: lineCount }, (_, i) => (
          <div
            key={i}
            className="text-right text-[#b0b0b0] px-2"
            style={{
              fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
              fontSize: '11px',
              lineHeight: '1.6',
              minWidth: '28px',
            }}
          >
            {i + 1}
          </div>
        ))}
      </div>
      <textarea
        ref={textRef}
        className="flex-1 text-[#6b7280] px-3 py-2 outline-none resize-none border-none bg-white"
        style={{
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontSize: '11px',
          lineHeight: '1.6',
          minHeight: '48px',
          borderRadius: '0px',
          tabSize: 2,
          caretColor: '#C5143D',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
      />
    </div>
  );
}

function DynamicTableBlock({ rows, headerOrientation = 'vertical', onChange, onOrientationChange, onRemove }: {
  rows: DynamicTableRow[];
  headerOrientation?: 'vertical' | 'horizontal';
  onChange: (rows: DynamicTableRow[]) => void;
  onOrientationChange?: (o: 'vertical' | 'horizontal') => void;
  onRemove?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const updateTitle = (idx: number, title: string) => {
    onChange(rows.map((r, i) => i === idx ? { ...r, title } : r));
  };

  const updateRowCondition = (idx: number, condition: string) => {
    onChange(rows.map((r, i) => i === idx ? { ...r, condition } : r));
  };

  const updateValue = (idx: number, value: string) => {
    onChange(rows.map((r, i) => i === idx ? { ...r, value } : r));
  };

  const addRow = () => {
    onChange([...rows, { id: `dr-${Date.now()}`, title: '', value: '' }]);
  };

  const deleteRow = () => {
    if (rows.length <= 1) return;
    onChange(rows.slice(0, -1));
  };

  return (
    <div
      className="relative my-2"
      style={{ paddingBottom: '28px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-1 right-2 z-10 p-0.5 text-[#9ca3af] hover:text-[#C5143D] hover:bg-red-50 transition-colors cursor-pointer"
          title="Delete table"
          type="button"
        >
          <X size={11} />
        </button>
      )}
      {headerOrientation === 'vertical' ? (
        <table className="w-full border-collapse border border-[#d1d5db]">
          <tbody>
            {rows.map((row, idx) => {
              const prevMerged = rows[idx - 1]?.mergeWithNext;
              return (
                <tr key={row.id}>
                  {/* Title cell — skip if previous row has mergeWithNext */}
                  {!prevMerged && (
                    <td
                      className="border border-[#d1d5db] p-0 align-middle"
                      rowSpan={row.mergeWithNext ? 2 : 1}
                      style={{ width: '38%', backgroundColor: '#F5F5F5', verticalAlign: 'middle' }}
                    >
                      <div className="relative group/hcell">
                        <AutoResizeTextarea
                          className="w-full px-3 py-1.5 text-[12px] text-[#1F1F1F] outline-none bg-transparent leading-relaxed text-right"
                          value={row.title}
                          onChange={(val) => updateTitle(idx, val)}
                          placeholder="Label"
                          style={{
                            fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                            fontWeight: 600,
                            minHeight: '36px',
                          }}
                        />
                        <div className="absolute left-1 top-1">
                          <RowConditionButton
                            id={row.id}
                            condition={row.condition ?? ''}
                            onChange={(val) => updateRowCondition(idx, val)}
                          />
                        </div>
                      </div>
                    </td>
                  )}
                  {/* Value cell */}
                  <td className="border border-[#d1d5db] p-0 align-top bg-white">
                    <CellCodeEditor
                      value={row.value}
                      onChange={(val) => updateValue(idx, val)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="overflow-x-auto">
        <table className="border-collapse border border-[#d1d5db]" style={{ tableLayout: 'fixed', width: `${rows.length * 160}px`, minWidth: '100%' }}>
          <thead>
            <tr>
              {rows.map((row, idx) => (
                <th key={row.id} className="border border-[#d1d5db] p-0 align-middle" style={{ backgroundColor: '#F5F5F5', width: '160px', minWidth: '160px' }}>
                  <div className="relative group/hcell">
                    <AutoResizeTextarea
                      className="w-full px-3 py-1.5 text-[12px] text-[#1F1F1F] outline-none bg-transparent leading-relaxed text-center"
                      value={row.title}
                      onChange={(val) => updateTitle(idx, val)}
                      placeholder="Label"
                      style={{
                        fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif",
                        fontWeight: 600,
                        minHeight: '36px',
                      }}
                    />
                    <div className="absolute top-1 left-1">
                      <RowConditionButton
                        id={row.id}
                        condition={row.condition ?? ''}
                        onChange={(val) => updateRowCondition(idx, val)}
                      />
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {rows.map((row, idx) => (
                <td key={row.id} className="border border-[#d1d5db] p-0 align-top bg-white" style={{ width: '160px', minWidth: '160px' }}>
                  <CellCodeEditor
                    value={row.value}
                    onChange={(val) => updateValue(idx, val)}
                  />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        </div>
      )}

      {/* Add Row / Delete Row / Switch Header */}
      {hovered && (
        <div
          className="absolute bottom-0 flex items-center justify-center gap-1"
          style={{ left: 0, right: 0, height: '28px' }}
        >
          <button
            onClick={() => onOrientationChange?.(headerOrientation === 'vertical' ? 'horizontal' : 'vertical')}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#6b7280] hover:text-[#6b7280] transition-colors cursor-pointer"
            style={{ borderRadius: '0px' }}
            title={headerOrientation === 'vertical' ? 'Switch to horizontal header' : 'Switch to vertical header'}
            type="button"
          >
            <ArrowLeftRight size={9} /> Switch Header
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer"
            style={{ borderRadius: '0px' }}
          >
            <Plus size={9} /> Add Row
          </button>
          <button
            onClick={deleteRow}
            disabled={rows.length <= 1}
            className="flex items-center gap-1 px-3 py-1 text-[10px] text-[#9ca3af] bg-white border border-dashed border-[#d1d5db] hover:border-[#C5143D] hover:text-[#C5143D] transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ borderRadius: '0px' }}
          >
            <Minus size={9} /> Del Row
          </button>
        </div>
      )}
    </div>
  );
}

export function RichTextEditor({
  paragraphs,
  onChange,
  onUpdateParagraph,
  onCreateVariant,
  onRemoveVariant,
  onInsertTable,
  onUpdateTable,
  onDeleteParagraph,
  onInsertDynamicTable,
  onUpdateDynamicTable,
  onInsertGuidance,
  onInsertDefinition,
  onAddParagraph,
  onAddParagraphAfter,
  onUpdateParagraphFields,
  onSetBlockType,
  onUpdateClauseNumber,
  onCursorChange,
  onFormatText,
  onSetAlignment,
  onUndo,
  onRedo,
  onRegisterRef,
  onAddSubComponentTitle,
  isValidated,
  textareaRef,
  saveCursorPosition,
}: RichTextEditorProps) {
  const content = paragraphs.map(p => p.content).join('\n\n');
  const [tableDropdownOpen, setTableDropdownOpen] = useState(false);
  const [definitionDropdownOpen, setDefinitionDropdownOpen] = useState(false);
  const [guidanceDropdownOpen, setGuidanceDropdownOpen] = useState(false);
  const [listDropdownOpen, setListDropdownOpen] = useState(false);
  const [addElementDropdownOpen, setAddElementDropdownOpen] = useState(false);
  const addElementDropdownRef = useRef<HTMLDivElement>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (!addElementDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (addElementDropdownRef.current && !addElementDropdownRef.current.contains(e.target as Node)) {
        setAddElementDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [addElementDropdownOpen]);
  const [focusedParagraphId, setFocusedParagraphId] = useState<string | null>(null);
  const paragraphTextareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const lastKeyRef = useRef<string | null>(null);
  const prevParagraphsLengthRef = useRef(-1);

  // Scroll last paragraph into center: on initial load and when a new paragraph is added
  useEffect(() => {
    const isMount = prevParagraphsLengthRef.current === -1;
    const isAdded = paragraphs.length > prevParagraphsLengthRef.current && prevParagraphsLengthRef.current !== -1;
    prevParagraphsLengthRef.current = paragraphs.length;
    if (!isMount && !isAdded) return;
    const lastParagraph = paragraphs[paragraphs.length - 1];
    if (!lastParagraph) return;
    requestAnimationFrame(() => {
      const el = paragraphTextareaRefs.current[lastParagraph.id];
      if (el) {
        el.scrollIntoView({ behavior: isMount ? 'instant' : 'smooth', block: 'center' });
      } else if (editorScrollRef.current) {
        editorScrollRef.current.scrollTop = editorScrollRef.current.scrollHeight;
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paragraphs.length]);

  const trackCursor = (paragraphId: string, variantLetter?: string) => (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    onCursorChange?.(paragraphId, e.currentTarget.selectionStart, e.currentTarget.selectionEnd, variantLetter);
  };

  function incrementClauseNumber(num: string): string {
    if (!num.trim()) return '';
    const parts = num.trim().split('.');
    const last = parseInt(parts[parts.length - 1], 10);
    if (isNaN(last)) return num;
    parts[parts.length - 1] = String(last + 1);
    return parts.join('.');
  }

  function handleNumberedBackspace(paragraph: ParagraphData) {
    if (paragraph.content !== '') return;
    if (lastKeyRef.current !== 'Backspace') return;
    // Double backspace on empty paragraph — delete and focus previous
    const currentIdx = paragraphs.findIndex(p => p.id === paragraph.id);
    const prevPara = paragraphs[currentIdx - 1];
    onDeleteParagraph(paragraph.id);
    if (prevPara) {
      requestAnimationFrame(() => {
        paragraphTextareaRefs.current[prevPara.id]?.focus();
      });
    }
  }

  function handleNumberedEnter(paragraph: ParagraphData) {
    const parts = (paragraph.clauseNumber ?? '').split('.');
    // Double-Enter on empty sub-clause: outdent one level (e.g. 12.39.1.2 → 12.39.2)
    if (lastKeyRef.current === 'Enter' && paragraph.content === '' && parts.length > 1) {
      parts.pop();
      const parentNum = incrementClauseNumber(parts.join('.')) || parts.join('.');
      const newIndent = Math.max(0, parentNum.split('.').length - 2);
      onDeleteParagraph(paragraph.id);
      const newId = onAddParagraphAfter(
        paragraphs[paragraphs.findIndex(p => p.id === paragraph.id) - 1]?.id ?? paragraph.id,
        { blockType: 'numbered', clauseNumber: parentNum, indent: newIndent, content: '' }
      );
      requestAnimationFrame(() => { 
        const el = paragraphTextareaRefs.current[newId];
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
      });
      return;
    }
    const nextNum = incrementClauseNumber(paragraph.clauseNumber ?? '');
    // Derive indent from clause number depth: "12.34" → 0, "12.34.1" → 1, "12.34.1.1" → 2, …
    const nextIndent = Math.max(0, (nextNum.split('.').length - 2));
    const newId = onAddParagraphAfter(paragraph.id, {
      blockType: 'numbered',
      clauseNumber: nextNum,
      indent: nextIndent,
      content: '',
    });
    requestAnimationFrame(() => {
      const el = paragraphTextareaRefs.current[newId];
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
    });
  }

  function handleNumberedTab(paragraph: ParagraphData, shift: boolean) {
    if (shift) {
      // Outdent: remove last segment, increment parent
      const parts = (paragraph.clauseNumber ?? '').split('.');
      if (parts.length > 1) {
        parts.pop();
        const newNum = incrementClauseNumber(parts.join('.')) || parts.join('.');
        const newIndent = Math.max(0, newNum.split('.').length - 2);
        onUpdateParagraphFields(paragraph.id, { clauseNumber: newNum, indent: newIndent });
      }
    } else {
      // Indent: use previous numbered clause as parent, append .1
      const currentIdx = paragraphs.findIndex(p => p.id === paragraph.id);
      const prevNumbered = [...paragraphs].slice(0, currentIdx).reverse().find(p => p.blockType === 'numbered');
      if (prevNumbered) {
        const newNum = `${prevNumbered.clauseNumber ?? ''}.1`;
        const newIndent = Math.max(0, newNum.split('.').length - 2);
        onUpdateParagraphFields(paragraph.id, { clauseNumber: newNum, indent: newIndent });
      }
    }
  }

  function handleListEnter(paragraph: ParagraphData) {
    const newId = onAddParagraphAfter(paragraph.id, {
      blockType: paragraph.blockType,
      indent: paragraph.indent,
      content: '',
    });
    requestAnimationFrame(() => {
      const el = paragraphTextareaRefs.current[newId];
      if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
    });
  }

  function handleListBackspace(paragraph: ParagraphData) {
    if (paragraph.content !== '') return;
    if (lastKeyRef.current !== 'Backspace') return;
    const currentIdx = paragraphs.findIndex(p => p.id === paragraph.id);
    const prevPara = paragraphs[currentIdx - 1];
    onDeleteParagraph(paragraph.id);
    if (prevPara) {
      requestAnimationFrame(() => {
        paragraphTextareaRefs.current[prevPara.id]?.focus();
      });
    }
  }

  const handleAddParagraph = () => {
    const newId = onAddParagraph();
    // After state update, scroll to bottom and focus the new textarea
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = paragraphTextareaRefs.current[newId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        } else if (editorScrollRef.current) {
          editorScrollRef.current.scrollTop = editorScrollRef.current.scrollHeight;
        }
      });
    });
  };

  const handleAddSubComponent = () => {
    const newId = onAddSubComponentTitle?.() ?? '';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = paragraphTextareaRefs.current[newId];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.focus();
        } else if (editorScrollRef.current) {
          editorScrollRef.current.scrollTop = editorScrollRef.current.scrollHeight;
        }
      });
    });
  };

  const renderInlineTokens = (text: string, baseKey: number | string) => {
    const parts: JSX.Element[] = [];
    // Match [EMB:...], {{VAR}}, @ref, and inline HTML formatting tags <b>, <i>, <u>, <sup>, <sub>
    const regex = /(\[EMB:(\w+)\]([\s\S]*?)\[\/EMB\])|({{[\w\s]+}})|(@\[[^\]]+\]|@\w+)|(<(b|i|u|sup|sub)>([\s\S]*?)<\/\7>)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(<span key={`${baseKey}-${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
      }
      if (match[1]) {
        // Embedded variable: [EMB:ref]text[/EMB] → render as <text> in red (no ref mark)
        const innerText = match[3];
        parts.push(
          <span key={`${baseKey}-${match.index}`} className="text-[#C5143D]" style={{ fontWeight: 400 }}>
            <span className="text-[#C5143D]" style={{ fontWeight: 400 }}>&lt;</span>
            {innerText}
            <span className="text-[#C5143D]" style={{ fontWeight: 400 }}>&gt;</span>
          </span>
        );
      } else if (match[4]) {
        // {{VARIABLE}}
        parts.push(
          <span key={`${baseKey}-${match.index}`} className="text-[#C5143D] bg-red-50 px-0.5 border border-red-200">
            {match[0]}
          </span>
        );
      } else if (match[5]) {
        // @Reference — strip @ and brackets for display (shown blue+bold without prefix)
        const refDisplay = match[5].startsWith('@[') ? match[5].slice(2, -1) : match[5].slice(1);
        parts.push(
          <span key={`${baseKey}-${match.index}`} className="text-[#2563eb]" style={{ fontWeight: 700 }}>
            {refDisplay}
          </span>
        );
      } else if (match[6]) {
        // Inline formatting: <b>, <i>, <u>, <sup>, <sub>
        const tag = match[7] as 'b' | 'i' | 'u' | 'sup' | 'sub';
        const inner = match[8];
        const tagMap: Record<string, keyof JSX.IntrinsicElements> = { b: 'strong', i: 'em', u: 'u', sup: 'sup', sub: 'sub' };
        const Tag = tagMap[tag];
        parts.push(<Tag key={`${baseKey}-${match.index}`}>{inner}</Tag>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(<span key={`${baseKey}-${lastIndex}`}>{text.slice(lastIndex)}</span>);
    }
    return parts;
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-2 border-b border-[#d1d5db] bg-[#FAFAFA] flex items-center gap-1 flex-wrap">
        <button onClick={() => onUndo?.()} className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1" title="Undo">
          <Undo2 size={13} />
        </button>
        <button onClick={() => onRedo?.()} className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1" title="Redo">
          <Redo2 size={13} />
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button onClick={() => onFormatText?.('b')} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[13px] text-[#6b7280]" title="Bold">
          <strong>B</strong>
        </button>
        <button onClick={() => onFormatText?.('i')} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[13px] text-[#6b7280]" title="Italic">
          <em>I</em>
        </button>
        <button onClick={() => onFormatText?.('u')} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[13px] text-[#6b7280]" title="Underline">
          <u>U</u>
        </button>
        <button onClick={() => onFormatText?.('sup')} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[11px] text-[#6b7280]" title="Superscript">
          x<sup>2</sup>
        </button>
        <button onClick={() => onFormatText?.('sub')} className="w-7 h-7 hover:bg-[#F2F2F2] flex items-center justify-center text-[11px] text-[#6b7280]" title="Subscript">
          x<sub>2</sub>
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          H1
        </button>
        <button className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1">
          H2
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button onClick={() => onSetAlignment?.('left')} className={`px-2 h-7 text-[12px] flex items-center gap-1 transition-colors ${focusedParagraphId ? 'hover:bg-[#F2F2F2] text-[#6b7280] cursor-pointer' : 'text-[#d1d5db] cursor-default'} ${paragraphs.find(p => p.id === focusedParagraphId)?.textAlign === 'left' || !paragraphs.find(p => p.id === focusedParagraphId)?.textAlign ? 'bg-[#F2F2F2]' : ''}`} title="Align Left">
          <AlignLeft size={13} />
        </button>
        <button onClick={() => onSetAlignment?.('center')} className={`px-2 h-7 text-[12px] flex items-center gap-1 transition-colors ${focusedParagraphId ? 'hover:bg-[#F2F2F2] text-[#6b7280] cursor-pointer' : 'text-[#d1d5db] cursor-default'} ${paragraphs.find(p => p.id === focusedParagraphId)?.textAlign === 'center' ? 'bg-[#F2F2F2]' : ''}`} title="Align Center">
          <AlignCenter size={13} />
        </button>
        <button onClick={() => onSetAlignment?.('right')} className={`px-2 h-7 text-[12px] flex items-center gap-1 transition-colors ${focusedParagraphId ? 'hover:bg-[#F2F2F2] text-[#6b7280] cursor-pointer' : 'text-[#d1d5db] cursor-default'} ${paragraphs.find(p => p.id === focusedParagraphId)?.textAlign === 'right' ? 'bg-[#F2F2F2]' : ''}`} title="Align Right">
          <AlignRight size={13} />
        </button>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        <button
          title="Numbered Clause"
          onClick={() => {
            if (!focusedParagraphId) return;
            const para = paragraphs.find(p => p.id === focusedParagraphId);
            if (!para) return;
            onSetBlockType(focusedParagraphId, para.blockType === 'numbered' ? undefined : 'numbered');
          }}
          className={`px-2 h-7 text-[12px] flex items-center gap-1 transition-colors ${
            focusedParagraphId
              ? 'hover:bg-[#F2F2F2] text-[#6b7280] cursor-pointer'
              : 'text-[#d1d5db] cursor-default'
          } ${
            paragraphs.find(p => p.id === focusedParagraphId)?.blockType === 'numbered'
              ? 'bg-[#F2F2F2] text-[#1F1F1F]'
              : ''
          }`}
        >
          <ListOrdered size={13} />
        </button>
        {/* List Dropdown */}
        <div className="relative flex items-center">
          <button
            onClick={() => {
              if (focusedParagraphId) {
                const para = paragraphs.find(p => p.id === focusedParagraphId);
                if (para) {
                  onSetBlockType(focusedParagraphId, para.blockType === 'list-bullet' ? undefined : 'list-bullet');
                  return;
                }
              }
            }}
            className={`px-1.5 h-7 text-[12px] flex items-center transition-colors ${
              focusedParagraphId ? 'hover:bg-[#F2F2F2] text-[#6b7280] cursor-pointer' : 'text-[#d1d5db] cursor-default'
            } ${
              paragraphs.find(p => p.id === focusedParagraphId)?.blockType === 'list-bullet' ||
              paragraphs.find(p => p.id === focusedParagraphId)?.blockType === 'list-ordered'
                ? 'bg-[#F2F2F2] text-[#1F1F1F]' : ''
            }`}
            title="List"
            type="button"
          >
            <List size={13} />
          </button>
          <button
            onClick={() => setListDropdownOpen(o => !o)}
            className="px-0.5 h-7 hover:bg-[#F2F2F2] text-[#6b7280] flex items-center cursor-pointer"
            type="button"
          >
            <ChevronDown size={11} />
          </button>
          {listDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setListDropdownOpen(false)} />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[150px]">
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => {
                    if (focusedParagraphId) {
                      const para = paragraphs.find(p => p.id === focusedParagraphId);
                      if (para) onSetBlockType(focusedParagraphId, para.blockType === 'list-bullet' ? undefined : 'list-bullet');
                    }
                    setListDropdownOpen(false);
                  }}
                >
                  <List size={13} className="text-[#6b7280]" />
                  Bullet List
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => {
                    if (focusedParagraphId) {
                      const para = paragraphs.find(p => p.id === focusedParagraphId);
                      if (para) onSetBlockType(focusedParagraphId, para.blockType === 'list-ordered' ? undefined : 'list-ordered');
                    }
                    setListDropdownOpen(false);
                  }}
                >
                  <ListOrdered size={13} className="text-[#6b7280]" />
                  Numbered List
                </button>
              </div>
            </>
          )}
        </div>
        <span className="w-px h-5 bg-[#d1d5db] mx-1" />
        
        {/* Table Dropdown */}
        <div className="relative">
          <button 
            className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1"
            onClick={() => setTableDropdownOpen(!tableDropdownOpen)}
          >
            <Table size={13} />
            <ChevronDown size={11} />
          </button>
          
          {tableDropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setTableDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[140px]">
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => {
                    onInsertTable();
                    setTableDropdownOpen(false);
                  }}
                >
                  <Table size={13} className="text-[#6b7280]" />
                  Static Table
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => {
                    onInsertDynamicTable();
                    setTableDropdownOpen(false);
                  }}
                >
                  <Table size={13} className="text-[#6b7280]" />
                  Dynamic Table
                </button>
              </div>
            </>
          )}
        </div>

        {/* Definition Dropdown */}
        <div className="relative">
          <button
            className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1"
            onClick={() => setDefinitionDropdownOpen(!definitionDropdownOpen)}
            title="Insert Definition"
          >
            <FileText size={13} />
            <ChevronDown size={11} />
          </button>

          {definitionDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setDefinitionDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[170px]">
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => { setDefinitionDropdownOpen(false); }}
                >
                  <FileText size={13} className="text-[#6b7280]" />
                  Insert Definition
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => { setDefinitionDropdownOpen(false); }}
                >
                  <FileText size={13} className="text-[#6b7280]" />
                  Insert Defined Term
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => { setDefinitionDropdownOpen(false); }}
                >
                  <FileText size={13} className="text-[#6b7280]" />
                  Insert Definition List
                </button>
              </div>
            </>
          )}
        </div>

        {/* Guidance Dropdown */}
        <div className="relative">
          <button
            className="px-2 h-7 hover:bg-[#F2F2F2] text-[12px] text-[#6b7280] flex items-center gap-1"
            onClick={() => setGuidanceDropdownOpen(!guidanceDropdownOpen)}
            title="Insert Guidance"
          >
            <BookOpen size={13} />
            <ChevronDown size={11} />
          </button>

          {guidanceDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setGuidanceDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[180px]">
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => setGuidanceDropdownOpen(false)}
                >
                  <BookOpen size={13} className="text-[#6b7280]" />
                  Technical Guidance
                </button>
                <button
                  className="w-full px-3 py-2 text-left text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] flex items-center gap-2"
                  onClick={() => setGuidanceDropdownOpen(false)}
                >
                  <BookOpen size={13} className="text-[#6b7280]" />
                  System Guidance
                </button>
              </div>
            </>
          )}
        </div>
        
      </div>

      {/* Editor Area */}
      <div ref={editorScrollRef} className="flex-1 min-h-0 overflow-y-auto p-6 bg-white">
        <div className="max-w-[700px] mx-auto">
          {isValidated && (
            <div className="mb-4 flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700">
              <Check size={13} />
              Information Model schema validated — all required data elements present.
            </div>
          )}

          {/* Hidden textarea for legacy insert functions */}
          <textarea
            ref={textareaRef}
            className="sr-only"
            value={content}
            onChange={(e) => { onChange(e.target.value); saveCursorPosition(); }}
            onClick={saveCursorPosition}
            onKeyUp={saveCursorPosition}
          />

          {/* Paragraph Editor with Variants */}
          <div className="space-y-3">
            {paragraphs.map((paragraph, pIdx) => {
              const prevParagraph = paragraphs[pIdx - 1];
              const isSubClause = (paragraph.indent ?? 0) > 0;
              const prevIsSubClause = prevParagraph ? (prevParagraph.indent ?? 0) > 0 : false;
              const tightSpacing = isSubClause || prevIsSubClause;
              const liOrdinalIdx = (() => {
                if (paragraph.blockType !== 'list-ordered') return 1;
                let n = 1;
                for (let i = pIdx - 1; i >= 0; i--) {
                  if (paragraphs[i].blockType === 'list-ordered') n++;
                  else break;
                }
                return n;
              })();
              return (
              <div key={paragraph.id} className="space-y-2" style={tightSpacing ? { marginTop: '2px' } : {}}>
                {paragraph.blockType === 'label' ? (
                  /* Section label e.g. C12.9 */
                  <div className="flex items-start gap-2" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <AutoResizeTextarea
                      className="flex-1 bg-transparent outline-none border-none"
                      value={paragraph.content}
                      onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                      placeholder="Section label..."
                      style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '13px', fontWeight: 600, color: '#C5143D', minHeight: '20px' }}
                    />
                  </div>
                ) : paragraph.blockType === 'h1' ? (
                  /* H1 heading */
                  <div className="flex items-start gap-2" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                    <div className="flex items-center gap-1.5 pt-1">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <div className="flex-1">
                      {paragraph.titlePrefix && (
                        <div
                          className="select-none"
                          style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px', userSelect: 'none' }}
                        >
                          {paragraph.titlePrefix}
                        </div>
                      )}
                      <AutoResizeTextarea
                        className="w-full bg-transparent outline-none border-none"
                        value={paragraph.titlePrefix ? paragraph.content.replace(new RegExp(`^${paragraph.titlePrefix}\\s*`), '') : paragraph.content}
                        onChange={(val) => {
                          const full = paragraph.titlePrefix ? `${paragraph.titlePrefix} ${val}` : val;
                          onUpdateParagraph(paragraph.id, full);
                        }}
                        placeholder="Heading..."
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '18px', fontWeight: 700, color: '#1F1F1F', minHeight: '28px' }}
                      />
                    </div>
                  </div>
                ) : paragraph.blockType === 'h2' ? (
                  /* H2 heading */
                  <div className="flex items-start gap-2" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                    <div className="flex items-center gap-1.5 pt-1">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <AutoResizeTextarea
                      className="flex-1 bg-transparent outline-none border-none"
                      value={paragraph.content}
                      onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                      placeholder="Heading..."
                      style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '15px', fontWeight: 700, color: '#1F1F1F', minHeight: '24px' }}
                    />
                  </div>
                ) : paragraph.blockType === 'sub-component-title' ? (
                  /* Sub-Component title — inline editable heading */
                  <div className="flex items-start gap-2 mt-4">
                    <div className="flex items-center gap-1.5 pt-1">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <div className="flex-1">
                      <div
                        className="select-none"
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px', userSelect: 'none' }}
                      >
                        SC
                      </div>
                      <AutoResizeTextarea
                        innerRef={(el) => {
                          paragraphTextareaRefs.current[paragraph.id] = el;
                          onRegisterRef?.(paragraph.id, el);
                        }}
                        className="w-full bg-transparent outline-none border-none"
                        value={paragraph.content.replace(/^SC\s*/, '')}
                        onChange={(val) => {
                          onUpdateParagraph(paragraph.id, `SC ${val}`);
                        }}
                        onFocus={() => setFocusedParagraphId(paragraph.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') {
                            // Double backspace on empty title → delete the sub-component block
                            handleNumberedBackspace({ ...paragraph, content: paragraph.content.replace(/^SC\s*/, '') });
                          }
                          lastKeyRef.current = e.key;
                        }}
                        placeholder="Write Sub-Component Title"
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '15px', fontWeight: 700, color: '#1F1F1F', minHeight: '24px' }}
                      />
                    </div>
                  </div>
                ) : paragraph.blockType === 'numbered' ? (
                  /* Numbered clause: editable number prefix + text */
                  <>
                    <div className="group/paragraph flex items-start">
                      <div className="flex items-start gap-1.5 pt-1 shrink-0">
                        <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                      </div>
                      {/* Indent + number + text — mirrors Live Preview layout exactly */}
                      <div
                        className="flex items-start flex-1"
                        style={{ paddingLeft: `${(paragraph.indent ?? 0) * 68 + 8}px` }}
                      >
                        <div className="relative shrink-0" style={{ width: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px` }}>
                          <input
                            type="text"
                            value={paragraph.clauseNumber ?? ''}
                            onChange={(e) => onUpdateClauseNumber(paragraph.id, e.target.value)}
                            className="bg-transparent outline-none border-none text-[14px] text-[#374151] text-left w-full"
                            style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", paddingTop: '2px' }}
                            placeholder="12.34"
                            onFocus={() => setFocusedParagraphId(paragraph.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleNumberedEnter(paragraph); }
                              if (e.key === 'Tab') { e.preventDefault(); handleNumberedTab(paragraph, e.shiftKey); }
                            }}
                          />
                          {paragraph.variants && paragraph.variants.length > 0 && (
                            <span className="absolute top-0 right-0 text-[10px] text-amber-700 font-mono" style={{ paddingTop: '3px' }}>A</span>
                          )}
                        </div>
                        <div className="shrink-0" style={{ width: '12px' }} />
                        <AutoResizeTextarea
                          className="flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 text-[#1F1F1F]"
                          innerRef={(el) => {
                            paragraphTextareaRefs.current[paragraph.id] = el;
                            onRegisterRef?.(paragraph.id, el);
                          }}
                          value={paragraph.content}
                          onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                          onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0); }}
                          onSelect={trackCursor(paragraph.id)}
                          onMouseUp={trackCursor(paragraph.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') { handleNumberedBackspace(paragraph); }
                            if (e.key === 'Enter') { e.preventDefault(); handleNumberedEnter(paragraph); }
                            if (e.key === 'Tab') { e.preventDefault(); handleNumberedTab(paragraph, e.shiftKey); }
                            lastKeyRef.current = e.key;
                            trackCursor(paragraph.id)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>);
                          }}
                          placeholder="Clause text..."
                          style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px' }}
                        />
                      </div>
                    </div>
                    {paragraph.variants?.map((variant) => (
                      <div key={`${paragraph.id}-${variant.letter}`} className="group/paragraph flex items-start">
                        <div className="flex items-start gap-1.5 pt-1 shrink-0">
                          <ParagraphInlineMenu
                            paragraphId={paragraph.id}
                            variantLetter={variant.letter}
                            onCreateVariant={() => onCreateVariant(paragraph.id)}
                            onRemoveVariant={() => onRemoveVariant(paragraph.id, variant.letter)}
                          />
                        </div>
                        <div className="flex items-start flex-1" style={{ paddingLeft: `${(paragraph.indent ?? 0) * 68 + 8}px` }}>
                          <span className="text-[14px] text-[#374151] shrink-0" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", width: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px`, minWidth: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px`, paddingTop: '2px', display: 'inline-block' }}>{paragraph.clauseNumber ?? ''}</span>
                          <span className="text-[10px] text-amber-700 font-mono shrink-0" style={{ paddingTop: '3px' }}>{variant.letter}</span>
                          <div className="shrink-0" style={{ width: '12px' }} />
                          <AutoResizeTextarea
                            className="flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 text-[#1F1F1F]"
                            value={variant.content}
                            onChange={(val) => onUpdateParagraph(paragraph.id, val, variant.letter)}
                            onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0, variant.letter); }}
                            onSelect={trackCursor(paragraph.id, variant.letter)}
                            onMouseUp={trackCursor(paragraph.id, variant.letter)}
                            onKeyDown={(e) => { trackCursor(paragraph.id, variant.letter)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>); }}
                            placeholder="Variant text..."
                            style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px' }}
                          />
                        </div>
                      </div>
                    ))}
                  </>
                ) : paragraph.blockType === 'list-bullet' || paragraph.blockType === 'list-ordered' ? (
                  /* List item */
                  <>
                    <div
                      className="group/paragraph flex items-start gap-0"
                      style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}
                    >
                      <div className="flex items-start gap-1.5 pt-1 shrink-0">
                        <ParagraphInlineMenu
                          paragraphId={paragraph.id}
                          onCreateVariant={() => onCreateVariant(paragraph.id)}
                         
                        />
                      </div>
                      <span
                        className="shrink-0 text-[14px] text-[#374151] select-none"
                        style={{ width: '24px', minWidth: '24px', textAlign: 'center', paddingTop: '2px', display: 'inline-block' }}
                      >
                        {paragraph.blockType === 'list-bullet' ? '•' : `${liOrdinalIdx}.`}
                      </span>
                      {paragraph.variants && paragraph.variants.length > 0 && (
                        <span className="text-[10px] text-amber-700 font-mono shrink-0" style={{ paddingTop: '3px' }}>A</span>
                      )}
                      <AutoResizeTextarea
                        className="flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 text-[#1F1F1F]"
                        innerRef={(el) => {
                          paragraphTextareaRefs.current[paragraph.id] = el;
                          onRegisterRef?.(paragraph.id, el);
                        }}
                        value={paragraph.content}
                        onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                        onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0); }}
                        onSelect={trackCursor(paragraph.id)}
                        onMouseUp={trackCursor(paragraph.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { e.preventDefault(); handleListEnter(paragraph); }
                          if (e.key === 'Backspace') { handleListBackspace(paragraph); }
                          lastKeyRef.current = e.key;
                          trackCursor(paragraph.id)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>);
                        }}
                        placeholder="List item..."
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px' }}
                      />
                    </div>
                    {paragraph.variants?.map((variant) => (
                      <div key={`${paragraph.id}-${variant.letter}`} className="group/paragraph flex items-start gap-0" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                        <div className="flex items-start gap-1.5 pt-1 shrink-0">
                          <ParagraphInlineMenu
                            paragraphId={paragraph.id}
                            variantLetter={variant.letter}
                            onCreateVariant={() => onCreateVariant(paragraph.id)}
                            onRemoveVariant={() => onRemoveVariant(paragraph.id, variant.letter)}
                          />
                        </div>
                        <span className="shrink-0 text-[14px] text-[#374151] select-none" style={{ width: '24px', minWidth: '24px', textAlign: 'center', paddingTop: '2px', display: 'inline-block' }}>
                          {paragraph.blockType === 'list-bullet' ? '•' : `${liOrdinalIdx}.`}
                        </span>
                        <span className="text-[10px] text-amber-700 font-mono shrink-0" style={{ paddingTop: '3px' }}>{variant.letter}</span>
                        <AutoResizeTextarea
                          className="flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 text-[#1F1F1F]"
                          value={variant.content}
                          onChange={(val) => onUpdateParagraph(paragraph.id, val, variant.letter)}
                          onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0, variant.letter); }}
                          onSelect={trackCursor(paragraph.id, variant.letter)}
                          onMouseUp={trackCursor(paragraph.id, variant.letter)}
                          onKeyDown={(e) => { trackCursor(paragraph.id, variant.letter)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>); }}
                          placeholder="Variant text..."
                          style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px' }}
                        />
                      </div>
                    ))}
                  </>
                ) : paragraph.type === 'definition' ? (
                  /* Definition Block */
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <div className="flex-1 border-l-2 border-[#C5143D] bg-[#FFF8F8] px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <FileText size={11} className="text-[#C5143D] shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider text-[#C5143D] font-medium">Definition</span>
                      </div>
                      <AutoResizeTextarea
                        className="w-full bg-transparent outline-none border-none"
                        value={paragraph.content}
                        onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                        placeholder="Enter definition text..."
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '13px', color: '#374151', minHeight: '20px' }}
                        onFocus={() => setFocusedParagraphId(paragraph.id)}
                        onSelect={(e) => { const t = e.currentTarget; trackCursor(paragraph.id)(t); }}
                        onMouseUp={(e) => { const t = e.currentTarget; trackCursor(paragraph.id)(t); }}
                        onKeyDown={(e) => { const t = e.currentTarget; setTimeout(() => trackCursor(paragraph.id)(t), 0); }}
                      />
                    </div>
                  </div>
                ) : paragraph.type === 'guidance-tec' || paragraph.type === 'guidance-sys' ? (
                  /* Guidance Block */
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <ParagraphInlineMenu paragraphId={paragraph.id} onCreateVariant={() => onCreateVariant(paragraph.id)} />
                    </div>
                    <div className="flex-1 border-l-2 border-[#6b7280] bg-[#F9F9F9] px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <BookOpen size={11} className="text-[#6b7280] shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-medium">
                          {paragraph.type === 'guidance-tec' ? 'Technical Guidance' : 'System Guidance'}
                        </span>
                      </div>
                      <AutoResizeTextarea
                        className="w-full bg-transparent outline-none border-none"
                        value={paragraph.content}
                        onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                        placeholder="Enter guidance text..."
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '13px', color: '#374151', minHeight: '20px' }}
                        onFocus={() => setFocusedParagraphId(paragraph.id)}
                        onSelect={(e) => { const t = e.currentTarget; trackCursor(paragraph.id)(t); }}
                        onMouseUp={(e) => { const t = e.currentTarget; trackCursor(paragraph.id)(t); }}
                        onKeyDown={(e) => { const t = e.currentTarget; setTimeout(() => trackCursor(paragraph.id)(t), 0); }}
                      />
                    </div>
                  </div>
                ) : paragraph.type === 'table' ? (
                  /* Static Table block */
                  <div className="group/paragraph flex items-start gap-2">
                    <div className="flex items-center gap-1.5 pt-1">
                      <ParagraphInlineMenu
                        paragraphId={paragraph.id}
                        onCreateVariant={() => onCreateVariant(paragraph.id)}
                      />
                    </div>
                    <div className="flex-1">
                      {paragraph.tableData && (
                        <StaticTableBlock
                          tableData={paragraph.tableData}
                          onChange={(rows) => onUpdateTable(paragraph.id, rows)}
                          onRemove={() => onDeleteParagraph(paragraph.id)}
                        />
                      )}
                    </div>
                  </div>
                ) : paragraph.type === 'dynamic-table' ? (
                  /* Dynamic Table block */
                  <div className="group/paragraph flex items-start gap-2">
                    <div className="flex items-center gap-1.5 pt-1">
                      <ParagraphInlineMenu
                        paragraphId={paragraph.id}
                        onCreateVariant={() => onCreateVariant(paragraph.id)}
                      />
                    </div>
                    <div className="flex-1">
                      {paragraph.dynamicTableData && (
                        <DynamicTableBlock
                          rows={paragraph.dynamicTableData.rows}
                          headerOrientation={paragraph.dynamicTableData.headerOrientation ?? 'vertical'}
                          onChange={(rows) => onUpdateDynamicTable(paragraph.id, rows)}
                          onOrientationChange={(o) => onUpdateParagraphFields(paragraph.id, {
                            dynamicTableData: { ...paragraph.dynamicTableData!, headerOrientation: o },
                          })}
                          onRemove={() => onDeleteParagraph(paragraph.id)}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  /* Text paragraph (Variant A) */
                  <>
                    <div
                      className="group/paragraph flex items-start gap-2"
                      style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}
                    >
                      <div className="flex items-start gap-1.5 pt-1">
                        <ParagraphInlineMenu
                          paragraphId={paragraph.id}
                          onCreateVariant={() => onCreateVariant(paragraph.id)}
                        />
                      </div>
                      {paragraph.variants && paragraph.variants.length > 0 && (
                        <span className="text-[10px] text-amber-700 font-mono shrink-0" style={{ paddingTop: '3px' }}>A</span>
                      )}
                      <AutoResizeTextarea
                        className={`flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 ${
                          paragraph.conditional ? 'text-[#9ca3af]' : 'text-[#1F1F1F]'
                        }`}
                        innerRef={(el) => {
                          paragraphTextareaRefs.current[paragraph.id] = el;
                          onRegisterRef?.(paragraph.id, el);
                        }}
                        value={paragraph.content}
                        onChange={(val) => onUpdateParagraph(paragraph.id, val)}
                        onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0); }}
                        onSelect={trackCursor(paragraph.id)}
                        onMouseUp={trackCursor(paragraph.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace') { handleNumberedBackspace(paragraph); }
                          lastKeyRef.current = e.key;
                          trackCursor(paragraph.id)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>);
                        }}
                        placeholder="Enter paragraph text..."
                        style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px', textAlign: paragraph.textAlign ?? 'left' }}
                      />
                    </div>
                    {/* Variant B, C, D, etc. */}
                    {paragraph.variants?.map((variant) => (
                      <div key={`${paragraph.id}-${variant.letter}`} className="group/paragraph flex items-start gap-2" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                        <div className="flex items-start gap-1.5 pt-1">
                          <ParagraphInlineMenu
                            paragraphId={paragraph.id}
                            variantLetter={variant.letter}
                            onCreateVariant={() => onCreateVariant(paragraph.id)}
                            onRemoveVariant={() => onRemoveVariant(paragraph.id, variant.letter)}
                          />
                        </div>
                        <span className="text-[10px] text-amber-700 font-mono shrink-0" style={{ paddingTop: '3px' }}>
                          {variant.letter}
                        </span>
                        <AutoResizeTextarea
                          className={`flex-1 bg-transparent text-[14px] leading-relaxed outline-none border-none focus:bg-blue-50/10 ${
                            paragraph.conditional ? 'text-[#9ca3af]' : 'text-[#1F1F1F]'
                          }`}
                          value={variant.content}
                          onChange={(val) => onUpdateParagraph(paragraph.id, val, variant.letter)}
                          onFocus={() => { setFocusedParagraphId(paragraph.id); onCursorChange?.(paragraph.id, 0, 0, variant.letter); }}
                          onSelect={trackCursor(paragraph.id, variant.letter)}
                          onMouseUp={trackCursor(paragraph.id, variant.letter)}
                          onKeyDown={(e) => { trackCursor(paragraph.id, variant.letter)(e as unknown as React.SyntheticEvent<HTMLTextAreaElement>); }}
                          placeholder="Enter variant text..."
                          style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", minHeight: '28px' }}
                        />
                      </div>
                    ))}
                  </>
                )}
              </div>
              );
            })}
          </div>

          {/* Live Preview — removed from here, moved to fixed bottom panel */}

          {/* + Add element dropdown with end-of-content divider */}
          <div className="relative flex items-center justify-center mt-4 mb-6" style={{ height: '24px' }}>
            <div className="absolute inset-x-0" style={{ top: '50%', height: '0.5px', backgroundColor: '#d1d5db' }} />
            <div className="relative z-10" ref={addElementDropdownRef}>
              <button
                onClick={() => setAddElementDropdownOpen(o => !o)}
                className="w-6 h-6 flex items-center justify-center bg-white border border-[#d1d5db] hover:border-[#C5143D] hover:bg-[#F2F2F2] transition-all duration-150"
                style={{ borderRadius: '0px' }}
                title="Add element"
              >
                <Plus size={12} className="text-[#6b7280]" />
              </button>
              {addElementDropdownOpen && (
                <div
                  className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-white border border-[#d1d5db] shadow-lg z-50"
                  style={{ borderRadius: '0px', minWidth: '160px' }}
                >
                  <button
                    onClick={() => { handleAddParagraph(); setAddElementDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] transition-colors cursor-pointer whitespace-nowrap"
                    style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                  >
                    Add Paragraph
                  </button>
                  <button
                    onClick={() => { handleAddSubComponent(); setAddElementDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] transition-colors cursor-pointer whitespace-nowrap"
                    style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                  >
                    Add Sub-Component
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview — accordion at bottom */}
      <div
        className="shrink-0 border-t border-[#d1d5db] bg-[#FAFAFA] flex flex-col overflow-hidden"
        style={previewOpen ? { flex: '0 0 50%' } : {}}
      >
        {/* Toggle header */}
        <button
          onClick={() => setPreviewOpen(o => !o)}
          className="w-full flex items-center justify-between px-6 py-2 border-b border-[#e5e7eb] hover:bg-[#F2F2F2] transition-colors cursor-pointer"
          style={{ minHeight: '33px' }}
        >
          <span className="text-[11px] uppercase tracking-wider text-[#6b7280]">Live Preview</span>
          <ChevronDown
            size={13}
            className={`text-[#9ca3af] transition-transform duration-200 ${previewOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Scrollable content */}
        {previewOpen && (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-3">
            <div className="max-w-[700px] mx-auto space-y-4">
              {paragraphs.map((paragraph, pIdx) => {
                const prevParagraph = paragraphs[pIdx - 1];
                const isSubClause = (paragraph.indent ?? 0) > 0;
                const prevIsSubClause = prevParagraph ? (prevParagraph.indent ?? 0) > 0 : false;
                const tightSpacing = isSubClause || prevIsSubClause;
                const liOrdinalIdx = (() => {
                  if (paragraph.blockType !== 'list-ordered') return 1;
                  let n = 1;
                  for (let i = pIdx - 1; i >= 0; i--) {
                    if (paragraphs[i].blockType === 'list-ordered') n++;
                    else break;
                  }
                  return n;
                })();
                return (
                <div key={`preview-${paragraph.id}`} className="space-y-2" style={tightSpacing ? { marginTop: '4px' } : {}}>
                  {paragraph.blockType === 'label' ? (
                    <p style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '13px', fontWeight: 600, color: '#C5143D', margin: 0 }}>
                      {paragraph.content}
                    </p>
                  ) : paragraph.blockType === 'h1' ? (
                    <div>
                      {paragraph.titlePrefix && (
                        <div style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px' }}>
                          {paragraph.titlePrefix}
                        </div>
                      )}
                      <h1 style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '18px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>
                        {paragraph.titlePrefix ? paragraph.content.replace(new RegExp(`^${paragraph.titlePrefix}\\s*`), '') : paragraph.content}
                      </h1>
                    </div>
                  ) : paragraph.blockType === 'h2' ? (
                    <h2 style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '15px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>
                      {paragraph.content}
                    </h2>
                  ) : paragraph.blockType === 'sub-component-title' ? (
                    <div className="mt-4">
                      <div style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px' }}>SC</div>
                      <h2 style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '15px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>
                        {paragraph.content.replace(/^SC\s*/, '') || <span style={{ color: '#d1d5db', fontWeight: 400 }}>Write Sub-Component Title</span>}
                      </h2>
                    </div>
                  ) : paragraph.blockType === 'numbered' ? (
                    /* Numbered clause preview */
                    <>
                      <div
                        className="flex items-start"
                        style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 68}px` } : {}}
                      >
                        <span
                          className="shrink-0 text-[13px] text-[#374151]"
                          style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", width: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px`, minWidth: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px` }}
                        >
                          {paragraph.clauseNumber || <span className="text-[#d1d5db]">—</span>}
                        </span>
                        <div style={{ width: '12px', flexShrink: 0 }} />
                        {paragraph.variants && paragraph.variants.length > 0 && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5 mr-1.5">A</span>
                        )}
                        <div className="flex-1 text-[13px] leading-relaxed text-[#374151]">
                          {renderInlineTokens(paragraph.content, `${paragraph.id}-numbered`)}
                        </div>
                      </div>
                      {paragraph.variants?.map((variant) => (
                        <div key={`preview-${paragraph.id}-${variant.letter}`} className="flex items-start" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 68}px` } : {}}>
                          <div style={{ width: `${Math.max(56, (paragraph.clauseNumber ?? '').length * 7.5)}px`, flexShrink: 0 }} />
                          <div style={{ width: '12px', flexShrink: 0 }} />
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5 mr-1.5">{variant.letter}</span>
                          <div className="flex-1 text-[13px] leading-relaxed text-[#374151]">
                            {renderInlineTokens(variant.content, `${paragraph.id}-${variant.letter}`)}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : paragraph.blockType === 'list-bullet' || paragraph.blockType === 'list-ordered' ? (
                    /* List item preview */
                    <>
                      <div className="flex items-start" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                        <span
                          className="shrink-0 text-[13px] text-[#374151] select-none"
                          style={{ width: '24px', minWidth: '24px', textAlign: 'center' }}
                        >
                          {paragraph.blockType === 'list-bullet' ? '•' : `${liOrdinalIdx}.`}
                        </span>
                        <div className="flex-1 text-[13px] leading-relaxed text-[#374151]">
                          {renderInlineTokens(paragraph.content, `${paragraph.id}-list`)}
                        </div>
                      </div>
                      {paragraph.variants?.map((variant) => (
                        <div key={`preview-${paragraph.id}-${variant.letter}`} className="flex items-start" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                          <span className="shrink-0 text-[13px] text-[#374151] select-none" style={{ width: '24px', minWidth: '24px', textAlign: 'center' }}>
                            {paragraph.blockType === 'list-bullet' ? '•' : `${liOrdinalIdx}.`}
                          </span>
                          <div className="flex-1 text-[13px] leading-relaxed text-[#374151]">
                            {renderInlineTokens(variant.content, `${paragraph.id}-${variant.letter}-list`)}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : paragraph.type === 'definition' ? (
                    /* Definition Block preview */
                    <div className="border-l-2 border-[#C5143D] bg-[#FFF8F8] px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FileText size={11} className="text-[#C5143D] shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider text-[#C5143D] font-medium">Definition</span>
                      </div>
                      <p className="text-[13px] text-[#374151] leading-relaxed m-0">{paragraph.content}</p>
                    </div>
                  ) : paragraph.type === 'guidance-tec' || paragraph.type === 'guidance-sys' ? (
                    <div className="border-l-2 border-[#6b7280] bg-[#F9F9F9] px-3 py-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <BookOpen size={11} className="text-[#6b7280] shrink-0" />
                        <span className="text-[10px] uppercase tracking-wider text-[#6b7280] font-medium">
                          {paragraph.type === 'guidance-tec' ? 'Technical Guidance' : 'System Guidance'}
                        </span>
                      </div>
                      <p className="text-[13px] text-[#374151] leading-relaxed m-0">{paragraph.content}</p>
                    </div>
                  ) : paragraph.type === 'table' ? (
                    /* Static Table preview */
                    <div className="overflow-x-auto">
                      <table className="border-collapse border border-[#d1d5db] text-[13px]">
                        <tbody>
                          {paragraph.tableData?.rows.map((row, rIdx) => (
                            <tr key={rIdx} className={rIdx === 0 ? 'bg-[#FAFAFA]' : ''}>
                              {row.map((cell) => (
                                <td key={cell.id} className="border border-[#d1d5db] px-3 py-1.5 text-[#374151]">
                                  {cell.value || <span className="text-[#d1d5db]">&mdash;</span>}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : paragraph.type === 'dynamic-table' ? (
                    /* Dynamic Table preview */
                    <div className="overflow-x-auto">
                      {(paragraph.dynamicTableData?.headerOrientation ?? 'vertical') === 'vertical' ? (
                        <table className="w-full border-collapse border border-[#d1d5db] text-[13px]">
                          <tbody>
                            {paragraph.dynamicTableData?.rows.map((row, rIdx) => {
                              const prevMerged = paragraph.dynamicTableData!.rows[rIdx - 1]?.mergeWithNext;
                              return (
                                <tr key={row.id}>
                                  {!prevMerged && (
                                    <td
                                      className="border border-[#d1d5db] px-3 py-1.5 text-right text-[#374151]"
                                      rowSpan={row.mergeWithNext ? 2 : 1}
                                      style={{ width: '38%', backgroundColor: '#F5F5F5', fontWeight: 600, verticalAlign: 'middle' }}
                                    >
                                      {row.title || <span className="text-[#d1d5db]">&mdash;</span>}
                                    </td>
                                  )}
                                  <td className="border border-[#d1d5db] px-3 py-1.5 text-[#374151] bg-white">
                                    {row.value || <span className="text-[#d1d5db]">&mdash;</span>}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="overflow-x-auto">
                        <table className="border-collapse border border-[#d1d5db] text-[13px]" style={{ tableLayout: 'fixed', width: `${(paragraph.dynamicTableData?.rows.length ?? 1) * 160}px`, minWidth: '100%' }}>
                          <thead>
                            <tr>
                              {paragraph.dynamicTableData?.rows.map((row) => (
                                <th
                                  key={row.id}
                                  className="border border-[#d1d5db] px-3 py-1.5 text-center text-[#374151]"
                                  style={{ backgroundColor: '#F5F5F5', fontWeight: 600, width: '160px', minWidth: '160px' }}
                                >
                                  {row.title || <span className="text-[#d1d5db]">&mdash;</span>}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {paragraph.dynamicTableData?.rows.map((row) => (
                                <td key={row.id} className="border border-[#d1d5db] px-3 py-1.5 text-[#374151] bg-white" style={{ width: '160px', minWidth: '160px' }}>
                                  {row.value || <span className="text-[#d1d5db]">&mdash;</span>}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </table>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Preview of Variant A */}
                      <div
                        className="flex items-start gap-2"
                        style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}
                      >
                        {paragraph.variants && paragraph.variants.length > 0 && (
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5">
                            A
                          </span>
                        )}
                        <div className={`flex-1 text-[13px] leading-relaxed ${ paragraph.conditional ? 'text-[#9ca3af]' : 'text-[#374151]' }`} style={{ textAlign: paragraph.textAlign ?? 'left' }}>
                          {renderInlineTokens(paragraph.content, `${paragraph.id}-a`)}
                        </div>
                      </div>
                      {/* Preview of Variants B, C, D, etc. */}
                      {paragraph.variants?.map((variant) => (
                        <div key={`preview-${paragraph.id}-${variant.letter}`} className="flex items-start gap-2" style={paragraph.indent ? { paddingLeft: `${paragraph.indent * 48}px` } : {}}>
                          <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5">
                            {variant.letter}
                          </span>
                          <div className={`flex-1 text-[13px] leading-relaxed ${ paragraph.conditional ? 'text-[#9ca3af]' : 'text-[#374151]' }`}>
                            {renderInlineTokens(variant.content, `${paragraph.id}-${variant.letter}`)}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}