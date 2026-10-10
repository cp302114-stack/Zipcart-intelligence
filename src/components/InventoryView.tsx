import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import { DarkStoreMeta } from '../types';
import { fetchProducts } from '../api';

interface InventoryViewProps {
  stores: DarkStoreMeta[];
  selectedStoreId: string;
  onSelectStoreId: (storeId: string) => void;
  onInspectForecast: (storeId: string, sku: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  stores,
  selectedStoreId,
  onSelectStoreId,
  onInspectForecast,
}) => {
  const [products, setProducts] = useState<any[]>([]);
  const [totalMatching, setTotalMatching] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [loading, setLoading] = useState(false);

  const categories = [
    'All',
    'Cold Beverages',
    'Snacks & Munchies',
    'Dairy & Bread',
    'Fresh Produce',
    'Instant Food & Noodles',
    'Chocolates & Desserts',
    'Personal Care & Hygiene',
    'Household & Cleaning',
  ];

  useEffect(() => {
    setLoading(true);
    fetchProducts(searchQuery, selectedCategory)
      .then((res) => {
        setProducts(res.products);
        setTotalMatching(res.totalMatching);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [searchQuery, selectedCategory]);

  const currentStore = stores.find((s) => s.id === selectedStoreId) || stores[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Boxes className="w-5 h-5 text-emerald-400" />
            Inventory Intelligence Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Tracking ~3,000 SKUs with unit-economics, shelf limits, safety cushions, and replenishment schedules
          </p>
        </div>

        {/* Store Selector */}
        <div className="flex items-center space-x-3">
          <label className="text-xs font-semibold text-slate-400 shrink-0">Store:</label>
          <select
            value={selectedStoreId}
            onChange={(e) => onSelectStoreId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search SKU or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs text-white pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-emerald-500 placeholder-slate-500"
          />
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
          <span>
            Showing <strong className="text-white">{products.length}</strong> of{' '}
            <strong className="text-white">{totalMatching.toLocaleString()}</strong> catalog items in {currentStore?.name}
          </span>
          <span className="font-mono text-[11px]">Next Scheduled Replenishment: {currentStore?.nextTruckArrival}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                <th className="py-3 px-4 font-semibold">SKU & Item Name</th>
                <th className="py-3 px-3 font-semibold">Category</th>
                <th className="py-3 px-3 font-semibold text-right">Price</th>
                <th className="py-3 px-3 font-semibold text-right">Margin (₹)</th>
                <th className="py-3 px-3 font-semibold text-center">Shelf Capacity</th>
                <th className="py-3 px-3 font-semibold text-center">Velocity (u/hr)</th>
                <th className="py-3 px-3 font-semibold text-center">Event Multiplier</th>
                <th className="py-3 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    Loading inventory records...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    No products matched filter criteria.
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.sku} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-sans">
                      <div className="font-bold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>{item.sku}</span>
                        <span>•</span>
                        <span>{item.unitSize}</span>
                        {item.isCoreFastMover && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                            Fast Mover
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-300">
                      {item.category}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-200 font-bold">
                      ₹{item.price}
                    </td>
                    <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                      ₹{item.margin} ({Math.round((item.margin / item.price) * 100)}%)
                    </td>
                    <td className="py-3 px-3 text-center text-slate-300">
                      {item.shelfUnitsPerSlot} units/slot
                    </td>
                    <td className="py-3 px-3 text-center text-slate-200">
                      {item.baseHourlyVelocity}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 font-semibold">
                        +{item.eventSensitivities.cricket}x Cricket
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-sans">
                      <button
                        onClick={() => onInspectForecast(selectedStoreId, item.sku)}
                        className="px-3 py-1.5 rounded bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 text-xs font-bold border border-slate-700 hover:border-emerald-400 transition-all flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Forecast Curve</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
