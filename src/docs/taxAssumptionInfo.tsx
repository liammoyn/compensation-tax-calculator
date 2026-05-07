import type { ReactNode } from "react";
import type { TaxInputs } from "../types";

export interface TaxInputInfo {
	title: string;
	description: ReactNode;
}

function Callout({ children }: { children: ReactNode }) {
	return (
		<div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-xs leading-snug">
			{children}
		</div>
	);
}

export const TAX_INPUT_INFO: Partial<Record<keyof TaxInputs, TaxInputInfo>> = {
	federalOrdinaryRate: {
		title: "Federal Ordinary Income Tax Rate",
		description: (
			<>
				<p>
					Your <strong>marginal</strong> federal tax rate on regular income —
					salary, bonuses, and most stock compensation. "Marginal" means only
					the dollars that fall into this bracket are taxed at this rate, not
					your entire income.
				</p>
				<p className="mt-3">
					The US federal system has seven brackets ranging from 10% to 37%.
					Enter your top bracket rate, since compensation from a new job
					typically layers on top of your existing income.
				</p>
				<Callout>
					<strong>Common US values:</strong> 32%, 35%, or 37% for most
					professionals evaluating a compensation offer. Check{" "}
					<span className="font-medium">IRS Publication 505</span> or your most
					recent tax return (Form 1040, line 16 ÷ taxable income) for your
					effective rate.
				</Callout>
			</>
		),
	},

	federalLTCGRate: {
		title: "Federal Long-Term Capital Gains Rate",
		description: (
			<>
				<p>
					The federal tax rate on profits from selling assets held{" "}
					<strong>longer than one year</strong>. Capital gains on equity
					compensation (like stock held after vesting) are taxed at this lower
					rate rather than your ordinary income rate.
				</p>
				<p className="mt-3">
					The federal LTCG rate is fixed at 0%, 15%, or 20% — it does not follow
					the same brackets as ordinary income.
				</p>
				<Callout>
					<strong>Common US values:</strong>
					<ul className="mt-1 ml-3 list-disc space-y-0.5">
						<li>
							<strong>0%</strong> — taxable income below ~$47k (single)
						</li>
						<li>
							<strong>15%</strong> — taxable income up to ~$518k (single)
						</li>
						<li>
							<strong>20%</strong> — taxable income above ~$518k (single)
						</li>
					</ul>
					Most employees evaluating a tech compensation package will use{" "}
					<strong>20%</strong>.
				</Callout>
			</>
		),
	},

	amtRate: {
		title: "Alternative Minimum Tax (AMT) Rate",
		description: (
			<>
				<p>
					The AMT is a <strong>parallel tax calculation</strong> that runs
					alongside your regular income tax. If your AMT liability comes out
					higher than your regular tax, you pay the difference as additional
					tax. It exists to ensure high earners with many deductions still pay a
					minimum amount of tax.
				</p>
				<p className="mt-3">
					The AMT uses its own tax base (adding back certain deductions) and
					applies at 26% on the first ~$220k of AMT income and 28% above that.
					Enter a blended effective rate if you want to approximate the two
					brackets as one number.
				</p>
				<Callout>
					<strong>Default: 26%.</strong> AMT primarily becomes relevant for ISO
					stock options under qualified (exercise-and-hold) strategies — not
					modeled in v1 of this tool. For most scenarios here, the AMT rate does
					not affect your results.
				</Callout>
			</>
		),
	},

	ficaRate: {
		title: "FICA Rate (Payroll Tax)",
		description: (
			<>
				<p>
					FICA (Federal Insurance Contributions Act) covers{" "}
					<strong>Social Security and Medicare</strong> payroll taxes. Both you
					and your employer each pay this rate separately — it is not split
					between you.
				</p>
				<p className="mt-3">The 7.65% rate breaks down as:</p>
				<ul className="mt-1 ml-4 list-disc space-y-1">
					<li>
						<strong>6.2%</strong> Social Security — applies only up to the SS
						wage base (~$168,600)
					</li>
					<li>
						<strong>1.45%</strong> Medicare — applies to all wages with no cap
					</li>
				</ul>
				<p className="mt-3">
					Above the SS wage base, only the 1.45% Medicare portion continues. The
					tool automatically blends these rates based on your income level.
				</p>
				<Callout>
					<strong>Default: 7.65%</strong> (the full per-side rate). Leave this
					at the default unless you have a specific reason to change it.
				</Callout>
			</>
		),
	},

	additionalMedicareRate: {
		title: "Additional Medicare Tax Rate",
		description: (
			<>
				<p>
					A <strong>surtax of 0.9%</strong> on wages above a certain income
					threshold, paid entirely by the employee. Your employer does not match
					this tax. It is applied on top of the standard 1.45% Medicare tax
					within FICA.
				</p>
				<p className="mt-3">
					This tax was introduced by the Affordable Care Act to help fund
					Medicare for higher earners.
				</p>
				<Callout>
					<strong>Default: 0.9%.</strong> This applies automatically once your
					wages exceed the Additional Medicare Threshold (see below). Leave at
					the default unless tax law has changed.
				</Callout>
			</>
		),
	},

	additionalMedicareThreshold: {
		title: "Additional Medicare Tax Threshold",
		description: (
			<>
				<p>
					The annual wage level above which the extra 0.9% Medicare tax starts
					applying. Wages below this threshold are not affected.
				</p>
				<Callout>
					<strong>Default thresholds:</strong>
					<ul className="mt-1 ml-3 list-disc space-y-0.5">
						<li>
							<strong>$200,000</strong> — single filers
						</li>
						<li>
							<strong>$250,000</strong> — married filing jointly (MFJ)
						</li>
					</ul>
					Set this to $250,000 if you file jointly with a spouse.
				</Callout>
			</>
		),
	},

	stateOrdinaryRate: {
		title: "State Ordinary Income Tax Rate",
		description: (
			<>
				<p>
					Your state's tax rate on ordinary income — salary, bonuses, and most
					stock compensation. Enter your <strong>marginal</strong> state rate
					(the rate on your highest dollar of income).
				</p>
				<p className="mt-3">
					Most states use a flat or progressive rate on all ordinary income.
					Some states have no income tax at all.
				</p>
				<Callout>
					<strong>Common state rates:</strong>
					<ul className="mt-1 ml-3 list-disc space-y-0.5">
						<li>
							<strong>0%</strong> — TX, FL, WA, NV, and others (no income tax)
						</li>
						<li>
							<strong>5–7%</strong> — MA (5%), NY (~6.85% state + NYC surcharge)
						</li>
						<li>
							<strong>9.3–13.3%</strong> — CA (top brackets)
						</li>
					</ul>
				</Callout>
			</>
		),
	},

	stateLTCGRate: {
		title: "State Capital Gains Tax Rate",
		description: (
			<>
				<p>
					Your state's tax rate on capital gains — profits from selling equity
					or other appreciated assets. Unlike the federal government, most
					states <strong>do not offer a lower rate</strong> for long-term gains
					and instead tax them the same as ordinary income.
				</p>
				<Callout>
					<strong>In most states:</strong> set this equal to your state ordinary
					income rate. A few states (like AK, FL, NV, TX, WA) have no income
					tax, so this would be 0%. California taxes capital gains as ordinary
					income (up to 13.3%).
				</Callout>
			</>
		),
	},

	niitRate: {
		title: "Net Investment Income Tax (NIIT) Rate",
		description: (
			<>
				<p>
					The NIIT is a <strong>3.8% federal surtax</strong> on investment
					income — including capital gains from equity — for higher earners. It
					is layered on top of the federal capital gains rate, effectively
					pushing the combined federal LTCG rate to 23.8% for those it affects.
				</p>
				<p className="mt-3">
					Use the <strong>NIIT toggle</strong> (in the tax panel) to include or
					exclude this from your calculations. When toggled on, 3.8% is added to
					all capital gains calculations. When off, it is excluded entirely.
				</p>
				<Callout>
					<strong>Default: 3.8%.</strong> This tax applies when your Modified
					Adjusted Gross Income (MAGI) exceeds $200k (single) or $250k (MFJ). If
					your income is clearly above those thresholds, enable the toggle.
				</Callout>
			</>
		),
	},

	corporateRate: {
		title: "Corporate Tax Rate",
		description: (
			<>
				<p>
					The marginal income tax rate the <strong>employer pays</strong> on its
					profits. Because employee compensation is a tax-deductible business
					expense, the employer's true after-tax cost is reduced by this rate.
				</p>
				<p className="mt-3">
					For example, at a 21% corporate rate, every $1 of compensation costs
					the employer $0.79 after the tax deduction.
				</p>
				<Callout>
					<strong>Default: 21%</strong> — the US federal corporate tax rate as
					of 2024. Most US corporations pay near this rate. Early-stage startups
					that are not yet profitable may set this to 0% since they have no
					taxable income to offset.
				</Callout>
			</>
		),
	},

	employeeDiscountRate: {
		title: "Employee Discount Rate",
		description: (
			<>
				<p>
					Your personal <strong>required rate of return</strong> — the minimum
					annual return you'd need to be willing to wait for money instead of
					receiving it today. This is used to calculate the present value (NPV)
					of your future compensation.
				</p>
				<p className="mt-3">
					A higher rate means you value near-term cash more relative to future
					payouts, making long vesting schedules look less attractive in
					present-value terms.
				</p>
				<Callout>
					<strong>Common benchmark: 10%</strong>, which approximates the
					historical average annual return of the US stock market. Use a higher
					rate (15–20%) if you place a greater premium on liquidity, or if you
					have higher-return alternatives for your capital.
				</Callout>
			</>
		),
	},

	employerDiscountRate: {
		title: "Employer Discount Rate",
		description: (
			<>
				<p>
					The employer's <strong>cost of capital</strong> or hurdle rate — the
					minimum return they require when committing to future costs. Used to
					calculate the present value of the company's future compensation
					obligations.
				</p>
				<p className="mt-3">
					Back-loaded compensation (like a 4-year vesting schedule) looks
					cheaper to an employer with a high discount rate because those future
					costs are discounted more heavily.
				</p>
				<Callout>
					<strong>Common range: 8–15%</strong> for venture-backed tech
					companies. Early-stage startups with high risk may use 20%+.
					Established public companies typically use their Weighted Average Cost
					of Capital (WACC), often 8–12%.
				</Callout>
			</>
		),
	},

	ssWageBase: {
		title: "Social Security Wage Base",
		description: (
			<>
				<p>
					The annual income cap above which the{" "}
					<strong>6.2% Social Security portion</strong> of FICA no longer
					applies. Once your wages for the year exceed this amount, only the
					1.45% Medicare portion of FICA continues — saving both you and your
					employer 6.2% on every additional dollar.
				</p>
				<p className="mt-3">
					This cap increases slightly each year, adjusted for wage inflation by
					the Social Security Administration.
				</p>
				<Callout>
					<strong>2024 value: $168,600.</strong> Use $176,100 for 2025. Update
					this field each year or if you are projecting multi-year compensation.
				</Callout>
			</>
		),
	},

	niitAlwaysOn: {
		title: "NIIT Always On",
		description: (
			<>
				<p>
					When enabled, the <strong>3.8% Net Investment Income Tax (NIIT)</strong>{" "}
					is added to all capital gains calculations regardless of your income
					level. When disabled, NIIT is excluded entirely.
				</p>
				<p className="mt-3">
					The NIIT technically applies only when your Modified Adjusted Gross
					Income (MAGI) exceeds $200,000 (single) or $250,000 (married filing
					jointly). This toggle lets you choose whether to assume you are above
					that threshold.
				</p>
				<Callout>
					<strong>Enable this toggle</strong> if your total income clearly
					exceeds the MAGI thresholds. When on, your effective federal LTCG
					rate becomes 23.8% (20% + 3.8%) rather than 20%.
				</Callout>
			</>
		),
	},

	section162mApplies: {
		title: "IRC §162(m) — $1M Deduction Cap",
		description: (
			<>
				<p>
					Section 162(m) of the Internal Revenue Code limits the{" "}
					<strong>employer's tax deduction</strong> for compensation paid to
					certain covered executives at public companies to{" "}
					<strong>$1 million per person per year</strong>. Compensation above
					$1M is not deductible, increasing the employer's true after-tax cost.
				</p>
				<p className="mt-3">
					"Covered employees" generally include the CEO, CFO, and the three
					other highest-paid officers. The cap applies to most forms of
					compensation including salary, bonuses, and stock awards — with
					limited exceptions for certain performance-based pay grandfathered
					before 2018.
				</p>
				<Callout>
					<strong>Enable this toggle for public companies</strong> when
					modeling executive compensation above $1M. Leave it off for private
					companies or when total annual compensation is below the cap.
				</Callout>
			</>
		),
	},
};
