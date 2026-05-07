import type { Package, TaxInputs } from "../types";
import { DEFAULT_TAX_INPUTS } from "../types";
import type { Store } from "./interface";

const PACKAGES_KEY = "comp-tax-plan:packages";
const TAX_INPUTS_KEY = "comp-tax-plan:tax-inputs";

export const localStorageStore: Store = {
	async getAllPackages(): Promise<Package[]> {
		const raw = localStorage.getItem(PACKAGES_KEY);
		return raw ? (JSON.parse(raw) as Package[]) : [];
	},

	async upsertPackage(pkg: Package): Promise<void> {
		const packages = await this.getAllPackages();
		const idx = packages.findIndex((p) => p.id === pkg.id);
		if (idx >= 0) packages[idx] = pkg;
		else packages.push(pkg);
		localStorage.setItem(PACKAGES_KEY, JSON.stringify(packages));
	},

	async deletePackage(id: string): Promise<void> {
		const packages = await this.getAllPackages();
		localStorage.setItem(
			PACKAGES_KEY,
			JSON.stringify(packages.filter((p) => p.id !== id)),
		);
	},

	async getGlobalTaxInputs(): Promise<TaxInputs> {
		const raw = localStorage.getItem(TAX_INPUTS_KEY);
		return raw ? (JSON.parse(raw) as TaxInputs) : DEFAULT_TAX_INPUTS;
	},

	async setGlobalTaxInputs(taxInputs: TaxInputs): Promise<void> {
		localStorage.setItem(TAX_INPUTS_KEY, JSON.stringify(taxInputs));
	},
};
