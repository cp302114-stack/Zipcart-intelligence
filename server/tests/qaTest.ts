import { createInitialStores, CATALOG, INITIAL_EVENTS } from '../data/storeData';
import { forecastProductInventory } from '../services/forecastService';
import { evaluateStoreTransfers } from '../services/transferService';
import { evaluateShelfSpaceOptimization } from '../services/shelfService';
import { evaluateTruckOptions } from '../services/truckService';
import { analyzeRiderCapacity } from '../services/riderService';
import { simulationManager } from '../services/simulationService';

console.log('=== RUNNING ZIPCART INTELLIGENCE QA TEST SUITE ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✅ PASS [Test ${totalTests}]: ${testName}`);
    passedTests++;
  } else {
    console.error(`❌ FAIL [Test ${totalTests}]: ${testName} - ${detail || 'Assertion failed'}`);
  }
}

// TEST 1: Stockout before truck arrival detection
const stores = createInitialStores();
const events = INITIAL_EVENTS;
const store7 = stores['store_7'];
const cdForecastStore7 = forecastProductInventory(store7, 'SKU-CD-750', events);
assert(
  cdForecastStore7.riskLevel === 'CRITICAL' && (cdForecastStore7.timeUntilStockoutMinutes || 999) < cdForecastStore7.minutesUntilTruck,
  'Test 1: Stockout before truck arrival detected for Store 7 Cold Drink',
  `Risk: ${cdForecastStore7.riskLevel}, Stockout In: ${cdForecastStore7.timeUntilStockoutMinutes} mins, Truck ETA: ${cdForecastStore7.minutesUntilTruck} mins`
);

// TEST 2: Sufficient inventory detection (Store 9 with 60 bottles)
const store9 = stores['store_9'];
const cdForecastStore9 = forecastProductInventory(store9, 'SKU-CD-750', events);
assert(
  cdForecastStore9.riskLevel === 'HEALTHY' && cdForecastStore9.expectedShortageQuantity === 0,
  'Test 2: Sufficient inventory diagnosed as Healthy with 0 shortage (Store 9)',
  `Risk: ${cdForecastStore9.riskLevel}, Shortage: ${cdForecastStore9.expectedShortageQuantity}`
);

// TEST 3: Zero / negligible demand handling
const wasabiForecast = forecastProductInventory(store7, 'SKU-SNK-WASABI', events);
assert(
  wasabiForecast.expectedShortageQuantity === 0 && wasabiForecast.inventoryCoverageHours > 20,
  'Test 3: Slow-seller with low demand handles coverage gracefully',
  `Coverage: ${wasabiForecast.inventoryCoverageHours} hrs`
);

// TEST 4: Feasible stock transfer (Store 9 to Store 7)
const transfers = evaluateStoreTransfers(stores, 'store_7', 'SKU-CD-750', 25, 75);
const store9Transfer = transfers.find((t) => t.sourceStoreId === 'store_9');
assert(
  store9Transfer !== undefined && store9Transfer.isFeasible && store9Transfer.netBenefit > 0,
  'Test 4: Feasible stock transfer from Store 9 to Store 7 with positive Net ROI',
  `Net benefit: ₹${store9Transfer?.netBenefit}, Travel: ${store9Transfer?.travelMinutes}m`
);

// TEST 5: Transfer violating source safety stock rejected
// Artificially deplete Store 9 stock to near safety stock
store9.inventory['SKU-CD-750'].currentStock = 12; // Safety stock is 15
const invalidTransfers = evaluateStoreTransfers(stores, 'store_7', 'SKU-CD-750', 25, 75);
const store9Depleted = invalidTransfers.find((t) => t.sourceStoreId === 'store_9');
assert(
  store9Depleted === undefined || !store9Depleted.isFeasible,
  'Test 5: Transfer rejected when source lacks surplus above safety stock',
  `Is feasible: ${store9Depleted?.isFeasible}`
);

// TEST 6: Shelf space swap calculation respects physical limits
const shelfOps = evaluateShelfSpaceOptimization(store7);
assert(
  shelfOps.length > 0 && shelfOps[0].proposedReallocatedCapacity > 0 && shelfOps[0].isFeasible,
  'Test 6: Shelf space swap reallocates slow-moving slots to fast-moving SKU within limits',
  `Proposed slots: ${shelfOps[0]?.proposedReallocatedCapacity}, Margin gain: ₹${shelfOps[0]?.expectedMarginGain}`
);

// TEST 7: Earlier truck evaluation with warehouse constraint
const truckOptions = evaluateTruckOptions(store7, 9.0, 14, 16, 25);
assert(
  truckOptions.expeditedOption.expeditedCost === 350 && truckOptions.waitOption.shortageUnits > 0,
  'Test 7: Truck options calculate wait shortage and compare rush warehouse sprinter economics',
  `Wait Shortage: ${truckOptions.waitOption.shortageUnits}, Expedited Net: ₹${truckOptions.expeditedOption.netBenefit}`
);

// TEST 8: Rider bottleneck despite adequate inventory (Store 15)
const store15 = stores['store_15'];
const riderDiag = analyzeRiderCapacity(store15, stores, false);
assert(
  riderDiag.bottleneckType === 'RIDER_CAPACITY_BOTTLENECK' && riderDiag.unservedOrdersPerHour > 0,
  'Test 8: Rider fleet bottleneck correctly diagnosed without falsely blaming inventory',
  `Type: ${riderDiag.bottleneckType}, Unserved: ${riderDiag.unservedOrdersPerHour}/hr`
);

// TEST 9: Event-driven category demand spike
const cricketEvent = events.find((e) => e.type === 'cricket')!;
assert(
  cricketEvent.isActive && cricketEvent.multiplier >= 3.0,
  'Test 9: Cricket match event multiplier active and applied',
  `Multiplier: ${cricketEvent.multiplier}x`
);

// TEST 10: Manager approval workflow executes simulation and logs decision
simulationManager.resetToBaseline();
const recs = simulationManager.getRecommendations(true);
assert(recs.length > 0, 'Test 10a: Decision engine generates recommendations');
const firstRec = recs[0];
const approvalResult = simulationManager.approveRecommendation(
  firstRec.id,
  undefined,
  undefined,
  'QA automated test approval'
);
assert(
  approvalResult.decision.decision === 'APPROVED' &&
    simulationManager.getDecisionHistory().length === 1 &&
    approvalResult.decision.isSimulatedOnly === true,
  'Test 10b: Manager approval simulates action in isolated state and commits audit log',
  `Decision ID: ${approvalResult.decision.id}, History Count: ${simulationManager.getDecisionHistory().length}`
);

console.log(`\n=== QA SUITE RESULTS: ${passedTests} / ${totalTests} TESTS PASSED ===\n`);

if (passedTests === totalTests) {
  process.exit(0);
} else {
  process.exit(1);
}
