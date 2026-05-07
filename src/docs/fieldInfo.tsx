import type { TaxInputInfo } from "./taxAssumptionInfo";
import { TAX_INPUT_INFO } from "./taxAssumptionInfo";

export type { TaxInputInfo };

export const INFO_REGISTRY: Record<string, TaxInputInfo> = {
	...(TAX_INPUT_INFO as Record<string, TaxInputInfo>),

	// Package Settings
	"pkg.companyValuation": {
		title: "Company Valuation",
		description: "",
	},
	"pkg.sharesOutstanding": {
		title: "Shares Outstanding",
		description: "",
	},
	"pkg.basePricePerShare": {
		title: "Base Price / Share",
		description: "",
	},
	"pkg.horizon": {
		title: "Horizon (Years)",
		description: "",
	},
	"pkg.stockPriceGrowth": {
		title: "Stock Price Growth (%/yr)",
		description: "",
	},
	"pkg.salaryGrowth": {
		title: "Salary Growth (%/yr)",
		description: "",
	},
	"pkg.bonusGrowth": {
		title: "Bonus Growth (%/yr)",
		description: "",
	},

	// Component Fields
	"comp.annualBaseSalary": {
		title: "Annual Base Salary",
		description: "",
	},
	"comp.targetBonusAmount": {
		title: "Target Bonus Amount (Annual)",
		description: "",
	},
	"comp.sharesGranted": {
		title: "Shares Granted",
		description: "",
	},
	"comp.grantFMV": {
		title: "Grant FMV per Share",
		description: "",
	},
	"comp.grantDate": {
		title: "Grant Date",
		description: "",
	},
	"comp.election83b": {
		title: "83(b) Election",
		description: "",
	},
	"comp.vestingType": {
		title: "Vesting Type",
		description: "",
	},
	"comp.liquidityEventYear": {
		title: "Liquidity Event Year",
		description: "",
	},
	"comp.strikePrice": {
		title: "Strike Price per Share",
		description: "",
	},
	"comp.expirationDate": {
		title: "Expiration Date",
		description: "",
	},
};
