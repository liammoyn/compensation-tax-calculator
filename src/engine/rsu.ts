import type { ComponentYearResult, Package, RSU, TaxInputs } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { employeeFicaEffective, employerFicaEffective } from "./tax";
import { sharesVestedPerYear } from "./vesting";

/**
 * RSU at vest (sell-on-vest assumption).
 *
 * Time-based: fmvAtVest = stock price at vest year
 * Double-trigger: fmvAtVest = stock price at liquidityEventYear;
 *   service-vested shares that haven't settled (calendarYear < liquidityEventYear) = $0.
 *
 * Employee: fmvAtVest × sharesVesting × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer: fmvAtVest × sharesVesting × (1 + ficaEmployer) × (1 − corporateRate)
 */
export function computeRSUYear(
	component: RSU,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const sharesThisYear =
		sharesVestedPerYear(component.vestingSchedule, component.sharesGranted).get(
			calendarYear,
		) ?? 0;
	if (sharesThisYear === 0)
		return {
			componentType: "rsu",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
		};

	let fmvAtVest: number;
	let notes: string | undefined;

	if (component.vestingType === "double_trigger") {
		const liquidityYear = component.liquidityEventYear;
		if (!liquidityYear || calendarYear < liquidityYear) {
			// Service-vested but not yet settled — no taxable event yet
			return {
				componentType: "rsu",
				employeeAfterTaxCash: 0,
				employerNetCost: 0,
			};
		}
		const pkgStartYear = calendarYear - n + 1;
		const liquidityN = liquidityYear - pkgStartYear + 1;
		fmvAtVest = stockPriceAtYear(pkg, scenario, Math.max(1, liquidityN));
		notes = `Double-trigger settlement (liquidity event year ${liquidityYear})`;
	} else {
		fmvAtVest = stockPriceAtYear(pkg, scenario, n);
	}

	const income = fmvAtVest * sharesThisYear;
	const ficaEmp = employeeFicaEffective(income, taxInputs);
	const ficaEmr = employerFicaEffective(income, taxInputs);

	return {
		componentType: "rsu",
		employeeAfterTaxCash:
			income *
			(1 -
				taxInputs.federalOrdinaryRate -
				taxInputs.stateOrdinaryRate -
				ficaEmp),
		employerNetCost: income * (1 + ficaEmr) * (1 - taxInputs.corporateRate),
		notes,
	};
}
