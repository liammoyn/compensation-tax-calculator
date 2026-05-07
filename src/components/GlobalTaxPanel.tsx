import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { TAX_INPUT_INFO } from "../docs/taxAssumptionInfo";
import { formatPercent } from "../lib/format";
import type { TaxInputs } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

interface Props {
	taxInputs: TaxInputs;
	onChange: (taxInputs: TaxInputs) => void;
	onInfoClick?: (key: string) => void;
}

function PctField({
	label,
	field,
	taxInputs,
	onChange,
	tooltip,
	onInfoClick,
}: {
	label: string;
	field: keyof TaxInputs;
	taxInputs: TaxInputs;
	onChange: (t: TaxInputs) => void;
	tooltip?: string;
	onInfoClick?: (key: string) => void;
}) {
	const committedValue = taxInputs[field] as number;
	const [raw, setRaw] = useState((committedValue * 100).toFixed(2));
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setRaw((committedValue * 100).toFixed(2));
	}, [committedValue, focused]);

	const hasInfo = field in TAX_INPUT_INFO;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-1">
				<Label
					className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70"
					title={tooltip}
				>
					{label}
				</Label>
				{hasInfo && onInfoClick && (
					<button
						type="button"
						onClick={() => onInfoClick(field)}
						className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
						aria-label={`Info about ${label}`}
					>
						<Info className="h-3 w-3" />
					</button>
				)}
			</div>
			<div className="relative">
				<Input
					className="pr-7 h-8 text-sm font-mono"
					value={raw}
					onChange={(e) => setRaw(e.target.value)}
					onFocus={() => setFocused(true)}
					onBlur={() => {
						setFocused(false);
						const n = parseFloat(raw) / 100;
						if (!Number.isNaN(n)) {
							onChange({ ...taxInputs, [field]: n });
						} else {
							onChange({ ...taxInputs, [field]: 0 });
						}
					}}
				/>
				<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">
					%
				</span>
			</div>
		</div>
	);
}

function DollarField({
	label,
	field,
	taxInputs,
	onChange,
	onInfoClick,
}: {
	label: string;
	field: keyof TaxInputs;
	taxInputs: TaxInputs;
	onChange: (t: TaxInputs) => void;
	onInfoClick?: (key: string) => void;
}) {
	const value = taxInputs[field] as number;
	const hasInfo = field in TAX_INPUT_INFO;

	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-1">
				<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
					{label}
				</Label>
				{hasInfo && onInfoClick && (
					<button
						type="button"
						onClick={() => onInfoClick(field)}
						className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
						aria-label={`Info about ${label}`}
					>
						<Info className="h-3 w-3" />
					</button>
				)}
			</div>
			<div className="relative">
				<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">
					$
				</span>
				<Input
					className="pl-6 h-8 text-sm font-mono"
					value={value.toLocaleString("en-US")}
					onChange={(e) => {
						const n = parseFloat(e.target.value.replace(/,/g, ""));
						if (!Number.isNaN(n)) onChange({ ...taxInputs, [field]: n });
					}}
				/>
			</div>
		</div>
	);
}

export function GlobalTaxPanel({ taxInputs, onChange, onInfoClick }: Props) {
	const [open, setOpen] = useState(true);

	const summary = `Fed ${formatPercent(taxInputs.federalOrdinaryRate)} | LTCG ${formatPercent(taxInputs.federalLTCGRate)} | State ${formatPercent(taxInputs.stateOrdinaryRate)} | FICA ${formatPercent(taxInputs.ficaRate)}`;

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<Card className="shadow-none">
				<CardHeader className="pb-2 px-5 pt-4">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-between text-left group"
						>
							<div className="flex items-center gap-2">
								<CardTitle className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
									Tax Assumptions
								</CardTitle>
							</div>
							<div className="flex items-center gap-3">
								{!open && (
									<span className="text-[11px] text-muted-foreground font-mono">
										{summary}
									</span>
								)}
								{open ? (
									<ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
								) : (
									<ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
								)}
							</div>
						</button>
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="pt-0 px-5 pb-5">
						<div className="grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							<PctField
								label="Federal Ordinary"
								field="federalOrdinaryRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Marginal federal rate on wages and ordinary income"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="Federal LTCG"
								field="federalLTCGRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="0%, 15%, or 20%"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="AMT Rate"
								field="amtRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="26% or 28% (reserved for v1.1 ISO qualified disposition)"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="FICA Rate"
								field="ficaRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employee-side FICA: 7.65% up to SS wage base, 1.45% above"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="Add. Medicare"
								field="additionalMedicareRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="0.9% employee-only above threshold"
								onInfoClick={onInfoClick}
							/>
							<DollarField
								label="Medicare Threshold"
								field="additionalMedicareThreshold"
								taxInputs={taxInputs}
								onChange={onChange}
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="State Ordinary"
								field="stateOrdinaryRate"
								taxInputs={taxInputs}
								onChange={onChange}
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="State LTCG"
								field="stateLTCGRate"
								taxInputs={taxInputs}
								onChange={onChange}
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="NIIT Rate"
								field="niitRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Net Investment Income Tax — included when NIIT toggle is on"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="Corporate Rate"
								field="corporateRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employer marginal corporate tax rate"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="Employee Disc. Rate"
								field="employeeDiscountRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employee required rate of return for NPV"
								onInfoClick={onInfoClick}
							/>
							<PctField
								label="Employer Disc. Rate"
								field="employerDiscountRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employer cost of capital for NPV"
								onInfoClick={onInfoClick}
							/>
							<DollarField
								label="SS Wage Base"
								field="ssWageBase"
								taxInputs={taxInputs}
								onChange={onChange}
								onInfoClick={onInfoClick}
							/>
						</div>

						<div className="mt-5 pt-4 border-t flex flex-wrap gap-6">
							<div className="flex items-center gap-2.5">
								<Switch
									id="niit-toggle"
									checked={taxInputs.niitAlwaysOn}
									onCheckedChange={(v) =>
										onChange({ ...taxInputs, niitAlwaysOn: v })
									}
								/>
								<Label
									htmlFor="niit-toggle"
									className="text-xs cursor-pointer text-muted-foreground"
								>
									NIIT always on (include 3.8% in LTCG rate)
								</Label>
								{onInfoClick && (
									<button
										type="button"
										onClick={() => onInfoClick("niitAlwaysOn")}
										className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
										aria-label="Info about NIIT always on"
									>
										<Info className="h-3 w-3" />
									</button>
								)}
							</div>
							<div className="flex items-center gap-2.5">
								<Switch
									id="162m-toggle"
									checked={taxInputs.section162mApplies}
									onCheckedChange={(v) =>
										onChange({ ...taxInputs, section162mApplies: v })
									}
								/>
								<Label
									htmlFor="162m-toggle"
									className="text-xs cursor-pointer text-muted-foreground"
								>
									IRC §162(m) applies (public co. — caps $1M salary deduction)
								</Label>
								{onInfoClick && (
									<button
										type="button"
										onClick={() => onInfoClick("section162mApplies")}
										className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
										aria-label="Info about IRC §162(m)"
									>
										<Info className="h-3 w-3" />
									</button>
								)}
							</div>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
