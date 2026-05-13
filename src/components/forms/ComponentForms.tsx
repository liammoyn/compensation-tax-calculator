import { AlertTriangle, Info } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
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
	infoKey,
	onInfoClick,
	children,
}: {
	label: string;
	infoKey?: string;
	onInfoClick?: (key: string) => void;
	children: React.ReactNode;
}) {
	return (
		<div className="space-y-1.5">
			<div className="flex items-center gap-1">
				<Label className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/70">
					{label}
				</Label>
				{infoKey && onInfoClick && (
					<button
						type="button"
						onClick={() => onInfoClick(infoKey)}
						className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
						aria-label={`Info about ${label}`}
					>
						<Info className="h-3 w-3" />
					</button>
				)}
			</div>
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
	const [raw, setRaw] = useState(value.toLocaleString("en-US"));
	const [focused, setFocused] = useState(false);

	useEffect(() => {
		if (!focused) setRaw(value.toLocaleString("en-US"));
	}, [value, focused]);

	return (
		<div className="relative">
			<span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground/60 font-mono">
				$
			</span>
			<Input
				className="pl-6 h-8 text-sm font-mono"
				value={raw}
				onChange={(e) => setRaw(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => {
					setFocused(false);
					const n = parseFloat(raw.replace(/,/g, ""));
					onChange(Number.isNaN(n) ? 0 : n);
				}}
			/>
		</div>
	);
}

// --- Cash Salary ---

export function CashSalaryForm({
	component,
	onChange,
	onInfoClick,
}: {
	component: CashSalary;
	onChange: (c: CashSalary) => void;
	onInfoClick?: (key: string) => void;
}) {
	return (
		<div className="space-y-3">
			<Field label="Annual Base Salary" infoKey="comp.annualBaseSalary" onInfoClick={onInfoClick}>
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
	onInfoClick,
}: {
	component: CashBonus;
	onChange: (c: CashBonus) => void;
	onInfoClick?: (key: string) => void;
}) {
	return (
		<div className="space-y-3">
			<Field label="Target Bonus Amount (annual)" infoKey="comp.targetBonusAmount" onInfoClick={onInfoClick}>
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
	onInfoClick,
}: {
	component: RestrictedStock;
	onChange: (c: RestrictedStock) => void;
	onInfoClick?: (key: string) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted" infoKey="comp.sharesGranted" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
				<Field label="Grant FMV per Share" infoKey="comp.grantFMV" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date" infoKey="comp.grantDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
				<Label
					htmlFor="rs-83b"
					className="text-xs cursor-pointer text-muted-foreground"
				>
					83(b) Election filed at grant
				</Label>
				{onInfoClick && (
					<button
						type="button"
						onClick={() => onInfoClick("comp.election83b")}
						className="text-muted-foreground/40 hover:text-muted-foreground transition-colors"
						aria-label="Info about 83(b) Election"
					>
						<Info className="h-3 w-3" />
					</button>
				)}
			</div>
			{component.election83b && (
				<p className="text-xs text-primary/80 bg-accent/60 border border-accent px-3 py-2 rounded-md">
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
	onInfoClick,
}: {
	component: RSU;
	onChange: (c: RSU) => void;
	onInfoClick?: (key: string) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted" infoKey="comp.sharesGranted" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
				<Field label="Grant FMV per Share" infoKey="comp.grantFMV" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date" infoKey="comp.grantDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Vesting Type" infoKey="comp.vestingType" onInfoClick={onInfoClick}>
					<Select
						value={component.vestingType}
						onValueChange={(v) =>
							onChange({
								...component,
								vestingType: v as "time" | "double_trigger",
							})
						}
					>
						<SelectTrigger className="h-8 text-sm font-mono">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="time">Time-based</SelectItem>
							<SelectItem value="double_trigger">Double-trigger</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				{component.vestingType === "double_trigger" && (
					<Field label="Liquidity Event Year" infoKey="comp.liquidityEventYear" onInfoClick={onInfoClick}>
						<Input
							className="h-8 text-sm font-mono"
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
				<p className="text-xs text-primary/80 bg-accent/60 border border-accent px-3 py-2 rounded-md">
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
	onInfoClick,
}: {
	component: ISO;
	onChange: (c: ISO) => void;
	onInfoClick?: (key: string) => void;
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
				<Field label="Shares Granted" infoKey="comp.sharesGranted" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
				<Field label="Strike Price per Share" infoKey="comp.strikePrice" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.strikePrice}
						onChange={(v) => onChange({ ...component, strikePrice: v })}
					/>
				</Field>
				<Field label="Grant FMV per Share" infoKey="comp.grantFMV" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date" infoKey="comp.grantDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Expiration Date" infoKey="comp.expirationDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
						type="date"
						value={component.expirationDate}
						onChange={(e) =>
							onChange({ ...component, expirationDate: e.target.value })
						}
					/>
				</Field>
			</div>

			{over100k && (
				<div className="flex gap-2 items-start px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					§100k limit: {isoShares.toLocaleString()} shares qualify as ISO;{" "}
					{nqoShares.toLocaleString()} treated as NQO at calculation time.
				</div>
			)}
			{exceedsExpiry && (
				<div className="flex gap-2 items-start px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					ISOs may not have a term exceeding 10 years from grant date.
				</div>
			)}
			{component.strikePrice > component.grantFMV && (
				<div className="flex gap-2 items-start px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
					<AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
					Strike price exceeds FMV — unusual for ISOs; may fail §422 fair market
					value requirement.
				</div>
			)}
			<div className="px-3 py-2 bg-accent/60 border border-accent rounded-md text-xs text-primary/70">
				v1 models all ISO exercises as disqualifying dispositions
				(sell-on-exercise). Exercise-and-hold qualified disposition treatment is
				in v1.1.
			</div>
			<div className="px-3 py-2 bg-muted/80 border border-border/50 rounded-md text-xs text-muted-foreground">
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
	onInfoClick,
}: {
	component: NQO;
	onChange: (c: NQO) => void;
	onInfoClick?: (key: string) => void;
}) {
	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<Field label="Shares Granted" infoKey="comp.sharesGranted" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
				<Field label="Strike Price per Share" infoKey="comp.strikePrice" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.strikePrice}
						onChange={(v) => onChange({ ...component, strikePrice: v })}
					/>
				</Field>
				<Field label="Grant FMV per Share" infoKey="comp.grantFMV" onInfoClick={onInfoClick}>
					<DollarInput
						value={component.grantFMV}
						onChange={(v) => onChange({ ...component, grantFMV: v })}
					/>
				</Field>
				<Field label="Grant Date" infoKey="comp.grantDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
						type="date"
						value={component.grantDate}
						onChange={(e) =>
							onChange({ ...component, grantDate: e.target.value })
						}
					/>
				</Field>
				<Field label="Expiration Date" infoKey="comp.expirationDate" onInfoClick={onInfoClick}>
					<Input
						className="h-8 text-sm font-mono"
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
	onInfoClick,
}: {
	component: CompComponent;
	onChange: (c: CompComponent) => void;
	onInfoClick?: (key: string) => void;
}) {
	switch (component.type) {
		case "cash_salary":
			return <CashSalaryForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
		case "cash_bonus":
			return <CashBonusForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
		case "rs":
			return <RestrictedStockForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
		case "rsu":
			return <RSUForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
		case "iso":
			return <ISOForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
		case "nqo":
			return <NQOForm component={component} onChange={onChange} onInfoClick={onInfoClick} />;
	}
}
