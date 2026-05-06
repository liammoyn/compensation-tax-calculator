import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
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
}

function PctField({
	label,
	field,
	taxInputs,
	onChange,
	tooltip,
}: {
	label: string;
	field: keyof TaxInputs;
	taxInputs: TaxInputs;
	onChange: (t: TaxInputs) => void;
	tooltip?: string;
}) {
	const value = taxInputs[field] as number;
	return (
		<div className="space-y-1.5">
			<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70" title={tooltip}>
				{label}
			</Label>
			<div className="relative">
				<Input
					className="pr-7 h-8 text-sm font-mono"
					value={(value * 100).toFixed(2)}
					onChange={(e) => {
						const n = parseFloat(e.target.value) / 100;
						if (!Number.isNaN(n)) onChange({ ...taxInputs, [field]: n });
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
}: {
	label: string;
	field: keyof TaxInputs;
	taxInputs: TaxInputs;
	onChange: (t: TaxInputs) => void;
}) {
	const value = taxInputs[field] as number;
	return (
		<div className="space-y-1.5">
			<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">{label}</Label>
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

export function GlobalTaxPanel({ taxInputs, onChange }: Props) {
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
							/>
							<PctField
								label="Federal LTCG"
								field="federalLTCGRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="0%, 15%, or 20%"
							/>
							<PctField
								label="AMT Rate"
								field="amtRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="26% or 28% (reserved for v1.1 ISO qualified disposition)"
							/>
							<PctField
								label="FICA Rate"
								field="ficaRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employee-side FICA: 7.65% up to SS wage base, 1.45% above"
							/>
							<PctField
								label="Add. Medicare"
								field="additionalMedicareRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="0.9% employee-only above threshold"
							/>
							<DollarField
								label="Medicare Threshold"
								field="additionalMedicareThreshold"
								taxInputs={taxInputs}
								onChange={onChange}
							/>
							<PctField
								label="State Ordinary"
								field="stateOrdinaryRate"
								taxInputs={taxInputs}
								onChange={onChange}
							/>
							<PctField
								label="State LTCG"
								field="stateLTCGRate"
								taxInputs={taxInputs}
								onChange={onChange}
							/>
							<PctField
								label="NIIT Rate"
								field="niitRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Net Investment Income Tax — included when NIIT toggle is on"
							/>
							<PctField
								label="Corporate Rate"
								field="corporateRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employer marginal corporate tax rate"
							/>
							<PctField
								label="Employee Disc. Rate"
								field="employeeDiscountRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employee required rate of return for NPV"
							/>
							<PctField
								label="Employer Disc. Rate"
								field="employerDiscountRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employer cost of capital for NPV"
							/>
							<DollarField
								label="SS Wage Base"
								field="ssWageBase"
								taxInputs={taxInputs}
								onChange={onChange}
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
								<Label htmlFor="niit-toggle" className="text-xs cursor-pointer text-muted-foreground">
									NIIT always on (include 3.8% in LTCG rate)
								</Label>
							</div>
							<div className="flex items-center gap-2.5">
								<Switch
									id="162m-toggle"
									checked={taxInputs.section162mApplies}
									onCheckedChange={(v) =>
										onChange({ ...taxInputs, section162mApplies: v })
									}
								/>
								<Label htmlFor="162m-toggle" className="text-xs cursor-pointer text-muted-foreground">
									IRC §162(m) applies (public co. — caps $1M salary deduction)
								</Label>
							</div>
						</div>
					</CardContent>
				</CollapsibleContent>
			</Card>
		</Collapsible>
	);
}
