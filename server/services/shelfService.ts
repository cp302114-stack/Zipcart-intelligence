import { CATALOG, DarkStore, Product } from '../data/storeData';

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
  expectedMarginGain: number; // ₹ saved / earned over next 4 hours
  shelfPhysicalCompatibility: 'EXCELLENT' | 'COMPATIBLE' | 'REQUIRES_REORGANIZATION';
  explanation: string;
  isFeasible: boolean;
  rejectionReason?: string;
}

export function evaluateShelfSpaceOptimization(store: DarkStore): ShelfSwapOpportunity[] {
  const opportunities: ShelfSwapOpportunity[] = [];
  const inventoryList = Object.values(store.inventory);

  // Group inventory by category or adjacent zones
  // Identify fast moving SKUs with high velocity and restricted shelf capacity
  const fastMovers: Array<{ rec: any; prod: Product; velocityRatio: number }> = [];
  const slowMovers: Array<{ rec: any; prod: Product; velocityRatio: number }> = [];

  for (const item of inventoryList) {
    const prod = CATALOG.find((p) => p.sku === item.sku);
    if (!prod) continue;

    const velocity = prod.baseHourlyVelocity;
    const capacity = item.shelfCapacity;
    const stock = item.currentStock;

    // Fast mover: high velocity relative to shelf capacity (would run out in < 3 hours if full)
    if (velocity >= 2.0 && stock / Math.max(1, capacity) <= 1.0) {
      fastMovers.push({ rec: item, prod, velocityRatio: velocity / Math.max(1, capacity) });
    }

    // Slow mover: very low velocity (< 0.5 units/hr) but occupying 15+ slots
    if (velocity <= 0.4 && capacity >= 14 && stock >= 10) {
      slowMovers.push({ rec: item, prod, velocityRatio: velocity / Math.max(1, capacity) });
    }
  }

  // Sort fast movers by urgency (highest velocity ratio first)
  fastMovers.sort((a, b) => b.velocityRatio - a.velocityRatio);
  // Sort slow movers by lowest velocity
  slowMovers.sort((a, b) => a.velocityRatio - b.velocityRatio);

  for (const fast of fastMovers.slice(0, 3)) {
    for (const slow of slowMovers.slice(0, 3)) {
      if (fast.prod.sku === slow.prod.sku) continue;

      // Calculate reallocatable capacity (transfer half of slow-mover's excess space)
      const slowExcessSlots = Math.max(4, Math.floor(slow.rec.shelfCapacity * 0.5));
      const newFastCapacity = fast.rec.shelfCapacity + slowExcessSlots;
      const newSlowCapacity = slow.rec.shelfCapacity - slowExcessSlots;

      // Calculate 4-hour expected margin differential
      // Fast mover can now hold more units during peak demand
      const additionalUnitsAccommodated = slowExcessSlots;
      const expectedMarginGain = additionalUnitsAccommodated * fast.prod.margin;

      const explanation = `Reallocate ${slowExcessSlots} shelf slots from slow-selling "${slow.prod.name}" (sales rate ${slow.prod.baseHourlyVelocity}/hr) to high-velocity "${fast.prod.name}" (demand rate ${fast.prod.baseHourlyVelocity}/hr). Increases fast-mover capacity from ${fast.rec.shelfCapacity} to ${newFastCapacity} units, preventing shelf-starvation during peak traffic.`;

      // Feasibility checks
      let isFeasible = true;
      let rejectionReason: string | undefined;

      if (newSlowCapacity < 4) {
        isFeasible = false;
        rejectionReason = `Slow mover capacity would drop below minimum display threshold of 4 units`;
      }

      opportunities.push({
        storeId: store.id,
        storeName: store.name,
        fastMovingSku: fast.prod.sku,
        fastMovingName: fast.prod.name,
        fastMovingCategory: fast.prod.category,
        fastMovingMargin: fast.prod.margin,
        fastMovingHourlyVelocity: fast.prod.baseHourlyVelocity,
        fastMovingCurrentStock: fast.rec.currentStock,
        fastMovingShelfCapacity: fast.rec.shelfCapacity,
        
        slowMovingSku: slow.prod.sku,
        slowMovingName: slow.prod.name,
        slowMovingCategory: slow.prod.category,
        slowMovingMargin: slow.prod.margin,
        slowMovingHourlyVelocity: slow.prod.baseHourlyVelocity,
        slowMovingCurrentStock: slow.rec.currentStock,
        slowMovingShelfCapacity: slow.rec.shelfCapacity,
        
        proposedReallocatedCapacity: slowExcessSlots,
        newFastMovingCapacity: newFastCapacity,
        newSlowMovingCapacity: newSlowCapacity,
        expectedMarginGain: Math.round(expectedMarginGain),
        shelfPhysicalCompatibility: 'EXCELLENT',
        explanation,
        isFeasible,
        rejectionReason,
      });
    }
  }

  return opportunities;
}
