import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Bike,
  Layers,
  ArrowRight,
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
import { DarkStoreMeta } from '../types';
import { simulateWhatIf } from '../api';

interface SimulatorViewProps {
  stores: DarkStoreMeta[];
}

export const SimulatorView: React.FC<SimulatorViewProps> = ({ stores }) => {
  const [storeId, setStoreId] = useState('store_7');
  const [sku, setSku] = useState('SKU-CD-750');

  // Interactive slider parameters
  const [currentStock, setCurrentStock] = useState<number>(14);
  const [hourlyDemandMultiplier, setHourlyDemandMultiplier] = useState<number>(3.6);
  const [minutesUntilTruck, setMinutesUntilTruck] = useState<number>(90);
  const [shelfCapacity, setShelfCapacity] = useState<number>(14);
  const [riderCount, setRiderCount] = useState<number>(8);

  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const signatureSkus = [
    { sku: 'SKU-CD-750', label: 'Thums Up Charged 750ml (Store 7 Challenge)' },
    { sku: 'SKU-CD-750-COKE', label: 'Coca-Cola Zero Sugar 750ml' },
    { sku: 'SKU-SNK-LAYS', label: "Lay's India's Magic Masala 115g" },
    { sku: 'SKU-DRY-MILK', label: 'Amul Taaza Milk 1L' },
    { sku: 'SKU-INST-MAGGI', label: 'Maggi 2-Minute Masala Noodles' },
  ];

  const runSimulation = () => {
    setLoading(true);
    simulateWhatIf({
      storeId,
      sku,
      currentStock,
      hourlyDemandMultiplier,
      minutesUntilTruck,
      shelfCapacity,
      riderCount,
    })
      .then((res) => {
        setSimResult(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    runSimulation();
  }, [storeId, sku, currentStock, hourlyDemandMultiplier, minutesUntilTruck, shelfCapacity, riderCount]);

  const handleResetToStore7Challenge = () => {
    setStoreId('store_7');
    setSku('SKU-CD-750');
    setCurrentStock(14);
    setHourlyDemandMultiplier(3.6);
    setMinutesUntilTruck(90);
    setShelfCapacity(14);
    setRiderCount(8);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
            What-If Scenario Sandbox & Sensitivity Lab
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamically stress-test store inventory, surge multipliers, truck delays, and rider availability in real time
          </p>
        </div>

        <button
          onClick={handleResetToStore7Challenge}
          className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Store 7 Baseline</span>
        </button>
      </div>

      {/* Controls & Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 bg-[#0f172a] p-5 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 font-semibold mb-1">Target Store</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-slate-400 font-semibold mb-1">Target SKU</label>
          <select
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-semibold"
          >
            {signatureSkus.map((s) => (
              <option key={s.sku} value={s.sku}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-slate-400 font-semibold">Starting Stock</label>
            <span className="font-mono text-emerald-400 font-bold">{currentStock} units</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={currentStock}
            onChange={(e) => setCurrentStock(parseInt(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-slate-400 font-semibold">Demand Surge</label>
            <span className="font-mono text-amber-400 font-bold">{hourlyDemandMultiplier}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="6.0"
            step="0.1"
            value={hourlyDemandMultiplier}
            onChange={(e) => setHourlyDemandMultiplier(parseFloat(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between">
            <label className="text-slate-400 font-semibold">Truck ETA (Minutes)</label>
            <span className="font-mono text-sky-400 font-bold">{minutesUntilTruck} mins</span>
          </div>
          <input
            type="range"
            min="15"
            max="240"
            step="15"
            value={minutesUntilTruck}
            onChange={(e) => setMinutesUntilTruck(parseInt(e.target.value))}
            className="w-full accent-sky-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Recalculated What-If KPI Cards */}
      {simResult?.forecast && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Stockout ETA
            </span>
            <div className={`text-xl font-mono font-extrabold ${
              simResult.forecast.timeUntilStockoutMinutes !== null ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {simResult.forecast.timeUntilStockoutMinutes !== null
                ? `~${simResult.forecast.timeUntilStockoutMinutes} mins`
                : 'No Stockout'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Coverage: {simResult.forecast.inventoryCoverageHours}h
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Total Demand
            </span>
            <div className="text-xl font-mono font-extrabold text-sky-400">
              {simResult.forecast.totalDemandUntilTruck} units
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Until Truck Replenishment
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Expected Shortage
            </span>
            <div className="text-xl font-mono font-extrabold text-red-400">
              {simResult.forecast.expectedShortageQuantity > 0
                ? `-${simResult.forecast.expectedShortageQuantity} units`
                : '0 units'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Stock @ Truck: {simResult.forecast.projectedStockAtTruckArrival}u
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Lost Contribution
            </span>
            <div className="text-xl font-mono font-extrabold text-amber-400">
              ₹{simResult.forecast.estimatedLostContributionMargin}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Sales: ₹{simResult.forecast.estimatedLostSalesRevenue}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Rider Capacity
            </span>
            <div className="text-xl font-mono font-extrabold text-orange-300">
              {simResult.riderAnalysis.deliveryCapacityPerHour} ord/hr
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {simResult.riderAnalysis.bottleneckType.replace(/_/g, ' ')}
            </div>
          </div>

          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1">
              Best Transfer ROI
            </span>
            <div className="text-xl font-mono font-extrabold text-emerald-400">
              {simResult.bestTransferOption?.netBenefit > 0
                ? `+₹${simResult.bestTransferOption.netBenefit}`
                : '₹0'}
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              {simResult.bestTransferOption ? simResult.bestTransferOption.sourceStoreName : 'None feasible'}
            </div>
          </div>
        </div>
      )}

      {/* Forecast Chart */}
      {simResult?.forecast && (
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-white">
            Simulated Hourly Depletion Profile
          </h3>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simResult.forecast.hourlyPoints} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
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
                <Area
                  type="monotone"
                  dataKey="projectedStockOnHand"
                  name="Stock On Hand"
                  fill="#059669"
                  fillOpacity={0.2}
                  stroke="#10b981"
                  strokeWidth={2}
                />
                <Bar
                  dataKey="effectiveDemand"
                  name="Hourly Demand Rate"
                  fill="#38bdf8"
                  opacity={0.7}
                  barSize={18}
                />
                <Line
                  type="monotone"
                  dataKey="unmetDemand"
                  name="Unmet Shortage"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
