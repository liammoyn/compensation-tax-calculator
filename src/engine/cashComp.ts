import type {
	CashBonus,
	CashSalary,
	ComponentYearResult,
	Package,
	TaxInputs,
} from "../types";
import type { Scenario } from "./growth";
import { bonusAtYear, salaryAtYear } from "./growth";
import { employeeFicaEffective, employerFicaEffective } from "./tax";

/**
 * Cash salary after-tax for year n.
 *
 * Employee:  salary × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer:  salary × (1 + ficaEmployer) × (1 − corporateRate)
 *
 * IRC §162(m): if section162mApplies, caps employer deduction at $1 M.
 */
export function computeSalaryYear(
	component: CashSalary,
	pkg: Package,
	scenario: Scenario,
	n: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const salary = salaryAtYear(component.annualAmount, pkg, scenario, n);
	const ficaEmp = employeeFicaEffective(salary, taxInputs);
	const ficaEmr = employerFicaEffective(salary, taxInputs);

	const employeeAfterTaxCash =
		salary *
		(1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);

	let employerNetCost: number;
	if (taxInputs.section162mApplies && salary > 1_000_000) {
		const deductible = 1_000_000;
		const nonDeductible = salary - 1_000_000;
		employerNetCost =
			deductible * (1 + ficaEmr) * (1 - taxInputs.corporateRate) +
			nonDeductible * (1 + ficaEmr); // no deduction on excess
	} else {
		employerNetCost = salary * (1 + ficaEmr) * (1 - taxInputs.corporateRate);
	}

	return {
		componentType: "cash_salary",
		employeeAfterTaxCash,
		employerNetCost,
	};
}

/**
 * Cash bonus after-tax for year n (paid in calendarYear per paymentSchedule).
 *
 * Each year's earned bonus = targetAmount × (1 + bonusGrowthRate)^(n−1).
 * The fraction paid in calendarYear is summed from paymentSchedule entries
 * matching that year; defaults to 1.0 (full year-end payment) if no schedule.
 */
export function computeBonusYear(
	component: CashBonus,
	pkg: Package,
	scenario: Scenario,
	n: number,
	calendarYear: number,
	taxInputs: TaxInputs,
): ComponentYearResult {
	const earnedBonus = bonusAtYear(component.targetAmount, pkg, scenario, n);
	const paymentsThisYear = component.paymentSchedule.filter(
		(p) => p.year === calendarYear,
	);
	const paidFraction =
		paymentsThisYear.length > 0
			? paymentsThisYear.reduce((sum, p) => sum + p.fraction, 0)
			: 1.0;

	const bonus = earnedBonus * paidFraction;
	if (bonus === 0)
		return {
			componentType: "cash_bonus",
			employeeAfterTaxCash: 0,
			employerNetCost: 0,
		};

	const ficaEmp = employeeFicaEffective(bonus, taxInputs);
	const ficaEmr = employerFicaEffective(bonus, taxInputs);

	const employeeAfterTaxCash =
		bonus *
		(1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);

	let employerNetCost: number;
	if (taxInputs.section162mApplies && bonus > 1_000_000) {
		const deductible = 1_000_000;
		const nonDeductible = bonus - 1_000_000;
		employerNetCost =
			deductible * (1 + ficaEmr) * (1 - taxInputs.corporateRate) +
			nonDeductible * (1 + ficaEmr);
	} else {
		employerNetCost = bonus * (1 + ficaEmr) * (1 - taxInputs.corporateRate);
	}

	return { componentType: "cash_bonus", employeeAfterTaxCash, employerNetCost };
}
