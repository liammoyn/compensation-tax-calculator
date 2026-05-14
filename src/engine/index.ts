import type {
	ComponentYearResult,
	Package,
	PackageResult,
	ScenarioResult,
	TaxInputs,
	YearContext,
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
 *
 * YearContext is reset each year and threaded through components in declaration order,
 * ensuring the SS wage base cap (IRC §3121(a)(1)) and §162(m) deduction cap are applied
 * on cumulative year-to-date wages/comp rather than independently per component.
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

			// Reset year-level accumulators each year
			let ficaWagesAccrued = 0;
			let deductibleCompAccrued = 0;

			for (const component of pkg.components) {
				const yearCtx: YearContext = { ficaWagesAccrued, deductibleCompAccrued };

				switch (component.type) {
					case "cash_salary": {
						const { result, ficaWagesAdded, deductibleCompAdded } =
							computeSalaryYear(component, pkg, scenario, n, taxInputs, yearCtx);
						breakdown.push(result);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
					case "cash_bonus": {
						const { result, ficaWagesAdded, deductibleCompAdded } =
							computeBonusYear(component, pkg, scenario, n, calendarYear, taxInputs, yearCtx);
						breakdown.push(result);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
					case "rs": {
						const { results, ficaWagesAdded, deductibleCompAdded } =
							computeRSYear(component, pkg, scenario, n, calendarYear, taxInputs, yearCtx);
						breakdown.push(...results);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
					case "rsu": {
						const { result, ficaWagesAdded, deductibleCompAdded } =
							computeRSUYear(component, pkg, scenario, n, calendarYear, taxInputs, yearCtx);
						breakdown.push(result);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
					case "iso": {
						const { result, ficaWagesAdded, deductibleCompAdded } =
							computeISOYear(component, pkg, scenario, n, calendarYear, taxInputs, yearCtx);
						breakdown.push(result);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
					case "nqo": {
						const { result, ficaWagesAdded, deductibleCompAdded } =
							computeNQOYear(component, pkg, scenario, n, calendarYear, taxInputs, yearCtx);
						breakdown.push(result);
						ficaWagesAccrued += ficaWagesAdded;
						deductibleCompAccrued += deductibleCompAdded;
						break;
					}
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
