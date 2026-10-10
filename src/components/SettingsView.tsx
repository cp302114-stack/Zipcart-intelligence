import React, { useState } from 'react';
import {
  Settings,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  ArrowRight,
  Flame,
  CloudRain,
  Bike,
} from 'lucide-react';
import { loadDemoScenario, resetDemo } from '../api';

interface SettingsViewProps {
  onScenarioLoaded: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onScenarioLoaded }) => {
  const [activeScenarioMsg, setActiveScenarioMsg] = useState<string | null>(null);
  const [loadingScenario, setLoadingScenario] = useState<number | null>(null);

  const scenarios = [
    {
      id: 1,
      title: 'Challenge Signature: Store 7 & Store 9 Match Challenge',
      badge: 'PROMPT PRIMARY CHALLENGE',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
      description:
        'Store 7 has 14 bottles of 750ml Cold Drink. Match starts at 7:30 PM (19:30) with 9 bottles/hr surge demand. Next truck arrives at 9:00 PM (21:00). Shelf is full with slow-selling snack adjacent. Store 9 is ~2.2 km away with 60 bottles surplus.',
      expectedAction: 'Dispatch courier transfer from Store 9 (22 mins arrival) or swap slow-seller shelf space.',
    },
    {
      id: 2,
      title: 'Scenario 2: Heavy Monsoon Cloudburst Spike',
      badge: 'WEATHER SHOCK',
      badgeColor: 'bg-sky-500/20 text-sky-300 border border-sky-500/40',
      description:
        'South Bangalore cloudburst delays road transit and triggers 3.2x demand for hot instant noodles and tea. Koramangala Store 3 stock will run out in 45 minutes.',
      expectedAction: 'Rush warehouse sprinter van or inter-hub transfer from North Bangalore hub.',
    },
    {
      id: 3,
      title: 'Scenario 3: Shelf Space Allocation Inefficiency',
      badge: 'MERCHANDISING MISMATCH',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
      description:
        'Slow-selling Wasabi Kale Crisps (0.2 sales/hr) occupy 25 prime shelf slots, while fast-moving Party Pack chips are restricted to 16 slots and face stockout.',
      expectedAction: 'Reallocate 8 shelf slots immediately from wasabi crisps to chips (+₹120 margin gain).',
    },
    {
      id: 4,
      title: 'Scenario 4: Inter-Hub Staples Balancing (Fresh Milk)',
      badge: 'PERISHABLE STAPLES',
      badgeColor: 'bg-teal-500/20 text-teal-300 border border-teal-500/40',
      description:
        'HSR Layout Store 4 running dry on Fresh Milk (8 units left) before evening rush, while BTM Store 12 holds 90 surplus units above 2-day safety stock.',
      expectedAction: 'Quick shuttle 35 units from BTM to HSR, clearing shortage with zero risk.',
    },
    {
      id: 5,
      title: 'Scenario 5: Delivery Fleet Bottleneck (Rider Shortage)',
      badge: 'FLEET DEFICIT',
      badgeColor: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
      description:
        'Whitefield Store 15 has 98% stock availability but only 4 active riders for 96 incoming orders/hr. Orders are failing SLAs due to riders, not inventory.',
      expectedAction: 'Do NOT order truck restocking! Reassign 4 riders from nearby low-demand hubs.',
    },
  ];

  const handleLoad = async (id: number) => {
    setLoadingScenario(id);
    setActiveScenarioMsg(null);
    try {
      const res = await loadDemoScenario(id);
      setActiveScenarioMsg(res.name);
      onScenarioLoaded();
    } catch (err: any) {
      alert(`Error loading scenario: ${err.message}`);
    } finally {
      setLoadingScenario(null);
    }
  };

  const handleReset = async () => {
    try {
      await resetDemo();
      setActiveScenarioMsg('Demo reset back to baseline!');
      onScenarioLoaded();
    } catch (err: any) {
      alert(`Error resetting demo: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Demonstration Scenarios & System Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Load reproducible edge-case scenarios from the "Before the Match Starts" challenge
          </p>
        </div>

        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Scenarios</span>
        </button>
      </div>

      {activeScenarioMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>
            <strong>Loaded:</strong> {activeScenarioMsg}. Switch to Overview Dashboard or Decision Center to inspect live calculations.
          </span>
        </div>
      )}

      {/* Scenarios Cards */}
      <div className="space-y-4">
        {scenarios.map((sc) => (
          <div
            key={sc.id}
            className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className={`text-[10px] font-mono font-extrabold px-2 py-0.5 rounded uppercase ${sc.badgeColor}`}>
                  {sc.badge}
                </span>
                <h3 className="font-bold text-sm text-white">{sc.title}</h3>
              </div>

              <button
                onClick={() => handleLoad(sc.id)}
                disabled={loadingScenario === sc.id}
                className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingScenario === sc.id ? 'Loading...' : 'Load Scenario'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{sc.description}</p>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 text-[11px] font-mono text-emerald-400">
              <strong className="text-slate-400 font-sans">Optimal Operational Strategy:</strong> {sc.expectedAction}
            </div>
          </div>
        ))}
      </div>

      {/* System Architecture Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-sm text-white uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-4 h-4 text-emerald-400" />
          Technical & Algorithmic Architecture
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 block font-mono text-[11px]">
              1. Deterministic Optimization
            </span>
            <p className="text-slate-300">
              Transparent, mathematical cost-benefit models. Net benefit = Avoided Contribution Margin − Incremental Transit Cost. Infeasible actions rejected before ranking.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 block font-mono text-[11px]">
              2. Category Event Multipliers
            </span>
            <p className="text-slate-300">
              Category-sensitive event response (Cold Drinks 3.6x vs Produce 0.9x) with temporal bell-curve progression before and during cricket fixtures.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
            <span className="font-bold text-emerald-400 block font-mono text-[11px]">
              3. Modular Persistence Layer
            </span>
            <p className="text-slate-300">
              In-memory structured state with isolated simulation staging and compliance audit ledger. Ready for plug-and-play PostgreSQL migration.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
