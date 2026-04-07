import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown } from 'lucide-react';

interface ParagraphInlineMenuProps {
  paragraphId: string;
  variantLetter?: string;
  onCreateVariant: () => void;
  onRemoveVariant?: () => void;
}

export function ParagraphInlineMenu({ 
  paragraphId, 
  variantLetter,
  onCreateVariant, 
  onRemoveVariant,
}: ParagraphInlineMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Only show "Create Variant" for base paragraph (no variantLetter)
  // Show "Remove Variant" for variant paragraphs (has variantLetter)
  const showCreateVariant = !variantLetter;
  const showRemoveVariant = !!variantLetter && onRemoveVariant;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-6 h-6 flex items-center justify-center bg-white border border-[#d1d5db] hover:border-[#C5143D] hover:bg-[#F2F2F2] transition-all duration-150 opacity-0 group-hover/paragraph:opacity-100"
        style={{ borderRadius: '0px' }}
      >
        <Plus size={12} className="text-[#6b7280]" />
      </button>
      
      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-1 bg-white border border-[#d1d5db] shadow-lg z-50 w-max"
          style={{ borderRadius: '0px' }}
        >
          {showCreateVariant && (
            <button
              onClick={() => {
                onCreateVariant();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[12px] text-[#1F1F1F] hover:bg-[#F2F2F2] transition-colors cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              Create Variant
            </button>
          )}
          {showRemoveVariant && (
            <button
              onClick={() => {
                onRemoveVariant();
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[12px] text-[#C5143D] hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
              style={{ fontFamily: 'var(--font-family)' }}
            >
              Remove Variant
            </button>
          )}
        </div>
      )}
    </div>
  );
}
