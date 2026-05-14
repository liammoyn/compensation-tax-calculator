import type { ComponentYearResult, Package, RSU, TaxInputs, YearContext } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { deductibleCompFor, employeeFicaMarginalRate, employerFicaMarginalRate } from "./tax";
import { sharesVestedPerYear } from "./vesting";

/**
 * RSU at vest (sell-on-vest assumption).
 *
 * Time-based: fmvAtVest = stock price at vest year
 * Double-trigger: fmvAtVest = stock price at liquidityEventYear;
 *   service-vested shares that haven't settled (calendarYear < liquidityEventYear) = $0.
 *
 * Employee: fmvAtVest × sharesVesting × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer: grossCost − taxSavings
 *   grossCost  = income × (1 + ficaEmployer)
 *   taxSavings = (deductible + income × ficaEmployer) × corporateRate
 *   FICA per Rev. Rul. 2012-18; §162(m) applied via yearCtx (post-TCJA, all comp subject to cap).
 */
export function computeRSUYear(
	component: RSU,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
	yearCtx: YearContext,
): { result: ComponentYearResult; ficaWagesAdded: number; deductibleCompAdded: number } {
	const zero = {
		result: { componentType: "rsu" as const, employeeAfterTaxCash: 0, employerNetCost: 0 },
		ficaWagesAdded: 0,
		deductibleCompAdded: 0,
	};

	const sharesThisYear =
		sharesVestedPerYear(component.vestingSchedule, component.sharesGranted).get(
			calendarYear,
		) ?? 0;
	if (sharesThisYear === 0) return zero;

	let fmvAtVest: number;
	let notes: string | undefined;

	if (component.vestingType === "double_trigger") {
		const liquidityYear = component.liquidityEventYear;
		if (!liquidityYear || calendarYear < liquidityYear) {
			return zero;
		}
		const pkgStartYear = calendarYear - n + 1;
		const liquidityN = liquidityYear - pkgStartYear + 1;
		fmvAtVest = stockPriceAtYear(pkg, scenario, Math.max(1, liquidityN));
		notes = `Double-trigger settlement (liquidity event year ${liquidityYear})`;
	} else {
		fmvAtVest = stockPriceAtYear(pkg, scenario, n);
	}

	const income = fmvAtVest * sharesThisYear;
	const ficaEmp = employeeFicaMarginalRate(income, yearCtx.ficaWagesAccrued, taxInputs);
	const ficaEmr = employerFicaMarginalRate(income, yearCtx.ficaWagesAccrued, taxInputs);
	const deductible = deductibleCompFor(income, yearCtx.deductibleCompAccrued, taxInputs);

	const employeeAfterTaxCash =
		income * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);
	const grossCost = income * (1 + ficaEmr);
	const taxSavings = (deductible + income * ficaEmr) * taxInputs.corporateRate;
	const employerNetCost = grossCost - taxSavings;

	return {
		result: { componentType: "rsu", employeeAfterTaxCash, employerNetCost, notes },
		ficaWagesAdded: income,
		deductibleCompAdded: deductible,
	};
}
