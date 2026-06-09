import { useState, useMemo, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import {
  Check, X, Clock, AlertTriangle, Info,
  FileText, GitCompareArrows, Eye, User, Calendar, Tag, Layers, History
} from 'lucide-react';
import { approvalQueue, approvalHistory, type ApprovalItem, type ApprovalChange, type ApprovalHistoryItem, type ApprovalDecision, type AffectedItem, type ItemType, type ContractSection } from './mock-data';
import { TypeBadge } from './type-badge';
import { TOCNav } from './contract-canvas';

type ReviewTab = 'diff' | 'rendered';
type SidebarTab = 'pending' | 'history';
type HistoryFilter = 'all' | 'approved' | 'rejected';

export function ApprovalsPage() {
  const [searchParams] = useSearchParams();
  const [queue, setQueue] = useState(approvalQueue);
  const [history, setHistory] = useState(approvalHistory);
  const [selectedId, setSelectedId] = useState<string>(queue[0]?.id || '');
  const [activeTab, setActiveTab] = useState<ReviewTab>('diff');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('pending');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const historyItemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectRationale, setRejectRationale] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'approve' | 'reject'; name: string } | null>(null);

  const selected = queue.find(q => q.id === selectedId);
  const selectedHistory = history.find(h => h.id === selectedHistoryId);

  const filteredHistory = useMemo(() => {
    if (historyFilter === 'all') return history;
    return history.filter(h => h.decision === historyFilter);
  }, [history, historyFilter]);

  useEffect(() => {
    const targetHistoryId = searchParams.get('historyId');
    if (!targetHistoryId) return;

    const exists = history.some(h => h.id === targetHistoryId);
    if (!exists) return;

    setSidebarTab('history');
    setHistoryFilter('all');
    setSelectedHistoryId(targetHistoryId);
  }, [searchParams, history]);

  useEffect(() => {
    if (sidebarTab !== 'history' || !selectedHistoryId) return;
    historyItemRefs.current[selectedHistoryId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [sidebarTab, selectedHistoryId]);

  const handleApprove = () => {
    if (!selected) return;
    // Add to history
    const historyEntry: ApprovalHistoryItem = {
      id: `hist-${Date.now()}`,
      name: selected.name,
      type: selected.type,
      description: selected.description,
      version: selected.version,
      previousVersion: selected.previousVersion,
      submittedBy: selected.submittedBy,
      submittedDate: selected.submittedDate,
      classOfBusiness: selected.classOfBusiness,
      decision: 'approved',
      decidedBy: 'You',
      decidedDate: new Date().toISOString().split('T')[0],
      changes: selected.changes,
      usedIn: selected.usedIn,
      affectedItems: selected.affectedItems,
    };
    setHistory(prev => [historyEntry, ...prev]);
    setActionFeedback({ type: 'approve', name: selected.name });
    setQueue(prev => prev.filter(q => q.id !== selected.id));
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
    const remaining = queue.filter(q => q.id !== selected.id);
    if (remaining.length > 0) setSelectedId(remaining[0].id);
  };

  const handleReject = () => {
    if (!selected || !rejectRationale.trim()) return;
    // Add to history
    const historyEntry: ApprovalHistoryItem = {
      id: `hist-${Date.now()}`,
      name: selected.name,
      type: selected.type,
      description: selected.description,
      version: selected.version,
      previousVersion: selected.previousVersion,
      submittedBy: selected.submittedBy,
      submittedDate: selected.submittedDate,
      classOfBusiness: selected.classOfBusiness,
      decision: 'rejected',
      decidedBy: 'You',
      decidedDate: new Date().toISOString().split('T')[0],
      rationale: rejectRationale.trim(),
      changes: selected.changes,
      usedIn: selected.usedIn,
      affectedItems: selected.affectedItems,
    };
    setHistory(prev => [historyEntry, ...prev]);
    setActionFeedback({ type: 'reject', name: selected.name });
    setQueue(prev => prev.filter(q => q.id !== selected.id));
    setRejectDialogOpen(false);
    setRejectRationale('');
    setTimeout(() => {
      setActionFeedback(null);
    }, 3000);
    const remaining = queue.filter(q => q.id !== selected.id);
    if (remaining.length > 0) setSelectedId(remaining[0].id);
  };

  // Determine what to show in right panel
  const showPendingDetail = sidebarTab === 'pending' && selected;
  const showHistoryDetail = sidebarTab === 'history' && selectedHistory;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[#d1d5db] bg-white flex items-center justify-between">
        <div>
          <h1 className="text-[18px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Approval Queue</h1>
          <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Review and approve pending wording components</p>
        </div>
      </div>

      {/* Action feedback toast */}
      {actionFeedback && (
        <div className={`mx-6 mt-3 p-3 flex items-center gap-2 text-[13px] ${
          actionFeedback.type === 'approve'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-[#C5143D]'
        }`} style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          {actionFeedback.type === 'approve' ? <Check size={14} /> : <X size={14} />}
          <strong>{actionFeedback.name}</strong> has been {actionFeedback.type === 'approve' ? 'approved' : 'rejected'}. Author has been notified.
        </div>
      )}

      {/* Side-by-side layout: Queue left, Review right */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sidebar with Tabs */}
        <div className="w-[280px] min-w-[280px] border-r border-[#d1d5db] bg-[#FAFAFA] flex flex-col overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-[#d1d5db]">
            <button
              onClick={() => setSidebarTab('pending')}
              className={`flex-1 px-3 py-2.5 text-[12px] flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                sidebarTab === 'pending'
                  ? 'border-[#C5143D] text-[#C5143D] bg-white'
                  : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
              }`}
              style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            >
              <Clock size={12} />
              Pending
              {queue.length > 0 && (
                <span className={`ml-0.5 px-1.5 py-0.5 text-[10px] ${
                  sidebarTab === 'pending' ? 'bg-[#C5143D] text-white' : 'bg-[#d1d5db] text-[#6b7280]'
                }`}>{queue.length}</span>
              )}
            </button>
            <button
              onClick={() => setSidebarTab('history')}
              className={`flex-1 px-3 py-2.5 text-[12px] flex items-center justify-center gap-1.5 border-b-2 transition-colors ${
                sidebarTab === 'history'
                  ? 'border-[#C5143D] text-[#C5143D] bg-white'
                  : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
              }`}
              style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            >
              <History size={12} />
              History
            </button>
          </div>

          {/* Sidebar Content */}
          {sidebarTab === 'pending' ? (
            <>
              <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                  <div className="text-[13px] text-[#6b7280] py-8 text-center" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    No items pending approval.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {queue.map((item, index) => (
                      <button
                        key={item.id}
                        onClick={() => setSelectedId(item.id)}
                        className={`w-full p-3 border-b border-[#d1d5db] transition-all text-left ${
                          selectedId === item.id
                            ? 'bg-white'
                            : 'hover:bg-[#F2F2F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] text-[#9ca3af]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>#{index + 1}</span>
                          <TypeBadge type={item.type} />
                        </div>
                        <p className="text-[13px] text-[#1F1F1F] truncate" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>v{item.previousVersion} → v{item.version}</span>
                          <span className="text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.submittedBy}</span>
                        </div>
                        {item.affectedItems && item.affectedItems.length > 0 && (
                          <div className="flex items-center gap-1 mt-1.5">
                            <Layers size={10} className="text-amber-600" />
                            <span className="text-[10px] text-amber-700" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                              Bundled — {item.affectedItems.length} location(s)
                            </span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* History filter */}
              <div className="px-4 py-3 border-b border-[#d1d5db] space-y-2">
                <div className="flex gap-1">
                  {(['all', 'approved', 'rejected'] as HistoryFilter[]).map(f => (
                    <button
                      key={f}
                      onClick={() => setHistoryFilter(f)}
                      className={`px-2 py-1 text-[11px] transition-colors ${
                        historyFilter === f
                          ? 'bg-[#C5143D] text-white'
                          : 'bg-[#F2F2F2] text-[#6b7280] hover:bg-white'
                      }`}
                      style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                    >
                      {f === 'all' ? 'All' : f === 'approved' ? 'Approved' : 'Rejected'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filteredHistory.length === 0 ? (
                  <div className="text-[13px] text-[#6b7280] py-8 text-center" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    No history entries found.
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {filteredHistory.map((item) => (
                      <button
                        key={item.id}
                        ref={(el) => {
                          historyItemRefs.current[item.id] = el;
                        }}
                        onClick={() => setSelectedHistoryId(item.id)}
                        className={`w-full p-3 border-b border-[#d1d5db] transition-all text-left ${
                          selectedHistoryId === item.id
                            ? 'bg-white'
                            : 'hover:bg-[#F2F2F2]'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <HistoryDecisionBadge decision={item.decision} />
                          <TypeBadge type={item.type} />
                        </div>
                        <p className="text-[13px] text-[#1F1F1F] truncate" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.name}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>v{item.previousVersion} → v{item.version}</span>
                          <span className="text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.decidedDate}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Right: Review View */}
        {showPendingDetail ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Review Header */}
            <div className="px-6 py-3 border-b border-[#d1d5db] bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h2 className="text-[15px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{selected.name}</h2>
                      <TypeBadge type={selected.type} />
                    </div>
                  </div>
                </div>
                {/* IM-OK automatic status removed */}
                <div className="flex items-center gap-3">
                </div>
              </div>
              {/* Meta row */}
              <div className="flex items-center gap-5 mt-2 text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                <span className="flex items-center gap-1"><User size={11} /> {selected.submittedBy}</span>
                <span className="flex items-center gap-1"><Calendar size={11} /> {selected.submittedDate}</span>
                <span className="flex items-center gap-1"><Tag size={11} /> {selected.classOfBusiness}</span>
                <span className="flex items-center gap-1"><Layers size={11} /> v{selected.previousVersion} → v{selected.version}</span>
                {selected.usedIn.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Info size={11} className="text-amber-600" />
                    <span className="text-amber-700">Used in {selected.usedIn.length} item(s)</span>
                  </span>
                )}
              </div>
            </div>

            {/* Tab bar */}
            <div className="px-6 border-b border-[#d1d5db] bg-[#FAFAFA] flex items-center gap-1">
              <button
                onClick={() => setActiveTab('diff')}
                className={`px-4 py-2 text-[13px] border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'diff'
                    ? 'border-[#C5143D] text-[#C5143D]'
                    : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
                }`}
                style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                <GitCompareArrows size={13} /> Change Diff
              </button>
              <button
                onClick={() => setActiveTab('rendered')}
                className={`px-4 py-2 text-[13px] border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'rendered'
                    ? 'border-[#C5143D] text-[#C5143D]'
                    : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'
                }`}
                style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                <Eye size={13} /> Rendered View
              </button>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-hidden bg-white">
              {activeTab === 'diff' ? (
                <DiffView item={selected} />
              ) : (
                <RenderedView item={selected} />
              )}
            </div>

            {/* DecisionBar */}
            <DecisionBar
              onApprove={handleApprove}
              onReject={() => setRejectDialogOpen(true)}
              itemName={selected.name}
              usedIn={selected.usedIn}
            />
          </div>
        ) : showHistoryDetail ? (
          <HistoryDetailView item={selectedHistory} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {sidebarTab === 'pending' ? (
                <>
                  <FileText size={40} className="text-[#d1d5db] mx-auto mb-3" />
                  <p className="text-[14px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {queue.length === 0 ? 'All items have been reviewed.' : 'Select an item to review.'}
                  </p>
                </>
              ) : (
                <>
                  <History size={40} className="text-[#d1d5db] mx-auto mb-3" />
                  <p className="text-[14px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Select a history entry to view details.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Reject Dialog */}
      {rejectDialogOpen && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white border border-[#d1d5db] w-[480px] shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
              <div>
                <h3 className="text-[15px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Reject Component</h3>
                <p className="text-[12px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Provide rationale for <strong>{selected.name}</strong></p>
              </div>
              <button onClick={() => setRejectDialogOpen(false)} className="p-1 hover:bg-[#F2F2F2]">
                <X size={16} className="text-[#6b7280]" />
              </button>
            </div>
            <div className="p-4">
              <label className="block text-[12px] text-[#6b7280] mb-1.5" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                Rationale (required)
              </label>
              <textarea
                className="w-full h-[120px] bg-white text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db] resize-none focus:border-[#2563eb]"
                style={{ borderRadius: '0px', fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif", fontSize: '14px' }}
                placeholder="Explain why this component is being rejected..."
                value={rejectRationale}
                onChange={e => setRejectRationale(e.target.value)}
              />
              <p className="text-[11px] text-[#9ca3af] mt-1" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                The author ({selected.submittedBy}) will receive this feedback.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-[#d1d5db]">
              <button
                onClick={() => setRejectDialogOpen(false)}
                className="px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
                style={{ borderRadius: '0px', fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectRationale.trim()}
                className={`px-[40px] py-[8px] text-[14px] transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  rejectRationale.trim()
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D]'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px', fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
              >
                <X size={13} /> Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────── Diff View ────── */
function DiffView({ item }: { item: ApprovalItem }) {
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);
  const changeTypeConfig: Record<ApprovalChange['type'], { label: string; color: string }> = {
    text: { label: 'Text', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    metadata: { label: 'Meta', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    variable: { label: 'Variable', color: 'bg-red-50 text-[#C5143D] border-red-200' },
    rule: { label: 'Rule', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  // Build unified location groups: source + affected items
  const locationGroups: { name: string; type: ItemType; changes: ApprovalChange[]; isSource?: boolean }[] = [
    { name: item.name, type: item.type, changes: item.changes, isSource: true },
    ...(item.affectedItems || []).map(ai => ({ name: ai.name, type: ai.type, changes: ai.changes })),
  ];

  const totalChanges = locationGroups.reduce((sum, g) => sum + g.changes.length, 0);

  const scrollTo = (idx: number) => {
    groupRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: TOC nav */}
      <div className="w-[220px] min-w-[220px] overflow-y-auto shrink-0">
        <div className="p-3">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={13} className="text-[#6b7280]" />
            <span className="text-[12px] uppercase tracking-wider text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Contents</span>
          </div>
          <TOCNav
            sections={locationGroups.map((g, i) => ({ id: `diff-group-${i}`, number: '', title: g.name, type: 'clause' as const }))}
            activeSection=""
            tocExpanded={new Set()}
            openSections={new Set()}
            onToggleToc={() => {}}
            onSelect={(id) => {
              const idx = parseInt(id.replace('diff-group-', ''), 10);
              scrollTo(idx);
            }}
          />
        </div>
      </div>
      {/* Right: Scrollable diff content */}
      <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-[860px] mx-auto py-6 px-8">
          {/* Unified Changelog header */}
          <div className="flex items-center gap-2 mb-1">
            <GitCompareArrows size={14} className="text-[#6b7280]" />
            <h3 className="text-[14px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              Changelog — {locationGroups.length} location(s), {totalChanges} change(s)
            </h3>
          </div>
          {locationGroups.length > 1 && (
            <p className="text-[11px] text-[#6b7280] mb-4" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              All changes below are part of a single approval request.
            </p>
          )}
          {locationGroups.length === 1 && <div className="mb-4" />}

          {/* Location groups */}
          <div className="space-y-5">
            {locationGroups.map((group, gIdx) => (
              <div key={gIdx} ref={el => { groupRefs.current[gIdx] = el; }} className="border border-[#d1d5db]">
                {/* Location header */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F2F2F2] border-b border-[#d1d5db]">
                  <TypeBadge type={group.type} />
                  <span className="text-[13px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {group.name}
                  </span>
                  {group.isSource && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#C5143D] text-white" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                      Source
                    </span>
                  )}
                  <span className="text-[10px] text-[#9ca3af] ml-auto" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {group.changes.length} change(s)
                  </span>
                </div>
                {/* Changes for this location */}
                <div className="divide-y divide-[#d1d5db]">
                  {group.changes.map((change, cIdx) => (
                    <ChangeBlock key={cIdx} change={change} config={changeTypeConfig} nested />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────── Reusable Change Block ────── */
function ChangeBlock({ change, config, nested }: {
  change: ApprovalChange;
  config: Record<ApprovalChange['type'], { label: string; color: string }>;
  nested?: boolean;
}) {
  const cfg = config[change.type];
  return (
    <div className={nested ? '' : 'border border-[#d1d5db]'}>
      {/* Change header */}
      <div className={`flex items-center gap-2 px-4 py-2 ${nested ? 'bg-[#FAFAFA]' : 'bg-[#FAFAFA] border-b border-[#d1d5db]'}`}>
        <span className="text-[13px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{change.field}</span>
      </div>
      {/* Diff content */}
      <div className="p-4 space-y-2">
        <div className="flex gap-3">
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-[#C5143D] mb-1 block" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Removed</span>
            <div className="text-[13px] leading-relaxed text-[#374151] bg-red-50/50 border border-red-100 p-3" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              {change.oldValue === '—' ? (
                <span className="text-[#9ca3af] italic">Not present</span>
              ) : (
                <span className="line-through decoration-[#C5143D]/40">{change.oldValue}</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 mb-1 block" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Added</span>
            <div className="text-[13px] leading-relaxed text-[#374151] bg-emerald-50/50 border border-emerald-100 p-3" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              {change.newValue}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────── Rendered View (same styling as Contract Canvas) ────── */
function RenderedView({ item }: { item: ApprovalItem }) {
  const renderContent = (text: string) => {
    const variableNames = item.renderedVariables?.map(v => v.name) || [];
    const definedTerms = item.renderedDefinedTerms || [];

    const tokens: { start: number; end: number; type: 'variable' | 'defined-term'; text: string }[] = [];

    variableNames.forEach(name => {
      let idx = text.indexOf(name);
      while (idx !== -1) {
        tokens.push({ start: idx, end: idx + name.length, type: 'variable', text: name });
        idx = text.indexOf(name, idx + name.length);
      }
    });

    definedTerms.forEach(term => {
      let idx = text.indexOf(term);
      while (idx !== -1) {
        const overlap = tokens.some(t =>
          (idx >= t.start && idx < t.end) || (idx + term.length > t.start && idx + term.length <= t.end)
        );
        if (!overlap) {
          tokens.push({ start: idx, end: idx + term.length, type: 'defined-term', text: term });
        }
        idx = text.indexOf(term, idx + term.length);
      }
    });

    tokens.sort((a, b) => a.start - b.start);

    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    tokens.forEach((token, i) => {
      if (token.start > lastEnd) {
        parts.push(<span key={`t-${i}`}>{text.slice(lastEnd, token.start)}</span>);
      }
      if (token.type === 'variable') {
        parts.push(
          <span key={`v-${i}`} className="text-[#C5143D] bg-red-50 px-0.5">{token.text}</span>
        );
      } else {
        parts.push(
          <span key={`d-${i}`} className="uppercase text-[12px] tracking-wide text-[#1F1F1F]">{token.text}</span>
        );
      }
      lastEnd = token.end;
    });

    if (lastEnd < text.length) {
      parts.push(<span key="last">{text.slice(lastEnd)}</span>);
    }

    return parts.length > 0 ? parts : [<span key="all">{text}</span>];
  };

  const paragraphs = item.renderedContent.split('\\n\\n');

  return (
    <div className="h-full overflow-y-auto">
    <div className="max-w-[900px] mx-auto py-6 px-8">
      {/* Render Key Legend */}
      <div className="mb-6 p-3 bg-[#FAFAFA] border border-[#d1d5db] flex flex-wrap items-center gap-5 text-[12px]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
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

      {/* Rendered wording */}
      <div className="border border-[#d1d5db] p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#d1d5db]">
          <span className="text-[#6b7280] text-[13px]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.name}</span>
          <span className="text-[11px] text-[#9ca3af]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>v{item.version}</span>
        </div>
        <div className="space-y-4">
          {paragraphs.map((para, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-[#374151]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              {renderContent(para)}
            </p>
          ))}
        </div>

        {/* Variable values */}
        {item.renderedVariables && item.renderedVariables.length > 0 && (
          <div className="mt-6 pt-4 border-t border-[#d1d5db]">
            <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Variable Values</p>
            <div className="space-y-1">
              {item.renderedVariables.map(v => (
                <div key={v.name} className="flex items-center gap-2 text-[12px]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                  <span className="text-[#C5143D] bg-red-50 px-1">{v.name}</span>
                  <span className="text-[#9ca3af]">=</span>
                  <span className="text-[#374151]">{v.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

/* ────── DecisionBar ────── */
function DecisionBar({ onApprove, onReject, itemName, usedIn }: {
  onApprove: () => void;
  onReject: () => void;
  itemName: string;
  usedIn: string[];
}) {
  return (
    <div className="px-6 py-3 border-t border-[#d1d5db] bg-[#FAFAFA] flex items-center justify-between">
      <div className="text-[12px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
        {usedIn.length > 0 ? (
          <span className="flex items-center gap-1">
            <AlertTriangle size={12} className="text-amber-600" />
            This approval will propagate to {usedIn.length} consuming item(s).
          </span>
        ) : (
          <span>No downstream dependencies.</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onReject}
          className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-white text-[#C5143D] border border-[#C5143D] hover:bg-red-50 transition-all duration-200 cursor-pointer"
          style={{ borderRadius: '0px', fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          <X size={13} /> Reject
        </button>
        <button
          onClick={onApprove}
          className="flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer"
          style={{ borderRadius: '0px', fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
        >
          <Check size={13} /> Approve
        </button>
      </div>
    </div>
  );
}

/* ────── HistoryDetailView ────── */
function HistoryDetailView({ item }: { item: ApprovalHistoryItem }) {
  const changeTypeConfig: Record<ApprovalChange['type'], { label: string; color: string }> = {
    text: { label: 'Text', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    metadata: { label: 'Meta', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    variable: { label: 'Variable', color: 'bg-red-50 text-[#C5143D] border-red-200' },
    rule: { label: 'Rule', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  };

  // Build unified location groups: source + affected items
  const locationGroups: { name: string; type: ItemType; changes: ApprovalChange[]; isSource?: boolean }[] = [
    { name: item.name, type: item.type, changes: item.changes, isSource: true },
    ...(item.affectedItems || []).map(ai => ({ name: ai.name, type: ai.type, changes: ai.changes })),
  ];

  const totalChanges = locationGroups.reduce((sum, g) => sum + g.changes.length, 0);
  const groupRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollTo = (idx: number) => {
    groupRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-[#d1d5db] bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h2 className="text-[15px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{item.name}</h2>
              <TypeBadge type={item.type} />
              <HistoryDecisionBadge decision={item.decision} />
            </div>
          </div>
        </div>
        {/* Meta row */}
        <div className="flex items-center gap-5 mt-2 text-[11px] text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          <span className="flex items-center gap-1"><User size={11} /> Submitted by {item.submittedBy}</span>
          <span className="flex items-center gap-1"><Calendar size={11} /> {item.submittedDate}</span>
          <span className="flex items-center gap-1"><Tag size={11} /> {item.classOfBusiness}</span>
          <span className="flex items-center gap-1"><Layers size={11} /> v{item.previousVersion} → v{item.version}</span>
          {item.usedIn.length > 0 && (
            <span className="flex items-center gap-1">
              <Info size={11} className="text-amber-600" />
              <span className="text-amber-700">Affected {item.usedIn.length} item(s)</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex">
        <div className="w-[220px] min-w-[220px] overflow-y-auto shrink-0">
          <div className="p-3">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={13} className="text-[#6b7280]" />
              <span className="text-[12px] uppercase tracking-wider text-[#6b7280]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Contents</span>
            </div>
            <TOCNav
              sections={locationGroups.map((g, i) => ({ id: `hist-group-${i}`, number: '', title: g.name, type: 'clause' as const }))}
              activeSection=""
              tocExpanded={new Set()}
              openSections={new Set()}
              onToggleToc={() => {}}
              onSelect={(id) => {
                const idx = parseInt(id.replace('hist-group-', ''), 10);
                scrollTo(idx);
              }}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white">
        <div className="max-w-[860px] mx-auto py-6 px-8">
          {/* Rejection rationale */}
          {item.decision === 'rejected' && item.rationale && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200">
              <div className="flex items-center gap-2 mb-1.5">
                <X size={13} className="text-[#C5143D]" />
                <span className="text-[12px] text-[#C5143D]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Rejection Rationale</span>
              </div>
              <p className="text-[12px] text-[#374151]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                {item.rationale}
              </p>
            </div>
          )}

          {/* Unified Changelog header */}
          <div className="flex items-center gap-2 mb-1">
            <GitCompareArrows size={14} className="text-[#6b7280]" />
            <h3 className="text-[14px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              Changelog — {locationGroups.length} location(s), {totalChanges} change(s)
            </h3>
          </div>
          {locationGroups.length > 1 && (
            <p className="text-[11px] text-[#6b7280] mb-4" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              {item.decision === 'approved'
                ? 'All changes below were approved as a single approval request.'
                : 'All changes below were part of a single approval request.'}
            </p>
          )}
          {locationGroups.length === 1 && <div className="mb-4" />}

          {/* Location groups */}
          <div className="space-y-5">
            {locationGroups.map((group, gIdx) => (
              <div key={gIdx} ref={el => { groupRefs.current[gIdx] = el; }} className="border border-[#d1d5db]">
                {/* Location header */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[#F2F2F2] border-b border-[#d1d5db]">
                  <TypeBadge type={group.type} />
                  <span className="text-[13px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {group.name}
                  </span>
                  {group.isSource && (
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-[#C5143D] text-white" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                      Source
                    </span>
                  )}
                  <span className="text-[10px] text-[#9ca3af] ml-auto" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
                    {group.changes.length} change(s)
                  </span>
                </div>
                {/* Changes for this location */}
                <div className="divide-y divide-[#d1d5db]">
                  {group.changes.map((change, cIdx) => (
                    <HistoryChangeBlock key={cIdx} change={change} config={changeTypeConfig} decision={item.decision} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        </div>
      </div>

      {/* Footer status bar */}
      <div className={`px-6 py-3 border-t border-[#d1d5db] flex items-center gap-2 ${
        item.decision === 'approved' ? 'bg-emerald-50' : 'bg-red-50'
      }`}>
        {item.decision === 'approved' ? (
          <Check size={13} className="text-emerald-600" />
        ) : (
          <X size={13} className="text-[#C5143D]" />
        )}
        <span className={`text-[12px] ${item.decision === 'approved' ? 'text-emerald-700' : 'text-[#C5143D]'}`} style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
          This request was {item.decision} by {item.decidedBy} on {item.decidedDate}.
        </span>
      </div>
    </div>
  );
}

/* ────── History Change Block (with decision styling) ────── */
function HistoryChangeBlock({ change, config, decision }: {
  change: ApprovalChange;
  config: Record<ApprovalChange['type'], { label: string; color: string }>;
  decision: ApprovalDecision;
}) {
  const cfg = config[change.type];
  return (
    <div>
      {/* Change header */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#FAFAFA]">
        <span className="text-[13px] text-[#1F1F1F]" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>{change.field}</span>
      </div>
      {/* Diff content */}
      <div className="p-4 space-y-2">
        <div className="flex gap-3">
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-[#C5143D] mb-1 block" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Previous</span>
            <div className="text-[13px] leading-relaxed text-[#374151] bg-red-50/50 border border-red-100 p-3" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              {change.oldValue === '—' ? (
                <span className="text-[#9ca3af] italic">Not present</span>
              ) : (
                <span className={decision === 'approved' ? 'line-through decoration-[#C5143D]/40' : ''}>{change.oldValue}</span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase tracking-wider text-emerald-700 mb-1 block" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>Proposed</span>
            <div className={`text-[13px] leading-relaxed text-[#374151] p-3 border ${
              decision === 'approved'
                ? 'bg-emerald-50/50 border-emerald-100'
                : 'bg-gray-50 border-gray-200 opacity-60'
            }`} style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
              <span className={decision === 'rejected' ? 'line-through decoration-[#C5143D]/40' : ''}>{change.newValue}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────── HistoryDecisionBadge ────── */
function HistoryDecisionBadge({ decision }: { decision: ApprovalDecision }) {
  return decision === 'approved' ? (
    <Check size={14} className="text-emerald-600" />
  ) : (
    <X size={14} className="text-[#C5143D]" />
  );
}