import type { TaxInputs } from "../types";

/**
 * FICA blending: ficaRate (7.65%) on wages up to ssWageBase, 1.45% on wages above.
 * Returns the blended effective FICA rate for the given wage amount.
 *
 * ficaBlended = (min(wages, ssWageBase) × ficaRate + max(0, wages − ssWageBase) × 0.0145) / wages
 */
export function ficaBlended(wages: number, taxInputs: TaxInputs): number {
	if (wages <= 0) return 0;
	const { ficaRate, ssWageBase } = taxInputs;
	const belowBase = Math.min(wages, ssWageBase);
	const aboveBase = Math.max(0, wages - ssWageBase);
	return (belowBase * ficaRate + aboveBase * 0.0145) / wages;
}

/**
 * Additional Medicare Tax (employee-only):
 * additionalMedicareRate (0.9%) × max(0, wages − additionalMedicareThreshold) / wages
 */
export function additionalMedicareApplied(
	wages: number,
	taxInputs: TaxInputs,
): number {
	if (wages <= taxInputs.additionalMedicareThreshold) return 0;
	const { additionalMedicareRate, additionalMedicareThreshold } = taxInputs;
	return (
		(additionalMedicareRate * (wages - additionalMedicareThreshold)) / wages
	);
}

/**
 * Combined employee-side FICA effective rate for a given wage amount.
 * = ficaBlended + additionalMedicareApplied
 */
export function employeeFicaEffective(
	wages: number,
	taxInputs: TaxInputs,
): number {
	return (
		ficaBlended(wages, taxInputs) + additionalMedicareApplied(wages, taxInputs)
	);
}

/**
 * Employer-side FICA effective rate (additionalMedicare is employee-only — excluded here).
 * = ficaBlended only
 */
export function employerFicaEffective(
	wages: number,
	taxInputs: TaxInputs,
): number {
	return ficaBlended(wages, taxInputs);
}

/**
 * Effective LTCG rate.
 * effectiveLTCGRate = federalLTCGRate + stateLTCGRate + niitRate (if niitAlwaysOn)
 */
export function effectiveLTCGRate(taxInputs: TaxInputs): number {
	const { federalLTCGRate, stateLTCGRate, niitRate, niitAlwaysOn } = taxInputs;
	return federalLTCGRate + stateLTCGRate + (niitAlwaysOn ? niitRate : 0);
}

/**
 * Capital loss benefit rate (NIIT never applies to losses).
 * = federalLTCGRate + stateLTCGRate
 */
export function capitalLossRate(taxInputs: TaxInputs): number {
	return taxInputs.federalLTCGRate + taxInputs.stateLTCGRate;
}
