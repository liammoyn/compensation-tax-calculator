import type { ComponentYearResult, NQO, Package, TaxInputs, YearContext } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { deductibleCompFor, employeeFicaMarginalRate, employerFicaMarginalRate } from "./tax";
import { sharesExercisedPerYear } from "./vesting";

/**
 * NQO at exercise (sell-on-exercise).
 *
 * Employee: (fmvAtExercise − strikePrice) × sharesExercised × (1 − ordinaryRate − stateRate − ficaEmployee)
 * Employer: grossCost − taxSavings
 *   grossCost  = grossSpread × (1 + ficaEmployer)
 *   taxSavings = (deductible + grossSpread × ficaEmployer) × corporateRate
 *   IRC §83(h): employer deduction = amount includible in employee income.
 *   FICA applies per Rev. Rul. 2012-18; §162(m) cap applied via yearCtx (post-TCJA).
 */
export function computeNQOYear(
	component: NQO,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
	yearCtx: YearContext,
): { result: ComponentYearResult; ficaWagesAdded: number; deductibleCompAdded: number } {
	const zero = {
		result: { componentType: "nqo" as const, employeeAfterTaxCash: 0, employerNetCost: 0 },
		ficaWagesAdded: 0,
		deductibleCompAdded: 0,
	};

	const sharesThisYear =
		sharesExercisedPerYear(
			component.exerciseSchedule,
			component.sharesGranted,
		).get(calendarYear) ?? 0;
	if (sharesThisYear === 0) return zero;

	const fmvAtExercise = stockPriceAtYear(pkg, scenario, n);
	const grossSpread = (fmvAtExercise - component.strikePrice) * sharesThisYear;

	if (grossSpread <= 0) {
		return {
			result: {
				componentType: "nqo",
				employeeAfterTaxCash: 0,
				employerNetCost: 0,
				notes: "Underwater — no income",
			},
			ficaWagesAdded: 0,
			deductibleCompAdded: 0,
		};
	}

	const ficaEmp = employeeFicaMarginalRate(grossSpread, yearCtx.ficaWagesAccrued, taxInputs);
	const ficaEmr = employerFicaMarginalRate(grossSpread, yearCtx.ficaWagesAccrued, taxInputs);
	const deductible = deductibleCompFor(grossSpread, yearCtx.deductibleCompAccrued, taxInputs);

	const employeeAfterTaxCash =
		grossSpread * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);
	const grossCost = grossSpread * (1 + ficaEmr);
	const taxSavings = (deductible + grossSpread * ficaEmr) * taxInputs.corporateRate;
	const employerNetCost = grossCost - taxSavings;

	return {
		result: { componentType: "nqo", employeeAfterTaxCash, employerNetCost },
		ficaWagesAdded: grossSpread,
		deductibleCompAdded: deductible,
	};
}
