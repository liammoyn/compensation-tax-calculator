import { AlertTriangle } from "lucide-react";
import type React from "react";
import { isoShareSplit } from "../../engine/iso";
import type {
	CashBonus,
	CashSalary,
	CompComponent,
	ISO,
	NQO,
	RestrictedStock,
	RSU,
} from "../../types";
import { CURRENT_YEAR } from "../../types";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import {
	ExerciseScheduleEditor,
	PaymentScheduleEditor,
	VestingScheduleEditor,
} from "./ScheduleEditors";

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1">
			<Label className="text-xs text-muted-foreground">{label}</Label>
			{children}
		</div>
	);
}

function DollarInput({
	value,
	onChange,
}: {
	value: number;
	onChange: (v: number) => void;
}) {
	return (
		<div className="relative">
			<span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
				$
			</span>
			<Input
				className="pl-5 h-8 text-sm"
				value={value.toLocaleString("en-US")}
				onChange={(e) => {
					const n = parseFloat(e.target.value.replace(/,/g, ""));
					if (!Number.isNaN(n)) onChange(n);
				}}
			/>
		</div>
	);
}

// --- Cash Salary ---

export function CashSalaryForm({
	component,
	onChange,
}: {
	component: CashSalary;
	onChange: (c: CashSalary) => void;
}) {
	return (
		<div className="space-y-3">
			<Field label="Annual Base Salary">
				<DollarInput
					value={component.annualAmount}
					onChange={(v) => onChange({ ...component, annualAmount: v })}
				/>
			</Field>
		</div>
	);
}

// --- Cash Bonus ---

export function CashBonusForm({
	component,
	onChange,
}: {
	component: CashBonus;
	onChange: (c: CashBonus) => void;
}) {
	return (
		<div className="space-y-3">
			<Field label="Target Bonus Amount (annual)">
				<DollarInput
					value={component.targetAmount}
					onChange={(v) => onChange({ ...component, targetAmount: v })}
				/>
			</Field>
			<PaymentScheduleEditor
				schedule={component.paymentSchedule}
				onChange={(schedule) =>
					onChange({ ...component, paymentSchedule: schedule })
				}
			/>
		</div>
	);
}

// --- Restricted Stock ---

export function RestrictedStockForm({
	component,
	onChange,
}: {
	component: RestrictedStock;
	onChange: (c: RestrictedStock) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted">
					<Input
						className="h-8 text-sm"
						type="number"
						value={component.sharesGranted}
						onChange={(e) =>
							onChange({
								...component,
								sharesGranted: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</Field>
				<Field label="Grant FMV per Share">
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
			</div>
			<div className="flex items-center gap-2">
				<Switch
					id="rs-83b"
					checked={component.election83b}
					onCheckedChange={(v) => onChange({ ...component, election83b: v })}
				/>
				<Label htmlFor="rs-83b" className="text-sm cursor-pointer">
					83(b) Election filed at grant
				</Label>
			</div>
			{component.election83b && (
				<p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
					With 83(b): ordinary income recognized on all shares at grant;
					subsequent vests trigger LTCG on appreciation.
				</p>
			)}
			<VestingScheduleEditor
				schedule={component.vestingSchedule}
				onChange={(schedule) =>
					onChange({ ...component, vestingSchedule: schedule })
				}
				sharesGranted={component.sharesGranted}
			/>
		</div>
	);
}

// --- RSU ---

export function RSUForm({
	component,
	onChange,
}: {
	component: RSU;
	onChange: (c: RSU) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted">
					<Input
						className="h-8 text-sm"
						type="number"
						value={component.sharesGranted}
						onChange={(e) =>
							onChange({
								...component,
								sharesGranted: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</Field>
				<Field label="Grant FMV per Share">
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Vesting Type">
					<Select
						value={component.vestingType}
						onValueChange={(v) =>
							onChange({
								...component,
								vestingType: v as "time" | "double_trigger",
							})
						}
					>
						<SelectTrigger className="h-8 text-sm">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="time">Time-based</SelectItem>
							<SelectItem value="double_trigger">Double-trigger</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				{component.vestingType === "double_trigger" && (
					<Field label="Liquidity Event Year">
						<Input
							className="h-8 text-sm"
							type="number"
							value={component.liquidityEventYear ?? CURRENT_YEAR + 2}
							onChange={(e) =>
								onChange({
									...component,
									liquidityEventYear: parseInt(e.target.value, 10) || undefined,
								})
							}
						/>
					</Field>
				)}
			</div>
			{component.vestingType === "double_trigger" && (
				<p className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
					Double-trigger: taxable event deferred to the liquidity event year.
					Shares settled (and taxed) at FMV on the liquidity event date.
				</p>
			)}
			<VestingScheduleEditor
				schedule={component.vestingSchedule}
				onChange={(schedule) =>
					onChange({ ...component, vestingSchedule: schedule })
				}
				sharesGranted={component.sharesGranted}
			/>
		</div>
	);
}

// --- ISO ---

export function ISOForm({
	component,
	onChange,
}: {
	component: ISO;
	onChange: (c: ISO) => void;
}) {
	const { isoShares, nqoShares } = isoShareSplit(
		component.sharesGranted,
		component.grantFMV,
	);
	const over100k = nqoShares > 0;
	const grantYear = new Date(component.grantDate).getFullYear();
	const expirationYear = new Date(component.expirationDate).getFullYear();
	const exceedsExpiry = expirationYear > grantYear + 10;

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted">
					<Input
						className="h-8 text-sm"
						type="number"
						value={component.sharesGranted}
						onChange={(e) =>
							onChange({
								...component,
								sharesGranted: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</Field>
				<Field label="Strike Price per Share">
					<DollarInput
						value={component.strikePrice}
						onChange={(v) => onChange({ ...component, strikePrice: v })}
					/>
				</Field>
				<Field label="Grant FMV per Share">
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Expiration Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.expirationDate}
						onChange={(e) =>
							onChange({ ...component, expirationDate: e.target.value })
						}
					/>
				</Field>
			</div>

			{over100k && (
				<div className="flex gap-2 items-start p-2 bg-yellow-50 rounded text-xs text-yellow-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					§100k limit: {isoShares.toLocaleString()} shares qualify as ISO;{" "}
					{nqoShares.toLocaleString()} treated as NQO at calculation time.
				</div>
			)}
			{exceedsExpiry && (
				<div className="flex gap-2 items-start p-2 bg-yellow-50 rounded text-xs text-yellow-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					ISOs may not have a term exceeding 10 years from grant date.
				</div>
			)}
			{component.strikePrice > component.grantFMV && (
				<div className="flex gap-2 items-start p-2 bg-yellow-50 rounded text-xs text-yellow-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					Strike price exceeds FMV — unusual for ISOs; may fail §422 fair market
					value requirement.
				</div>
			)}
			<div className="p-2 bg-blue-50 rounded text-xs text-blue-700">
				v1 models all ISO exercises as disqualifying dispositions
				(sell-on-exercise). Exercise-and-hold qualified disposition treatment is
				in v1.1.
			</div>
			<div className="p-2 bg-muted rounded text-xs text-muted-foreground">
				For private companies: strike price should reflect a 409A valuation
				(typically ~1/3 of preferred stock value).
			</div>
			<ExerciseScheduleEditor
				schedule={component.exerciseSchedule}
				onChange={(schedule) =>
					onChange({ ...component, exerciseSchedule: schedule })
				}
				sharesGranted={component.sharesGranted}
			/>
		</div>
	);
}

// --- NQO ---

export function NQOForm({
	component,
	onChange,
}: {
	component: NQO;
	onChange: (c: NQO) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted">
					<Input
						className="h-8 text-sm"
						type="number"
						value={component.sharesGranted}
						onChange={(e) =>
							onChange({
								...component,
								sharesGranted: parseFloat(e.target.value) || 0,
							})
						}
					/>
				</Field>
				<Field label="Strike Price per Share">
					<DollarInput
						value={component.strikePrice}
						onChange={(v) => onChange({ ...component, strikePrice: v })}
					/>
				</Field>
				<Field label="Grant FMV per Share">
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Expiration Date">
					<Input
						className="h-8 text-sm"
						type="date"
						value={component.expirationDate}
						onChange={(e) =>
							onChange({ ...component, expirationDate: e.target.value })
						}
					/>
				</Field>
			</div>
			<ExerciseScheduleEditor
				schedule={component.exerciseSchedule}
				onChange={(schedule) =>
					onChange({ ...component, exerciseSchedule: schedule })
				}
				sharesGranted={component.sharesGranted}
			/>
		</div>
	);
}

// --- Dispatcher ---

export function ComponentForm({
	component,
	onChange,
}: {
	component: CompComponent;
	onChange: (c: CompComponent) => void;
}) {
	switch (component.type) {
		case "cash_salary":
			return <CashSalaryForm component={component} onChange={onChange} />;
		case "cash_bonus":
			return <CashBonusForm component={component} onChange={onChange} />;
		case "rs":
			return <RestrictedStockForm component={component} onChange={onChange} />;
		case "rsu":
			return <RSUForm component={component} onChange={onChange} />;
		case "iso":
			return <ISOForm component={component} onChange={onChange} />;
		case "nqo":
			return <NQOForm component={component} onChange={onChange} />;
	}
}
