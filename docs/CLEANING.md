# Cleaning and counterparty resolution

The Data Cleaning & Counterparty Resolution workspace operates on transaction datasets across currencies. It retains source rows and does not delete, consolidate, change financial amounts or convert currencies.

## Workflow

1. Review the source fields and current counterparties. Use search, status and currency filters.
2. Apply safe formatting when required. It standardises whitespace and typographic quote/dash forms. Uppercase is optional. Original source columns remain available.
3. The default review option holds unverified description-extracted names as unknown when formatting is applied. Suggestions remain visible for review; they are not confirmed identities.
4. Select records individually or select all filtered matches across pagination. Enter a resolved name and supporting reason, then apply the assignment. Corrections may cover unknown or known names and apply to the selected records only.
5. Accept a suggested candidate only after reviewing the source details. Formatting-similarity suggestions do not establish shared identity. Dataset account fields are not used to infer ownership or automatically merge counterparties.
6. Acknowledge genuinely unknown records when the available evidence is insufficient. Unresolved directions require correcting the transaction mapping first.

All corrections rerun the analysis and update tables, profiles, currency views, graphs and reports. The workspace retains possible duplicate rows. Analyst corrections do not remove duplicates.

## Downloads

Each output is available as CSV and Excel:

- Cleaned Transactions includes usable standard fields followed by original names, resolution metadata and all source columns prefixed with Original::. This preserves source dates, amounts, currencies, names and narrations alongside the resulting fields.
- Unresolved Counterparties includes unknown/acknowledged records, unverified extracted names and unresolved-direction records.
- Cleaning & Resolution Log records formatting actions, analyst assignments, reasons and timestamps, plus existing aliases and resolution-store decisions where available. It is an operational log, not a tamper-evident chain-of-custody system.

CSV readers can reinterpret numeric identifiers. Excel output stores account identifiers as text to preserve leading zeros. Downloads contain the source information and should be handled accordingly.

Save Case retains the cleaning settings, log and resolution decisions. Save a new case file after making corrections. Original uploaded file bytes are not retained; original row values are retained in the case and cleaned exports.

Run `node tests/cleaning.cjs` with Playwright and Chromium installed to exercise safe formatting, explicit candidate acceptance, bulk selection across pages, corrections, monetary/currency invariance, six downloads and case restoration using synthetic data offline.
