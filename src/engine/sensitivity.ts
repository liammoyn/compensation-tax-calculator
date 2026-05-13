import type { Package, TaxInputs } from "../types";
import { evaluatePackage } from "./index";

type NudgeFn = (
	pkg: Package,
	taxInputs: TaxInputs,
) => { pkg: Package; taxInputs: TaxInputs };

export function computeMarginalNPV(
	pkg: Package,
	taxInputs: TaxInputs,
	nudgeFn: NudgeFn,
	baseEmployeeNPV: number,
): number {
	const nudged = nudgeFn(pkg, taxInputs);
	const result = evaluatePackage(nudged.pkg, nudged.taxInputs);
	const base = result.find((r) => r.scenario === "base");
	return (base?.employeeNPV ?? baseEmployeeNPV) - baseEmployeeNPV;
}
