import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { evaluatePackage } from "../engine";
import { formatCurrency } from "../lib/format";
import type { Package, TaxInputs } from "../types";
import { ComponentBuilder } from "./ComponentBuilder";
import { GlobalTaxPanel } from "./GlobalTaxPanel";
import { PackageResultSummary } from "./PackageResultSummary";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";

function toRaw(r: { downside: number; base: number; upside: number }) {
	return {
		downside: (r.downside * 100).toFixed(1),
		base: (r.base * 100).toFixed(1),
		upside: (r.upside * 100).toFixed(1),
	};
}

function ScenarioRateFields({
	label,
	rates,
	onChange,
}: {
	label: string;
	rates: { downside: number; base: number; upside: number };
	onChange: (r: { downside: number; base: number; upside: number }) => void;
}) {
	const [raw, setRaw] = useState(toRaw(rates));
	const [focused, setFocused] = useState<string | null>(null);

	useEffect(() => {
		if (!focused) setRaw(toRaw(rates));
	}, [rates, focused]);

	return (
		<div className="space-y-1.5">
			<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
				{label}
			</Label>
			<div className="grid grid-cols-3 gap-1">
				{(["downside", "base", "upside"] as const).map((s) => (
					<div key={s} className="relative">
						<Input
							className="h-7 text-xs pr-4 font-mono"
							value={raw[s]}
							onChange={(e) =>
								setRaw((prev) => ({ ...prev, [s]: e.target.value }))
							}
							onFocus={() => setFocused(s)}
							onBlur={() => {
								setFocused(null);
								const n = parseFloat(raw[s]) / 100;
								onChange({ ...rates, [s]: Number.isNaN(n) ? 0 : n });
							}}
						/>
						<span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground/60 font-mono">
							%
						</span>
					</div>
				))}
				<div className="text-[10px] text-muted-foreground/50 text-center pt-0.5 font-mono">
					↓ dn
				</div>
				<div className="text-[10px] text-muted-foreground/50 text-center pt-0.5 font-mono">
					base
				</div>
				<div className="text-[10px] text-muted-foreground/50 text-center pt-0.5 font-mono">
					↑↑ up
				</div>
			</div>
		</div>
	);
}

interface Props {
	pkg: Package;
	globalTaxInputs: TaxInputs;
	onChange: (pkg: Package) => void;
	onDelete: () => void;
	onDuplicate: () => void;
}

export function PackageCard({
	pkg,
	globalTaxInputs,
	onChange,
	onDelete,
	onDuplicate,
}: Props) {
	const [taxOverrideOpen, setTaxOverrideOpen] = useState(false);
	const [settingsOpen, setSettingsOpen] = useState(true);

	const result = useMemo(
		() => evaluatePackage(pkg, globalTaxInputs),
		[pkg, globalTaxInputs],
	);

	const basePrice =
		pkg.sharesOutstanding > 0
			? pkg.companyValuation / pkg.sharesOutstanding
			: 0;

	return (
		<Card className="overflow-hidden shadow-none border">
			<CardHeader className="pb-0 pt-4 px-5">
				<div className="flex items-center gap-3">
					<Input
						className="text-base font-semibold border-0 shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent tracking-tight"
						value={pkg.name}
						onChange={(e) => onChange({ ...pkg, name: e.target.value })}
					/>
					<div className="flex items-center gap-0.5 ml-auto">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
							onClick={onDuplicate}
							title="Duplicate"
						>
							<Copy className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
							onClick={onDelete}
							title="Delete"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-5 pb-5 space-y-4 pt-3">
				{/* Package Settings */}
				<Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
					<CollapsibleTrigger className="flex w-full items-center gap-1.5 group">
						{settingsOpen ? (
							<ChevronDown className="h-3 w-3 text-muted-foreground/50" />
						) : (
							<ChevronRight className="h-3 w-3 text-muted-foreground/50" />
						)}
						<span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
							Package Settings
						</span>
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-3 space-y-4 bg-muted/30 rounded-lg px-3 py-3">
							<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div className="space-y-1.5">
									<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
										Company Valuation
									</Label>
									<div className="relative">
										<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">
											$
										</span>
										<Input
											className="pl-6 h-8 text-sm font-mono"
											value={pkg.companyValuation.toLocaleString("en-US")}
											onChange={(e) => {
												const n = parseFloat(e.target.value.replace(/,/g, ""));
												if (!Number.isNaN(n))
													onChange({ ...pkg, companyValuation: n });
											}}
										/>
									</div>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
										Shares Outstanding
									</Label>
									<Input
										className="h-8 text-sm font-mono"
										value={pkg.sharesOutstanding.toLocaleString("en-US")}
										onChange={(e) => {
											const n = parseFloat(e.target.value.replace(/,/g, ""));
											if (!Number.isNaN(n))
												onChange({ ...pkg, sharesOutstanding: n });
										}}
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
										Base Price / Share
									</Label>
									<Input
										className="h-8 text-sm font-mono bg-muted/50 text-muted-foreground"
										value={formatCurrency(basePrice)}
										readOnly
									/>
								</div>
								<div className="space-y-1.5">
									<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
										Horizon (yrs)
									</Label>
									<Input
										className="h-8 text-sm font-mono"
										type="number"
										min={1}
										max={10}
										value={pkg.horizon}
										onChange={(e) =>
											onChange({
												...pkg,
												horizon: Math.max(
													1,
													Math.min(10, parseInt(e.target.value, 10) || 4),
												),
											})
										}
									/>
								</div>
							</div>

							<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
								<ScenarioRateFields
									label="Stock Price Growth (%/yr)"
									rates={pkg.scenarioGrowthRates}
									onChange={(r) => onChange({ ...pkg, scenarioGrowthRates: r })}
								/>
								<ScenarioRateFields
									label="Salary Growth (%/yr)"
									rates={pkg.salaryGrowthRates}
									onChange={(r) => onChange({ ...pkg, salaryGrowthRates: r })}
								/>
								<ScenarioRateFields
									label="Bonus Growth (%/yr)"
									rates={pkg.bonusGrowthRates}
									onChange={(r) => onChange({ ...pkg, bonusGrowthRates: r })}
								/>
							</div>
						</div>
					</CollapsibleContent>
				</Collapsible>

				{/* Per-package tax override */}
				<Collapsible open={taxOverrideOpen} onOpenChange={setTaxOverrideOpen}>
					<CollapsibleTrigger className="flex w-full items-center gap-1.5 group">
						{taxOverrideOpen ? (
							<ChevronDown className="h-3 w-3 text-muted-foreground/50" />
						) : (
							<ChevronRight className="h-3 w-3 text-muted-foreground/50" />
						)}
						<span className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
							Tax Override
						</span>
						{pkg.taxInputs && (
							<span className="text-[10px] text-primary font-semibold tracking-wide uppercase">
								· Active
							</span>
						)}
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-3 space-y-3">
							<div className="flex items-center gap-2.5">
								<Switch
									id={`tax-override-${pkg.id}`}
									checked={!!pkg.taxInputs}
									onCheckedChange={(v) =>
										onChange({
											...pkg,
											taxInputs: v ? { ...globalTaxInputs } : undefined,
										})
									}
								/>
								<Label
									htmlFor={`tax-override-${pkg.id}`}
									className="text-xs cursor-pointer text-muted-foreground"
								>
									Override global tax assumptions for this package
								</Label>
							</div>
							{pkg.taxInputs && (
								<GlobalTaxPanel
									taxInputs={pkg.taxInputs}
									onChange={(t) => onChange({ ...pkg, taxInputs: t })}
								/>
							)}
						</div>
					</CollapsibleContent>
				</Collapsible>

				<Separator className="opacity-50" />

				{/* Component Builder */}
				<div className="space-y-2.5 rounded-lg px-3 py-3 border border-border/50">
					<p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
						Compensation Components
					</p>
					<ComponentBuilder pkg={pkg} onChange={onChange} />
				</div>

				{/* Results */}
				{pkg.components.length > 0 && (
					<>
						<Separator className="opacity-50" />
						<div className="space-y-3 bg-accent/20 rounded-lg px-3 py-3">
							<p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/60">
								Results
							</p>
							<PackageResultSummary result={result} />
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
