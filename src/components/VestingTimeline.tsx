import { COMPONENT_LABELS, formatCurrency } from "../lib/format";
import type { Package } from "../types";
import { CURRENT_YEAR } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const TRACK_COLORS: Record<string, string> = {
	cash_salary: "#22c55e",
	cash_bonus: "#14b8a6",
	rs: "#a855f7",
	rsu: "#3b82f6",
	iso: "#f97316",
	nqo: "#ef4444",
};

interface Props {
	packages: Package[];
}

function TimelineBar({
	startYear,
	endYear,
	minYear,
	totalYears,
	color,
	label,
	events,
}: {
	startYear: number;
	endYear: number;
	minYear: number;
	totalYears: number;
	color: string;
	label: string;
	events: Array<{ year: number; month: number; label: string }>;
}) {
	const left = ((startYear - minYear) / totalYears) * 100;
	const width = ((endYear - startYear + 1) / totalYears) * 100;

	return (
		<div className="relative h-8 flex items-center">
			{/* Bar */}
			<div
				className="absolute h-5 rounded opacity-30"
				style={{
					left: `${left}%`,
					width: `${Math.max(width, 1)}%`,
					backgroundColor: color,
				}}
			/>
			{/* Events */}
			{events.map((e, _i) => {
				const pos =
					((e.year + (e.month - 1) / 12 - minYear) / totalYears) * 100;
				return (
					<div
						key={`${e.year}-${e.month}-${e.label}`}
						className="absolute flex flex-col items-center"
						style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
						title={`${e.label} (${e.year}/${e.month})`}
					>
						<div
							className="w-2.5 h-2.5 rounded-full border-2 border-white"
							style={{ backgroundColor: color }}
						/>
					</div>
				);
			})}
			<span
				className="absolute left-1 text-xs font-medium truncate max-w-[90px]"
				style={{ color }}
			>
				{label}
			</span>
		</div>
	);
}

export function VestingTimeline({ packages }: Props) {
	if (packages.length === 0) {
		return (
			<Card>
				<CardContent className="py-12 text-center text-muted-foreground text-sm">
					No packages. Add packages in the Builder tab.
				</CardContent>
			</Card>
		);
	}

	const allYears: number[] = [CURRENT_YEAR];
	packages.forEach((pkg) => {
		pkg.components.forEach((c) => {
			if (c.type === "rs" || c.type === "rsu") {
				for (const e of c.vestingSchedule) {
					allYears.push(e.year);
				}
			}
			if (c.type === "iso" || c.type === "nqo") {
				for (const e of c.exerciseSchedule) {
					allYears.push(e.year);
				}
				allYears.push(new Date(c.expirationDate).getFullYear());
			}
			if (c.type === "cash_salary" || c.type === "cash_bonus") {
				allYears.push(CURRENT_YEAR + pkg.horizon - 1);
			}
		});
	});

	const minYear = Math.min(...allYears);
	const maxYear = Math.max(...allYears);
	const totalYears = Math.max(maxYear - minYear + 1, 1);
	const yearMarkers = Array.from({ length: totalYears }, (_, i) => minYear + i);

	return (
		<div className="space-y-6">
			{packages.map((pkg) => (
				<Card key={pkg.id}>
					<CardHeader className="pb-2">
						<CardTitle className="text-base">{pkg.name}</CardTitle>
					</CardHeader>
					<CardContent>
						{pkg.components.length === 0 && (
							<p className="text-sm text-muted-foreground italic">
								No components in this package.
							</p>
						)}
						{pkg.components.length > 0 && (
							<div className="overflow-x-auto">
								<div className="min-w-[500px]">
									{/* Year ruler */}
									<div className="relative h-6 flex items-end pb-1 border-b mb-2">
										{yearMarkers.map((y) => (
											<div
												key={y}
												className="absolute text-xs text-muted-foreground"
												style={{
													left: `${((y - minYear) / totalYears) * 100}%`,
													transform: "translateX(-50%)",
												}}
											>
												{y}
											</div>
										))}
									</div>

									{/* Component tracks */}
									<div className="space-y-1">
										{pkg.components.map((c, ci) => {
											const color = TRACK_COLORS[c.type] ?? "#94a3b8";
											const label = COMPONENT_LABELS[c.type];
											const componentKey =
												"grantDate" in c
													? `${c.type}-${c.grantDate}`
													: `${c.type}-${ci}`;

											if (c.type === "cash_salary" || c.type === "cash_bonus") {
												return (
													<TimelineBar
														key={componentKey}
														startYear={CURRENT_YEAR}
														endYear={CURRENT_YEAR + pkg.horizon - 1}
														minYear={minYear}
														totalYears={totalYears}
														color={color}
														label={label}
														events={[]}
													/>
												);
											}

											if (c.type === "rs" || c.type === "rsu") {
												const grantYear = new Date(c.grantDate).getFullYear();
												const lastVest =
													c.vestingSchedule.length > 0
														? Math.max(...c.vestingSchedule.map((e) => e.year))
														: grantYear + 4;
												const events = c.vestingSchedule.map((e) => ({
													year: e.year,
													month: e.month,
													label: `Vest ${(e.sharesFraction * c.sharesGranted).toFixed(0)} shares`,
												}));
												if (c.type === "rs" && c.election83b) {
													events.unshift({
														year: grantYear,
														month: new Date(c.grantDate).getMonth() + 1,
														label: "83(b) income",
													});
												}
												return (
													<TimelineBar
														key={componentKey}
														startYear={grantYear}
														endYear={lastVest}
														minYear={minYear}
														totalYears={totalYears}
														color={color}
														label={label}
														events={events}
													/>
												);
											}

											if (c.type === "iso" || c.type === "nqo") {
												const grantYear = new Date(c.grantDate).getFullYear();
												const expirationYear = new Date(
													c.expirationDate,
												).getFullYear();
												const events = c.exerciseSchedule.map((e) => ({
													year: e.year,
													month: e.month,
													label: `Exercise ${(e.sharesFraction * c.sharesGranted).toFixed(0)} shares`,
												}));
												events.push({
													year: expirationYear,
													month: new Date(c.expirationDate).getMonth() + 1,
													label: "Expiration",
												});
												return (
													<TimelineBar
														key={componentKey}
														startYear={grantYear}
														endYear={expirationYear}
														minYear={minYear}
														totalYears={totalYears}
														color={color}
														label={`${label} (${c.sharesGranted.toLocaleString()} sh @ ${formatCurrency(c.strikePrice)})`}
														events={events}
													/>
												);
											}

											return null;
										})}
									</div>

									{/* Legend */}
									<div className="mt-4 flex flex-wrap gap-3">
										{Array.from(new Set(pkg.components.map((c) => c.type))).map(
											(type) => (
												<div key={type} className="flex items-center gap-1.5">
													<div
														className="w-3 h-3 rounded-sm"
														style={{ backgroundColor: TRACK_COLORS[type] }}
													/>
													<span className="text-xs text-muted-foreground">
														{COMPONENT_LABELS[type]}
													</span>
												</div>
											),
										)}
										<div className="flex items-center gap-1.5">
											<div className="w-3 h-3 rounded-full border-2 border-gray-400 bg-gray-400" />
											<span className="text-xs text-muted-foreground">
												Event
											</span>
										</div>
									</div>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			))}
		</div>
	);
}
