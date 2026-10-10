import {
  DashboardData,
  DarkStoreMeta,
  InventoryForecastResult,
  OperationalEvent,
  OperationalRecommendation,
  DecisionRecord,
  StoreTransferEvaluation,
  ShelfSwapOpportunity,
  RiderAnalysisResult,
} from './types';

const API_BASE = '/api';

export async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  return res.json();
}

export async function fetchStores(): Promise<DarkStoreMeta[]> {
  const res = await fetch(`${API_BASE}/stores`);
  if (!res.ok) throw new Error('Failed to fetch dark stores');
  return res.json();
}

export async function fetchStoreDetail(id: string): Promise<any> {
  const res = await fetch(`${API_BASE}/stores/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch store ${id}`);
  return res.json();
}

export async function fetchProducts(query?: string, category?: string): Promise<{ totalMatching: number; products: any[] }> {
  const params = new URLSearchParams();
  if (query) params.append('query', query);
  if (category) params.append('category', category);
  const res = await fetch(`${API_BASE}/products?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch products catalog');
  return res.json();
}

export async function fetchForecast(storeId: string, sku: string): Promise<InventoryForecastResult> {
  const res = await fetch(`${API_BASE}/forecast/${storeId}/${sku}`);
  if (!res.ok) throw new Error(`Failed to fetch forecast for ${sku} at ${storeId}`);
  return res.json();
}

export async function fetchEvents(): Promise<OperationalEvent[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function toggleEvent(id: string): Promise<OperationalEvent> {
  const res = await fetch(`${API_BASE}/events/toggle/${id}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to toggle event');
  return res.json();
}

export async function updateEvent(payload: Partial<OperationalEvent> & { id: string }): Promise<OperationalEvent> {
  const res = await fetch(`${API_BASE}/events/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update event');
  return res.json();
}

export async function createEvent(payload: Omit<OperationalEvent, 'id'>): Promise<OperationalEvent> {
  const res = await fetch(`${API_BASE}/events/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function fetchTransfers(targetStoreId?: string, sku?: string): Promise<StoreTransferEvaluation[]> {
  const params = new URLSearchParams();
  if (targetStoreId) params.append('targetStoreId', targetStoreId);
  if (sku) params.append('sku', sku);
  const res = await fetch(`${API_BASE}/transfers?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch transfer options');
  return res.json();
}

export async function fetchShelfOptimization(storeId: string): Promise<ShelfSwapOpportunity[]> {
  const res = await fetch(`${API_BASE}/shelf-optimization/${storeId}`);
  if (!res.ok) throw new Error('Failed to fetch shelf optimization');
  return res.json();
}

export async function fetchRiders(): Promise<RiderAnalysisResult[]> {
  const res = await fetch(`${API_BASE}/riders`);
  if (!res.ok) throw new Error('Failed to fetch rider analyses');
  return res.json();
}

export async function fetchRecommendations(): Promise<OperationalRecommendation[]> {
  const res = await fetch(`${API_BASE}/recommendations`);
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}

export async function approveRecommendation(
  recommendationId: string,
  chosenAlternativeId?: string,
  adjustedQty?: number,
  managerNotes?: string
): Promise<{ decision: DecisionRecord; simulatedRecommendation: OperationalRecommendation }> {
  const res = await fetch(`${API_BASE}/decisions/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId, chosenAlternativeId, adjustedQty, managerNotes }),
  });
  if (!res.ok) throw new Error('Failed to approve recommendation');
  return res.json();
}

export async function rejectRecommendation(recommendationId: string, reason?: string): Promise<DecisionRecord> {
  const res = await fetch(`${API_BASE}/decisions/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId, reason }),
  });
  if (!res.ok) throw new Error('Failed to reject recommendation');
  return res.json();
}

export async function fetchDecisionHistory(): Promise<DecisionRecord[]> {
  const res = await fetch(`${API_BASE}/decisions/history`);
  if (!res.ok) throw new Error('Failed to fetch decision history');
  return res.json();
}

export async function simulateWhatIf(params: {
  storeId: string;
  sku: string;
  currentStock: number;
  hourlyDemandMultiplier: number;
  minutesUntilTruck: number;
  shelfCapacity: number;
  riderCount: number;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/simulate/what-if`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to run what-if simulation');
  return res.json();
}

export async function loadDemoScenario(scenarioId: number): Promise<{ name: string; description: string }> {
  const res = await fetch(`${API_BASE}/demo/scenario/${scenarioId}`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to load demo scenario');
  return res.json();
}

export async function resetDemo(): Promise<void> {
  const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to reset demo');
}

export async function fetchAiExplain(recommendationId: string): Promise<{ provider: string; executiveBrief: string }> {
  const res = await fetch(`${API_BASE}/ai/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recommendationId }),
  });
  if (!res.ok) throw new Error('Failed to fetch AI explanation');
  return res.json();
}
