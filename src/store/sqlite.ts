// Server-side only — wraps db.ts. Import bun:sqlite transitively, so don't bundle for browser.
import {
	deletePackage,
	getAllPackages,
	getGlobalTaxInputs,
	setGlobalTaxInputs,
	upsertPackage,
} from "../db";
import type { Store } from "./interface";

export const sqliteStore: Store = {
	async getAllPackages() {
		return getAllPackages();
	},
	async upsertPackage(pkg) {
		upsertPackage(pkg);
	},
	async deletePackage(id) {
		deletePackage(id);
	},
	async getGlobalTaxInputs() {
		return getGlobalTaxInputs();
	},
	async setGlobalTaxInputs(taxInputs) {
		setGlobalTaxInputs(taxInputs);
	},
};
