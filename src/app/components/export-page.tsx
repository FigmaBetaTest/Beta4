import { useState, useMemo } from 'react';
import { Download, Copy, Check } from 'lucide-react';
import {
  repositoryItems,
  dynamicRepositoryItems,
  foundationItems,
  dynamicFoundationItems,
  foundationTypeLabels,
  statusLabels,
  type RepositoryItem,
  type FoundationItem,
} from './mock-data';

type ExportFormat = 'json' | 'xml';
type ExportScope = 'all' | 'objects' | 'foundations' | 'attributes';

// ── JSON serialisation ────────────────────────────────────────────────────────

function serializeRepositoryItemJSON(item: RepositoryItem) {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    status: item.status,
    version: item.version,
    classOfBusiness: item.classOfBusiness,
    jurisdiction: item.jurisdiction,
    owner: item.owner,
    lastModified: item.lastModified,
    description: item.description ?? '',
    format: item.format ?? 'digital',
    usedIn: item.usedIn ?? [],
  };
}

function serializeFoundationItemJSON(item: FoundationItem) {
  const base: Record<string, unknown> = {
    id: item.id,
    name: item.name,
    type: item.type,
    typeLabel: foundationTypeLabels[item.type],
    status: statusLabels[item.status],
    version: item.version,
    owner: item.owner,
    lastModified: item.lastModified,
    usedIn: item.usedIn ?? [],
  };
  if (item.body) base.body = item.body;
  if (item.crossReferences) base.crossReferences = item.crossReferences;
  if (item.valueType) base.valueType = item.valueType;
  if (item.schemaColumns) base.schemaColumns = item.schemaColumns;
  if (item.rowCount !== undefined) base.rowCount = item.rowCount;
  if (item.summary) base.summary = item.summary;
  if (item.dmType) base.attributeType = item.dmType;
  if (item.dmApplicability) base.applicability = item.dmApplicability;
  if (item.wolExpression) base.wolExpression = item.wolExpression;
  return base;
}

// ── XML serialisation ─────────────────────────────────────────────────────────

function escapeXml(val: unknown): string {
  return String(val ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function xmlTag(tag: string, value: unknown, indent = 2): string {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}<${tag}/>`;
    return `${pad}<${tag}>\n${value.map(v => `${pad}  <item>${escapeXml(v)}</item>`).join('\n')}\n${pad}</${tag}>`;
  }
  return `${pad}<${tag}>${escapeXml(value)}</${tag}>`;
}

function serializeRepositoryItemXML(item: RepositoryItem): string {
  const lines = [
    `  <object id="${escapeXml(item.id)}">`,
    xmlTag('name', item.name),
    xmlTag('type', item.type),
    xmlTag('status', item.status),
    xmlTag('version', item.version),
    xmlTag('classOfBusiness', item.classOfBusiness),
    xmlTag('jurisdiction', item.jurisdiction),
    xmlTag('owner', item.owner),
    xmlTag('lastModified', item.lastModified),
    xmlTag('description', item.description ?? ''),
    xmlTag('format', item.format ?? 'digital'),
    xmlTag('usedIn', item.usedIn ?? []),
    `  </object>`,
  ];
  return lines.join('\n');
}

function serializeFoundationItemXML(item: FoundationItem, tag = 'foundation'): string {
  const lines = [
    `  <${tag} id="${escapeXml(item.id)}">`,
    xmlTag('name', item.name),
    xmlTag('type', item.type),
    xmlTag('typeLabel', foundationTypeLabels[item.type]),
    xmlTag('status', statusLabels[item.status]),
    xmlTag('version', item.version),
    xmlTag('owner', item.owner),
    xmlTag('lastModified', item.lastModified),
    xmlTag('usedIn', item.usedIn ?? []),
  ];
  if (item.body) lines.push(xmlTag('body', item.body));
  if (item.crossReferences) lines.push(xmlTag('crossReferences', item.crossReferences));
  if (item.valueType) lines.push(xmlTag('valueType', item.valueType));
  if (item.schemaColumns) lines.push(xmlTag('schemaColumns', item.schemaColumns));
  if (item.rowCount !== undefined) lines.push(xmlTag('rowCount', item.rowCount));
  if (item.summary) lines.push(xmlTag('summary', item.summary));
  if (item.dmType) lines.push(xmlTag('attributeType', item.dmType));
  if (item.dmApplicability) lines.push(xmlTag('applicability', item.dmApplicability));
  if (item.wolExpression) lines.push(xmlTag('wolExpression', item.wolExpression));
  lines.push(`  </${tag}>`);
  return lines.join('\n');
}

// ── Build export payload ──────────────────────────────────────────────────────

function buildPayloadObject(scope: ExportScope): Record<string, unknown> {
  const allObjects = [...repositoryItems, ...dynamicRepositoryItems];
  const allFoundations = [...foundationItems, ...dynamicFoundationItems].filter(i => i.type !== 'ATT');
  const allAttributes = [...foundationItems, ...dynamicFoundationItems].filter(i => i.type === 'ATT');
  const payload: Record<string, unknown> = {
    exportedAt: new Date().toISOString(),
    generator: 'Wording Objects Library v0.5',
  };
  if (scope === 'all' || scope === 'objects') payload.objects = allObjects.map(serializeRepositoryItemJSON);
  if (scope === 'all' || scope === 'foundations') payload.foundations = allFoundations.map(serializeFoundationItemJSON);
  if (scope === 'all' || scope === 'attributes') payload.attributes = allAttributes.map(serializeFoundationItemJSON);
  return payload;
}

function buildPayloadXML(scope: ExportScope): string {
  const allObjects = [...repositoryItems, ...dynamicRepositoryItems];
  const allFoundations = [...foundationItems, ...dynamicFoundationItems].filter(i => i.type !== 'ATT');
  const allAttributes = [...foundationItems, ...dynamicFoundationItems].filter(i => i.type === 'ATT');
  const today = new Date().toISOString();
  const sections: string[] = [];
  sections.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  sections.push(`<wolExport exportedAt="${escapeXml(today)}" generator="Wording Objects Library v0.5">`);
  if (scope === 'all' || scope === 'objects') {
    sections.push(`  <objects count="${allObjects.length}">`);
    sections.push(...allObjects.map(serializeRepositoryItemXML));
    sections.push(`  </objects>`);
  }
  if (scope === 'all' || scope === 'foundations') {
    sections.push(`  <foundations count="${allFoundations.length}">`);
    sections.push(...allFoundations.map(i => serializeFoundationItemXML(i, 'foundation')));
    sections.push(`  </foundations>`);
  }
  if (scope === 'all' || scope === 'attributes') {
    sections.push(`  <attributes count="${allAttributes.length}">`);
    sections.push(...allAttributes.map(i => serializeFoundationItemXML(i, 'attribute')));
    sections.push(`  </attributes>`);
  }
  sections.push(`</wolExport>`);
  return sections.join('\n');
}

// ── JSON Tree Viewer ──────────────────────────────────────────────────────────

const MONO = { fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace", fontSize: 12 } as const;

function JsonPrimitive({ value }: { value: unknown }) {
  if (value === null)            return <span style={{ ...MONO, color: '#9ca3af' }}>null</span>;
  if (typeof value === 'boolean') return <span style={{ ...MONO, color: '#d97706' }}>{String(value)}</span>;
  if (typeof value === 'number')  return <span style={{ ...MONO, color: '#2563eb' }}>{value}</span>;
  return <span style={{ ...MONO, color: '#059669' }}>"<span style={{ color: '#059669' }}>{String(value)}</span>"</span>;
}

function JsonNode({
  nodeKey,
  value,
  depth,
  isLast,
}: {
  nodeKey?: string;
  value: unknown;
  depth: number;
  isLast: boolean;
}) {
  const isComplex = value !== null && typeof value === 'object';
  const [open, setOpen] = useState(depth < 2);

  const comma = !isLast ? <span style={{ ...MONO, color: '#9ca3af' }}>,</span> : null;

  const keyEl = nodeKey !== undefined ? (
    <span style={{ ...MONO, color: '#4b5563', fontWeight: 600 }}>"{nodeKey}"<span style={{ ...MONO, color: '#9ca3af', fontWeight: 400 }}>: </span></span>
  ) : null;

  if (!isComplex) {
    return (
      <div style={{ lineHeight: '22px' }}>
        {keyEl}<JsonPrimitive value={value} />{comma}
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries = isArr
    ? (value as unknown[])
    : Object.entries(value as Record<string, unknown>);
  const count = entries.length;
  const open0 = isArr ? '[' : '{';
  const close0 = isArr ? ']' : '}';

  if (count === 0) {
    return (
      <div style={{ lineHeight: '22px' }}>
        {keyEl}<span style={{ ...MONO, color: '#9ca3af' }}>{open0}{close0}</span>{comma}
      </div>
    );
  }

  return (
    <div>
      {/* Row with toggle + key + opening bracket */}
      <div style={{ lineHeight: '22px', display: 'flex', alignItems: 'center' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            ...MONO, color: '#9ca3af', background: 'none', border: 'none',
            padding: '0 4px 0 0', cursor: 'pointer', userSelect: 'none', flexShrink: 0,
          }}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▾' : '▸'}
        </button>
        {keyEl}
        <span style={{ ...MONO, color: '#6b7280' }}>{open0}</span>
        {!open && (
          <>
            <span
              onClick={() => setOpen(true)}
              style={{ ...MONO, color: '#9ca3af', fontStyle: 'italic', marginLeft: 6, cursor: 'pointer' }}
            >
              {count} {isArr ? (count === 1 ? 'item' : 'items') : (count === 1 ? 'key' : 'keys')}
            </span>
            <span style={{ ...MONO, color: '#6b7280', marginLeft: 6 }}>{close0}</span>
            {comma}
          </>
        )}
      </div>

      {/* Children with vertical guide line */}
      {open && (
        <>
          <div style={{ borderLeft: '1px solid #e5e7eb', marginLeft: 11, paddingLeft: 14 }}>
            {entries.map((entry, i) => {
              const [k, v] = isArr
                ? [undefined, entry as unknown]
                : (entry as [string, unknown]);
              return (
                <JsonNode
                  key={isArr ? i : (k as string)}
                  nodeKey={k as string | undefined}
                  value={v}
                  depth={depth + 1}
                  isLast={i === entries.length - 1}
                />
              );
            })}
          </div>
          <div style={{ lineHeight: '22px' }}>
            <span style={{ ...MONO, color: '#6b7280' }}>{close0}</span>{comma}
          </div>
        </>
      )}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ExportPage() {
  const [format, setFormat] = useState<ExportFormat>('json');
  const [scope, setScope] = useState<ExportScope>('all');
  const [copied, setCopied] = useState(false);

  const payloadObject = useMemo(() => buildPayloadObject(scope), [scope]);
  const payloadXML = useMemo(() => buildPayloadXML(scope), [scope]);
  const payloadString = format === 'json'
    ? JSON.stringify(payloadObject, null, 2)
    : payloadXML;

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : 'xml';
    const mime = format === 'json' ? 'application/json' : 'application/xml';
    const date = new Date().toISOString().split('T')[0];
    const blob = new Blob([payloadString], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wol-export-${date}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xmlLineCount = payloadXML.split('\n').length;

  const scopeOptions: { value: ExportScope; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'objects', label: 'Objects' },
    { value: 'foundations', label: 'Foundations' },
    { value: 'attributes', label: 'Attributes' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] text-[#1F1F1F] leading-[90%]">WOL Export</h1>
          <p className="text-[13px] text-[#6b7280] mt-1">View and download the full repository in structured format</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-colors"
          >
            <Download size={14} />
            Download
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-6 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#6b7280] uppercase tracking-wider">Format</span>
          <div className="flex">
            {(['json', 'xml'] as ExportFormat[]).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`px-4 py-1.5 text-[13px] font-mono border transition-colors ${
                  format === f
                    ? 'bg-[#1F1F1F] text-white border-[#1F1F1F]'
                    : 'bg-white text-[#6b7280] border-[#d1d5db] hover:text-[#1F1F1F]'
                }`}
              >
                {f.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[12px] text-[#6b7280] uppercase tracking-wider">Scope</span>
          <div className="flex">
            {scopeOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setScope(opt.value)}
                className={`px-4 py-1.5 text-[13px] border-y border-r first:border-l transition-colors ${
                  scope === opt.value
                    ? 'bg-[#C5143D] text-white border-[#C5143D]'
                    : 'bg-white text-[#6b7280] border-[#d1d5db] hover:text-[#1F1F1F]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {format === 'xml' && (
          <span className="ml-auto text-[12px] text-[#9ca3af]">{xmlLineCount.toLocaleString()} lines</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto border border-[#d1d5db] bg-[#FAFAFA] p-4">
        {format === 'json' ? (
          <div key={scope}>
            <JsonNode value={payloadObject} depth={0} isLast />
          </div>
        ) : (
          <pre
            className="text-[12px] leading-[1.6] text-[#1F1F1F] min-w-max"
            style={{ fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace" }}
          >
            {payloadXML}
          </pre>
        )}
      </div>
    </div>
  );
}
