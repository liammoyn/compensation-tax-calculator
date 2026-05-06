import type { ComponentYearResult, ISO, Package, TaxInputs } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { employeeFicaEffective, employerFicaEffective } from "./tax";
import { sharesExercisedPerYear } from "./vesting";

const ISO_100K_LIMIT = 100_000;

/**
 * ISO §422(d) $100k annual limit — grant-level test (v1 simplification).
 * Shares with value above $100k at grant are treated as NQOs at calculation time.
 *
 * Returns { isoShares, nqoShares }.
 */
export function isoShareSplit(
	sharesGranted: number,
	grantFMV: number,
): { isoShares: number; nqoShares: number } {
	const totalValue = sharesGranted * grantFMV;
	if (totalValue <= ISO_100K_LIMIT || grantFMV <= 0) {
		return { isoShares: sharesGranted, nqoShares: 0 };
	}
	const isoShares = Math.floor(ISO_100K_LIMIT / grantFMV);
	return { isoShares, nqoShares: sharesGranted - isoShares };
}

/**
 * ISO at exercise — all treated as disqualifying dispositions (sell-on-exercise).
 * AMT = 0 (disqualifying disposition; spread recognized as ordinary income, not AMT preference item).
 *
 * Employee: (fmvAtExercise − strikePrice) × sharesExercised × (1 − ordinaryRate − stateRate − ficaEmployee)
 * Employer: spread × (1 + ficaEmployer) × (1 − corporateRate)
 *
 * Shares exceeding $100k limit receive identical NQO tax treatment.
 */
export function computeISOYear(
	component: ISO,
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
			componentType: "iso",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
		};

	const fmvAtExercise = stockPriceAtYear(pkg, scenario, n);
	const spread = (fmvAtExercise - component.strikePrice) * sharesThisYear;

	if (spread <= 0) {
		return {
			componentType: "iso",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
			notes: "Underwater — no income",
		};
	}

	const ficaEmp = employeeFicaEffective(spread, taxInputs);
	const ficaEmr = employerFicaEffective(spread, taxInputs);

	const employeeAfterTaxCash =
		spread *
		(1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);
	const employerNetCost =
		spread * (1 + ficaEmr) * (1 - taxInputs.corporateRate);

	const { isoShares, nqoShares } = isoShareSplit(
		component.sharesGranted,
		component.grantFMV,
	);
	const notes =
		nqoShares > 0
			? `Disqualifying disposition; §100k limit: ${Math.round(isoShares)} ISO shares, ${Math.round(nqoShares)} treated as NQO`
			: "Disqualifying disposition (sell-on-exercise)";

	return { componentType: "iso", employeeAfterTaxCash, employerNetCost, notes };
}
