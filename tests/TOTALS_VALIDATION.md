# FinIntel v3.2 totals validation

Tested on 25 October 2026 against commit `69c7a31154c18a600dc6f6582bb22b7371c14f64`, in Chromium 153 with browser networking disabled after initial cache preparation.

Four synthetic statements containing 20 rows were imported through the actual CSV/XLSX upload interface. Expected amounts were specified in integer kobo and separately checked with Python Decimal arithmetic. No production calculation helpers were used to produce the expected values.

| Statement | Inflow NGN | Outflow NGN | Net NGN | Result |
|---|---:|---:|---:|---|
| Single amount CSV | 350,500.00 | 146,000.30 | 204,499.70 | PASS |
| Separate debit and credit Excel columns | 2,000,000.50 | 875,050.85 | 1,124,949.65 | PASS |
| Separate credit and debit Excel worksheets | 130,000.30 | 70,000.20 | 60,000.10 | PASS |
| Duplicates and conflicting directions | 10,000.00 | 1,000.00 | 9,000.00 | PASS |

Each test checked inflow/outflow totals, net movement, transaction counts, unresolved-direction counts, leading-zero account identifiers, and reconciliation of originator and beneficiary totals. Every test was repeated through a serialized Save Case / Open Case round trip. All totals remained unchanged. No browser JavaScript errors were observed.

The first case verified that NGN 499.25 with an unknown counterparty remains included in inflow totals. The quality-control case verified that possible duplicates are flagged and remain included, while a row containing both debit and credit is unresolved and excluded from classified inflow/outflow totals. A missing-amount row also remains unresolved. These are review controls, not automatic corrections.

## Limits

These are controlled synthetic fixtures, not sanitised real-bank statements. They do not establish completeness for arbitrary bank formats, balance reconciliation, multi-currency aggregation, or the accuracy of every AML scenario. No financial totals implementation change was needed for these four tests.

The next validation should use analyst-supplied sanitised statements with independently approved totals and, where available, opening and closing balances. Remove identifying details while keeping transaction values, debit/credit direction, dates, and row structure intact.

## Reproduce

Install Playwright and Chromium, then run `node tests/validate-totals.cjs`. Optional variables `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE` select an existing installation. Reference inputs and machine-readable results are in `tests/fixtures/statement-totals.json` and `tests/fixtures/statement-totals-results.json`.
