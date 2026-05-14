import type { ComponentYearResult, ISO, Package, TaxInputs, YearContext } from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import { deductibleCompFor } from "./tax";
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
 *
 * FICA: None. IRC §3121(a)(22) excludes both the transfer of stock pursuant to
 * an ISO exercise and any subsequent disposition (including disqualifying
 * dispositions) from FICA wages. IRS Notice 2002-47 confirmed this exemption.
 *
 * Employee: (fmvAtExercise − strikePrice) × sharesExercised × (1 − ordinaryRate − stateRate)
 * Employer: spread × (1 − corporateRate) on the deductible portion; no FICA.
 *   §162(m) cap applied via yearCtx if section162mApplies is set.
 *   IRC §421(b) allows employer deduction on disqualifying disposition spread.
 *
 * Shares exceeding $100k limit receive NQO tax treatment (tracked separately in NQO engine).
 */
export function computeISOYear(
	component: ISO,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
	yearCtx: YearContext,
): { result: ComponentYearResult; ficaWagesAdded: number; deductibleCompAdded: number } {
	const zero = {
		result: { componentType: "iso" as const, employeeAfterTaxCash: 0, employerNetCost: 0 },
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
	const spread = (fmvAtExercise - component.strikePrice) * sharesThisYear;

	if (spread <= 0) {
		return {
			result: {
				componentType: "iso",
				employeeAfterTaxCash: 0,
				employerNetCost: 0,
				notes: "Underwater — no income",
			},
			ficaWagesAdded: 0,
			deductibleCompAdded: 0,
		};
	}

	// No FICA on ISO exercises per IRC §3121(a)(22)
	const employeeAfterTaxCash =
		spread * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate);

	// Employer deducts spread per §421(b); §162(m) cap applied if applicable
	const deductible = deductibleCompFor(spread, yearCtx.deductibleCompAccrued, taxInputs);
	// No employer FICA on ISO, so grossCost = spread; taxSavings = deductible × corporateRate
	const employerNetCost = spread - deductible * taxInputs.corporateRate;

	const { isoShares, nqoShares } = isoShareSplit(
		component.sharesGranted,
		component.grantFMV,
	);
	const notes =
		nqoShares > 0
			? `Disqualifying disposition; §100k limit: ${Math.round(isoShares)} ISO shares, ${Math.round(nqoShares)} treated as NQO`
			: "Disqualifying disposition (sell-on-exercise)";

	return {
		result: { componentType: "iso", employeeAfterTaxCash, employerNetCost, notes },
		ficaWagesAdded: 0, // FICA exempt per IRC §3121(a)(22)
		deductibleCompAdded: deductible,
	};
}
