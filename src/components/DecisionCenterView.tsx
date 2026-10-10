import React, { useState } from 'react';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  IndianRupee,
  Sliders,
  FileText,
  RotateCcw,
  Info,
} from 'lucide-react';
import {
  OperationalRecommendation,
  DecisionAlternative,
  DecisionRecord,
} from '../types';
import { approveRecommendation, rejectRecommendation, fetchAiExplain } from '../api';

interface DecisionCenterViewProps {
  recommendations: OperationalRecommendation[];
  selectedRecId?: string;
  onActionSimulated: () => void;
}

export const DecisionCenterView: React.FC<DecisionCenterViewProps> = ({
  recommendations,
  selectedRecId,
  onActionSimulated,
}) => {
  const [activeRecId, setActiveRecId] = useState<string>(
    selectedRecId || (recommendations.length > 0 ? recommendations[0].id : '')
  );
  const [selectedAltId, setSelectedAltId] = useState<string | null>(null);
  const [adjustedQty, setAdjustedQty] = useState<number | null>(null);
  const [managerNotes, setManagerNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<{
    decision: DecisionRecord;
    recommendation: OperationalRecommendation;
  } | null>(null);

  // AI Executive Brief modal state
  const [aiBrief, setAiBrief] = useState<{ provider: string; text: string } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Synchronize when selectedRecId changes from props
  React.useEffect(() => {
    if (selectedRecId) {
      setActiveRecId(selectedRecId);
      setSelectedAltId(null);
      setAdjustedQty(null);
      setSimulationResult(null);
    } else if (!activeRecId && recommendations.length > 0) {
      setActiveRecId(recommendations[0].id);
    }
  }, [selectedRecId, recommendations]);

  const activeRec = recommendations.find((r) => r.id === activeRecId) || recommendations[0];

  const activeAlt = selectedAltId && activeRec
    ? activeRec.alternatives.find((a) => a.id === selectedAltId) || activeRec.bestAction
    : activeRec?.bestAction;

  const handleApprove = async () => {
    if (!activeRec) return;
    setIsSimulating(true);
    try {
      const result = await approveRecommendation(
        activeRec.id,
        activeAlt.id,
        adjustedQty || undefined,
        managerNotes || 'Manager approved via Decision Center'
      );
      setSimulationResult({
        decision: result.decision,
        recommendation: result.simulatedRecommendation,
      });
      onActionSimulated();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleReject = async () => {
    if (!activeRec) return;
    try {
      await rejectRecommendation(activeRec.id, rejectionReason || 'Manager accepted baseline stockout risk');
      setShowRejectModal(false);
      onActionSimulated();
    } catch (err: any) {
      alert(`Rejection failed: ${err.message}`);
    }
  };

  const handleRequestAiBrief = async () => {
    if (!activeRec) return;
    setLoadingAi(true);
    try {
      const res = await fetchAiExplain(activeRec.id);
      setAiBrief({ provider: res.provider, text: res.executiveBrief });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAi(false);
    }
  };

  if (!activeRec) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-12 text-center text-slate-400 text-xs">
        No active decision recommendations pending. All 30 stores operating within safety parameters.
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Simulation Banner Notice */}
      <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-emerald-300">
        <div className="flex items-center space-x-2 font-mono font-bold tracking-wider">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>SIMULATED — NOT EXECUTED IN REAL OPERATIONS</span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">
          Actions execute against the isolated simulation model
        </span>
      </div>

      {/* Main Decision Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Ranked Recommendations Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Prioritized Bottlenecks ({recommendations.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Ranked by Urgency</span>
          </div>

          <div className="space-y-2 max-h-[720px] overflow-y-auto pr-1">
            {recommendations.map((rec) => {
              const isCurrent = rec.id === activeRec.id;
              const isCrit = rec.riskLevel === 'CRITICAL';

              return (
                <div
                  key={rec.id}
                  onClick={() => {
                    setActiveRecId(rec.id);
                    setSelectedAltId(null);
                    setAdjustedQty(null);
                    setSimulationResult(null);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-gradient-to-r from-emerald-950/30 to-[#0f172a] border-emerald-500 shadow-lg'
                      : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-semibold text-slate-400 truncate">
                      {rec.storeName}
                    </span>
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${
                        isCrit
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      Urgency: {rec.urgencyScore}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-white truncate">{rec.productName}</h4>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                    <span>Stockout: ~{rec.baselineMetrics.timeUntilStockoutMinutes ?? 90}m</span>
                    <span className="text-emerald-400 font-bold">
                      Best: +₹{rec.bestAction.netBenefit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Deep Inspection, 7-Point Reasoning, Alternative Matrix & Simulation (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Problem Header Card */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
                  {activeRec.category} • {activeRec.sku}
                </span>
                <h2 className="text-lg font-extrabold text-white">
                  {activeRec.productName} at {activeRec.storeName}
                </h2>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={handleRequestAiBrief}
                  disabled={loadingAi}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-1.5 cursor-pointer"
                  title="Generate AI Executive Briefing"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{loadingAi ? 'Synthesizing...' : 'Executive Brief'}</span>
                </button>
              </div>
            </div>

            {/* Baseline Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/80 p-3 rounded-lg border border-slate-800 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Current Stock</span>
                <span className="font-bold text-white">{activeRec.baselineMetrics.currentStock} units</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Stockout Window</span>
                <span className="font-bold text-red-400">
                  ~{activeRec.baselineMetrics.timeUntilStockoutMinutes ?? 90} mins
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Next Truck</span>
                <span className="font-bold text-slate-200">
                  {activeRec.baselineMetrics.nextTruckArrival} ({activeRec.baselineMetrics.minutesUntilTruck}m)
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-sans block">Lost Margin (No Action)</span>
                <span className="font-bold text-amber-400">
                  ₹{activeRec.baselineMetrics.estimatedLostContributionMargin}
                </span>
              </div>
            </div>

            {/* AI Executive Brief Box if triggered */}
            {aiBrief && (
              <div className="p-4 rounded-xl bg-slate-900 border border-emerald-500/30 text-xs text-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-emerald-400">
                  <span className="font-bold uppercase flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Executive Dispatch ({aiBrief.provider})
                  </span>
                  <button
                    onClick={() => setAiBrief(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="whitespace-pre-line text-slate-300 leading-relaxed font-sans">
                  {aiBrief.text}
                </div>
              </div>
            )}
          </div>

          {/* 7-Point Transparent Reasoning Breakdown */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>7-Point Algorithmic Decision Justification</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-emerald-400 block mb-0.5 font-mono text-[11px]">
                  1. What is happening:
                </span>
                <p className="text-slate-200">{activeRec.reasoning.whatIsHappening}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-emerald-400 block mb-0.5 font-mono text-[11px]">
                  2. Why it is happening:
                </span>
                <p className="text-slate-200">{activeRec.reasoning.whyItIsHappening}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-red-400 block mb-0.5 font-mono text-[11px]">
                  3. What will happen if no action is taken:
                </span>
                <p className="text-slate-200">{activeRec.reasoning.whatIfNoAction}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-emerald-400 block mb-0.5 font-mono text-[11px]">
                  4. Why the preferred action is optimal:
                </span>
                <p className="text-slate-200">{activeRec.reasoning.whyPreferredActionIsBetter}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-amber-400 block mb-0.5 font-mono text-[11px]">
                  5. Remaining Operational Risks:
                </span>
                <p className="text-slate-200">{activeRec.reasoning.remainingRisks}</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="font-bold text-slate-400 block mb-0.5 font-mono text-[11px]">
                  6. Underlying Mathematical Assumptions:
                </span>
                <ul className="list-disc list-inside text-slate-300 space-y-1 font-mono text-[11px]">
                  {activeRec.reasoning.underlyingAssumptions.map((ass, i) => (
                    <li key={i}>{ass}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Decision Comparison Matrix (Compare 2 to 4 Alternatives Side-by-Side) */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Evaluated Alternative Interventions ({activeRec.alternatives.length} Compared)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Formula: <strong>Net Operational Benefit = Avoided Lost Margin − Incremental Transit Cost</strong>
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Confidence: {activeRec.confidenceScore}%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeRec.alternatives.map((alt) => {
                const isSelected = activeAlt.id === alt.id;
                const isPreferred = activeRec.bestAction.id === alt.id;

                return (
                  <div
                    key={alt.id}
                    onClick={() => {
                      if (alt.isFeasible) setSelectedAltId(alt.id);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-slate-900 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                        : alt.isFeasible
                        ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {isPreferred && (
                      <span className="absolute -top-2.5 right-3 text-[9px] font-bold font-mono px-2 py-0.5 rounded bg-emerald-500 text-slate-950 shadow">
                        ★ AI RECOMMENDED
                      </span>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-bold text-xs text-white">{alt.title}</h4>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded shrink-0 ${
                          alt.isFeasible
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {alt.isFeasible ? 'FEASIBLE' : 'INFEASIBLE'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mb-3">{alt.description}</p>

                    {/* Cost-Benefit Formula Details */}
                    <div className="space-y-1 text-[11px] font-mono text-slate-300 bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Margin Saved:</span>
                        <span className="text-emerald-400 font-bold">+₹{alt.avoidedLostContributionMargin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400 font-sans">Incremental Cost:</span>
                        <span className="text-slate-400 font-bold">-₹{alt.incrementalCost}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-slate-800 font-extrabold">
                        <span className="text-white font-sans">Net Operational Benefit:</span>
                        <span className={alt.netBenefit > 0 ? 'text-emerald-300' : 'text-slate-400'}>
                          {alt.netBenefit > 0 ? `+₹${alt.netBenefit}` : `₹${alt.netBenefit}`}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 font-sans pt-0.5">
                        <span>Resolution Time: ~{alt.timeToResolutionMinutes} mins</span>
                        <span>Risk: {alt.operationalRisk}</span>
                      </div>
                    </div>

                    {!alt.isFeasible && (
                      <div className="text-[10px] text-red-400 mt-2 font-mono">
                        Rejected: {alt.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manager Action & Simulation Controls */}
          <div className="bg-gradient-to-r from-slate-900 via-[#0f172a] to-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Manager Action Execution Console
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                Action: {activeAlt.title}
              </span>
            </h3>

            {/* Optional adjustments */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Adjust Action Quantity (Optional)
                </label>
                <input
                  type="number"
                  placeholder={`Default: ${activeAlt.parameters.transferQuantity || activeAlt.avoidedLostUnits || 20} units`}
                  value={adjustedQty ?? ''}
                  onChange={(e) => setAdjustedQty(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">
                  Manager Operational Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Authorized priority dispatch courier"
                  value={managerNotes}
                  onChange={(e) => setManagerNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 text-xs font-bold border border-slate-700 hover:border-red-500/40 transition-all cursor-pointer"
              >
                Reject Proposed Action
              </button>

              <button
                onClick={handleApprove}
                disabled={isSimulating}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold tracking-wide transition-all shadow-md flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                <span>{isSimulating ? 'Simulating...' : 'Approve & Simulate Action'}</span>
              </button>
            </div>
          </div>

          {/* Before-and-After Simulated Outcome Display */}
          {simulationResult && (
            <div className="bg-emerald-950/20 border border-emerald-500/60 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simulation Verified • Before & After Operational Impact</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded">
                  DECISION ID: {simulationResult.decision.id}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Stock Shortage</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-red-400 line-through">
                      -{simulationResult.decision.baselineMetrics.expectedShortage}u
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">0 units (Resolved)</span>
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Margin Saved</span>
                  <div className="mt-1 text-emerald-400 font-bold text-sm">
                    +₹{simulationResult.decision.simulatedOutcome.contributionMarginSaved}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Net Operational ROI</span>
                  <div className="mt-1 text-emerald-300 font-extrabold text-sm">
                    +₹{simulationResult.decision.simulatedOutcome.netBenefit}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-sans block">Residual Risk</span>
                  <div className="mt-1 text-slate-300 text-[10px] font-sans">
                    {simulationResult.decision.simulatedOutcome.remainingRisk}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Reject Proposed Recommendation</h3>
            <p className="text-xs text-slate-300">
              Provide reason for rejecting the suggested intervention for {activeRec.productName}:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Prioritizing stock at donor store; accepting lost sales during match window"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
