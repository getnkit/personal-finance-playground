# Personal Finance Playground

Mobile-first, free, standalone financial *what-if* simulator. Built with a single `index.html` using HTML, CSS, and JavaScript. No account, backend, or paid hosting required.

**Live site:** https://getnkit.github.io/personal-finance-playground/

## Four planners

- **Investment & Retirement:** contributions, compound growth, inflation-adjusted values, retirement withdrawals, and lower-return sensitivity.
- **Car Purchase Timing:** incremental costs of purchasing a car early, including an optional used-car loan.
- **Savings & Goals:** cash savings targets, dated planned expenses, and a separate **Car Fund First vs Car Fund + Investing** comparison.
- **Personal Income Tax (Tax):** Thai tax year **2569**, scoped to salary / bonus income (Section 40(1)). Supports actual annual employment income, social security, basic personal deduction, eligible life/health insurance, eligible parents, provident fund, RMF, and tax withheld. The additional deduction field is **not** automatically verified.

## Export to PDF

Each planner has an **Export PDF** button. It prepares a concise snapshot of the current assumptions and results and opens your browser's print dialog. Choose **Save as PDF** (or the device's equivalent). It does not upload or store the report.

## Scope and privacy

The app is for planning, not tax filing. Some legal eligibility criteria and deduction categories are outside the calculator; enter only amounts you have verified. Tax laws and annual measures can change. Cross-check actual income, withholding, eligible deductions, and documentation against the [Thai Revenue Department](https://www.rd.go.th/) before filing through [e-Filing](https://efiling.rd.go.th/rd-cms/).

All calculations run locally in your browser. Example inputs are not actual personal financial records. No financial data is stored or transmitted to a server by the app. Calculations and forecasts are illustrative, not guaranteed returns or financial advice.

## Deployment and regression checks

GitHub Pages serves `index.html` from the `main` branch at the repository root. Commits to the main page trigger deployment; check **Actions** for status.

Tax calculator regression cases can be run with Node.js (no dependencies):

```bash
node tests/tax-regression.cjs
```
