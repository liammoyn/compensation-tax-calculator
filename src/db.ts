import { Database } from "bun:sqlite";
import type { Package, TaxInputs } from "./types";
import { DEFAULT_TAX_INPUTS } from "./types";

const db = new Database("comp-tax-plan.sqlite", { create: true });

db.exec(`
  CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS global_tax_inputs (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL
  );
`);

export function getAllPackages(): Package[] {
	const rows = db
		.query<{ data: string }, []>("SELECT data FROM packages")
		.all();
	return rows.map((r) => JSON.parse(r.data) as Package);
}

export function upsertPackage(pkg: Package): void {
	db.prepare("INSERT OR REPLACE INTO packages (id, data) VALUES (?, ?)").run(
		pkg.id,
		JSON.stringify(pkg),
	);
}

export function deletePackage(id: string): void {
	db.prepare("DELETE FROM packages WHERE id = ?").run(id);
}

export function getGlobalTaxInputs(): TaxInputs {
	const row = db
		.query<{ data: string }, []>(
			"SELECT data FROM global_tax_inputs WHERE id = 1",
		)
		.get();
	return row ? (JSON.parse(row.data) as TaxInputs) : DEFAULT_TAX_INPUTS;
}

export function setGlobalTaxInputs(taxInputs: TaxInputs): void {
	db.prepare(
		"INSERT OR REPLACE INTO global_tax_inputs (id, data) VALUES (1, ?)",
	).run(JSON.stringify(taxInputs));
}
