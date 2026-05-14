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

// ─── Marginal FICA helpers (for year-level wage accumulation) ─────────────────

function ficaDollarAmount(wages: number, taxInputs: TaxInputs): number {
	if (wages <= 0) return 0;
	const { ficaRate, ssWageBase } = taxInputs;
	return Math.min(wages, ssWageBase) * ficaRate + Math.max(0, wages - ssWageBase) * 0.0145;
}

function additionalMedicareDollarAmount(wages: number, taxInputs: TaxInputs): number {
	if (wages <= taxInputs.additionalMedicareThreshold) return 0;
	return taxInputs.additionalMedicareRate * (wages - taxInputs.additionalMedicareThreshold);
}

/**
 * Marginal employee FICA rate for a component given wages already accrued in
 * this calendar year from prior components. Correctly respects the SS wage base
 * cap across all income sources from the same employer (IRC §3121(a)(1)).
 */
export function employeeFicaMarginalRate(
	componentWages: number,
	priorWages: number,
	taxInputs: TaxInputs,
): number {
	if (componentWages <= 0) return 0;
	const marginalDollars =
		(ficaDollarAmount(priorWages + componentWages, taxInputs) -
			ficaDollarAmount(priorWages, taxInputs)) +
		(additionalMedicareDollarAmount(priorWages + componentWages, taxInputs) -
			additionalMedicareDollarAmount(priorWages, taxInputs));
	return marginalDollars / componentWages;
}

/**
 * Marginal employer FICA rate for a component given wages already accrued.
 * Excludes additionalMedicareRate (employee-only per IRC §3101(b)(2)).
 */
export function employerFicaMarginalRate(
	componentWages: number,
	priorWages: number,
	taxInputs: TaxInputs,
): number {
	if (componentWages <= 0) return 0;
	return (
		(ficaDollarAmount(priorWages + componentWages, taxInputs) -
			ficaDollarAmount(priorWages, taxInputs)) /
		componentWages
	);
}

/**
 * §162(m)-aware deductible amount for the employer.
 * When section162mApplies is false, the full grossComp is deductible.
 * When true, only up to $1M cumulative (across all comp types) is deductible
 * per IRC §162(m) as amended by TCJA §13601 (P.L. 115-97, effective 2018).
 */
export function deductibleCompFor(
	grossComp: number,
	priorDeductibleComp: number,
	taxInputs: TaxInputs,
): number {
	if (!taxInputs.section162mApplies) return grossComp;
	return Math.max(0, Math.min(grossComp, 1_000_000 - priorDeductibleComp));
}
