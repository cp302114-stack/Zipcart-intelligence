import React, { useState, useEffect } from 'react';
import {
  ArrowLeftRight,
  MapPin,
  Clock,
  IndianRupee,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Truck,
  Sparkles,
} from 'lucide-react';
import { DarkStoreMeta, StoreTransferEvaluation } from '../types';
import { fetchTransfers, approveRecommendation } from '../api';

interface TransfersViewProps {
  stores: DarkStoreMeta[];
  onActionSimulated: () => void;
}

export const TransfersView: React.FC<TransfersViewProps> = ({ stores, onActionSimulated }) => {
  const [targetStoreId, setTargetStoreId] = useState('store_7');
  const [sku, setSku] = useState('SKU-CD-750');
  const [transfers, setTransfers] = useState<StoreTransferEvaluation[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulatingId, setSimulatingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const signatureSkus = [
    { sku: 'SKU-CD-750', label: 'Thums Up Charged 750ml (Store 7 Challenge)' },
    { sku: 'SKU-DRY-MILK', label: 'Amul Taaza Milk 1L' },
    { sku: 'SKU-INST-MAGGI', label: 'Maggi 2-Minute Masala Noodles (4-Pack)' },
    { sku: 'SKU-SNK-LAYS', label: "Lay's India's Magic Masala 115g" },
  ];

  const loadTransfers = () => {
    setLoading(true);
    fetchTransfers(targetStoreId, sku)
      .then((data) => {
        setTransfers(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTransfers();
  }, [targetStoreId, sku]);

  const handleSimulateTransfer = async (transfer: StoreTransferEvaluation) => {
    setSimulatingId(transfer.id);
    setSuccessMsg(null);
    try {
      // Find recommendation ID pattern or direct simulation
      await approveRecommendation(`rec-${transfer.destinationStoreId}-${transfer.sku}`, undefined, transfer.recommendedTransferQty, `Manager approved direct transfer of ${transfer.recommendedTransferQty} units from ${transfer.sourceStoreName}`);
      setSuccessMsg(`Simulated transfer of ${transfer.recommendedTransferQty} units from ${transfer.sourceStoreName} to ${transfer.destinationStoreName} successful!`);
      onActionSimulated();
      loadTransfers();
    } catch (err: any) {
      alert(`Simulation notice: ${err.message}`);
    } finally {
      setSimulatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-400" />
            Inter-Store Surplus Balancing & Transfer Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluating pairwise surplus-to-shortage transfers respecting urban travel times, safety cushions, and dispatch economics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-semibold">Shortage Store:</label>
            <select
              value={targetStoreId}
              onChange={(e) => setTargetStoreId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-emerald-500"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs text-slate-400 font-semibold">SKU:</label>
            <select
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg font-semibold focus:outline-none focus:border-emerald-500"
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

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20">
            SIMULATED STATE UPDATED
          </span>
        </div>
      )}

      {/* Candidate Transfers Cards / Table */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Evaluating candidate transfer routes...</div>
        ) : transfers.length === 0 ? (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-xs">
            No candidate donor stores found within 12km transit radius with surplus inventory.
          </div>
        ) : (
          transfers.map((item) => {
            const isStore9Pair = item.sourceStoreId === 'store_9' && item.destinationStoreId === 'store_7';

            return (
              <div
                key={item.id}
                className={`p-5 rounded-xl border transition-all ${
                  item.isFeasible
                    ? isStore9Pair
                      ? 'bg-gradient-to-r from-emerald-950/20 via-[#0f172a] to-[#0f172a] border-emerald-500/60 shadow-lg'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                    : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Route & Distance */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-bold text-white">
                        {item.sourceStoreName}
                      </span>
                      <ArrowLeftRight className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {item.destinationStoreName}
                      </span>

                      {isStore9Pair && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                          ⭐️ MATCH CHALLENGE PAIR
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-500" />
                        {item.distanceKm} km transit
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        ~{item.travelMinutes} mins travel time
                      </span>
                      <span>•</span>
                      <span>
                        Source Surplus: <strong className="text-white">{item.sourceAvailableSurplus}u</strong> (Stock: {item.sourceCurrentStock}, Safety: {item.sourceSafetyStock})
                      </span>
                    </div>

                    {/* Infeasibility flag if any */}
                    {!item.isFeasible && (
                      <div className="text-xs text-red-400 flex items-center space-x-1.5 pt-1">
                        <XCircle className="w-4 h-4 shrink-0" />
                        <span>Infeasible: {item.rejectionReason}</span>
                      </div>
                    )}
                  </div>

                  {/* Economics & Benefits */}
                  <div className="flex flex-wrap items-center gap-6 font-mono text-xs">
                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block font-sans">Transfer Qty</span>
                      <span className="text-base font-extrabold text-white">
                        {item.recommendedTransferQty} units
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block font-sans">Dispatch Cost</span>
                      <span className="text-base font-extrabold text-slate-300">
                        ₹{item.transferCost}
                      </span>
                    </div>

                    <div className="text-center">
                      <span className="text-[10px] text-slate-400 block font-sans">Margin Saved</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        +₹{item.expectedMarginSaved}
                      </span>
                    </div>

                    <div className="text-center bg-slate-900 px-3.5 py-1.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">Net Operational Benefit</span>
                      <span className={`text-base font-extrabold ${item.netBenefit > 0 ? 'text-emerald-300' : 'text-slate-400'}`}>
                        {item.netBenefit > 0 ? `+₹${item.netBenefit}` : `₹${item.netBenefit}`}
                      </span>
                    </div>

                    {/* Action Button */}
                    <div>
                      <button
                        onClick={() => handleSimulateTransfer(item)}
                        disabled={!item.isFeasible || simulatingId === item.id}
                        className={`px-4 py-2 rounded-lg font-bold text-xs tracking-wide transition-all shadow-md cursor-pointer ${
                          item.isFeasible
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {simulatingId === item.id ? 'Simulating...' : 'Simulate Transfer'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
