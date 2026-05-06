import type {
	ComponentYearResult,
	Package,
	PackageResult,
	ScenarioResult,
	TaxInputs,
	YearRow,
} from "../types";
import { CURRENT_YEAR } from "../types";
import { computeBonusYear, computeSalaryYear } from "./cashComp";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { computeISOYear } from "./iso";
import { npv } from "./npv";
import { computeNQOYear } from "./nqo";
import { computeRSYear } from "./restrictedStock";
import { computeRSUYear } from "./rsu";

const SCENARIOS: Scenario[] = ["downside", "base", "upside"];

/**
 * Evaluate all scenarios for a single package.
 * Returns one ScenarioResult per scenario, each with year-by-year rows and NPV totals.
 */
export function evaluatePackage(
	pkg: Package,
	globalTaxInputs: TaxInputs,
): PackageResult {
	const taxInputs = pkg.taxInputs ?? globalTaxInputs;
	const startYear = CURRENT_YEAR;

	return SCENARIOS.map((scenario): ScenarioResult => {
		const yearlyRows: YearRow[] = [];

		for (let n = 1; n <= pkg.horizon; n++) {
			const calendarYear = startYear + n - 1;
			const stockPrice = stockPriceAtYear(pkg, scenario, n);
			const breakdown: ComponentYearResult[] = [];

			for (const component of pkg.components) {
				switch (component.type) {
					case "cash_salary":
						breakdown.push(
							computeSalaryYear(component, pkg, scenario, n, taxInputs),
						);
						break;
					case "cash_bonus":
						breakdown.push(
							computeBonusYear(
								component,
								pkg,
								scenario,
								n,
								calendarYear,
								taxInputs,
							),
						);
						break;
					case "rs":
						breakdown.push(
							...computeRSYear(
								component,
								pkg,
								scenario,
								n,
								calendarYear,
								taxInputs,
							),
						);
						break;
					case "rsu":
						breakdown.push(
							computeRSUYear(
								component,
								pkg,
								scenario,
								n,
								calendarYear,
								taxInputs,
							),
						);
						break;
					case "iso":
						breakdown.push(
							computeISOYear(
								component,
								pkg,
								scenario,
								n,
								calendarYear,
								taxInputs,
							),
						);
						break;
					case "nqo":
						breakdown.push(
							computeNQOYear(
								component,
								pkg,
								scenario,
								n,
								calendarYear,
								taxInputs,
							),
						);
						break;
				}
			}

			yearlyRows.push({
				year: calendarYear,
				stockPrice,
				employeeAfterTaxCash: breakdown.reduce(
					(s, c) => s + c.employeeAfterTaxCash,
					0,
				),
				employerNetCost: breakdown.reduce((s, c) => s + c.employerNetCost, 0),
				componentBreakdown: breakdown,
			});
		}

		const employeeFlows = yearlyRows.map((r) => r.employeeAfterTaxCash);
		const employerFlows = yearlyRows.map((r) => r.employerNetCost);

		return {
			scenario,
			yearlyRows,
			employeeNPV: npv(employeeFlows, taxInputs.employeeDiscountRate),
			employerNPVCost: npv(employerFlows, taxInputs.employerDiscountRate),
		};
	});
}
