import { ChevronDown, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { COMPONENT_LABELS, formatCurrency } from "../lib/format";
import type { CompComponent, Package } from "../types";
import { CURRENT_YEAR } from "../types";
import { ComponentForm } from "./forms/ComponentForms";
import { Button } from "./ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "./ui/collapsible";

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

const BADGE_COLORS: Record<CompComponent["type"], string> = {
	cash_salary: "bg-green-100 text-green-800",
	cash_bonus: "bg-teal-100 text-teal-800",
	rs: "bg-purple-100 text-purple-800",
	rsu: "bg-blue-100 text-blue-800",
	iso: "bg-orange-100 text-orange-800",
	nqo: "bg-red-100 text-red-800",
};

interface Props {
	pkg: Package;
	onChange: (pkg: Package) => void;
}

export function ComponentBuilder({ pkg, onChange }: Props) {
	const [openComponents, setOpenComponents] = useState<Set<number>>(new Set());
	const [showMenu, setShowMenu] = useState(false);

	const toggleComponent = (i: number) => {
		setOpenComponents((prev) => {
			const next = new Set(prev);
			if (next.has(i)) next.delete(i);
			else next.add(i);
			return next;
		});
	};

	const addComponent = (type: CompComponent["type"]) => {
		const newComponent = COMPONENT_DEFAULTS[type]();
		const newComponents = [...pkg.components, newComponent];
		onChange({ ...pkg, components: newComponents });
		setOpenComponents((prev) => new Set([...prev, newComponents.length - 1]));
		setShowMenu(false);
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
		setOpenComponents((prev) => {
			const next = new Set<number>();
			prev.forEach((j) => {
				if (j < i) next.add(j);
				else if (j > i) next.add(j - 1);
			});
			return next;
		});
	};

	return (
		<div className="space-y-2">
			{pkg.components.length === 0 && (
				<p className="text-sm text-muted-foreground italic py-2">
					No components yet — add comp components below.
				</p>
			)}

			{pkg.components.map((component, i) => (
				<Collapsible
					key={
						"grantDate" in component
							? `${component.type}-${component.grantDate}`
							: `${component.type}-${i}`
					}
					open={openComponents.has(i)}
					onOpenChange={() => toggleComponent(i)}
				>
					<div className="border rounded-lg overflow-hidden">
						<CollapsibleTrigger asChild>
							<button
								type="button"
								className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-muted/50 transition-colors"
							>
								<div className="flex items-center gap-2">
									{openComponents.has(i) ? (
										<ChevronDown className="h-3.5 w-3.5" />
									) : (
										<ChevronRight className="h-3.5 w-3.5" />
									)}
									<span
										className={`text-xs font-medium px-2 py-0.5 rounded-full ${BADGE_COLORS[component.type]}`}
									>
										{COMPONENT_LABELS[component.type]}
									</span>
									<span className="text-sm text-muted-foreground">
										{componentSummary(component)}
									</span>
								</div>
								<button
									type="button"
									onClick={(e) => {
										e.stopPropagation();
										removeComponent(i);
									}}
									className="text-muted-foreground hover:text-destructive p-1"
								>
									<Trash2 className="h-3.5 w-3.5" />
								</button>
							</button>
						</CollapsibleTrigger>
						<CollapsibleContent>
							<div className="px-4 pb-4 pt-2 border-t bg-muted/20">
								<ComponentForm
									component={component}
									onChange={(c) => updateComponent(i, c)}
								/>
							</div>
						</CollapsibleContent>
					</div>
				</Collapsible>
			))}

			<div className="relative">
				<Button
					variant="outline"
					size="sm"
					className="w-full"
					onClick={() => setShowMenu(!showMenu)}
				>
					<Plus className="h-4 w-4 mr-1" /> Add Component
				</Button>
				{showMenu && (
					<div className="absolute top-full left-0 z-10 mt-1 w-48 rounded-md border bg-popover shadow-md">
						{(Object.keys(COMPONENT_LABELS) as CompComponent["type"][]).map(
							(type) => (
								<button
									type="button"
									key={type}
									className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
									onClick={() => addComponent(type)}
								>
									<span
										className={`text-xs px-1.5 py-0.5 rounded-full ${BADGE_COLORS[type]}`}
									>
										{COMPONENT_LABELS[type]}
									</span>
								</button>
							),
						)}
					</div>
				)}
			</div>
		</div>
	);
}
