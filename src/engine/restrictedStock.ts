import type {
	ComponentYearResult,
	Package,
	RestrictedStock,
	TaxInputs,
	YearContext,
} from "../types";
import type { Scenario } from "./growth";
import { stockPriceAtYear } from "./growth";
import {
	capitalLossRate,
	deductibleCompFor,
	effectiveLTCGRate,
	employeeFicaMarginalRate,
	employerFicaMarginalRate,
} from "./tax";
import { sharesVestedPerYear } from "./vesting";

/**
 * RS (no 83b election) at vest — ordinary income on fmvAtVest × sharesVesting.
 *
 * Employee: fmvAtVest × sharesVesting × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer: grossCost − taxSavings
 *   grossCost  = income × (1 + ficaEmployer)
 *   taxSavings = (deductible + income × ficaEmployer) × corporateRate
 *   IRC §83(a),(h): income and deduction timing at vest.
 */
function rsNoElection(
	sharesVesting: number,
	fmvAtVest: number,
	taxInputs: TaxInputs,
	ficaEmpRate: number,
	ficaEmrRate: number,
	deductible: number,
): ComponentYearResult {
	const income = fmvAtVest * sharesVesting;
	const grossCost = income * (1 + ficaEmrRate);
	const taxSavings = (deductible + income * ficaEmrRate) * taxInputs.corporateRate;
	return {
		componentType: "rs",
		employeeAfterTaxCash:
			income * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmpRate),
		employerNetCost: grossCost - taxSavings,
		notes: "Ordinary income at vest (no 83b)",
	};
}

/**
 * RS with 83(b) — income at grant date on all granted shares (IRC §83(b)).
 * Employer deducts at grant per IRC §83(h).
 */
function rs83bGrant(
	sharesGranted: number,
	fmvAtGrant: number,
	taxInputs: TaxInputs,
	ficaEmpRate: number,
	ficaEmrRate: number,
	deductible: number,
): ComponentYearResult {
	const income = fmvAtGrant * sharesGranted;
	const grossCost = income * (1 + ficaEmrRate);
	const taxSavings = (deductible + income * ficaEmrRate) * taxInputs.corporateRate;
	return {
		componentType: "rs",
		employeeAfterTaxCash:
			income * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmpRate),
		employerNetCost: grossCost - taxSavings,
		notes: "83(b) income at grant",
	};
}

/**
 * RS with 83(b) — LTCG (or short-term gain) at each vest tranche.
 * No FICA (capital gain). No employer deduction (taken at grant, IRC §83(h)).
 *
 * gain = (fmvAtVest − fmvAtGrant) × sharesVesting
 * Long-term (≥1 yr from grant per IRC §83(f)): gain × (1 − effectiveLTCGRate)
 * Short-term (<1 yr): gain × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Capital loss: tax benefit = |loss| × (federalLTCGRate + stateLTCGRate)
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
			// Short-term: no FICA on capital gain, but ordinary rates apply
			employeeAfterTaxCash =
				gain * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate);
		}
	} else {
		const lossAmount = Math.abs(gain);
		const taxBenefit = lossAmount * capitalLossRate(taxInputs);
		employeeAfterTaxCash = -lossAmount + taxBenefit;
	}

	return {
		componentType: "rs",
		employeeAfterTaxCash,
		employerNetCost: 0, // no further deduction at vest when 83(b) was elected
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
	yearCtx: YearContext,
): { results: ComponentYearResult[]; ficaWagesAdded: number; deductibleCompAdded: number } {
	const results: ComponentYearResult[] = [];
	let ficaWagesAdded = 0;
	let deductibleCompAdded = 0;

	// Local accumulators for within-component ordering (grant event then vest event same year)
	let localFicaAccrued = yearCtx.ficaWagesAccrued;
	let localDeductibleAccrued = yearCtx.deductibleCompAccrued;

	const grantYear = new Date(component.grantDate).getFullYear();
	const fmvAtGrant = component.grantFMV;
	const fmvAtVest = stockPriceAtYear(pkg, scenario, n);

	if (component.election83b) {
		// Ordinary income event at grant — FICA and employer deduction apply
		if (calendarYear === grantYear) {
			const income = fmvAtGrant * component.sharesGranted;
			const ficaEmp = employeeFicaMarginalRate(income, localFicaAccrued, taxInputs);
			const ficaEmr = employerFicaMarginalRate(income, localFicaAccrued, taxInputs);
			const deductible = deductibleCompFor(income, localDeductibleAccrued, taxInputs);

			results.push(rs83bGrant(component.sharesGranted, fmvAtGrant, taxInputs, ficaEmp, ficaEmr, deductible));
			ficaWagesAdded += income;
			deductibleCompAdded += deductible;
			localFicaAccrued += income;
			localDeductibleAccrued += deductible;
		}

		// LTCG event at vest — no FICA, no employer deduction
		const vestedThisYear =
			sharesVestedPerYear(
				component.vestingSchedule,
				component.sharesGranted,
			).get(calendarYear) ?? 0;
		if (vestedThisYear > 0) {
			results.push(
				rs83bVest(vestedThisYear, fmvAtVest, fmvAtGrant, grantYear, calendarYear, taxInputs),
			);
			// ficaWagesAdded += 0 (LTCG, not FICA wages)
			// deductibleCompAdded += 0 (no employer deduction at vest with 83(b))
		}
	} else {
		// Ordinary income event at vest — FICA and employer deduction apply
		const vestedThisYear =
			sharesVestedPerYear(
				component.vestingSchedule,
				component.sharesGranted,
			).get(calendarYear) ?? 0;
		if (vestedThisYear > 0) {
			const income = fmvAtVest * vestedThisYear;
			const ficaEmp = employeeFicaMarginalRate(income, localFicaAccrued, taxInputs);
			const ficaEmr = employerFicaMarginalRate(income, localFicaAccrued, taxInputs);
			const deductible = deductibleCompFor(income, localDeductibleAccrued, taxInputs);

			results.push(rsNoElection(vestedThisYear, fmvAtVest, taxInputs, ficaEmp, ficaEmr, deductible));
			ficaWagesAdded += income;
			deductibleCompAdded += deductible;
		}
	}

	return { results, ficaWagesAdded, deductibleCompAdded };
}
