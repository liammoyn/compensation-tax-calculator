import type { Package } from "../types";

export type Scenario = "downside" | "base" | "upside";

/**
 * Base stock price derived from package-level valuation inputs.
 * baseStockPrice = companyValuation / sharesOutstanding
 */
export function baseStockPrice(pkg: Package): number {
	if (pkg.sharesOutstanding <= 0) return 0;
	return pkg.companyValuation / pkg.sharesOutstanding;
}

/**
 * Stock price at year n (n years after the base valuation date).
 * Formula: baseStockPrice × (1 + annualGrowthRate)^n
 */
export function stockPriceAtYear(
	pkg: Package,
	scenario: Scenario,
	n: number,
): number {
	return baseStockPrice(pkg) * (1 + pkg.scenarioGrowthRates[scenario]) ** n;
}

/**
 * Annual salary at year n (year 1 = base salary, year 2 = salary × (1+r)^1, …).
 * Formula: annualAmount × (1 + salaryGrowthRate)^(n − 1)
 */
export function salaryAtYear(
	annualAmount: number,
	pkg: Package,
	scenario: Scenario,
	n: number,
): number {
	return annualAmount * (1 + pkg.salaryGrowthRates[scenario]) ** (n - 1);
}

/**
 * Annual bonus target at year n.
 * Formula: targetAmount × (1 + bonusGrowthRate)^(n − 1)
 */
export function bonusAtYear(
	targetAmount: number,
	pkg: Package,
	scenario: Scenario,
	n: number,
): number {
	return targetAmount * (1 + pkg.bonusGrowthRates[scenario]) ** (n - 1);
}
