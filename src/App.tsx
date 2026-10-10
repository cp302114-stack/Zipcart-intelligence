import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { DemandForecastView } from './components/DemandForecastView';
import { EventsView } from './components/EventsView';
import { TransfersView } from './components/TransfersView';
import { ShelfView } from './components/ShelfView';
import { RidersView } from './components/RidersView';
import { DecisionCenterView } from './components/DecisionCenterView';
import { SimulatorView } from './components/SimulatorView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import {
  fetchDashboard,
  fetchStores,
  fetchEvents,
  fetchRecommendations,
  loadDemoScenario,
  resetDemo,
} from './api';
import {
  DashboardData,
  DarkStoreMeta,
  OperationalEvent,
  OperationalRecommendation,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // App-level global state
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [stores, setStores] = useState<DarkStoreMeta[]>([]);
  const [events, setEvents] = useState<OperationalEvent[]>([]);
  const [recommendations, setRecommendations] = useState<OperationalRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  // Contextual drill-down parameters
  const [selectedStoreId, setSelectedStoreId] = useState<string>('store_7');
  const [selectedSku, setSelectedSku] = useState<string>('SKU-CD-750');
  const [selectedRecId, setSelectedRecId] = useState<string | undefined>(undefined);
  const [activeScenarioName, setActiveScenarioName] = useState<string | undefined>(undefined);

  // Load / Refresh all data
  const refreshAllData = useCallback(async () => {
    try {
      const [dash, storeList, eventList, recList] = await Promise.all([
        fetchDashboard(),
        fetchStores(),
        fetchEvents(),
        fetchRecommendations(),
      ]);
      setDashboardData(dash);
      setStores(storeList);
      setEvents(eventList);
      setRecommendations(recList);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Handle Scenario Quick-Load
  const handleLoadScenario = async (id: number) => {
    try {
      const res = await loadDemoScenario(id);
      setActiveScenarioName(res.name);
      await refreshAllData();
      if (id === 1) {
        setSelectedStoreId('store_7');
        setSelectedSku('SKU-CD-750');
        setSelectedRecId('rec-store_7-SKU-CD-750');
      } else if (id === 2) {
        setSelectedStoreId('store_3');
        setSelectedSku('SKU-INST-MAGGI');
      } else if (id === 5) {
        setSelectedStoreId('store_15');
      }
    } catch (err: any) {
      alert(`Failed to load scenario: ${err.message}`);
    }
  };

  const handleResetDemo = async () => {
    try {
      await resetDemo();
      setActiveScenarioName(undefined);
      setSelectedStoreId('store_7');
      setSelectedSku('SKU-CD-750');
      setSelectedRecId(undefined);
      await refreshAllData();
    } catch (err: any) {
      alert(`Failed to reset: ${err.message}`);
    }
  };

  // Navigation handlers
  const handleSelectStoreFromDashboard = (storeId: string) => {
    setSelectedStoreId(storeId);
    setActiveTab('inventory');
  };

  const handleInspectForecast = (storeId: string, sku: string) => {
    setSelectedStoreId(storeId);
    setSelectedSku(sku);
    setActiveTab('forecast');
  };

  const handleSelectRecommendationFromDashboard = (rec: OperationalRecommendation) => {
    setSelectedRecId(rec.id);
    setActiveTab('decisions');
  };

  if (loading || !dashboardData) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto animate-pulse">
            <span className="w-4 h-4 bg-emerald-400 rounded-full animate-ping" />
          </div>
          <h2 className="text-sm font-bold tracking-wider uppercase text-white">
            Booting Zipcart Intelligence Command Center...
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Loading 30 dark store models & 3,000 SKU demand curves
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      {/* Collapsible Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
        criticalAlertCount={dashboardData.kpis.productsAtRisk}
        pendingRecCount={dashboardData.kpis.pendingRecommendations}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col transition-all duration-200 ${
          sidebarCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {/* Top Header */}
        <Header
          events={events}
          onLoadScenario={handleLoadScenario}
          onResetDemo={handleResetDemo}
          activeScenarioName={activeScenarioName}
        />

        {/* View Router Container */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              data={dashboardData}
              stores={stores}
              onSelectStore={handleSelectStoreFromDashboard}
              onNavigateToTab={setActiveTab}
              onSelectRecommendation={handleSelectRecommendationFromDashboard}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              stores={stores}
              selectedStoreId={selectedStoreId}
              onSelectStoreId={setSelectedStoreId}
              onInspectForecast={handleInspectForecast}
            />
          )}

          {activeTab === 'forecast' && (
            <DemandForecastView
              stores={stores}
              initialStoreId={selectedStoreId}
              initialSku={selectedSku}
            />
          )}

          {activeTab === 'events' && (
            <EventsView
              events={events}
              onRefreshEvents={refreshAllData}
            />
          )}

          {activeTab === 'transfers' && (
            <TransfersView
              stores={stores}
              onActionSimulated={refreshAllData}
            />
          )}

          {activeTab === 'shelf' && (
            <ShelfView
              stores={stores}
              onActionSimulated={refreshAllData}
            />
          )}

          {activeTab === 'riders' && (
            <RidersView
              onActionSimulated={refreshAllData}
            />
          )}

          {activeTab === 'decisions' && (
            <DecisionCenterView
              recommendations={recommendations}
              selectedRecId={selectedRecId}
              onActionSimulated={refreshAllData}
            />
          )}

          {activeTab === 'simulator' && (
            <SimulatorView
              stores={stores}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onScenarioLoaded={refreshAllData}
            />
          )}
        </main>
      </div>
    </div>
  );
}
