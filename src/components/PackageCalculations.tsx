import { useMemo, useState } from "react";
import { npv } from "../engine/npv";
import { computeMarginalNPV } from "../engine/sensitivity";
import { employeeFicaEffective } from "../engine/tax";
import { formatCurrency, formatPercent } from "../lib/format";
import type {
	CashBonus,
	CashSalary,
	CompComponent,
	ISO,
	NQO,
	Package,
	PackageResult,
	RestrictedStock,
	RSU,
	ScenarioResult,
	TaxInputs,
} from "../types";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "./ui/tooltip";

type Mode = "variables" | "numbers";

const COMPONENT_LABELS: Record<CompComponent["type"], string> = {
	cash_salary: "Cash Salary",
	cash_bonus: "Cash Bonus",
	rs: "Restricted Stock",
	rsu: "RSU",
	iso: "ISO",
	nqo: "NQO",
};

function calcComponentNPV(
	baseResult: ScenarioResult,
	type: CompComponent["type"],
	rate: number,
): number {
	const flows = baseResult.yearlyRows.map((row) =>
		row.componentBreakdown
			.filter((c) => c.componentType === type)
			.reduce((s, c) => s + c.employeeAfterTaxCash, 0),
	);
	return npv(flows, rate);
}

function sub(content: string) {
	return <sub className="text-[0.65em]">{content}</sub>;
}
function sup(content: string) {
	return <sup className="text-[0.65em]">{content}</sup>;
}

function Tt({
	children,
	description,
}: {
	children: React.ReactNode;
	description: string;
}) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<span className="underline decoration-dotted decoration-muted-foreground/40 cursor-help">
					{children}
				</span>
			</TooltipTrigger>
			<TooltipContent side="top">{description}</TooltipContent>
		</Tooltip>
	);
}

interface FormulaBlockProps {
	component: CompComponent;
	mode: Mode;
	pkg: Package;
	taxInputs: TaxInputs;
	basePrice: number;
	ficaEff: number;
	baseResult: ScenarioResult;
}

function FormulaBlock({
	component,
	mode,
	pkg,
	taxInputs,
	basePrice,
	ficaEff,
	baseResult,
}: FormulaBlockProps) {
	const v = mode === "variables";
	const {
		federalOrdinaryRate: tF,
		stateOrdinaryRate: tS,
		employeeDiscountRate: r,
	} = taxInputs;

	const compNPV = calcComponentNPV(baseResult, component.type, r);

	// Tooltip-wrapped formula terms
	const term = (sym: React.ReactNode, val: string, desc: string) => (
		<Tt description={desc}>{v ? sym : val}</Tt>
	);

	const tauF = term(
		<>τ{sub("f")}</>,
		formatPercent(tF),
		"Federal ordinary income rate",
	);
	const tauS = term(
		<>τ{sub("s")}</>,
		formatPercent(tS),
		"State ordinary income rate",
	);
	const tauFica = term(
		<>τ{sub("fica")}</>,
		formatPercent(ficaEff),
		"FICA effective rate (blended, employee)",
	);
	const p0 = term(
		<>P{sub("0")}</>,
		formatCurrency(basePrice),
		"Base price per share",
	);
	const gP = term(
		<>g{sub("p")}</>,
		formatPercent(pkg.scenarioGrowthRates.base),
		"Stock growth rate (base scenario)",
	);

	const taxMult = (
		<>
			{" × (1 − "}
			{tauF}
			{" − "}
			{tauS}
			{" − "}
			{tauFica}
			{")"}
		</>
	);

	const stockPriceLine = (
		<div className="font-mono text-sm text-foreground/80">
			P{sub("n")}
			{" = "}
			{p0}
			{" × (1 + "}
			{gP}
			{")"}
			{sup("n")}
		</div>
	);

	let formulaLines: React.ReactNode;

	switch (component.type) {
		case "cash_salary": {
			const c = component as CashSalary;
			const s0 = term(
				<>S{sub("0")}</>,
				formatCurrency(c.annualAmount),
				"Annual base salary",
			);
			const gS = term(
				<>g{sub("s")}</>,
				formatPercent(pkg.salaryGrowthRates.base),
				"Salary growth rate (base scenario)",
			);
			formulaLines = (
				<div className="font-mono text-sm text-foreground/80">
					CF{sub("n")}
					{" = "}
					{s0}
					{" × (1 + "}
					{gS}
					{")"}
					{sup("n−1")}
					{taxMult}
				</div>
			);
			break;
		}
		case "cash_bonus": {
			const c = component as CashBonus;
			const b0 = term(
				<>B{sub("0")}</>,
				formatCurrency(c.targetAmount),
				"Target annual bonus",
			);
			const gB = term(
				<>g{sub("b")}</>,
				formatPercent(pkg.bonusGrowthRates.base),
				"Bonus growth rate (base scenario)",
			);
			formulaLines = (
				<div className="space-y-1">
					<div className="font-mono text-sm text-foreground/80">
						B{sub("n")}
						{" = "}
						{b0}
						{" × (1 + "}
						{gB}
						{")"}
						{sup("n−1")}
					</div>
					<div className="font-mono text-sm text-foreground/80">
						CF{sub("n")}
						{" = "}B{sub("n")}
						{v ? (
							<>
								{" × f"}
								{sub("n")}
							</>
						) : null}
						{taxMult}
					</div>
					{v && (
						<div className="text-xs text-muted-foreground/60 mt-1">
							f{sub("n")} = fraction of bonus paid in year n (from payment
							schedule)
						</div>
					)}
				</div>
			);
			break;
		}
		case "rsu": {
			const c = component as RSU;
			if (c.vestingType === "double_trigger") {
				formulaLines = (
					<div className="space-y-1">
						<div className="font-mono text-sm text-foreground/80">
							P{sub("L")}
							{" = "}
							{p0}
							{" × (1 + "}
							{gP}
							{")"}
							{sup("L")}
						</div>
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("L")}
							{" = "}P{sub("L")}
							{" × N"}
							{sub("vest")}
							{taxMult}
						</div>
						{v && (
							<div className="text-xs text-muted-foreground/60 mt-1">
								L = liquidity event year
								{c.liquidityEventYear ? ` (${c.liquidityEventYear})` : ""}; N
								{sub("vest")} = total service-vested shares settled at L
							</div>
						)}
					</div>
				);
			} else {
				formulaLines = (
					<div className="space-y-1">
						{stockPriceLine}
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("n")}
							{" = "}P{sub("n")}
							{" × N"}
							{sub("n")}
							{taxMult}
						</div>
						{v && (
							<div className="text-xs text-muted-foreground/60 mt-1">
								N{sub("n")} = shares vesting in year n (from vesting schedule)
							</div>
						)}
					</div>
				);
			}
			break;
		}
		case "rs": {
			const c = component as RestrictedStock;
			const ltcgRate = taxInputs.federalLTCGRate + taxInputs.stateLTCGRate;
			const tauLtcg = term(
				<>τ{sub("ltcg")}</>,
				formatPercent(ltcgRate),
				"Effective LTCG rate (federal + state)",
			);
			if (c.election83b) {
				const pGrant = term(
					<>P{sub("grant")}</>,
					formatCurrency(c.grantFMV),
					"FMV per share at grant date",
				);
				const nTotal = term(
					<>N{sub("total")}</>,
					c.sharesGranted.toLocaleString(),
					"Total shares granted",
				);
				formulaLines = (
					<div className="space-y-1">
						<div className="font-mono text-sm text-muted-foreground/60 italic">
							Year 0 (grant): ordinary income on all shares
						</div>
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("grant")}
							{" = "}
							{pGrant}
							{" × "}
							{nTotal}
							{taxMult}
						</div>
						<div className="font-mono text-sm text-muted-foreground/60 italic mt-1">
							At each vest: LTCG on appreciation
						</div>
						{stockPriceLine}
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("n")}
							{" = ("}P{sub("n")}
							{" − "}
							{pGrant}
							{") × N"}
							{sub("n")}
							{" × (1 − "}
							{tauLtcg}
							{")"}
						</div>
					</div>
				);
			} else {
				formulaLines = (
					<div className="space-y-1">
						{stockPriceLine}
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("n")}
							{" = "}P{sub("n")}
							{" × N"}
							{sub("n")}
							{taxMult}
						</div>
						{v && (
							<div className="text-xs text-muted-foreground/60 mt-1">
								N{sub("n")} = shares vesting in year n; ordinary income at each
								vest date
							</div>
						)}
					</div>
				);
			}
			break;
		}
		case "iso":
		case "nqo": {
			const c = component as ISO | NQO;
			const label = component.type === "iso" ? "ISO" : "NQO";
			const kStrike = term(
				<>K{sub(label)}</>,
				formatCurrency(c.strikePrice),
				`${label} strike price`,
			);
			formulaLines = (
				<div className="space-y-1">
					{stockPriceLine}
					<div className="font-mono text-sm text-foreground/80">
						Spread{sub("n")}
						{" = ("}P{sub("n")}
						{" − "}
						{kStrike}
						{") × E"}
						{sub("n")}
					</div>
					<div className="font-mono text-sm text-foreground/80">
						CF{sub("n")}
						{" = Spread"}
						{sub("n")}
						{taxMult}
					</div>
					{v && (
						<div className="text-xs text-muted-foreground/60 mt-1">
							E{sub("n")} = shares exercised in year n
							{component.type === "iso"
								? "; assumes disqualifying disposition"
								: null}
						</div>
					)}
				</div>
			);
			break;
		}
		default:
			formulaLines = null;
	}

	return (
		<div className="border border-border/40 rounded-lg overflow-hidden">
			<div className="bg-muted/30 px-3 py-2 border-b border-border/30 flex items-center justify-between">
				<span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
					{COMPONENT_LABELS[component.type]}
				</span>
				<span className="text-xs font-mono text-muted-foreground/60">
					NPV contribution: {formatCurrency(compNPV)}
				</span>
			</div>
			<div className="px-3 py-2.5">{formulaLines}</div>
		</div>
	);
}

type MarginalMode = "absolute" | "pct";

interface LegendRow {
	symbol: React.ReactNode;
	description: string;
	value: string;
	marginalNPVAbsolute: string | null;
	marginalNPVPct: string | null;
}

function formatMarginal(delta: number): string {
	const abs = formatCurrency(Math.abs(delta));
	return delta >= 0 ? `+${abs}` : `−${abs}`;
}

function formatMarginalPct(pct: number): string {
	const abs = Math.abs(pct).toFixed(2);
	return pct >= 0 ? `+${abs}%` : `−${abs}%`;
}

function buildLegend(
	pkg: Package,
	taxInputs: TaxInputs,
	basePrice: number,
	ficaEff: number,
	baseEmployeeNPV: number,
): LegendRow[] {
	type NudgeFactory = (delta: number) => (p: Package, t: TaxInputs) => { pkg: Package; taxInputs: TaxInputs };

	// Compute both display modes from a single nudge factory.
	// absoluteDelta: the fixed-unit nudge (+0.01 for rates, +1 for dollars, +1 for T)
	// pctDelta: 1% of the current value, or null when a % nudge isn't meaningful (e.g. T)
	const computeBoth = (
		absoluteDelta: number,
		pctDelta: number | null,
		factory: NudgeFactory,
	): { marginalNPVAbsolute: string; marginalNPVPct: string | null } => {
		const absChange = computeMarginalNPV(pkg, taxInputs, factory(absoluteDelta), baseEmployeeNPV);
		let pct: string | null = null;
		if (pctDelta !== null && baseEmployeeNPV !== 0) {
			const pctChange = computeMarginalNPV(pkg, taxInputs, factory(pctDelta), baseEmployeeNPV);
			pct = formatMarginalPct((pctChange / Math.abs(baseEmployeeNPV)) * 100);
		}
		return { marginalNPVAbsolute: formatMarginal(absChange), marginalNPVPct: pct };
	};

	const none = { marginalNPVAbsolute: null, marginalNPVPct: null } as const;

	const rows: LegendRow[] = [
		{
			symbol: <>P{sub("0")}</>,
			description: "Base price per share",
			value: formatCurrency(basePrice),
			...none,
		},
		{
			symbol: <>g{sub("p")}</>,
			description: "Stock growth rate (base scenario)",
			value: formatPercent(pkg.scenarioGrowthRates.base),
			...computeBoth(
				0.01,
				pkg.scenarioGrowthRates.base * 0.01,
				(d) => (p, t) => ({
					pkg: { ...p, scenarioGrowthRates: { ...p.scenarioGrowthRates, base: p.scenarioGrowthRates.base + d } },
					taxInputs: t,
				}),
			),
		},
	];

	if (pkg.components.some((c) => c.type === "cash_salary")) {
		const c = pkg.components.find((c) => c.type === "cash_salary") as CashSalary;
		rows.push(
			{
				symbol: <>S{sub("0")}</>,
				description: "Annual base salary",
				value: formatCurrency(c.annualAmount),
				...computeBoth(
					1,
					c.annualAmount * 0.01,
					(d) => (p, t) => ({
						pkg: {
							...p,
							components: p.components.map((comp) =>
								comp.type === "cash_salary"
									? { ...comp, annualAmount: (comp as CashSalary).annualAmount + d }
									: comp,
							),
						},
						taxInputs: t,
					}),
				),
			},
			{
				symbol: <>g{sub("s")}</>,
				description: "Salary growth rate (base scenario)",
				value: formatPercent(pkg.salaryGrowthRates.base),
				...computeBoth(
					0.01,
					pkg.salaryGrowthRates.base * 0.01,
					(d) => (p, t) => ({
						pkg: { ...p, salaryGrowthRates: { ...p.salaryGrowthRates, base: p.salaryGrowthRates.base + d } },
						taxInputs: t,
					}),
				),
			},
		);
	}

	if (pkg.components.some((c) => c.type === "cash_bonus")) {
		const c = pkg.components.find((c) => c.type === "cash_bonus") as CashBonus;
		rows.push(
			{
				symbol: <>B{sub("0")}</>,
				description: "Target annual bonus",
				value: formatCurrency(c.targetAmount),
				...computeBoth(
					1,
					c.targetAmount * 0.01,
					(d) => (p, t) => ({
						pkg: {
							...p,
							components: p.components.map((comp) =>
								comp.type === "cash_bonus"
									? { ...comp, targetAmount: (comp as CashBonus).targetAmount + d }
									: comp,
							),
						},
						taxInputs: t,
					}),
				),
			},
			{
				symbol: <>g{sub("b")}</>,
				description: "Bonus growth rate (base scenario)",
				value: formatPercent(pkg.bonusGrowthRates.base),
				...computeBoth(
					0.01,
					pkg.bonusGrowthRates.base * 0.01,
					(d) => (p, t) => ({
						pkg: { ...p, bonusGrowthRates: { ...p.bonusGrowthRates, base: p.bonusGrowthRates.base + d } },
						taxInputs: t,
					}),
				),
			},
		);
	}

	if (pkg.components.some((c) => c.type === "rsu" || c.type === "rs")) {
		rows.push({ symbol: <>N{sub("n")}</>, description: "Shares vesting in year n", value: "from vesting schedule", ...none });
	}

	if (pkg.components.some((c) => c.type === "iso" || c.type === "nqo")) {
		rows.push({ symbol: <>E{sub("n")}</>, description: "Shares exercised in year n", value: "from exercise schedule", ...none });
	}

	if (pkg.components.some((c) => c.type === "iso")) {
		const c = pkg.components.find((c) => c.type === "iso") as ISO;
		rows.push({
			symbol: <>K{sub("ISO")}</>,
			description: "ISO strike price",
			value: formatCurrency(c.strikePrice),
			...computeBoth(
				1,
				c.strikePrice * 0.01,
				(d) => (p, t) => ({
					pkg: {
						...p,
						components: p.components.map((comp) =>
							comp.type === "iso" ? { ...comp, strikePrice: (comp as ISO).strikePrice + d } : comp,
						),
					},
					taxInputs: t,
				}),
			),
		});
	}

	if (pkg.components.some((c) => c.type === "nqo")) {
		const c = pkg.components.find((c) => c.type === "nqo") as NQO;
		rows.push({
			symbol: <>K{sub("NQO")}</>,
			description: "NQO strike price",
			value: formatCurrency(c.strikePrice),
			...computeBoth(
				1,
				c.strikePrice * 0.01,
				(d) => (p, t) => ({
					pkg: {
						...p,
						components: p.components.map((comp) =>
							comp.type === "nqo" ? { ...comp, strikePrice: (comp as NQO).strikePrice + d } : comp,
						),
					},
					taxInputs: t,
				}),
			),
		});
	}

	if (pkg.components.some((c) => c.type === "rs")) {
		const c = pkg.components.find((c) => c.type === "rs") as RestrictedStock;
		if (c.election83b) {
			const combinedLTCG = taxInputs.federalLTCGRate + taxInputs.stateLTCGRate;
			rows.push({
				symbol: <>τ{sub("ltcg")}</>,
				description: "Effective LTCG rate (federal + state)",
				value: formatPercent(combinedLTCG),
				...computeBoth(
					0.01,
					combinedLTCG * 0.01,
					(d) => (p, t) => ({ pkg: p, taxInputs: { ...t, federalLTCGRate: t.federalLTCGRate + d } }),
				),
			});
		}
	}

	rows.push(
		{
			symbol: <>τ{sub("f")}</>,
			description: "Federal ordinary income rate",
			value: formatPercent(taxInputs.federalOrdinaryRate),
			...computeBoth(
				0.01,
				taxInputs.federalOrdinaryRate * 0.01,
				(d) => (p, t) => ({ pkg: p, taxInputs: { ...t, federalOrdinaryRate: t.federalOrdinaryRate + d } }),
			),
		},
		{
			symbol: <>τ{sub("s")}</>,
			description: "State ordinary income rate",
			value: formatPercent(taxInputs.stateOrdinaryRate),
			...computeBoth(
				0.01,
				taxInputs.stateOrdinaryRate * 0.01,
				(d) => (p, t) => ({ pkg: p, taxInputs: { ...t, stateOrdinaryRate: t.stateOrdinaryRate + d } }),
			),
		},
		{
			symbol: <>τ{sub("fica")}</>,
			description: "FICA effective rate (blended, employee)",
			value: formatPercent(ficaEff),
			...none,
		},
		{
			symbol: <>r</>,
			description: "Employee discount rate",
			value: formatPercent(taxInputs.employeeDiscountRate),
			...computeBoth(
				0.01,
				taxInputs.employeeDiscountRate * 0.01,
				(d) => (p, t) => ({ pkg: p, taxInputs: { ...t, employeeDiscountRate: t.employeeDiscountRate + d } }),
			),
		},
		{
			symbol: <>T</>,
			description: "Horizon (years)",
			value: `${pkg.horizon}`,
			// pctDelta null: 1% of an integer horizon is fractional and meaningless
			...computeBoth(1, null, (d) => (p, t) => ({ pkg: { ...p, horizon: p.horizon + d }, taxInputs: t })),
		},
	);

	return rows;
}

interface Props {
	pkg: Package;
	taxInputs: TaxInputs;
	result: PackageResult;
}

export function PackageCalculations({ pkg, taxInputs, result }: Props) {
	const [mode, setMode] = useState<Mode>("variables");
	const [marginalMode, setMarginalMode] = useState<MarginalMode>("absolute");
	const v = mode === "variables";

	const baseResult = result.find((r) => r.scenario === "base");

	const basePrice =
		pkg.sharesOutstanding > 0
			? pkg.companyValuation / pkg.sharesOutstanding
			: 0;

	// Representative $100k income for FICA blending display in legend
	const ficaEff = employeeFicaEffective(100_000, taxInputs);

	const { employeeDiscountRate: r } = taxInputs;

	const legendRows = useMemo(
		() => buildLegend(pkg, taxInputs, basePrice, ficaEff, baseResult?.employeeNPV ?? 0),
		[pkg, taxInputs, basePrice, ficaEff, baseResult?.employeeNPV],
	);

	if (!baseResult) return null;

	return (
		<TooltipProvider delayDuration={150}>
			<div className="space-y-3">
				{/* Mode toggle */}
				<div className="flex items-center justify-end">
					<div className="flex rounded-md border border-border/60 text-xs overflow-hidden">
						<button
							type="button"
							onClick={() => setMode("variables")}
							className={`px-2.5 py-1 transition-colors ${
								mode === "variables"
									? "bg-primary text-primary-foreground font-medium"
									: "bg-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							Variables
						</button>
						<button
							type="button"
							onClick={() => setMode("numbers")}
							className={`px-2.5 py-1 border-l border-border/60 transition-colors ${
								mode === "numbers"
									? "bg-primary text-primary-foreground font-medium"
									: "bg-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							Numbers
						</button>
					</div>
				</div>

				{/* Symbol legend */}
				<div className="border border-border/40 rounded-lg overflow-hidden">
					<div className="bg-muted/30 px-3 py-2 border-b border-border/30">
						<span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
							Symbol Legend
						</span>
					</div>
					<div className="overflow-x-auto">
						<table className="w-full text-xs">
							<thead>
								<tr className="border-b border-border/30">
									<th className="text-left px-3 py-1.5 font-mono font-normal text-muted-foreground/50 w-16">
										Symbol
									</th>
									<th className="text-left px-3 py-1.5 font-normal text-muted-foreground/50">
										Description
									</th>
									<th className="text-right px-3 py-1.5 font-mono font-normal text-muted-foreground/50">
										Value
									</th>
									<th className="text-right px-3 py-1.5 font-normal text-muted-foreground/50">
										<div className="flex items-center justify-end gap-2">
											<Tooltip>
												<TooltipTrigger asChild>
													<span className="cursor-help border-b border-dashed border-muted-foreground/40 whitespace-nowrap">
														Marginal NPV
													</span>
												</TooltipTrigger>
												<TooltipContent side="top" className="max-w-[240px] text-xs">
													{marginalMode === "absolute"
														? "Change in employee NPV (base) from +1pp for rates, +$1 for dollar amounts, or +1yr for horizon."
														: "% change in employee NPV (base) from a +1% change in the variable's current value."}
												</TooltipContent>
											</Tooltip>
											<div className="flex rounded border border-border/60 text-[10px] overflow-hidden">
												<button
													type="button"
													onClick={() => setMarginalMode("absolute")}
													className={`px-1.5 py-0.5 transition-colors ${
														marginalMode === "absolute"
															? "bg-primary text-primary-foreground font-medium"
															: "bg-transparent text-muted-foreground hover:text-foreground"
													}`}
												>
													$Δ
												</button>
												<button
													type="button"
													onClick={() => setMarginalMode("pct")}
													className={`px-1.5 py-0.5 border-l border-border/60 transition-colors ${
														marginalMode === "pct"
															? "bg-primary text-primary-foreground font-medium"
															: "bg-transparent text-muted-foreground hover:text-foreground"
													}`}
												>
													%Δ
												</button>
											</div>
										</div>
									</th>
								</tr>
							</thead>
							<tbody>
								{legendRows.map((row) => (
									<tr
										key={row.description}
										className="border-b border-border/20 last:border-0 hover:bg-muted/20 transition-colors"
									>
										<td className="px-3 py-1 font-mono text-foreground/80">
											{row.symbol}
										</td>
										<td className="px-3 py-1 text-muted-foreground">
											{row.description}
										</td>
										<td className="px-3 py-1 font-mono text-right text-muted-foreground/70">
											{row.value}
										</td>
										{(() => {
											const val = marginalMode === "absolute"
												? row.marginalNPVAbsolute
												: row.marginalNPVPct;
											return (
												<td className={`px-3 py-1 font-mono text-right text-xs ${
													val === null
														? "text-muted-foreground/30"
														: val.startsWith("+")
														? "text-green-600 dark:text-green-400"
														: "text-red-600 dark:text-red-400"
												}`}>
													{val ?? "—"}
												</td>
											);
										})()}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>

				{/* Per-component formula blocks */}
				{pkg.components.map((component) => (
					<FormulaBlock
						key={component.type}
						component={component}
						mode={mode}
						pkg={pkg}
						taxInputs={taxInputs}
						basePrice={basePrice}
						ficaEff={ficaEff}
						baseResult={baseResult}
					/>
				))}

				{/* NPV roll-up */}
				<div className="border border-border/40 rounded-lg overflow-hidden">
					<div className="bg-muted/30 px-3 py-2 border-b border-border/30 flex items-center justify-between">
						<span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
							NPV Roll-up
						</span>
						<span className="text-xs font-mono text-muted-foreground/60">
							Employee NPV: {formatCurrency(baseResult.employeeNPV)}
						</span>
					</div>
					<div className="px-3 py-2.5 space-y-1.5">
						<div className="font-mono text-sm text-foreground/80">
							CF{sub("n")}
							{" = "}Σ (all component cash flows in year n)
						</div>
						<div className="font-mono text-sm text-foreground/80">
							NPV = Σ CF{sub("n")}
							{" / (1 + "}
							<Tt description="Employee discount rate">
								{v ? <>r</> : formatPercent(r)}
							</Tt>
							{")"}
							{sup("n")}
							{" for n = 1 to "}
							<Tt description="Horizon (years)">
								{v ? <>T</> : `${pkg.horizon}`}
							</Tt>
						</div>
						<div className="font-mono text-sm font-semibold text-foreground mt-1 pt-1 border-t border-border/30">
							= {formatCurrency(baseResult.employeeNPV)}
						</div>
					</div>
				</div>
			</div>
		</TooltipProvider>
	);
}
