import React, { useState, useEffect } from 'react';
import {
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  IndianRupee,
  SlidersHorizontal,
} from 'lucide-react';
import { DarkStoreMeta, ShelfSwapOpportunity } from '../types';
import { fetchShelfOptimization, approveRecommendation } from '../api';

interface ShelfViewProps {
  stores: DarkStoreMeta[];
  onActionSimulated: () => void;
}

export const ShelfView: React.FC<ShelfViewProps> = ({ stores, onActionSimulated }) => {
  const [storeId, setStoreId] = useState('store_7');
  const [swaps, setSwaps] = useState<ShelfSwapOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulatingIndex, setSimulatingIndex] = useState<number | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadSwaps = () => {
    setLoading(true);
    fetchShelfOptimization(storeId)
      .then((data) => {
        setSwaps(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadSwaps();
  }, [storeId]);

  const handleSimulateSwap = async (item: ShelfSwapOpportunity, index: number) => {
    setSimulatingIndex(index);
    setSuccessMsg(null);
    try {
      await approveRecommendation(
        `rec-${item.storeId}-${item.fastMovingSku}`,
        `alt-shelf-${item.slowMovingSku}-${item.fastMovingSku}`,
        item.proposedReallocatedCapacity,
        `Manager approved shelf slot reallocation: transferred ${item.proposedReallocatedCapacity} slots from ${item.slowMovingName} to ${item.fastMovingName}`
      );
      setSuccessMsg(`Simulated shelf slot swap executed! Reallocated ${item.proposedReallocatedCapacity} slots to ${item.fastMovingName}.`);
      onActionSimulated();
      loadSwaps();
    } catch (err: any) {
      alert(`Simulation status: ${err.message}`);
    } finally {
      setSimulatingIndex(null);
    }
  };

  const currentStore = stores.find((s) => s.id === storeId) || stores[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Intelligent Shelf-Space Allocation & Product Swap Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detecting slow-selling space hogs vs shelf-starved high-velocity items and calculating net contribution margin gains
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400 font-semibold">Store:</label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-emerald-500"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20">
            SHELF SLOTS RECONFIGURED
          </span>
        </div>
      )}

      {/* Visual Shelf Bay Representation */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <span>Physical Shelf Bay Analysis — {currentStore.name}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            Total Bay Capacity: 5,000 units ({currentStore.shelfUtilizationPct}% utilized)
          </span>
        </h3>

        {/* Shelf diagram bar */}
        <div className="space-y-2">
          <div className="h-6 w-full bg-slate-900 rounded-lg overflow-hidden flex border border-slate-800">
            <div
              className="bg-emerald-500/80 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
              style={{ width: '45%' }}
              title="Fast Movers: 45%"
            >
              Fast Movers (45%)
            </div>
            <div
              className="bg-amber-500/70 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
              style={{ width: '35%' }}
              title="Moderate Movers: 35%"
            >
              Standard SKUs (35%)
            </div>
            <div
              className="bg-red-500/60 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
              style={{ width: '20%' }}
              title="Slow Movers Hogging Space: 20%"
            >
              Slow Space Hogs (20%)
            </div>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>High Return Velocity Slots</span>
            <span className="text-red-400 font-medium">Reallocation Target: 20% low-turnover slots</span>
          </div>
        </div>
      </div>

      {/* Recommended Swaps List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Evaluating shelf swap opportunities...</div>
        ) : swaps.length === 0 ? (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
            Shelf space in {currentStore.name} is currently well-balanced.
          </div>
        ) : (
          swaps.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all space-y-4 shadow-sm"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-white mb-1">
                    <span className="text-red-400 font-mono">SPACE DONOR:</span>
                    <span>{item.slowMovingName}</span>
                    <ArrowRight className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">EXPANDED HERO:</span>
                    <span>{item.fastMovingName}</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-3xl">
                    {item.explanation}
                  </p>
                </div>

                <div className="flex items-center space-x-4 shrink-0 font-mono text-xs">
                  <div className="bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans">Slots Shifted</span>
                    <span className="text-base font-extrabold text-white">
                      +{item.proposedReallocatedCapacity} slots
                    </span>
                  </div>

                  <div className="bg-slate-900 px-3.5 py-2 rounded-lg border border-slate-800 text-center">
                    <span className="text-[10px] text-slate-400 block font-sans">Expected Margin Gain</span>
                    <span className="text-base font-extrabold text-emerald-400">
                      +₹{item.expectedMarginGain}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSimulateSwap(item, idx)}
                    disabled={!item.isFeasible || simulatingIndex === idx}
                    className="px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {simulatingIndex === idx ? 'Executing...' : 'Simulate Shelf Swap'}
                  </button>
                </div>
              </div>

              {/* Side-by-Side Comparison Box */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
                {/* Slow Mover Details */}
                <div className="space-y-1.5 border-r-0 md:border-r border-slate-800 pr-0 md:pr-4">
                  <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase">
                    Donor: {item.slowMovingName}
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Sales Velocity:</span>
                    <span className="text-amber-400">{item.slowMovingHourlyVelocity} units/hr (Slow)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Current Capacity:</span>
                    <span>{item.slowMovingShelfCapacity} slots</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>New Capacity After Swap:</span>
                    <span className="font-bold text-slate-100">{item.newSlowMovingCapacity} slots</span>
                  </div>
                </div>

                {/* Fast Mover Details */}
                <div className="space-y-1.5 pl-0 md:pl-2">
                  <div className="text-slate-400 font-sans font-semibold text-[11px] uppercase">
                    Recipient: {item.fastMovingName}
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Demand Rate:</span>
                    <span className="text-emerald-400 font-bold">{item.fastMovingHourlyVelocity} units/hr (High)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Current Capacity:</span>
                    <span>{item.fastMovingShelfCapacity} slots (Starved)</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>New Capacity After Swap:</span>
                    <span className="font-bold text-emerald-400">{item.newFastMovingCapacity} slots</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
