import { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Search, Filter, Plus, Eye, Edit3, MoreVertical, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown, FileText, Table2, ArrowRight, Check, Upload, Trash2, Ban, BookOpen } from 'lucide-react';
import { repositoryItems, dynamicRepositoryItems, foundationItems, dynamicFoundationItems, foundationTypeLabels, contractSections, componentGroupSections, componentSections, statusLabels, type RepositoryItem, type ItemType, type ItemStatus, type ContractSection, type FoundationItem, type FoundationType } from './mock-data';
import { TypeBadge, StatusBadge } from './type-badge';
import { MetaKV } from './meta-kv';

type SortKey = 'name' | 'type' | 'status' | 'classOfBusiness' | 'version' | 'lastModified' | 'owner';
type SortDir = 'asc' | 'desc';
type RepoTab = 'objects' | 'foundations' | 'metadata';

export function RepositoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<RepoTab>(
    tabParam === 'foundations' ? 'foundations' : tabParam === 'metadata' ? 'metadata' : 'objects'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRow, setSelectedRow] = useState<RepositoryItem | null>(null);
  const [showFacets, setShowFacets] = useState(false);
  const [typeFilter, setTypeFilter] = useState<ItemType | ''>('');
  const [statusFilter, setStatusFilter] = useState<ItemStatus | ''>('');
  const [cobFilter, setCobFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [localItems, setLocalItems] = useState<RepositoryItem[]>(() => [...repositoryItems, ...dynamicRepositoryItems]);
  const [objLimit, setObjLimit] = useState(20);
  const [foundLimit, setFoundLimit] = useState(20);

  // Foundations tab state
  const [foundSearch, setFoundSearch] = useState('');
  const [foundTypeFilter, setFoundTypeFilter] = useState<FoundationType | ''>('');
  const [foundStatusFilter, setFoundStatusFilter] = useState<ItemStatus | ''>('');
  const [foundSegmentFilter, setFoundSegmentFilter] = useState('');
  const [foundOwnerFilter, setFoundOwnerFilter] = useState('');
  const [foundSortKey, setFoundSortKey] = useState<keyof FoundationItem | null>(null);
  const [foundSortDir, setFoundSortDir] = useState<SortDir>('asc');
  const [selectedFoundRow, setSelectedFoundRow] = useState<FoundationItem | null>(null);
  const [showFoundFacets, setShowFoundFacets] = useState(false);
  const [showCreateFoundDialog, setShowCreateFoundDialog] = useState(false);
  const [localFoundItems, setLocalFoundItems] = useState<FoundationItem[]>(() => [...foundationItems, ...dynamicFoundationItems]);

  const location = useLocation();
  useEffect(() => {
    setLocalFoundItems([...foundationItems, ...dynamicFoundationItems]);
  }, [location.key]);
  useEffect(() => { setObjLimit(20); }, [searchQuery, typeFilter, statusFilter, cobFilter]);
  useEffect(() => { setFoundLimit(20); }, [foundSearch, foundTypeFilter, foundStatusFilter, foundSegmentFilter, foundOwnerFilter, activeTab]);

  const filteredItems = useMemo(() => {
    let items = localItems;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }
    if (typeFilter) items = items.filter(i => i.type === typeFilter);
    if (statusFilter) items = items.filter(i => i.status === statusFilter);
    if (cobFilter) items = items.filter(i => i.classOfBusiness === cobFilter);

    if (sortKey) {
      items = [...items].sort((a, b) => {
        const aVal = (a[sortKey] ?? '').toString().toLowerCase();
        const bVal = (b[sortKey] ?? '').toString().toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }

    return items;
  }, [searchQuery, typeFilter, statusFilter, cobFilter, sortKey, sortDir, localItems]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const handleRowClick = (item: RepositoryItem) => {
    setSelectedRow(selectedRow?.id === item.id ? null : item);
  };

  const handleViewCanvas = (item: RepositoryItem) => {
    navigate(`/canvas/${item.id}`);
  };

  const handleEditComponent = (item: RepositoryItem) => {
    navigate(`/editor/${item.id}`);
  };

  const handleWithdrawItem = (item: RepositoryItem) => {
    setLocalItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'WITHDRAWN' } : i));
    const dynIdx = dynamicRepositoryItems.findIndex(i => i.id === item.id);
    if (dynIdx !== -1) dynamicRepositoryItems[dynIdx] = { ...dynamicRepositoryItems[dynIdx], status: 'WITHDRAWN' };
    toast.success(`${item.name} withdrawn`, { description: 'The object has been withdrawn and is no longer in use.' });
  };

  const handleDeleteItem = (item: RepositoryItem) => {
    setLocalItems(prev => prev.filter(i => i.id !== item.id));
    const dynIdx = dynamicRepositoryItems.findIndex(i => i.id === item.id);
    if (dynIdx !== -1) dynamicRepositoryItems.splice(dynIdx, 1);
    if (selectedRow?.id === item.id) setSelectedRow(null);
    toast.success(`${item.name} deleted`);
  };

  // Foundations computed + handlers
  const filteredFoundations = useMemo(() => {
    let items = localFoundItems.filter(i => i.type !== 'ATT');
    if (foundSearch) {
      const q = foundSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }
    if (foundTypeFilter) items = items.filter(i => i.type === foundTypeFilter);
    if (foundStatusFilter) items = items.filter(i => i.status === foundStatusFilter);
    if (foundSegmentFilter) items = items.filter(i => i.segment === foundSegmentFilter);
    if (foundOwnerFilter) items = items.filter(i => i.owner === foundOwnerFilter);
    if (foundSortKey) {
      items = [...items].sort((a, b) => {
        const aVal = String(a[foundSortKey] ?? '').toLowerCase();
        const bVal = String(b[foundSortKey] ?? '').toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return foundSortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [foundSearch, foundTypeFilter, foundStatusFilter, foundSegmentFilter, foundOwnerFilter, foundSortKey, foundSortDir, localFoundItems]);

  const filteredMetadataFoundations = useMemo(() => {
    let items = localFoundItems.filter(i => i.type === 'ATT');
    if (foundSearch) {
      const q = foundSearch.toLowerCase();
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.type.toLowerCase().includes(q));
    }
    if (foundStatusFilter) items = items.filter(i => i.status === foundStatusFilter);
    if (foundSegmentFilter) items = items.filter(i => i.segment === foundSegmentFilter);
    if (foundOwnerFilter) items = items.filter(i => i.owner === foundOwnerFilter);
    if (foundSortKey) {
      items = [...items].sort((a, b) => {
        const aVal = String(a[foundSortKey] ?? '').toLowerCase();
        const bVal = String(b[foundSortKey] ?? '').toLowerCase();
        const cmp = aVal.localeCompare(bVal);
        return foundSortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [foundSearch, foundStatusFilter, foundSegmentFilter, foundOwnerFilter, foundSortKey, foundSortDir, localFoundItems]);

  const handleFoundSort = (key: keyof FoundationItem) => {
    if (foundSortKey === key) setFoundSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setFoundSortKey(key); setFoundSortDir('asc'); }
  };

  const handleEditFoundation = (item: FoundationItem) => {
    navigate(`/foundation-editor/${item.id}`);
  };

  const handleViewFoundation = (item: FoundationItem) => {
    navigate(`/foundation-editor/${item.id}?mode=view`);
  };

  const handleWithdrawFoundation = (item: FoundationItem) => {
    setLocalFoundItems(prev => prev.map(i => i.id === item.id ? { ...i, status: 'WITHDRAWN' as ItemStatus } : i));
    if (selectedFoundRow?.id === item.id) setSelectedFoundRow(f => f ? { ...f, status: 'WITHDRAWN' } : f);
    toast.success(`${item.name} withdrawn`);
  };

  const handleDeleteFoundation = (item: FoundationItem) => {
    setLocalFoundItems(prev => prev.filter(i => i.id !== item.id));
    if (selectedFoundRow?.id === item.id) setSelectedFoundRow(null);
    toast.success(`${item.name} deleted`);
  };

  const isMetadataTab = activeTab === 'metadata';
  const isFoundationTab = activeTab === 'foundations' || activeTab === 'metadata';
  const activeFoundationRows = isMetadataTab ? filteredMetadataFoundations : filteredFoundations;
  const activeFoundationItems = isMetadataTab
    ? localFoundItems.filter(i => i.type === 'ATT')
    : localFoundItems.filter(i => i.type !== 'ATT');

  useEffect(() => {
    // Prevent hidden filter controls from affecting results.
    if (isMetadataTab) {
      setFoundTypeFilter('');
    } else {
      setFoundSegmentFilter('');
    }
    // Close preview panels when switching tabs
    setSelectedRow(null);
    setSelectedFoundRow(null);
  }, [activeTab]);

  const visibleItems = filteredItems.slice(0, objLimit);
  const visibleFoundRows = activeFoundationRows.slice(0, foundLimit);

  const handleObjScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100)
      setObjLimit(prev => Math.min(prev + 20, filteredItems.length));
  };
  const handleFoundScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 100)
      setFoundLimit(prev => Math.min(prev + 20, activeFoundationRows.length));
  };

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="p-6 pb-6 flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[22px] text-[#1F1F1F] leading-[90%]">Wording Objects Library v0.5</h1>
          </div>
          <p className="text-[13px] text-[#6b7280] mb-0">
            Manage your modular wording objects
          </p>

          {/* Tab Bar */}
          <div className="flex border-b border-[#d1d5db] mb-4 mt-3" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'objects'}
              onClick={() => setActiveTab('objects')}
              className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${activeTab === 'objects' ? 'border-[#C5143D] text-[#C5143D]' : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'}`}
            >
              Objects
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'foundations'}
              onClick={() => setActiveTab('foundations')}
              className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${activeTab === 'foundations' ? 'border-[#C5143D] text-[#C5143D]' : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'}`}
            >
              Foundations
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'metadata'}
              onClick={() => setActiveTab('metadata')}
              className={`px-4 py-2 text-[13px] border-b-2 transition-colors ${activeTab === 'metadata' ? 'border-[#C5143D] text-[#C5143D]' : 'border-transparent text-[#6b7280] hover:text-[#1F1F1F]'}`}
            >
              Attributes
            </button>
          </div>

          {/* Objects Search & Filter Bar */}
          {activeTab === 'objects' && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-[300px] max-w-full flex items-center gap-2 bg-white border border-[#d1d5db] px-3 py-2" style={{ borderRadius: '0px' }}>
                  <Search size={15} className="text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="Search for names or objects"
                    className="flex-1 bg-transparent text-[14px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')}><X size={14} className="text-[#6b7280]" /></button>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setShowFacets(!showFacets)}
                  className={`flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] transition-all duration-200 cursor-pointer ${
                    showFacets ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'
                  }`}
                  style={{ borderRadius: '0px', border: showFacets ? '0px solid #C5143D' : '0px solid #F2F2F2' }}
                >
                  <Filter size={14} />
                  Filters
                </button>
                <button
                  className="bg-[#C5143D] text-white px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer"
                  style={{ borderRadius: '0px', border: '0px solid #C5143D' }}
                  onClick={() => setShowCreateDialog(true)}
                >
                  <Plus size={14} />
                  Create
                </button>
                </div>
              </div>

              {/* Object Facet Panel */}
              {showFacets && (
                <FacetPanel
                  typeFilter={typeFilter}
                  statusFilter={statusFilter}
                  cobFilter={cobFilter}
                  onTypeChange={setTypeFilter}
                  onStatusChange={setStatusFilter}
                  onCobChange={setCobFilter}
                  onClose={() => setShowFacets(false)}
                />
              )}
            </>
          )}

          {/* Foundations Search & Filter Bar */}
          {isFoundationTab && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-[300px] max-w-full flex items-center gap-2 bg-white border border-[#d1d5db] px-3 py-2" style={{ borderRadius: '0px' }}>
                  <Search size={15} className="text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder={isMetadataTab ? 'Search attributes...' : 'Search foundations...'}
                    className="flex-1 bg-transparent text-[14px] text-[#1F1F1F] placeholder:text-[#9ca3af] outline-none border-none"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                    value={foundSearch}
                    onChange={(e) => setFoundSearch(e.target.value)}
                  />
                  {foundSearch && (
                    <button onClick={() => setFoundSearch('')}><X size={14} className="text-[#6b7280]" /></button>
                  )}
                </div>
                <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => setShowFoundFacets(!showFoundFacets)}
                  className={`flex items-center gap-1.5 px-[40px] py-[8px] text-[14px] transition-all duration-200 cursor-pointer ${
                    showFoundFacets ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'
                  }`}
                  style={{ borderRadius: '0px' }}
                >
                  <Filter size={14} />
                  Filters
                </button>
                <button
                  className="bg-[#C5143D] text-white px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200 cursor-pointer"
                  style={{ borderRadius: '0px' }}
                  onClick={() => {
                    if (isMetadataTab) navigate('/foundation-editor/new?type=ATT&isNew=true');
                    else setShowCreateFoundDialog(true);
                  }}
                >
                  <Plus size={14} />
                  Create
                </button>
                </div>
              </div>

              {/* Foundation Facet Panel */}
              {showFoundFacets && (
                <FoundationFacetPanel
                  typeFilter={foundTypeFilter}
                  statusFilter={foundStatusFilter}
                  segmentFilter={foundSegmentFilter}
                  ownerFilter={foundOwnerFilter}
                  items={activeFoundationItems}
                  availableTypes={isMetadataTab ? ['ATT'] : ['DEF', 'GV', 'LOV', 'TEC', 'SYS']}
                  showTypeFilter={!isMetadataTab}
                  showSegmentFilter={false}
                  onTypeChange={setFoundTypeFilter}
                  onStatusChange={setFoundStatusFilter}
                  onSegmentChange={setFoundSegmentFilter}
                  onOwnerChange={setFoundOwnerFilter}
                  onClose={() => setShowFoundFacets(false)}
                />
              )}
            </>
          )}

          {/* Results Area */}
          <div className="flex-1 min-h-0 flex flex-col pt-2">

            {/* Objects Table */}
            {activeTab === 'objects' && (
              <div className="flex-1 min-h-0 overflow-y-auto border border-[#d1d5db] bg-white" onScroll={handleObjScroll}>
                  <table className="w-full table-fixed">
                <colgroup>
                  <col style={{ width: '28%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '7%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '8%' }} />
                  <col style={{ width: '8%' }} />
                </colgroup>
                <thead className="sticky top-0 z-10 bg-[#F2F2F2]">
                  <tr className="border-b border-[#d1d5db]">
                    {([
                      { key: 'name' as SortKey, label: 'Name' },
                      { key: 'type' as SortKey, label: 'Type' },
                      { key: 'version' as SortKey, label: 'Version' },
                      { key: 'status' as SortKey, label: 'Status' },
                      { key: 'classOfBusiness' as SortKey, label: 'Class of Business' },
                      { key: 'lastModified' as SortKey, label: 'Last Updated' },
                      { key: 'owner' as SortKey, label: 'Editor' },
                    ]).map(col => (
                      <th
                        key={col.key}
                        onClick={() => handleSort(col.key)}
                        className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1F1F1F] overflow-hidden"
                        style={{ color: sortKey === col.key ? '#1F1F1F' : '#6b7280' }}
                      >
                        <span className="inline-flex items-center gap-1 truncate max-w-full">
                          <span className="truncate">{col.label}</span>
                          {sortKey === col.key && (
                            sortDir === 'asc'
                              ? <ArrowUp size={11} className="text-[#C5143D] shrink-0" />
                              : <ArrowDown size={11} className="text-[#C5143D] shrink-0" />
                          )}
                        </span>
                      </th>
                    ))}
                    <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#6b7280]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleItems.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleRowClick(item)}
                      className={`border-b border-[#d1d5db]/50 cursor-pointer transition-colors ${
                        selectedRow?.id === item.id ? 'bg-[#C5143D]/5' : 'hover:bg-[#F2F2F2]/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-[13px] text-[#1F1F1F] max-w-0 truncate">{item.name}</td>
                      <td className="px-4 py-3 max-w-0 overflow-hidden"><div className="truncate"><TypeBadge type={item.type} /></div></td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.version}</td>
                      <td className="px-4 py-3 max-w-0 overflow-hidden"><div className="truncate"><StatusBadge status={item.status} /></div></td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.classOfBusiness}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.lastModified}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.owner}</td>
                      <td className="px-4 py-3 text-right">
                        <RowActions
                          item={item}
                          onView={handleViewCanvas}
                          onEdit={handleEditComponent}
                          onWithdraw={handleWithdrawItem}
                          onDelete={handleDeleteItem}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          )}

            {/* Foundations Table */}
            {isFoundationTab && (
              <>
                {activeFoundationRows.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border border-dashed border-[#d1d5db] bg-white">
                    <BookOpen size={32} className="text-[#d1d5db] mb-3" />
                    <p className="text-[14px] text-[#6b7280] mb-1">{isMetadataTab ? 'No Attributes yet.' : 'No Foundations yet.'}</p>
                    <p className="text-[13px] text-[#9ca3af]">
                      {isMetadataTab
                        ? 'Create Attribute objects for contracts and components.'
                        : 'Create a Definition, Governing Variable, LOV, Technical or System Guidance.'}
                    </p>
                    <button
                      onClick={() => {
                        if (isMetadataTab) navigate('/foundation-editor/new?type=ATT&isNew=true');
                        else setShowCreateFoundDialog(true);
                      }}
                      className="mt-4 bg-[#C5143D] text-white px-5 py-2 text-[13px] flex items-center gap-1.5 hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200"
                    >
                      <Plus size={13} /> Create
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 overflow-y-auto border border-[#d1d5db] bg-white" onScroll={handleFoundScroll}>
                    <table className="w-full table-fixed">
                      <colgroup>
                        <col style={{ width: isMetadataTab ? '41%' : '30%' }} />
                        {!isMetadataTab && <col style={{ width: '11%' }} />}
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '9%' }} />
                      </colgroup>
                      <thead className="sticky top-0 z-10 bg-[#F2F2F2]">
                        <tr className="border-b border-[#d1d5db]">
                          {([
                            { key: 'name' as keyof FoundationItem, label: 'Name' },
                            ...(!isMetadataTab ? [{ key: 'type' as keyof FoundationItem, label: 'Type' }] : []),
                            { key: 'version' as keyof FoundationItem, label: 'Version' },
                            { key: 'status' as keyof FoundationItem, label: 'Status' },
                            { key: 'lastModified' as keyof FoundationItem, label: 'Last Updated' },
                            { key: 'owner' as keyof FoundationItem, label: 'Editor' },
                          ]).map(col => (
                            <th
                              key={col.key}
                              onClick={() => handleFoundSort(col.key)}
                              className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1F1F1F] overflow-hidden"
                              style={{ color: foundSortKey === col.key ? '#1F1F1F' : '#6b7280' }}
                            >
                              <span className="inline-flex items-center gap-1 truncate max-w-full">
                                <span className="truncate">{col.label}</span>
                                {foundSortKey === col.key && (
                                  foundSortDir === 'asc'
                                    ? <ArrowUp size={11} className="text-[#C5143D] shrink-0" />
                                    : <ArrowDown size={11} className="text-[#C5143D] shrink-0" />
                                )}
                              </span>
                            </th>
                          ))}
                          <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-[#6b7280]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleFoundRows.map((item) => (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedFoundRow(selectedFoundRow?.id === item.id ? null : item)}
                            className={`border-b border-[#d1d5db]/50 cursor-pointer transition-colors ${
                              selectedFoundRow?.id === item.id ? 'bg-[#C5143D]/5' : 'hover:bg-[#F2F2F2]/50'
                            }`}
                          >
                            <td className="px-4 py-3 text-[13px] text-[#1F1F1F] max-w-0 truncate">{item.name}</td>
                            {!isMetadataTab && (
                              <td className="px-4 py-3 max-w-0 overflow-hidden">
                                <span className="inline-block px-1.5 py-0.5 text-[11px] font-mono bg-[#F2F2F2] text-[#6b7280] truncate">{item.type}</span>
                              </td>
                            )}
                            <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.version}</td>
                            <td className="px-4 py-3 max-w-0 overflow-hidden"><div className="truncate"><StatusBadge status={item.status} /></div></td>
                            <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.lastModified}</td>
                            <td className="px-4 py-3 text-[13px] text-[#6b7280] max-w-0 truncate">{item.owner}</td>
                            <td className="px-4 py-3 text-right">
                              <FoundationRowActions
                                item={item}
                                onView={handleViewFoundation}
                                onEdit={handleEditFoundation}
                                onWithdraw={handleWithdrawFoundation}
                                onDelete={handleDeleteFoundation}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
      </div>

      {/* Objects Quick Preview Panel */}
      {activeTab === 'objects' && selectedRow && (
        <div className="absolute inset-y-0 right-0 z-30 w-[340px] shadow-xl">
          <QuickPreviewPanel
            item={selectedRow}
            onClose={() => setSelectedRow(null)}
            onViewCanvas={handleViewCanvas}
            onEdit={handleEditComponent}
          />
        </div>
      )}

      {/* Foundations Quick Preview Panel */}
      {isFoundationTab && selectedFoundRow && (
        <div className="absolute inset-y-0 right-0 z-30 w-[340px] shadow-xl">
          <FoundationQuickPreviewPanel
            item={selectedFoundRow}
            onClose={() => setSelectedFoundRow(null)}
            onView={handleViewFoundation}
            onEdit={handleEditFoundation}
          />
        </div>
      )}

      {/* Create Component Dialog */}
      {showCreateDialog && (
        <CreateComponentDialog
          onClose={() => setShowCreateDialog(false)}
          onCreate={(newItem) => {
            dynamicRepositoryItems.push(newItem);
            setLocalItems(prev => [...prev, newItem]);
            setShowCreateDialog(false);
            navigate(`/editor/${newItem.id}?isNew=true`);
          }}
        />
      )}

      {/* Create Foundation Dialog */}
      {showCreateFoundDialog && (
        <CreateFoundationDialog
          allowedTypes={['DEF', 'GV', 'LOV', 'TEC', 'SYS']}
          onClose={() => setShowCreateFoundDialog(false)}
          onCreate={(newItem) => {
            setShowCreateFoundDialog(false);
            navigate(`/foundation-editor/new?type=${newItem.type}&isNew=true`);
          }}
        />
      )}
    </div>
  );
}

function FoundationRowActions({ item, onView, onEdit, onWithdraw, onDelete }: {
  item: FoundationItem;
  onView: (i: FoundationItem) => void;
  onEdit: (i: FoundationItem) => void;
  onWithdraw: (i: FoundationItem) => void;
  onDelete: (i: FoundationItem) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => onView(item)}
        className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
        title="View"
      >
        <Eye size={14} className="text-[#6b7280]" />
      </button>
      <button
        onClick={() => onEdit(item)}
        className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
        title="Edit"
      >
        <Edit3 size={14} className="text-[#6b7280]" />
      </button>
      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
          title="More actions"
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <MoreVertical size={14} className="text-[#6b7280]" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[130px]">
              {item.status !== 'WITHDRAWN' && item.status !== 'ARCHIVED' && (
                <button
                  onClick={() => { onWithdraw(item); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[#6b7280] hover:bg-[#F2F2F2] transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Ban size={13} />
                  Withdraw
                </button>
              )}
              <button
                onClick={() => { onDelete(item); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[#C5143D] hover:bg-red-50 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FoundationFacetPanel({
  typeFilter, statusFilter, segmentFilter, ownerFilter, items,
  availableTypes,
  showTypeFilter,
  showSegmentFilter,
  onTypeChange, onStatusChange, onSegmentChange, onOwnerChange, onClose,
}: {
  typeFilter: FoundationType | '';
  statusFilter: ItemStatus | '';
  segmentFilter: string;
  ownerFilter: string;
  items: FoundationItem[];
  availableTypes?: FoundationType[];
  showTypeFilter?: boolean;
  showSegmentFilter?: boolean;
  onTypeChange: (v: FoundationType | '') => void;
  onStatusChange: (v: ItemStatus | '') => void;
  onSegmentChange: (v: string) => void;
  onOwnerChange: (v: string) => void;
  onClose: () => void;
}) {
  const types: FoundationType[] = availableTypes ?? ['DEF', 'GV', 'LOV', 'ATT', 'TEC', 'SYS'];
  const statuses: ItemStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'ARCHIVED', 'WITHDRAWN'];
  const segments = Array.from(new Set(items.map(i => i.segment).filter(Boolean))) as string[];
  const owners = Array.from(new Set(items.map(i => i.owner)));
  const shouldShowTypeFilter = showTypeFilter ?? true;
  const shouldShowSegmentFilter = showSegmentFilter ?? true;

  return (
    <div className="mt-2 p-4 bg-white border border-[#d1d5db] flex items-start gap-8 flex-wrap">
      {shouldShowTypeFilter && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Foundation Type</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onTypeChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!typeFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
            {types.map(t => (
              <button key={t} onClick={() => onTypeChange(t)} className={`px-2.5 py-1 text-[12px] font-mono transition-colors ${typeFilter === t ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{t}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onStatusChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!statusFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
          {statuses.map(s => (
            <button key={s} onClick={() => onStatusChange(s)} className={`px-2.5 py-1 text-[12px] transition-colors ${statusFilter === s ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{statusLabels[s]}</button>
          ))}
        </div>
      </div>
      {shouldShowSegmentFilter && segments.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Segment</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onSegmentChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!segmentFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
            {segments.map(s => (
              <button key={s} onClick={() => onSegmentChange(s)} className={`px-2.5 py-1 text-[12px] transition-colors ${segmentFilter === s ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{s}</button>
            ))}
          </div>
        </div>
      )}
      {owners.length > 0 && (
        <div>
          <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Editor</p>
          <div className="flex flex-wrap gap-1.5">
            <button onClick={() => onOwnerChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!ownerFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
            {owners.map(o => (
              <button key={o} onClick={() => onOwnerChange(o)} className={`px-2.5 py-1 text-[12px] transition-colors ${ownerFilter === o ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{o}</button>
            ))}
          </div>
        </div>
      )}
      <button onClick={onClose} className="ml-auto p-1 hover:bg-[#F2F2F2]"><X size={14} className="text-[#6b7280]" /></button>
    </div>
  );
}

function FoundationQuickPreviewPanel({ item, onClose, onView, onEdit }: {
  item: FoundationItem;
  onClose: () => void;
  onView: (i: FoundationItem) => void;
  onEdit: (i: FoundationItem) => void;
}) {
  const [showAllUsedIn, setShowAllUsedIn] = useState(false);
  const USED_IN_LIMIT = 3;

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
  const MetaSysRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px' }}>{label}</span>
      <span className="text-[12px] text-[#1F1F1F] flex-1 break-all">{value}</span>
    </div>
  );

  const allRepoItems = useMemo(() => [...repositoryItems, ...dynamicRepositoryItems], []);
  const usedInRefs = (item.usedIn ?? []).map(id => allRepoItems.find(r => r.id === id)).filter(Boolean) as RepositoryItem[];
  const visibleUsedIn = showAllUsedIn ? usedInRefs : usedInRefs.slice(0, USED_IN_LIMIT);
  const hiddenCount = usedInRefs.length - USED_IN_LIMIT;

  const bodyContent = item.type === 'DEF' && item.body ? item.body : item.description;
  const metaLcChip = metaLifecycleColors[item.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';

  return (
    <div className="h-full w-full border-l border-[#d1d5db] bg-white overflow-y-auto">
      <div className="p-4 border-b border-[#d1d5db] flex items-center justify-between">
        <h3 className="text-[14px] text-[#1F1F1F] flex-1 min-w-0 pr-2 truncate">{item.name}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2] shrink-0"><X size={14} className="text-[#6b7280]" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-1.5 py-0.5 text-[11px] font-mono bg-[#F2F2F2] text-[#6b7280] border border-[#d1d5db]">{item.type}</span>
            <span className={`px-2 py-0.5 text-[11px] border ${metaLcChip}`}>{statusLabels[item.status]}</span>
          </div>
        </div>
        {bodyContent && (
          <p className="text-[13px] text-[#6b7280] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{bodyContent}</p>
        )}
        <div className="py-3 border-b border-[#d1d5db]">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">System Attributes</p>
          <div className="space-y-0">
            <MetaSysRow label="ID" value={item.id} />
            <MetaSysRow label="Version" value={item.version} />
            <MetaSysRow label="Last Updated" value={metaFormatDate(item.lastModified)} />
            <MetaSysRow label="Editor" value={item.owner} />
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView(item)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#F2F2F2] text-[#1F1F1F] px-3 py-2 text-[14px] hover:bg-white transition-all duration-200"
            style={{ borderRadius: '0px' }}
          >
            <Eye size={14} /> View
          </button>
          <button
            onClick={() => onEdit(item)}
            className="flex-1 flex items-center justify-center gap-1.5 bg-[#C5143D] text-white px-3 py-2 text-[14px] hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200"
            style={{ borderRadius: '0px' }}
          >
            <Edit3 size={14} /> Edit
          </button>
        </div>
        {usedInRefs.length > 0 && (
          <div className="border-t border-[#d1d5db] pt-3">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">Used In</p>
            <div className="space-y-0">
              {visibleUsedIn.map((ref) => (
                <div key={ref.id} className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
                  <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px' }}>{ref.type}</span>
                  <a
                    href={`/canvas/${ref.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12px] text-[#2563eb] flex-1 break-all hover:underline"
                    style={{ textDecoration: 'none' }}
                  >
                    {ref.name}
                  </a>
                </div>
              ))}
            </div>
            {usedInRefs.length > USED_IN_LIMIT && (
              <button
                onClick={() => setShowAllUsedIn(v => !v)}
                className="mt-2 text-[11px] text-[#6b7280] hover:text-[#1F1F1F] transition-colors"
              >
                {showAllUsedIn ? 'Show less' : `Show ${hiddenCount} more`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const FOUNDATION_TYPE_OPTIONS: { value: FoundationType; label: string; description: string }[] = [
  { value: 'DEF', label: 'Definition', description: 'A term or concept definition used across contracts' },
  { value: 'GV', label: 'Governing Variable', description: 'A variable that drives conditional logic' },
  { value: 'LOV', label: 'List of Values', description: 'An enumerated set of allowed values' },
  { value: 'ATT', label: 'Attribute', description: 'Structured descriptive attributes for objects' },
  { value: 'TEC', label: 'Technical Guidance', description: 'System-level or drafting technical notes' },
  { value: 'SYS', label: 'System Guidance', description: 'Operational or process-level guidance' },
];

function CreateFoundationDialog({ onClose, onCreate, allowedTypes }: {
  onClose: () => void;
  onCreate: (item: FoundationItem) => void;
  allowedTypes?: FoundationType[];
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<FoundationType | null>(null);
  const [objectFormat, setObjectFormat] = useState<'digital' | 'analog' | ''>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const needsFormatStep = selectedType === 'TEC' || selectedType === 'SYS';
  const isAnalog = objectFormat === 'analog';

  const canProceedStep1 = selectedType !== null;
  const canProceedFormat = objectFormat !== '' && (!isAnalog || uploadedFile !== null);

  const stepSubtitle = () => {
    if (needsFormatStep && step === 2) return 'Select format and optionally upload a document';
    return 'Choose the type of foundation object you want to create';
  };

  const handleCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    const newItem: FoundationItem = {
      id: `found-new-${Date.now()}`,
      name: foundationTypeLabels[selectedType!],
      type: selectedType!,
      status: 'DRAFT',
      version: '0.1.0',
      lastModified: today,
      owner: 'R. Pyke',
      usages: 0,
    };
    onCreate(newItem);
  };

  const inputStyle = "w-full bg-white text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db] transition-colors focus:border-[#2563eb]";
  const labelStyle = "text-[12px] text-[#6b7280] mb-1.5 block";
  const selectableOptions = FOUNDATION_TYPE_OPTIONS.filter(opt => !allowedTypes || allowedTypes.includes(opt.value));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white border border-[#d1d5db] w-[560px] max-h-[85vh] overflow-hidden shadow-xl flex flex-col" style={{ borderRadius: '0px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
          <div>
            <h3 className="text-[15px] text-[#1F1F1F]">Create New Foundation</h3>
            <p className="text-[12px] text-[#6b7280]">{stepSubtitle()}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2]">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Type selector — always visible for non-guidance, or on step 1 for guidance */}
          {(!needsFormatStep || step === 1) && (
            <div>
              <label className={labelStyle}>
                Foundation Type <span className="text-[#C5143D]">*</span>
              </label>
              <select
                value={selectedType || ''}
                onChange={(e) => {
                  const val = (e.target.value as FoundationType) || null;
                  setSelectedType(val);
                  setObjectFormat('');
                  setUploadedFile(null);
                  setStep(1);
                }}
                className={inputStyle}
                style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
              >
                <option value="">Select a foundation type...</option>
                {selectableOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.value} — {opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Format step — Guidance (TEC/SYS) only */}
          {needsFormatStep && step === 2 && (
            <div className="space-y-3">
              <label className={labelStyle}>
                Format <span className="text-[#C5143D]">*</span>
              </label>
              <select
                value={objectFormat}
                onChange={(e) => {
                  setObjectFormat(e.target.value as 'digital' | 'analog' | '');
                  setUploadedFile(null);
                }}
                className={inputStyle}
                style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
              >
                <option value="">Select a format...</option>
                <option value="digital">Digital</option>
                <option value="analog">Analogue</option>
              </select>
              {isAnalog && (
                <div className="space-y-2">
                  <label className={labelStyle}>
                    Upload Document <span className="text-[#C5143D]">*</span>
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-colors ${
                      uploadedFile ? 'border-[#C5143D] bg-red-50/30' : 'border-[#d1d5db] hover:border-[#9ca3af] bg-[#FAFAFA]'
                    }`}
                  >
                    <Upload size={32} className={uploadedFile ? 'text-[#C5143D]' : 'text-[#9ca3af]'} />
                    {uploadedFile ? (
                      <div className="text-center">
                        <p className="text-[14px] text-[#1F1F1F]">{uploadedFile.name}</p>
                        <p className="text-[12px] text-[#6b7280]">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-[14px] text-[#1F1F1F]">Click to upload or drag and drop</p>
                        <p className="text-[12px] text-[#9ca3af]">PDF, DOCX, DOC (max. 50MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {uploadedFile && (
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-[12px] text-[#C5143D] hover:underline cursor-pointer"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#d1d5db]">
          <div>
            {needsFormatStep && step > 1 && (
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="text-[13px] text-[#6b7280] hover:text-[#1F1F1F] flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={13} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              Cancel
            </button>
            {/* Non-guidance: Create directly once type is selected */}
            {!needsFormatStep && (
              <button
                onClick={handleCreate}
                disabled={!selectedType}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  selectedType
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <Plus size={13} /> Create
              </button>
            )}
            {/* Guidance step 1: Continue */}
            {needsFormatStep && step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  canProceedStep1
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                Continue <ArrowRight size={13} />
              </button>
            )}
            {/* Guidance step 2: Create */}
            {needsFormatStep && step === 2 && (
              <button
                onClick={handleCreate}
                disabled={!canProceedFormat}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  canProceedFormat
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <Plus size={13} /> Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RowActions({ item, onView, onEdit, onWithdraw, onDelete }: { item: RepositoryItem; onView: (i: RepositoryItem) => void; onEdit: (i: RepositoryItem) => void; onWithdraw: (i: RepositoryItem) => void; onDelete: (i: RepositoryItem) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const renderTypeActions = () => {
    switch (item.type) {
      case 'Contract':
        return (
          <button
            onClick={() => onView(item)}
            className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
            title="View Contract"
          >
            <Eye size={14} className="text-[#6b7280]" />
          </button>
        );
      case 'Component-Group':
        return (
          <button
            onClick={() => onView(item)}
            className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
            title="View Group"
          >
            <Eye size={14} className="text-[#6b7280]" />
          </button>
        );
      case 'Component':
        return (
          <>
            <button
              onClick={() => onView(item)}
              className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
              title="View in Canvas"
            >
              <Eye size={14} className="text-[#6b7280]" />
            </button>
            <button
              onClick={() => onEdit(item)}
              className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
              title="Edit Component"
            >
              <Edit3 size={14} className="text-[#6b7280]" />
            </button>
          </>
        );
      default:
        return (
          <button
            onClick={() => onView(item)}
            className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
            title="View"
          >
            <Eye size={14} className="text-[#6b7280]" />
          </button>
        );
    }
  };

  return (
    <div className="flex items-center gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
      {renderTypeActions()}
      <div className="relative">
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="p-1.5 hover:bg-[#F2F2F2] transition-colors"
          title="More actions"
        >
          <MoreVertical size={14} className="text-[#6b7280]" />
        </button>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white border border-[#d1d5db] shadow-lg z-20 min-w-[130px]">
              {item.status !== 'WITHDRAWN' && item.status !== 'ARCHIVED' && (
                <button
                  onClick={() => { onWithdraw(item); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[#6b7280] hover:bg-[#F2F2F2] transition-colors"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  <Ban size={13} />
                  Withdraw
                </button>
              )}
              <button
                onClick={() => { onDelete(item); setMenuOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] text-[#C5143D] hover:bg-red-50 transition-colors"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FacetPanel({
  typeFilter, statusFilter, cobFilter,
  onTypeChange, onStatusChange, onCobChange, onClose,
}: {
  typeFilter: string; statusFilter: string; cobFilter: string;
  onTypeChange: (v: ItemType | '') => void;
  onStatusChange: (v: ItemStatus | '') => void;
  onCobChange: (v: string) => void;
  onClose: () => void;
}) {
  const types: ItemType[] = ['Contract', 'Component-Group', 'Component'];
  const statuses: ItemStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'PUBLISHED', 'ARCHIVED', 'WITHDRAWN'];
  const cobs = ['Marine Hull', 'Marine Cargo', 'Aviation', 'Property', 'Casualty', 'Energy', 'Political Risk'];

  return (
    <div className="mt-2 p-4 bg-white border border-[#d1d5db] flex items-start gap-8">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Object Type</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onTypeChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!typeFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
          {types.map((t) => (
            <button key={t} onClick={() => onTypeChange(t)} className={`px-2.5 py-1 text-[12px] transition-colors ${typeFilter === t ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Status</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onStatusChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!statusFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
          {statuses.map((s) => (
            <button key={s} onClick={() => onStatusChange(s)} className={`px-2.5 py-1 text-[12px] transition-colors ${statusFilter === s ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{statusLabels[s]}</button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-wider text-[#6b7280] mb-2">Class of Business</p>
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => onCobChange('')} className={`px-2.5 py-1 text-[12px] transition-colors ${!cobFilter ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>All</button>
          {cobs.map((c) => (
            <button key={c} onClick={() => onCobChange(c)} className={`px-2.5 py-1 text-[12px] transition-colors ${cobFilter === c ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white'}`}>{c}</button>
          ))}
        </div>
      </div>
      <button onClick={onClose} className="ml-auto p-1 hover:bg-[#F2F2F2]"><X size={14} className="text-[#6b7280]" /></button>
    </div>
  );
}

function QuickPreviewPanel({ item, onClose, onViewCanvas, onEdit }: {
  item: RepositoryItem;
  onClose: () => void;
  onViewCanvas: (i: RepositoryItem) => void;
  onEdit: (i: RepositoryItem) => void;
}) {
  const [linkCopied, setLinkCopied] = useState(false);

  // Metadata derived values
  const metaTypeToClass: Record<string, string> = {
    'Contract': 'CTR', 'Component-Group': 'CG', 'Component': 'CMP',
  };
  const metaObjectClass = metaTypeToClass[item.type] ?? item.type;
  const metaIsDigital = item.format !== 'analogue';
  const metaVersionId = `${item.id}_${item.version.replace(/\./g, '')}`;
  const metaVersionNum = parseInt(item.version.split('.')[0], 10) || 1;
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
  const metaLcChip = metaLifecycleColors[item.status] ?? 'bg-gray-100 text-gray-600 border-gray-200';
  const MetaSysRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
      <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px', fontFamily: "'DM Sans', sans-serif" }}>{label}</span>
      <span className="text-[12px] text-[#1F1F1F] flex-1 break-all" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</span>
    </div>
  );

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/canvas/${item.id}`);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Extract first content snippet from canvas sections
  const contentExcerpt = useMemo(() => {
    const findFirstContent = (sections: ContractSection[]): string | null => {
      for (const sec of sections) {
        if (sec.content) return sec.content;
        if (sec.children) {
          const found = findFirstContent(sec.children);
          if (found) return found;
        }
      }
      return null;
    };

    let sections: ContractSection[] = [];
    if (item.type === 'Contract') sections = contractSections;
    else if (item.type === 'Component-Group') sections = componentGroupSections;
    else if (item.type === 'Component') sections = componentSections;

    const content = findFirstContent(sections);
    return content || item.description;
  }, [item]);

  // Build breadcrumb path from usedIn chain
  const breadcrumb = useMemo(() => {
    const crumbs: { name: string; type: ItemType }[] = [];
    const visited = new Set<string>();
    let currentIds = item.usedIn;
    while (currentIds.length > 0 && !visited.has(currentIds[0])) {
      const parentId = currentIds[0];
      visited.add(parentId);
      const parent = repositoryItems.find(r => r.id === parentId);
      if (parent) {
        crumbs.unshift({ name: parent.name, type: parent.type });
        currentIds = parent.usedIn;
      } else {
        break;
      }
    }
    return crumbs;
  }, [item]);

  const renderCTAs = () => {
    switch (item.type) {
      case 'Contract':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onViewCanvas(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#C5143D] text-white px-3 py-2 text-[14px] hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200"
              style={{ borderRadius: '0px' }}
            >
              <Eye size={14} /> View
            </button>
            
          </div>
        );
      case 'Component-Group':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onViewCanvas(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#C5143D] text-white px-3 py-2 text-[14px] hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200"
              style={{ borderRadius: '0px' }}
            >
              <Eye size={14} /> View
            </button>
          </div>
        );
      case 'Component':
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onViewCanvas(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#F2F2F2] text-[#1F1F1F] px-3 py-2 text-[14px] hover:bg-white transition-all duration-200"
              style={{ borderRadius: '0px' }}
            >
              <Eye size={14} /> View
            </button>
            <button
              onClick={() => onEdit(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#C5143D] text-white px-3 py-2 text-[14px] hover:bg-[#F2F2F2] hover:text-[#C5143D] transition-all duration-200"
              style={{ borderRadius: '0px' }}
            >
              <Edit3 size={14} /> Edit
            </button>
          </div>
        );
      default:
        return (
          <div className="flex gap-2">
            <button
              onClick={() => onViewCanvas(item)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-[#F2F2F2] text-[#1F1F1F] px-3 py-2 text-[14px] hover:bg-white transition-all duration-200"
              style={{ borderRadius: '0px' }}
            >
              <Eye size={14} /> View
            </button>
          </div>
        );
    }
  };

  return (
    <div className="h-full w-full border-l border-[#d1d5db] bg-white overflow-y-auto">
      <div className="p-4 border-b border-[#d1d5db] flex items-center justify-between">
        <h3 className="text-[14px] text-[#1F1F1F] flex-1 min-w-0 pr-2 truncate">{item.name}</h3>
        <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2] shrink-0"><X size={14} className="text-[#6b7280]" /></button>
      </div>
      <div className="p-4 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TypeBadge type={item.type} />
            <StatusBadge status={item.status} />
          </div>
        </div>
        <p className="text-[13px] text-[#6b7280] overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{contentExcerpt}</p>
        {/* System Attributes */}
        <div className="py-3 border-b border-[#d1d5db]">
          <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">System Attributes</p>
          <div className="space-y-0">
            <MetaSysRow label="ID" value={item.id} />
            <MetaSysRow label="Version ID" value={metaVersionId} />
            <MetaSysRow label="Version" value={metaVersionNum} />
            <MetaSysRow label="Digital" value={
              <span className={metaIsDigital ? 'text-emerald-700' : 'text-gray-500'}>
                {metaIsDigital ? 'true' : 'false'}
              </span>
            } />
            <MetaSysRow label="Created At" value={metaFormatDate(item.lastModified)} />
            <MetaSysRow label="Jurisdiction" value={item.jurisdiction} />
            <MetaSysRow label="Class" value={item.classOfBusiness} />
            <MetaSysRow label="Last Modified" value={metaFormatDate(item.lastModified)} />
            {item.source && <MetaSysRow label="Source" value={item.source} />}
          </div>
        </div>

        {renderCTAs()}

        {item.usedIn.length > 0 && (
          <div className="border-t border-[#d1d5db] pt-3">
            <p className="text-[10px] uppercase tracking-wider text-[#9ca3af] mb-2">Used In</p>
            <div className="space-y-0">
              {item.usedIn.map((ref) => {
                const refItem = repositoryItems.find(r => r.id === ref);
                return (
                  <div key={ref} className="flex items-start gap-2 py-1.5 border-b border-[#f3f4f6] last:border-0">
                    <span className="text-[11px] text-[#9ca3af] shrink-0" style={{ width: '100px', fontFamily: "'DM Sans', sans-serif" }}>{refItem?.type || ''}</span>
                    <a
                      href={`/canvas/${ref}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[12px] text-[#2563eb] flex-1 break-all hover:underline"
                      style={{ fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}
                    >
                      {refItem?.name || ref}
                    </a>
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

type ComponentSubType = 'contract' | 'component-group' | 'component';
type CreateStep = 1 | 2 | 3;

const riskCodes = [
  { id: '1', name: '1: AVIATION HULL AND LIAB INCL WAR EXCL WRO NO PROPOR RI' },
  { id: '1E', name: '1E: OVERSEAS LEG TERRORISM ENERGY OFFSHORE PROPERTY' },
  { id: '1T', name: '1T: OVERSEAS LEG TERRORISM ACCIDENT AND HEALTH' },
  { id: '2', name: '2: AVIATION HULL AND LIAB INCL WAR EXCL WRO NO PROPOR RI' },
];

const cobOptions = [
  'Marine Hull',
  'Marine Cargo',
  'Aviation',
  'Property',
  'Casualty',
  'Energy',
  'Political Risk',
];

const jurisdictionOptions = ['UK', 'US', 'EU', 'Singapore', 'Global'];

const mrgOptions = [
  'MRG-Standard',
  'MRG-Marine',
  'MRG-Cargo',
  'MRG-Aviation',
  'MRG-Property',
];

const OBJECT_TYPE_OPTIONS: { value: ComponentSubType; label: string }[] = [
  { value: 'contract', label: 'Contract' },
  { value: 'component-group', label: 'Component Group' },
  { value: 'component', label: 'Component' },
];

function CreateComponentDialog({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (item: RepositoryItem) => void;
}) {
  const [step, setStep] = useState<CreateStep>(1);
  const [selectedType, setSelectedType] = useState<ComponentSubType | null>(null);

  // Format selection (step 2 — for all types)
  const [objectFormat, setObjectFormat] = useState<'digital' | 'analog' | ''>('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Step 3 fields (metadata)
  const [title, setTitle] = useState('');
  const [selectedRiskCodes, setSelectedRiskCodes] = useState<string[]>([]);
  const [showRiskCodeDropdown, setShowRiskCodeDropdown] = useState(false);
  const riskCodeBtnRef = useRef<HTMLButtonElement>(null);
  const riskCodePanelRef = useRef<HTMLDivElement>(null);
  const [riskCodeDropdownPos, setRiskCodeDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const [cob, setCob] = useState('');
  const [selectedJurisdictions, setSelectedJurisdictions] = useState<string[]>([]);
  const [owner, setOwner] = useState('R. Pyke');
  const [mrg, setMrg] = useState('MRG-Standard');
  const [wolPublicationNotes, setWolPublicationNotes] = useState('');
  const [showJurisdictionDropdown, setShowJurisdictionDropdown] = useState(false);
  const jurisdictionBtnRef = useRef<HTMLButtonElement>(null);
  const jurisdictionPanelRef = useRef<HTMLDivElement>(null);
  const [jurisdictionDropdownPos, setJurisdictionDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!showRiskCodeDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const insideBtn = riskCodeBtnRef.current?.contains(e.target as Node);
      const insidePanel = riskCodePanelRef.current?.contains(e.target as Node);
      if (!insideBtn && !insidePanel) setShowRiskCodeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showRiskCodeDropdown]);

  useEffect(() => {
    if (!showJurisdictionDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const insideBtn = jurisdictionBtnRef.current?.contains(e.target as Node);
      const insidePanel = jurisdictionPanelRef.current?.contains(e.target as Node);
      if (!insideBtn && !insidePanel) {
        setShowJurisdictionDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showJurisdictionDropdown]);

  const isAnalog = objectFormat === 'analog';

  const canProceedStep1 = selectedType !== null;
  const canProceedStep2 = objectFormat !== '' && (!isAnalog || uploadedFile !== null);
  const canCreate = title.trim() !== '' && cob !== '' && selectedJurisdictions.length > 0;

  const handleCreate = () => {
    const typeMap: Record<ComponentSubType, ItemType> = {
      'contract': 'Contract',
      'component-group': 'Component-Group',
      'component': 'Component',
    };
    const prefixMap: Record<ComponentSubType, string> = {
      'contract': '',
      'component-group': 'CG',
      'component': 'C',
    };
    const prefix = prefixMap[selectedType!];
    const rawTitle = title.trim();
    const fullName = prefix ? `${prefix} ${rawTitle}` : rawTitle;
    const newId = `cmp-new-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newItem: RepositoryItem = {
      id: newId,
      name: fullName,
      type: typeMap[selectedType!],
      status: 'DRAFT',
      classOfBusiness: cob,
      version: '0.1.0',
      lastModified: today,
      owner: 'R. Pyke',
      jurisdiction: selectedJurisdictions.join(', '),
      description: '',
      usedIn: [],
      format: objectFormat === 'analog' ? 'analogue' : 'digital',
    };
    onCreate(newItem);
  };

  const toggleJurisdiction = (j: string) => {
    setSelectedJurisdictions(prev =>
      prev.includes(j) ? prev.filter(x => x !== j) : [...prev, j]
    );
  };

  const inputStyle = "w-full bg-white text-[14px] text-[#1F1F1F] px-[12px] py-[8px] outline-none border border-[#d1d5db] transition-colors focus:border-[#2563eb]";
  const labelStyle = "text-[12px] text-[#6b7280] mb-1.5 block";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div className="bg-white border border-[#d1d5db] w-[560px] max-h-[85vh] overflow-hidden shadow-xl flex flex-col" style={{ borderRadius: '0px' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#d1d5db]">
          <div>
            <h3 className="text-[15px] text-[#1F1F1F]">Create New Object</h3>
            <p className="text-[12px] text-[#6b7280]">
              {step === 1 ? 'Choose the type of object you want to create' : step === 2 ? 'Select format and optionally upload a document' : 'Set up the object metadata'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-[#F2F2F2]">
            <X size={16} className="text-[#6b7280]" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-4 py-3 border-b border-[#d1d5db] bg-[#FAFAFA] flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center text-[11px] ${
              step >= 1 ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#6b7280]'
            }`}>
              {step > 1 ? <Check size={12} /> : '1'}
            </span>
            <span className={`text-[12px] ${step >= 1 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}`}>Type</span>
          </div>
          <div className="w-8 h-px bg-[#d1d5db]" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center text-[11px] ${
              step >= 2 ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#6b7280]'
            }`}>
              {step > 2 ? <Check size={12} /> : '2'}
            </span>
            <span className={`text-[12px] ${step >= 2 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}`}>Format</span>
          </div>
          <div className="w-8 h-px bg-[#d1d5db]" />
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 flex items-center justify-center text-[11px] ${
              step >= 3 ? 'bg-[#C5143D] text-white' : 'bg-[#F2F2F2] text-[#6b7280]'
            }`}>
              3
            </span>
            <span className={`text-[12px] ${step >= 3 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}`}>Setup</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Step 1: Type Selection */}
          {step === 1 && (
            <div className="space-y-3">
              <label className={labelStyle}>
                Object Type <span className="text-[#C5143D]">*</span>
              </label>
              <select
                value={selectedType || ''}
                onChange={(e) => {
                  const val = (e.target.value as ComponentSubType) || null;
                  setSelectedType(val);
                  setObjectFormat('');
                  setUploadedFile(null);
                }}
                className={inputStyle}
                style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
              >
                <option value="">Select an object type...</option>
                {OBJECT_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Step 2: Digital / Analogue Selection */}
          {step === 2 && (
            <div className="space-y-3">
              <label className={labelStyle}>
                Format <span className="text-[#C5143D]">*</span>
              </label>
              <select
                value={objectFormat}
                onChange={(e) => {
                  setObjectFormat(e.target.value as 'digital' | 'analog' | '');
                  setUploadedFile(null);
                }}
                className={inputStyle}
                style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
              >
                <option value="">Select a format...</option>
                <option value="digital">Digital</option>
                <option value="analog">Analogue</option>
              </select>

              {/* Upload area (shown when Analogue is selected) */}
              {isAnalog && (
                <div className="space-y-2">
                  <label className={labelStyle}>
                    Upload Document <span className="text-[#C5143D]">*</span>
                  </label>
                  <label
                    className={`flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed cursor-pointer transition-colors ${
                      uploadedFile ? 'border-[#C5143D] bg-red-50/30' : 'border-[#d1d5db] hover:border-[#9ca3af] bg-[#FAFAFA]'
                    }`}
                  >
                    <Upload size={32} className={uploadedFile ? 'text-[#C5143D]' : 'text-[#9ca3af]'} />
                    {uploadedFile ? (
                      <div className="text-center">
                        <p className="text-[14px] text-[#1F1F1F]">{uploadedFile.name}</p>
                        <p className="text-[12px] text-[#6b7280]">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-[14px] text-[#1F1F1F]">Click to upload or drag and drop</p>
                        <p className="text-[12px] text-[#9ca3af]">PDF, DOCX, DOC (max. 50MB)</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.docx,.doc"
                      className="hidden"
                      onChange={(e) => setUploadedFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {uploadedFile && (
                    <button
                      onClick={() => setUploadedFile(null)}
                      className="text-[12px] text-[#C5143D] hover:underline cursor-pointer"
                    >
                      Remove file
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Metadata */}
          {step === 3 && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className={labelStyle}>
                  Title <span className="text-[#C5143D]">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deductible Clause (Marine Hull)"
                  className={inputStyle}
                  style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                  autoFocus
                />
              </div>

              {/* Risk Code (optional multi-select) */}
              <div className="relative">
                <label className={labelStyle}>Risk Code</label>
                <button
                  ref={riskCodeBtnRef}
                  type="button"
                  onClick={() => {
                    if (!showRiskCodeDropdown && riskCodeBtnRef.current) {
                      const r = riskCodeBtnRef.current.getBoundingClientRect();
                      setRiskCodeDropdownPos({ top: r.bottom, left: r.left, width: r.width });
                    }
                    setShowRiskCodeDropdown(o => !o);
                  }}
                  className={`${inputStyle} text-left flex items-center justify-between cursor-pointer`}
                  style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  <span className={selectedRiskCodes.length > 0 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}>
                    {selectedRiskCodes.length > 0
                      ? selectedRiskCodes.join(', ')
                      : 'Select risk codes...'}
                  </span>
                  <ChevronDown size={14} className={`text-[#6b7280] transition-transform ${showRiskCodeDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showRiskCodeDropdown && riskCodeDropdownPos && (
                  <div
                    ref={riskCodePanelRef}
                    className="bg-white border border-[#d1d5db] shadow-lg"
                    style={{
                      position: 'fixed',
                      top: riskCodeDropdownPos.top + 2,
                      left: riskCodeDropdownPos.left,
                      width: riskCodeDropdownPos.width,
                      zIndex: 9999,
                      borderRadius: '0px',
                    }}
                  >
                    {riskCodes.map(rc => (
                      <label
                        key={rc.id}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F2F2F2] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedRiskCodes.includes(rc.id)}
                          onChange={() => setSelectedRiskCodes(prev =>
                            prev.includes(rc.id) ? prev.filter(id => id !== rc.id) : [...prev, rc.id]
                          )}
                          className="accent-[#C5143D] cursor-pointer"
                        />
                        <span className="text-[13px] text-[#1F1F1F]">{rc.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Class of Business */}
              <div>
                <label className={labelStyle}>
                  Class of Business (COB) <span className="text-[#C5143D]">*</span>
                </label>
                <select
                  value={cob}
                  onChange={(e) => setCob(e.target.value)}
                  className={inputStyle}
                  style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  <option value="">Select class of business...</option>
                  {cobOptions.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Jurisdiction (Multi-select) */}
              <div className="relative">
                <label className={labelStyle}>
                  Jurisdiction <span className="text-[#C5143D]">*</span>
                </label>
                <button
                  ref={jurisdictionBtnRef}
                  type="button"
                  onClick={() => {
                    if (!showJurisdictionDropdown && jurisdictionBtnRef.current) {
                      const r = jurisdictionBtnRef.current.getBoundingClientRect();
                      setJurisdictionDropdownPos({ top: r.bottom, left: r.left, width: r.width });
                    }
                    setShowJurisdictionDropdown(o => !o);
                  }}
                  className={`${inputStyle} text-left flex items-center justify-between cursor-pointer`}
                  style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' }}
                >
                  <span className={selectedJurisdictions.length > 0 ? 'text-[#1F1F1F]' : 'text-[#9ca3af]'}>
                    {selectedJurisdictions.length > 0
                      ? selectedJurisdictions.join(', ')
                      : 'Select jurisdictions...'
                    }
                  </span>
                  <ChevronDown size={14} className={`text-[#6b7280] transition-transform ${showJurisdictionDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showJurisdictionDropdown && jurisdictionDropdownPos && (
                  <div
                    ref={jurisdictionPanelRef}
                    className="bg-white border border-[#d1d5db] shadow-lg"
                    style={{
                      position: 'fixed',
                      top: jurisdictionDropdownPos.top + 2,
                      left: jurisdictionDropdownPos.left,
                      width: jurisdictionDropdownPos.width,
                      zIndex: 9999,
                      borderRadius: '0px',
                    }}
                  >
                    {jurisdictionOptions.map(j => (
                      <label
                        key={j}
                        className="flex items-center gap-2.5 px-3 py-2 hover:bg-[#F2F2F2] cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedJurisdictions.includes(j)}
                          onChange={() => toggleJurisdiction(j)}
                          className="accent-[#C5143D] cursor-pointer"
                        />
                        <span className="text-[13px] text-[#1F1F1F]">{j}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* WOL Publication Notes */}
              <div>
                <label className={labelStyle}>WOL Publication Notes</label>
                <textarea
                  value={wolPublicationNotes}
                  onChange={(e) => setWolPublicationNotes(e.target.value)}
                  placeholder="Optional notes for publication…"
                  rows={3}
                  className={inputStyle}
                  style={{ borderRadius: '0px', fontFamily: "'DM Sans', sans-serif", fontSize: '14px', resize: 'vertical' }}
                />
              </div>
            </div>
          )}


        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#d1d5db]">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as CreateStep)}
                className="text-[13px] text-[#6b7280] hover:text-[#1F1F1F] flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft size={13} /> Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-[40px] py-[8px] text-[14px] bg-[#F2F2F2] text-[#1F1F1F] hover:bg-white transition-all duration-200 cursor-pointer"
              style={{ borderRadius: '0px' }}
            >
              Cancel
            </button>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  canProceedStep1
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                Continue <ArrowRight size={13} />
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  canProceedStep2
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                Continue <ArrowRight size={13} />
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleCreate}
                disabled={!canCreate}
                className={`px-[40px] py-[8px] text-[14px] flex items-center gap-1.5 transition-all duration-200 ${
                  canCreate
                    ? 'bg-[#C5143D] text-white hover:bg-[#F2F2F2] hover:text-[#C5143D] cursor-pointer'
                    : 'bg-[#F2F2F2] text-[#9ca3af] cursor-not-allowed'
                }`}
                style={{ borderRadius: '0px' }}
              >
                <Plus size={13} /> Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}