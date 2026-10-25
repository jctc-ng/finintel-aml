# FinIntel online and offline use

Open FinIntel online once and wait for **Online · Ready for offline use**. Install App is available when the browser supports installation. Otherwise bookmark the app and keep using the same browser profile. The first visit and downloading updates require internet.

## Cases

Use **Save Case** to download a `.finintel.json` file before closing or clearing the workspace. **Open Case** restores the uploaded records, mappings, custom fields, aliases, counterparty resolutions, subject profile, photograph, account register, report edits and analysis settings. Analysis is recalculated from the saved source records and settings. Do not edit the case file manually.

Saving is explicit: the application does not automatically save case data to a server. The downloaded case file contains the imported information, including any photograph and identifiers. Keep it in an appropriate location. A case file is not an encrypted container.

## Available offline

- CSV and Excel transaction imports
- Subject-profile and account-register imports
- Analysis, alias resolution, data-quality review and relationship graphs
- Draft report editing, CSV output and native DOCX exports with embedded images
- Print preparation for the browser's Print / Save as PDF function
- Save Case and Open Case

External database or blockchain searches, GitHub access and downloading updates require internet.

## Updates and storage

When online, use **Check / Apply Update**. If an update is downloading, wait for the update-ready message and click the button again after saving your case. The current application remains active until the complete update is installed.

The browser manages offline app storage. Clearing site data, using a different browser profile, private browsing or browser storage eviction can remove the installed files. Reconnect to prepare the app again if that happens. Downloaded case files are separate from the browser cache.

## Verification

The browser smoke test uses synthetic data and disables networking after the initial install. It checks offline restart, Excel transaction and subject-profile imports, account-list import, analysis, graph rendering, photo upload, report drafts, Save Case / Open Case, report and graph DOCX exports, PDF print preparation and invalid-case rejection. Run `node tests/offline-smoke.cjs` with Playwright and its Chromium browser installed. Optional environment variables: `PLAYWRIGHT_MODULE` and `CHROMIUM_EXECUTABLE`.

The SheetJS Excel reader is bundled under `vendor/` with its Apache 2.0 license. It is not loaded from a CDN during application use.
