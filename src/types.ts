export interface VestEvent {
	year: number;
	month: number;
	sharesFraction: number;
}

export interface ExerciseEvent {
	year: number;
	month: number;
	sharesFraction: number;
}

export interface PaymentEvent {
	year: number;
	month: number;
	fraction: number;
}

export interface CashSalary {
	type: "cash_salary";
	annualAmount: number;
}

export interface CashBonus {
	type: "cash_bonus";
	targetAmount: number;
	paymentSchedule: PaymentEvent[];
}

export interface RestrictedStock {
	type: "rs";
	sharesGranted: number;
	grantDate: string;
	grantFMV: number;
	election83b: boolean;
	vestingSchedule: VestEvent[];
}

export interface RSU {
	type: "rsu";
	sharesGranted: number;
	grantDate: string;
	grantFMV: number;
	vestingType: "time" | "double_trigger";
	vestingSchedule: VestEvent[];
	liquidityEventYear?: number;
}

export interface ISO {
	type: "iso";
	sharesGranted: number;
	strikePrice: number;
	grantDate: string;
	grantFMV: number;
	expirationDate: string;
	exerciseSchedule: ExerciseEvent[];
}

export interface NQO {
	type: "nqo";
	sharesGranted: number;
	strikePrice: number;
	grantDate: string;
	grantFMV: number;
	expirationDate: string;
	exerciseSchedule: ExerciseEvent[];
}

export type CompComponent =
	| CashSalary
	| CashBonus
	| RestrictedStock
	| RSU
	| ISO
	| NQO;

export interface TaxInputs {
	federalOrdinaryRate: number;
	federalLTCGRate: number;
	amtRate: number;
	ficaRate: number;
	additionalMedicareRate: number;
	additionalMedicareThreshold: number;
	stateOrdinaryRate: number;
	stateLTCGRate: number;
	niitRate: number;
	niitAlwaysOn: boolean;
	corporateRate: number;
	employeeDiscountRate: number;
	employerDiscountRate: number;
	ssWageBase: number;
	section162mApplies: boolean;
}

export interface Package {
	id: string;
	name: string;
	companyValuation: number;
	sharesOutstanding: number;
	scenarioGrowthRates: { downside: number; base: number; upside: number };
	salaryGrowthRates: { downside: number; base: number; upside: number };
	bonusGrowthRates: { downside: number; base: number; upside: number };
	components: CompComponent[];
	taxInputs?: TaxInputs;
	horizon: number;
}

export interface ComponentYearResult {
	componentType: CompComponent["type"];
	employeeAfterTaxCash: number;
	employerNetCost: number;
	notes?: string;
}

export interface YearRow {
	year: number;
	stockPrice: number;
	employeeAfterTaxCash: number;
	employerNetCost: number;
	componentBreakdown: ComponentYearResult[];
}

export interface ScenarioResult {
	scenario: "downside" | "base" | "upside";
	yearlyRows: YearRow[];
	employeeNPV: number;
	employerNPVCost: number;
}

export type PackageResult = ScenarioResult[];

export const DEFAULT_TAX_INPUTS: TaxInputs = {
	federalOrdinaryRate: 0.37,
	federalLTCGRate: 0.2,
	amtRate: 0.26,
	ficaRate: 0.0765,
	additionalMedicareRate: 0.009,
	additionalMedicareThreshold: 200_000,
	stateOrdinaryRate: 0.093,
	stateLTCGRate: 0.093,
	niitRate: 0.038,
	niitAlwaysOn: false,
	corporateRate: 0.21,
	employeeDiscountRate: 0.1,
	employerDiscountRate: 0.1,
	ssWageBase: 168_600,
	section162mApplies: false,
};

export const CURRENT_YEAR = new Date().getFullYear();

export interface YearContext {
	ficaWagesAccrued: number;
	deductibleCompAccrued: number;
}
