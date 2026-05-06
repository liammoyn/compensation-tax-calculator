import type {
	ComponentYearResult,
	Package,
	RestrictedStock,
	TaxInputs,
} from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import {
	effectiveLTCGRate,
	employeeFicaEffective,
	employerFicaEffective,
} from "./tax";
import { sharesVestedPerYear } from "./vesting";

/** RS (no 83b election) at vest — ordinary income on fmvAtVest × sharesVesting.
 *
 * Employee: fmvAtVest × sharesVesting × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer: fmvAtVest × sharesVesting × (1 + ficaEmployer) × (1 − corporateRate)
 */
function rsNoElection(
	sharesVesting: number,
	fmvAtVest: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const income = fmvAtVest * sharesVesting;
	const ficaEmp = employeeFicaEffective(income, taxInputs);
	const ficaEmr = employerFicaEffective(income, taxInputs);
	return {
		componentType: "rs",
		employeeAfterTaxCash:
			income *
			(1 -
				taxInputs.federalOrdinaryRate -
				taxInputs.stateOrdinaryRate -
				ficaEmp),
		employerNetCost: income * (1 + ficaEmr) * (1 - taxInputs.corporateRate),
		notes: "Ordinary income at vest (no 83b)",
	};
}

/** RS with 83(b) — income at grant date on all granted shares.
 *
 * Employee: fmvAtGrant × sharesGranted × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer: fmvAtGrant × sharesGranted × (1 + ficaEmployer) × (1 − corporateRate)
 */
function rs83bGrant(
	sharesGranted: number,
	fmvAtGrant: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const income = fmvAtGrant * sharesGranted;
	const ficaEmp = employeeFicaEffective(income, taxInputs);
	const ficaEmr = employerFicaEffective(income, taxInputs);
	return {
		componentType: "rs",
		employeeAfterTaxCash:
			income *
			(1 -
				taxInputs.federalOrdinaryRate -
				taxInputs.stateOrdinaryRate -
				ficaEmp),
		employerNetCost: income * (1 + ficaEmr) * (1 - taxInputs.corporateRate),
		notes: "83(b) income at grant",
	};
}

/** RS with 83(b) — LTCG (or short-term gain) at each vest tranche.
 *
 * gain = (fmvAtVest − fmvAtGrant) × sharesVesting
 * Long-term (≥1 yr): gain × (1 − effectiveLTCGRate)
 * Short-term (<1 yr): gain × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Capital loss:       tax benefit = |loss| × (federalLTCGRate + stateLTCGRate)
 * Employer: no deduction at vest (deduction was taken at grant)
 */
function rs83bVest(
	sharesVesting: number,
	fmvAtVest: number,
	fmvAtGrant: number,
	grantYear: number,
	vestYear: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const gain = (fmvAtVest - fmvAtGrant) * sharesVesting;
	const isLongTerm = vestYear - grantYear >= 1;

	let employeeAfterTaxCash: number;
	if (gain >= 0) {
		if (isLongTerm) {
			employeeAfterTaxCash = gain * (1 - effectiveLTCGRate(taxInputs));
		} else {
			const ficaEmp = employeeFicaEffective(gain, taxInputs);
			employeeAfterTaxCash =
				gain *
				(1 -
					taxInputs.federalOrdinaryRate -
					taxInputs.stateOrdinaryRate -
					ficaEmp);
		}
	} else {
		// Capital loss: value of loss + tax benefit (reduces tax liability)
		const lossAmount = Math.abs(gain);
		const taxBenefit =
			lossAmount * (taxInputs.federalLTCGRate + taxInputs.stateLTCGRate);
		employeeAfterTaxCash = -lossAmount + taxBenefit; // negative cash flow offset by tax benefit
	}

	return {
		componentType: "rs",
		employeeAfterTaxCash,
		employerNetCost: 0,
		notes:
			gain < 0
				? "Capital loss at vest (83b)"
				: isLongTerm
					? "LTCG at vest (83b)"
					: "Short-term gain at vest (83b, <1yr hold)",
	};
}

export function computeRSYear(
	component: RestrictedStock,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
): ComponentYearResult[] {
	const results: ComponentYearResult[] = [];
	const grantYear = new Date(component.grantDate).getFullYear();
	const fmvAtGrant = component.grantFMV;
	const yearsFromPkgStart = n;
	const fmvAtVest = stockPriceAtYear(pkg, scenario, yearsFromPkgStart);

	if (component.election83b) {
		if (calendarYear === grantYear) {
			results.push(rs83bGrant(component.sharesGranted, fmvAtGrant, taxInputs));
		}
		const vestedThisYear =
			sharesVestedPerYear(
				component.vestingSchedule,
				component.sharesGranted,
			).get(calendarYear) ?? 0;
		if (vestedThisYear > 0) {
			results.push(
				rs83bVest(
					vestedThisYear,
					fmvAtVest,
					fmvAtGrant,
					grantYear,
					calendarYear,
					taxInputs,
				),
			);
		}
	} else {
		const vestedThisYear =
			sharesVestedPerYear(
				component.vestingSchedule,
				component.sharesGranted,
			).get(calendarYear) ?? 0;
		if (vestedThisYear > 0) {
			results.push(rsNoElection(vestedThisYear, fmvAtVest, taxInputs));
		}
	}

	return results;
}
