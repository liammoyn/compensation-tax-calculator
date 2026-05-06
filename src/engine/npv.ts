/**
 * Discount a single future cash flow at year t back to present value.
 * PV = FV / (1 + rate)^t
 */
export function presentValue(fv: number, rate: number, t: number): number {
	return fv / (1 + rate) ** t;
}

/**
 * NPV of cash flows indexed [year 1, year 2, …].
 * NPV = Σ cashFlow[i] / (1 + rate)^(i + 1)
 */
export function npv(cashFlows: number[], rate: number): number {
	return cashFlows.reduce((sum, cf, i) => sum + cf / (1 + rate) ** (i + 1), 0);
}
