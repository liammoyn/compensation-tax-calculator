import { Plus, Trash2 } from "lucide-react";
import { COMPONENT_LABELS, formatCurrency } from "../lib/format";
import type { CompComponent, Package } from "../types";
import { CURRENT_YEAR } from "../types";
import { ComponentForm } from "./forms/ComponentForms";
import { Button } from "./ui/button";

const COMPONENT_DEFAULTS: Record<CompComponent["type"], () => CompComponent> = {
	cash_salary: () => ({ type: "cash_salary", annualAmount: 150_000 }),
	cash_bonus: () => ({
		type: "cash_bonus",
		targetAmount: 30_000,
		paymentSchedule: [],
	}),
	rs: () => ({
		type: "rs",
		sharesGranted: 10_000,
		grantDate: `${CURRENT_YEAR}-01-01`,
		grantFMV: 10,
		election83b: false,
		vestingSchedule: [
			{ year: CURRENT_YEAR + 1, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 2, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 3, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 4, month: 1, sharesFraction: 0.25 },
		],
	}),
	rsu: () => ({
		type: "rsu",
		sharesGranted: 10_000,
		grantDate: `${CURRENT_YEAR}-01-01`,
		grantFMV: 50,
		vestingType: "time",
		vestingSchedule: [
			{ year: CURRENT_YEAR + 1, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 2, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 3, month: 1, sharesFraction: 0.25 },
			{ year: CURRENT_YEAR + 4, month: 1, sharesFraction: 0.25 },
		],
	}),
	iso: () => ({
		type: "iso",
		sharesGranted: 10_000,
		strikePrice: 5,
		grantDate: `${CURRENT_YEAR}-01-01`,
		grantFMV: 5,
		expirationDate: `${CURRENT_YEAR + 10}-01-01`,
		exerciseSchedule: [],
	}),
	nqo: () => ({
		type: "nqo",
		sharesGranted: 10_000,
		strikePrice: 5,
		grantDate: `${CURRENT_YEAR}-01-01`,
		grantFMV: 5,
		expirationDate: `${CURRENT_YEAR + 10}-01-01`,
		exerciseSchedule: [],
	}),
};

function componentSummary(c: CompComponent): string {
	switch (c.type) {
		case "cash_salary":
			return `${formatCurrency(c.annualAmount)}/yr`;
		case "cash_bonus":
			return `${formatCurrency(c.targetAmount)} target`;
		case "rs":
			return `${c.sharesGranted.toLocaleString()} shares${c.election83b ? " (83b)" : ""}`;
		case "rsu":
			return `${c.sharesGranted.toLocaleString()} shares`;
		case "iso":
			return `${c.sharesGranted.toLocaleString()} shares @ ${formatCurrency(c.strikePrice)}`;
		case "nqo":
			return `${c.sharesGranted.toLocaleString()} shares @ ${formatCurrency(c.strikePrice)}`;
	}
}

interface Props {
	pkg: Package;
	onChange: (pkg: Package) => void;
	onInfoClick?: (key: string) => void;
}

const ALL_TYPES = Object.keys(COMPONENT_LABELS) as CompComponent["type"][];

export function ComponentBuilder({ pkg, onChange, onInfoClick }: Props) {
	const usedTypes = new Set(pkg.components.map((c) => c.type));
	const availableTypes = ALL_TYPES.filter((t) => !usedTypes.has(t));
	const allFull = availableTypes.length === 0;

	const addComponent = () => {
		if (allFull) return;
		onChange({
			...pkg,
			// biome-ignore lint/style/noNonNullAssertion: allFull guard above ensures availableTypes[0] exists
			components: [...pkg.components, COMPONENT_DEFAULTS[availableTypes[0]!]()],
		});
	};

	const changeComponentType = (i: number, type: CompComponent["type"]) => {
		onChange({
			...pkg,
			components: pkg.components.map((c, idx) =>
				idx === i ? COMPONENT_DEFAULTS[type]() : c,
			),
		});
	};

	const updateComponent = (i: number, component: CompComponent) => {
		onChange({
			...pkg,
			components: pkg.components.map((c, idx) => (idx === i ? component : c)),
		});
	};

	const removeComponent = (i: number) => {
		onChange({
			...pkg,
			components: pkg.components.filter((_, idx) => idx !== i),
		});
	};

	return (
		<div className="space-y-1.5">
			{pkg.components.length === 0 && (
				<p className="text-xs text-muted-foreground/60 italic py-2">
					No components yet.
				</p>
			)}

			{pkg.components.map((component, i) => (
				<div
					key={
						"grantDate" in component
							? `${component.type}-${component.grantDate}`
							: `${component.type}-${i}`
					}
					className="border-l-2 border-l-primary/30 border border-border rounded-lg overflow-hidden"
				>
					<div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 px-3 py-2 bg-muted/50">
						<select
							value={component.type}
							onChange={(e) =>
								changeComponentType(i, e.target.value as CompComponent["type"])
							}
							className="text-xs font-medium rounded border border-border bg-background px-2 py-1 focus:outline-none focus:ring-1 focus:ring-ring"
						>
							<option value={component.type}>
								{COMPONENT_LABELS[component.type]}
							</option>
							{ALL_TYPES.filter((t) => !usedTypes.has(t)).map((type) => (
								<option key={type} value={type}>
									{COMPONENT_LABELS[type]}
								</option>
							))}
						</select>
						<span className="text-xs text-muted-foreground font-mono text-left">
							{componentSummary(component)}
						</span>
						<button
							type="button"
							onClick={() => removeComponent(i)}
							className="text-muted-foreground/30 hover:text-destructive p-1 transition-colors"
						>
							<Trash2 className="h-3 w-3" />
						</button>
					</div>
					<div className="px-4 pb-4 pt-3 border-t bg-muted/20">
						<ComponentForm
							component={component}
							onChange={(c) => updateComponent(i, c)}
							onInfoClick={onInfoClick}
						/>
					</div>
				</div>
			))}

			<div className="pt-1">
				<Button
					variant="outline"
					size="sm"
					disabled={allFull}
					className="w-full h-8 text-xs text-muted-foreground border-dashed hover:border-solid hover:text-foreground transition-all disabled:opacity-40 disabled:cursor-not-allowed"
					onClick={addComponent}
				>
					<Plus className="h-3.5 w-3.5 mr-1.5" /> Add Component
				</Button>
			</div>
		</div>
	);
}
