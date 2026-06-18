import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { ItemType, ItemStatus } from './mock-data';
import { statusLabels } from './mock-data';

const typeColors: Record<ItemType, string> = {
  'Contract': 'bg-blue-50 text-blue-700 border-blue-200',
  'Component-Group': 'bg-amber-50 text-amber-700 border-amber-200',
  'Component': 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusColors: Record<ItemStatus, string> = {
  'DRAFT': 'text-gray-600',
  'PENDING_APPROVAL': 'text-amber-700',
  'ACTIVE': 'text-emerald-700',
  'ARCHIVED': 'text-blue-600',
  'WITHDRAWN': 'text-red-700',
};

const statusDotColors: Record<ItemStatus, string> = {
  'DRAFT': 'bg-gray-500',
  'PENDING_APPROVAL': 'bg-amber-500',
  'ACTIVE': 'bg-emerald-500',
  'ARCHIVED': 'bg-blue-500',
  'WITHDRAWN': 'bg-red-500',
};

const typeLabels: Record<ItemType, string> = {
  'Contract': 'CNT',
  'Component-Group': 'CPG',
  'Component': 'CMP',
};

export function TypeBadge({ type }: { type: ItemType }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-mono border ${typeColors[type]}`}>
      {typeLabels[type]}
    </span>
  );
}

export function StatusBadge({ status, version }: { status: ItemStatus; version?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] ${statusColors[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[status]}`} />
      {statusLabels[status]}
      {version && <span className="text-[#6b7280]">• v{version}</span>}
    </span>
  );
}

const MOCK_VERSIONS = [
  { version: '0.1.0', date: '2026-06-18', status: 'Current' },
  { version: '0.0.3', date: '2026-05-14', status: 'Archived' },
  { version: '0.0.2', date: '2026-04-02', status: 'Archived' },
  { version: '0.0.1', date: '2026-02-11', status: 'Archived' },
];

export function VersionDropdown({ version }: { version: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] text-[#6b7280] hover:bg-[#F2F2F2] transition-colors"
        style={{ border: 'none', background: 'none', cursor: 'pointer' }}
      >
        v{version}
        <ChevronDown size={10} />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
            background: '#fff', border: '1px solid #d1d5db', minWidth: 140,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          {MOCK_VERSIONS.map(v => (
            <div
              key={v.version}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderBottom: '1px solid #f9fafb',
                cursor: 'pointer',
              }}
              className="hover:bg-[#F2F2F2]"
            >
              {v.version === version
                ? <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d', flexShrink: 0, display: 'inline-block' }} />
                : <span style={{ width: 6, height: 6, flexShrink: 0, display: 'inline-block' }} />
              }
              <span style={{ fontFamily: "'DM Mono', Consolas, monospace", fontSize: 12, color: '#1F1F1F' }}>v{v.version}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function VariationBadge({ variation }: { variation: string }) {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] bg-amber-100 text-amber-800 border border-amber-300" style={{ fontFamily: 'var(--font-family)' }}>
      {variation}
    </span>
  );
}

export function VariationBadges({ variations }: { variations: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {variations.map((v) => (
        <VariationBadge key={v} variation={v} />
      ))}
    </span>
  );
}

export function OptionalBadge() {
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 text-[11px] bg-gray-100 text-gray-600 border border-gray-300 italic" style={{ fontFamily: 'var(--font-family)' }}>
      Optional
    </span>
  );
}