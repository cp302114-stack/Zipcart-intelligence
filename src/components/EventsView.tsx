import React, { useState } from 'react';
import {
  CalendarDays,
  Flame,
  CloudRain,
  Sparkles,
  PartyPopper,
  Plus,
  Check,
  AlertTriangle,
  Sliders,
  Store,
} from 'lucide-react';
import { OperationalEvent } from '../types';
import { toggleEvent, updateEvent, createEvent } from '../api';

interface EventsViewProps {
  events: OperationalEvent[];
  onRefreshEvents: () => void;
}

export const EventsView: React.FC<EventsViewProps> = ({ events, onRefreshEvents }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    name: '',
    type: 'cricket' as const,
    startTime: '20:00',
    durationHours: 3.0,
    multiplier: 2.5,
    description: '',
    affectedStoreIds: [] as string[],
    affectedCategories: ['Cold Beverages', 'Snacks & Munchies'],
    isActive: true,
  });

  const handleToggle = async (id: string) => {
    try {
      await toggleEvent(id);
      onRefreshEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMultiplierChange = async (event: OperationalEvent, newMultiplier: number) => {
    try {
      await updateEvent({ id: event.id, multiplier: newMultiplier });
      onRefreshEvents();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEvent(newEvent);
      setShowCreateModal(false);
      onRefreshEvents();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#0f172a] p-5 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            Event-Driven Demand Multipliers & Real-Time Shocks
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Category-specific demand multipliers driving pre-match and sudden weather surges across the dark store network
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs tracking-wide transition-all shadow-md flex items-center space-x-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Event</span>
        </button>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((evt) => (
          <div
            key={evt.id}
            className={`p-5 rounded-xl border transition-all ${
              evt.isActive
                ? 'bg-slate-900/90 border-slate-700 shadow-lg'
                : 'bg-slate-900/40 border-slate-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    evt.type === 'cricket'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : evt.type === 'rain'
                      ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {evt.type === 'cricket' && <Flame className="w-5 h-5" />}
                  {evt.type === 'rain' && <CloudRain className="w-5 h-5" />}
                  {evt.type === 'festival' && <PartyPopper className="w-5 h-5" />}
                  {evt.type === 'local_event' && <Sparkles className="w-5 h-5" />}
                </div>

                <div>
                  <h3 className="font-bold text-sm text-white">{evt.name}</h3>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Starts: {evt.startTime} • Duration: {evt.durationHours}h
                  </div>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => handleToggle(evt.id)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold font-mono uppercase transition-all cursor-pointer ${
                  evt.isActive
                    ? 'bg-emerald-500 text-slate-950 shadow'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {evt.isActive ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 line-clamp-2">
              {evt.description}
            </p>

            {/* Configurable Multiplier Slider */}
            <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-lg border border-slate-800 mb-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">Demand Multiplier:</span>
                <span className="text-amber-400 font-bold font-mono">+{evt.multiplier}x</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="5.0"
                step="0.1"
                value={evt.multiplier}
                onChange={(e) => handleMultiplierChange(evt, parseFloat(e.target.value))}
                disabled={!evt.isActive}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>1.0x (Normal)</span>
                <span>3.0x (High)</span>
                <span>5.0x (Extreme)</span>
              </div>
            </div>

            {/* Affected Categories */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider block">
                Sensitive Categories:
              </span>
              <div className="flex flex-wrap gap-1">
                {evt.affectedCategories.length === 0 ? (
                  <span className="text-[10px] text-slate-400">All Categories</span>
                ) : (
                  evt.affectedCategories.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium border border-slate-700"
                    >
                      {c}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Affected Stores Scope */}
            <div className="mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
              <span>Coverage Scope:</span>
              <span className="text-slate-300 font-semibold">
                {evt.affectedStoreIds.length === 0 ? 'City-wide (All 30 Stores)' : `${evt.affectedStoreIds.length} Regional Stores`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-base text-white">Create Custom Operational Event</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Event Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Local Marathon / Festival Night"
                  value={newEvent.name}
                  onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Event Type</label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="cricket">Cricket / Sports Match</option>
                    <option value="rain">Weather / Rain Shock</option>
                    <option value="festival">Festival Shopping</option>
                    <option value="local_event">Local Community Surge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Start Time (HH:MM)</label>
                  <input
                    type="text"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Demand Multiplier ({newEvent.multiplier}x)</label>
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={newEvent.multiplier}
                  onChange={(e) => setNewEvent({ ...newEvent, multiplier: parseFloat(e.target.value) })}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Explain event triggers and expected shopping behavior..."
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
                >
                  Save & Activate Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
