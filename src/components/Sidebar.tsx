import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  TrendingUp,
  CalendarDays,
  ArrowLeftRight,
  Layers,
  Bike,
  Sparkles,
  SlidersHorizontal,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Zap,
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'inventory'
  | 'forecast'
  | 'events'
  | 'transfers'
  | 'shelf'
  | 'riders'
  | 'decisions'
  | 'simulator'
  | 'history'
  | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  criticalAlertCount: number;
  pendingRecCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
  criticalAlertCount,
  pendingRecCount,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory Intelligence', icon: Boxes, badge: criticalAlertCount > 0 ? `${criticalAlertCount} risk` : undefined, badgeColor: 'bg-red-500/20 text-red-400 border border-red-500/30' },
    { id: 'forecast', label: 'Demand Forecasts', icon: TrendingUp },
    { id: 'events', label: 'Events Hub', icon: CalendarDays },
    { id: 'transfers', label: 'Store Transfers', icon: ArrowLeftRight },
    { id: 'shelf', label: 'Shelf Optimization', icon: Layers },
    { id: 'riders', label: 'Rider Operations', icon: Bike },
    { id: 'decisions', label: 'Decision Center', icon: Sparkles, badge: pendingRecCount > 0 ? `${pendingRecCount} active` : undefined, badgeColor: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' },
    { id: 'simulator', label: 'Scenario Simulator', icon: SlidersHorizontal },
    { id: 'history', label: 'Decision History', icon: History },
    { id: 'settings', label: 'Settings & Scenarios', icon: Settings },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-30 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-200 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-[#0d1322]">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-950/40">
            <Zap className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-sm tracking-wide text-white uppercase flex items-center gap-1.5">
                Zipcart <span className="text-emerald-400 font-extrabold text-[11px] tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">AI</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-tight">Logistics Command Center</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/70 transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              } ${collapsed ? 'justify-center' : 'justify-between'}`}
              title={collapsed ? item.label : undefined}
            >
              <div className="flex items-center space-x-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && item.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-3 border-t border-slate-800/80 bg-[#0d1322]">
        {!collapsed ? (
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Engine Status
              </span>
              <span className="text-emerald-400 font-mono text-[10px]">LIVE 18:30</span>
            </div>
            <div className="text-[10px] text-slate-400">
              30 Dark Stores • Bangalore Metro
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Engine Live 18:30">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
        )}
      </div>
    </aside>
  );
};
