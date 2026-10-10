import {
  createInitialStores,
  DarkStore,
  DecisionRecord,
  INITIAL_EVENTS,
  OperationalEvent,
} from '../data/storeData';
import { generateOperationalRecommendations, OperationalRecommendation } from './decisionService';
import { forecastProductInventory } from './forecastService';
import { analyzeRiderCapacity } from './riderService';
import { evaluateStoreTransfers } from './transferService';

class SimulationManager {
  private baselineStores: Record<string, DarkStore>;
  private simulatedStores: Record<string, DarkStore>;
  private events: OperationalEvent[];
  private decisionHistory: DecisionRecord[];

  constructor() {
    this.baselineStores = createInitialStores();
    this.simulatedStores = JSON.parse(JSON.stringify(this.baselineStores));
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.decisionHistory = [];
  }

  public resetToBaseline(): void {
    this.baselineStores = createInitialStores();
    this.simulatedStores = JSON.parse(JSON.stringify(this.baselineStores));
    this.events = JSON.parse(JSON.stringify(INITIAL_EVENTS));
    this.decisionHistory = [];
  }

  public getStores(isSimulatedView: boolean = true): Record<string, DarkStore> {
    return isSimulatedView ? this.simulatedStores : this.baselineStores;
  }

  public getStore(id: string, isSimulatedView: boolean = true): DarkStore | undefined {
    const stores = this.getStores(isSimulatedView);
    return stores[id];
  }

  public getEvents(): OperationalEvent[] {
    return this.events;
  }

  public updateEvent(eventUpdate: Partial<OperationalEvent> & { id: string }): OperationalEvent {
    const idx = this.events.findIndex((e) => e.id === eventUpdate.id);
    if (idx !== -1) {
      this.events[idx] = { ...this.events[idx], ...eventUpdate };
      return this.events[idx];
    }
    throw new Error(`Event ${eventUpdate.id} not found`);
  }

  public addEvent(newEvent: Omit<OperationalEvent, 'id'>): OperationalEvent {
    const id = `evt-custom-${Date.now()}`;
    const event: OperationalEvent = { id, ...newEvent };
    this.events.push(event);
    return event;
  }

  public toggleEvent(id: string): OperationalEvent {
    const event = this.events.find((e) => e.id === id);
    if (!event) throw new Error(`Event ${id} not found`);
    event.isActive = !event.isActive;
    return event;
  }

  public getRecommendations(isSimulatedView: boolean = true): OperationalRecommendation[] {
    const stores = this.getStores(isSimulatedView);
    return generateOperationalRecommendations(stores, this.events);
  }

  public getDecisionHistory(): DecisionRecord[] {
    return this.decisionHistory;
  }

  // Manager Approval: executes action in simulated state
  public approveRecommendation(
    recommendationId: string,
    chosenAlternativeId?: string,
    adjustedQty?: number,
    managerNotes?: string
  ): { decision: DecisionRecord; simulatedRecommendation: OperationalRecommendation } {
    const recommendations = this.getRecommendations(true);
    const rec = recommendations.find((r) => r.id === recommendationId);
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found`);
    }

    const alt = chosenAlternativeId
      ? rec.alternatives.find((a) => a.id === chosenAlternativeId) || rec.bestAction
      : rec.bestAction;

    const store = this.simulatedStores[rec.storeId];
    if (!store) throw new Error(`Target store ${rec.storeId} not found`);

    let stockSaved = 0;
    let contributionMarginSaved = 0;
    let netBenefit = 0;
    let actionSummary = '';

    // Apply simulation mutation to simulatedStores
    if (alt.actionType === 'STORE_TRANSFER') {
      const sourceStoreId = alt.parameters.sourceStoreId;
      const transferQty = adjustedQty || alt.parameters.transferQuantity || 20;
      const sourceStore = this.simulatedStores[sourceStoreId];

      if (sourceStore && sourceStore.inventory[rec.sku]) {
        sourceStore.inventory[rec.sku].currentStock = Math.max(
          0,
          sourceStore.inventory[rec.sku].currentStock - transferQty
        );
      }

      if (store.inventory[rec.sku]) {
        store.inventory[rec.sku].currentStock += transferQty;
        // Expand shelf slot if needed to simulate temporary placement
        if (store.inventory[rec.sku].currentStock > store.inventory[rec.sku].shelfCapacity) {
          store.inventory[rec.sku].shelfCapacity = store.inventory[rec.sku].currentStock + 5;
        }
      }

      stockSaved = transferQty;
      contributionMarginSaved = alt.avoidedLostContributionMargin;
      netBenefit = alt.netBenefit;
      actionSummary = `Transferred ${transferQty} units of ${rec.productName} from ${alt.parameters.sourceStoreName} to ${store.name}.`;
    } else if (alt.actionType === 'SHELF_SWAP') {
      const donorSku = alt.parameters.donorSku;
      const slots = alt.parameters.slotsReallocated || 8;

      if (store.inventory[rec.sku]) {
        store.inventory[rec.sku].shelfCapacity += slots;
        store.inventory[rec.sku].currentStock += slots; // allows holding more buffer
      }
      if (store.inventory[donorSku]) {
        store.inventory[donorSku].shelfCapacity = Math.max(4, store.inventory[donorSku].shelfCapacity - slots);
      }

      stockSaved = slots;
      contributionMarginSaved = alt.avoidedLostContributionMargin;
      netBenefit = alt.netBenefit;
      actionSummary = `Reallocated ${slots} shelf slots from ${alt.parameters.donorName} to ${rec.productName}.`;
    } else if (alt.actionType === 'EXPEDITE_TRUCK') {
      const expeditedQty = adjustedQty || 30;
      if (store.inventory[rec.sku]) {
        store.inventory[rec.sku].currentStock += expeditedQty;
      }
      store.truckSchedule.estimatedMinutesUntilTruck = Math.min(
        35,
        store.truckSchedule.estimatedMinutesUntilTruck
      );
      stockSaved = expeditedQty;
      contributionMarginSaved = alt.avoidedLostContributionMargin;
      netBenefit = alt.netBenefit;
      actionSummary = `Dispatched rush sprinter van with ${expeditedQty} units from Central Warehouse. Truck ETA brought forward to 35 mins.`;
    } else if (alt.actionType === 'RIDER_REASSIGN') {
      store.riders.activeCount += 4;
      actionSummary = `Reassigned 4 riders from donor hubs to ${store.name}.`;
    } else {
      actionSummary = `Acknowledged and approved to wait for regular truck schedule at ${store.truckSchedule.nextArrival}.`;
    }

    const decisionRecord: DecisionRecord = {
      id: `dec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recommendationId: rec.id,
      storeId: rec.storeId,
      storeName: store.name,
      sku: rec.sku,
      productName: rec.productName,
      actionType: alt.actionType,
      actionSummary,
      decision: 'APPROVED',
      timestamp: new Date().toISOString(),
      managerNotes: managerNotes || 'Approved via Operations Command Center',
      assumptions: {
        demandMultiplier: 3.6,
        minutesToTruck: store.truckSchedule.estimatedMinutesUntilTruck,
        initialStock: rec.baselineMetrics.currentStock,
        transferCost: alt.incrementalCost,
      },
      baselineMetrics: {
        expectedShortage: rec.baselineMetrics.expectedShortageQuantity,
        lostSalesRevenue: rec.baselineMetrics.estimatedLostSalesRevenue,
        lostContributionMargin: rec.baselineMetrics.estimatedLostContributionMargin,
        coverageHours: rec.baselineMetrics.timeUntilStockoutMinutes
          ? Number((rec.baselineMetrics.timeUntilStockoutMinutes / 60).toFixed(1))
          : 5,
      },
      simulatedOutcome: {
        stockSaved,
        contributionMarginSaved,
        netBenefit,
        isFullyResolved: true,
        remainingRisk: 'Traffic variations during transfer; monitor courier GPS.',
      },
      isSimulatedOnly: true,
    };

    this.decisionHistory.unshift(decisionRecord);

    // Re-evaluate recommendations after mutation
    const updatedRecs = this.getRecommendations(true);
    const updatedRec = updatedRecs.find((r) => r.id === recommendationId) || rec;

    return {
      decision: decisionRecord,
      simulatedRecommendation: updatedRec,
    };
  }

  // Manager Rejection: logs record without mutating store
  public rejectRecommendation(
    recommendationId: string,
    reason?: string
  ): DecisionRecord {
    const rec = this.getRecommendations(true).find((r) => r.id === recommendationId);
    if (!rec) throw new Error(`Recommendation ${recommendationId} not found`);

    const decisionRecord: DecisionRecord = {
      id: `dec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recommendationId: rec.id,
      storeId: rec.storeId,
      storeName: rec.storeName,
      sku: rec.sku,
      productName: rec.productName,
      actionType: rec.bestAction.actionType,
      actionSummary: `Rejected proposed action: "${rec.bestAction.title}".`,
      decision: 'REJECTED',
      timestamp: new Date().toISOString(),
      managerNotes: reason || 'Manager opted to accept baseline risk.',
      assumptions: {
        demandMultiplier: 3.6,
        minutesToTruck: rec.baselineMetrics.minutesUntilTruck,
        initialStock: rec.baselineMetrics.currentStock,
        transferCost: rec.bestAction.incrementalCost,
      },
      baselineMetrics: {
        expectedShortage: rec.baselineMetrics.expectedShortageQuantity,
        lostSalesRevenue: rec.baselineMetrics.estimatedLostSalesRevenue,
        lostContributionMargin: rec.baselineMetrics.estimatedLostContributionMargin,
        coverageHours: 1.5,
      },
      simulatedOutcome: {
        stockSaved: 0,
        contributionMarginSaved: 0,
        netBenefit: 0,
        isFullyResolved: false,
        remainingRisk: 'Shortage will materialize as forecast unless customer orders migrate to substitutes.',
      },
      isSimulatedOnly: true,
    };

    this.decisionHistory.unshift(decisionRecord);
    return decisionRecord;
  }

  // Load Demonstration Challenge Scenarios
  public loadDemoScenario(scenarioId: number): { name: string; description: string } {
    this.resetToBaseline();

    switch (scenarioId) {
      case 1: {
        // CHALLENGE SPECIFICATION: Store 7 & Store 9 Cold Drink Match Scenario
        // Store 7: 14 bottles 750ml, demand 9/hr, match at 7:30 PM (19:30), next truck 9 PM (21:00)
        // Store 9: 2 km away, 60 bottles, demand 3/hr
        const store7 = this.simulatedStores['store_7'];
        const store9 = this.simulatedStores['store_9'];

        if (store7 && store7.inventory['SKU-CD-750']) {
          store7.inventory['SKU-CD-750'].currentStock = 14;
          store7.inventory['SKU-CD-750'].shelfCapacity = 14; // full shelf
          store7.truckSchedule.nextArrival = '21:00';
          store7.truckSchedule.estimatedMinutesUntilTruck = 150;
        }

        if (store9 && store9.inventory['SKU-CD-750']) {
          store9.inventory['SKU-CD-750'].currentStock = 60;
        }

        // Activate cricket match event
        const cricketEvt = this.events.find((e) => e.type === 'cricket');
        if (cricketEvt) {
          cricketEvt.isActive = true;
          cricketEvt.multiplier = 3.6;
        }

        return {
          name: 'Challenge Scenario 1: Store 7 Cold Drink Stockout vs Store 9 Surplus',
          description: 'Store 7 has only 14 bottles of 750ml Cold Drink with 9 bottles/hr match demand. Stockout in ~75 mins before 9 PM truck. Store 9 has 60 bottles surplus 2.2 km away.',
        };
      }

      case 2: {
        // Scenario 2: Monsoon Rain Sudden Demand Spike
        const rainEvt = this.events.find((e) => e.type === 'rain');
        if (rainEvt) {
          rainEvt.isActive = true;
          rainEvt.multiplier = 3.2;
        }
        const store3 = this.simulatedStores['store_3'];
        if (store3 && store3.inventory['SKU-INST-MAGGI']) {
          store3.inventory['SKU-INST-MAGGI'].currentStock = 6;
        }
        return {
          name: 'Scenario 2: Heavy Cloudburst Demand Spike',
          description: 'South Bangalore flash cloudburst triggers 3.2x demand for hot instant noodles and tea. Koramangala Store 3 stock running out in 45 minutes.',
        };
      }

      case 3: {
        // Scenario 3: Shelf Space Inefficiency (Fast mover starved by slow mover)
        const store1 = this.simulatedStores['store_1'];
        if (store1) {
          if (store1.inventory['SKU-SNK-LAYS']) {
            store1.inventory['SKU-SNK-LAYS'].currentStock = 12;
            store1.inventory['SKU-SNK-LAYS'].shelfCapacity = 16;
          }
          if (store1.inventory['SKU-SNK-WASABI']) {
            store1.inventory['SKU-SNK-WASABI'].currentStock = 22;
            store1.inventory['SKU-SNK-WASABI'].shelfCapacity = 25;
          }
        }
        return {
          name: 'Scenario 3: Shelf Space Misallocation',
          description: 'Slow-selling Wasabi Kale Crisps (0.2 sales/hr) occupy 25 prime slots, while fast-moving Party Pack chips are restricted to 16 slots.',
        };
      }

      case 4: {
        // Scenario 4: Surplus Store vs Shortage Store (Fresh Milk / Staples)
        const store4 = this.simulatedStores['store_4'];
        const store12 = this.simulatedStores['store_12'];
        if (store4 && store4.inventory['SKU-DRY-MILK']) {
          store4.inventory['SKU-DRY-MILK'].currentStock = 8;
        }
        if (store12 && store12.inventory['SKU-DRY-MILK']) {
          store12.inventory['SKU-DRY-MILK'].currentStock = 90;
        }
        return {
          name: 'Scenario 4: Inter-Hub Surplus Balancing (Staples)',
          description: 'HSR Layout Store 4 running dry on Fresh Milk before evening rush, while BTM Store 12 holds 90 surplus units.',
        };
      }

      case 5: {
        // Scenario 5: Rider Capacity Bottleneck (Orders lost due to fleet shortage, not stock)
        const store15 = this.simulatedStores['store_15'];
        if (store15) {
          store15.riders.activeCount = 4;
          store15.riders.currentHourlyOrderRate = 96; // 96 orders/hr vs 11.2 cap
        }
        return {
          name: 'Scenario 5: Delivery Fleet Bottleneck',
          description: 'Whitefield Store 15 has 98% stock availability but only 4 active riders for 96 incoming orders/hour. Restocking is unnecessary; fleet surge is required.',
        };
      }

      default:
        return {
          name: 'Default State',
          description: 'All 30 stores operating under standard evening match preview conditions.',
        };
    }
  }

  // Interactive What-If Simulator: recalculates with custom hypothetical parameters
  public simulateWhatIf(params: {
    storeId: string;
    sku: string;
    currentStock: number;
    hourlyDemandMultiplier: number;
    minutesUntilTruck: number;
    shelfCapacity: number;
    riderCount: number;
  }) {
    const store = this.simulatedStores[params.storeId];
    if (!store) throw new Error(`Store ${params.storeId} not found`);

    // Create temporary virtual store clone
    const virtualStore: DarkStore = JSON.parse(JSON.stringify(store));
    virtualStore.truckSchedule.estimatedMinutesUntilTruck = params.minutesUntilTruck;
    virtualStore.riders.activeCount = params.riderCount;

    if (virtualStore.inventory[params.sku]) {
      virtualStore.inventory[params.sku].currentStock = params.currentStock;
      virtualStore.inventory[params.sku].shelfCapacity = params.shelfCapacity;
    }

    // Temporary events with custom multiplier
    const customEvents: OperationalEvent[] = this.events.map((e) => ({
      ...e,
      multiplier: e.multiplier * params.hourlyDemandMultiplier,
    }));

    const forecast = forecastProductInventory(virtualStore, params.sku, customEvents);
    const riderAnalysis = analyzeRiderCapacity(virtualStore, this.simulatedStores, forecast.riskLevel === 'CRITICAL');
    const transferOptions = evaluateStoreTransfers(
      this.simulatedStores,
      params.storeId,
      params.sku,
      forecast.expectedShortageQuantity,
      forecast.timeUntilStockoutMinutes
    );

    return {
      forecast,
      riderAnalysis,
      transferOptions,
      isFeasibleTransferAvailable: transferOptions.some((t: any) => t.isFeasible),
      bestTransferOption: transferOptions[0] || null,
    };
  }
}

export const simulationManager = new SimulationManager();
