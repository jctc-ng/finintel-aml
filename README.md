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


---

## FinIntel AML v2 — Universal Schema Architecture

Version 2 removes the fixed-column limitation.

### 1. Dynamic Schema Builder
Analysts can create reusable FinIntel fields directly in the browser. A custom field contains:
- field name;
- data type;
- category;
- sensitivity classification;
- optional description.

Supported types include text, number, date/time, currency amount, entity, identifier, account, phone, email, crypto wallet, blockchain transaction, IP address, device ID, geography and boolean.

Custom schema definitions are stored in browser localStorage in the public MVP. Transaction/case data is not stored there by FinIntel.

### 2. Universal Source-Column Mapping
FinIntel now presents every source column and lets the analyst choose:
- a core FinIntel field;
- a custom FinIntel field;
- or Ignore / Unmapped.

Mapped custom data is preserved in the standardized record and can be exported and profiled.

### 3. Saved Import Templates
Mappings can be saved as reusable templates such as:
- Bank A transaction format;
- Bank B KYC format;
- Bitget export;
- VASP deposit/withdrawal format;
- company registry format.

Templates are matched against the source-column signature and can be reapplied when the same structure is received later.

### 4. Dataset Types
The MVP now supports:
- Transaction Data;
- Customer / KYC Data;
- Entity / Company Data;
- Crypto / VASP Data;
- Other / Custom Dataset.

Transaction datasets continue through the AML/CFT scenario engine. Other dataset types receive mapped-field profiling, completeness analysis, uniqueness analysis and repeated identifier/entity signals.

### Universal processing model

```text
RAW CSV / XLSX
      ↓
DATASET TYPE
      ↓
SCHEMA DISCOVERY
      ↓
SOURCE COLUMN → CORE / CUSTOM FIELD
      ↓
STANDARDISED RECORD
      ↓
TRANSACTION AML ANALYSIS
        or
UNIVERSAL DATA PROFILING
      ↓
ANALYST REVIEW / EXPORT / REPORT
```

### Important limitation of the public MVP

The current v2 schema library and templates are browser-local conveniences. They are not yet centrally governed, versioned or shared between analysts. A production institutional version should move schema governance, templates, cases, audit history and permissions into a protected backend.


---

## FinIntel AML v2.1 — Real-World Transaction Ingestion

Version 2.1 improves ingestion for common bank/VASP export formats.

### Minimum practical transaction fields

FinIntel can now work with the common three-column layout:

```text
Transaction Date
Description
Amount
```

Where explicit Originator/Beneficiary columns are absent, the Description Intelligence engine attempts to extract a probable counterparty and transaction meaning from the narration. All extracted values remain analyst-reviewable.

### Supported inflow/outflow layouts

FinIntel supports several common designs:

1. **Single signed Amount column**
   - explicit `+` amount → inflow;
   - explicit `-` amount or bracketed negative amount → outflow.

2. **Separate Inflow/Credit and Outflow/Debit columns**
   - a positive inflow/credit with blank or zero outflow → inflow;
   - a positive outflow/debit with blank or zero inflow → outflow.

3. **Separate Excel worksheets**
   - sheet names such as `Inflow`, `Credits`, `Deposits`, `Outflow`, `Debits`, `Withdrawals` or similar are used as direction hints;
   - all non-empty sheets are combined into one analysis dataset;
   - the original sheet name is preserved on each standardized record.

4. **Direction column**
   - values such as Credit/CR/Inflow/Deposit and Debit/DR/Outflow/Withdrawal remain supported.

5. **Description-derived direction**
   - when structured direction data is absent, narration terms such as `from`, `received`, `credited`, `to`, `payment`, `withdrawal` and similar language can provide a fallback direction clue.

FinIntel uses the strongest available evidence first: separate debit/credit columns, explicit direction, sheet direction, signed amount, description clue, then subject-based originator/beneficiary inference.

### Multi-sheet workbook loading

The Excel loader now:
- reads every non-empty worksheet rather than only the first sheet;
- reports file-read and sheet-processing progress;
- displays the number of rows, columns and sheets loaded;
- preserves source-sheet metadata;
- automatically identifies direction hints from common sheet names.

### Description Intelligence

FinIntel cleans noisy transaction narrations and attempts to extract:

- probable counterparty names;
- account-like identifiers;
- Nigerian-format phone numbers;
- email addresses;
- Ethereum and common Bitcoin wallet formats;
- transaction channels such as NIP, NEFT, RTGS, POS, ATM, USSD, mobile banking, web banking, cash and card;
- transaction meaning/category such as transfer, salary/payroll, loan/credit, crypto/VASP, cash deposit/withdrawal, POS/merchant purchase, bills/utilities, airtime/data, bank charges, tax/government payment and refund/reversal;
- direction clues.

Where no structured originator or beneficiary exists, a description-derived counterparty may be used as a fallback for counterparty aggregation and flow analysis. The record review and CSV export identify these derived values so the analyst can verify them.

### Important limitation

Description extraction in v2.1 is deterministic/rule-based, not a protected large-language-model service. Noisy bank narrations can be ambiguous. Extracted names, meanings and direction clues are therefore analytical suggestions and must be reviewed against the original description and supporting records.

A future protected institutional version can add a semantic/AI layer after the deterministic parser, with the original description retained for audit and verification.


### FinIntel AML v2.2 — Name & Entity Extraction

Description Intelligence now includes entity extraction designed for noisy financial narrations. It:
- segments slash-, colon-, pipe- and hyphen-delimited narrations;
- strips common transaction/channel/reference/account tokens before scoring candidate names;
- recognizes explicit roles such as FROM/SENDER/ORIGINATOR/PAYER and TO/BENEFICIARY/RECIPIENT/PAYEE;
- excludes common bank/channel tokens from name candidates;
- classifies candidates as person/name, company/organisation, merchant, financial institution, possible compressed name/entity, or other entity;
- detects common legal-entity terms and compact suffixes such as LTD/PLC/ENTERPRISES/VENTURES/SERVICES/LOGISTICS/TRADING/PROJECTS;
- retains multiple entity candidates with role and confidence rather than forcing one answer;
- selects the best direction-consistent counterparty for originator/beneficiary fallback;
- exposes entity type, confidence, and all extracted entities in standardized exports.

Example:

```text
NIP/CR/GTB/0123456789/MUHAMMADUSMAN/REF8821
```

may yield a probable compressed name/entity candidate `MUHAMMADUSMAN` rather than discarding the narration as unstructured noise.

Example:

```text
NIP TRF TO PRIME LOGISTICS LTD 0123456789 REF ABC998
```

can yield `PRIME LOGISTICS LTD` as a probable company/organisation and beneficiary candidate.

These are analyst-reviewable extraction hypotheses, not identity determinations.


---

## FinIntel AML v2.3 — Persistent Analyst Entity Resolution

FinIntel now supports analyst-controlled name/entity consolidation across browser sessions.

### Workflow

1. Run the transaction analysis.
2. Tick one or more names in **Top Originators** and/or **Top Beneficiaries**.
3. Enter the preferred canonical entity name.
4. Click **Save Selected Mapping**.
5. Continue selecting additional variants if required.
6. Click **Rerun Analysis** when ready.

Example:

```text
PRIME LOGISTICS LTD
PRIME LOGISTIC LIMITED
PRIME LOGISTICS
PRIME LOGISTICS LTD.
        ↓
Prime Logistics Limited
```

The rerun applies the canonical entity before counterparty aggregation, so counts, values, shares, concentration metrics, network views and analytical summaries are recalculated using the consolidated entity.

### Persistence

Alias mappings are saved in browser localStorage under the FinIntel application. They survive:
- page refreshes;
- browser restarts;
- new FinIntel sessions on the same browser/profile.

The ordinary **Clear Session** action does not delete saved entity aliases. The Alias Manager contains a separate **Clear Library** control.

### Alias library controls

The analyst can:
- review every stored alias and its canonical entity;
- delete an individual alias;
- clear the whole library;
- export the alias library as JSON for backup/audit.

### Shared counterparty column

Version 2.3 also introduces the core field **Counterparty / Other Party** for transaction datasets in which originator and beneficiary are stored in the same source column. After transaction direction is resolved:
- inflow → the shared counterparty is treated as the originator;
- outflow → the shared counterparty is treated as the beneficiary.

### Governance note

Persistent alias mappings represent analyst judgments, not automated identity determinations. Analysts should validate that name variants actually refer to the same person or entity before consolidation, particularly where names are common or ambiguous.
