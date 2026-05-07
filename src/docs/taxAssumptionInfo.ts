import type { TaxInputs } from "../types";

export interface TaxInputInfo {
	title: string;
	description: string;
}

export const TAX_INPUT_INFO: Partial<Record<keyof TaxInputs, TaxInputInfo>> = {
	federalOrdinaryRate: {
		title: "Federal Ordinary Rate",
		description: "Federal Ordinary Rate",
	},
	federalLTCGRate: {
		title: "Federal LTCG Rate",
		description: "Federal LTCG Rate",
	},
	amtRate: {
		title: "AMT Rate",
		description: "AMT Rate",
	},
	ficaRate: {
		title: "FICA Rate",
		description: "FICA Rate",
	},
	additionalMedicareRate: {
		title: "Additional Medicare Rate",
		description: "Additional Medicare Rate",
	},
	additionalMedicareThreshold: {
		title: "Medicare Threshold",
		description: "Medicare Threshold",
	},
	stateOrdinaryRate: {
		title: "State Ordinary Rate",
		description: "State Ordinary Rate",
	},
	stateLTCGRate: {
		title: "State LTCG Rate",
		description: "State LTCG Rate",
	},
	niitRate: {
		title: "NIIT Rate",
		description: "NIIT Rate",
	},
	corporateRate: {
		title: "Corporate Rate",
		description: "Corporate Rate",
	},
	employeeDiscountRate: {
		title: "Employee Discount Rate",
		description: "Employee Discount Rate",
	},
	employerDiscountRate: {
		title: "Employer Discount Rate",
		description: "Employer Discount Rate",
	},
	ssWageBase: {
		title: "SS Wage Base",
		description: "SS Wage Base",
	},
};
