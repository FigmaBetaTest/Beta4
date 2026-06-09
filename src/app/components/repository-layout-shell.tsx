import { NavLink, Outlet, useLocation, useParams, Link } from 'react-router';
import { useState } from 'react';
import { Bell, LogOut, Database, CheckSquare, Check, X, PanelLeftClose, PanelLeftOpen, ChevronRight } from 'lucide-react';
import Lma from '../../imports/Lma5402';
import svgPaths from '../../imports/svg-l50t4u13nm';
import { repositoryItems, foundationTypeLabels, dynamicFoundationItems } from './mock-data';

const navItems = [
  { to: '/', label: 'Repository', icon: Database },
  { to: '/approvals', label: 'Approvals', icon: CheckSquare },
];

type SidebarMode = 'expanded' | 'tablet' | 'collapsed';

export function RepositoryLayoutShell() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('expanded');
  const location = useLocation();
  const params = useParams();

  const isSidebarCollapsed = sidebarMode === 'collapsed';
  const isSidebarTablet = sidebarMode === 'tablet';

  const cycleSidebarMode = () => {
    setSidebarMode((prev) => {
      if (prev === 'expanded') return 'tablet';
      if (prev === 'tablet') return 'collapsed';
      return 'expanded';
    });
  };

  const isApprovals = location.pathname === '/approvals';

  // Build breadcrumbs based on current route
  const buildBreadcrumbs = () => {
    const crumbs: { label: string; to?: string }[] = [{ label: 'Repository', to: '/' }];
    const pathname = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    const fromPath = searchParams.get('from');

    if (pathname.startsWith('/canvas/') && params.id) {
      const item = repositoryItems.find((i) => i.id === params.id);
      crumbs.push({ label: 'Canvas' });
      if (item) {
        crumbs.push({ label: item.name });
      }
    } else if (pathname.startsWith('/editor/') && params.id) {
      const item = repositoryItems.find((i) => i.id === params.id);

      // If coming from a canvas, add canvas breadcrumb with link
      if (fromPath && fromPath.startsWith('canvas/')) {
        const canvasId = fromPath.replace('canvas/', '');
        const canvasItem = repositoryItems.find((i) => i.id === canvasId);
        crumbs.push({ label: 'Canvas', to: `/${fromPath}` });
        if (canvasItem) {
          crumbs.push({ label: canvasItem.name, to: `/${fromPath}` });
        }
      }

      crumbs.push({ label: 'Editor' });
      if (item) {
        crumbs.push({ label: item.name });
      } else {
        const nameParam = searchParams.get('name');
        if (nameParam) {
          crumbs.push({ label: nameParam });
        }
      }
    } else if (pathname.startsWith('/foundation-editor/') && params.id) {
      const allFoundations = [...dynamicFoundationItems];
      const item = allFoundations.find((i) => i.id === params.id);
      const searchParams2 = new URLSearchParams(location.search);
      crumbs.push({ label: 'Editor' });
      if (item) {
        crumbs.push({ label: foundationTypeLabels[item.type] });
      } else {
        const typeParam = searchParams2.get('type');
        if (typeParam && typeParam in foundationTypeLabels) {
          crumbs.push({ label: foundationTypeLabels[typeParam as keyof typeof foundationTypeLabels] });
        }
      }
    }

    return crumbs;
  };

  const breadcrumbs = buildBreadcrumbs();

  const notifications = [
    {
      id: 'n1',
      type: 'approve' as const,
      itemName: 'War & Strikes Clause',
      time: '2 hours ago',
      historyId: 'hist-001',
    },
    {
      id: 'n2',
      type: 'reject' as const,
      itemName: 'Deductible Clause (Cargo)',
      time: '5 hours ago',
      historyId: 'hist-003',
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground" style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      {/* Left Sidebar — dark per design system secondary #1F1F1F */}
      <aside className={`${isSidebarCollapsed ? 'w-[56px] min-w-[56px]' : isSidebarTablet ? 'w-[120px] min-w-[120px]' : 'w-[220px] min-w-[220px]'} bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-200`}>
        {/* Logo area */}
        <div className={`${isSidebarCollapsed ? 'p-2 pb-1' : isSidebarTablet ? 'p-3 pb-2' : 'p-4 pb-2'}`}>
          <div className={`flex items-center justify-center py-2 ${isSidebarCollapsed ? 'px-0' : ''}`}>
            {isSidebarCollapsed || isSidebarTablet ? (
              <div className={isSidebarTablet ? 'w-[44px] h-[43px]' : 'w-[32px] h-[31px]'}>
                <svg className="block w-full h-full" fill="none" preserveAspectRatio="xMidYMid meet" viewBox="0 0 32 31.2586">
                  <path d={svgPaths.p7060570} fill="white" />
                  <path d={svgPaths.p1e481500} fill="#C5143D" />
                  <path d={svgPaths.p34cf2000} fill="#C5143D" />
                  <path d={svgPaths.p5cefe80} fill="#C5143D" />
                  <path d={svgPaths.p1f802200} fill="#C5143D" />
                  <path d={svgPaths.p294857a4} fill="#C5143D" />
                  <path d={svgPaths.p2c63b500} fill="#C5143D" />
                  <path d={svgPaths.p30ebc200} fill="#C5143D" />
                  <path d={svgPaths.p1f5ba880} fill="#C5143D" />
                  <path d={svgPaths.p391c9a00} fill="#C5143D" />
                  <path d={svgPaths.p8764f70} fill="#C5143D" />
                  <path d={svgPaths.p15c87e00} fill="#C5143D" />
                  <path d={svgPaths.p12c94730} fill="#C5143D" />
                  <path d={svgPaths.p34414b00} fill="#C5143D" />
                  <path d={svgPaths.p10b3f500} fill="#C5143D" />
                  <path d={svgPaths.p3d31dd80} fill="#C5143D" />
                  <path d={svgPaths.p5880b00} fill="#C5143D" />
                  <path d={svgPaths.p1c1f6000} fill="#C5143D" />
                  <path d={svgPaths.p23b7a980} fill="#C5143D" />
                  <path d={svgPaths.pc347600} fill="#C5143D" />
                  <path d={svgPaths.p196a6280} fill="#C5143D" />
                  <path d={svgPaths.p1f46da00} fill="#C5143D" />
                  <path d={svgPaths.p388b5500} fill="#C5143D" />
                  <path d={svgPaths.p33efb80} fill="#C5143D" />
                  <path d={svgPaths.p3fe9600} fill="#C5143D" />
                  <path d={svgPaths.pdaf0300} fill="#C5143D" />
                  <path d={svgPaths.p37f10600} fill="#C5143D" />
                  <path d={svgPaths.p301d1700} fill="#C5143D" />
                  <path d={svgPaths.p78b1900} fill="#C5143D" />
                  <path d={svgPaths.p3fee6e60} fill="#C5143D" />
                  <path d={svgPaths.p2f12dc80} fill="#C5143D" />
                  <path d={svgPaths.p133fdb80} fill="#C5143D" />
                  <path d={svgPaths.p2ea90000} fill="#C5143D" />
                  <path d={svgPaths.pd11980} fill="#C5143D" />
                  <path d={svgPaths.p1e0e9b00} fill="#C5143D" />
                  <path d={svgPaths.p17b9af80} fill="#C5143D" />
                  <path d={svgPaths.p29edcef0} fill="#C5143D" />
                  <path d={svgPaths.p29b17800} fill="#C5143D" />
                  <path d={svgPaths.p2f75e700} fill="#C5143D" />
                  <path d={svgPaths.p2bd61460} fill="#C5143D" />
                  <path d={svgPaths.p14b76400} fill="#C5143D" />
                  <path d={svgPaths.p12ce0900} fill="#C5143D" />
                  <path d={svgPaths.p16f22000} fill="#C5143D" />
                  <path d={svgPaths.pb6c9ca0} fill="#C5143D" />
                  <path d={svgPaths.p3ab55d00} fill="#C5143D" />
                  <path d={svgPaths.p28233b00} fill="#C5143D" />
                  <path d={svgPaths.p16dbf600} fill="#C5143D" />
                  <path d={svgPaths.pd0ae1f0} fill="#C5143D" />
                  <path d={svgPaths.p2053e800} fill="#C5143D" />
                  <path d={svgPaths.p17f6700} fill="#C5143D" />
                  <path d={svgPaths.p2c4aa400} fill="#C5143D" />
                  <path d={svgPaths.p1b56f210} fill="#C5143D" />
                  <path d={svgPaths.p28051be0} fill="#C5143D" />
                  <path d={svgPaths.p3a552200} fill="#C5143D" />
                  <path d={svgPaths.p190b1480} fill="white" />
                </svg>
              </div>
            ) : (
              <div className="w-[150px] h-[50px]">
                <Lma />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 ${isSidebarCollapsed ? 'px-1.5' : isSidebarTablet ? 'px-2' : 'px-3'} py-4`}>
          {!isSidebarCollapsed && !isSidebarTablet && (
            <p className="text-[11px] uppercase tracking-wider text-sidebar-foreground/40 mb-2 px-2">Pages</p>
          )}
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-2' : isSidebarTablet ? 'flex-col justify-center gap-1 px-2 py-3' : 'gap-2.5 px-3 py-2'} ${isSidebarTablet ? 'text-[11px]' : 'text-[13px]'} transition-colors ${
                      isActive
                        ? 'bg-[#C5143D] text-white'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
                    }`
                  }
                >
                  <item.icon size={isSidebarTablet ? 20 : 15} />
                  {!isSidebarCollapsed && item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section: Notifications, Logout, Collapse toggle */}
        <div className={`${isSidebarCollapsed ? 'px-1.5' : isSidebarTablet ? 'px-2' : 'px-3'} pb-3 space-y-0.5`}>
          {/* Notification Bell */}
          <div className="relative">
            <button
              className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full px-0 py-2' : isSidebarTablet ? 'flex-col justify-center gap-1 w-full px-2 py-3' : 'gap-2.5 w-full px-3 py-2'} ${isSidebarTablet ? 'text-[11px]' : 'text-[13px]'} text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors relative`}
              onClick={() => setShowNotifications(!showNotifications)}
              title={isSidebarCollapsed ? 'Notifications' : undefined}
            >
              <Bell size={isSidebarTablet ? 20 : 15} />
              {!isSidebarCollapsed && <span>Notifications</span>}
              <span className={`w-2 h-2 bg-[#C5143D] rounded-full ${isSidebarCollapsed ? 'absolute top-1.5 right-1.5' : isSidebarTablet ? 'absolute top-2 right-2' : 'ml-auto'}`} />
            </button>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <div
                  className="absolute left-full bottom-0 ml-1 w-[380px] bg-white border border-[#d1d5db] shadow-lg z-50"
                  style={{ fontFamily: "'Neue Helvetica', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#d1d5db]">
                    <span className="text-[13px] text-[#1F1F1F]">Notifications</span>
                    <span className="text-[11px] text-[#9ca3af]">{notifications.length} new</span>
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {notifications.map((n) => (
                      <Link
                        key={n.id}
                        to={`/approvals?tab=history&historyId=${n.historyId}`}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 border-b border-[#f0f0f0] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {n.type === 'approve' ? (
                            <span className="flex items-center justify-center w-5 h-5 bg-emerald-50 text-emerald-600"><Check size={12} /></span>
                          ) : (
                            <span className="flex items-center justify-center w-5 h-5 bg-red-50 text-[#C5143D]"><X size={12} /></span>
                          )}
                          <span className="text-[13px] text-[#1F1F1F]">{n.itemName}</span>
                          <span className={`text-[11px] ${n.type === 'approve' ? 'text-emerald-700' : 'text-[#C5143D]'}`}>
                            {n.type === 'approve' ? 'Approved' : 'Rejected'}
                          </span>
                          <span className="ml-auto text-[10px] text-[#9ca3af]">{n.time}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Logout */}
          <button
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full px-0 py-2' : isSidebarTablet ? 'flex-col justify-center gap-1 w-full px-2 py-3' : 'gap-2.5 w-full px-3 py-2'} ${isSidebarTablet ? 'text-[11px]' : 'text-[13px]'} text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors`}
            title={isSidebarCollapsed ? 'Log Out' : undefined}
          >
            <LogOut size={isSidebarTablet ? 20 : 15} />
            {!isSidebarCollapsed && <span>Log Out</span>}
          </button>

          {/* Divider */}
          <div className="border-t border-sidebar-border my-1" />

          {/* Collapse / Expand toggle */}
          <button
            onClick={cycleSidebarMode}
            className={`flex items-center ${isSidebarCollapsed ? 'justify-center w-full px-0 py-2' : isSidebarTablet ? 'flex-col justify-center gap-1 w-full px-2 py-3' : 'gap-2.5 w-full px-3 py-2'} ${isSidebarTablet ? 'text-[11px]' : 'text-[13px]'} text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors`}
            title={isSidebarCollapsed ? 'Expand Sidebar' : isSidebarTablet ? 'Collapse Sidebar' : 'Tablet Sidebar'}
          >
            {isSidebarCollapsed ? <PanelLeftOpen size={isSidebarTablet ? 20 : 15} /> : <PanelLeftClose size={isSidebarTablet ? 20 : 15} />}
            {!isSidebarCollapsed && <span>{isSidebarTablet ? 'Collapse' : 'Tablet'}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background">
        {/* Top Bar — hidden on Approvals */}
        {!isApprovals && (
          <header className="h-[42px] min-h-[42px] border-b border-border flex items-center justify-between px-4 bg-white">
            <div className="flex items-center gap-1">
              {breadcrumbs.map((crumb, index) => (
                <span key={index} className="flex items-center gap-1">
                  {index > 0 && <ChevronRight size={12} className="text-[#9ca3af]" />}
                  {crumb.to && index < breadcrumbs.length - 1 ? (
                    <Link to={crumb.to} className="text-[13px] text-[#6b7280] no-underline hover:text-[#1F1F1F] transition-colors">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className={`text-[13px] ${index === breadcrumbs.length - 1 && breadcrumbs.length > 1 ? 'text-[#1F1F1F]' : 'text-[#6b7280]'}`}>
                      {crumb.label}
                    </span>
                  )}
                </span>
              ))}
            </div>
          </header>
        )}

        {/* Page Content */}
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
}