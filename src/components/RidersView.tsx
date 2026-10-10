import React, { useState, useEffect } from 'react';
import {
  Bike,
  AlertTriangle,
  CheckCircle2,
  Users,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { RiderAnalysisResult } from '../types';
import { fetchRiders, approveRecommendation } from '../api';

interface RidersViewProps {
  onActionSimulated: () => void;
}

export const RidersView: React.FC<RidersViewProps> = ({ onActionSimulated }) => {
  const [riders, setRiders] = useState<RiderAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'BOTTLENECK'>('BOTTLENECK');
  const [simulatingStoreId, setSimulatingStoreId] = useState<string | null>(null);

  const loadRiders = () => {
    setLoading(true);
    fetchRiders()
      .then((data) => {
        setRiders(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadRiders();
  }, []);

  const displayedRiders = riders.filter((r) => {
    if (filter === 'BOTTLENECK') {
      return r.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK' || r.bottleneckType === 'COMPOUND_BOTTLENECK';
    }
    return true;
  });

  const handleSimulateReassign = async (item: RiderAnalysisResult) => {
    setSimulatingStoreId(item.storeId);
    try {
      await approveRecommendation(
        `rec-${item.storeId}-SKU-CD-750`,
        undefined,
        undefined,
        `Manager approved rider reassignment: dispatched ${item.recommendedAdditionalRiders} riders from ${item.recommendedDonorStoreName || 'surplus hubs'} to ${item.storeName}`
      );
      loadRiders();
      onActionSimulated();
    } catch (err: any) {
      alert(`Simulation notice: ${err.message}`);
    } finally {
      setSimulatingStoreId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Bike className="w-5 h-5 text-orange-400" />
            Rider Capacity & Delivery Fleet Diagnostics
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Distinguishing orders lost to delivery fleet bottlenecks vs product stockouts. Preventing false replenishment orders!
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setFilter('BOTTLENECK')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filter === 'BOTTLENECK' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Bottlenecks Only
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              filter === 'ALL' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All 30 Stores
          </button>
        </div>
      </div>

      {/* Fleet Diagnostic Warning Card for Store 15 Scenario */}
      <div className="bg-gradient-to-r from-orange-950/20 via-[#0f172a] to-[#0f172a] border border-orange-500/40 rounded-xl p-5 space-y-2 shadow-lg">
        <div className="flex items-center space-x-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4" />
          <span>Core AI Diagnostic Insight: Fleet Deficit vs Inventory Shortage</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed max-w-4xl">
          If store shelves are 98% stocked but orders are failing delivery SLAs, <strong>do NOT order additional inventory trucks</strong>. Overstocking exacerbates storage space constraints without clearing delivery queues. Dispatching fleet surge or cross-hub rider rebalancing clears backlogs immediately.
        </p>
      </div>

      {/* Rider Analysis Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs col-span-2">Analyzing fleet metrics...</div>
        ) : displayedRiders.length === 0 ? (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs col-span-2">
            No active rider bottlenecks detected. Fleet capacity matches current order volumes.
          </div>
        ) : (
          displayedRiders.map((item) => {
            const isBottleneck =
              item.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK' || item.bottleneckType === 'COMPOUND_BOTTLENECK';

            return (
              <div
                key={item.storeId}
                className={`p-5 rounded-xl border transition-all ${
                  isBottleneck
                    ? 'bg-[#0f172a] border-orange-500/50 shadow-md'
                    : 'bg-[#0f172a] border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-sm text-white">{item.storeName}</h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Store ID: {item.storeId}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-extrabold font-mono uppercase tracking-wider ${
                      item.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK'
                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                        : item.bottleneckType === 'COMPOUND_BOTTLENECK'
                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {item.bottleneckType.replace(/_/g, ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-4">
                  {item.actionSummary}
                </p>

                {/* Grid metrics */}
                <div className="grid grid-cols-3 gap-2 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono mb-4">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Active Riders</span>
                    <span className="font-bold text-slate-200">{item.activeRiders} riders</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Incoming Orders</span>
                    <span className="font-bold text-white">{item.currentHourlyOrderRate}/hr</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-sans">Delivery Cap</span>
                    <span className={`font-bold ${item.capacityUtilizationPct > 100 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {item.deliveryCapacityPerHour} ord/hr
                    </span>
                  </div>
                </div>

                {isBottleneck && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
                    <div className="font-mono text-slate-400">
                      <span className="text-red-400 font-bold">Unserved Orders: {item.unservedOrdersPerHour}/hr</span>
                      <span className="text-slate-500 block text-[10px]">
                        Est. Lost Revenue: ₹{item.estimatedLostOrderRevenue}/hr
                      </span>
                    </div>

                    <button
                      onClick={() => handleSimulateReassign(item)}
                      disabled={simulatingStoreId === item.storeId}
                      className="px-3.5 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer shrink-0"
                    >
                      {simulatingStoreId === item.storeId ? 'Reassigning...' : `Reassign +${item.recommendedAdditionalRiders} Riders`}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
