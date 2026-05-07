export function formatCurrency(value: number): string {
	if (!Number.isFinite(value)) return "$0";
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
}

export function formatCurrencyCompact(value: number): string {
	if (!Number.isFinite(value)) return "$0";
	const abs = Math.abs(value);
	const sign = value < 0 ? "-" : "";
	if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
	if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
	return formatCurrency(value);
}

export function formatPercent(value: number, decimals = 1): string {
	return `${(value * 100).toFixed(decimals)}%`;
}

export function formatShares(value: number): string {
	return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(
		value,
	);
}

export function parseCurrency(value: string): number {
	return parseFloat(value.replace(/[$,]/g, "")) || 0;
}

export function parsePercent(value: string): number {
	return parseFloat(value.replace(/%/g, "")) / 100 || 0;
}

import type { CompComponent } from "../types";

export const COMPONENT_LABELS: Record<CompComponent["type"], string> = {
	cash_salary: "Cash Salary",
	cash_bonus: "Cash Bonus",
	rs: "Restricted Stock",
	rsu: "RSU",
	iso: "ISO",
	nqo: "NQO",
};
