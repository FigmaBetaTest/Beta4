import { useState, useEffect, useRef, useCallback, useMemo, type ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ChevronRight, ChevronDown, Edit3, ArrowLeft, FileText, Plus, X, Search, Layers, Package, GripVertical, Trash2, Save, SendHorizonal, Settings2, ToggleLeft, ToggleRight, Zap, Variable, Trash, AlertTriangle, Code, Info, Send } from 'lucide-react';
import { contractSections, componentGroupSections, componentSections, repositoryItems, dynamicRepositoryItems, dataElements, sectionsByItemId, paragraphsByItemId, getSubComponentsForItem, type ContractSection, type DataElement } from './mock-data';
import { VariationBadges, OptionalBadge, TypeBadge, StatusBadge } from './type-badge';
import { MetaKV } from './meta-kv';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { toast } from 'sonner';
import { ConditionCodeEditor } from './condition-code-editor';

const DRAG_TYPE = 'CANVAS_SECTION';

/* ------------------------------------------------------------------ */
/*  Condition Rule type                                                */
/* ------------------------------------------------------------------ */

type ConditionOperator = 'is_set' | 'is_not_set' | 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';

interface ConditionRule {
  enabled: boolean;
  variableId: string;
  operator: ConditionOperator;
  value: string;
}

const OPERATOR_LABELS: Record<ConditionOperator, string> = {
  is_set: 'is set',
  is_not_set: 'is not set',
  equals: 'equals',
  not_equals: 'does not equal',
  greater_than: 'is greater than',
  less_than: 'is less than',
  contains: 'contains',
};

const OPERATORS_WITHOUT_VALUE: ConditionOperator[] = ['is_set', 'is_not_set'];

/* ------------------------------------------------------------------ */
/*  Helper: renumber sections sequentially                             */
/* ------------------------------------------------------------------ */

function renumberSections(secs: ContractSection[]): ContractSection[] {
  return secs.map((sec, i) => {
    const num = String(i + 1);
    const children = sec.children?.map((child, ci) => ({
      ...child,
      number: `${num}.${ci + 1}`,
    }));
    return { ...sec, number: num, children };
  });
}

/* ------------------------------------------------------------------ */
/*  Helper: build a section from a repository item                     */
/* ------------------------------------------------------------------ */

function buildSectionFromRepoItem(item: typeof repositoryItems[0], nextNumber: number): ContractSection {
  // If this item has hard-coded authored paragraphs, use them directly
  const authored = paragraphsByItemId[item.id];
  if (authored && authored.length > 0) {
    return {
      id: `added-sec-${item.id}-${Date.now()}`,
      number: String(nextNumber),
      title: item.name,
      type: 'section',
      paragraphs: authored,
    };
  }

  // Resolve the sections data for this item
  let sourceSections: ContractSection[] = [];
  if (item.type === 'Component') sourceSections = componentSections;
  else if (item.type === 'Component-Group') sourceSections = componentGroupSections;

  // Flatten all clauses from the source sections as children
  const children: ContractSection[] = [];
  sourceSections.forEach((sec) => {
    sec.children?.forEach((child) => {
      children.push({
        ...child,
        id: `added-${item.id}-${child.id}`,
        number: `${nextNumber}.${children.length + 1}`,
      });
    });
  });

  // Inject sub-component containers from the item's editor content
  const subComponents = getSubComponentsForItem(item.id);
  subComponents.forEach((sc) => {
    children.push({
      id: `sc-${item.id}-${sc.id}`,
      number: '',
      title: sc.title,
      type: 'sub-component',
    });
  });

  return {
    id: `added-sec-${item.id}-${Date.now()}`,
    number: String(nextNumber),
    title: item.name,
    type: 'section',
    children,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: resolve sections by item type                              */
/* ------------------------------------------------------------------ */

function getSectionsForItem(item: typeof repositoryItems[0]): ContractSection[] {
  // Check for authored paragraph content first (hard-coded or session-saved)
  const authored = paragraphsByItemId[item.id];
  if (authored && authored.length > 0) {
    return [{
      id: `authored-${item.id}`,
      number: '1',
      title: item.name,
      type: 'section',
      paragraphs: authored,
    }];
  }
  // Check for item-specific legacy sections
  if (sectionsByItemId[item.id]) {
    return sectionsByItemId[item.id];
  }
  switch (item.type) {
    case 'Contract':
      return contractSections;
    case 'Component-Group':
      return componentGroupSections;
    case 'Component':
      return componentSections;
    default:
      return componentSections;
  }
}

/* ------------------------------------------------------------------ */
/*  Main Canvas                                                       */
/* ------------------------------------------------------------------ */

export function ContractCanvas() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tocCollapsed, setTocCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  const contract = repositoryItems.find(i => i.id === id) || repositoryItems[0];
  const baseSections = getSectionsForItem(contract);

  // Dynamically added sections
  const [addedSections, setAddedSections] = useState<ContractSection[]>([]);
  const [showAddPicker, setShowAddPicker] = useState(false);

  // Section ordering — stored as array of section IDs
  const [sectionOrder, setSectionOrder] = useState<string[]>(() => baseSections.map(s => s.id));

  // Conditions Panel state
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [conditionRules, setConditionRules] = useState<Record<string, ConditionRule>>({});

  // Per-block condition toggles and code (lifted for canvas access)
  const [conditionsEnabledPerBlock, setConditionsEnabledPerBlock] = useState<Record<string, boolean>>({});
  const [conditionsCodePerBlock, setConditionsCodePerBlock] = useState<Record<string, string>>({});

  // Build a lookup map of all sections (base + added)
  // Initialize eagerly so first render has data
  const allSectionsMap = useRef((() => {
    const map = new Map<string, ContractSection>();
    baseSections.forEach(s => map.set(s.id, s));
    return map;
  })());

  // Sync map whenever base or added sections change
  useEffect(() => {
    const map = new Map<string, ContractSection>();
    baseSections.forEach(s => map.set(s.id, s));
    addedSections.forEach(s => map.set(s.id, s));
    allSectionsMap.current = map;
  }, [baseSections, addedSections]);

  // Derive ordered + renumbered sections from the order array
  const sections = renumberSections(
    sectionOrder
      .map(sid => allSectionsMap.current.get(sid))
      .filter((s): s is ContractSection => s !== undefined)
  );

  // Handle updating a condition rule
  const handleUpdateCondition = useCallback((blockId: string, rule: ConditionRule | null) => {
    setConditionRules(prev => {
      if (rule === null) {
        const next = { ...prev };
        delete next[blockId];
        return next;
      }
      return { ...prev, [blockId]: rule };
    });
    if (rule) {
      const variable = dataElements.find(de => de.id === rule.variableId);
      const varName = variable?.name || 'variable';
      toast.success(`Condition applied`, {
        description: `Block is now conditional on {{${varName}}} ${OPERATOR_LABELS[rule.operator]}${!OPERATORS_WITHOUT_VALUE.includes(rule.operator) ? ` "${rule.value}"` : ''}.`,
        duration: 3000,
      });
    } else {
      toast.success('Condition removed', { description: 'Block is no longer conditional.', duration: 3000 });
    }
  }, []);

  // Which top-level sections are expanded — default: only first
  const [openSections, setOpenSections] = useState<Set<string>>(() => {
    const first = baseSections[0]?.id;
    return first ? new Set([first]) : new Set();
  });

  // TOC sub-tree expand state (for nested items inside TOC)
  const [tocExpanded, setTocExpanded] = useState<Set<string>>(() => {
    const first = baseSections[0]?.id;
    return first ? new Set([first]) : new Set();
  });

  // Active section tracked by IntersectionObserver
  const [activeSection, setActiveSection] = useState<string>(baseSections[0]?.id ?? '');

  // Ref to scrollable content pane
  const contentRef = useRef<HTMLDivElement>(null);

  // Track which sections have been opened at least once (for lazy-load)
  const [mountedSections, setMountedSections] = useState<Set<string>>(() => {
    const first = baseSections[0]?.id;
    return first ? new Set([first]) : new Set();
  });

  const toggleAccordion = useCallback((sectionId: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
    // Once opened, keep mounted for lazy-load caching
    setMountedSections(prev => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
    // Also expand in TOC tree
    setTocExpanded(prev => {
      const next = new Set(prev);
      next.add(sectionId);
      return next;
    });
  }, []);

  const toggleTocSubtree = useCallback((sectionId: string) => {
    setTocExpanded(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }, []);

  // Navigate from TOC: open section if collapsed, then scroll
  const selectFromToc = useCallback((sectionId: string) => {
    // Find the top-level parent (also handles SC paragraph ids inside paragraphs-based sections)
    const topParent = sections.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      s => s.id === sectionId || s.children?.some(c => c.id === sectionId) || s.paragraphs?.some((p: any) => p.id === sectionId)
    );
    if (topParent) {
      setOpenSections(prev => {
        const next = new Set(prev);
        next.add(topParent.id);
        return next;
      });
      setMountedSections(prev => {
        const next = new Set(prev);
        next.add(topParent.id);
        return next;
      });
      setTocExpanded(prev => {
        const next = new Set(prev);
        next.add(topParent.id);
        return next;
      });
    }
    setActiveSection(sectionId);
    // Delay scroll slightly so the DOM has time to expand
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    });
  }, [sections]);

  // IntersectionObserver to sync TOC active state from scroll position
  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    // Collect all section/clause ids in DOM order
    const allIds: string[] = [];
    const collectIds = (secs: ContractSection[]) => {
      secs.forEach(s => {
        allIds.push(s.id);
        if (s.children) collectIds(s.children);
      });
    };
    collectIds(sections);

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible entry
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      {
        root: container,
        rootMargin: '-10% 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe all rendered section elements
    allIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [openSections, mountedSections, sections]);

  // Handle adding a component/group from the picker
  const handleAddComponent = useCallback((repoItem: typeof repositoryItems[0]) => {
    const nextNumber = sectionOrder.length + 1;
    const newSection = buildSectionFromRepoItem(repoItem, nextNumber);
    setAddedSections(prev => [...prev, newSection]);
    setSectionOrder(prev => [...prev, newSection.id]);
    // Auto-expand the new section
    setOpenSections(prev => {
      const next = new Set(prev);
      next.add(newSection.id);
      return next;
    });
    setMountedSections(prev => {
      const next = new Set(prev);
      next.add(newSection.id);
      return next;
    });
    setTocExpanded(prev => {
      const next = new Set(prev);
      next.add(newSection.id);
      return next;
    });
    setShowAddPicker(false);
    // Scroll to new section after render
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.getElementById(newSection.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    });
  }, [sectionOrder.length]);

  // Handle removing a section
  const handleRemoveSection = useCallback((sectionId: string) => {
    setSectionOrder(prev => prev.filter(sid => sid !== sectionId));
    setAddedSections(prev => prev.filter(s => s.id !== sectionId));
    setOpenSections(prev => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
    setMountedSections(prev => {
      const next = new Set(prev);
      next.delete(sectionId);
      return next;
    });
  }, []);

  // Handle drag reorder
  const moveSection = useCallback((dragIndex: number, hoverIndex: number) => {
    setSectionOrder(prev => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(hoverIndex, 0, removed);
      return next;
    });
  }, []);

  // Compute new version string (bump patch)
  const computeNewVersion = useCallback(() => {
    const parts = contract.version.split('.');
    const patch = parseInt(parts[2] || '0', 10) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }, [contract.version]);

  // Save as new draft version
  const handleSaveAsDraft = useCallback(() => {
    const newVersion = computeNewVersion();
    toast.success(`Version ${newVersion} saved as Draft`, {
      description: `${contract.name} has been saved as a new draft version.`,
      duration: 4000,
    });
  }, [computeNewVersion, contract.name]);

  // Publish — saves as "Awaiting Approval"
  const handlePublish = useCallback(() => {
    const newVersion = computeNewVersion();
    toast.success(`Version ${newVersion} submitted for Approval`, {
      description: `${contract.name} has been submitted and is now awaiting approval.`,
      duration: 4000,
    });
  }, [computeNewVersion, contract.name]);

  return (
    <DndProvider backend={HTML5Backend}>
    <div className="flex flex-col h-full overflow-hidden">
      {/* Canvas Header */}
      <div className="h-[54px] min-h-[54px] px-6 border-b border-[#d1d5db] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-1.5 hover:bg-[#F2F2F2]">
            <ArrowLeft size={16} className="text-[#6b7280]" />
          </button>
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>{contract.name}</h2>
            <StatusBadge status={contract.status} version={contract.version} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEditMode ? (
            /* View Mode: show Edit button */
            <button
              onClick={() => setIsEditMode(true)}
              className="bg-[#C5143D] text-white px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer border-0"
              style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
            >
              <Edit3 size={13} /> Edit
            </button>
          ) : (
            /* Edit Mode: show Discard, Save as new Version, Publish */
            <>
              <button
                onClick={() => { setIsEditMode(false); setShowAddPicker(false); }}
                className="text-[#6b7280] px-[20px] py-[8px] text-[14px] flex items-center gap-1.5 hover:text-[#1F1F1F] transition-all duration-200 cursor-pointer border border-[#d1d5db] bg-white"
                style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
              >
                <X size={13} /> Discard
              </button>
              <button
                onClick={() => { handleSaveAsDraft(); setIsEditMode(false); setShowAddPicker(false); }}
                className="bg-[#F2F2F2] text-[#1F1F1F] px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 hover:bg-white hover:text-[#1F1F1F] transition-all duration-200 cursor-pointer border-0"
                style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
              >
                <Save size={13} /> Save as new Version
              </button>
              <button
                onClick={() => { setShowPublishDialog(true); }}
                className="bg-[#C5143D] text-white px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer border-0"
                style={{ borderRadius: '0px', fontFamily: 'var(--font-family)' }}
              >
                <SendHorizonal size={13} /> Submit
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* TOC Nav — fixed left */}
        <div className={`border-r border-[#d1d5db] bg-[#FAFAFA] overflow-y-auto transition-all shrink-0 ${tocCollapsed ? 'w-[40px] min-w-[40px]' : 'w-[280px] min-w-[280px]'}`}>
          {tocCollapsed ? (
            <button onClick={() => setTocCollapsed(false)} className="w-full p-3 flex justify-center">
              <ChevronRight size={14} className="text-[#6b7280]" />
            </button>
          ) : (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText size={13} className="text-[#6b7280]" />
                  <span className="text-[12px] uppercase tracking-wider text-[#6b7280]" style={{ fontFamily: 'var(--font-family)' }}>Contents</span>
                </div>
                <button onClick={() => setTocCollapsed(true)} className="p-1 hover:bg-[#F2F2F2]">
                  <ChevronDown size={12} className="text-[#6b7280] rotate-90" />
                </button>
              </div>
              <TOCNav
                sections={sections}
                activeSection={activeSection}
                tocExpanded={tocExpanded}
                openSections={openSections}
                onToggleToc={toggleTocSubtree}
                onSelect={selectFromToc}
              />
            </div>
          )}
        </div>

        {/* Section Accordion View */}
        <div ref={contentRef} className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-[900px] mx-auto py-6 px-8">
            {/* Render Key Legend */}
            <RenderKeyLegend />

            {/* Top-level Section Containers */}
            {sections.map((section, index) => (
              isEditMode ? (
                <DraggableSectionContainer
                  key={section.id}
                  index={index}
                  section={section}
                  isOpen={openSections.has(section.id)}
                  isMounted={mountedSections.has(section.id)}
                  onToggle={() => toggleAccordion(section.id)}
                  onEdit={(clauseId, clauseName) => navigate(`/editor/${clauseId}?from=canvas/${id}${clauseName ? `&name=${encodeURIComponent(clauseName)}` : ''}`)}
                  onRemove={() => handleRemoveSection(section.id)}
                  onMove={moveSection}
                  conditionsEnabledPerBlock={conditionsEnabledPerBlock}
                />
              ) : (
                <SectionContainer
                  key={section.id}
                  section={section}
                  isOpen={openSections.has(section.id)}
                  isMounted={mountedSections.has(section.id)}
                  onToggle={() => toggleAccordion(section.id)}
                  onEdit={(clauseId, clauseName) => navigate(`/editor/${clauseId}?from=canvas/${id}${clauseName ? `&name=${encodeURIComponent(clauseName)}` : ''}`)}
                  conditionsEnabledPerBlock={conditionsEnabledPerBlock}
                />
              )
            ))}

            {/* Add Component Button & Picker — only in Edit Mode */}
            {isEditMode && (
              <AddComponentButton
                showPicker={showAddPicker}
                onTogglePicker={() => setShowAddPicker(prev => !prev)}
                onSelect={handleAddComponent}
                existingSectionIds={new Set(sections.map(s => s.title))}
              />
            )}
          </div>
        </div>

        {/* Conditions Panel — right side in Edit Mode */}
        {isEditMode && (
          <ConditionsPanel
            sections={sections}
            selectedBlockId={selectedBlockId}
            onSelectBlock={setSelectedBlockId}
            conditionRules={conditionRules}
            onUpdateCondition={handleUpdateCondition}
            contract={contract}
            conditionsEnabledPerBlock={conditionsEnabledPerBlock}
            setConditionsEnabledPerBlock={setConditionsEnabledPerBlock}
            conditionsCodePerBlock={conditionsCodePerBlock}
            setConditionsCodePerBlock={setConditionsCodePerBlock}
          />
        )}
      </div>

      {/* Publish Dialog */}
      {showPublishDialog && (
        <CanvasPublishDialog
          contract={contract}
          onClose={() => setShowPublishDialog(false)}
          onPublish={() => {
            setShowPublishDialog(false);
            setIsEditMode(false);
            setShowAddPicker(false);
            const newVersion = computeNewVersion();
            toast.success(`Version ${newVersion} submitted`, {
              description: `${contract.name} has been submitted for approval.`,
              duration: 4000,
            });
          }}
        />
      )}
    </div>
    </DndProvider>
  );
}

/* ------------------------------------------------------------------ */
/*  TOC Navigation                                                    */
/* ------------------------------------------------------------------ */

export function TOCNav({ sections, activeSection, tocExpanded, openSections, onToggleToc, onSelect, depth = 0 }: {
  sections: ContractSection[];
  activeSection: string;
  tocExpanded: Set<string>;
  openSections: Set<string>;
  onToggleToc: (id: string) => void;
  onSelect: (id: string) => void;
  depth?: number;
}) {
  return (
    <ul className="space-y-0.5">
      {sections.map((section) => {
        const hasChildren = section.children && section.children.length > 0;
        // Extract sub-components from paragraphs-based sections
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const scItems: { id: string; title: string }[] = section.paragraphs
          ? section.paragraphs
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .filter((p: any) => p.blockType === 'sub-component-title')
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              .map((p: any) => ({
                id: p.id as string,
                title: ((p.content as string) || '').replace(/^SC\s*/, '').trim() || 'Sub-Component',
              }))
          : [];
        const hasScItems = scItems.length > 0;
        const hasExpandable = hasChildren || hasScItems;
        const isExpanded = tocExpanded.has(section.id);
        const isActive = activeSection === section.id;
        const isTopLevel = depth === 0;
        // Highlight the top-level item if it or any child/SC-item is active
        const isAncestorActive = isTopLevel && (
          section.children?.some(c => c.id === activeSection) ||
          scItems.some(sc => sc.id === activeSection)
        );
        const highlighted = isActive || isAncestorActive;
        // Show collapsed indicator for top-level sections that are closed in the accordion
        const isSectionClosed = isTopLevel && !openSections.has(section.id);

        return (
          <li key={section.id}>
            <div
              className={`flex items-center gap-1 px-2 py-1.5 cursor-pointer transition-colors ${
                highlighted ? 'bg-[#C5143D]/10 text-[#C5143D]' : 'hover:bg-[#F2F2F2] text-[#1F1F1F]'
              } ${isSectionClosed ? 'opacity-70' : ''}`}
              style={{ paddingLeft: `${8 + depth * 12}px`, fontFamily: 'var(--font-family)' }}
            >
              {hasExpandable && (
                <button onClick={() => onToggleToc(section.id)} className="p-0.5">
                  {isExpanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                </button>
              )}
              {!hasExpandable && <span className="w-[15px]" />}
              <button onClick={() => onSelect(section.id)} className="flex-1 text-left text-[12px] truncate">
                <span className="text-[#6b7280] mr-1.5">{section.number}</span>
                <span>{section.title}</span>
              </button>

            </div>
            {hasChildren && isExpanded && (
              <TOCNav
                sections={section.children!}
                activeSection={activeSection}
                tocExpanded={tocExpanded}
                openSections={openSections}
                onToggleToc={onToggleToc}
                onSelect={onSelect}
                depth={depth + 1}
              />
            )}
            {hasScItems && isExpanded && (
              <ul className="space-y-0.5">
                {scItems.map((sc) => {
                  const isScActive = activeSection === sc.id;
                  return (
                    <li key={sc.id}>
                      <div
                        className={`flex items-center gap-1 py-1.5 cursor-pointer transition-colors ${
                          isScActive ? 'bg-[#C5143D]/10 text-[#C5143D]' : 'hover:bg-[#F2F2F2] text-[#1F1F1F]'
                        }`}
                        style={{ paddingLeft: `${8 + (depth + 1) * 12}px`, fontFamily: 'var(--font-family)' }}
                      >
                        <span className="w-[15px]" />
                        <button onClick={() => onSelect(sc.id)} className="flex-1 text-left text-[12px] truncate">
                          <span className="text-[9px] font-mono text-[#9ca3af] mr-1.5">SC</span>
                          <span>{sc.title}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/*  Render Key Legend                                                  */
/* ------------------------------------------------------------------ */

function RenderKeyLegend() {
  return (
    <div className="mb-6 p-3 bg-[#FAFAFA] border border-[#d1d5db] flex flex-wrap items-center gap-5 text-[12px]" style={{ fontFamily: 'var(--font-family)' }}>
      <span className="text-[#6b7280]">Render Key:</span>
      <span className="flex items-center gap-1.5">
        <span className="flex items-center gap-px">
          <span className="px-1 py-px text-[10px] bg-amber-100 text-amber-800 border border-amber-300">A</span>
          <span className="px-1 py-px text-[10px] bg-amber-100 text-amber-800 border border-amber-300">B</span>
          <span className="px-1 py-px text-[10px] bg-amber-100 text-amber-800 border border-amber-300">C</span>
        </span>
        <span className="text-[#374151]">Variations</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-1 h-4 bg-gray-400" />
        <span className="text-[#6b7280] italic">Optional / Conditional</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 bg-red-50 border border-red-300" />
        <span className="text-[#C5143D]">Embedded Variables</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-3 h-3 bg-blue-50 border border-blue-300" />
        <span className="text-[#2563eb]" style={{ fontWeight: 700 }}>References</span>
      </span>
      <span className="flex items-center gap-1.5">
        <span className="uppercase text-[10px] tracking-wider text-[#1F1F1F] px-1 bg-gray-50 border border-gray-200">AB</span>
        <span className="text-[#374151]">Defined Terms</span>
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Inline token renderer (mirrors editor Live Preview)               */
/* ------------------------------------------------------------------ */

function renderInlineTokensCanvas(text: string, baseKey: string): JSX.Element[] {
  const parts: JSX.Element[] = [];
  const regex = /(\[EMB:[\w]+\]([\s\S]*?)\[\/EMB\])|(@\[[^\]]+\]|@\w+)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={`${baseKey}-t${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }
    if (match[1]) {
      // [EMB:ref]text[/EMB] → red <text>
      parts.push(
        <span key={`${baseKey}-e${match.index}`} className="text-[#C5143D]">
          <span>&lt;</span>{match[2]}<span>&gt;</span>
        </span>
      );
    } else if (match[3]) {
      // @[Reference] or @Word → blue bold
      const display = match[3].startsWith('@[') ? match[3].slice(2, -1) : match[3].slice(1);
      parts.push(
        <span key={`${baseKey}-r${match.index}`} className="text-[#2563eb]" style={{ fontWeight: 700 }}>{display}</span>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<span key={`${baseKey}-end`}>{text.slice(lastIndex)}</span>);
  }
  return parts.length > 0 ? parts : [<span key={`${baseKey}-plain`}>{text}</span>];
}

/* ------------------------------------------------------------------ */
/*  Paragraphs Canvas View — renders ParagraphData[] in canvas        */
/* ------------------------------------------------------------------ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ParagraphsCanvasView({ paragraphs }: { paragraphs: any[] }) {
  return (
    <div className="space-y-4" style={{ fontFamily: 'var(--font-family)' }}>
      {paragraphs.map((paragraph, pIdx) => {
        const key = paragraph.id || `p-${pIdx}`;
        const prevParagraph = paragraphs[pIdx - 1];
        const isSubClause = (paragraph.indent ?? 0) > 0;
        const prevIsSubClause = prevParagraph ? (prevParagraph.indent ?? 0) > 0 : false;
        const tightSpacing = isSubClause || prevIsSubClause;

        if (paragraph.blockType === 'h1') {
          const title = paragraph.titlePrefix
            ? (paragraph.content as string).replace(new RegExp(`^${paragraph.titlePrefix}\\s*`), '')
            : paragraph.content as string;
          return (
            <div key={key}>
              {paragraph.titlePrefix && (
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px' }}>
                  {paragraph.titlePrefix}
                </div>
              )}
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>{title}</h1>
            </div>
          );
        }

        if (paragraph.blockType === 'sub-component-title') {
          const title = (paragraph.content as string).replace(/^SC\s*/, '').trim();
          return (
            <div key={key} id={paragraph.id} className="mt-4">
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px' }}>SC</div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>{title || 'Sub-Component'}</div>
            </div>
          );
        }

        if (paragraph.blockType === 'label') {
          return (
            <p key={key} style={{ fontSize: '13px', fontWeight: 600, color: '#C5143D', margin: 0 }}>
              {paragraph.content}
            </p>
          );
        }

        if (paragraph.blockType === 'h2') {
          return (
            <h2 key={key} style={{ fontSize: '15px', fontWeight: 700, color: '#1F1F1F', margin: 0 }}>
              {paragraph.content}
            </h2>
          );
        }

        if (paragraph.blockType === 'numbered') {
          const indent = paragraph.indent ?? 0;
          const clauseNum: string = paragraph.clauseNumber ?? '';
          const numWidth = Math.max(56, clauseNum.length * 7.5);
          const hasVariants = paragraph.variants && paragraph.variants.length > 0;
          return (
            <div key={key} className="space-y-2" style={tightSpacing ? { marginTop: '4px' } : {}}>
              <div className="flex items-start" style={indent ? { paddingLeft: `${indent * 68}px` } : {}}>
                <span
                  className="shrink-0 text-[13px] text-[#374151]"
                  style={{ width: `${numWidth}px`, minWidth: `${numWidth}px`, lineHeight: '1.6' }}
                >
                  {clauseNum || <span className="text-[#d1d5db]">—</span>}
                </span>
                <div style={{ width: '12px', flexShrink: 0 }} />
                {hasVariants && (
                  <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5 mr-1.5">A</span>
                )}
                <p className="flex-1 text-[13px] leading-relaxed text-[#374151] m-0">
                  {renderInlineTokensCanvas(paragraph.content as string, `${key}-a`)}
                </p>
              </div>
              {paragraph.variants?.map((v: { letter: string; content: string }) => (
                <div key={`${key}-${v.letter}`} className="flex items-start" style={indent ? { paddingLeft: `${indent * 68}px` } : {}}>
                  <div style={{ width: `${numWidth}px`, flexShrink: 0 }} />
                  <div style={{ width: '12px', flexShrink: 0 }} />
                  <span className="text-[9px] text-amber-700 bg-amber-50 border border-amber-300 px-1 py-0.5 font-mono shrink-0 mt-0.5 mr-1.5">{v.letter}</span>
                  <p className="flex-1 text-[13px] leading-relaxed text-[#374151] m-0">
                    {renderInlineTokensCanvas(v.content, `${key}-${v.letter}`)}
                  </p>
                </div>
              ))}
            </div>
          );
        }

        if (paragraph.blockType === 'list-bullet' || paragraph.blockType === 'list-ordered') {
          const indent = paragraph.indent ?? 0;
          return (
            <div key={key} className="flex items-start" style={{ ...(indent ? { paddingLeft: `${indent * 48}px` } : {}), ...(tightSpacing ? { marginTop: '4px' } : {}) }}>
              <span className="shrink-0 text-[13px] text-[#374151] select-none" style={{ width: '24px', minWidth: '24px', textAlign: 'center' }}>
                {paragraph.blockType === 'list-bullet' ? '•' : `${pIdx + 1}.`}
              </span>
              <p className="flex-1 text-[13px] leading-relaxed text-[#374151] m-0">
                {renderInlineTokensCanvas(paragraph.content as string, key)}
              </p>
            </div>
          );
        }

        // Default: plain paragraph
        if (!paragraph.content) return null;
        return (
          <p key={key} className="text-[13px] leading-relaxed text-[#374151] m-0">
            {renderInlineTokensCanvas(paragraph.content as string, key)}
          </p>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Container (Accordion)                                     */
/* ------------------------------------------------------------------ */

function SectionContainer({ section, isOpen, isMounted, onToggle, onEdit, conditionsEnabledPerBlock = {} }: {
  section: ContractSection;
  isOpen: boolean;
  isMounted: boolean;
  onToggle: () => void;
  onEdit: (id: string, name?: string) => void;
  conditionsEnabledPerBlock?: Record<string, boolean>;
}) {
  const childCount = section.children?.length ?? 0;

  return (
    <div id={section.id} className="mb-2 border border-[#d1d5db] bg-white">
      {/* Clickable Section Header */}
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-5 py-3 text-left bg-[#FAFAFA] hover:bg-[#F2F2F2] transition-colors cursor-pointer ${isOpen ? 'border-b border-[#d1d5db]' : ''}`}
        style={{ fontFamily: 'var(--font-family)' }}
      >
        <span className="text-[#6b7280] shrink-0">
          {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-[14px] text-[#6b7280]">{section.number}</span>
        <span className="text-[15px] text-[#1F1F1F]">{section.title}</span>
      </button>

      {/* Lazy-mounted content: render only if it has been opened at least once */}
      {isMounted && (
        <div
          className="overflow-hidden transition-all duration-200"
          style={{
            maxHeight: isOpen ? '5000px' : '0px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="px-6 py-4">
            {section.paragraphs ? (
              <ParagraphsCanvasView paragraphs={section.paragraphs} />
            ) : (
              section.children?.map((child) => (
                <ClauseSectionView key={child.id} section={child} onEdit={onEdit} depth={0} conditionsEnabledPerBlock={conditionsEnabledPerBlock} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Draggable Section Container (Accordion)                             */
/* ------------------------------------------------------------------ */

function DraggableSectionContainer({ section, index, isOpen, isMounted, onToggle, onEdit, onRemove, onMove, conditionsEnabledPerBlock = {} }: {
  section: ContractSection;
  index: number;
  isOpen: boolean;
  isMounted: boolean;
  onToggle: () => void;
  onEdit: (id: string, name?: string) => void;
  onRemove: () => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  conditionsEnabledPerBlock?: Record<string, boolean>;
}) {
  const childCount = section.children?.length ?? 0;
  const containerRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, dragPreview] = useDrag({
    type: DRAG_TYPE,
    item: () => ({ index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop<{ index: number }, void, { isOver: boolean }>({
    accept: DRAG_TYPE,
    hover(item) {
      if (!containerRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Combine drop + preview on the container
  drop(dragPreview(containerRef));

  return (
    <div
      id={section.id}
      ref={containerRef}
      className={`mb-2 border bg-white relative group/section transition-all ${
        isOver ? 'border-[#C5143D] shadow-sm' : 'border-[#d1d5db]'
      }`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      {/* Section Header */}
      <div
        className={`w-full flex items-center gap-0 bg-[#FAFAFA] hover:bg-[#F2F2F2] transition-colors ${isOpen ? 'border-b border-[#d1d5db]' : ''}`}
        style={{ fontFamily: 'var(--font-family)' }}
      >
        {/* Drag Handle */}
        <div
          ref={(node) => { drag(node); }}
          className="flex items-center justify-center px-2 py-3 cursor-grab active:cursor-grabbing text-[#c0c0c0] hover:text-[#6b7280] transition-colors self-stretch"
          title="Drag to reorder"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </div>

        {/* Clickable area */}
        <button
          onClick={onToggle}
          className="flex-1 flex items-center gap-3 py-3 pr-2 text-left cursor-pointer"
        >
          <span className="text-[#6b7280] shrink-0">
            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
          <span className="text-[14px] text-[#6b7280]">{section.number}</span>
          <span className="text-[15px] text-[#1F1F1F]">{section.title}</span>
        </button>

        {/* Remove Button */}
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="flex items-center justify-center px-3 py-3 text-[#c0c0c0] hover:text-[#C5143D] transition-colors opacity-0 group-hover/section:opacity-100 self-stretch"
          title="Remove section"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Lazy-mounted content */}
      {isMounted && (
        <div
          className="overflow-hidden transition-all duration-200"
          style={{
            maxHeight: isOpen ? '5000px' : '0px',
            opacity: isOpen ? 1 : 0,
          }}
        >
          <div className="px-6 py-4">
            {section.paragraphs ? (
              <ParagraphsCanvasView paragraphs={section.paragraphs} />
            ) : (
              section.children?.map((child) => (
                <ClauseSectionView key={child.id} section={child} onEdit={onEdit} depth={0} conditionsEnabledPerBlock={conditionsEnabledPerBlock} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clause / Sub-section View (inside containers)                     */
/* ------------------------------------------------------------------ */

function ClauseSectionView({ section, onEdit, depth = 0, conditionsEnabledPerBlock = {} }: { section: ContractSection; onEdit: (id: string, name?: string) => void; depth?: number; conditionsEnabledPerBlock?: Record<string, boolean> }) {
  // Sub-component container — rendered as an indented titled block
  if (section.type === 'sub-component') {
    return (
      <div
        id={section.id}
        className="mb-3"
      >
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', letterSpacing: '0.04em', marginBottom: '2px' }}>SC</div>
        <div className="text-[13px] font-semibold text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>{section.title || 'Sub-Component'}</div>
        {section.children?.map((child) => (
          <ClauseSectionView key={child.id} section={child} onEdit={onEdit} depth={depth + 1} conditionsEnabledPerBlock={conditionsEnabledPerBlock} />
        ))}
      </div>
    );
  }

  const isOptional = section.optional === true;
  const isConditional = conditionsEnabledPerBlock[section.id] === true;
  const [activeVariation, setActiveVariation] = useState<string>(
    section.variations && section.variations.length > 0 ? section.variations[0] : ''
  );

  const innerContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] text-[#6b7280]" style={{ fontFamily: 'var(--font-family)' }}>{section.number}</span>
        <span className="text-[14px] text-[#1F1F1F]" style={{ fontFamily: 'var(--font-family)' }}>{section.title}</span>
        {section.variations && section.variations.length > 0 && (
          <span className="inline-flex items-center gap-0.5">
            {section.variations.map((v) => (
              <button
                key={v}
                onClick={(e) => { e.stopPropagation(); setActiveVariation(v); }}
                className={`inline-flex items-center px-1.5 py-0.5 text-[11px] border transition-colors cursor-pointer ${
                  activeVariation === v
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-gray-50 text-[#9ca3af] border-[#d1d5db] hover:border-[#9ca3af] hover:text-[#6b7280]'
                }`}
                style={{ fontFamily: 'var(--font-family)', borderRadius: '0px' }}
              >
                {v}
              </button>
            ))}
          </span>
        )}
        {isOptional && <OptionalBadge />}
        {section.type === 'clause' && (
          <button onClick={() => onEdit(section.id, section.title)} className="ml-auto p-1 hover:bg-[#F2F2F2] opacity-0 group-hover:opacity-100">
            <Edit3 size={12} className="text-[#6b7280]" />
          </button>
        )}
      </div>

      {isOptional && section.optionalCondition && (
        <p className="text-[11px] text-[#6b7280] italic mb-2 ml-0.5" style={{ fontFamily: 'var(--font-family)' }}>
          Condition: {section.optionalCondition}
        </p>
      )}

      {section.content && (
        <ClauseBlock section={section} activeVariation={activeVariation} />
      )}

      {section.children?.map((child) => (
        <ClauseSectionView key={child.id} section={child} onEdit={onEdit} depth={depth + 1} conditionsEnabledPerBlock={conditionsEnabledPerBlock} />
      ))}
    </>
  );

  if (isOptional || isConditional) {
    return (
      <div
        id={section.id}
        className={`mb-4 group ${depth > 0 ? 'ml-4' : ''} border-l-[3px] border-gray-400 bg-gray-50/60 pl-4 py-2 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-[#C5143D]/30 transition-colors`}
        tabIndex={0}
      >
        {innerContent}
      </div>
    );
  }

  return (
    <div id={section.id} className={`mb-4 group ${depth > 0 ? 'ml-4' : ''}`}>
      {innerContent}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Clause Block (text rendering with highlighting)                   */
/* ------------------------------------------------------------------ */

function ClauseBlock({ section, activeVariation }: { section: ContractSection; activeVariation: string }) {
  // Generate variation-specific content by applying subtle text modifications
  const getVariationContent = (content: string, variation: string): string => {
    if (!variation || variation === 'A') return content;
    if (variation === 'B') {
      return content
        .replace(/shall also be covered/gi, 'may additionally be covered at the discretion of the UNDERWRITERS')
        .replace(/agree to insure/gi, 'agree to indemnify')
        .replace(/against the perils/gi, 'in respect of the perils')
        .replace(/provided notice is given/gi, 'subject to prompt notice being given')
        .replace(/shall not void this insurance/gi, 'shall not prejudice this insurance');
    }
    if (variation === 'C') {
      return content
        .replace(/shall also be covered/gi, 'are covered only where the ASSURED has obtained prior written consent')
        .replace(/agree to insure/gi, 'undertake to hold covered')
        .replace(/against the perils/gi, 'against all risks including the perils')
        .replace(/provided notice is given/gi, 'provided written notice is given')
        .replace(/Breach of the navigation limits/gi, 'Any deviation beyond the navigation limits');
    }
    return content;
  };

  const displayContent = getVariationContent(section.content!, activeVariation);

  const renderContent = (content: string) => {
    const rendered = content;
    const parts: { text: string; type: 'normal' | 'variable' | 'defined-term' | 'reference' }[] = [];
    const tokens: { start: number; end: number; type: 'variable' | 'defined-term' | 'reference'; text: string }[] = [];

    // Tokenize variables
    section.variables?.forEach(v => {
      let idx = rendered.indexOf(v.name);
      while (idx !== -1) {
        tokens.push({ start: idx, end: idx + v.name.length, type: 'variable', text: v.name });
        idx = rendered.indexOf(v.name, idx + v.name.length);
      }
    });

    // Tokenize references (inline term mentions)
    section.references?.forEach(ref => {
      let idx = rendered.indexOf(ref.term);
      while (idx !== -1) {
        const overlap = tokens.some(t => (idx >= t.start && idx < t.end) || (idx + ref.term.length > t.start && idx < t.end));
        if (!overlap) {
          tokens.push({ start: idx, end: idx + ref.term.length, type: 'reference', text: ref.term });
        }
        idx = rendered.indexOf(ref.term, idx + ref.term.length);
      }
    });

    // Tokenize defined terms
    section.definedTerms?.forEach(term => {
      let idx = rendered.indexOf(term);
      while (idx !== -1) {
        const overlap = tokens.some(t => (idx >= t.start && idx < t.end) || (idx + term.length > t.start && idx < t.end));
        if (!overlap) {
          tokens.push({ start: idx, end: idx + term.length, type: 'defined-term', text: term });
        }
        idx = rendered.indexOf(term, idx + term.length);
      }
    });

    tokens.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    tokens.forEach(token => {
      if (token.start > lastEnd) {
        parts.push({ text: rendered.slice(lastEnd, token.start), type: 'normal' });
      }
      parts.push({ text: token.text, type: token.type });
      lastEnd = token.end;
    });
    if (lastEnd < rendered.length) {
      parts.push({ text: rendered.slice(lastEnd), type: 'normal' });
    }

    if (parts.length === 0) {
      parts.push({ text: rendered, type: 'normal' });
    }

    return parts.map((part, i) => {
      if (part.type === 'variable') {
        return <span key={i} className="text-[#C5143D]">&lt;{part.text}&gt;</span>;
      }
      if (part.type === 'reference') {
        return <span key={i} className="text-[#2563eb]" style={{ fontWeight: 700 }}>{part.text}</span>;
      }
      if (part.type === 'defined-term') {
        return <span key={i} className="uppercase text-[12px] tracking-wide text-[#1F1F1F]">{part.text}</span>;
      }
      return <span key={i}>{part.text}</span>;
    });
  };

  return (
    <div className="group mb-3">
      <p className="text-[13px] leading-relaxed text-[#374151]" style={{ fontFamily: 'var(--font-family)' }}>{renderContent(displayContent)}</p>
      {section.references && section.references.length > 0 && (
        <div className="mt-2 ml-4">
          {section.references.map((ref, i) => (
            <p key={i} className="text-[12px] text-[#2563eb]" style={{ fontFamily: 'var(--font-family)' }}>
              &#8627; <span className="underline cursor-pointer" style={{ fontWeight: 700 }}>{ref.term}</span>: {ref.definition}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Add Component Button & Picker                                     */
/* ------------------------------------------------------------------ */

function AddComponentButton({ showPicker, onTogglePicker, onSelect, existingSectionIds }: {
  showPicker: boolean;
  onTogglePicker: () => void;
  onSelect: (repoItem: typeof repositoryItems[0]) => void;
  existingSectionIds: Set<string>;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  type SearchEntry =
    | { kind: 'item'; item: typeof repositoryItems[0] }
    | { kind: 'sub-component'; scId: string; scTitle: string; parentItem: typeof repositoryItems[0] };

  // All repository items (static + dynamic)
  const allItems = [...repositoryItems, ...dynamicRepositoryItems];

  // Build a unified list: Components/Groups + their Sub-Components
  const allEntries = useMemo((): SearchEntry[] => {
    const entries: SearchEntry[] = [];
    allItems
      .filter(item => item.type === 'Component' || item.type === 'Component-Group')
      .forEach(item => {
        entries.push({ kind: 'item', item });
        // Append any SC blocks saved for this item
        getSubComponentsForItem(item.id).forEach(sc => {
          entries.push({ kind: 'sub-component', scId: sc.id, scTitle: sc.title, parentItem: item });
        });
      });
    return entries;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPicker]); // re-derive when picker opens so fresh SC data is fetched

  const filteredEntries = allEntries.filter(entry => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (entry.kind === 'item') {
      return entry.item.name.toLowerCase().includes(q) || entry.item.type.toLowerCase().includes(q);
    }
    return entry.scTitle.toLowerCase().includes(q) || entry.parentItem.name.toLowerCase().includes(q);
  });

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onTogglePicker();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker, onTogglePicker]);

  // Reset search when picker opens
  useEffect(() => {
    if (showPicker) setSearchQuery('');
  }, [showPicker]);

  return (
    <div className="relative mt-4" ref={pickerRef}>
      <button
        onClick={onTogglePicker}
        className="flex items-center gap-1.5 text-[13px] text-[#6b7280] hover:text-[#C5143D] transition-colors cursor-pointer py-2"
        style={{ fontFamily: 'var(--font-family)', background: 'none', border: 'none', padding: '8px 0' }}
      >
        <Plus size={14} />
        <span>Add component</span>
      </button>

      {showPicker && (
        <div className="absolute left-0 bottom-full mb-1 z-20 w-[380px] bg-white border border-[#d1d5db] shadow-lg" style={{ borderRadius: '0px' }}>
          {/* Picker Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d1d5db] bg-[#FAFAFA]">
            <span className="text-[12px] uppercase tracking-wider text-[#6b7280]" style={{ fontFamily: 'var(--font-family)' }}>
              Add Component or Group
            </span>
            <button onClick={onTogglePicker} className="p-0.5 hover:bg-[#F2F2F2]">
              <X size={13} className="text-[#6b7280]" />
            </button>
          </div>

          {/* Search */}
          <div className="px-3 py-2 border-b border-[#d1d5db]">
            <div className="flex items-center gap-2 bg-white border border-[#d1d5db] px-2.5 py-1.5" style={{ borderRadius: '0px' }}>
              <Search size={13} className="text-[#9ca3af] shrink-0" />
              <input
                type="text"
                placeholder="Search components and sub-components..."
                className="flex-1 bg-transparent text-[13px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                style={{ fontFamily: 'var(--font-family)', fontSize: '13px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
            </div>
          </div>

          {/* Items List */}
          <ul className="max-h-[300px] overflow-y-auto py-1">
            {filteredEntries.length === 0 && (
              <li className="px-4 py-3 text-[12px] text-[#9ca3af] text-center" style={{ fontFamily: 'var(--font-family)' }}>
                No matching components found.
              </li>
            )}
            {filteredEntries.map((entry, idx) => {
              if (entry.kind === 'item') {
                const item = entry.item;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSelect(item)}
                      className="w-full flex items-start gap-3 px-4 py-2.5 text-left hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                      style={{ fontFamily: 'var(--font-family)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-[#1F1F1F] truncate">{item.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] text-[#9ca3af]">{item.type}</span>
                          <span className="text-[11px] text-[#9ca3af]">v{item.version}</span>
                          <span className="text-[11px] text-[#9ca3af]">{item.classOfBusiness}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                );
              }
              // Sub-component entry
              return (
                <li key={`${entry.parentItem.id}-${entry.scId}-${idx}`}>
                  <button
                    onClick={() => onSelect(entry.parentItem)}
                    className="w-full flex items-start gap-3 px-4 py-2 text-left hover:bg-[#F2F2F2] transition-colors cursor-pointer"
                    style={{ fontFamily: 'var(--font-family)', paddingLeft: '32px' }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[#9ca3af] shrink-0">SC</span>
                        <span className="text-[13px] text-[#1F1F1F] truncate">{entry.scTitle}</span>
                      </div>
                      <div className="text-[11px] text-[#9ca3af] mt-0.5 truncate">in {entry.parentItem.name}</div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Conditions Panel                                                  */
/* ------------------------------------------------------------------ */

function truncate2Words(text: string): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) return text;
  return words.slice(0, 2).join(' ') + '…';
}

type RightPanelTab = 'conditions' | 'metadata';

function ConditionsPanel({ sections, selectedBlockId, onSelectBlock, conditionRules, onUpdateCondition, contract, conditionsEnabledPerBlock, setConditionsEnabledPerBlock, conditionsCodePerBlock, setConditionsCodePerBlock }: {
  sections: ContractSection[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  conditionRules: Record<string, ConditionRule>;
  onUpdateCondition: (blockId: string, rule: ConditionRule | null) => void;
  contract: typeof repositoryItems[0];
  conditionsEnabledPerBlock: Record<string, boolean>;
  setConditionsEnabledPerBlock: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  conditionsCodePerBlock: Record<string, string>;
  setConditionsCodePerBlock: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>('conditions');

  const conditionCount = Object.keys(conditionsEnabledPerBlock).filter(k => conditionsEnabledPerBlock[k]).length;

  const toggleBlockCondition = (blockId: string) => {
    setConditionsEnabledPerBlock(prev => ({ ...prev, [blockId]: !prev[blockId] }));
  };

  // Resolve usedIn references
  const usedInItems = contract.usedIn.map(ref => repositoryItems.find(r => r.id === ref)).filter(Boolean);

  // Metadata derived values
  const metaTypeToClass: Record<string, string> = {
    'Contract': 'CTR', 'Component-Group': 'CG', 'Component': 'CMP',
  };
  const metaObjectClass = metaTypeToClass[contract.type] ?? contract.type;
  const metaIsDigital = contract.format !== 'analogue';
  const metaVersionId = `${contract.id}_${contract.version.replace(/\./g, '')}`;
  const metaVersionNum = parseInt(contract.version.split('.')[0], 10) || 1;
  const metaFormatDate = (iso: string) => {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' (UTC)'; }
    catch { return iso; }
  };
  const metaLifecycleColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    DRAFT: 'bg-gray-100 text-gray-600 border-gray-200',
    PENDING_APPROVAL: 'bg-amber-100 text-amber-700 border-amber-200',
    ARCHIVED: 'bg-blue-100 text-blue-700 border-blue-200',
    WITHDRAWN: 'bg-red-100 text-red-700 border-red-200',
  };
  const metaLcChip = metaLifecycleColors[contract.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const MetaSysRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span className="text-[12px] text-[#1F1F1F] flex-1 break-all" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</span>
    </div>
  );

  const tabs: { key: RightPanelTab; label: string; icon: ReactNode }[] = [
    { key: 'conditions', label: 'Conditions', icon: <Code size={12} /> },
    { key: 'metadata', label: 'Metadata', icon: <Info size={12} /> },
  ];

  return (
    <div className="w-[310px] min-w-[310px] bg-[#FAFAFA] border-l border-[#d1d5db] overflow-y-auto flex flex-col" style={{ fontFamily: 'var(--font-family)' }}>
      {/* Tab Bar */}
      <div className="flex border-b border-[#d1d5db] bg-[#FAFAFA]">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-[12px] border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#C5143D] text-[#C5143D] bg-white'
                : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
            }`}
            style={{ fontFamily: 'var(--font-family)' }}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'conditions' && conditionCount > 0 && (
              <span className="ml-0.5 text-[10px] bg-[#C5143D] text-white px-1 py-px">
                {conditionCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Conditions Tab */}
      {activeTab === 'conditions' && (
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Block List with Condition Toggles */}
          <div className="flex-1 overflow-y-auto">
            {sections.map(sec => {
              // Extract SC sub-component paragraphs from paragraph-based sections
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const scParagraphs: { id: string; title: string }[] = sec.paragraphs
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? sec.paragraphs.filter((p: any) => p.blockType === 'sub-component-title').map((p: any) => ({
                    id: p.id as string,
                    title: ((p.content as string) || '').replace(/^SC\s*/, '').trim() || 'Sub-Component',
                  }))
                : [];
              const blockItems = sec.children ?? [];
              if (blockItems.length === 0 && scParagraphs.length === 0) return null;
              return (
                <div key={sec.id}>
                  {/* Section header row */}
                  <div className="px-3 py-2 bg-[#F2F2F2] border-b border-[#d1d5db]">
                    <span className="text-[11px] uppercase tracking-wider text-[#6b7280]">
                      {sec.number} {truncate2Words(sec.title)}
                    </span>
                  </div>
                  {/* SC sub-component blocks (paragraph-based sections) */}
                  {scParagraphs.map(sc => {
                    const enabled = conditionsEnabledPerBlock[sc.id] ?? false;
                    return (
                      <div key={sc.id} className="border-b border-[#e5e7eb]">
                        <button
                          onClick={() => toggleBlockCondition(sc.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[9px] font-mono text-[#9ca3af] shrink-0">SC</span>
                            <span className="text-[12px] text-[#1F1F1F] truncate">{truncate2Words(sc.title)}</span>
                          </div>
                          <div
                            className={`relative w-8 h-[18px] shrink-0 transition-colors ${
                              enabled ? 'bg-[#C5143D]' : 'bg-[#d1d5db]'
                            }`}
                            style={{ borderRadius: '9px' }}
                          >
                            <div
                              className={`absolute top-[2px] w-[14px] h-[14px] bg-white transition-transform ${
                                enabled ? 'left-[16px]' : 'left-[2px]'
                              }`}
                              style={{ borderRadius: '50%' }}
                            />
                          </div>
                        </button>
                        {enabled && (
                          <div className="px-3 pb-3">
                            <ConditionCodeEditor
                              value={conditionsCodePerBlock[sc.id] || ''}
                              onChange={(value) =>
                                setConditionsCodePerBlock(prev => ({ ...prev, [sc.id]: value }))
                              }
                              onSave={() => toast.success(`Condition saved for ${sc.title}`, { duration: 2000 })}
                              minHeight="80px"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {/* Child clause blocks (legacy section structure) */}
                  {blockItems.map(child => {
                    const enabled = conditionsEnabledPerBlock[child.id] ?? false;
                    return (
                      <div key={child.id} className="border-b border-[#e5e7eb]">
                        <button
                          onClick={() => toggleBlockCondition(child.id)}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-white transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[11px] text-[#9ca3af] shrink-0">{child.number}</span>
                            <span className="text-[12px] text-[#1F1F1F] truncate">{truncate2Words(child.title)}</span>
                          </div>
                          <div
                            className={`relative w-8 h-[18px] shrink-0 transition-colors ${
                              enabled ? 'bg-[#C5143D]' : 'bg-[#d1d5db]'
                            }`}
                            style={{ borderRadius: '9px' }}
                          >
                            <div
                              className={`absolute top-[2px] w-[14px] h-[14px] bg-white transition-transform ${
                                enabled ? 'left-[16px]' : 'left-[2px]'
                              }`}
                              style={{ borderRadius: '50%' }}
                            />
                          </div>
                        </button>
                        {enabled && (
                          <div className="px-3 pb-3">
                            <ConditionCodeEditor
                              value={conditionsCodePerBlock[child.id] || ''}
                              onChange={(value) =>
                                setConditionsCodePerBlock(prev => ({
                                  ...prev,
                                  [child.id]: value,
                                }))
                              }
                              onSave={() => toast.success(`Condition saved for ${child.number} ${child.title}`, { duration: 2000 })}
                              minHeight="80px"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata Tab */}
      {activeTab === 'metadata' && (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-[#d1d5db]">
            <h4 className="text-[15px] text-[#1F1F1F] mb-2">{contract.name}</h4>
            <div className="flex items-center gap-2 mb-2">
              <TypeBadge type={contract.type} />
              <StatusBadge status={contract.status} />
            </div>
            <p className="text-[12px] text-[#6b7280]" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {contract.description}
            </p>
          </div>

          {/* System Attributes */}
          <div className="px-4 py-3 border-b border-[#d1d5db]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">System Attributes</p>
            <div className="space-y-0">
              <MetaSysRow label="ID" value={contract.id} />
              <MetaSysRow label="Version ID" value={metaVersionId} />
              <MetaSysRow label="Version" value={metaVersionNum} />
              <MetaSysRow label="Digital" value={
                <span className={metaIsDigital ? 'text-emerald-700' : 'text-gray-500'}>
                  {metaIsDigital ? 'true' : 'false'}
                </span>
              } />
              <MetaSysRow label="Created At" value={metaFormatDate(contract.lastModified)} />
              <MetaSysRow label="Jurisdiction" value={contract.jurisdiction} />
              <MetaSysRow label="Class" value={contract.classOfBusiness} />
              <MetaSysRow label="Last Modified" value={metaFormatDate(contract.lastModified)} />
              {contract.source && <MetaSysRow label="Source" value={contract.source} />}
            </div>
          </div>

          {/* Canvas Statistics */}
          <div className="px-4 py-3 border-b border-[#d1d5db]">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">Canvas Statistics</p>
            <div className="space-y-0">
              <MetaSysRow label="Sections" value={String(sections.length)} />
              <MetaSysRow label="Total Clauses" value={String(sections.reduce((sum, s) => sum + (s.children?.length ?? 0), 0))} />
              <MetaSysRow label="Conditions" value={String(conditionCount)} />
            </div>
          </div>

          {/* Used In */}
          {usedInItems.length > 0 && (
            <div className="px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">Used In</p>
              <div className="space-y-0">
                {usedInItems.map((refItem) => (
                  <div key={refItem!.id} className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
                    <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px', fontFamily: "'DM Sans', sans-serif" }}>{refItem!.type}</span>
                    <a
                      href={`/canvas/${refItem!.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-[#2563eb] flex-1 break-all hover:underline"
                      style={{ fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}
                    >
                      {refItem!.name}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Canvas Publish Dialog                                              */
/* ------------------------------------------------------------------ */

function CanvasPublishDialog({ contract, onClose, onPublish }: {
  contract: typeof repositoryItems[0];
  onClose: () => void;
  onPublish: () => void;
}) {
  // Resolve usedIn items (locations that consume this contract/component)
  const usedInItems = contract.usedIn
    .map(id => repositoryItems.find(i => i.id === id))
    .filter(Boolean) as typeof repositoryItems;

  // Also find items that reference this contract (reverse lookup)
  const consumersOfThis = repositoryItems.filter(
    item => item.id !== contract.id && item.usedIn.includes(contract.id)
  );

  // Combine both directions for full impact
  const allImpactItems = [...usedInItems, ...consumersOfThis];
  // Deduplicate
  const seen = new Set<string>();
  const impactItems = allImpactItems.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });

  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(
    new Set(impactItems.map(i => i.id))
  );

  const toggleLocation = (id: string) => {
    setSelectedLocations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedLocations.size === impactItems.length) {
      setSelectedLocations(new Set());
    } else {
      setSelectedLocations(new Set(impactItems.map(i => i.id)));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" style={{ fontFamily: 'var(--font-family)' }}>
      <div className="bg-white border border-[#d1d5db] w-[560px] max-h-[80vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
          <div>
            <h3 className="text-[15px] text-[#1F1F1F]">Submit Component</h3>
            <p className="text-[12px] text-[#6b7280]">Select which locations receive this update</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2]">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Usage Impact Panel */}
        {impactItems.length > 0 && (
          <div className="p-4 border-b border-[#d1d5db]">
            <div className="flex items-center gap-2 mb-2">
              <Info size={13} className="text-amber-600" />
              <span className="text-[12px] text-amber-700">Usage Impact Analysis</span>
            </div>
            <p className="text-[11px] text-[#6b7280] mb-2">
              This component is currently used in {impactItems.length} location(s):
            </p>
            <div className="space-y-1">
              {impactItems.map(item => (
                <div key={item.id} className="flex items-center justify-between py-1.5">
                  <div className="flex items-center gap-2">
                    <TypeBadge type={item.type} />
                    <span className="text-[12px] text-[#1F1F1F]">{item.name}</span>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Selection */}
        <div className="p-4 space-y-3">
          {impactItems.length > 0 ? (
            <div className="border border-[#d1d5db] bg-[#FAFAFA]">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#d1d5db]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedLocations.size === impactItems.length}
                    onChange={toggleAll}
                    className="accent-[#C5143D] cursor-pointer"
                  />
                  <span className="text-[11px] text-[#6b7280] uppercase tracking-wider">
                    Update Locations ({selectedLocations.size}/{impactItems.length})
                  </span>
                </div>
                <span className="text-[10px] text-[#9ca3af] italic">Triggers a single approval request</span>
              </div>
              <div className="max-h-[180px] overflow-y-auto">
                {impactItems.map(item => (
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
            onClick={onPublish}
            disabled={impactItems.length > 0 && selectedLocations.size === 0}
            className={`px-[40px] py-[8px] text-[14px] transition-all duration-200 flex items-center gap-1.5 ${
              impactItems.length > 0 && selectedLocations.size === 0
                ? 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                : 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
            }`}
            style={{ borderRadius: '0px' }}
          >
            <Send size={13} />
            {`Submit${impactItems.length > 0 ? ` (${selectedLocations.size} location${selectedLocations.size !== 1 ? 's' : ''})` : ''}`}
          </button>
        </div>
      </div>
    </div>
  );
}