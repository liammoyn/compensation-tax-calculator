import { Download, Plus, Upload } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ComparisonView } from "./components/ComparisonView";
import { GlobalTaxPanel } from "./components/GlobalTaxPanel";
import { PackageCard } from "./components/PackageCard";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { VestingTimeline } from "./components/VestingTimeline";
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

async function apiSavePackage(pkg: Package) {
	await fetch("/api/packages", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(pkg),
	});
}

async function apiDeletePackage(id: string) {
	await fetch(`/api/packages/${id}`, { method: "DELETE" });
}

async function apiSaveTaxInputs(taxInputs: TaxInputs) {
	await fetch("/api/tax-inputs", {
		method: "PUT",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(taxInputs),
	});
}

export function App() {
	const [packages, setPackages] = useState<Package[]>([]);
	const [globalTaxInputs, setGlobalTaxInputs] =
		useState<TaxInputs>(DEFAULT_TAX_INPUTS);
	const [loading, setLoading] = useState(true);

	const pkgSaveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
		new Map(),
	);
	const taxSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		Promise.all([
			fetch("/api/packages").then((r) => r.json()),
			fetch("/api/tax-inputs").then((r) => r.json()),
		])
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
			setTimeout(() => apiSavePackage(pkg), 500),
		);
	}, []);

	const addPackage = () => {
		const pkg = newPackage();
		setPackages((prev) => [...prev, pkg]);
		apiSavePackage(pkg);
	};

	const deletePackage = (id: string) => {
		setPackages((prev) => prev.filter((p) => p.id !== id));
		apiDeletePackage(id);
	};

	const duplicatePackage = (pkg: Package) => {
		const copy: Package = {
			...pkg,
			id: crypto.randomUUID(),
			name: `${pkg.name} (copy)`,
		};
		setPackages((prev) => [...prev, copy]);
		apiSavePackage(copy);
	};

	const updateTaxInputs = (tax: TaxInputs) => {
		setGlobalTaxInputs(tax);
		if (taxSaveTimer.current) clearTimeout(taxSaveTimer.current);
		taxSaveTimer.current = setTimeout(() => apiSaveTaxInputs(tax), 500);
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
						apiSavePackage(p);
					}
				}
				if (data.globalTaxInputs) {
					setGlobalTaxInputs(data.globalTaxInputs);
					apiSaveTaxInputs(data.globalTaxInputs);
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
				<p className="text-muted-foreground">Loading...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background w-full">
			<header className="border-b bg-card sticky top-0 z-20">
				<div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
					<div>
						<h1 className="text-lg font-bold">Comp Package Evaluator</h1>
						<p className="text-xs text-muted-foreground">
							After-tax value · employer cost · NPV analysis
						</p>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={exportAll}
							className="gap-1.5"
						>
							<Download className="h-3.5 w-3.5" /> Export
						</Button>
						<label>
							<Button variant="outline" size="sm" asChild>
								<span className="gap-1.5 cursor-pointer">
									<Upload className="h-3.5 w-3.5" /> Import
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

			<div className="max-w-7xl mx-auto px-4 py-6">
				<Tabs defaultValue="builder">
					<TabsList className="mb-6">
						<TabsTrigger value="builder">Builder</TabsTrigger>
						<TabsTrigger value="compare">Compare</TabsTrigger>
						<TabsTrigger value="timeline">Timeline</TabsTrigger>
					</TabsList>

					<TabsContent value="builder">
						<div className="space-y-4">
							<GlobalTaxPanel
								taxInputs={globalTaxInputs}
								onChange={updateTaxInputs}
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
									/>
								))}
							</div>
							<Button
								onClick={addPackage}
								className="w-full gap-2"
								variant="outline"
							>
								<Plus className="h-4 w-4" /> Add Package
							</Button>
							{packages.length === 0 && (
								<div className="text-center py-12 text-muted-foreground">
									<p className="text-lg mb-2">No packages yet</p>
									<p className="text-sm">
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
