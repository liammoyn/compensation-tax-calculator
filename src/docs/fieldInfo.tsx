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

function TaxAuthority({ items }: { items: { cite: string; description: string }[] }) {
	return (
		<div className="mt-4 border-t border-border/40 pt-3">
			<p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground/50 mb-2">
				Tax Authority
			</p>
			<ul className="space-y-2.5">
				{items.map((item) => (
					<li key={item.cite} className="text-xs">
						<span className="block font-mono font-medium text-foreground/70">
							{item.cite}
						</span>
						<span className="block text-muted-foreground mt-0.5">{item.description}</span>
					</li>
				))}
			</ul>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §61(a)(1)", description: "Gross income includes compensation for services; salary is fully includible in the year it is paid." },
						{ cite: "Treas. Reg. §1.61-2", description: "Wages and salaries paid for services rendered are compensation income." },
						{ cite: "IRC §162(a)", description: "Employer deduction for reasonable compensation as an ordinary and necessary business expense." },
						{ cite: "IRC §3101 / §3111", description: "Employee and employer FICA (7.65% each on wages up to the SS wage base; 1.45% above)." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §61(a)(1)", description: "Bonus payments are compensation includible in gross income in the year received." },
						{ cite: "Treas. Reg. §1.61-2", description: "Bonuses paid for services are wages." },
						{ cite: "IRC §162(a)", description: "Employer deduction for bonuses as ordinary and necessary compensation expense." },
						{ cite: "Treas. Reg. §1.162-7", description: "Bonus deduction subject to reasonableness requirement; timing rule requires deduction in the year of payment." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "Income recognized = FMV of property at vesting less any amount paid; grant FMV sets the baseline for §83(b) election income inclusion." },
						{ cite: "IRC §422(b)(4)", description: "ISO strike price must equal or exceed FMV at grant (110% of FMV for shareholders owning >10% of stock)." },
						{ cite: "Treas. Reg. §1.409A-1(b)(5)", description: "NQOs and SARs granted at or above FMV (as determined by a reasonable valuation method) are exempt from §409A; a below-FMV strike triggers §409A penalties." },
						{ cite: "IRC §409A / Treas. Reg. §1.409A-1(b)(5)(iv)", description: "\"Reasonable valuation method\" for private companies includes an independent §409A appraisal (safe harbor)." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "Treas. Reg. §1.83-2(b)", description: "The 30-day window for a §83(b) election runs from the date of transfer (grant date); the deadline is strict and cannot be extended." },
						{ cite: "IRC §83(f)", description: "With a §83(b) election, the holding period for capital gains purposes begins on the grant date." },
						{ cite: "IRC §1222(3)", description: "Long-term capital gain requires a holding period of more than one year from the grant date (with §83(b))." },
						{ cite: "IRC §422(b)(2)", description: "ISOs must be granted within 10 years of plan adoption or shareholder approval." },
						{ cite: "IRC §422(b)(3)", description: "ISOs may not be exercisable more than 10 years from the grant date (5 years for >10% shareholders)." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §83(b)", description: "Election to include restricted property in income in the year of transfer at its FMV, even though it remains subject to a substantial risk of forfeiture." },
						{ cite: "Treas. Reg. §1.83-2(a)", description: "Election made by including the required information on a statement filed with the IRS." },
						{ cite: "Treas. Reg. §1.83-2(b)", description: "30-day filing deadline runs from the date of transfer; the deadline is absolute — no extensions are granted." },
						{ cite: "IRS Rev. Proc. 2012-29", description: "Current procedure for filing an §83(b) election; prescribes the required information and filing address." },
						{ cite: "Rev. Rul. 2014-18", description: "RSUs are not \"property\" transferred at grant; §83(b) elections are therefore not available for RSUs." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "Income is recognized when property is no longer subject to a substantial risk of forfeiture or restriction on transfer (i.e., when substantially vested)." },
						{ cite: "Treas. Reg. §1.83-3(b)", description: "\"Substantial risk of forfeiture\" defined; includes both employment conditions and performance conditions." },
						{ cite: "Treas. Reg. §1.83-3(c)", description: "Conditions relating to the purpose of the transfer (such as a liquidity event requirement) constitute a substantial risk of forfeiture." },
						{ cite: "IRC §409A", description: "Double-trigger RSU arrangements must qualify as a permissible §409A payment event (e.g., a \"change in control\" as defined in Treas. Reg. §1.409A-3(i)(5)); non-compliant deferral triggers a 20% excise tax." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "Income recognition is deferred while the liquidity event condition constitutes a substantial risk of forfeiture; income is recognized when the event occurs and shares are delivered." },
						{ cite: "Treas. Reg. §1.83-3(c)", description: "A condition that the company must complete an IPO or be acquired before shares settle is a substantial risk of forfeiture." },
						{ cite: "IRC §409A / Treas. Reg. §1.409A-3(i)(5)", description: "A qualifying \"change in control\" (acquisition) is a permissible §409A payment event; an IPO generally is not a §409A payment event by itself — plan documents must be carefully structured." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §422(b)(4)", description: "ISO requirement: exercise price must equal or exceed FMV at grant (110% of FMV if the optionee owns >10% of the company's stock)." },
						{ cite: "Treas. Reg. §1.409A-1(b)(5)(i)(A)", description: "NQOs granted with a strike price ≥ FMV at grant are exempt from §409A. A below-FMV strike creates immediate §409A liability: 20% excise tax plus an underpayment interest penalty on the deferred amount." },
						{ cite: "IRC §83(a)", description: "The taxable spread at exercise = FMV at exercise − strike price; the strike price determines the employee's cost basis in the shares acquired." },
					]}
				/>
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
				<TaxAuthority
					items={[
						{ cite: "IRC §422(b)(3)", description: "ISOs may not be exercisable more than 10 years from the grant date (5 years for employees owning >10% of the corporation's stock)." },
						{ cite: "IRC §422(b)(6)", description: "ISO status requires the employee to have been continuously employed by the corporation from grant through the date three months before exercise." },
						{ cite: "IRC §421(b)", description: "If an ISO is exercised more than 3 months after termination of employment, it is treated as a disqualifying disposition (NQO treatment applies to the spread)." },
					]}
				/>
			</>
		),
	},

	// ── Calculation section info entries ──────────────────────────────

	"calc.symbol_legend": {
		title: "Symbol Legend & Marginal NPV",
		description: (
			<>
				<p>
					The symbol table maps every variable used in the formula blocks below
					to its current value and a <strong>marginal NPV</strong> sensitivity
					estimate.
				</p>
				<p className="mt-3">
					<strong>Marginal NPV ($Δ mode)</strong> shows how much the
					employee's base-scenario NPV would change from a one-unit nudge:{" "}
					<em>+1 percentage point</em> for rates, <em>+$1</em> for dollar
					amounts, or <em>+1 year</em> for the horizon. It answers: "which
					lever moves my total after-tax value the most?"
				</p>
				<p className="mt-3">
					<strong>%Δ mode</strong> rescales the same sensitivity to a{" "}
					<em>+1% proportional change</em> in each variable's current value,
					making them comparable across variables of different units. A 1%
					higher salary versus 1% higher discount rate will have
					commensurable %Δ values.
				</p>
				<Callout>
					Variables showing "—" have no marginal NPV because they come from
					a vesting or exercise schedule rather than a single scalar input,
					or because the fractional nudge is not meaningful (e.g.,
					FICA blended rate depends on cumulative wages).
				</Callout>
			</>
		),
	},

	"calc.cash_salary": {
		title: "Cash Salary Calculation",
		description: (
			<>
				<p>
					The after-tax cash flow from base salary in year <em>n</em> is:
				</p>
				<div className="mt-2 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					CF<sub>n</sub> = S<sub>0</sub> × (1 + g<sub>s</sub>)
					<sup>n−1</sup> × (1 − τ<sub>f</sub> − τ<sub>s</sub> − τ
					<sub>fica</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>S₀</strong> — year-1 base salary
					</li>
					<li>
						<strong>g_s</strong> — annual salary growth rate (base scenario)
					</li>
					<li>
						<strong>τ_f, τ_s</strong> — federal and state ordinary income rates
					</li>
					<li>
						<strong>τ_fica</strong> — blended employee FICA effective rate
						(7.65% below the SS wage base, 1.45% + 0.9% surtax above)
					</li>
				</ul>
				<p className="mt-3">
					Salary is earned and taxed as ordinary income each year it is paid.
					The FICA rate is blended across all compensation components
					accumulated year-to-date, so it respects the Social Security wage
					base cap.
				</p>
				<p className="mt-3">
					The <strong>employer's net cost</strong> per dollar of salary is
					reduced by the corporate tax deduction on reasonable compensation,
					and increased by the employer's matching FICA obligation.
				</p>
				<TaxAuthority
					items={[
						{ cite: "IRC §61(a)(1)", description: "Gross income includes compensation for services." },
						{ cite: "IRC §1(j)(2)(D)", description: "37% top marginal federal ordinary income rate (TCJA, extended through 2026)." },
						{ cite: "IRC §162(a)", description: "Employer deduction for ordinary and necessary compensation expense." },
						{ cite: "IRC §162(m)", description: "$1M annual cap on employer deduction for covered employees at public companies. Applied cumulatively across all comp types." },
						{ cite: "IRC §3101 / §3111", description: "Employee and employer FICA rates (6.2% SS + 1.45% Medicare each)." },
						{ cite: "IRC §3101(b)(2)", description: "Additional 0.9% employee-only Medicare surtax above the $200k threshold." },
						{ cite: "IRC §3121(a)(1)", description: "SS wage base cap; only 1.45% Medicare applies above the annual base." },
					]}
				/>
			</>
		),
	},

	"calc.cash_bonus": {
		title: "Cash Bonus Calculation",
		description: (
			<>
				<p>
					The after-tax cash flow from a bonus in year <em>n</em> is:
				</p>
				<div className="mt-2 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					B<sub>n</sub> = B<sub>0</sub> × (1 + g<sub>b</sub>)
					<sup>n−1</sup>
					<br />
					CF<sub>n</sub> = B<sub>n</sub> × f<sub>n</sub> × (1 − τ
					<sub>f</sub> − τ<sub>s</sub> − τ<sub>fica</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>B₀</strong> — target annual bonus amount in year 1
					</li>
					<li>
						<strong>g_b</strong> — annual bonus growth rate (base scenario)
					</li>
					<li>
						<strong>f_n</strong> — fraction of the bonus paid in year <em>n</em>{" "}
						(from the payment schedule; 1.0 if paid in a single year)
					</li>
					<li>
						<strong>τ_f, τ_s, τ_fica</strong> — same ordinary income + FICA
						rates as salary
					</li>
				</ul>
				<p className="mt-3">
					Bonus payments are wages taxed as ordinary income in the year they
					are paid. The payment fraction f_n allows bonuses to be split across
					multiple years (e.g., sign-on bonus paid over two years).
				</p>
				<TaxAuthority
					items={[
						{ cite: "IRC §61(a)(1)", description: "Bonus payments are compensation includible in gross income." },
						{ cite: "Treas. Reg. §1.61-2", description: "Wages, salaries, and bonuses are compensation income." },
						{ cite: "IRC §162(a)", description: "Employer deduction for reasonable compensation including bonuses." },
						{ cite: "IRC §162(m)", description: "$1M cumulative cap on employer deduction for covered employees." },
						{ cite: "IRC §3101 / §3111", description: "FICA applies to bonus wages, same as salary." },
					]}
				/>
			</>
		),
	},

	"calc.rsu": {
		title: "RSU Calculation",
		description: (
			<>
				<p>
					RSUs deliver actual shares (or their cash equivalent) on a vesting or
					settlement date. The after-tax value depends on whether the grant is{" "}
					<strong>time-based</strong> (single-trigger) or{" "}
					<strong>double-trigger</strong>.
				</p>
				<p className="mt-3 font-medium">Time-based (each vest year n):</p>
				<div className="mt-1 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					P<sub>n</sub> = P<sub>0</sub> × (1 + g<sub>p</sub>)<sup>n</sup>
					<br />
					CF<sub>n</sub> = P<sub>n</sub> × N<sub>n</sub> × (1 − τ<sub>f</sub>{" "}
					− τ<sub>s</sub> − τ<sub>fica</sub>)
				</div>
				<p className="mt-3 font-medium">Double-trigger (all at liquidity event year L):</p>
				<div className="mt-1 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					P<sub>L</sub> = P<sub>0</sub> × (1 + g<sub>p</sub>)<sup>L</sup>
					<br />
					CF<sub>L</sub> = P<sub>L</sub> × N<sub>vest</sub> × (1 − τ
					<sub>f</sub> − τ<sub>s</sub> − τ<sub>fica</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>N_n</strong> — shares vesting in year n (from vesting schedule)
					</li>
					<li>
						<strong>N_vest</strong> — total service-vested shares settled at
						liquidity event
					</li>
					<li>
						<strong>L</strong> — liquidity event year (IPO, acquisition)
					</li>
				</ul>
				<p className="mt-3">
					RSUs are not property at grant — no §83(b) election is available.
					Income is recognized when shares are <em>delivered</em>, at FMV on
					that date. Double-trigger RSUs also require a liquidity event before
					settlement; if you leave before the event, unvested shares expire.
				</p>
				<Callout>
					<strong>§409A note:</strong> Double-trigger RSUs must be structured
					to comply with IRC §409A (NQDC rules). Non-compliance triggers a 20%
					excise tax. Most pre-IPO RSU plans are drafted to comply, but verify
					with counsel.
				</Callout>
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "Income recognized when property is substantially vested (delivered for RSUs)." },
						{ cite: "Treas. Reg. §1.83-3(e)", description: "RSUs are not \"property\" at grant; no §83(b) election available." },
						{ cite: "Rev. Rul. 2014-18", description: "Confirms RSUs are not property for §83 purposes at grant." },
						{ cite: "Rev. Rul. 2012-18", description: "FICA recognized at RSU delivery/settlement, not at grant." },
						{ cite: "IRC §83(h)", description: "Employer deduction equals amount includible in employee income, timed to delivery year." },
						{ cite: "IRC §409A", description: "Double-trigger RSUs with a liquidity event condition must satisfy §409A payment event requirements." },
					]}
				/>
			</>
		),
	},

	"calc.rs": {
		title: "Restricted Stock Calculation",
		description: (
			<>
				<p>
					Restricted stock (RS) is an immediate share transfer subject to
					forfeiture risk. Tax treatment depends on whether a{" "}
					<strong>§83(b) election</strong> was filed within 30 days of grant.
				</p>
				<p className="mt-3 font-medium">Without 83(b) — ordinary income at each vest:</p>
				<div className="mt-1 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					CF<sub>n</sub> = P<sub>n</sub> × N<sub>n</sub> × (1 − τ<sub>f</sub>{" "}
					− τ<sub>s</sub> − τ<sub>fica</sub>)
				</div>
				<p className="mt-3 font-medium">With 83(b) — ordinary income at grant, LTCG at each vest:</p>
				<div className="mt-1 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					CF<sub>grant</sub> = P<sub>grant</sub> × N<sub>total</sub> × (1 − τ
					<sub>f</sub> − τ<sub>s</sub> − τ<sub>fica</sub>)
					<br />
					CF<sub>n</sub> = (P<sub>n</sub> − P<sub>grant</sub>) × N<sub>n</sub>{" "}
					× (1 − τ<sub>ltcg</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>P_grant</strong> — FMV per share at grant date
					</li>
					<li>
						<strong>N_total</strong> — total shares granted (taxed at grant with
						83(b))
					</li>
					<li>
						<strong>τ_ltcg</strong> — effective LTCG rate (federal + state); the
						holding period for LTCG starts at grant date under §83(f)
					</li>
				</ul>
				<Callout>
					<strong>Critical 30-day deadline:</strong> the §83(b) election must
					be filed with the IRS within 30 days of the grant date. This deadline
					is strictly enforced with no extensions. If you miss it, you will be
					taxed at vest (without 83(b) treatment) regardless of what the tool
					shows.
				</Callout>
				<p className="mt-3 text-xs text-muted-foreground/70">
					<strong>Simplification note:</strong> Capital losses on 83(b) RS
					(where vested shares are worth less than the grant price) are modeled
					as fully deductible at the LTCG rate. In practice, §1211(b) limits
					net capital losses to $3,000/yr against ordinary income unless you
					have offsetting capital gains.
				</p>
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "Property included in income when substantially vested (no 83(b) election)." },
						{ cite: "IRC §83(b)", description: "Election to include property in income at grant at current FMV, even though subject to forfeiture risk." },
						{ cite: "Treas. Reg. §1.83-2(b)", description: "83(b) election must be filed within 30 days of transfer; deadline is strict and cannot be extended." },
						{ cite: "IRC §83(f) / §1222(3)", description: "With an 83(b) election, the holding period begins at grant; appreciation after grant is long-term capital gain if held >1 year." },
						{ cite: "IRC §83(h)", description: "Employer deduction equals employee's income inclusion; for 83(b) grants, deduction is taken in the grant year." },
						{ cite: "IRC §1211(b) / §1212(b)", description: "Capital loss deduction limited to capital gains plus $3,000/yr against ordinary income; excess carries forward." },
					]}
				/>
			</>
		),
	},

	"calc.iso": {
		title: "ISO Calculation",
		description: (
			<>
				<p>
					Incentive stock options (ISOs) are taxed differently from NQOs.{" "}
					<strong>This model assumes a disqualifying disposition</strong> — the
					shares are sold in the same year they are exercised (sell-on-exercise),
					which is the most common planning scenario.
				</p>
				<div className="mt-2 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					P<sub>n</sub> = P<sub>0</sub> × (1 + g<sub>p</sub>)<sup>n</sup>
					<br />
					Spread<sub>n</sub> = (P<sub>n</sub> − K<sub>ISO</sub>) × E<sub>n</sub>
					<br />
					CF<sub>n</sub> = Spread<sub>n</sub> × (1 − τ<sub>f</sub> − τ
					<sub>s</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>K_ISO</strong> — ISO strike price (must equal FMV at grant by
						law)
					</li>
					<li>
						<strong>E_n</strong> — shares exercised in year n (from exercise
						schedule)
					</li>
					<li>
						<strong>No τ_fica term</strong> — ISOs are explicitly exempt from
						both employee and employer FICA under IRC §3121(a)(22)
					</li>
				</ul>
				<p className="mt-3">
					For a disqualifying disposition, the spread is ordinary income. No
					additional capital gain arises because the sale price equals the FMV
					at exercise. Under the sell-on-exercise assumption, AMT = $0 (the
					spread is ordinary income, not an AMT preference item).
				</p>
				<p className="mt-3">
					<strong>Key FICA distinction:</strong> ISO exercises are exempt from
					FICA (both employee and employer). NQO exercises are not. This
					difference affects the employer's true cost comparison between the two
					option types.
				</p>
				<p className="mt-3 text-xs text-muted-foreground/70">
					<strong>Out of scope (v1):</strong> Qualifying dispositions (hold
					&gt;1 yr from exercise AND &gt;2 yrs from grant) would convert the
					entire spread to LTCG and eliminate the employer's deduction. That
					more favorable ISO scenario is not modeled here.
				</p>
				<TaxAuthority
					items={[
						{ cite: "IRC §422(b)", description: "Statutory requirements for ISOs: granted under a plan, strike ≥ FMV at grant, not transferable, exercised within 10 years." },
						{ cite: "IRC §421(b)", description: "Disqualifying disposition: employee recognizes ordinary income equal to FMV at exercise minus strike price." },
						{ cite: "IRC §3121(a)(22)", description: "ISO exercises (and any disposition of ISO shares) are exempt from FICA for both employee and employer." },
						{ cite: "IRS Notice 2002-47", description: "Confirms the §3121(a)(22) FICA exemption; IRS moratorium on FICA collection for ISO exercises." },
						{ cite: "IRC §422(d)", description: "$100k annual limit: aggregate FMV of ISO shares first exercisable in a calendar year cannot exceed $100k; excess treated as NQOs." },
						{ cite: "IRC §56(b)(3)", description: "AMT preference item for qualifying ISO dispositions (not applicable under the sell-on-exercise assumption used here)." },
					]}
				/>
			</>
		),
	},

	"calc.nqo": {
		title: "NQO Calculation",
		description: (
			<>
				<p>
					Non-qualified options (NQOs) are the most common type of employee
					stock option. The spread at exercise is taxed as ordinary wages,
					including FICA.
				</p>
				<div className="mt-2 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					P<sub>n</sub> = P<sub>0</sub> × (1 + g<sub>p</sub>)<sup>n</sup>
					<br />
					Spread<sub>n</sub> = (P<sub>n</sub> − K<sub>NQO</sub>) × E<sub>n</sub>
					<br />
					CF<sub>n</sub> = Spread<sub>n</sub> × (1 − τ<sub>f</sub> − τ
					<sub>s</sub> − τ<sub>fica</sub>)
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>K_NQO</strong> — NQO strike price
					</li>
					<li>
						<strong>E_n</strong> — shares exercised in year n (from exercise
						schedule)
					</li>
					<li>
						<strong>τ_fica</strong> — FICA applies to the full spread (unlike
						ISOs)
					</li>
				</ul>
				<p className="mt-3">
					Income is recognized at exercise, not at grant or sale. The employer
					also pays matching FICA on the spread and receives a compensation
					deduction equal to the employee's ordinary income.
				</p>
				<p className="mt-3">
					NQOs granted at or above FMV are generally exempt from the §409A
					nonqualified deferred compensation rules. A strike price{" "}
					<em>below</em> FMV at grant would create §409A exposure (20% excise
					tax for the employee).
				</p>
				<TaxAuthority
					items={[
						{ cite: "IRC §83(a)", description: "NQO spread at exercise is ordinary income in the year of exercise." },
						{ cite: "Treas. Reg. §1.83-7(a)", description: "Options without a readily ascertainable FMV at grant: income recognized at exercise." },
						{ cite: "Rev. Rul. 2012-18", description: "NQO exercise spread is subject to FICA at the time of exercise; the spread is \"wages\" under §3121(a)." },
						{ cite: "IRC §83(h) / Treas. Reg. §1.83-6(a)", description: "Employer deduction equals amount includible in employee income; same year as employee recognition." },
						{ cite: "Treas. Reg. §1.409A-1(b)(5)", description: "NQOs granted at or above FMV are exempt from §409A. Below-FMV strike creates §409A liability." },
					]}
				/>
			</>
		),
	},

	"calc.npv": {
		title: "NPV Roll-up",
		description: (
			<>
				<p>
					The net present value (NPV) aggregates all after-tax employee cash
					flows across the full horizon, discounted to today's dollars:
				</p>
				<div className="mt-2 font-mono text-xs bg-muted/60 rounded px-3 py-2 leading-loose">
					CF<sub>n</sub> = Σ (all component cash flows in year n)
					<br />
					NPV = Σ CF<sub>n</sub> / (1 + r)<sup>n</sup> &nbsp; for n = 1 to T
				</div>
				<ul className="mt-3 space-y-1.5 text-sm">
					<li>
						<strong>r</strong> — employee discount rate (personal required rate
						of return)
					</li>
					<li>
						<strong>T</strong> — modeling horizon in years
					</li>
					<li>
						Year 1 cash flows are discounted by (1+r)¹ (end-of-year convention)
					</li>
				</ul>
				<p className="mt-3">
					A higher discount rate <em>r</em> penalizes back-loaded compensation
					(equity vesting in years 3–4) more than front-loaded cash. This makes
					the NPV comparison sensitive to how much you value near-term
					liquidity.
				</p>
				<p className="mt-3">
					The <strong>employer NPV</strong> uses the same formula with the
					employer's net cost flows and the employer discount rate (WACC /
					hurdle rate) instead of r.
				</p>
				<Callout>
					NPV is computed separately for each scenario (downside, base,
					upside). The numbers displayed here reflect the{" "}
					<strong>base scenario</strong> only.
				</Callout>
				<TaxAuthority
					items={[
						{ cite: "Standard finance theory", description: "NPV discounting (Modigliani-Miller; Graham & Harvey on hurdle rates). No IRC section governs the discounting mechanics." },
						{ cite: "IRC §§ above", description: "All cash flows fed into NPV are after-tax amounts computed under the relevant IRC sections for each compensation type." },
					]}
				/>
			</>
		),
	},
};
