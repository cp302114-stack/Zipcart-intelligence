import React, { useState } from 'react';
import {
  Store,
  Boxes,
  AlertTriangle,
  IndianRupee,
  Sparkles,
  Bike,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { DashboardData, DarkStoreMeta, OperationalRecommendation } from '../types';

interface DashboardViewProps {
  data: DashboardData;
  stores: DarkStoreMeta[];
  onSelectStore: (storeId: string) => void;
  onNavigateToTab: (tab: any) => void;
  onSelectRecommendation: (rec: OperationalRecommendation) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  stores,
  onSelectStore,
  onNavigateToTab,
  onSelectRecommendation,
}) => {
  const [storeFilter, setStoreFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'HEALTHY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStores = stores.filter((s) => {
    const matchesFilter = storeFilter === 'ALL' || s.status === storeFilter;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.locality.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Sample aggregated city-wide hourly demand timeline
  const demandTimeline = [
    { time: '17:00', actualSales: 410, forecastDemand: 410, stockLevel: 3200, event: '' },
    { time: '18:00', actualSales: 580, forecastDemand: 580, stockLevel: 2620, event: 'Rush Hour' },
    { time: '18:30 (NOW)', actualSales: 750, forecastDemand: 750, stockLevel: 2100, event: 'Current Time' },
    { time: '19:00', actualSales: null, forecastDemand: 1120, stockLevel: 1450, event: 'Pre-Match Surge' },
    { time: '19:30', actualSales: null, forecastDemand: 1680, stockLevel: 820, event: 'Match Starts 🏏' },
    { time: '20:00', actualSales: null, forecastDemand: 1850, stockLevel: 310, event: 'Peak Match Orders' },
    { time: '20:30', actualSales: null, forecastDemand: 1540, stockLevel: 110, event: 'Critical Depletion' },
    { time: '21:00', actualSales: null, forecastDemand: 1390, stockLevel: 1950, event: 'Scheduled Truck 🚛' },
    { time: '22:00', actualSales: null, forecastDemand: 980, stockLevel: 1450, event: 'Post-Match Wrap' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner: Real Problem Statement */}
      <div className="rounded-xl bg-gradient-to-r from-[#121c33] via-[#0d1c2d] to-[#112423] p-5 border border-slate-700/60 shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Intelligent Operations Dispatch • 30 Dark Stores</span>
            </div>
            <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight">
              Which stores will run out of what before the next truck, and what should I do right now?
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Forecasting hourly stockout windows across Bangalore metro ahead of the 19:30 T20 fixture. Evaluating inter-store transfers, shelf reallocations, rush replenishment, and rider fleet bottlenecks.
            </p>
          </div>
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('decisions')}
              className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md flex items-center space-x-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Review AI Decisions ({data.kpis.pendingRecommendations})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6 Key KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stores Monitored</span>
            <Store className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {data.kpis.storesMonitored}
          </div>
          <div className="flex items-center space-x-1.5 mt-2 text-[10px]">
            <span className="text-emerald-400 font-semibold">{data.kpis.storesStatus.healthy} Healthy</span>
            <span className="text-slate-500">•</span>
            <span className="text-amber-400 font-semibold">{data.kpis.storesStatus.warning} Warn</span>
            <span className="text-slate-500">•</span>
            <span className="text-red-400 font-semibold">{data.kpis.storesStatus.critical} Crit</span>
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Catalog SKUs</span>
            <Boxes className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-mono">
            {data.kpis.productsMonitored.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2">
            Across 8 Departments
          </div>
        </div>

        <div className="bg-[#0f172a] border border-red-900/40 rounded-xl p-4 shadow-sm bg-gradient-to-b from-red-950/20 to-transparent">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Stockout Risks</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-extrabold text-red-300 font-mono">
            {data.kpis.productsAtRisk}
          </div>
          <div className="text-[10px] text-red-400 mt-2 font-medium">
            Depleting before truck arrival
          </div>
        </div>

        <div className="bg-[#0f172a] border border-amber-900/40 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Estimated Lost Sales</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-300 font-mono">
            ₹{data.kpis.estimatedLostSales.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-mono">
            Margin: ₹{data.kpis.estimatedLostMargin.toLocaleString()}
          </div>
        </div>

        <div className="bg-[#0f172a] border border-emerald-900/40 rounded-xl p-4 shadow-sm bg-gradient-to-b from-emerald-950/20 to-transparent">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Pending Actions</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-300 font-mono">
            {data.kpis.pendingRecommendations}
          </div>
          <div className="text-[10px] text-emerald-400 mt-2 font-medium">
            Ready for manager approval
          </div>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Rider Bottlenecks</span>
            <Bike className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-orange-300 font-mono">
            {data.kpis.storesWithRiderBottlenecks}
          </div>
          <div className="text-[10px] text-orange-400 mt-2 font-medium">
            Stores with fleet deficit
          </div>
        </div>
      </div>

      {/* Main Grid: Urgent Alerts & Demand Forecast Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Urgent Alerts (7 cols) */}
        <div className="lg:col-span-7 bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Urgent Stockout Alerts (Ranked by Shortage Window)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Next Truck ETA in 45-180m
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2.5">Store</th>
                  <th className="pb-2.5">Product & SKU</th>
                  <th className="pb-2.5 text-center">Stock</th>
                  <th className="pb-2.5 text-center">Stockout In</th>
                  <th className="pb-2.5 text-center">Truck ETA</th>
                  <th className="pb-2.5 text-right">Shortage</th>
                  <th className="pb-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {data.urgentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500 font-sans">
                      No critical stockout risks detected. All stores well-covered.
                    </td>
                  </tr>
                ) : (
                  data.urgentAlerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="py-3 font-sans font-semibold text-slate-200">
                        {alert.storeName}
                      </td>
                      <td className="py-3 font-sans">
                        <div className="text-slate-200 font-medium truncate max-w-[170px]" title={alert.productName}>
                          {alert.productName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">{alert.sku}</div>
                      </td>
                      <td className="py-3 text-center text-white font-bold">
                        {alert.currentStock}
                      </td>
                      <td className="py-3 text-center">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-red-500/20 text-red-300 border border-red-500/30">
                          {alert.timeUntilStockoutMinutes !== null ? `~${alert.timeUntilStockoutMinutes}m` : 'Immediate'}
                        </span>
                      </td>
                      <td className="py-3 text-center text-slate-300">
                        {alert.nextTruckArrival}
                      </td>
                      <td className="py-3 text-right text-red-400 font-bold">
                        -{alert.expectedShortage}u
                      </td>
                      <td className="py-3 text-right font-sans">
                        <button
                          onClick={() => {
                            const rec = data.topRecommendations.find((r) => r.storeId === alert.storeId);
                            if (rec) onSelectRecommendation(rec);
                            else onNavigateToTab('decisions');
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-[11px] font-bold border border-slate-700 hover:border-emerald-400 transition-all cursor-pointer"
                        >
                          Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Hourly Demand Curve (5 cols) */}
        <div className="lg:col-span-5 bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="font-bold text-sm text-white uppercase tracking-wider">
                Citywide Hourly Demand Surge
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
              Cricket Match 19:30
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Pre-match demand acceleration vs aggregate dark store inventory curve.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={demandTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0b0f19',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area
                  type="monotone"
                  dataKey="stockLevel"
                  name="Inventory on Hand"
                  fill="#059669"
                  fillOpacity={0.15}
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Bar dataKey="forecastDemand" name="Forecast Demand" fill="#38bdf8" opacity={0.7} barSize={16} />
                <Line
                  type="monotone"
                  dataKey="actualSales"
                  name="Actual Sales"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Store Overview: 30 Dark Stores Grid & Status */}
      <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              Dark Stores Command Grid (30 Metro Hubs)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational health, next truck arrival ETA, delivery fleet status, and critical stock
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
              {(['ALL', 'CRITICAL', 'WARNING', 'HEALTHY'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStoreFilter(filter)}
                  className={`px-2.5 py-1 rounded-md text-[11px] transition-colors ${
                    storeFilter === filter
                      ? 'bg-slate-800 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search store or locality..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-white px-3 py-1.5 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>
        </div>

        {/* 30 Stores Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {filteredStores.map((store) => {
            const isCrit = store.status === 'CRITICAL';
            const isWarn = store.status === 'WARNING';

            return (
              <div
                key={store.id}
                onClick={() => onSelectStore(store.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group hover:scale-[1.01] ${
                  isCrit
                    ? 'bg-red-950/20 border-red-800/60 hover:border-red-500'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-800/60 hover:border-amber-500'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-2">
                  <div className="truncate">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                      {store.locality}
                    </span>
                    <h4 className="font-bold text-xs text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                      {store.name}
                    </h4>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold font-mono uppercase tracking-wider shrink-0 ${
                      isCrit
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : isWarn
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {store.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-300 font-mono">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px]">Cold Drink 750ml:</span>
                    <span className={`font-bold ${store.signatureStock.coldDrink <= 14 ? 'text-red-400' : 'text-slate-200'}`}>
                      {store.signatureStock.coldDrink} units
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px]">Next Truck ETA:</span>
                    <span className="text-slate-200 font-semibold">{store.nextTruckArrival}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-sans text-[10px]">Active Fleet:</span>
                    <span className="text-slate-200 font-semibold">{store.activeRiders} riders</span>
                  </div>
                </div>

                {/* Rider bottleneck badge if applicable */}
                {store.riderBottleneck !== 'HEALTHY' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 text-[10px] text-orange-400 font-medium flex items-center justify-between">
                    <span>Fleet Deficit</span>
                    <span className="font-mono">{store.orderRate} orders/hr</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Highest Priority Recommendations Quick Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              Top AI Recommendations (Feasible & Ranked)
            </h3>
            <button
              onClick={() => onNavigateToTab('decisions')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>View All ({data.topRecommendations.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data.topRecommendations.slice(0, 3).map((rec) => (
              <div
                key={rec.id}
                onClick={() => onSelectRecommendation(rec)}
                className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      {rec.bestAction.actionType.replace('_', ' ')}
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-300">
                      {rec.bestAction.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    +₹{rec.bestAction.netBenefit} Net
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 mt-1">
                  {rec.reasoning.whatIsHappening}
                </p>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400">
                  <span>Store: {rec.storeName}</span>
                  <span className="font-mono text-slate-300">SLA: ~{rec.bestAction.timeToResolutionMinutes} mins</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Decisions Audit Trail */}
        <div className="bg-[#0f172a] border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Manager Simulated Decisions History
            </h3>
            <button
              onClick={() => onNavigateToTab('history')}
              className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
            >
              <span>Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {data.recentDecisions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No simulated decisions executed yet. Inspect recommendations in Decision Center to simulate interventions.
              </div>
            ) : (
              data.recentDecisions.map((dec) => (
                <div
                  key={dec.id}
                  className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between gap-3"
                >
                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-mono font-extrabold px-1.5 py-0.2 rounded uppercase ${
                          dec.decision === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-300 border border-red-500/30'
                        }`}
                      >
                        {dec.decision}
                      </span>
                      <span className="font-semibold text-slate-200 truncate">
                        {dec.actionSummary}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {dec.storeName} • {new Date(dec.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono">
                    <div className="text-emerald-400 font-bold text-xs">
                      +₹{dec.simulatedOutcome.netBenefit}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      {dec.simulatedOutcome.stockSaved} units saved
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
