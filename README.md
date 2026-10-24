# FinIntel AML

**Financial Intelligence & AML/CFT Analysis Workbench — MVP**

FinIntel AML is a browser-first analytical workbench for financial intelligence and AML/CFT transaction review. The MVP is designed to demonstrate a safe workflow before any institutional database or API integration is attempted.

## What this MVP does

1. Imports CSV, XLSX or XLS transaction files.
2. Lets the analyst map institution-specific column names to standard FinIntel fields.
3. Standardises dates, amounts, inflow/outflow direction, counterparties, narration, account/wallet identifiers and transaction IDs.
4. Calculates total inflow/outflow, net flow, originators, beneficiaries and concentration.
5. Runs explainable analytical scenarios:
   - rapid movement of funds;
   - pass-through activity;
   - repeated transactions near an analyst-configured reference amount;
   - beneficiary concentration;
   - multiple third-party originators;
   - counterparties appearing on both sides of the flow;
   - text-based crypto/VASP exposure;
   - unresolved transaction direction/data-quality alerts.
6. Produces top-originator and top-beneficiary tables.
7. Produces a simple flow-of-funds relationship view.
8. Lets analysts search/filter standardised transactions.
9. Exports standardised CSV data.
10. Generates an editable analytical summary and downloadable HTML report.

## Important analytical principle

> **Algorithms identify indicators. Analysts make intelligence judgments.**

The system does not determine that money laundering, terrorist financing or a predicate offence occurred. Alerts are screening outputs requiring human review alongside KYC/CDD, source-of-funds/source-of-wealth, transaction purpose, intelligence holdings and corroborative information.

## Privacy model

The GitHub Pages MVP analyses uploaded files in the user's browser. The application does not intentionally send the uploaded dataset to a FinIntel backend or store it in GitHub.

**Do not use real STR/SAR, KYC, account or intelligence data on a public GitHub Pages deployment.** Use sanitised or synthetic data for demonstrations. A production deployment should run in an approved protected environment with authentication, encryption, audit logs, retention controls and institutional governance.

### Excel note

CSV parsing is built into the application. XLS/XLSX parsing loads SheetJS from a public CDN. For a production offline/air-gapped environment, bundle and security-review all dependencies internally rather than relying on a CDN.

## Run locally

A simple static web server is recommended because service workers and some browser features do not work from `file://` URLs.

Example with Python:

```bash
cd docs
python -m http.server 8080
```

Then open `http://localhost:8080`.

## GitHub Pages deployment

1. Create a repository such as `finintel-aml`.
2. Upload this project preserving the folder structure.
3. Go to **Settings → Pages**.
4. Choose **Deploy from a branch**.
5. Select `main` and `/docs`.
6. Save.

The public demo can then be used with the included synthetic sample dataset.

## Project structure

```text
FinIntel_AML_MVP/
├── docs/
│   ├── index.html
│   ├── styles.css
│   ├── app.js
│   ├── sw.js
│   ├── manifest.webmanifest
│   ├── assets/
│   │   └── jctc-logo.jpeg
│   └── sample-data/
│       └── sample_transactions.csv
├── sample-data/
│   └── sample_transactions.csv
└── README.md
```

## Next development phases

### Phase 2 — Analyst workflow
- multi-account case ingestion;
- saved cases;
- entity resolution;
- reusable bank/VASP import templates;
- richer time-series and network analysis;
- cash and geographic exposure;
- configurable scenario/rule library;
- alert disposition and analyst notes;
- STR/SAR and intelligence-report templates.

### Phase 3 — Secure backend
- FastAPI or equivalent backend;
- PostgreSQL;
- role-based access control;
- institutional SSO;
- encryption at rest/in transit;
- immutable audit logging;
- secure file storage;
- retention/deletion controls;
- approved internal API connectors.

### Phase 4 — Crypto and external intelligence
- approved blockchain data APIs;
- VASP datasets;
- wallet/entity clustering inputs;
- sanctions/PEP/adverse-information sources where legally and institutionally approved;
- beneficial ownership and corporate registry integrations.

### Phase 5 — AI assistance
- transaction-pattern explanation;
- entity extraction;
- case summarisation;
- STR/SAR drafting assistance;
- investigation-lead suggestions;
- natural-language querying of authorised case data.

AI should remain an assistive layer, with all substantive findings reviewable by an analyst.
