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
		<div className="space-y-1">
			<Label className="text-xs text-muted-foreground" title={tooltip}>
				{label}
			</Label>
			<div className="relative">
				<Input
					className="pr-7 h-8 text-sm"
					value={(value * 100).toFixed(2)}
					onChange={(e) => {
						const n = parseFloat(e.target.value) / 100;
						if (!Number.isNaN(n)) onChange({ ...taxInputs, [field]: n });
					}}
				/>
				<span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
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
		<div className="space-y-1">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			<div className="relative">
				<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
					$
				</span>
				<Input
					className="pl-5 h-8 text-sm"
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
			<Card>
				<CardHeader className="pb-2">
					<CollapsibleTrigger asChild>
						<button
							type="button"
							className="flex w-full items-center justify-between text-left"
						>
							<CardTitle className="text-base">Global Tax Inputs</CardTitle>
							<div className="flex items-center gap-3">
								{!open && (
									<span className="text-xs text-muted-foreground">
										{summary}
									</span>
								)}
								{open ? (
									<ChevronDown className="h-4 w-4" />
								) : (
									<ChevronRight className="h-4 w-4" />
								)}
							</div>
						</button>
					</CollapsibleTrigger>
				</CardHeader>
				<CollapsibleContent>
					<CardContent className="pt-0">
						<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
							<PctField
								label="Federal Ordinary Rate"
								field="federalOrdinaryRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Marginal federal rate on wages and ordinary income"
							/>
							<PctField
								label="Federal LTCG Rate"
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
								label="Additional Medicare"
								field="additionalMedicareRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="0.9% employee-only above threshold"
							/>
							<DollarField
								label="Add. Medicare Threshold"
								field="additionalMedicareThreshold"
								taxInputs={taxInputs}
								onChange={onChange}
							/>
							<PctField
								label="State Ordinary Rate"
								field="stateOrdinaryRate"
								taxInputs={taxInputs}
								onChange={onChange}
							/>
							<PctField
								label="State LTCG Rate"
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
								label="Employee Discount Rate"
								field="employeeDiscountRate"
								taxInputs={taxInputs}
								onChange={onChange}
								tooltip="Employee required rate of return for NPV"
							/>
							<PctField
								label="Employer Discount Rate"
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

						<div className="mt-4 flex flex-wrap gap-6">
							<div className="flex items-center gap-2">
								<Switch
									id="niit-toggle"
									checked={taxInputs.niitAlwaysOn}
									onCheckedChange={(v) =>
										onChange({ ...taxInputs, niitAlwaysOn: v })
									}
								/>
								<Label htmlFor="niit-toggle" className="text-sm cursor-pointer">
									NIIT always on (include 3.8% in LTCG rate)
								</Label>
							</div>
							<div className="flex items-center gap-2">
								<Switch
									id="162m-toggle"
									checked={taxInputs.section162mApplies}
									onCheckedChange={(v) =>
										onChange({ ...taxInputs, section162mApplies: v })
									}
								/>
								<Label htmlFor="162m-toggle" className="text-sm cursor-pointer">
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
