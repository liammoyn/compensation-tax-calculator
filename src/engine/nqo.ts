import type { ComponentYearResult, NQO, Package, TaxInputs } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { employeeFicaEffective, employerFicaEffective } from "./tax";
import { sharesExercisedPerYear } from "./vesting";

/**
 * NQO at exercise (sell-on-exercise).
 *
 * Employee: (fmvAtExercise − strikePrice) × sharesExercised × (1 − ordinaryRate − stateRate − ficaEmployee)
 * Employer: grossSpread × (1 + ficaEmployer) × (1 − corporateRate)
 *           grossSpread = (fmvAtExercise − strikePrice) × sharesExercised
 */
export function computeNQOYear(
	component: NQO,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const sharesThisYear =
		sharesExercisedPerYear(
			component.exerciseSchedule,
			component.sharesGranted,
		).get(calendarYear) ?? 0;
	if (sharesThisYear === 0)
		return {
			componentType: "nqo",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
		};

	const fmvAtExercise = stockPriceAtYear(pkg, scenario, n);
	const grossSpread = (fmvAtExercise - component.strikePrice) * sharesThisYear;

	if (grossSpread <= 0) {
		return {
			componentType: "nqo",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
			notes: "Underwater — no income",
		};
	}

	const ficaEmp = employeeFicaEffective(grossSpread, taxInputs);
	const ficaEmr = employerFicaEffective(grossSpread, taxInputs);

	return {
		componentType: "nqo",
		employeeAfterTaxCash:
			grossSpread *
			(1 -
				taxInputs.federalOrdinaryRate -
				taxInputs.stateOrdinaryRate -
				ficaEmp),
		employerNetCost:
			grossSpread * (1 + ficaEmr) * (1 - taxInputs.corporateRate),
	};
}
