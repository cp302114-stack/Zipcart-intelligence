export interface Product {
  sku: string;
  name: string;
  category: string;
  unitSize: string;
  price: number;
  unitCost: number;
  margin: number;
  shelfUnitsPerSlot: number;
  eventSensitivities: {
    cricket: number;
    rain: number;
    weekend: number;
    festival: number;
  };
  baseHourlyVelocity: number; // average units/hr
  isCoreFastMover?: boolean;
}

export interface StoreInventoryRecord {
  sku: string;
  currentStock: number;
  shelfSlotId: string;
  shelfCapacity: number;
  safetyStock: number;
  replenishmentThreshold: number;
  lastRestockedAt: string;
}

export interface DarkStore {
  id: string; // e.g., "store_7"
  numericId: number; // 7
  name: string;
  locality: string;
  lat: number;
  lng: number;
  truckSchedule: {
    nextArrival: string; // "21:00"
    estimatedMinutesUntilTruck: number;
    truckCapacity: number;
    allocatedUnits: number;
    warehouseAvailableUnits: number;
    warehouseStockOk: boolean;
  };
  riders: {
    activeCount: number;
    maxOrdersPerHourPerRider: number;
    currentHourlyOrderRate: number;
  };
  shelfCapacityTotal: number;
  shelfCapacityUsed: number;
  inventory: Record<string, StoreInventoryRecord>;
}

export interface OperationalEvent {
  id: string;
  name: string;
  type: 'cricket' | 'rain' | 'festival' | 'local_event';
  startTime: string; // "19:30"
  durationHours: number;
  affectedStoreIds: string[]; // empty means all stores
  affectedCategories: string[];
  multiplier: number;
  description: string;
  isActive: boolean;
}

export interface CityDistance {
  fromStoreId: string;
  toStoreId: string;
  distanceKm: number;
  travelMinutes: number;
}

// 12 Key Signature Products explicitly modelled
export const SIGNATURE_PRODUCTS: Product[] = [
  {
    sku: 'SKU-CD-750',
    name: 'Thums Up Charged 750ml Bottle',
    category: 'Cold Beverages',
    unitSize: '750ml',
    price: 45,
    unitCost: 29,
    margin: 16,
    shelfUnitsPerSlot: 14,
    eventSensitivities: { cricket: 3.6, rain: 0.9, weekend: 1.8, festival: 2.1 },
    baseHourlyVelocity: 2.5,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-CD-750-COKE',
    name: 'Coca-Cola Zero Sugar 750ml',
    category: 'Cold Beverages',
    unitSize: '750ml',
    price: 45,
    unitCost: 28,
    margin: 17,
    shelfUnitsPerSlot: 14,
    eventSensitivities: { cricket: 3.2, rain: 0.9, weekend: 1.7, festival: 1.9 },
    baseHourlyVelocity: 2.2,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-SNK-WASABI',
    name: 'Artisanal Wasabi Kale Crisps 80g',
    category: 'Snacks & Munchies',
    unitSize: '80g',
    price: 180,
    unitCost: 145,
    margin: 35,
    shelfUnitsPerSlot: 20,
    eventSensitivities: { cricket: 0.9, rain: 0.7, weekend: 1.1, festival: 1.0 },
    baseHourlyVelocity: 0.2, // slow mover occupying shelf
    isCoreFastMover: false,
  },
  {
    sku: 'SKU-SNK-LAYS',
    name: "Lay's India's Magic Masala 115g Party Pack",
    category: 'Snacks & Munchies',
    unitSize: '115g',
    price: 50,
    unitCost: 35,
    margin: 15,
    shelfUnitsPerSlot: 24,
    eventSensitivities: { cricket: 3.8, rain: 2.2, weekend: 2.0, festival: 2.4 },
    baseHourlyVelocity: 3.2,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-SNK-POPCORN',
    name: 'ACT II Butter Lovers Microwave Popcorn 85g',
    category: 'Snacks & Munchies',
    unitSize: '85g',
    price: 40,
    unitCost: 26,
    margin: 14,
    shelfUnitsPerSlot: 30,
    eventSensitivities: { cricket: 4.5, rain: 1.8, weekend: 2.2, festival: 2.0 },
    baseHourlyVelocity: 2.1,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-DRY-MILK',
    name: 'Amul Taaza Homogenised Toned Milk 1L',
    category: 'Dairy & Bread',
    unitSize: '1L',
    price: 56,
    unitCost: 48,
    margin: 8,
    shelfUnitsPerSlot: 35,
    eventSensitivities: { cricket: 1.0, rain: 1.6, weekend: 1.4, festival: 1.9 },
    baseHourlyVelocity: 4.0,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-DRY-BREAD',
    name: 'The Health Factory Zero Maida Bread 400g',
    category: 'Dairy & Bread',
    unitSize: '400g',
    price: 65,
    unitCost: 48,
    margin: 17,
    shelfUnitsPerSlot: 20,
    eventSensitivities: { cricket: 1.1, rain: 1.5, weekend: 1.5, festival: 1.3 },
    baseHourlyVelocity: 2.4,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-INST-MAGGI',
    name: 'Maggi 2-Minute Masala Noodles 280g (4-Pack)',
    category: 'Instant Food & Noodles',
    unitSize: '280g',
    price: 58,
    unitCost: 45,
    margin: 13,
    shelfUnitsPerSlot: 25,
    eventSensitivities: { cricket: 2.8, rain: 3.2, weekend: 1.8, festival: 1.5 },
    baseHourlyVelocity: 3.0,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-INST-CHAI',
    name: 'Wagh Bakri Premium CTC Spiced Tea 500g',
    category: 'Instant Food & Noodles',
    unitSize: '500g',
    price: 290,
    unitCost: 235,
    margin: 55,
    shelfUnitsPerSlot: 15,
    eventSensitivities: { cricket: 1.2, rain: 2.8, weekend: 1.4, festival: 1.6 },
    baseHourlyVelocity: 1.2,
    isCoreFastMover: false,
  },
  {
    sku: 'SKU-BEV-RED-BULL',
    name: 'Red Bull Energy Drink 250ml Can',
    category: 'Cold Beverages',
    unitSize: '250ml',
    price: 125,
    unitCost: 95,
    margin: 30,
    shelfUnitsPerSlot: 24,
    eventSensitivities: { cricket: 2.6, rain: 1.1, weekend: 2.1, festival: 1.8 },
    baseHourlyVelocity: 1.8,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-FRSH-BANANA',
    name: 'Robusta Fresh Bananas 1kg',
    category: 'Fresh Produce',
    unitSize: '1kg',
    price: 48,
    unitCost: 34,
    margin: 14,
    shelfUnitsPerSlot: 20,
    eventSensitivities: { cricket: 0.9, rain: 1.2, weekend: 1.4, festival: 1.3 },
    baseHourlyVelocity: 2.5,
    isCoreFastMover: true,
  },
  {
    sku: 'SKU-SNK-GOURMET-DIP',
    name: 'Truffle Edamame Dip Gourmet Jar 180g',
    category: 'Snacks & Munchies',
    unitSize: '180g',
    price: 320,
    unitCost: 250,
    margin: 70,
    shelfUnitsPerSlot: 18,
    eventSensitivities: { cricket: 0.8, rain: 0.9, weekend: 1.2, festival: 1.1 },
    baseHourlyVelocity: 0.15, // Slow seller
    isCoreFastMover: false,
  }
];

// Generate reproducible ~3,000 products catalog
export function generateCatalog(): Product[] {
  const catalog: Product[] = [...SIGNATURE_PRODUCTS];
  const categories = [
    { name: 'Cold Beverages', multiplier: { cricket: 3.0, rain: 0.9, weekend: 1.8, festival: 2.0 }, avgPrice: 55, avgMarginPct: 0.32 },
    { name: 'Snacks & Munchies', multiplier: { cricket: 3.4, rain: 2.0, weekend: 2.1, festival: 2.3 }, avgPrice: 65, avgMarginPct: 0.30 },
    { name: 'Dairy & Bread', multiplier: { cricket: 1.0, rain: 1.5, weekend: 1.4, festival: 1.8 }, avgPrice: 58, avgMarginPct: 0.18 },
    { name: 'Fresh Produce', multiplier: { cricket: 0.9, rain: 1.2, weekend: 1.5, festival: 1.4 }, avgPrice: 45, avgMarginPct: 0.28 },
    { name: 'Instant Food & Noodles', multiplier: { cricket: 2.4, rain: 2.9, weekend: 1.7, festival: 1.6 }, avgPrice: 85, avgMarginPct: 0.25 },
    { name: 'Chocolates & Desserts', multiplier: { cricket: 2.7, rain: 1.4, weekend: 2.2, festival: 3.1 }, avgPrice: 110, avgMarginPct: 0.35 },
    { name: 'Personal Care & Hygiene', multiplier: { cricket: 0.8, rain: 0.9, weekend: 1.3, festival: 1.5 }, avgPrice: 180, avgMarginPct: 0.38 },
    { name: 'Household & Cleaning', multiplier: { cricket: 0.7, rain: 1.1, weekend: 1.3, festival: 1.7 }, avgPrice: 160, avgMarginPct: 0.30 }
  ];

  const brandPrefixes = ['FarmFresh', 'UrbanBite', 'PureDairy', 'ChillZone', 'DailyChoice', 'RoyalGrub', 'SpiceRoute', 'EverGreen', 'ProChef', 'NectarBlend'];
  const itemTypes = ['Pack', 'Pouch', 'Bottle', 'Carton', 'Jar', 'Tub', 'Box', 'Multipack'];

  // Seed 2,988 additional items to reach exactly 3,000 SKUs
  for (let i = 13; i <= 3000; i++) {
    const cat = categories[i % categories.length];
    const brand = brandPrefixes[(i * 7) % brandPrefixes.length];
    const itemType = itemTypes[(i * 3) % itemTypes.length];
    const price = Math.round(cat.avgPrice * (0.6 + ((i * 13) % 100) / 100 * 1.2));
    const margin = Math.round(price * (cat.avgMarginPct * (0.8 + ((i * 17) % 50) / 100 * 0.4)));
    const unitCost = price - margin;
    const baseHourlyVelocity = Number((0.1 + ((i * 11) % 40) / 10).toFixed(2));

    catalog.push({
      sku: `SKU-${cat.name.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`,
      name: `${brand} ${cat.name} Select ${itemType} #${i}`,
      category: cat.name,
      unitSize: `${200 + ((i * 50) % 800)}g`,
      price,
      unitCost,
      margin,
      shelfUnitsPerSlot: 15 + (i % 20),
      eventSensitivities: {
        cricket: Number((cat.multiplier.cricket * (0.85 + ((i % 30) / 100))).toFixed(2)),
        rain: Number((cat.multiplier.rain * (0.85 + (((i * 2) % 30) / 100))).toFixed(2)),
        weekend: Number((cat.multiplier.weekend * (0.9 + (((i * 3) % 20) / 100))).toFixed(2)),
        festival: Number((cat.multiplier.festival * (0.9 + (((i * 4) % 25) / 100))).toFixed(2)),
      },
      baseHourlyVelocity,
      isCoreFastMover: baseHourlyVelocity > 2.0
    });
  }

  return catalog;
}

export const CATALOG: Product[] = generateCatalog();

// 30 Dark Stores in Simulated Bangalore Metro
export const DARK_STORES_META: Array<{ id: string; numericId: number; name: string; locality: string; lat: number; lng: number }> = [
  { id: 'store_1', numericId: 1, name: 'Store 1 — Indiranagar 100ft', locality: 'Indiranagar', lat: 12.9784, lng: 77.6408 },
  { id: 'store_2', numericId: 2, name: 'Store 2 — Koramangala 4th Block', locality: 'Koramangala', lat: 12.9352, lng: 77.6245 },
  { id: 'store_3', numericId: 3, name: 'Store 3 — Koramangala 6th Block', locality: 'Koramangala', lat: 12.9378, lng: 77.6189 },
  { id: 'store_4', numericId: 4, name: 'Store 4 — HSR Layout Sector 1', locality: 'HSR Layout', lat: 12.9116, lng: 77.6446 },
  { id: 'store_5', numericId: 5, name: 'Store 5 — HSR Layout Sector 4', locality: 'HSR Layout', lat: 12.9165, lng: 77.6380 },
  { id: 'store_6', numericId: 6, name: 'Store 6 — Bellandur Ecospace', locality: 'Bellandur', lat: 12.9260, lng: 77.6762 },
  { id: 'store_7', numericId: 7, name: 'Store 7 — Jayanagar 4th Block', locality: 'Jayanagar', lat: 12.9299, lng: 77.5824 },
  { id: 'store_8', numericId: 8, name: 'Store 8 — Jayanagar 9th Block', locality: 'Jayanagar', lat: 12.9180, lng: 77.5920 },
  { id: 'store_9', numericId: 9, name: 'Store 9 — JP Nagar Phase 4', locality: 'JP Nagar', lat: 12.9063, lng: 77.5950 },
  { id: 'store_10', numericId: 10, name: 'Store 10 — JP Nagar Phase 7', locality: 'JP Nagar', lat: 12.8920, lng: 77.5780 },
  { id: 'store_11', numericId: 11, name: 'Store 11 — BTM Layout 2nd Stage', locality: 'BTM Layout', lat: 12.9166, lng: 77.6101 },
  { id: 'store_12', numericId: 12, name: 'Store 12 — BTM Layout 1st Stage', locality: 'BTM Layout', lat: 12.9230, lng: 77.6080 },
  { id: 'store_13', numericId: 13, name: 'Store 13 — Marathahalli Bridge', locality: 'Marathahalli', lat: 12.9591, lng: 77.6974 },
  { id: 'store_14', numericId: 14, name: 'Store 14 — Whitefield ITPL Hub', locality: 'Whitefield', lat: 12.9856, lng: 77.7315 },
  { id: 'store_15', numericId: 15, name: 'Store 15 — Whitefield Hope Farm', locality: 'Whitefield', lat: 12.9790, lng: 77.7490 },
  { id: 'store_16', numericId: 16, name: 'Store 16 — Electronic City Phase 1', locality: 'Electronic City', lat: 12.8452, lng: 77.6602 },
  { id: 'store_17', numericId: 17, name: 'Store 17 — Electronic City Phase 2', locality: 'Electronic City', lat: 12.8390, lng: 77.6780 },
  { id: 'store_18', numericId: 18, name: 'Store 18 — Malleshwaram 8th Cross', locality: 'Malleshwaram', lat: 13.0031, lng: 77.5701 },
  { id: 'store_19', numericId: 19, name: 'Store 19 — Rajajinagar 1st Block', locality: 'Rajajinagar', lat: 12.9914, lng: 77.5529 },
  { id: 'store_20', numericId: 20, name: 'Store 20 — Frazer Town Mosque Road', locality: 'Frazer Town', lat: 12.9982, lng: 77.6158 },
  { id: 'store_21', numericId: 21, name: 'Store 21 — Hebbal Esteem Mall', locality: 'Hebbal', lat: 13.0358, lng: 77.5970 },
  { id: 'store_22', numericId: 22, name: 'Store 22 — Yelahanka New Town', locality: 'Yelahanka', lat: 13.1007, lng: 77.5963 },
  { id: 'store_23', numericId: 23, name: 'Store 23 — Bannerghatta Hulimavu', locality: 'Bannerghatta Rd', lat: 12.8800, lng: 77.5980 },
  { id: 'store_24', numericId: 24, name: 'Store 24 — Sarjapur Wipro Gate', locality: 'Sarjapur Rd', lat: 12.9120, lng: 77.6850 },
  { id: 'store_25', numericId: 25, name: 'Store 25 — Richmond Town Langford', locality: 'Richmond Town', lat: 12.9610, lng: 77.6010 },
  { id: 'store_26', numericId: 26, name: 'Store 26 — Domlur Inner Ring Rd', locality: 'Domlur', lat: 12.9609, lng: 77.6387 },
  { id: 'store_27', numericId: 27, name: 'Store 27 — Ulsoor Lake View', locality: 'Ulsoor', lat: 12.9818, lng: 77.6227 },
  { id: 'store_28', numericId: 28, name: 'Store 28 — Kalyan Nagar HRBR', locality: 'Kalyan Nagar', lat: 13.0232, lng: 77.6434 },
  { id: 'store_29', numericId: 29, name: 'Store 29 — Banashankari BDA Complex', locality: 'Banashankari', lat: 12.9250, lng: 77.5650 },
  { id: 'store_30', numericId: 30, name: 'Store 30 — Basavanagudi Gandhi Bazaar', locality: 'Basavanagudi', lat: 12.9420, lng: 77.5730 }
];

// Distance computation using Haversine with real road factor 1.35x
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const aerialKm = R * c;
  // Apply urban road factor of 1.35
  return Number((aerialKm * 1.35).toFixed(1));
}

// Estimate intra-city delivery/transit travel time
export function estimateTravelMinutes(distanceKm: number): number {
  // Speed in Bangalore traffic ~18 km/h + 5 min dispatch/handling buffer
  const travelMins = Math.round((distanceKm / 18) * 60 + 5);
  return Math.max(8, travelMins);
}

// Generate the initial 30 Dark Stores state
export function createInitialStores(): Record<string, DarkStore> {
  const stores: Record<string, DarkStore> = {};

  DARK_STORES_META.forEach((meta) => {
    const isStore7 = meta.numericId === 7;
    const isStore9 = meta.numericId === 9;
    const isStore3 = meta.numericId === 3;
    const isStore1 = meta.numericId === 1;
    const isStore15 = meta.numericId === 15;

    // Build inventory map for this store
    const inventory: Record<string, StoreInventoryRecord> = {};

    SIGNATURE_PRODUCTS.forEach((prod) => {
      let currentStock = Math.round(15 + ((meta.numericId * 7 + prod.name.length) % 35));
      const shelfCapacity = prod.shelfUnitsPerSlot;
      let safetyStock = Math.round(prod.baseHourlyVelocity * 2.5);
      const replenishmentThreshold = Math.round(prod.baseHourlyVelocity * 4);

      // Specific challenge scenario calibrations:
      if (isStore7 && prod.sku === 'SKU-CD-750') {
        // Store 7 challenge specification: Exactly 14 bottles, shelf full, high match night demand
        currentStock = 14;
        safetyStock = 10;
      } else if (isStore7 && prod.sku === 'SKU-SNK-WASABI') {
        // Adjacent slow-moving snack occupying 20 slots
        currentStock = 18;
      } else if (isStore9 && prod.sku === 'SKU-CD-750') {
        // Store 9 challenge specification: Exactly 60 bottles, surplus available
        currentStock = 60;
        safetyStock = 15;
      } else if (isStore3 && prod.sku === 'SKU-INST-MAGGI') {
        // Store 3 scenario: Rain spike, inventory dangerously low
        currentStock = 8;
      } else if (isStore1 && prod.sku === 'SKU-SNK-GOURMET-DIP') {
        // Store 1 scenario: Shelf hogging
        currentStock = 18;
      }

      inventory[prod.sku] = {
        sku: prod.sku,
        currentStock,
        shelfSlotId: `SLOT-${meta.numericId}-${prod.sku.replace('SKU-', '')}`,
        shelfCapacity,
        safetyStock,
        replenishmentThreshold,
        lastRestockedAt: '2026-10-10T14:00:00Z',
      };
    });

    // Populate remaining simulated catalog items for inventory calculations
    // Each store carries ~3,000 products
    for (let i = 13; i <= 3000; i++) {
      const sku = `SKU-${CATALOG[i - 1].category.substring(0, 3).toUpperCase()}-${String(i).padStart(4, '0')}`;
      const prod = CATALOG[i - 1];
      const currentStock = Math.round(5 + ((meta.numericId * 3 + i) % 40));
      inventory[sku] = {
        sku,
        currentStock,
        shelfSlotId: `SLOT-${meta.numericId}-${i}`,
        shelfCapacity: prod.shelfUnitsPerSlot,
        safetyStock: Math.max(3, Math.round(prod.baseHourlyVelocity * 2)),
        replenishmentThreshold: Math.max(6, Math.round(prod.baseHourlyVelocity * 3.5)),
        lastRestockedAt: '2026-10-10T12:00:00Z',
      };
    }

    // Next truck arrival
    let nextArrival = '21:00';
    let estimatedMinutesUntilTruck = 90; // Default 1.5 hrs from current 19:30
    if (meta.numericId % 3 === 0) {
      nextArrival = '22:30';
      estimatedMinutesUntilTruck = 180;
    } else if (meta.numericId % 3 === 1) {
      nextArrival = '20:15';
      estimatedMinutesUntilTruck = 45;
    }

    if (isStore7) {
      nextArrival = '21:00';
      estimatedMinutesUntilTruck = 150; // 18:30 to 21:00 = 150 mins
    }

    // Riders
    let activeRiders = 8 + (meta.numericId % 4);
    let currentHourlyOrderRate = 22 + (meta.numericId % 8);

    if (isStore15) {
      // Store 15: Rider bottleneck scenario
      // 4 active riders for 92 orders/hr! Delivery capacity max = 4 * 2.8 = 11.2 orders/hr -> Severe lost orders!
      activeRiders = 4;
      currentHourlyOrderRate = 92;
    }

    stores[meta.id] = {
      id: meta.id,
      numericId: meta.numericId,
      name: meta.name,
      locality: meta.locality,
      lat: meta.lat,
      lng: meta.lng,
      truckSchedule: {
        nextArrival,
        estimatedMinutesUntilTruck,
        truckCapacity: 1500,
        allocatedUnits: 650,
        warehouseAvailableUnits: isStore7 ? 400 : 800,
        warehouseStockOk: true,
      },
      riders: {
        activeCount: activeRiders,
        maxOrdersPerHourPerRider: 2.8,
        currentHourlyOrderRate,
      },
      shelfCapacityTotal: 5000,
      shelfCapacityUsed: 4420,
      inventory,
    };
  });

  return stores;
}

// Operational events pre-seeded with India vs Australia T20 Cricket Match
export const INITIAL_EVENTS: OperationalEvent[] = [
  {
    id: 'evt-cricket-1',
    name: 'India vs Australia T20 Semi-Final',
    type: 'cricket',
    startTime: '19:30',
    durationHours: 3.5,
    affectedStoreIds: [], // affects city-wide
    affectedCategories: ['Cold Beverages', 'Snacks & Munchies', 'Instant Food & Noodles', 'Chocolates & Desserts'],
    multiplier: 3.6,
    description: 'High-stakes cricket fixture starting at 19:30. Severe demand surge for cold drinks, chips, and popcorn.',
    isActive: true,
  },
  {
    id: 'evt-rain-1',
    name: 'Heavy Monsoon Cloudburst (South Bangalore)',
    type: 'rain',
    startTime: '18:45',
    durationHours: 2.0,
    affectedStoreIds: ['store_2', 'store_3', 'store_4', 'store_5', 'store_6', 'store_11'],
    affectedCategories: ['Instant Food & Noodles', 'Dairy & Bread'],
    multiplier: 2.6,
    description: 'Waterlogged roads delaying riders and driving sudden cravings for hot tea, noodles, and comfort snacks.',
    isActive: true,
  },
  {
    id: 'evt-fest-1',
    name: 'Festival Eve Flash Shopping',
    type: 'festival',
    startTime: '20:00',
    durationHours: 4.0,
    affectedStoreIds: [],
    affectedCategories: ['Dairy & Bread', 'Fresh Produce', 'Chocolates & Desserts'],
    multiplier: 1.8,
    description: 'Pre-festive evening rush for fresh milk, sweets, and celebration platters.',
    isActive: false,
  }
];

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
  isSimulatedOnly: true; // SIMULATED — NOT EXECUTED IN REAL OPERATIONS
}
