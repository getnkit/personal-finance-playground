# Finance Lab

**On iPhone:** open the live site in Safari, then Share → Add to Home Screen. The app uses the Finance Lab name and the navy/mint icon. If an earlier Home Screen shortcut still shows the old icon, remove it and add it again. The repository and Pages URL remain unchanged.


Mobile-first, free, standalone financial *what-if* simulator. Built with a single `index.html` using HTML, CSS, and JavaScript. No account, backend, or paid hosting required.

**Live site:** https://getnkit.github.io/personal-finance-playground/

## Four planners

- **Investment & Retirement:** contributions, compound growth, inflation-adjusted values, retirement withdrawals, and lower-return sensitivity.
- **Car Purchase Timing:** incremental costs of purchasing a car early, including an optional used-car loan.
- **Savings & Goals:** cash savings targets, dated planned expenses, and a separate **Car Fund First vs Car Fund + Investing** comparison.
- **Tax Planning (Tax):** Thai tax year **2569**, scoped to salary / bonus income (Section 40(1)). Supports actual annual employment income, social security, basic personal deduction, eligible life/health insurance, eligible parents, provident fund, RMF, and tax withheld. The additional deduction field is **not** automatically verified.

## Export to PDF

Each planner has an **Export PDF** button. It prints the **actual active planner UI** (its colored result cards, current input values, and charts) on A4 pages, with light print-only spacing adjustments. Controls such as tabs, sliders, and action buttons are hidden in print. Use the browser's **Save as PDF** option. The page title is temporarily changed to a mode-specific timestamp so browsers that use document titles can suggest distinct filenames. Final filename behavior varies by browser, especially on iOS. No financial data is uploaded or stored.

## Scope and privacy

The app is for planning, not tax filing. Some legal eligibility criteria and deduction categories are outside the calculator; enter only amounts you have verified. Tax laws and annual measures can change. Cross-check actual income, withholding, eligible deductions, and documentation against the [Thai Revenue Department](https://www.rd.go.th/) before filing through [e-Filing](https://efiling.rd.go.th/rd-cms/).

All calculations run locally in your browser. Example inputs are not actual personal financial records. No financial data is stored or transmitted to a server by the app. Calculations and forecasts are illustrative, not guaranteed returns or financial advice.

## Deployment and regression checks

GitHub Pages serves `index.html` from the `main` branch at the repository root. Commits to the main page trigger deployment; check **Actions** for status.

Tax calculator regression cases can be run with Node.js (no dependencies):

```bash
node tests/tax-regression.cjs
```
