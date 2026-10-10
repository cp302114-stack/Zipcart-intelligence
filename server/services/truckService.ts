import { DarkStore } from '../data/storeData';

export interface TruckReplenishmentEvaluation {
  storeId: string;
  storeName: string;
  scheduledArrival: string; // "21:00"
  minutesToScheduledArrival: number;
  warehouseStockAvailable: number;
  truckCapacityRemaining: number;
  
  // Option 1: Wait for scheduled truck
  waitOption: {
    arrivalMinutes: number;
    shortageUnits: number;
    lostMargin: number;
    interventionCost: number;
    netBenefit: number;
    recommendationText: string;
  };

  // Option 2: Expedite truck (rush dispatch from warehouse)
  expeditedOption: {
    isFeasible: boolean;
    rejectionReason?: string;
    expeditedArrivalMinutes: number;
    expeditedArrivalTime: string;
    expeditedShortageUnits: number;
    marginSaved: number;
    expeditedCost: number; // rush courier / fleet re-route cost ₹350
    netBenefit: number;
    warehouseSufficient: boolean;
  };
}

export function evaluateTruckOptions(
  store: DarkStore,
  expectedDemandPerHour: number,
  currentStock: number,
  productMargin: number,
  requestedUnits: number = 30
): TruckReplenishmentEvaluation {
  const schedMinutes = store.truckSchedule.estimatedMinutesUntilTruck;
  const schedHours = schedMinutes / 60;
  
  // 1. Calculate impact of waiting
  const demandUntilSchedTruck = expectedDemandPerHour * schedHours;
  const waitShortageUnits = Math.max(0, Math.round(demandUntilSchedTruck - currentStock));
  const waitLostMargin = Math.round(waitShortageUnits * productMargin);

  // 2. Expedited truck evaluation
  // Central warehouse can expedite a sprinter van / rapid van in 40 minutes minimum
  const expeditedArrivalMinutes = 40;
  const expeditedCost = 350; // Rush logistics surcharge
  const warehouseStock = store.truckSchedule.warehouseAvailableUnits;
  const warehouseSufficient = warehouseStock >= requestedUnits;
  const truckCapOk = (store.truckSchedule.truckCapacity - store.truckSchedule.allocatedUnits) >= requestedUnits;

  let isExpeditedFeasible = true;
  let expeditedRejectionReason: string | undefined;

  if (schedMinutes <= 45) {
    isExpeditedFeasible = false;
    expeditedRejectionReason = `Scheduled truck is already only ${schedMinutes} minutes away; expediting saves negligible time and wastes ₹350.`;
  } else if (!warehouseSufficient) {
    isExpeditedFeasible = false;
    expeditedRejectionReason = `Central warehouse lacks required inventory (${warehouseStock} available vs ${requestedUnits} requested).`;
  }

  const demandUntilExpedited = expectedDemandPerHour * (expeditedArrivalMinutes / 60);
  const expeditedShortageUnits = Math.max(0, Math.round(demandUntilExpedited - currentStock));
  const shortagePrevented = Math.max(0, waitShortageUnits - expeditedShortageUnits);
  const marginSaved = Math.round(shortagePrevented * productMargin);
  const expeditedNetBenefit = marginSaved - expeditedCost;

  return {
    storeId: store.id,
    storeName: store.name,
    scheduledArrival: store.truckSchedule.nextArrival,
    minutesToScheduledArrival: schedMinutes,
    warehouseStockAvailable: warehouseStock,
    truckCapacityRemaining: store.truckSchedule.truckCapacity - store.truckSchedule.allocatedUnits,
    waitOption: {
      arrivalMinutes: schedMinutes,
      shortageUnits: waitShortageUnits,
      lostMargin: waitLostMargin,
      interventionCost: 0,
      netBenefit: 0,
      recommendationText: waitShortageUnits <= 2
        ? 'Stock is adequate until the scheduled truck. Waiting is the optimal, zero-cost decision.'
        : `Waiting will incur ${waitShortageUnits} units shortage and ₹${waitLostMargin} margin loss before arrival at ${store.truckSchedule.nextArrival}.`,
    },
    expeditedOption: {
      isFeasible: isExpeditedFeasible,
      rejectionReason: expeditedRejectionReason,
      expeditedArrivalMinutes,
      expeditedArrivalTime: '19:10',
      expeditedShortageUnits,
      marginSaved,
      expeditedCost,
      netBenefit: expeditedNetBenefit,
      warehouseSufficient,
    },
  };
}
