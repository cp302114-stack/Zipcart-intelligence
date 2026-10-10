# Zipcart Intelligence — Before the Match Starts

**Quick-Commerce Logistics Command Center & AI Inventory Optimization Engine**

Zipcart operates 30 dark stores in a simulated metropolitan network (Bangalore Metro) carrying ~3,000 products per store. This system answers the operational mandate:

> **"Which stores will run out of what before the next truck, and what should I do right now?"**

---

## 🌟 Key Capabilities

1. **Hourly Demand Forecasting Engine**
   - Dynamic hourly depletion curves from 18:30 (pre-match) through 22:30.
   - Moving average velocity combined with category-specific event sensitivity curves.
   - Computes: Time-to-stockout (minutes), shortage quantities, lost sales revenue, and lost contribution margins.

2. **Event-Driven Demand Shocks**
   - Pre-seeded with India vs Australia T20 fixture (starts 19:30, +3.6x surge on cold drinks, chips, and popcorn).
   - Weather shock modeling (South Bangalore heavy cloudburst delaying roads and spiking comfort beverages/noodles).
   - Interactive events manager with live multiplier sliders and custom event creation.

3. **Store-to-Store Inter-Hub Transfers**
   - Pairwise distance matrix with realistic urban road factors and dispatch handling buffers.
   - Safety stock preservation constraints: $Stock_{source} - Q_{transfer} \ge SafetyStock_{source}$.
   - Arrival feasibility validation: Transfer rejected if travel time exceeds stockout countdown ($T_{travel} \ge T_{stockout}$).
   - Economic optimization: $\text{Net Benefit} = \text{Avoided Margin Loss} - \text{Incremental Transit Cost}$.

4. **Intelligent Shelf Space Allocation & Swap Engine**
   - Identifies slow-selling space hogs (e.g., Artisanal Wasabi Kale Crisps with 0.2 sales/hr) occupying valuable slots.
   - Compares with high-velocity heroes facing slot-capacity starvation (e.g., 750ml Cold Drink).
   - Computes physical compatibility, reallocates capacity, and projects net margin gains.

5. **Rider Capacity Intelligence**
   - Classifies operational bottlenecks:
     - `INVENTORY_SHORTAGE_ONLY`
     - `RIDER_CAPACITY_BOTTLENECK`
     - `COMPOUND_BOTTLENECK`
     - `HEALTHY`
   - Prevents false replenishment orders when orders are lost due to delivery fleet deficits (e.g., Whitefield Store 15 has 98% in-stock items but 4 riders for 96 orders/hr).

6. **Transparent 7-Point AI Decision Engine**
   - Compares 2 to 4 feasible alternatives side-by-side (Wait vs Inter-Store Transfer vs Expedite Truck vs Shelf Swap).
   - 7-point algorithmic reasoning:
     1. What is happening
     2. Why it is happening
     3. What will happen if no action is taken
     4. Which alternatives were considered
     5. Why the preferred action is better
     6. What risks remain
     7. What assumptions affect the result
   - Recommends "Wait" when waiting is optimal (zero cost, low shortage).

7. **Manager Approval Workflow & Isolated Simulation**
   - Detect $\rightarrow$ Compare $\rightarrow$ Inspect $\rightarrow$ Approve or Reject.
   - Real application-level simulation mutating isolated state while keeping baseline metrics intact.
   - Clearly labeled: **SIMULATED — NOT EXECUTED IN REAL OPERATIONS**.
   - Immutable audit trail in Decision History.

8. **What-If Scenario Sandbox**
   - Interactive sliders for starting inventory, demand multiplier, truck ETA, shelf capacity, and rider fleet.
   - Recalculates depletion curves and sensitivity metrics in real time.

---

## 🏏 The Challenge Scenario Presets (1-Click Loaders in UI)

- **Challenge Signature (Store 7 & Store 9)**: Store 7 has 14 bottles of 750ml cold drink, full shelf, 9 bottles/hr match demand. Match at 7:30 PM, next truck at 9 PM (21:00). Store 9 is ~2.2 km away with 60 bottles surplus. Agent recommends and executes a 22-minute inter-store transfer of 25 bottles.
- **Scenario 2 (Rain Shock)**: Heavy cloudburst in South Bangalore spikes instant noodles 3.2x; Koramangala Store 3 stock depletes in 45 minutes.
- **Scenario 3 (Shelf Misallocation)**: Wasabi kale crisps hogging 25 slots reallocated to Party Pack chips.
- **Scenario 4 (Staples Balancing)**: Fresh milk balanced from BTM Layout Store 12 to HSR Layout Store 4.
- **Scenario 5 (Fleet Deficit)**: Whitefield Store 15 order backlog solved via rider reassignment without ordering redundant inventory.

---

## 🛠️ Technology Stack & Execution

- **Frontend**: React 19, Tailwind CSS, Recharts, Lucide Icons
- **Backend**: Node.js, Express REST APIs (`server/routes/api.ts`)
- **Data Layer**: In-memory relational state for 30 dark stores and 3,000 catalog SKUs
- **Testing**: Automated QA test suite (`npm test`)

### Commands:
```bash
# Development server (runs Express on port 3000 with Vite middleware)
npm run dev

# Run automated QA test suite verifying all 10 problem criteria
npm test

# Type checking / Linting
npm run lint

# Production build
npm run build
```
