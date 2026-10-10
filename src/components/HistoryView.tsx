import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { DecisionRecord } from '../types';
import { fetchDecisionHistory } from '../api';

export const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchDecisionHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Manager Decision Audit Trail & Simulation Ledger
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete compliance record of all approved, rejected, and simulated interventions with before-and-after metrics
          </p>
        </div>

        <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          SIMULATED AUDIT LOG • {history.length} RECORDS
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Loading decision history...</div>
        ) : history.length === 0 ? (
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-12 text-center text-slate-500 text-xs">
            No simulated decisions logged yet. Head to the Decision Center or Store Transfers tab to review and approve interventions.
          </div>
        ) : (
          history.map((record) => (
            <div
              key={record.id}
              className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${
                      record.decision === 'APPROVED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {record.decision}
                  </span>
                  <h3 className="font-bold text-sm text-white">
                    {record.actionSummary}
                  </h3>
                </div>

                <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(record.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Store & SKU</span>
                  <span className="text-slate-200 font-semibold">{record.storeName}</span>
                  <span className="text-slate-500 block text-[10px]">{record.sku}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Initial Shortage</span>
                  <span className="text-red-400 font-bold">-{record.baselineMetrics.expectedShortage} units</span>
                  <span className="text-slate-500 block text-[10px]">
                    Margin Risk: ₹{record.baselineMetrics.lostContributionMargin}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Simulated Stock Saved</span>
                  <span className="text-emerald-400 font-bold">+{record.simulatedOutcome.stockSaved} units</span>
                  <span className="text-slate-500 block text-[10px]">
                    Saved Margin: +₹{record.simulatedOutcome.contributionMarginSaved}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-sans block">Net ROI Saved</span>
                  <span className="text-emerald-300 font-extrabold text-sm">
                    +₹{record.simulatedOutcome.netBenefit}
                  </span>
                </div>
              </div>

              {/* Manager notes and residual risk */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-1">
                <div>
                  <strong className="text-slate-300">Manager Note:</strong> {record.managerNotes || 'Standard authorization'}
                </div>
                <div className="font-mono text-slate-500 text-[10px]">
                  Status: {record.simulatedOutcome.isFullyResolved ? '✅ Fully Resolved' : '⚠️ Action Pending'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
