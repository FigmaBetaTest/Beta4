import React, { useRef, useCallback } from 'react';
import { Save } from 'lucide-react';

interface ConditionCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: string;
  onSave?: () => void;
  activeCount?: number;
  headerLabel?: string;
}

export function ConditionCodeEditor({ value, onChange, minHeight = '180px', onSave, activeCount, headerLabel }: ConditionCodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = Math.max(lines.length, 1);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-1 bg-[#F2F2F2] border border-[#d1d5db] border-b-0">
        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider">{headerLabel || 'conditions.wol'}</span>
        {activeCount != null && activeCount > 0 && (
          <span className="text-[10px] text-[#C5143D]">{activeCount} active</span>
        )}
      </div>

      {/* Editor with line numbers */}
      <div
        className="flex border border-[#d1d5db] border-t-0 bg-white"
        style={{ borderRadius: '0px', minHeight }}
      >
        {/* Line numbers gutter */}
        <div
          ref={lineNumbersRef}
          className="shrink-0 bg-[#FAFAFA] border-r border-[#e5e7eb] select-none overflow-hidden"
          style={{
            minHeight,
            padding: '12px 0',
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div
              key={i}
              className="text-right text-[#b0b0b0] px-2"
              style={{
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: '11px',
                lineHeight: '1.6',
                minWidth: '28px',
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          className="flex-1 bg-white text-[#6b7280] text-[11px] p-3 outline-none resize-none border-none"
          style={{
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
            fontSize: '11px',
            lineHeight: '1.6',
            minHeight,
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

      {/* Apply button */}
      {onSave && (
        <button
          className="flex items-center justify-center gap-1 px-2 py-[3px] mt-1.5 text-[11px] bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer ml-auto"
          style={{ borderRadius: '0px', border: 'none' }}
          onClick={onSave}
        >
          <Save size={10} /> Apply
        </button>
      )}
    </div>
  );
}