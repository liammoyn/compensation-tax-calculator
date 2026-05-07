import { Download, Plus, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ComparisonView } from "./components/ComparisonView";
import { GlobalTaxPanel } from "./components/GlobalTaxPanel";
import { InfoPanel } from "./components/InfoPanel";
import { PackageCard } from "./components/PackageCard";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { VestingTimeline } from "./components/VestingTimeline";
import { store } from "./store";
import type { Package, TaxInputs } from "./types";
import { CURRENT_YEAR, DEFAULT_TAX_INPUTS } from "./types";

function newPackage(): Package {
	return {
		id: crypto.randomUUID(),
		name: `Package ${CURRENT_YEAR}`,
		companyValuation: 1_000_000_000,
		sharesOutstanding: 10_000_000,
		scenarioGrowthRates: { downside: 0, base: 0.1, upside: 0.3 },
		salaryGrowthRates: { downside: 0, base: 0.03, upside: 0.05 },
		bonusGrowthRates: { downside: 0, base: 0.03, upside: 0.05 },
		components: [],
		horizon: 4,
	};
}

export function App() {
	const [packages, setPackages] = useState<Package[]>([]);
	const [globalTaxInputs, setGlobalTaxInputs] =
		useState<TaxInputs>(DEFAULT_TAX_INPUTS);
	const [loading, setLoading] = useState(true);
	const [infoPanelField, setInfoPanelField] = useState<keyof TaxInputs | null>(
		null,
	);

	const pkgSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);
	const taxSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		Promise.all([store.getAllPackages(), store.getGlobalTaxInputs()])
			.then(([pkgs, tax]) => {
				setPackages(pkgs);
				setGlobalTaxInputs(tax);
				setLoading(false);
			})
			.catch(() => setLoading(false));
	}, []);

	const updatePackage = useCallback((pkg: Package) => {
		setPackages((prev) => prev.map((p) => (p.id === pkg.id ? pkg : p)));
		const existing = pkgSaveTimers.current.get(pkg.id);
		if (existing) clearTimeout(existing);
		pkgSaveTimers.current.set(
			pkg.id,
			setTimeout(() => store.upsertPackage(pkg), 500),
		);
	}, []);

	const addPackage = () => {
		const pkg = newPackage();
		setPackages((prev) => [...prev, pkg]);
		store.upsertPackage(pkg);
	};

	const deletePackage = (id: string) => {
		setPackages((prev) => prev.filter((p) => p.id !== id));
		store.deletePackage(id);
	};

	const duplicatePackage = (pkg: Package) => {
		const copy: Package = {
			...pkg,
			id: crypto.randomUUID(),
			name: `${pkg.name} (copy)`,
		};
		setPackages((prev) => [...prev, copy]);
		store.upsertPackage(copy);
	};

	const updateTaxInputs = (tax: TaxInputs) => {
		setGlobalTaxInputs(tax);
		if (taxSaveTimer.current) clearTimeout(taxSaveTimer.current);
		taxSaveTimer.current = setTimeout(() => store.setGlobalTaxInputs(tax), 500);
	};

	const exportAll = () => {
		const blob = new Blob(
			[JSON.stringify({ packages, globalTaxInputs }, null, 2)],
			{ type: "application/json" },
		);
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "comp-packages.json";
		a.click();
		URL.revokeObjectURL(url);
	};

	const importAll = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const data = JSON.parse(ev.target?.result as string);
				if (data.packages) {
					setPackages(data.packages);
					for (const p of data.packages as Package[]) {
						store.upsertPackage(p);
					}
				}
				if (data.globalTaxInputs) {
					setGlobalTaxInputs(data.globalTaxInputs);
					store.setGlobalTaxInputs(data.globalTaxInputs);
				}
			} catch {
				alert("Invalid JSON file");
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-muted-foreground text-sm">Loading…</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background w-full">
			<InfoPanel
				field={infoPanelField}
				onClose={() => setInfoPanelField(null)}
			/>
			<header className="border-b bg-card/90 backdrop-blur sticky top-0 z-20">
				<div className="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="w-1 h-8 rounded-full bg-primary" />
						<div>
							<h1 className="text-sm font-semibold tracking-tight leading-tight">
								Compensation Package Evaluator
							</h1>
							<p className="text-[11px] text-muted-foreground tracking-wide">
								After-tax value · employer cost · NPV analysis
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="ghost"
							size="sm"
							onClick={exportAll}
							className="gap-1.5 text-xs h-7 px-3 text-muted-foreground hover:text-foreground"
						>
							<Download className="h-3 w-3" /> Export
						</Button>
						<label>
							<Button variant="ghost" size="sm" asChild>
								<span className="gap-1.5 cursor-pointer text-xs h-7 px-3 text-muted-foreground hover:text-foreground">
									<Upload className="h-3 w-3" /> Import
								</span>
							</Button>
							<input
								type="file"
								accept=".json"
								className="hidden"
								onChange={importAll}
							/>
						</label>
					</div>
				</div>
			</header>

			<div className="max-w-7xl mx-auto px-5 py-6">
				<Tabs defaultValue="builder">
					<TabsList className="mb-6 h-9 bg-muted/60">
						<TabsTrigger value="builder" className="text-xs tracking-wide">
							Builder
						</TabsTrigger>
						<TabsTrigger value="compare" className="text-xs tracking-wide">
							Compare
						</TabsTrigger>
						<TabsTrigger value="timeline" className="text-xs tracking-wide">
							Timeline
						</TabsTrigger>
					</TabsList>

					<TabsContent value="builder">
						<div className="space-y-4">
							<GlobalTaxPanel
								taxInputs={globalTaxInputs}
								onChange={updateTaxInputs}
								onInfoClick={setInfoPanelField}
							/>
							<div className="space-y-4">
								{packages.map((pkg) => (
									<PackageCard
										key={pkg.id}
										pkg={pkg}
										globalTaxInputs={globalTaxInputs}
										onChange={updatePackage}
										onDelete={() => deletePackage(pkg.id)}
										onDuplicate={() => duplicatePackage(pkg)}
										onInfoClick={setInfoPanelField}
									/>
								))}
							</div>
							<Button
								onClick={addPackage}
								className="w-full gap-2 border-dashed hover:border-solid transition-all text-muted-foreground hover:text-foreground h-9 text-xs tracking-wide"
								variant="outline"
							>
								<Plus className="h-3.5 w-3.5" /> Add Package
							</Button>
							{packages.length === 0 && (
								<div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg">
									<p className="text-sm font-medium mb-1">No packages yet</p>
									<p className="text-xs">
										Click "Add Package" to start evaluating compensation offers.
									</p>
								</div>
							)}
						</div>
					</TabsContent>

					<TabsContent value="compare">
						<ComparisonView
							packages={packages}
							globalTaxInputs={globalTaxInputs}
						/>
					</TabsContent>

					<TabsContent value="timeline">
						<VestingTimeline packages={packages} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export default App;
