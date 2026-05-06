import { useMemo, useState } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { evaluatePackage } from "../engine";
import { formatCurrency, formatCurrencyCompact } from "../lib/format";
import type { Package, TaxInputs } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const PKG_COLORS = ["#3b82f6", "#f59e0b", "#22c55e", "#ef4444"];
const SCENARIO_STROKE = { downside: "2 4", base: "0", upside: "4 2" };
const SCENARIO_LABELS = { downside: "↓", base: "●", upside: "↑" };

interface Props {
	packages: Package[];
	globalTaxInputs: TaxInputs;
}

export function ComparisonView({ packages, globalTaxInputs }: Props) {
	const [selectedIds, setSelectedIds] = useState<string[]>([]);

	const visiblePackages = packages.filter((p) => selectedIds.includes(p.id));
	const results = useMemo(
		() =>
			visiblePackages.map((p) => ({
				pkg: p,
				result: evaluatePackage(p, globalTaxInputs),
			})),
		[visiblePackages, globalTaxInputs],
	);

	const togglePkg = (id: string) => {
		setSelectedIds((prev) =>
			prev.includes(id)
				? prev.filter((x) => x !== id)
				: prev.length < 4
					? [...prev, id]
					: prev,
		);
	};

	// Build NPV comparison data
	const _npvData = results.flatMap(({ pkg, result }) =>
		result.map((sr) => ({
			pkg: pkg.name,
			scenario: sr.scenario,
			employeeNPV: sr.employeeNPV,
			employerNPVCost: sr.employerNPVCost,
			color: PKG_COLORS[visiblePackages.indexOf(pkg)],
		})),
	);

	// Build chart data (year-by-year lines)
	const allYears = results[0]?.result[0]?.yearlyRows.map((r) => r.year) ?? [];
	const lineData = allYears.map((year) => {
		const row: Record<string, number | string> = { year };
		results.forEach(({ pkg, result }, _pi) => {
			result.forEach((sr) => {
				const yearRow = sr.yearlyRows.find((r) => r.year === year);
				row[`${pkg.name}_${sr.scenario}`] = yearRow?.employeeAfterTaxCash ?? 0;
			});
		});
		return row;
	});

	return (
		<div className="space-y-6">
			{/* Package Selector */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-base">
						Select Packages to Compare (up to 4)
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex flex-wrap gap-2">
						{packages.map((pkg, _i) => (
							<button
								type="button"
								key={pkg.id}
								onClick={() => togglePkg(pkg.id)}
								className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
									selectedIds.includes(pkg.id)
										? "text-white border-transparent"
										: "bg-background text-muted-foreground border-border hover:bg-muted"
								}`}
								style={
									selectedIds.includes(pkg.id)
										? {
												backgroundColor:
													PKG_COLORS[selectedIds.indexOf(pkg.id)],
											}
										: {}
								}
							>
								{pkg.name}
							</button>
						))}
					</div>
					{packages.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No packages created yet. Add packages in the Builder tab.
						</p>
					)}
				</CardContent>
			</Card>

			{visiblePackages.length === 0 && packages.length > 0 && (
				<p className="text-sm text-muted-foreground text-center py-8">
					Select packages above to compare.
				</p>
			)}

			{visiblePackages.length > 0 && (
				<>
					{/* NPV Summary Table */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">NPV Summary</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="overflow-x-auto">
								<table className="w-full text-sm">
									<thead>
										<tr className="border-b text-muted-foreground">
											<th className="text-left py-2 pr-4 font-medium">
												Package
											</th>
											<th className="text-left py-2 pr-4 font-medium">
												Scenario
											</th>
											<th className="text-right py-2 px-2 font-medium">
												Employee NPV
											</th>
											<th className="text-right py-2 px-2 font-medium">
												Employer NPV Cost
											</th>
										</tr>
									</thead>
									<tbody>
										{results.map(({ pkg, result }, pi) =>
											result.map((sr) => (
												<tr
													key={`${pkg.id}-${sr.scenario}`}
													className="border-b last:border-0"
												>
													<td className="py-1.5 pr-4">
														<span
															className="inline-block w-2.5 h-2.5 rounded-full mr-2"
															style={{ backgroundColor: PKG_COLORS[pi] }}
														/>
														{pkg.name}
													</td>
													<td className="py-1.5 pr-4 text-muted-foreground capitalize">
														{sr.scenario}
													</td>
													<td className="py-1.5 px-2 text-right font-mono font-medium">
														{formatCurrency(sr.employeeNPV)}
													</td>
													<td className="py-1.5 px-2 text-right font-mono text-muted-foreground">
														{formatCurrency(sr.employerNPVCost)}
													</td>
												</tr>
											)),
										)}
									</tbody>
								</table>
							</div>
						</CardContent>
					</Card>

					{/* Multi-line cash flow chart */}
					<Card>
						<CardHeader className="pb-2">
							<CardTitle className="text-base">
								Year-by-Year After-Tax Cash Flow
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ResponsiveContainer width="100%" height={280}>
								<LineChart
									data={lineData}
									margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
								>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis dataKey="year" tick={{ fontSize: 11 }} />
									<YAxis
										tickFormatter={(v) => formatCurrencyCompact(v)}
										tick={{ fontSize: 10 }}
										width={60}
									/>
									<Tooltip formatter={(v: number) => formatCurrency(v)} />
									<Legend />
									{results.map(({ pkg }, pi) =>
										(["downside", "base", "upside"] as const).map(
											(scenario) => (
												<Line
													key={`${pkg.id}-${scenario}`}
													type="monotone"
													dataKey={`${pkg.name}_${scenario}`}
													stroke={PKG_COLORS[pi]}
													strokeDasharray={SCENARIO_STROKE[scenario]}
													strokeWidth={scenario === "base" ? 2.5 : 1.5}
													dot={false}
													name={`${pkg.name} ${SCENARIO_LABELS[scenario]}`}
												/>
											),
										),
									)}
								</LineChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
