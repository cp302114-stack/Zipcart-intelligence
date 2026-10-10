import {
  calculateDistanceKm,
  CATALOG,
  DarkStore,
  estimateTravelMinutes,
  Product,
} from '../data/storeData';

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
  transferCost: number; // ₹ base dispatch + per km
  expectedMarginSaved: number;
  netBenefit: number; // expectedMarginSaved - transferCost
  
  isFeasible: boolean;
  rejectionReason?: string;
  arrivalFeasibility: 'ARRIVES_WELL_BEFORE_STOCKOUT' | 'MARGINAL_WINDOW' | 'TOO_LATE';
  sourceSafetyStockPreserved: boolean;
  destinationCapacityPreserved: boolean;
}

export function evaluateStoreTransfers(
  allStores: Record<string, DarkStore>,
  targetStoreId: string,
  sku: string,
  expectedShortageQty: number,
  minutesUntilStockout: number | null
): StoreTransferEvaluation[] {
  const destStore = allStores[targetStoreId];
  if (!destStore) return [];

  const product = CATALOG.find((p) => p.sku === sku);
  if (!product) return [];

  const evaluations: StoreTransferEvaluation[] = [];
  const destInv = destStore.inventory[sku] || {
    currentStock: 0,
    shelfCapacity: product.shelfUnitsPerSlot,
    safetyStock: 5,
  };

  for (const sourceStore of Object.values(allStores)) {
    if (sourceStore.id === targetStoreId) continue;

    const sourceInv = sourceStore.inventory[sku];
    if (!sourceInv || sourceInv.currentStock <= 0) continue;

    const distanceKm = calculateDistanceKm(
      sourceStore.lat,
      sourceStore.lng,
      destStore.lat,
      destStore.lng
    );

    // Limit candidate transfers to ~10 km radius for 10-minute grocery network
    if (distanceKm > 12) continue;

    const travelMinutes = estimateTravelMinutes(distanceKm);

    // Source surplus: stock above safety stock
    const sourceSurplus = Math.max(0, sourceInv.currentStock - sourceInv.safetyStock);

    // Desired transfer qty: min(expectedShortage, sourceSurplus, destination capacity remaining)
    // Note: If destination shelf is full, shelf expansion might be required or backroom buffer
    const destRemainingCapacity = Math.max(15, destInv.shelfCapacity - destInv.currentStock + 15); // with staging bin
    const candidateQty = Math.min(expectedShortageQty, sourceSurplus, destRemainingCapacity);

    // Dispatch cost formula: ₹50 baseline handling + ₹15 per km
    const transferCost = Math.round(50 + distanceKm * 15);
    const expectedMarginSaved = Math.round(candidateQty * product.margin);
    const netBenefit = expectedMarginSaved - transferCost;

    // Feasibility checks
    let isFeasible = true;
    let rejectionReason: string | undefined;

    const sourceSafetyStockPreserved = (sourceInv.currentStock - candidateQty) >= sourceInv.safetyStock;
    const destinationCapacityPreserved = (destInv.currentStock + candidateQty) <= (destInv.shelfCapacity + 25);

    let arrivalFeasibility: 'ARRIVES_WELL_BEFORE_STOCKOUT' | 'MARGINAL_WINDOW' | 'TOO_LATE' = 'ARRIVES_WELL_BEFORE_STOCKOUT';

    if (minutesUntilStockout !== null) {
      if (travelMinutes >= minutesUntilStockout) {
        arrivalFeasibility = 'TOO_LATE';
        isFeasible = false;
        rejectionReason = `Transfer travel time (${travelMinutes} min) exceeds time until stockout (${minutesUntilStockout} min). Stock will deplete before arrival.`;
      } else if (minutesUntilStockout - travelMinutes < 15) {
        arrivalFeasibility = 'MARGINAL_WINDOW';
      }
    }

    if (candidateQty <= 0) {
      isFeasible = false;
      rejectionReason = rejectionReason || `Source store has no surplus stock above safety threshold (stock: ${sourceInv.currentStock}, safety: ${sourceInv.safetyStock})`;
    } else if (!sourceSafetyStockPreserved) {
      isFeasible = false;
      rejectionReason = rejectionReason || `Transfer would deplete source store below required safety stock (${sourceInv.safetyStock} units)`;
    }

    if (netBenefit <= 0 && isFeasible) {
      // It's technically physically feasible, but negative ROI
      // We still include it, but flag low benefit
    }

    evaluations.push({
      id: `xfer-${sourceStore.id}-${destStore.id}-${sku}`,
      sourceStoreId: sourceStore.id,
      sourceStoreName: sourceStore.name,
      destinationStoreId: destStore.id,
      destinationStoreName: destStore.name,
      sku,
      productName: product.name,
      category: product.category,
      unitMargin: product.margin,
      distanceKm,
      travelMinutes,
      sourceCurrentStock: sourceInv.currentStock,
      sourceSafetyStock: sourceInv.safetyStock,
      sourceAvailableSurplus: sourceSurplus,
      destinationCurrentStock: destInv.currentStock,
      destinationShortage: expectedShortageQty,
      destinationMinutesUntilStockout: minutesUntilStockout,
      destinationShelfCapacity: destInv.shelfCapacity,
      recommendedTransferQty: Math.max(0, candidateQty),
      transferCost,
      expectedMarginSaved,
      netBenefit,
      isFeasible,
      rejectionReason,
      arrivalFeasibility,
      sourceSafetyStockPreserved,
      destinationCapacityPreserved,
    });
  }

  // Sort: Feasible first, then highest netBenefit
  evaluations.sort((a, b) => {
    if (a.isFeasible !== b.isFeasible) {
      return a.isFeasible ? -1 : 1;
    }
    return b.netBenefit - a.netBenefit;
  });

  return evaluations;
}
