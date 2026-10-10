export interface DarkStoreMeta {
  id: string;
  numericId: number;
  name: string;
  locality: string;
  lat: number;
  lng: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  nextTruckArrival: string;
  minutesUntilTruck: number;
  activeRiders: number;
  orderRate: number;
  deliveryCapacity: number;
  riderBottleneck: string;
  shelfUtilizationPct: number;
  signatureStock: {
    coldDrink: number;
    wasabiCrisps: number;
    milk: number;
  };
}

export interface DashboardData {
  kpis: {
    storesMonitored: number;
    productsMonitored: number;
    productsAtRisk: number;
    estimatedLostSales: number;
    estimatedLostMargin: number;
    pendingRecommendations: number;
    storesWithRiderBottlenecks: number;
    storesStatus: {
      healthy: number;
      warning: number;
      critical: number;
    };
  };
  urgentAlerts: UrgentAlert[];
  activeEvents: OperationalEvent[];
  topRecommendations: OperationalRecommendation[];
  recentDecisions: DecisionRecord[];
}

export interface UrgentAlert {
  id: string;
  storeId: string;
  storeName: string;
  sku: string;
  productName: string;
  category: string;
  currentStock: number;
  timeUntilStockoutMinutes: number | null;
  nextTruckArrival: string;
  minutesUntilTruck: number;
  expectedShortage: number;
  lostMargin: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
}

export interface HourlyForecastPoint {
  hourIndex: number;
  timeLabel: string;
  baselineDemand: number;
  eventMultiplier: number;
  effectiveDemand: number;
  cumulativeDemand: number;
  projectedStockOnHand: number;
  isReplenishmentArrival: boolean;
  replenishmentQuantity: number;
  isStockout: boolean;
  unmetDemand: number;
}

export interface InventoryForecastResult {
  storeId: string;
  sku: string;
  productName: string;
  category: string;
  price: number;
  margin: number;
  currentStock: number;
  safetyStock: number;
  replenishmentThreshold: number;
  shelfCapacity: number;
  shelfUtilizationPct: number;
  minutesUntilTruck: number;
  nextTruckArrival: string;
  hourlyPoints: HourlyForecastPoint[];
  totalDemandUntilTruck: number;
  projectedStockAtTruckArrival: number;
  timeUntilStockoutMinutes: number | null;
  expectedShortageQuantity: number;
  inventoryCoverageHours: number;
  expectedLostUnits: number;
  estimatedLostSalesRevenue: number;
  estimatedLostContributionMargin: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  activeEventNames: string[];
}

export interface OperationalEvent {
  id: string;
  name: string;
  type: 'cricket' | 'rain' | 'festival' | 'local_event';
  startTime: string;
  durationHours: number;
  affectedStoreIds: string[];
  affectedCategories: string[];
  multiplier: number;
  description: string;
  isActive: boolean;
}

export interface DecisionAlternative {
  id: string;
  actionType: 'STORE_TRANSFER' | 'SHELF_SWAP' | 'EXPEDITE_TRUCK' | 'RIDER_REASSIGN' | 'WAIT';
  title: string;
  description: string;
  timeToResolutionMinutes: number;
  expectedShortageUnits: number;
  avoidedLostUnits: number;
  avoidedLostContributionMargin: number;
  incrementalCost: number;
  netBenefit: number;
  isFeasible: boolean;
  rejectionReason?: string;
  operationalRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  parameters: Record<string, any>;
}

export interface OperationalRecommendation {
  id: string;
  storeId: string;
  storeName: string;
  sku: string;
  productName: string;
  category: string;
  urgencyScore: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  reasoning: {
    whatIsHappening: string;
    whyItIsHappening: string;
    whatIfNoAction: string;
    alternativesConsidered: string[];
    whyPreferredActionIsBetter: string;
    remainingRisks: string;
    underlyingAssumptions: string[];
  };
  confidenceScore: number;
  recommendedAlternativeId: string;
  recommendedActionType: 'STORE_TRANSFER' | 'SHELF_SWAP' | 'EXPEDITE_TRUCK' | 'RIDER_REASSIGN' | 'WAIT';
  baselineMetrics: {
    currentStock: number;
    safetyStock: number;
    hourlyDemand: number;
    nextTruckArrival: string;
    minutesUntilTruck: number;
    timeUntilStockoutMinutes: number | null;
    expectedShortageQuantity: number;
    estimatedLostSalesRevenue: number;
    estimatedLostContributionMargin: number;
  };
  alternatives: DecisionAlternative[];
  bestAction: DecisionAlternative;
}

export interface DecisionRecord {
  id: string;
  recommendationId: string;
  storeId: string;
  storeName: string;
  sku: string;
  productName: string;
  actionType: 'STORE_TRANSFER' | 'SHELF_SWAP' | 'EXPEDITE_TRUCK' | 'RIDER_REASSIGN' | 'WAIT';
  actionSummary: string;
  decision: 'APPROVED' | 'REJECTED';
  timestamp: string;
  managerNotes?: string;
  assumptions: {
    demandMultiplier: number;
    minutesToTruck: number;
    initialStock: number;
    transferCost: number;
  };
  baselineMetrics: {
    expectedShortage: number;
    lostSalesRevenue: number;
    lostContributionMargin: number;
    coverageHours: number;
  };
  simulatedOutcome: {
    stockSaved: number;
    contributionMarginSaved: number;
    netBenefit: number;
    isFullyResolved: boolean;
    remainingRisk: string;
  };
  isSimulatedOnly: true;
}

export interface StoreTransferEvaluation {
  id: string;
  sourceStoreId: string;
  sourceStoreName: string;
  destinationStoreId: string;
  destinationStoreName: string;
  sku: string;
  productName: string;
  category: string;
  unitMargin: number;
  distanceKm: number;
  travelMinutes: number;
  sourceCurrentStock: number;
  sourceSafetyStock: number;
  sourceAvailableSurplus: number;
  destinationCurrentStock: number;
  destinationShortage: number;
  destinationMinutesUntilStockout: number | null;
  destinationShelfCapacity: number;
  recommendedTransferQty: number;
  transferCost: number;
  expectedMarginSaved: number;
  netBenefit: number;
  isFeasible: boolean;
  rejectionReason?: string;
  arrivalFeasibility: 'ARRIVES_WELL_BEFORE_STOCKOUT' | 'MARGINAL_WINDOW' | 'TOO_LATE';
  sourceSafetyStockPreserved: boolean;
  destinationCapacityPreserved: boolean;
}

export interface ShelfSwapOpportunity {
  storeId: string;
  storeName: string;
  fastMovingSku: string;
  fastMovingName: string;
  fastMovingCategory: string;
  fastMovingMargin: number;
  fastMovingHourlyVelocity: number;
  fastMovingCurrentStock: number;
  fastMovingShelfCapacity: number;
  slowMovingSku: string;
  slowMovingName: string;
  slowMovingCategory: string;
  slowMovingMargin: number;
  slowMovingHourlyVelocity: number;
  slowMovingCurrentStock: number;
  slowMovingShelfCapacity: number;
  proposedReallocatedCapacity: number;
  newFastMovingCapacity: number;
  newSlowMovingCapacity: number;
  expectedMarginGain: number;
  shelfPhysicalCompatibility: 'EXCELLENT' | 'COMPATIBLE' | 'REQUIRES_REORGANIZATION';
  explanation: string;
  isFeasible: boolean;
  rejectionReason?: string;
}

export interface RiderAnalysisResult {
  storeId: string;
  storeName: string;
  activeRiders: number;
  maxOrdersPerRiderPerHour: number;
  deliveryCapacityPerHour: number;
  currentHourlyOrderRate: number;
  capacityUtilizationPct: number;
  unservedOrdersPerHour: number;
  estimatedLostOrderRevenue: number;
  estimatedLostOrderMargin: number;
  bottleneckType: 'INVENTORY_SHORTAGE_ONLY' | 'RIDER_CAPACITY_BOTTLENECK' | 'COMPOUND_BOTTLENECK' | 'HEALTHY';
  recommendedAdditionalRiders: number;
  recommendedDonorStoreId?: string;
  recommendedDonorStoreName?: string;
  actionSummary: string;
  isRiderActionFeasible: boolean;
}
