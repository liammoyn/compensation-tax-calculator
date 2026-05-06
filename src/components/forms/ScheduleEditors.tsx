import { Plus, Trash2 } from "lucide-react";
import type { ExerciseEvent, PaymentEvent, VestEvent } from "../../types";
import { CURRENT_YEAR } from "../../types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

// --- Vesting Schedule Editor ---

interface VestingProps {
	schedule: VestEvent[];
	onChange: (schedule: VestEvent[]) => void;
	sharesGranted: number;
}

export function VestingScheduleEditor({
	schedule,
	onChange,
	sharesGranted,
}: VestingProps) {
	const totalFraction = schedule.reduce((s, e) => s + e.sharesFraction, 0);

	const add = () => {
		onChange([
			...schedule,
			{
				year: CURRENT_YEAR + schedule.length + 1,
				month: 1,
				sharesFraction: 0.25,
			},
		]);
	};

	const update = (i: number, patch: Partial<VestEvent>) => {
		onChange(schedule.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
	};

	const remove = (i: number) =>
		onChange(schedule.filter((_, idx) => idx !== i));

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">
					Vesting Schedule
				</Label>
				<Button
					size="sm"
					variant="outline"
					className="h-6 text-xs px-2"
					onClick={add}
				>
					<Plus className="h-3 w-3 mr-1" /> Add Tranche
				</Button>
			</div>
			{schedule.length === 0 && (
				<p className="text-xs text-muted-foreground italic">
					No vest events — add tranches above.
				</p>
			)}
			{schedule.map((event, i) => (
				<div
					key={`${event.year}-${event.month}`}
					className="flex items-center gap-2"
				>
					<div className="flex-1 grid grid-cols-3 gap-1">
						<div>
							<Label className="text-xs text-muted-foreground">Year</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								value={event.year}
								onChange={(e) =>
									update(i, {
										year: parseInt(e.target.value, 10) || CURRENT_YEAR,
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Month</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								min={1}
								max={12}
								value={event.month}
								onChange={(e) =>
									update(i, {
										month: Math.max(
											1,
											Math.min(12, parseInt(e.target.value, 10) || 1),
										),
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Fraction</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								step="0.01"
								min={0}
								max={1}
								value={event.sharesFraction}
								onChange={(e) =>
									update(i, { sharesFraction: parseFloat(e.target.value) || 0 })
								}
							/>
						</div>
					</div>
					<div className="text-xs text-muted-foreground pt-5 w-20 text-right">
						{Math.round(event.sharesFraction * sharesGranted).toLocaleString()}{" "}
						sh
					</div>
					<button
						type="button"
						onClick={() => remove(i)}
						className="pt-4 text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			))}
			{schedule.length > 0 && (
				<p
					className={`text-xs ${Math.abs(totalFraction - 1) > 0.001 ? "text-yellow-600" : "text-muted-foreground"}`}
				>
					Total fraction: {(totalFraction * 100).toFixed(1)}%
					{Math.abs(totalFraction - 1) > 0.001 && " (should sum to 100%)"}
				</p>
			)}
		</div>
	);
}

// --- Exercise Schedule Editor ---

interface ExerciseProps {
	schedule: ExerciseEvent[];
	onChange: (schedule: ExerciseEvent[]) => void;
	sharesGranted: number;
}

export function ExerciseScheduleEditor({
	schedule,
	onChange,
	sharesGranted,
}: ExerciseProps) {
	const totalFraction = schedule.reduce((s, e) => s + e.sharesFraction, 0);

	const add = () => {
		onChange([
			...schedule,
			{
				year: CURRENT_YEAR + schedule.length + 1,
				month: 1,
				sharesFraction: 0.25,
			},
		]);
	};

	const update = (i: number, patch: Partial<ExerciseEvent>) => {
		onChange(schedule.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
	};

	const remove = (i: number) =>
		onChange(schedule.filter((_, idx) => idx !== i));

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">
					Exercise Schedule
				</Label>
				<Button
					size="sm"
					variant="outline"
					className="h-6 text-xs px-2"
					onClick={add}
				>
					<Plus className="h-3 w-3 mr-1" /> Add Exercise
				</Button>
			</div>
			{schedule.length === 0 && (
				<p className="text-xs text-muted-foreground italic">
					No exercise events — add above.
				</p>
			)}
			{schedule.map((event, i) => (
				<div
					key={`${event.year}-${event.month}`}
					className="flex items-center gap-2"
				>
					<div className="flex-1 grid grid-cols-3 gap-1">
						<div>
							<Label className="text-xs text-muted-foreground">Year</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								value={event.year}
								onChange={(e) =>
									update(i, {
										year: parseInt(e.target.value, 10) || CURRENT_YEAR,
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Month</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								min={1}
								max={12}
								value={event.month}
								onChange={(e) =>
									update(i, {
										month: Math.max(
											1,
											Math.min(12, parseInt(e.target.value, 10) || 1),
										),
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Fraction</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								step="0.01"
								min={0}
								max={1}
								value={event.sharesFraction}
								onChange={(e) =>
									update(i, { sharesFraction: parseFloat(e.target.value) || 0 })
								}
							/>
						</div>
					</div>
					<div className="text-xs text-muted-foreground pt-5 w-20 text-right">
						{Math.round(event.sharesFraction * sharesGranted).toLocaleString()}{" "}
						sh
					</div>
					<button
						type="button"
						onClick={() => remove(i)}
						className="pt-4 text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			))}
			{schedule.length > 0 && (
				<p
					className={`text-xs ${Math.abs(totalFraction - 1) > 0.001 ? "text-yellow-600" : "text-muted-foreground"}`}
				>
					Total fraction: {(totalFraction * 100).toFixed(1)}%
					{Math.abs(totalFraction - 1) > 0.001 && " (should sum to 100%)"}
				</p>
			)}
		</div>
	);
}

// --- Payment Schedule Editor ---

interface PaymentProps {
	schedule: PaymentEvent[];
	onChange: (schedule: PaymentEvent[]) => void;
}

export function PaymentScheduleEditor({ schedule, onChange }: PaymentProps) {
	const add = () => {
		onChange([...schedule, { year: CURRENT_YEAR, month: 12, fraction: 1.0 }]);
	};

	const update = (i: number, patch: Partial<PaymentEvent>) => {
		onChange(schedule.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
	};

	const remove = (i: number) =>
		onChange(schedule.filter((_, idx) => idx !== i));

	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<Label className="text-xs text-muted-foreground">
					Payment Schedule (optional — defaults to year-end)
				</Label>
				<Button
					size="sm"
					variant="outline"
					className="h-6 text-xs px-2"
					onClick={add}
				>
					<Plus className="h-3 w-3 mr-1" /> Add Payment
				</Button>
			</div>
			{schedule.map((event, i) => (
				<div
					key={`${event.year}-${event.month}`}
					className="flex items-center gap-2"
				>
					<div className="flex-1 grid grid-cols-3 gap-1">
						<div>
							<Label className="text-xs text-muted-foreground">Year</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								value={event.year}
								onChange={(e) =>
									update(i, {
										year: parseInt(e.target.value, 10) || CURRENT_YEAR,
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Month</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								min={1}
								max={12}
								value={event.month}
								onChange={(e) =>
									update(i, {
										month: Math.max(
											1,
											Math.min(12, parseInt(e.target.value, 10) || 1),
										),
									})
								}
							/>
						</div>
						<div>
							<Label className="text-xs text-muted-foreground">Fraction</Label>
							<Input
								className="h-7 text-xs"
								type="number"
								step="0.01"
								min={0}
								max={1}
								value={event.fraction}
								onChange={(e) =>
									update(i, { fraction: parseFloat(e.target.value) || 0 })
								}
							/>
						</div>
					</div>
					<button
						type="button"
						onClick={() => remove(i)}
						className="pt-4 text-muted-foreground hover:text-destructive"
					>
						<Trash2 className="h-3.5 w-3.5" />
					</button>
				</div>
			))}
		</div>
	);
}
