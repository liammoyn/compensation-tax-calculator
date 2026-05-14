import type {
	CashBonus,
	CashSalary,
	ComponentYearResult,
	Package,
	TaxInputs,
	YearContext,
} from "../types";
import type { Scenario } from "./growth";
import { bonusAtYear, salaryAtYear } from "./growth";
import { deductibleCompFor, employeeFicaMarginalRate, employerFicaMarginalRate } from "./tax";

/**
 * Cash salary after-tax for year n.
 *
 * Employee:  salary × (1 − federalOrdinaryRate − stateOrdinaryRate − ficaEmployee)
 * Employer:  grossCost − taxSavings
 *   grossCost   = salary × (1 + ficaEmployer)
 *   taxSavings  = (deductible + salary × ficaEmployer) × corporateRate
 *   — deductible is §162(m)-limited (IRC §162(m) post-TCJA applies to all comp)
 *   — employer FICA is always deductible under IRC §162(a) even when §162(m) caps the comp deduction
 *
 * FICA uses marginal rates against year-to-date wages (yearCtx.ficaWagesAccrued)
 * to correctly respect the SS wage base cap across all components (IRC §3121(a)(1)).
 */
export function computeSalaryYear(
	component: CashSalary,
	pkg: Package,
	scenario: Scenario,
	n: number,
	taxInputs: TaxInputs,
	yearCtx: YearContext,
): { result: ComponentYearResult; ficaWagesAdded: number; deductibleCompAdded: number } {
	const salary = salaryAtYear(component.annualAmount, pkg, scenario, n);
	const ficaEmp = employeeFicaMarginalRate(salary, yearCtx.ficaWagesAccrued, taxInputs);
	const ficaEmr = employerFicaMarginalRate(salary, yearCtx.ficaWagesAccrued, taxInputs);

	const employeeAfterTaxCash =
		salary * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);

	const deductible = deductibleCompFor(salary, yearCtx.deductibleCompAccrued, taxInputs);
	const grossCost = salary * (1 + ficaEmr);
	const taxSavings = (deductible + salary * ficaEmr) * taxInputs.corporateRate;
	const employerNetCost = grossCost - taxSavings;

	return {
		result: { componentType: "cash_salary", employeeAfterTaxCash, employerNetCost },
		ficaWagesAdded: salary,
		deductibleCompAdded: deductible,
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
	yearCtx: YearContext,
): { result: ComponentYearResult; ficaWagesAdded: number; deductibleCompAdded: number } {
	const earnedBonus = bonusAtYear(component.targetAmount, pkg, scenario, n);
	const paymentsThisYear = component.paymentSchedule.filter(
		(p) => p.year === calendarYear,
	);
	const paidFraction =
		paymentsThisYear.length > 0
			? paymentsThisYear.reduce((sum, p) => sum + p.fraction, 0)
			: 1.0;

	const bonus = earnedBonus * paidFraction;
	if (bonus === 0) {
		return {
			result: { componentType: "cash_bonus", employeeAfterTaxCash: 0, employerNetCost: 0 },
			ficaWagesAdded: 0,
			deductibleCompAdded: 0,
		};
	}

	const ficaEmp = employeeFicaMarginalRate(bonus, yearCtx.ficaWagesAccrued, taxInputs);
	const ficaEmr = employerFicaMarginalRate(bonus, yearCtx.ficaWagesAccrued, taxInputs);

	const employeeAfterTaxCash =
		bonus * (1 - taxInputs.federalOrdinaryRate - taxInputs.stateOrdinaryRate - ficaEmp);

	const deductible = deductibleCompFor(bonus, yearCtx.deductibleCompAccrued, taxInputs);
	const grossCost = bonus * (1 + ficaEmr);
	const taxSavings = (deductible + bonus * ficaEmr) * taxInputs.corporateRate;
	const employerNetCost = grossCost - taxSavings;

	return {
		result: { componentType: "cash_bonus", employeeAfterTaxCash, employerNetCost },
		ficaWagesAdded: bonus,
		deductibleCompAdded: deductible,
	};
}
