import { useState, useMemo } from 'react';
import { Copy, Check, Code2, ImageDown, FileText } from 'lucide-react';
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

function buildPayloadObject(): Record<string, unknown> {
  const allObjects = [...repositoryItems, ...dynamicRepositoryItems];
  return {
    exportedAt: new Date().toISOString(),
    generator: 'Wording Objects Library v0.5',
    objects: allObjects.map(serializeRepositoryItemJSON),
  };
}

function buildPayloadXML(): string {
  const allObjects = [...repositoryItems, ...dynamicRepositoryItems];
  const today = new Date().toISOString();
  const sections: string[] = [];
  sections.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  sections.push(`<wolExport exportedAt="${escapeXml(today)}" generator="Wording Objects Library v0.5">`);
  sections.push(`  <objects count="${allObjects.length}">`);
  sections.push(...allObjects.map(serializeRepositoryItemXML));
  sections.push(`  </objects>`);
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

// ── Schema JSON ──────────────────────────────────────────────────────────────

const SCHEMA_JSON = JSON.stringify({
  components: {
    schemas: {
      Object: {
        description: "Object is of the types listed below.",
        required: ["objectType"],
        properties: {
          objectType: { type: "string", enum: ["Contract", "Component-Group", "Component"] },
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "ARCHIVED", "WITHDRAWN"] },
          version: { type: "string", example: "1.0.0" },
          classOfBusiness: { type: "string" },
          jurisdiction: { type: "string" },
          owner: { type: "string" },
          lastModified: { type: "string", format: "date" },
          description: { type: "string" },
          format: { type: "string", enum: ["digital", "analogue"] },
          usedIn: { type: "array", items: { type: "string" } },
        },
      },
      Contract: {
        allOf: [
          { $ref: "#/components/schemas/Object" },
          {
            properties: {
              objectType: { type: "string", enum: ["Contract"] },
              sections: { type: "array", items: { $ref: "#/components/schemas/ContractSection" } },
            },
          },
        ],
      },
      ComponentGroup: {
        allOf: [
          { $ref: "#/components/schemas/Object" },
          {
            properties: {
              objectType: { type: "string", enum: ["Component-Group"] },
              sections: { type: "array", items: { $ref: "#/components/schemas/ContractSection" } },
            },
          },
        ],
      },
      Component: {
        allOf: [
          { $ref: "#/components/schemas/Object" },
          {
            properties: {
              objectType: { type: "string", enum: ["Component"] },
              heading: { $ref: "#/components/schemas/HeadingDataElement" },
              text: { $ref: "#/components/schemas/TextDataElement" },
              variations: { type: "array", items: { $ref: "#/components/schemas/Variant" } },
            },
          },
        ],
      },
      ContractSection: {
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          components: { type: "array", items: { $ref: "#/components/schemas/Component" } },
        },
      },
      HeadingDataElement: {
        properties: {
          id: { type: "string" },
          content: { type: "string" },
          level: { type: "integer", minimum: 1, maximum: 6 },
        },
      },
      TextDataElement: {
        properties: {
          id: { type: "string" },
          content: { type: "string" },
          format: { type: "string", enum: ["plain", "rich"] },
        },
      },
      Variant: {
        properties: {
          id: { type: "string" },
          label: { type: "string" },
          condition: { type: "string" },
          text: { $ref: "#/components/schemas/TextDataElement" },
        },
      },
      MetadataItem: {
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          type: { type: "string", enum: ["DEF", "GV", "LOV", "TEC", "SYS", "ATT"] },
          status: { type: "string", enum: ["DRAFT", "PENDING_APPROVAL", "ACTIVE", "ARCHIVED", "WITHDRAWN"] },
          version: { type: "string" },
          body: { type: "string" },
          wolExpression: { type: "string" },
        },
      },
    },
  },
}, null, 2);

// ── Schema YAML ──────────────────────────────────────────────────────────────

const SCHEMA_YAML = `components:
  schemas:
    Object:
      description: Object is of the types listed below.
      required:
        - objectType
      properties:
        objectType:
          type: string
          enum: [CON, CGP, CMP, HDG, TXT]
      discriminator:
        propertyName: objectType
      oneOf:
        - title: Contract
          $ref: '#/components/schemas/Contract'
        - title: Component group
          $ref: '#/components/schemas/ComponentGroup'
        - title: (Clause) Component
          $ref: '#/components/schemas/Component'
        - title: Heading data element
          $ref: '#/components/schemas/HeadingDataElement'
        - title: Text data element
          $ref: '#/components/schemas/TextDataElement'

    Contract:
      description: Represents a full contract container. Only supports direct content.
      type: object
      required:
        - id
        - vqi
        - majorVersion
        - minorVersion
        - createdAt
        - createdBy
        - lastUpdatedAt
        - lastUpdatedBy
        - objectType
        - content
      properties:
        # --- Base Properties ---
        id:
          type: string
        vqi:
          type: string
        majorVersion:
          type: integer
        minorVersion:
          type: integer
        createdAt:
          type: string
          format: date-time
        createdBy:
          type: string
        lastUpdatedAt:
          type: string
          format: date-time
        lastUpdatedBy:
          type: string
        objectType:
          type: string
          const: CON

        # --- Business Properties ---
        title:
          description: XHTML fragment — title of the contract.
          type: string
        content:
          type: array
          items:
            oneOf:
              - $ref: '#/components/schemas/ComponentGroup'
              - $ref: '#/components/schemas/Component'
              - $ref: '#/components/schemas/TextDataElement'
              - $ref: '#/components/schemas/HeadingDataElement'

        # --- Conditionality, Optionality, Analogue & Metadata ---
        includeIf:
          type: string
        optionalIf:
          type: string
        analogueMediaType:
          type: string
        analogueDisplayName:
          type: string
        analogueFileUrl:
          type: string
        metadata:
          type: array
          items:
            $ref: '#/components/schemas/MetadataItem'

        # --- Lifecycle ---
        lifecycleState:
          type: string
          enum: [DRAFT, PENDING_PUBLICATION, ACTIVE, DEPRECATED, ARCHIVED, WITHDRAWN]
        publishedAt:
          type: string
          format: date-time
        versionNote:
          type: string

    ComponentGroup:
      description: A container used to group components or nested sub-groups. Only supports direct content.
      type: object
      required:
        - id
        - vqi
        - majorVersion
        - minorVersion
        - createdAt
        - createdBy
        - lastUpdatedAt
        - lastUpdatedBy
        - objectType
        - content
      properties:
        # --- Base Properties ---
        id:
          type: string
        vqi:
          type: string
        majorVersion:
          type: integer
        minorVersion:
          type: integer
        createdAt:
          type: string
          format: date-time
        createdBy:
          type: string
        lastUpdatedAt:
          type: string
          format: date-time
        lastUpdatedBy:
          type: string
        objectType:
          type: string
          const: CGP

        # --- Business Properties ---
        heading:
          description: XHTML fragment — the title of the group.
          type: string
        content:
          type: array
          items:
            oneOf:
              - $ref: '#/components/schemas/ComponentGroup'
              - $ref: '#/components/schemas/Component'

        # --- Conditionality, Optionality, Analogue & Metadata ---
        includeIf:
          type: string
        optionalIf:
          type: string
        analogueMediaType:
          type: string
        analogueDisplayName:
          type: string
        analogueFileUrl:
          type: string
        metadata:
          type: array
          items:
            $ref: '#/components/schemas/MetadataItem'

        # --- Lifecycle ---
        lifecycleState:
          type: string
          enum: [DRAFT, PENDING_PUBLICATION, ACTIVE, DEPRECATED, ARCHIVED, WITHDRAWN]
        publishedAt:
          type: string
          format: date-time
        versionNote:
          type: string

    Component:
      description: A distinct clause or sub-clause item. Flattened with strict content vs variant mutually exclusive rules.
      allOf:
        - type: object
          required:
            - id
            - vqi
            - majorVersion
            - minorVersion
            - createdAt
            - createdBy
            - lastUpdatedAt
            - lastUpdatedBy
            - objectType
            - componentType
          properties:
            # --- Base Properties ---
            id:
              type: string
            vqi:
              type: string
            majorVersion:
              type: integer
            minorVersion:
              type: integer
            createdAt:
              type: string
              format: date-time
            createdBy:
              type: string
            lastUpdatedAt:
              type: string
              format: date-time
            lastUpdatedBy:
              type: string
            objectType:
              type: string
              const: CMP
            componentType:
              type: string
              enum: [COMPONENT, SUB_COMPONENT]

            # --- Conditionality, Optionality, Analogue & Metadata ---
            includeIf:
              type: string
            optionalIf:
              type: string
            analogueMediaType:
              type: string
            analogueDisplayName:
              type: string
            analogueFileUrl:
              type: string
            metadata:
              type: array
              items:
                $ref: '#/components/schemas/MetadataItem'

            # --- Lifecycle ---
            lifecycleState:
              type: string
              enum: [DRAFT, PENDING_PUBLICATION, ACTIVE, DEPRECATED, ARCHIVED, WITHDRAWN]
            publishedAt:
              type: string
              format: date-time
            versionNote:
              type: string
        - oneOf:
            # Scenario A: Direct content array only
            - required:
                - content
              properties:
                content:
                  type: array
                  items:
                    oneOf:
                      - $ref: '#/components/schemas/Component'
                      - $ref: '#/components/schemas/TextDataElement'
              not:
                required: [variants]
            # Scenario B: Variants array only
            - required:
                - variants
                - variantMode
              properties:
                variantMode:
                  type: string
                  enum: [conditional, user_select]
                variants:
                  type: array
                  items:
                    $ref: '#/components/schemas/Variant'
              not:
                required: [content]

    HeadingDataElement:
      description: A heading element that handles content vs variant mutually exclusive blocks.
      allOf:
        - type: object
          required:
            - id
            - vqi
            - majorVersion
            - minorVersion
            - createdAt
            - createdBy
            - lastUpdatedAt
            - lastUpdatedBy
            - objectType
          properties:
            id:
              type: string
            vqi:
              type: string
            majorVersion:
              type: integer
            minorVersion:
              type: integer
            createdAt:
              type: string
              format: date-time
            createdBy:
              type: string
            lastUpdatedAt:
              type: string
              format: date-time
            lastUpdatedBy:
              type: string
            objectType:
              type: string
              const: HDG
            numbered:
              type: boolean
            body:
              description: XHTML fragment — heading text.
              type: string
            includeIf:
              type: string
            optionalIf:
              type: string
        - oneOf:
            - required:
                - content
              properties:
                content:
                  type: array
                  items:
                    type: object
              not:
                required: [variants]
            - required:
                - variants
                - variantMode
              properties:
                variantMode:
                  type: string
                  enum: [conditional, user_select]
                variants:
                  type: array
                  items:
                    $ref: '#/components/schemas/Variant'
              not:
                required: [content]

    TextDataElement:
      description: A pure text element that handles content vs variant mutually exclusive blocks.
      allOf:
        - type: object
          required:
            - id
            - vqi
            - majorVersion
            - minorVersion
            - createdAt
            - createdBy
            - lastUpdatedAt
            - lastUpdatedBy
            - objectType
          properties:
            id:
              type: string
            vqi:
              type: string
            majorVersion:
              type: integer
            minorVersion:
              type: integer
            createdAt:
              type: string
              format: date-time
            createdBy:
              type: string
            lastUpdatedAt:
              type: string
              format: date-time
            lastUpdatedBy:
              type: string
            objectType:
              type: string
              const: TXT
            numbered:
              type: boolean
            body:
              description: XHTML fragment — paragraph text.
              type: string
            includeIf:
              type: string
            optionalIf:
              type: string
        - oneOf:
            - required:
                - content
              properties:
                content:
                  type: array
                  items:
                    type: object
              not:
                required: [variants]
            - required:
                - variants
                - variantMode
              properties:
                variantMode:
                  type: string
                  enum: [conditional, user_select]
                variants:
                  type: array
                  items:
                    $ref: '#/components/schemas/Variant'
              not:
                required: [content]

    Variant:
      description: Alternative content block used inside content containers.
      type: object
      required:
        - variantId
      properties:
        variantId:
          type: string
        label:
          type: string
        includeIf:
          type: string
        content:
          type: array
          items:
            type: object
        body:
          type: string

    MetadataItem:
      type: object
      properties:
        fieldId:
          type: string
        name:
          type: string
        type:
          type: string
        value:
          type: string`;

// ── YAML Tree Viewer ──────────────────────────────────────────────────────────

const Y = {
  bg: '#FAFAFA',
  lineNum: '#9ca3af',
  key: '#C5143D',
  val: '#15803d',
  ref: '#7c3aed',
  cmt: '#9ca3af',
  pun: '#6b7280',
  guide: '#e5e7eb',
  toggle: '#9ca3af',
  mono: "'DM Mono', 'Fira Mono', Consolas, monospace",
} as const;

interface YNode { lineNum: number; raw: string; indent: number; children: YNode[] }

function buildYamlTree(yaml: string): YNode[] {
  const lines = yaml.split('\n');
  const root: YNode = { lineNum: 0, raw: '', indent: -2, children: [] };
  const stack: YNode[] = [root];
  lines.forEach((raw, i) => {
    const stripped = raw.trimStart();
    const indent = raw.length - stripped.length;
    const node: YNode = { lineNum: i + 1, raw, indent, children: [] };
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) stack.pop();
    stack[stack.length - 1].children.push(node);
    stack.push(node);
  });
  return root.children;
}

function YamlInline({ raw }: { raw: string }) {
  const trimmed = raw.trimStart();
  if (!trimmed) return null;
  if (trimmed.startsWith('#')) return <span style={{ color: Y.cmt }}>{raw}</span>;

  let pfx = '';
  let body = trimmed;
  const dash = trimmed.match(/^(-\s+)([\s\S]*)$/);
  if (dash) { pfx = dash[1]; body = dash[2]; }

  if (body.startsWith('$ref:')) {
    const val = body.slice(5);
    return <><span style={{ color: Y.key }}>$ref</span><span style={{ color: Y.pun }}>:</span><span style={{ color: Y.ref }}>{val}</span></>;
  }

  const ci = body.indexOf(':');
  if (ci > 0) {
    const key = body.slice(0, ci);
    const after = body.slice(ci + 1);
    const hIdx = after.indexOf(' #');
    const valStr = hIdx >= 0 ? after.slice(0, hIdx) : after;
    const cmtStr = hIdx >= 0 ? after.slice(hIdx) : '';
    return (
      <>
        {pfx && <span style={{ color: Y.pun }}>{pfx}</span>}
        <span style={{ color: Y.key }}>{key}</span>
        <span style={{ color: Y.pun }}>:</span>
        {valStr && <span style={{ color: Y.val }}>{valStr}</span>}
        {cmtStr && <span style={{ color: Y.cmt }}>{cmtStr}</span>}
      </>
    );
  }
  return <><span style={{ color: Y.pun }}>{pfx}</span><span style={{ color: Y.val }}>{body}</span></>;
}

function YNodeRow({ node, depth, totalLines }: { node: YNode; depth: number; totalLines: number }) {
  const hasChildren = node.children.length > 0;
  const [open, setOpen] = useState(depth < 3);
  const lineNumWidth = String(totalLines).length * 9 + 24;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'flex-start', lineHeight: '22px', minHeight: 22 }}>
        {/* Line number */}
        <div style={{
          width: lineNumWidth, minWidth: lineNumWidth, textAlign: 'right',
          paddingRight: 16, paddingLeft: 12, color: Y.lineNum,
          fontFamily: Y.mono, fontSize: 11, userSelect: 'none', flexShrink: 0,
        }}>
          {node.lineNum}
        </div>

        {/* Guide lines for ancestor depths */}
        {Array.from({ length: depth }).map((_, d) => (
          <div key={d} style={{ width: 20, flexShrink: 0, position: 'relative', alignSelf: 'stretch' }}>
            <div style={{ position: 'absolute', left: 9, top: 0, bottom: 0, borderLeft: `1px solid ${Y.guide}` }} />
          </div>
        ))}

        {/* Toggle or spacer */}
        <div style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center', paddingTop: 1 }}>
          {hasChildren && (
            <button
              onClick={() => setOpen(o => !o)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: Y.toggle, padding: 0, fontSize: 10, lineHeight: 1, userSelect: 'none' }}
            >
              {open ? '▾' : '▸'}
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ fontFamily: Y.mono, fontSize: 12, lineHeight: '22px', whiteSpace: 'pre', flex: 1, paddingRight: 24 }}>
          <YamlInline raw={node.raw} />
          {!open && hasChildren && (
            <span
              onClick={() => setOpen(true)}
              style={{ color: Y.toggle, fontStyle: 'italic', cursor: 'pointer', marginLeft: 6, fontSize: 11 }}
            >
              … {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      </div>

      {open && node.children.map((child, i) => (
        <YNodeRow key={i} node={child} depth={depth + 1} totalLines={totalLines} />
      ))}
    </>
  );
}

function YamlTreeView({ yaml }: { yaml: string }) {
  const nodes = useMemo(() => buildYamlTree(yaml), [yaml]);
  const totalLines = yaml.split('\n').length;
  return (
    <div style={{ background: Y.bg, height: '100%', overflowY: 'auto', overflowX: 'auto', paddingTop: 8, paddingBottom: 8 }}>
      {nodes.map((node, i) => (
        <YNodeRow key={i} node={node} depth={0} totalLines={totalLines} />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type PageTab = 'schema' | 'visualization' | 'guidance';

export function ExportPage() {
  const [pageTab, setPageTab] = useState<PageTab>('schema');
  const [copied, setCopied] = useState(false);
  const [schemaFormat, setSchemaFormat] = useState<'yaml' | 'json'>('yaml');

  const handleDownload = () => {
    const date = new Date().toISOString().split('T')[0];
    if (schemaFormat === 'yaml') {
      const blob = new Blob([SCHEMA_YAML], { type: 'application/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `wol-schema-${date}.yaml`; a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([SCHEMA_JSON], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `wol-schema-${date}.json`; a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(SCHEMA_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-[22px] text-[#1F1F1F] leading-[90%]">Schema</h1>
          <p className="text-[13px] text-[#6b7280] mt-1">View and download the repository schema</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0 mb-4 border-b border-[#d1d5db]">
        {(['schema', 'visualization', 'guidance'] as PageTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setPageTab(tab)}
            className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${
              pageTab === tab
                ? 'border-[#C5143D] text-[#C5143D]'
                : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Schema tab content */}
      {pageTab === 'schema' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden border border-[#d1d5db]">
          {/* Header bar */}
          <div
            style={{ background: '#F2F2F2', borderBottom: '1px solid #d1d5db', flexShrink: 0 }}
            className="flex items-center justify-between px-4 py-2"
          >
            <div className="flex items-center gap-1" style={{ background: '#e5e7eb', borderRadius: 2, padding: 2 }}>
              {(['yaml', 'json'] as const).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSchemaFormat(fmt)}
                  style={{
                    padding: '2px 10px', fontSize: 11, border: 'none', cursor: 'pointer', borderRadius: 2,
                    fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace",
                    background: schemaFormat === fmt ? '#fff' : 'transparent',
                    color: schemaFormat === fmt ? '#1F1F1F' : '#6b7280',
                    fontWeight: schemaFormat === fmt ? 500 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownload}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Download Code
            </button>
          </div>
          {/* Tree view / JSON view */}
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
            {schemaFormat === 'yaml'
              ? <YamlTreeView yaml={SCHEMA_YAML} />
              : (
                <pre style={{
                  margin: 0, padding: '16px 20px', fontSize: 12,
                  fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace",
                  color: '#1F1F1F', background: '#fff', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>{SCHEMA_JSON}</pre>
              )
            }
          </div>
        </div>
      )}

      {/* Visualization tab content */}
      {pageTab === 'visualization' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden border border-[#d1d5db]">
          {/* Header bar */}
          <div
            style={{ background: '#F2F2F2', borderBottom: '1px solid #d1d5db', flexShrink: 0 }}
            className="flex items-center justify-between px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace", fontSize: 12, color: '#6b7280' }}>Visualization</span>
            </div>
            <button
              title="Download Image"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Download Image
            </button>
          </div>
          {/* Empty canvas */}
          <div className="flex-1 min-h-0 bg-[#FAFAFA] flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>Visualization will be displayed here</span>
          </div>
        </div>
      )}

      {/* Guidance tab content */}
      {pageTab === 'guidance' && (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden border border-[#d1d5db]">
          {/* Header bar */}
          <div
            style={{ background: '#F2F2F2', borderBottom: '1px solid #d1d5db', flexShrink: 0 }}
            className="flex items-center justify-between px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <span style={{ fontFamily: "'DM Mono', 'Fira Mono', Consolas, monospace", fontSize: 12, color: '#6b7280' }}>Guidance</span>
            </div>
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = '/wol-guidance.pdf';
                a.download = 'wol-guidance.pdf';
                a.click();
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px', color: '#6b7280', fontSize: 11, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
            >
              Download Guidance
            </button>
          </div>
          {/* PDF Viewer */}
          <div className="flex-1 min-h-0 bg-[#FAFAFA] flex flex-col items-center justify-center gap-2">
            <span style={{ fontSize: 13, color: '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>Guidance document will be displayed here</span>
          </div>
        </div>
      )}
    </div>
  );
}
