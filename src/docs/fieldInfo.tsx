import type { ReactNode } from "react";
import type { TaxInputInfo } from "./taxAssumptionInfo";
import { TAX_INPUT_INFO } from "./taxAssumptionInfo";

export type { TaxInputInfo };

function Callout({ children }: { children: ReactNode }) {
	return (
		<div className="mt-3 rounded-md bg-muted/60 px-3 py-2 text-xs leading-snug">
			{children}
		</div>
	);
}

export const INFO_REGISTRY: Record<string, TaxInputInfo> = {
	...(TAX_INPUT_INFO as Record<string, TaxInputInfo>),

	// Package Settings
	"pkg.companyValuation": {
		title: "Company Valuation",
		description: (
			<>
				<p>
					The total estimated value of the entire company right now. For private
					startups, this is typically the valuation from the most recent funding
					round — the "post-money" number announced after an investment (e.g.,
					"raised $20M at a $100M valuation"). For public companies, this is the{" "}
					<strong>market capitalization</strong>: current share price multiplied
					by total shares outstanding.
				</p>
				<p className="mt-3">
					The tool divides this number by total shares outstanding to derive the
					current price per share, which is the baseline for all future equity
					projections.
				</p>
				<Callout>
					You can usually find this in your offer letter, a cap table document,
					or recent press coverage of the company's latest funding round. If the
					company has not publicly stated a valuation, ask your recruiter.
				</Callout>
			</>
		),
	},

	"pkg.sharesOutstanding": {
		title: "Shares Outstanding",
		description: (
			<>
				<p>
					The total number of shares that represent ownership of the company,
					counted across all shareholders. This tool uses the{" "}
					<strong>fully diluted</strong> share count — meaning it includes not
					just currently issued shares, but also shares reserved for the
					employee option pool, outstanding warrants, and convertible notes.
				</p>
				<p className="mt-3">
					Using the fully diluted count gives a more conservative (and
					realistic) picture of what each share is worth, since future dilution
					from the option pool is already reflected.
				</p>
				<Callout>
					Your offer letter or a company-provided cap table summary usually
					includes this number. For a rough estimate, divide the company
					valuation by the price per share stated in your offer (e.g., the
					strike price for at-the-money options). Fully diluted share counts are
					typically larger than the "basic" count of shares currently issued.
				</Callout>
			</>
		),
	},

	"pkg.basePricePerShare": {
		title: "Base Price / Share",
		description: (
			<>
				<p>
					The implied current price per share, calculated automatically as{" "}
					<strong>Company Valuation ÷ Shares Outstanding</strong>. This is the
					starting point for projecting what your equity will be worth at each
					future vest or exercise date under the growth scenarios you define.
				</p>
				<Callout>
					This is a <strong>read-only derived value</strong> — adjust it by
					changing Company Valuation or Shares Outstanding above.
				</Callout>
			</>
		),
	},

	"pkg.horizon": {
		title: "Horizon (Years)",
		description: (
			<>
				<p>
					The number of years to model for this compensation package. The tool
					calculates after-tax cash flows, vesting events, and net present value
					(NPV) for each year within this window.
				</p>
				<p className="mt-3">
					Setting the horizon to match your expected vesting period gives the
					most complete picture. A shorter horizon focuses on near-term cash
					flows; a longer one captures the full value of back-loaded equity
					grants.
				</p>
				<Callout>
					<strong>Common choices:</strong>
					<ul className="mt-1 ml-3 list-disc space-y-0.5">
						<li>
							<strong>4 years</strong> — covers a standard 4-year vesting
							schedule
						</li>
						<li>
							<strong>5–7 years</strong> — useful for options with longer
							exercise windows or multi-grant scenarios
						</li>
					</ul>
				</Callout>
			</>
		),
	},

	"pkg.stockPriceGrowth": {
		title: "Stock Price Growth (%/yr)",
		description: (
			<>
				<p>
					The expected annual percentage increase in share price over the
					modeling period. This drives how much your equity grants will be worth
					at each future vest or exercise date — a higher rate makes equity
					components more valuable in the model.
				</p>
				<p className="mt-3">
					You set separate rates for three scenarios: a pessimistic{" "}
					<strong>downside</strong>, a realistic <strong>base case</strong>, and
					an optimistic <strong>upside</strong>. The tool runs all three so you
					can see how your compensation value varies with company performance.
				</p>
				<Callout>
					<strong>Common starting assumptions:</strong>
					<ul className="mt-1 ml-3 list-disc space-y-0.5">
						<li>
							<strong>Downside:</strong> 0–5% (flat or modest growth)
						</li>
						<li>
							<strong>Base:</strong> 10–20% (healthy, sustainable growth)
						</li>
						<li>
							<strong>Upside:</strong> 30–50%+ (strong breakout growth)
						</li>
					</ul>
					Use numbers your recruiter or investor materials suggest if available.
				</Callout>
			</>
		),
	},

	"pkg.salaryGrowth": {
		title: "Salary Growth (%/yr)",
		description: (
			<>
				<p>
					The expected annual percentage increase in base salary over the
					modeling period. Salaries typically grow over time through merit
					raises, promotions, or periodic renegotiation.
				</p>
				<Callout>
					A common assumption is <strong>3–5% per year</strong> for inflation
					and merit increases, or <strong>10–20%+</strong> if you expect a
					promotion. Set to <strong>0%</strong> to model a flat salary. Like
					stock price growth, you can set independent rates for each scenario.
				</Callout>
			</>
		),
	},

	"pkg.bonusGrowth": {
		title: "Bonus Growth (%/yr)",
		description: (
			<>
				<p>
					The expected annual percentage increase in your target bonus amount.
					Your bonus target tends to grow alongside your base salary and
					seniority, especially if your role, title, or target bonus percentage
					changes over time.
				</p>
				<Callout>
					Often set to the same rate as salary growth (3–5%/yr). If your target
					bonus is defined as a <strong>fixed percentage of salary</strong>, set
					this equal to your salary growth rate to keep it in sync. Like other
					growth rates, you can set independent values for each scenario.
				</Callout>
			</>
		),
	},

	// Component Fields
	"comp.annualBaseSalary": {
		title: "Annual Base Salary",
		description: (
			<>
				<p>
					Your fixed annual salary before taxes and deductions. This is the
					amount you are guaranteed each year regardless of company or
					individual performance — it does not include bonuses, equity, or
					benefits.
				</p>
				<p className="mt-3">
					All base salary is taxed as <strong>ordinary income</strong> in the
					year it is earned (subject to federal and state income tax and payroll
					taxes).
				</p>
				<Callout>
					Enter the annual total. If your offer states a biweekly paycheck
					amount, multiply by 26 to get the annual figure (e.g., $7,692 × 26 =
					$200,000).
				</Callout>
			</>
		),
	},

	"comp.targetBonusAmount": {
		title: "Target Bonus Amount (Annual)",
		description: (
			<>
				<p>
					The dollar amount of bonus you would receive if you hit 100% of your
					performance targets. This is your "on target" bonus — actual payouts
					in any given year can be higher or lower depending on your performance
					and the company's results.
				</p>
				<p className="mt-3">
					Bonuses are taxed as <strong>ordinary income</strong> in the year they
					are paid, the same as salary.
				</p>
				<Callout>
					Many companies express bonuses as a percentage of base salary (e.g.,
					"20% target bonus"). Multiply your base salary by that percentage to
					get the dollar amount to enter here. For example: $200,000 base × 20%
					= <strong>$40,000 target bonus</strong>.
				</Callout>
			</>
		),
	},

	"comp.sharesGranted": {
		title: "Shares Granted",
		description: (
			<>
				<p>
					The total number of shares (for restricted stock or RSUs) or option
					contracts (for ISOs and NQOs) you are receiving in this grant. For
					restricted stock and RSUs, each unit is an actual share of company
					stock. For options, each unit gives you the{" "}
					<strong>right to buy</strong> one share at the strike price — they are
					not shares themselves until exercised.
				</p>
				<Callout>
					This number should appear on your grant agreement or offer letter. For
					equity comparison purposes, what matters is both the share count{" "}
					<em>and</em> the price per share — 100,000 shares at $1/share equals
					the same grant-date value as 10,000 shares at $10/share.
				</Callout>
			</>
		),
	},

	"comp.grantFMV": {
		title: "Grant FMV per Share",
		description: (
			<>
				<p>
					The <strong>fair market value (FMV)</strong> of one share on the date
					the grant was made. This is the price used to calculate how much
					ordinary income you would recognize at grant (relevant for 83(b)
					elections on restricted stock) and establishes your cost basis for
					long-term capital gains purposes.
				</p>
				<p className="mt-3">
					For private companies, FMV is established by a{" "}
					<strong>409A valuation</strong> — an independent appraisal the company
					is required to obtain before issuing equity awards. For public
					companies, it is simply the closing stock price on the grant date.
				</p>
				<Callout>
					For private company options, the grant FMV is typically lower than the
					preferred stock price (often about one-third of the most recent
					preferred price for early-stage startups). Your offer letter or grant
					agreement will state this value; for at-the-money options, it will
					match the strike price.
				</Callout>
			</>
		),
	},

	"comp.grantDate": {
		title: "Grant Date",
		description: (
			<>
				<p>
					The official date your equity grant was awarded. This date starts the
					vesting clock and determines key tax timelines — including whether
					future appreciation qualifies for long-term capital gains treatment
					(relevant for 83(b) elections, which require holding for more than one
					year from the grant date) and when ISO options expire (10 years from
					grant by law).
				</p>
				<Callout>
					Found on your grant agreement or equity management platform (e.g.,
					Carta, Shareworks, Pulley). If your start date and grant date differ,
					use the actual grant date stated in the agreement — board approval
					dates can sometimes lag your hire date by weeks or months.
				</Callout>
			</>
		),
	},

	"comp.election83b": {
		title: "83(b) Election",
		description: (
			<>
				<p>
					An 83(b) election is a tax strategy for{" "}
					<strong>restricted stock (not RSUs)</strong> where you choose to pay
					income tax on the entire grant immediately — based on today's
					(typically low) value — rather than paying tax as each tranche vests
					at a potentially much higher future value.
				</p>
				<p className="mt-3">
					If the company grows significantly, this can produce large tax savings
					because all appreciation after the election date is taxed at the lower
					long-term capital gains rate instead of ordinary income rates. The
					tradeoff: if you leave the company before fully vesting, you've
					prepaid tax on shares you never received (you can claim a capital
					loss, but you lose the time value of that prepaid tax).
				</p>
				<Callout>
					<strong>Critical deadline:</strong> the 83(b) election must be filed
					with the IRS within <strong>30 days of the grant date</strong> — this
					window is strict and cannot be extended. If you are considering this
					strategy, consult a tax advisor immediately after receiving the grant.
					This election is only available for restricted stock (RS), not RSUs.
				</Callout>
			</>
		),
	},

	"comp.vestingType": {
		title: "Vesting Type",
		description: (
			<>
				<p>How and when your RSUs settle into shares you actually own:</p>
				<ul className="mt-2 ml-4 list-disc space-y-2">
					<li>
						<strong>Time-based:</strong> shares are delivered on a fixed
						schedule (e.g., 25% after one year, then monthly over the next three
						years) as long as you remain employed. The most common structure at
						public companies and many private ones.
					</li>
					<li>
						<strong>Double-trigger:</strong> you must satisfy two conditions —
						(1) the time-based vesting schedule must be met, AND (2) a liquidity
						event (IPO or acquisition) must occur. If you leave before the
						liquidity event, double-trigger RSUs typically expire worthless even
						if they were time-vested.
					</li>
				</ul>
				<Callout>
					Most RSU grants at <strong>pre-IPO startups</strong> are
					double-trigger. At <strong>public companies</strong>, RSUs are nearly
					always time-based only (single-trigger).
				</Callout>
			</>
		),
	},

	"comp.liquidityEventYear": {
		title: "Liquidity Event Year",
		description: (
			<>
				<p>
					For double-trigger RSUs, the year in which the company is expected to
					have a <strong>liquidity event</strong> — an IPO, direct listing, SPAC
					merger, or acquisition — that satisfies the second vesting condition.
					Your double-trigger RSUs will only have value if you are still
					employed when this event occurs.
				</p>
				<p className="mt-3">
					The tool uses the stock price projected for this year (based on your
					growth scenario) to calculate the value of RSUs that settle at the
					liquidity event.
				</p>
				<Callout>
					This is your best estimate — liquidity events are notoriously
					difficult to predict. If no liquidity event occurs before you leave,
					double-trigger RSUs expire with <strong>zero value</strong> regardless
					of the company's stock price.
				</Callout>
			</>
		),
	},

	"comp.strikePrice": {
		title: "Strike Price per Share",
		description: (
			<>
				<p>
					The fixed price you pay to <strong>exercise</strong> (buy) one share
					when you hold a stock option (ISO or NQO). This price is locked in at
					the time of grant and never changes, no matter how the stock moves.
					Your economic gain from the option is the difference between the
					market price at the time you exercise and your strike price.
				</p>
				<p className="mt-3">
					For example, if your strike price is $2/share and the stock is worth
					$10 when you exercise, your pre-tax gain per share is{" "}
					<strong>$8</strong>.
				</p>
				<Callout>
					By law, options must be granted at a strike price equal to or greater
					than the FMV on the grant date (set by a 409A valuation for private
					companies). Your strike price appears on your grant agreement. For
					at-the-money options — the most common structure — the strike price
					equals the FMV at grant.
				</Callout>
			</>
		),
	},

	"comp.expirationDate": {
		title: "Expiration Date",
		description: (
			<>
				<p>
					The last date on which you can exercise your options. After this date,
					any unexercised options become <strong>permanently worthless</strong>,
					regardless of how valuable the underlying stock is. Options are a "use
					it or lose it" right.
				</p>
				<p className="mt-3">
					ISO options are legally capped at <strong>10 years</strong> from the
					grant date. If you leave the company, the exercise window typically
					shortens dramatically — often to just 30–90 days after your last day
					of employment, which may be a more binding deadline than the formal
					expiration date.
				</p>
				<Callout>
					Check your grant agreement for <em>both</em> the formal expiration
					date and the post-termination exercise window. Some companies offer
					extended windows (1–5 years after departure) as a negotiating point —
					this is worth asking about, since a short window can force you to
					exercise (and pay taxes) on a tight timeline when you leave.
				</Callout>
			</>
		),
	},
};
