import { DarkStore } from '../data/storeData';

export type OperationalBottleneckType =
  | 'INVENTORY_SHORTAGE_ONLY'
  | 'RIDER_CAPACITY_BOTTLENECK'
  | 'COMPOUND_BOTTLENECK'
  | 'HEALTHY';

export interface RiderAnalysisResult {
  storeId: string;
  storeName: string;
  activeRiders: number;
  maxOrdersPerRiderPerHour: number;
  deliveryCapacityPerHour: number;
  currentHourlyOrderRate: number;
  capacityUtilizationPct: number;
  unservedOrdersPerHour: number;
  estimatedLostOrderRevenue: number; // avg basket ₹350
  estimatedLostOrderMargin: number;  // avg basket margin ₹70
  bottleneckType: OperationalBottleneckType;
  recommendedAdditionalRiders: number;
  recommendedDonorStoreId?: string;
  recommendedDonorStoreName?: string;
  actionSummary: string;
  isRiderActionFeasible: boolean;
}

export function analyzeRiderCapacity(
  store: DarkStore,
  allStores: Record<string, DarkStore>,
  hasCriticalInventoryStockout: boolean
): RiderAnalysisResult {
  const riders = store.riders.activeCount;
  const rate = store.riders.maxOrdersPerHourPerRider;
  const deliveryCapacityPerHour = Number((riders * rate).toFixed(1));
  const orderRate = store.riders.currentHourlyOrderRate;

  const capacityUtilizationPct = Math.round((orderRate / Math.max(1, deliveryCapacityPerHour)) * 100);
  const unservedOrders = Math.max(0, Number((orderRate - deliveryCapacityPerHour).toFixed(1)));

  // Lost order economics: Quick commerce avg basket ₹350, margin ₹70
  const estimatedLostOrderRevenue = Math.round(unservedOrders * 350);
  const estimatedLostOrderMargin = Math.round(unservedOrders * 70);

  // Classification
  let bottleneckType: OperationalBottleneckType = 'HEALTHY';
  const hasRiderShortage = unservedOrders > 2.0 || capacityUtilizationPct >= 115;

  if (hasCriticalInventoryStockout && hasRiderShortage) {
    bottleneckType = 'COMPOUND_BOTTLENECK';
  } else if (hasRiderShortage) {
    bottleneckType = 'RIDER_CAPACITY_BOTTLENECK';
  } else if (hasCriticalInventoryStockout) {
    bottleneckType = 'INVENTORY_SHORTAGE_ONLY';
  }

  // Calculate required riders to clear backlog
  const deficitOrders = Math.max(0, orderRate - deliveryCapacityPerHour);
  const additionalRidersNeeded = Math.ceil(deficitOrders / rate);

  // Look for a nearby donor store with surplus riders (<70% utilization)
  let donorStoreId: string | undefined;
  let donorStoreName: string | undefined;

  if (additionalRidersNeeded > 0) {
    for (const donor of Object.values(allStores)) {
      if (donor.id === store.id) continue;
      const donorCapacity = donor.riders.activeCount * donor.riders.maxOrdersPerHourPerRider;
      const donorUtil = donor.riders.currentHourlyOrderRate / Math.max(1, donorCapacity);
      if (donorUtil < 0.65 && donor.riders.activeCount >= 8) {
        donorStoreId = donor.id;
        donorStoreName = donor.name;
        break;
      }
    }
  }

  let actionSummary = 'Delivery fleet is well-matched to order volume.';
  if (bottleneckType === 'RIDER_CAPACITY_BOTTLENECK') {
    actionSummary = `Orders are stalling strictly due to rider shortage (${deliveryCapacityPerHour} max cap vs ${orderRate} incoming/hr). Do NOT order surplus stock. Reassign ${additionalRidersNeeded} riders from nearby hubs or trigger dynamic gig surge incentives.`;
  } else if (bottleneckType === 'COMPOUND_BOTTLENECK') {
    actionSummary = `Dual crisis: Stockout imminent AND riders maxed out. Requires combined intervention: stock transfer plus ${additionalRidersNeeded} rider reassignments.`;
  } else if (bottleneckType === 'INVENTORY_SHORTAGE_ONLY') {
    actionSummary = `Rider capacity is healthy (${riders} riders, ${capacityUtilizationPct}% utilized). Problem is purely product stockout before truck arrival.`;
  }

  return {
    storeId: store.id,
    storeName: store.name,
    activeRiders: riders,
    maxOrdersPerRiderPerHour: rate,
    deliveryCapacityPerHour,
    currentHourlyOrderRate: orderRate,
    capacityUtilizationPct,
    unservedOrdersPerHour: unservedOrders,
    estimatedLostOrderRevenue,
    estimatedLostOrderMargin,
    bottleneckType,
    recommendedAdditionalRiders: additionalRidersNeeded,
    recommendedDonorStoreId: donorStoreId,
    recommendedDonorStoreName: donorStoreName,
    actionSummary,
    isRiderActionFeasible: additionalRidersNeeded > 0,
  };
}
