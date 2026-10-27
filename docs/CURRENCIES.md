# Currency handling in FinIntel v3.4

Map a source Currency column when a file contains currency codes. Supported codes are kept separate, including NGN, USD, EUR, GBP, JPY and currencies with three minor decimal places. Common unambiguous labels such as naira, US$ and euro are normalized. The symbol $ alone is ambiguous and is not assumed to mean USD.

When no Currency column is mapped, the analyst-selected default applies to the dataset. If a column is mapped, blank or invalid entries are not silently replaced by the default. They appear as UNSPECIFIED and need review. Currency summaries withhold their monetary valuation. Their individual rows remain available in Appendix VI and transaction exports.

The currency selector controls the transaction tables, profiles, indicators and relationship graph. Calculations never match an inflow in one currency against an outflow in another. Repeated-amount scenario references are configured separately by currency; other currencies default to a disabled reference until explicitly configured. No exchange rates or cross-currency valuation are inferred.

The intelligence report includes each currency's financial narrative, findings, graph and individual transaction appendices. Appendix V adds a currency summary for mixed-currency reports. Appendix VI lists unresolved currency rows when present. ATTACHMENT is derived from the actual appendix headings. Accounts Register has an optional Currency column selected by default for new registers.

Downloads include Currency Summary CSV, Counterparties by Currency CSV, Selected Currency Transactions CSV, Currency Analysis Excel workbook, all transaction CSV, originator and beneficiary transaction CSV, native Word reports and PDF print preparation. All-record downloads include a currency field. Case files preserve the selected view and per-currency scenario references.

To test, run `node tests/multicurrency.cjs` with Playwright and Chromium installed. The test uses synthetic mixed-currency data offline and checks summaries, separated counterparties, different minor units, report appendices, CSV downloads, DOCX export and case restoration.
