import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
  Flame,
  Truck,
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
  ReferenceLine,
} from 'recharts';
import { DarkStoreMeta, InventoryForecastResult } from '../types';
import { fetchForecast } from '../api';

interface DemandForecastViewProps {
  stores: DarkStoreMeta[];
  initialStoreId?: string;
  initialSku?: string;
}

export const DemandForecastView: React.FC<DemandForecastViewProps> = ({
  stores,
  initialStoreId = 'store_7',
  initialSku = 'SKU-CD-750',
}) => {
  const [storeId, setStoreId] = useState(initialStoreId);
  const [sku, setSku] = useState(initialSku);
  const [forecast, setForecast] = useState<InventoryForecastResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick signature SKUs for direct testing
  const signatureSkus = [
    { sku: 'SKU-CD-750', label: 'Thums Up Charged 750ml (Store 7 Challenge)' },
    { sku: 'SKU-CD-750-COKE', label: 'Coca-Cola Zero Sugar 750ml' },
    { sku: 'SKU-SNK-WASABI', label: 'Artisanal Wasabi Kale Crisps (Slow Seller)' },
    { sku: 'SKU-SNK-LAYS', label: "Lay's India's Magic Masala 115g Party Pack" },
    { sku: 'SKU-SNK-POPCORN', label: 'ACT II Butter Lovers Popcorn 85g' },
    { sku: 'SKU-DRY-MILK', label: 'Amul Taaza Milk 1L' },
    { sku: 'SKU-INST-MAGGI', label: 'Maggi 2-Minute Masala Noodles (4-Pack)' },
  ];

  useEffect(() => {
    setLoading(true);
    fetchForecast(storeId, sku)
      .then((res) => {
        setForecast(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [storeId, sku]);

  const currentStore = stores.find((s) => s.id === storeId) || stores[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Selector Ribbon */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Hourly Inventory & Demand Forecasting Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulating hourly depletion velocity from 18:30 through evening match window until truck replenishment
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-semibold">Store:</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-semibold">Product SKU:</label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold"
            >
              {signatureSkus.map((item) => (
                <option key={item.sku} value={item.sku}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading || !forecast ? (
        <div className="p-12 text-center text-slate-400 text-xs">Loading forecast model...</div>
      ) : (
        <>
          {/* Key Metrics Cards for this SKU */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Current Stock
              </span>
              <div className="text-2xl font-extrabold text-white font-mono">
                {forecast.currentStock} units
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Shelf Cap: {forecast.shelfCapacity} ({forecast.shelfUtilizationPct}%)
              </div>
            </div>

            <div className={`border rounded-xl p-4 ${
              forecast.riskLevel === 'CRITICAL'
                ? 'bg-red-950/20 border-red-800/60'
                : forecast.riskLevel === 'WARNING'
                ? 'bg-amber-950/20 border-amber-800/60'
                : 'bg-[#0f172a] border-slate-800'
            }`}>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Stockout Window
              </span>
              <div className={`text-2xl font-extrabold font-mono ${
                forecast.riskLevel === 'CRITICAL' ? 'text-red-400' : 'text-slate-200'
              }`}>
                {forecast.timeUntilStockoutMinutes !== null ? `~${forecast.timeUntilStockoutMinutes} min` : 'None'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Coverage: {forecast.inventoryCoverageHours} hrs
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Next Truck Arrival
              </span>
              <div className="text-2xl font-extrabold text-slate-200 font-mono">
                {forecast.nextTruckArrival}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                In ~{forecast.minutesUntilTruck} minutes
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Demand Before Truck
              </span>
              <div className="text-2xl font-extrabold text-sky-400 font-mono">
                {forecast.totalDemandUntilTruck} units
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Stock @ Truck: {forecast.projectedStockAtTruckArrival}u
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Projected Shortage
              </span>
              <div className="text-2xl font-extrabold text-red-400 font-mono">
                {forecast.expectedShortageQuantity > 0 ? `-${forecast.expectedShortageQuantity} units` : '0 units'}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Safety Stock: {forecast.safetyStock}u
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Lost Contribution Margin
              </span>
              <div className="text-2xl font-extrabold text-amber-400 font-mono">
                ₹{forecast.estimatedLostContributionMargin.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 font-mono">
                Gross: ₹{forecast.estimatedLostSalesRevenue}
              </div>
            </div>
          </div>

          {/* Interactive Chart Container */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Hourly Depletion Timeline & Stockout Horizon</span>
                  {forecast.riskLevel === 'CRITICAL' && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      CRITICAL STOCKOUT DETECTED
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hourly effective demand vs remaining stock on hand. Green area depleting before truck arrival (dashed marker).
                </p>
              </div>

              {forecast.activeEventNames.length > 0 && (
                <div className="flex items-center space-x-1.5 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Events: {forecast.activeEventNames.join(', ')}</span>
                </div>
              )}
            </div>

            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecast.hourlyPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="timeLabel" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0b0f19',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine
                    y={forecast.safetyStock}
                    stroke="#f59e0b"
                    strokeDasharray="4 4"
                    label={{ value: `Safety Stock (${forecast.safetyStock}u)`, fill: '#f59e0b', fontSize: 10, position: 'right' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="projectedStockOnHand"
                    name="Projected Stock On Hand"
                    fill="#059669"
                    fillOpacity={0.2}
                    stroke="#10b981"
                    strokeWidth={2.5}
                  />
                  <Bar
                    dataKey="effectiveDemand"
                    name="Hourly Demand Rate"
                    fill="#38bdf8"
                    opacity={0.7}
                    barSize={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="unmetDemand"
                    name="Unmet Shortage"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#ef4444' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Hourly Tabular Breakdown */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Hourly Forecast Simulation Table
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/40">
                    <th className="py-2.5 px-3">Time Window</th>
                    <th className="py-2.5 px-3 text-center">Base Demand</th>
                    <th className="py-2.5 px-3 text-center">Multiplier</th>
                    <th className="py-2.5 px-3 text-center">Effective Demand</th>
                    <th className="py-2.5 px-3 text-center">Cumulative Demand</th>
                    <th className="py-2.5 px-3 text-center">Stock on Hand</th>
                    <th className="py-2.5 px-3 text-center">Truck Arrival</th>
                    <th className="py-2.5 px-3 text-right">Shortage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {forecast.hourlyPoints.map((pt) => (
                    <tr
                      key={pt.hourIndex}
                      className={`hover:bg-slate-800/30 ${
                        pt.isStockout ? 'bg-red-950/15' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-slate-200">
                        {pt.timeLabel}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-300">
                        {pt.baselineDemand}u/hr
                      </td>
                      <td className="py-2 px-3 text-center text-amber-300">
                        {pt.eventMultiplier}x
                      </td>
                      <td className="py-2 px-3 text-center text-sky-400 font-bold">
                        {pt.effectiveDemand}u
                      </td>
                      <td className="py-2 px-3 text-center text-slate-400">
                        {pt.cumulativeDemand}u
                      </td>
                      <td className="py-2 px-3 text-center font-bold">
                        <span className={pt.projectedStockOnHand === 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {pt.projectedStockOnHand}u
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center font-sans">
                        {pt.isReplenishmentArrival ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            🚛 Scheduled Truck (+{pt.replenishmentQuantity}u)
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-bold">
                        {pt.unmetDemand > 0 ? (
                          <span className="text-red-400">-{pt.unmetDemand}u</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
