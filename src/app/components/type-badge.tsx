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