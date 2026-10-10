import React from 'react';
import {
  Clock,
  Flame,
  CloudRain,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  Radio,
} from 'lucide-react';
import { OperationalEvent } from '../types';

interface HeaderProps {
  events: OperationalEvent[];
  onLoadScenario: (scenarioId: number) => void;
  onResetDemo: () => void;
  activeScenarioName?: string;
  isSimulatedOnly?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  events,
  onLoadScenario,
  onResetDemo,
  activeScenarioName,
}) => {
  const activeEvents = events.filter((e) => e.isActive);

  return (
    <header className="h-16 bg-[#0e1424] border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left side: Simulated Time & Operational Context */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-emerald-400" />
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-slate-400">OPERATIONAL TIME:</span>
            <span className="text-white font-bold tracking-wider">18:30 IST</span>
            <span className="text-emerald-400 text-[10px] uppercase font-sans font-semibold px-1 py-0.2 rounded bg-emerald-500/15">
              PRE-MATCH
            </span>
          </div>
        </div>

        {/* Active Events Pills */}
        <div className="hidden lg:flex items-center space-x-2">
          {activeEvents.map((evt) => (
            <div
              key={evt.id}
              className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-md border font-medium ${
                evt.type === 'cricket'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : evt.type === 'rain'
                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {evt.type === 'cricket' && <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              {evt.type === 'rain' && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
              <span>{evt.name}</span>
              <span className="font-mono text-[10px] px-1 bg-black/40 rounded">+{evt.multiplier}x</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right side: Scenarios Bar & Reset */}
      <div className="flex items-center space-x-2">
        <div className="hidden md:flex items-center space-x-1.5 bg-slate-900/90 p-1 rounded-lg border border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-medium px-2">Scenarios:</span>
          <button
            onClick={() => onLoadScenario(1)}
            className="px-2.5 py-1 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-medium text-[11px] transition-colors border border-transparent hover:border-slate-700"
            title="Store 7 14 bottles Cold Drink vs Store 9 60 bottles"
          >
            Match Challenge (Store 7 & 9)
          </button>
          <button
            onClick={() => onLoadScenario(2)}
            className="px-2.5 py-1 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-medium text-[11px] transition-colors border border-transparent hover:border-slate-700"
            title="South Bangalore Monsoon Cloudburst"
          >
            Rain Surge
          </button>
          <button
            onClick={() => onLoadScenario(3)}
            className="px-2.5 py-1 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-medium text-[11px] transition-colors border border-transparent hover:border-slate-700"
            title="Wasabi kale chips hogging slot space"
          >
            Shelf Swap
          </button>
          <button
            onClick={() => onLoadScenario(5)}
            className="px-2.5 py-1 rounded text-slate-200 hover:text-white hover:bg-slate-800 font-medium text-[11px] transition-colors border border-transparent hover:border-slate-700"
            title="Whitefield Store 15: orders lost due to fleet, not stock"
          >
            Rider Bottleneck
          </button>
        </div>

        <button
          onClick={onResetDemo}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition-all shadow-sm"
          title="Reset simulation back to initial baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo</span>
        </button>
      </div>
    </header>
  );
};
