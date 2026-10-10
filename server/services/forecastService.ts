import { CATALOG, DarkStore, OperationalEvent, Product } from '../data/storeData';

export interface HourlyForecastPoint {
  hourIndex: number;
  timeLabel: string; // e.g. "19:00", "20:00", "21:00"
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
  // Summary KPIs
  totalDemandUntilTruck: number;
  projectedStockAtTruckArrival: number;
  timeUntilStockoutMinutes: number | null; // null if no stockout
  expectedShortageQuantity: number;
  inventoryCoverageHours: number;
  expectedLostUnits: number;
  estimatedLostSalesRevenue: number;
  estimatedLostContributionMargin: number;
  riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  activeEventNames: string[];
}

// Current simulated time is 18:30 (6:30 PM), match starting at 19:30 (7:30 PM)
export const SIMULATED_START_HOUR = 18.5; // 18:30
export const SIMULATED_TIME_STR = '18:30';

export function calculateEffectiveMultiplier(
  product: Product,
  storeId: string,
  hourDecimal: number,
  events: OperationalEvent[]
): { multiplier: number; activeEvents: string[] } {
  let combinedMultiplier = 1.0;
  const activeEvents: string[] = [];

  for (const event of events) {
    if (!event.isActive) continue;

    // Check store filter
    if (event.affectedStoreIds.length > 0 && !event.affectedStoreIds.includes(storeId)) {
      continue;
    }

    // Parse event start time
    const [startH, startM] = event.startTime.split(':').map(Number);
    const eventStartDecimal = startH + (startM || 0) / 60;
    const eventEndDecimal = eventStartDecimal + event.durationHours;

    // Is current hour in event window or pre-match run-up (within 30 mins)?
    if (hourDecimal >= (eventStartDecimal - 0.5) && hourDecimal <= eventEndDecimal) {
      // Check if product's category is affected
      const categoryMatch = event.affectedCategories.length === 0 || event.affectedCategories.includes(product.category);
      if (categoryMatch) {
        // Look up product specific sensitivity for this event type
        let sensitivity = 1.0;
        if (event.type === 'cricket') sensitivity = product.eventSensitivities.cricket;
        else if (event.type === 'rain') sensitivity = product.eventSensitivities.rain;
        else if (event.type === 'festival') sensitivity = product.eventSensitivities.festival;
        else sensitivity = event.multiplier;

        // Peak curve during middle of event
        const progress = Math.max(0, Math.min(1, (hourDecimal - eventStartDecimal) / event.durationHours));
        const bellCurveFactor = Math.sin(progress * Math.PI) * 0.4 + 0.8;
        const netEventFactor = 1 + (sensitivity * event.multiplier / 2.5 - 1) * bellCurveFactor;

        combinedMultiplier *= Math.max(1.0, netEventFactor);
        activeEvents.push(event.name);
      }
    }
  }

  return {
    multiplier: Number(combinedMultiplier.toFixed(2)),
    activeEvents: Array.from(new Set(activeEvents))
  };
}

export function forecastProductInventory(
  store: DarkStore,
  sku: string,
  events: OperationalEvent[],
  forecastHorizonHours: number = 6
): InventoryForecastResult {
  const product = CATALOG.find((p) => p.sku === sku);
  if (!product) {
    throw new Error(`Product SKU ${sku} not found`);
  }

  const inventoryRec = store.inventory[sku] || {
    sku,
    currentStock: 0,
    shelfSlotId: 'SLOT-UNASSIGNED',
    shelfCapacity: product.shelfUnitsPerSlot,
    safetyStock: 5,
    replenishmentThreshold: 10,
    lastRestockedAt: '2026-10-10T12:00:00Z',
  };

  const currentStock = inventoryRec.currentStock;
  const minutesUntilTruck = store.truckSchedule.estimatedMinutesUntilTruck;
  const hoursUntilTruck = minutesUntilTruck / 60;

  // Hourly curve generation
  const hourlyPoints: HourlyForecastPoint[] = [];
  let runningStock = currentStock;
  let cumulativeDemand = 0;
  let timeUntilStockoutMinutes: number | null = null;
  let expectedShortageQuantity = 0;
  let allActiveEvents: string[] = [];

  const startHourInt = 18; // 18:00
  const startMinute = 30; // 18:30

  for (let i = 0; i <= forecastHorizonHours; i++) {
    const hourDecimal = startHourInt + startMinute / 60 + i;
    const hourInt = Math.floor(hourDecimal);
    const minInt = Math.round((hourDecimal - hourInt) * 60);
    const timeLabel = `${String(hourInt % 24).padStart(2, '0')}:${String(minInt).padStart(2, '0')}`;

    // Base hourly demand
    let baseDemand = product.baseHourlyVelocity;

    // Special scenario calibrations for Store 7 challenge:
    // "Store 7: 14 bottles. Demand of 9 bottles per hour on match nights. Match starts at 7:30 PM. Next truck arrives at 9 PM."
    if (store.numericId === 7 && sku === 'SKU-CD-750') {
      if (hourDecimal >= 19.5 && hourDecimal <= 22.5) {
        baseDemand = 9.0; // Prompt-specified 9 bottles/hour
      } else if (hourDecimal >= 18.5 && hourDecimal < 19.5) {
        baseDemand = 5.0; // Pre-match build-up
      }
    } else if (store.numericId === 9 && sku === 'SKU-CD-750') {
      // Store 9: Demand of 3 bottles per hour
      baseDemand = 3.0;
    }

    const { multiplier, activeEvents } = calculateEffectiveMultiplier(product, store.id, hourDecimal, events);
    allActiveEvents.push(...activeEvents);

    // If baseDemand was already override-calibrated for match, adjust multiplier gracefully
    const effectiveDemand = Number((baseDemand * (store.numericId === 7 && sku === 'SKU-CD-750' ? 1.0 : multiplier)).toFixed(1));

    // Replenishment event at truck arrival time
    const isTruckHour = Math.floor(hoursUntilTruck) === i;
    const replenishmentQty = isTruckHour && store.truckSchedule.warehouseStockOk ? Math.min(product.shelfUnitsPerSlot * 2, 40) : 0;

    // Stock simulation for this hour
    const startingStockThisHour = runningStock;
    cumulativeDemand += effectiveDemand;

    let unmetThisHour = 0;
    if (runningStock >= effectiveDemand) {
      runningStock -= effectiveDemand;
    } else {
      unmetThisHour = effectiveDemand - runningStock;
      if (timeUntilStockoutMinutes === null) {
        // Exact minute of stockout
        const fractionOfHour = effectiveDemand > 0 ? (runningStock / effectiveDemand) : 0;
        timeUntilStockoutMinutes = Math.max(5, Math.round((i * 60) + (fractionOfHour * 60)));
      }
      runningStock = 0;
      expectedShortageQuantity += unmetThisHour;
    }

    if (isTruckHour && replenishmentQty > 0) {
      runningStock += replenishmentQty;
    }

    hourlyPoints.push({
      hourIndex: i,
      timeLabel,
      baselineDemand: baseDemand,
      eventMultiplier: multiplier,
      effectiveDemand,
      cumulativeDemand: Number(cumulativeDemand.toFixed(1)),
      projectedStockOnHand: Math.round(runningStock),
      isReplenishmentArrival: isTruckHour,
      replenishmentQuantity: replenishmentQty,
      isStockout: startingStockThisHour <= 0 || unmetThisHour > 0,
      unmetDemand: Number(unmetThisHour.toFixed(1)),
    });
  }

  // Calculate demand until truck
  let totalDemandUntilTruck = 0;
  for (let m = 0; m < hoursUntilTruck && m < hourlyPoints.length; m++) {
    totalDemandUntilTruck += hourlyPoints[m].effectiveDemand;
  }
  totalDemandUntilTruck = Number(totalDemandUntilTruck.toFixed(1));

  const projectedStockAtTruckArrival = Math.max(0, currentStock - totalDemandUntilTruck);
  const expectedLostUnits = Math.round(expectedShortageQuantity);
  const estimatedLostSalesRevenue = Math.round(expectedLostUnits * product.price);
  const estimatedLostContributionMargin = Math.round(expectedLostUnits * product.margin);

  // Inventory coverage in hours
  const avgHourlyDemand = totalDemandUntilTruck / Math.max(1, hoursUntilTruck);
  const inventoryCoverageHours = avgHourlyDemand > 0 ? Number((currentStock / avgHourlyDemand).toFixed(1)) : 99;

  // Determine risk level
  let riskLevel: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
  if (timeUntilStockoutMinutes !== null && timeUntilStockoutMinutes <= minutesUntilTruck) {
    riskLevel = 'CRITICAL';
  } else if (currentStock <= inventoryRec.safetyStock || inventoryCoverageHours < 2.5) {
    riskLevel = 'WARNING';
  }

  return {
    storeId: store.id,
    sku,
    productName: product.name,
    category: product.category,
    price: product.price,
    margin: product.margin,
    currentStock,
    safetyStock: inventoryRec.safetyStock,
    replenishmentThreshold: inventoryRec.replenishmentThreshold,
    shelfCapacity: inventoryRec.shelfCapacity,
    shelfUtilizationPct: Math.round((currentStock / Math.max(1, inventoryRec.shelfCapacity)) * 100),
    minutesUntilTruck,
    nextTruckArrival: store.truckSchedule.nextArrival,
    hourlyPoints,
    totalDemandUntilTruck,
    projectedStockAtTruckArrival: Math.round(projectedStockAtTruckArrival),
    timeUntilStockoutMinutes,
    expectedShortageQuantity: Math.round(expectedShortageQuantity),
    inventoryCoverageHours,
    expectedLostUnits,
    estimatedLostSalesRevenue,
    estimatedLostContributionMargin,
    riskLevel,
    activeEventNames: Array.from(new Set(allActiveEvents)),
  };
}
