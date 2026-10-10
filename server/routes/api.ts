import { Request, Response, Router } from 'express';
import { GoogleGenAI } from '@google/genai';
import { CATALOG, DARK_STORES_META } from '../data/storeData';
import { forecastProductInventory } from '../services/forecastService';
import { evaluateShelfSpaceOptimization } from '../services/shelfService';
import { evaluateStoreTransfers } from '../services/transferService';
import { analyzeRiderCapacity } from '../services/riderService';
import { simulationManager } from '../services/simulationService';

export const apiRouter = Router();

// Optional Gemini client initialization
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;
if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  try {
    aiClient = new GoogleGenAI();
  } catch (err) {
    console.warn('Failed to initialize optional GoogleGenAI client:', err);
  }
}

// 1. Dashboard summary
apiRouter.get('/dashboard', (req: Request, res: Response) => {
  const stores = simulationManager.getStores(true);
  const events = simulationManager.getEvents();
  const recs = simulationManager.getRecommendations(true);
  const history = simulationManager.getDecisionHistory();

  let totalProductsAtRisk = 0;
  let totalEstimatedLostSales = 0;
  let totalEstimatedLostMargin = 0;
  let healthyStores = 0;
  let warningStores = 0;
  let criticalStores = 0;
  let riderBottleneckStores = 0;

  const urgentAlerts: any[] = [];

  for (const store of Object.values(stores)) {
    let storeHasCritical = false;
    let storeHasWarning = false;

    // Check riders
    const riderEval = analyzeRiderCapacity(store, stores, false);
    if (riderEval.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK' || riderEval.bottleneckType === 'COMPOUND_BOTTLENECK') {
      riderBottleneckStores++;
    }

    // Check priority SKUs for fast response
    const prioritySkus = ['SKU-CD-750', 'SKU-CD-750-COKE', 'SKU-SNK-LAYS', 'SKU-SNK-POPCORN', 'SKU-INST-MAGGI', 'SKU-DRY-MILK'];
    for (const sku of prioritySkus) {
      const forecast = forecastProductInventory(store, sku, events);
      if (forecast.riskLevel === 'CRITICAL') {
        storeHasCritical = true;
        totalProductsAtRisk++;
        totalEstimatedLostSales += forecast.estimatedLostSalesRevenue;
        totalEstimatedLostMargin += forecast.estimatedLostContributionMargin;

        urgentAlerts.push({
          id: `alert-${store.id}-${sku}`,
          storeId: store.id,
          storeName: store.name,
          sku: sku,
          productName: forecast.productName,
          category: forecast.category,
          currentStock: forecast.currentStock,
          timeUntilStockoutMinutes: forecast.timeUntilStockoutMinutes,
          nextTruckArrival: store.truckSchedule.nextArrival,
          minutesUntilTruck: store.truckSchedule.estimatedMinutesUntilTruck,
          expectedShortage: forecast.expectedShortageQuantity,
          lostMargin: forecast.estimatedLostContributionMargin,
          riskLevel: 'CRITICAL',
        });
      } else if (forecast.riskLevel === 'WARNING') {
        storeHasWarning = true;
        totalProductsAtRisk++;
      }
    }

    if (storeHasCritical) criticalStores++;
    else if (storeHasWarning) warningStores++;
    else healthyStores++;
  }

  // Sort urgent alerts by shortest time to stockout
  urgentAlerts.sort((a, b) => (a.timeUntilStockoutMinutes || 999) - (b.timeUntilStockoutMinutes || 999));

  res.json({
    kpis: {
      storesMonitored: Object.keys(stores).length,
      productsMonitored: 3000,
      productsAtRisk: totalProductsAtRisk,
      estimatedLostSales: totalEstimatedLostSales,
      estimatedLostMargin: totalEstimatedLostMargin,
      pendingRecommendations: recs.length,
      storesWithRiderBottlenecks: riderBottleneckStores,
      storesStatus: {
        healthy: healthyStores,
        warning: warningStores,
        critical: criticalStores,
      },
    },
    urgentAlerts: urgentAlerts.slice(0, 8),
    activeEvents: events.filter((e) => e.isActive),
    topRecommendations: recs.slice(0, 5),
    recentDecisions: history.slice(0, 5),
  });
});

// 2. All 30 Dark Stores overview
apiRouter.get('/stores', (req: Request, res: Response) => {
  const stores = simulationManager.getStores(true);
  const events = simulationManager.getEvents();

  const storeList = Object.values(stores).map((store) => {
    // Evaluate store status based on cold drink or staple risk
    const cdForecast = forecastProductInventory(store, 'SKU-CD-750', events);
    const riderEval = analyzeRiderCapacity(store, stores, cdForecast.riskLevel === 'CRITICAL');

    let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
    if (cdForecast.riskLevel === 'CRITICAL' || riderEval.bottleneckType === 'COMPOUND_BOTTLENECK') {
      status = 'CRITICAL';
    } else if (cdForecast.riskLevel === 'WARNING' || riderEval.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK') {
      status = 'WARNING';
    }

    return {
      id: store.id,
      numericId: store.numericId,
      name: store.name,
      locality: store.locality,
      lat: store.lat,
      lng: store.lng,
      status,
      nextTruckArrival: store.truckSchedule.nextArrival,
      minutesUntilTruck: store.truckSchedule.estimatedMinutesUntilTruck,
      activeRiders: store.riders.activeCount,
      orderRate: store.riders.currentHourlyOrderRate,
      deliveryCapacity: Number((store.riders.activeCount * store.riders.maxOrdersPerHourPerRider).toFixed(1)),
      riderBottleneck: riderEval.bottleneckType,
      shelfUtilizationPct: Math.round((store.shelfCapacityUsed / store.shelfCapacityTotal) * 100),
      signatureStock: {
        coldDrink: store.inventory['SKU-CD-750']?.currentStock ?? 0,
        wasabiCrisps: store.inventory['SKU-SNK-WASABI']?.currentStock ?? 0,
        milk: store.inventory['SKU-DRY-MILK']?.currentStock ?? 0,
      },
    };
  });

  res.json(storeList);
});

// 3. Single Dark Store Deep Dive
apiRouter.get('/stores/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const store = simulationManager.getStore(id, true);
  if (!store) {
    res.status(404).json({ error: `Store ${id} not found` });
    return;
  }

  const stores = simulationManager.getStores(true);
  const events = simulationManager.getEvents();
  const riderEval = analyzeRiderCapacity(store, stores, false);
  const shelfOps = evaluateShelfSpaceOptimization(store);

  // Get forecasts for signature products in this store
  const signatureForecasts = [
    'SKU-CD-750',
    'SKU-CD-750-COKE',
    'SKU-SNK-WASABI',
    'SKU-SNK-LAYS',
    'SKU-SNK-POPCORN',
    'SKU-DRY-MILK',
    'SKU-INST-MAGGI',
    'SKU-BEV-RED-BULL',
  ].map((sku) => forecastProductInventory(store, sku, events));

  res.json({
    store,
    riderEval,
    shelfOps,
    signatureForecasts,
  });
});

// 4. Products catalog search & filter
apiRouter.get('/products', (req: Request, res: Response) => {
  const { query, category } = req.query;
  let items = CATALOG;

  if (category && typeof category === 'string' && category !== 'All') {
    items = items.filter((p) => p.category === category);
  }

  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }

  // Return top 150 items to keep payload snappy while client searches
  res.json({
    totalMatching: items.length,
    products: items.slice(0, 100),
  });
});

// 5. Hourly Demand & Inventory Forecast for specific SKU at Store
apiRouter.get('/forecast/:storeId/:sku', (req: Request, res: Response) => {
  const { storeId, sku } = req.params;
  const store = simulationManager.getStore(storeId, true);
  if (!store) {
    res.status(404).json({ error: `Store ${storeId} not found` });
    return;
  }

  const events = simulationManager.getEvents();
  const result = forecastProductInventory(store, sku, events);
  res.json(result);
});

// 6. Events Hub: get, toggle, update, create
apiRouter.get('/events', (req: Request, res: Response) => {
  res.json(simulationManager.getEvents());
});

apiRouter.post('/events/toggle/:id', (req: Request, res: Response) => {
  try {
    const event = simulationManager.toggleEvent(req.params.id);
    res.json(event);
  } catch (err: any) {
    res.status(404).json({ error: err.message });
  }
});

apiRouter.post('/events/update', (req: Request, res: Response) => {
  try {
    const updated = simulationManager.updateEvent(req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/events/create', (req: Request, res: Response) => {
  try {
    const created = simulationManager.addEvent(req.body);
    res.json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 7. Store Transfers evaluation
apiRouter.get('/transfers', (req: Request, res: Response) => {
  const { targetStoreId, sku } = req.query;
  const stores = simulationManager.getStores(true);

  if (targetStoreId && sku && typeof targetStoreId === 'string' && typeof sku === 'string') {
    const events = simulationManager.getEvents();
    const store = stores[targetStoreId];
    if (!store) {
      res.status(404).json({ error: 'Store not found' });
      return;
    }
    const forecast = forecastProductInventory(store, sku, events);
    const evaluations = evaluateStoreTransfers(
      stores,
      targetStoreId,
      sku,
      forecast.expectedShortageQuantity,
      forecast.timeUntilStockoutMinutes
    );
    res.json(evaluations);
    return;
  }

  // City-wide top transfer opportunities for SKU-CD-750 (Store 7 challenge)
  const evaluations = evaluateStoreTransfers(stores, 'store_7', 'SKU-CD-750', 25, 75);
  res.json(evaluations);
});

// 8. Shelf Optimization
apiRouter.get('/shelf-optimization/:storeId', (req: Request, res: Response) => {
  const store = simulationManager.getStore(req.params.storeId, true);
  if (!store) {
    res.status(404).json({ error: 'Store not found' });
    return;
  }
  const swaps = evaluateShelfSpaceOptimization(store);
  res.json(swaps);
});

// 9. Rider Capacity fleet analysis
apiRouter.get('/riders', (req: Request, res: Response) => {
  const stores = simulationManager.getStores(true);
  const evaluations = Object.values(stores).map((s) => analyzeRiderCapacity(s, stores, false));
  res.json(evaluations);
});

// 10. AI Recommendations (ranked with 7-point explanations and compared alternatives)
apiRouter.get('/recommendations', (req: Request, res: Response) => {
  const recs = simulationManager.getRecommendations(true);
  res.json(recs);
});

// 11. Manager Decision: Approve proposed recommendation
apiRouter.post('/decisions/approve', (req: Request, res: Response) => {
  try {
    const { recommendationId, chosenAlternativeId, adjustedQty, managerNotes } = req.body;
    const result = simulationManager.approveRecommendation(
      recommendationId,
      chosenAlternativeId,
      adjustedQty ? Number(adjustedQty) : undefined,
      managerNotes
    );
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 12. Manager Decision: Reject proposed recommendation
apiRouter.post('/decisions/reject', (req: Request, res: Response) => {
  try {
    const { recommendationId, reason } = req.body;
    const decision = simulationManager.rejectRecommendation(recommendationId, reason);
    res.json(decision);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 13. Decision History audit trail
apiRouter.get('/decisions/history', (req: Request, res: Response) => {
  res.json(simulationManager.getDecisionHistory());
});

// 14. What-If Simulator endpoint
apiRouter.post('/simulate/what-if', (req: Request, res: Response) => {
  try {
    const { storeId, sku, currentStock, hourlyDemandMultiplier, minutesUntilTruck, shelfCapacity, riderCount } = req.body;
    const result = simulationManager.simulateWhatIf({
      storeId: storeId || 'store_7',
      sku: sku || 'SKU-CD-750',
      currentStock: Number(currentStock ?? 14),
      hourlyDemandMultiplier: Number(hourlyDemandMultiplier ?? 3.6),
      minutesUntilTruck: Number(minutesUntilTruck ?? 90),
      shelfCapacity: Number(shelfCapacity ?? 14),
      riderCount: Number(riderCount ?? 8),
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 15. Load pre-built challenge demonstration scenarios
apiRouter.post('/demo/scenario/:id', (req: Request, res: Response) => {
  try {
    const scenarioId = Number(req.params.id);
    const result = simulationManager.loadDemoScenario(scenarioId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 16. Reset Demo to initial state
apiRouter.post('/demo/reset', (req: Request, res: Response) => {
  simulationManager.resetToBaseline();
  res.json({ message: 'System state reset to baseline successfully.' });
});

// 17. Optional AI Executive Briefing (using Gemini if configured, or transparent algorithmic synthesis)
apiRouter.post('/ai/explain', async (req: Request, res: Response) => {
  const { recommendationId } = req.body;
  const recs = simulationManager.getRecommendations(true);
  const rec = recs.find((r) => r.id === recommendationId) || recs[0];

  if (!rec) {
    res.status(404).json({ error: 'No recommendation found to explain.' });
    return;
  }

  // If Gemini API key is available, run prompt for executive verbalization; otherwise fallback to structured algorithm explanation
  if (aiClient) {
    try {
      const prompt = `You are the Zipcart Logistics Chief Operations Agent.
Explain the following operational recommendation concisely to the City General Manager:
- Store: ${rec.storeName}
- Product: ${rec.productName} (${rec.sku})
- Current Stock: ${rec.baselineMetrics.currentStock} units
- Time until stockout: ${rec.baselineMetrics.timeUntilStockoutMinutes} mins
- Scheduled truck arrival: ${rec.baselineMetrics.nextTruckArrival} (${rec.baselineMetrics.minutesUntilTruck} mins)
- Shortage: ${rec.baselineMetrics.expectedShortageQuantity} units (₹${rec.baselineMetrics.estimatedLostContributionMargin} lost contribution margin)
- Recommended Action: ${rec.bestAction.title}
- Net Benefit: ₹${rec.bestAction.netBenefit}
- Other alternatives considered: ${rec.alternatives.map((a) => a.title).join(', ')}

Provide a punchy 3-bullet executive briefing:
1. Situation & Stockout Window
2. Operational Tradeoff Matrix
3. Final Recommendation & Risk Safeguards
Keep all numbers exactly as calculated above. Do not invent new figures.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      res.json({
        provider: 'Gemini 2.5 Flash',
        executiveBrief: response.text,
      });
      return;
    } catch (err) {
      console.warn('Gemini generation failed, falling back to algorithmic reasoning:', err);
    }
  }

  // Algorithmic executive brief fallback (100% reliable, zero external API required)
  res.json({
    provider: 'Deterministic Optimization Engine',
    executiveBrief: `### 🚨 Executive Operations Dispatch: ${rec.storeName}
**1. Critical Bottleneck Detection:**
${rec.reasoning.whatIsHappening} ${rec.reasoning.whyItIsHappening}

**2. Tradeoff Analysis & Action Selection:**
${rec.reasoning.whyPreferredActionIsBetter}
Evaluated ${rec.alternatives.length} alternatives: ${rec.reasoning.alternativesConsidered.join(' | ')}.

**3. Action Mandate & Safeguards:**
Deploy **${rec.bestAction.title}**. Generates **₹${rec.bestAction.netBenefit} net margin savings** with ${rec.bestAction.timeToResolutionMinutes}-min delivery SLA. Safeguard: ${rec.reasoning.remainingRisks}`,
  });
});
