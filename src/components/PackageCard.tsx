import { ChevronDown, ChevronRight, Copy, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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

function ScenarioRateFields({
	label,
	rates,
	onChange,
}: {
	label: string;
	rates: { downside: number; base: number; upside: number };
	onChange: (r: { downside: number; base: number; upside: number }) => void;
}) {
	return (
		<div className="space-y-1">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<div className="grid grid-cols-3 gap-1">
				{(["downside", "base", "upside"] as const).map((s) => (
					<div key={s} className="relative">
						<Input
							className="h-7 text-xs pr-5"
							value={(rates[s] * 100).toFixed(1)}
							onChange={(e) => {
								const n = parseFloat(e.target.value) / 100;
								if (!Number.isNaN(n)) onChange({ ...rates, [s]: n });
							}}
						/>
						<span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
							%
						</span>
					</div>
				))}
				<div className="text-xs text-muted-foreground text-center">↓ dn</div>
				<div className="text-xs text-muted-foreground text-center">↑ base</div>
				<div className="text-xs text-muted-foreground text-center">↑↑ up</div>
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
		<Card className="overflow-hidden">
			<CardHeader className="pb-0 pt-3 px-4">
				<div className="flex items-center gap-2">
					<Input
						className="text-base font-semibold border-0 shadow-none p-0 h-auto focus-visible:ring-0 bg-transparent"
						value={pkg.name}
						onChange={(e) => onChange({ ...pkg, name: e.target.value })}
					/>
					<div className="flex items-center gap-1 ml-auto">
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7"
							onClick={onDuplicate}
							title="Duplicate"
						>
							<Copy className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 text-muted-foreground hover:text-destructive"
							onClick={onDelete}
							title="Delete"
						>
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			</CardHeader>

			<CardContent className="px-4 pb-4 space-y-4">
				{/* Package Settings */}
				<Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
					<CollapsibleTrigger className="flex w-full items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">
						{settingsOpen ? (
							<ChevronDown className="h-3.5 w-3.5" />
						) : (
							<ChevronRight className="h-3.5 w-3.5" />
						)}
						Package Settings
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-3 space-y-3">
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										Company Valuation
									</Label>
									<div className="relative">
										<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
											$
										</span>
										<Input
											className="pl-5 h-8 text-sm"
											value={pkg.companyValuation.toLocaleString("en-US")}
											onChange={(e) => {
												const n = parseFloat(e.target.value.replace(/,/g, ""));
												if (!Number.isNaN(n))
													onChange({ ...pkg, companyValuation: n });
											}}
										/>
									</div>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										Shares Outstanding
									</Label>
									<Input
										className="h-8 text-sm"
										value={pkg.sharesOutstanding.toLocaleString("en-US")}
										onChange={(e) => {
											const n = parseFloat(e.target.value.replace(/,/g, ""));
											if (!Number.isNaN(n))
												onChange({ ...pkg, sharesOutstanding: n });
										}}
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										Base Price / Share
									</Label>
									<Input
										className="h-8 text-sm bg-muted"
										value={formatCurrency(basePrice)}
										readOnly
									/>
								</div>
								<div className="space-y-1">
									<Label className="text-xs text-muted-foreground">
										Horizon (years)
									</Label>
									<Input
										className="h-8 text-sm"
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

							<div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
					<CollapsibleTrigger className="flex w-full items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
						{taxOverrideOpen ? (
							<ChevronDown className="h-3.5 w-3.5" />
						) : (
							<ChevronRight className="h-3.5 w-3.5" />
						)}
						Per-Package Tax Override
						{pkg.taxInputs && (
							<span className="text-xs text-blue-600 font-normal">
								(active)
							</span>
						)}
					</CollapsibleTrigger>
					<CollapsibleContent>
						<div className="mt-2 space-y-2">
							<div className="flex items-center gap-2">
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
									className="text-sm cursor-pointer"
								>
									Override global tax inputs for this package
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

				<Separator />

				{/* Component Builder */}
				<div className="space-y-2">
					<p className="text-sm font-medium">Compensation Components</p>
					<ComponentBuilder pkg={pkg} onChange={onChange} />
				</div>

				{/* Results */}
				{pkg.components.length > 0 && (
					<>
						<Separator />
						<div className="space-y-2">
							<p className="text-sm font-medium">Results</p>
							<PackageResultSummary result={result} />
						</div>
					</>
				)}
			</CardContent>
		</Card>
	);
}
