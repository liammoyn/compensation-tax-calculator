import { useState } from "react";
import {
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { formatCurrency, formatCurrencyCompact } from "../lib/format";
import type { PackageResult } from "../types";

const SCENARIO_COLORS = {
	downside: "#ef4444",
	base: "#3b82f6",
	upside: "#22c55e",
};
const SCENARIO_LABELS = {
	downside: "Downside",
	base: "Base",
	upside: "Upside",
};

interface Props {
	result: PackageResult;
}

export function PackageResultSummary({ result }: Props) {
	const [activeScenarios, setActiveScenarios] = useState<Set<string>>(
		new Set(["downside", "base", "upside"]),
	);

	const toggleScenario = (s: string) => {
		setActiveScenarios((prev) => {
			const next = new Set(prev);
			if (next.has(s)) {
				if (next.size > 1) next.delete(s);
			} else next.add(s);
			return next;
		});
	};

	const chartData =
		result[0]?.yearlyRows.map((row0, rowIdx) => {
			const row: Record<string, number | string> = { year: row0.year };
			result.forEach((sr) => {
				const yr = sr.yearlyRows[rowIdx];
				if (yr === undefined) return;
				row[`employee_${sr.scenario}`] = yr.employeeAfterTaxCash;
				row[`employer_${sr.scenario}`] = yr.employerNetCost;
			});
			return row;
		}) ?? [];

	return (
		<div className="space-y-4">
			{/* NPV Summary Table */}
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="border-b text-muted-foreground">
							<th className="text-left py-1.5 pr-4 font-medium">Scenario</th>
							<th className="text-right py-1.5 px-2 font-medium">
								Employee NPV
							</th>
							<th className="text-right py-1.5 px-2 font-medium">
								Employer NPV Cost
							</th>
						</tr>
					</thead>
					<tbody>
						{result.map((sr) => (
							<tr key={sr.scenario} className="border-b last:border-0">
								<td className="py-1.5 pr-4">
									<button
										type="button"
										onClick={() => toggleScenario(sr.scenario)}
										className="flex items-center gap-2"
									>
										<span
											className="inline-block w-3 h-3 rounded-full"
											style={{
												backgroundColor: SCENARIO_COLORS[sr.scenario],
												opacity: activeScenarios.has(sr.scenario) ? 1 : 0.3,
											}}
										/>
										<span className="font-medium">
											{SCENARIO_LABELS[sr.scenario]}
										</span>
									</button>
								</td>
								<td className="py-1.5 px-2 text-right font-mono font-medium">
									{formatCurrency(sr.employeeNPV)}
								</td>
								<td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
									{formatCurrency(sr.employerNPVCost)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Cash Flow Chart */}
			<div>
				<p className="text-xs text-muted-foreground mb-2">
					After-tax cash flow by year
				</p>
				<ResponsiveContainer width="100%" height={160}>
					<LineChart
						data={chartData}
						margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
						<XAxis dataKey="year" tick={{ fontSize: 11 }} />
						<YAxis
							tickFormatter={(v) => formatCurrencyCompact(v)}
							tick={{ fontSize: 10 }}
							width={56}
						/>
						<Tooltip formatter={(v) => typeof v === "number" ? formatCurrency(v) : ""} />
						{result.map(
							(sr) =>
								activeScenarios.has(sr.scenario) && (
									<Line
										key={sr.scenario}
										type="monotone"
										dataKey={`employee_${sr.scenario}`}
										stroke={SCENARIO_COLORS[sr.scenario]}
										strokeWidth={2}
										dot={false}
										name={SCENARIO_LABELS[sr.scenario]}
									/>
								),
						)}
					</LineChart>
				</ResponsiveContainer>
			</div>

			{/* Year-by-Year Table (collapsed by default, expandable) */}
			<YearlyBreakdown result={result} activeScenarios={activeScenarios} />
		</div>
	);
}

function YearlyBreakdown({
	result,
	activeScenarios,
}: {
	result: PackageResult;
	activeScenarios: Set<string>;
}) {
	const [expanded, setExpanded] = useState(false);

	if (!expanded) {
		return (
			<button
				type="button"
				className="text-xs text-blue-600 hover:underline"
				onClick={() => setExpanded(true)}
			>
				Show year-by-year detail
			</button>
		);
	}

	const scenarios = result.filter((sr) => activeScenarios.has(sr.scenario));
	const years = result[0]?.yearlyRows.map((r) => r.year) ?? [];

	return (
		<div className="space-y-1">
			<div className="flex justify-between items-center">
				<p className="text-xs font-medium text-muted-foreground">
					Year-by-Year Breakdown (Employee After-Tax)
				</p>
				<button
					type="button"
					className="text-xs text-blue-600 hover:underline"
					onClick={() => setExpanded(false)}
				>
					Hide
				</button>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full text-xs">
					<thead>
						<tr className="border-b text-muted-foreground">
							<th className="text-left py-1 pr-2 font-medium">Year</th>
							{scenarios.map((sr) => (
								<th
									key={sr.scenario}
									className="text-right py-1 px-1 font-medium"
									style={{ color: SCENARIO_COLORS[sr.scenario] }}
								>
									{SCENARIO_LABELS[sr.scenario]}
								</th>
							))}
							{scenarios.length > 0 && (
								<th className="text-right py-1 pl-2 font-medium text-muted-foreground">
									Stock Price (base)
								</th>
							)}
						</tr>
					</thead>
					<tbody>
						{years.map((year) => (
							<tr key={year} className="border-b last:border-0">
								<td className="py-1 pr-2 font-medium">{year}</td>
								{scenarios.map((sr) => {
									const row = sr.yearlyRows.find((r) => r.year === year);
									return (
										<td
											key={sr.scenario}
											className="py-1 px-1 text-right font-mono"
										>
											{formatCurrency(row?.employeeAfterTaxCash ?? 0)}
										</td>
									);
								})}
								{scenarios.length > 0 && (
									<td className="py-1 pl-2 text-right text-muted-foreground font-mono">
										{formatCurrency(
											result
												.find((sr) => sr.scenario === "base")
												?.yearlyRows.find((r) => r.year === year)?.stockPrice ??
												0,
										)}
									</td>
								)}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
