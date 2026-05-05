# Compensation Package Evaluation Tool — Project Specification

## Overview

A browser-based tool for US employees evaluating compensation offers. Given one or more compensation packages (cash, equity, bonuses), the tool calculates after-tax take-home value, total employer cost, year-by-year cash flows under multiple growth scenarios, and NPV summaries that define the value range for both parties.

Primary user: **Employee evaluating a job offer or equity grant.**
Primary company type: **Private startup**, with full support for public companies.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Frontend framework | React 18 |
| Styling | Tailwind CSS |
| UI components | shadcn/ui |
| Server | `Bun.serve()` with HTML imports |
| Database | `bun:sqlite` (local persistence) |
| Build | Bun bundler (no Vite/Webpack) |

Entry point: `index.ts` → `Bun.serve()` → serves `index.html` → imports `frontend.tsx`.

---

## Feature List

### F1 — Package Builder
- Create and name multiple compensation packages (e.g., "Offer A — Base", "Counter-offer B — Upside")
- Each package has independent inputs for all comp components
- Packages are stored in SQLite and survive page refresh

### F2 — Compensation Components
Each package may include any combination of:
- **Cash Salary** — annual base salary
- **Cash Bonus** — annual bonus (target %; paid annually or on a schedule)
- **Restricted Stock / RSUs** — grant size (shares or dollar value), vesting schedule, 83(b) election flag (RS only)
- **ISOs** — grant size, strike price, exercise schedule, holding period tracking
- **NQOs** — grant size, strike price, exercise schedule

### F3 — Tax Input Panel
Tax rates are pre-populated with known US federal values where applicable; all fields are editable.

| Input | Variable name | Default | Notes |
|---|---|---|---|
| Federal ordinary income tax rate | `federalOrdinaryRate` | — | Marginal rate on wages and ordinary income |
| Federal long-term capital gains rate | `federalLTCGRate` | — | 0%, 15%, or 20% |
| AMT rate | `amtRate` | 26% | 26% or 28%, or user-entered blended effective rate |
| FICA rate | `ficaRate` | 7.65% | Per-side rate (employee and employer each pay this separately); engine blends against SS wage base — see F6 FICA section for full blending logic |
| Additional Medicare tax rate | `additionalMedicareRate` | 0.9% | Employee-only; applies to wages above $200k (single) / $250k (MFJ); engine applies per-year against cumulative wage total |
| State ordinary income rate | `stateOrdinaryRate` | — | Flat rate for state ordinary income tax |
| State LTCG rate | `stateLTCGRate` | — | Flat rate for state capital gains tax |
| NIIT rate | `niitRate` | 3.8% | Applied when `niitAlwaysOn` is true; otherwise excluded from all calculations |
| Corporate tax rate | `corporateRate` | — | Used for employer-side deduction calculations |
| Employee discount rate | `employeeDiscountRate` | — | Employee's required rate of return for NPV/PV calculations |
| Employer discount rate | `employerDiscountRate` | — | Employer's cost of capital / hurdle rate for NPV/PV calculations |
| SS wage base | `ssWageBase` | $168,600 | 2024 value; user editable |

**Derived rate used in formulas:**

```
effectiveLTCGRate = federalLTCGRate + stateLTCGRate + niitRate
```

NIIT is conditionally included based on the `niitAlwaysOn` toggle only (MAGI threshold gating is out of scope for v1). When `niitAlwaysOn = false`, use `niitRate = 0` in all calculations.

### F4 — Growth Scenario Engine
For each package, user defines up to three scenarios:

| Scenario | Annual stock price growth rate |
|---|---|
| Downside | e.g., 0% or negative |
| Base | e.g., 10% |
| Upside | e.g., 30% |

Stock price at year `yearIndex` = `baseStockPrice × (1 + annualGrowthRate)^yearIndex`.
Salary and bonus can have independent annual growth rates per scenario.

### F5 — Vesting Schedule Engine
Supports:
- **Cliff + linear monthly/annual vesting** (e.g., 1-year cliff, then monthly over 3 years)
- ISO expiration tracking (10-year from grant)
- Output: table of vest events × scenario showing shares vested, FMV, and tax consequence

### F6 — After-Tax Employee Value Calculator
For each year and scenario, computes employee's after-tax proceeds from each component.

**Notation:**
- `fmvAtVest` — fair market value per share at vesting date
- `fmvAtGrant` — fair market value per share at grant date
- `fmvAtExercise` — fair market value per share at exercise date
- `strikePrice` — option exercise price per share
- `priceAtSale` — sale price per share

| Component | Tax treatment applied |
|---|---|
| Cash salary | `salary × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` |
| Cash bonus | `bonus × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` |
| RS at vest (no 83b) | `fmvAtVest × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` |
| RS at sale (no 83b) | `(priceAtSale - fmvAtVest) × (1 - effectiveLTCGRate)` |
| RS with 83(b) at grant | `fmvAtGrant × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` upfront; `(priceAtSale - fmvAtGrant) × (1 - effectiveLTCGRate)` at sale |
| RSU at vest | `fmvAtVest × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` |
| RSU at sale | `(priceAtSale - fmvAtVest) × (1 - effectiveLTCGRate)` |
| ISO at exercise | No regular income tax. AMT preference item = `(fmvAtExercise - strikePrice) × sharesExercised`. Actual AMT owed = `max(0, AMTI × amtRate − regularTaxForYear)`. See ISO AMT detail below. |
| ISO at sale (qualified) | `(priceAtSale - strikePrice) × sharesDisposed × (1 - effectiveLTCGRate)` |
| ISO at sale (disqualifying) | Ordinary income on spread: `(fmvAtExercise - strikePrice) × sharesDisposed × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)`. Gain above FMV at exercise: taxed as LTCG if held >1 year from exercise date, otherwise at ordinary rates. FICA applies to the ordinary income component (same treatment as NQO exercise). |
| NQO at exercise | `(fmvAtExercise - strikePrice) × sharesExercised × (1 - federalOrdinaryRate - stateOrdinaryRate - ficaRate)` |
| NQO at sale | `(priceAtSale - fmvAtExercise) × sharesDisposed × (1 - effectiveLTCGRate)` |

**ISO AMT detail**: AMTI (Alternative Minimum Taxable Income) = regular taxable income for the year plus ISO preference items. At exercise, compute the employee's regular income tax for that year (on all income). Compute AMTI by adding the ISO bargain element `(fmvAtExercise - strikePrice) × sharesExercised` as a preference item. Tentative minimum tax (TMT) = `AMTI × amtRate`. If `TMT > regularTaxForYear`, the AMT owed = `TMT - regularTaxForYear`. This excess generates an AMT credit carryforward that reduces regular tax in future years when regular tax exceeds TMT.

**ISO qualified sale — AMT limitation**: The formula `(priceAtSale - strikePrice) × sharesDisposed × (1 - effectiveLTCGRate)` reflects only the capital gains tax at sale. It does **not** net out AMT paid at exercise, nor does it credit back any AMT credit recovered at sale. The true after-tax value equals the formula above minus AMT paid at exercise plus AMT credit recovered in the sale year (where recovery = `max(0, regularTaxForSaleYear - TMT_saleYear)` up to the credit balance). AMT credit carryforward tracking across years is deferred to v1.1; in v1 the engine computes per-year AMT owed but treats it as a sunk cost not reflected in the sale-year formula.

**NIIT**: See F3 for toggle behavior (`niitAlwaysOn`). Capital losses always use `niitRate = 0` regardless of the toggle — NIIT does not apply to losses (see Capital losses below).

**FICA**: Applies to wages and ordinary income components (salary, bonus, RS vest, RSU vest, NQO exercise). FICA does NOT apply to LTCG, qualified ISO disposition proceeds, or ISO exercises. For **disqualifying ISO dispositions**, FICA applies to the ordinary income component (the spread at exercise).

The engine computes two separate per-year effective rates for the employee side:
1. **`ficaBlended`**: blends `ficaRate` (7.65%) on wages up to `ssWageBase` and 1.45% on wages above `ssWageBase`.
2. **`additionalMedicareApplied`**: applies `additionalMedicareRate` (0.9%) only to the portion of cumulative wages exceeding $200k (single) / $250k (MFJ). This is an employee-only tax.

In the formulas above, `ficaRate` is a shorthand placeholder for `ficaBlended + additionalMedicareApplied` as computed by the engine for that year. The two components are computed and summed separately before being substituted into each formula. `additionalMedicareRate` is **never** added to the employer-side FICA rate.

**Capital losses**: When `priceAtSale < basis` (e.g. `priceAtSale < fmvAtVest` for an RSU), the capital gain is negative. For capital losses, set `niitRate = 0` in `effectiveLTCGRate` — NIIT does not apply to capital losses. The tax benefit on a loss is `|loss| × (federalLTCGRate + stateLTCGRate)` only.

**Double-trigger RSU FMV**: For RSUs with `vestingType: "double_trigger"`, `fmvAtVest` in the formulas refers to the FMV at the **liquidity event date** (the settlement/delivery date), not the service-vesting date. The engine resolves this using `liquidityEventYear` to determine the correct stock price from the growth scenario. If the employee departs before `liquidityEventYear`, all unvested double-trigger RSUs expire with zero value; the engine records `employeeAfterTaxCash = 0` and `employerNetCost = 0` for those shares.

**ISO $100k annual limit**: At grant, if `sharesGranted × strikePrice > $100,000`, the excess shares are treated as NQOs at calculation time. The data model stores the grant as a single `ISO` component unchanged; the engine silently splits shares into ISO-qualified and NQO-treated buckets when computing tax consequences. The UI shows a warning banner with the breakdown (e.g., "8,000 shares qualify as ISO; 2,000 treated as NQO"). The split is recomputed automatically if the user changes share count or strike price.

> **Simplification note**: The actual IRC §422(d) limit applies to the FMV of shares *first becoming exercisable* in any calendar year, not total grant size. This v1 implementation applies the test at the grant level (total `sharesGranted × strikePrice`), which is a conservative approximation. The per-year vesting test is deferred to v1.1.

### F7 — Total Employer Cost Calculator
For each component per year:

**Notation:**
- `grossSpread` — `(fmvAtExercise - strikePrice) × sharesExercised`

| Component | Employer cost |
|---|---|
| Cash salary | gross = `salary × (1 + ficaRate)`; net after-tax cost = `salary × (1 + ficaRate) × (1 - corporateRate)` |
| Cash bonus | same as salary |
| RS at vest (no 83b) | Employer deducts `fmvAtVest` at vest date; net cost = `fmvAtVest × (1 + ficaRate) × (1 - corporateRate)` |
| RS with 83(b) | Employer deducts `fmvAtGrant` at grant date; net cost = `fmvAtGrant × (1 + ficaRate) × (1 - corporateRate)` |
| RSU at vest | Employer deducts `fmvAtVest` at settlement; net cost = `fmvAtVest × (1 + ficaRate) × (1 - corporateRate)` (FICA applies at vesting per Rev. Rul. 2012-18) |
| ISO — qualifying disposition | **No employer deduction.** Employer cost recorded as gross equity value transferred: `(priceAtSale - strikePrice) × sharesDisposed`. No tax shield applied. Displayed with label "gross equity cost, no deduction." |
| ISO — disqualifying disposition | Employer deducts the ordinary income recognized by the employee = `(fmvAtExercise - strikePrice) × sharesDisposed`; net cost = `spread × (1 + ficaRate) × (1 - corporateRate)` |
| NQO at exercise | Employer deducts `grossSpread`; net cost = `grossSpread × (1 + ficaRate) × (1 - corporateRate)` |

**Employer FICA blending**: Same SS wage base blending logic as the employee side (see F6 FICA section). `additionalMedicareRate` is employee-only and is **not** added to the employer-side rate.

**IRC 162(m) flag**: Toggle for public company covered employees; caps deduction at $1M/year for salary/bonus.

### F8 — Present Value / NPV Summary
For a user-defined time horizon (1–10 years) and separate discount rates for each party:

- **Employee NPV**: `Σ [afterTaxValue_t / (1 + employeeDiscountRate)^t]` for all cash flows
- **Employer NPV cost**: `Σ [netEmployerCost_t / (1 + employerDiscountRate)^t]` for all cash flows
- Displayed per scenario (downside / base / upside)
- Displayed as a summary table and a timeline chart

`employeeDiscountRate` reflects the employee's personal required rate of return (opportunity cost of capital). `employerDiscountRate` reflects the company's cost of capital or hurdle rate. The two rates default to the same value but can be set independently.

### F9 — Package Comparison View
Side-by-side comparison of up to 4 packages showing:
- After-tax NPV (all three scenarios)
- Employer cost NPV (all three scenarios)
- Year-by-year cash flow chart (line chart, one line per package × scenario)

### F10 — Vesting / Cash Flow Timeline
Gantt-style timeline showing:
- Vest events per component
- Exercise windows (ISOs, NQOs)
- Tax payment timing (estimated quarterly estimated tax due dates)
- ISO holding period milestones (1 year from exercise, 2 years from grant)

---

## Data Model

### Package
```ts
interface Package {
  id: string;
  name: string;
  scenarioGrowthRates: { downside: number; base: number; upside: number }; // stock price
  salaryGrowthRates: { downside: number; base: number; upside: number };  // salary annual growth rate per scenario
  bonusGrowthRates: { downside: number; base: number; upside: number };   // bonus annual growth rate per scenario
  components: CompComponent[];
  taxInputs?: TaxInputs;  // overrides global when set
  horizon: number; // years
}
```

### CompComponent (discriminated union)
```ts
type CompComponent =
  | CashSalary
  | CashBonus
  | RestrictedStock
  | RSU
  | ISO
  | NQO;

interface CashSalary {
  type: "cash_salary";
  annualAmount: number;
}

interface CashBonus {
  type: "cash_bonus";
  targetAmount: number;
  paymentSchedule: PaymentEvent[]; // date + fraction of targetAmount
}

interface RestrictedStock {
  type: "rs";
  sharesGranted: number;
  grantDate: string;
  grantFMV: number;
  election83b: boolean;
  vestingSchedule: VestEvent[];
}

interface RSU {
  type: "rsu";
  sharesGranted: number;
  grantDate: string;
  grantFMV: number;
  vestingType: "time" | "double_trigger";
  vestingSchedule: VestEvent[];
  liquidityEventYear?: number; // for double trigger
}

interface ISO {
  type: "iso";
  sharesGranted: number;
  strikePrice: number;
  grantDate: string;
  grantFMV: number;
  expirationDate: string; // ≤10 years from grant
  exerciseSchedule: ExerciseEvent[]; // user-planned exercise dates
}

interface NQO {
  type: "nqo";
  sharesGranted: number;
  strikePrice: number;
  grantDate: string;
  grantFMV: number;
  expirationDate: string;
  exerciseSchedule: ExerciseEvent[];
}

interface VestEvent { year: number; month: number; sharesFraction: number; } // sharesFraction = fraction of sharesGranted
interface ExerciseEvent { year: number; sharesFraction: number; disqualifyingDisposition?: boolean; } // sharesFraction = fraction of sharesGranted; disqualifyingDisposition defaults to false (qualified sale assumed)
interface PaymentEvent { year: number; month: number; fraction: number; }    // fraction of targetAmount paid in this month
```

### TaxInputs
```ts
interface TaxInputs {
  federalOrdinaryRate: number;      // marginal federal rate on ordinary income
  federalLTCGRate: number;          // federal long-term capital gains rate (0/15/20)
  amtRate: number;                  // default 0.26; 0.26 or 0.28
  ficaRate: number;                 // individual employee share (and separately, employer share) of FICA: 7.65% up to ssWageBase, 1.45% above; default 0.0765. Applied once on each side — NOT a combined 15.3% rate.
  additionalMedicareRate: number;   // default 0.009; employee-only; applies to wages above $200k (single) / $250k (MFJ)
  stateOrdinaryRate: number;        // flat state rate on ordinary income
  stateLTCGRate: number;            // flat state rate on capital gains
  niitRate: number;                 // default 0.038; set to 0 when not applicable
  niitAlwaysOn: boolean;            // true = include niitRate in effectiveLTCGRate; false = niitRate is 0 for all calculations
  corporateRate: number;            // employer marginal corporate tax rate
  employeeDiscountRate: number;     // employee's required rate of return for PV calculations
  employerDiscountRate: number;     // employer's cost of capital / hurdle rate for PV calculations
  ssWageBase: number;               // default 168,600 (2024); user editable
  section162mApplies: boolean;      // caps salary/bonus deduction at $1M for public co.
}
```

### ScenarioResult / PackageResult
```ts
type PackageResult = ScenarioResult[]; // one entry per scenario

interface ScenarioResult {
  scenario: "downside" | "base" | "upside";
  yearlyRows: YearRow[];
  employeeNPV: number;
  employerNPVCost: number;
}

interface YearRow {
  year: number;
  stockPrice: number;
  employeeAfterTaxCash: number;   // sum across all components
  employerNetCost: number;        // sum across all components
  componentBreakdown: ComponentYearResult[];
}

interface ComponentYearResult {
  componentType: CompComponent["type"];
  employeeAfterTaxCash: number;
  employerNetCost: number;
  notes?: string; // e.g. "gross equity cost, no deduction" for ISO qualifying disposition
}
```

---

## Calculation Engine

All calculations live in `/src/engine/`. Pure functions, no side effects, fully unit-testable with `bun test`.

```
src/
  engine/
    tax.ts          -- FICA blending, AMT, NIIT helpers
    cashComp.ts     -- salary and bonus calculations
    restrictedStock.ts
    rsu.ts
    iso.ts          -- includes $100k limit split logic and AMT computation
    nqo.ts
    growth.ts       -- stock price projection across scenarios
    vesting.ts      -- vest schedule resolution
    npv.ts          -- discounting helpers
    index.ts        -- orchestrates per-package, per-scenario run
```

Engine entry point signature:
```ts
function evaluatePackage(pkg: Package, taxInputs: TaxInputs): PackageResult
```

Returns `PackageResult` (`ScenarioResult[]`), one per scenario, each with year-by-year rows and NPV totals.

---

## Page / Component Architecture

```
App
├── GlobalTaxPanel          -- shared tax rates; includes section162mApplies toggle
├── PackageList
│   └── PackageCard (×N)
│       ├── PackageHeader   -- name, scenario growth rates
│       ├── PackageTaxOverride  -- collapsible panel; when expanded, enables per-package TaxInputs that override GlobalTaxPanel for this package only
│       ├── ComponentBuilder
│       │   ├── AddComponentMenu
│       │   └── ComponentForm (polymorphic by type)
│       └── PackageResultSummary
│           ├── ScenarioTable     -- NPV per scenario
│           └── CashFlowChart     -- year-by-year (recharts)
├── ComparisonView
│   ├── PackageSelector     -- pick ≤4 packages
│   ├── SideBySideTable     -- NPV, cost
│   └── MultiPackageChart   -- overlaid line charts
└── VestingTimeline
    └── TimelineChart       -- Gantt + ISO milestones
```

Charts: use **Recharts** (add via `bun add recharts`).

---

## UI/UX Details

- **Single-page app** with tab navigation: Builder | Compare | Timeline
- All inputs use shadcn `Input`, `Select`, `Switch`, `Slider` components
- Tax panel is collapsible; collapses to a summary of key rates
- All monetary inputs accept "$" prefix and comma formatting
- Percentage inputs display as `%` and store as decimal (0.37, not 37)
- Error states: red border + tooltip for invalid inputs (e.g., ISO strike > FMV is unusual, warn but allow)
- Results update reactively on every input change (no "Calculate" button)
- Responsive: 2-column layout on desktop (inputs left, results right); single column on mobile

---

## ISO-Specific Constraints (enforced in UI)

1. **$100k annual limit**: If `sharesGranted × strikePrice > $100,000`, the engine treats the excess shares as NQOs at calculation time (grant-level test; see simplification note in F6). The `ISO` component in the data model is not modified. The UI shows a warning banner with the ISO/NQO share split. The split updates automatically on input changes.
2. **Holding period tracking**: Timeline marks (grant + 2 years) and (exercise + 1 year) as ISO qualification milestones.
3. **10-year expiration**: UI warns when planned exercise date exceeds grant + 10 years.
4. **Disqualifying disposition toggle**: Each ISO exercise event has a toggle; flipping it recalculates that year using NQO ordinary income treatment.
5. **409A valuation note**: For private companies, a banner suggests the strike price should reflect a 409A valuation (typically ~1/3 of preferred stock value) and links to IRS guidance.

---

## Persistence

- All packages and global tax inputs are serialized to SQLite via `bun:sqlite`.
- Auto-save on every change (debounced 500ms).
- Export to JSON (single package or all packages).
- Import from JSON.

---

## Testing Plan

```
bun test
```

Unit tests in `src/engine/__tests__/`:
- `tax.test.ts` — FICA wage base cutoff, additionalMedicareRate threshold, AMT computation, NIIT toggle
- `iso.test.ts` — qualified vs disqualifying disposition, $100k cap split, AMT vs regular tax comparison
- `nqo.test.ts` — exercise + sale spread calculations including employer FICA
- `rs.test.ts` — 83(b) vs no-election after-tax comparison (both employee and employer side)
- `npv.test.ts` — discounting correctness

---

## Out of Scope (v1)

- Indifference point calculator (employee and employer indifference methods) — deferred to v1.1
- NQDC / Section 409A plan modeling
- Fringe benefits (health insurance, 401k match, etc.)
- State-specific rules beyond a flat state rate
- International / non-US tax treatment
- Real-time stock price data feeds
- CPA review / legal disclaimer workflow
- Multi-user / team collaboration
- IRC 83(i) qualified equity grants (startup deferral elections)

---

## Open Questions / Future Work

- Should AMT credit carryforward be tracked year-to-year within the horizon? (Yes, needed for accurate multi-year ISO modeling — defer to v1.1)
- Should the tool model the effect of exercising ISOs early in a year to minimize AMT exposure? (Tax planning feature — v2)
- Add phantom stock / SARs? (Out of scope v1 per user preference)
- Carried interest treatment for GP/fund employees? (Out of scope v1)
- Indifference point calculator: Method 1 (employee indifference → employer chooses) and Method 2 (employer indifference → employee chooses), including ISO vs. NQO breakeven — deferred to v1.1
