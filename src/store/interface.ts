import type { Package, TaxInputs } from "../types";

export interface Store {
	getAllPackages(): Promise<Package[]>;
	upsertPackage(pkg: Package): Promise<void>;
	deletePackage(id: string): Promise<void>;
	getGlobalTaxInputs(): Promise<TaxInputs>;
	setGlobalTaxInputs(taxInputs: TaxInputs): Promise<void>;
}
