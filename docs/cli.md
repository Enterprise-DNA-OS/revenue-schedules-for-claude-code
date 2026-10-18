# CLI reference

Use npm run revenue -- followed by a command. All data commands accept --json; human output is the default. Flags use --name=value. Unknown flags and extra arguments fail. Source IDs win before UUID prefixes and case-insensitive name matching. Ambiguity lists the matching records and exits 1.

Read commands: contract-review, obligations, revenue-waterfall, recognition-due, source-inbox, retention-review, periods, recognitions, attention, compliance, notes, history, weekly-review, insights. Use contract <name-or-id> for the complete file. history returns the latest 50 changes; export includes all changes.

## Writes

```
npm run revenue -- add contracts --file=examples/contract.json --actor=Alex
npm run revenue -- add obligations --file=examples/obligation.json --actor=Alex
npm run revenue -- log example-contract --text="Checked the agreement" --actor=Alex
npm run revenue -- approve-contract example-contract --basis="One distinct service, even daily delivery, fixed consideration" --evidence="Approved assessment memo" --actor=Accountant
npm run revenue -- record-period 2026-01-01 --evidence="Service delivery confirmed and source totals reconciled" --actor=Accountant
npm run revenue -- void-recognition <source-id> --evidence="Correction reason" --actor=Accountant
npm run revenue -- lock-period 2026-01-01 --evidence="Review complete" --actor=Accountant
npm run revenue -- review-contract example-contract --next=2027-01-01 --evidence="Review completed"
npm run revenue -- retain-evidence example-contract --until=2035-03-31 --evidence="Retention policy decision"
```

Examples are fictional. Replace their evidence and accounting assessment with actual reviewed facts. Contracts and obligations accept only the fields documented in scripts/lib/entities.json. Dates use YYYY-MM-DD. amount_cents is a positive safe integer. Supported currencies are NZD, AUD, USD, GBP and EUR, each treated as two-decimal currencies. Daily recognition uses inclusive start/end dates and exact cumulative monthly rounding. Point recognition requires one evidence-backed date. Contract allocations must equal the fixed consideration before approval. No standalone selling price allocation is calculated automatically.

record-period records every pending schedule in that completed month atomically. Any draft contract in that month's schedule blocks the entire write. The evidence must support every included obligation. Voiding preserves the original record, permits a replacement in an open month, and requires a reason. A locked month rejects changes and new schedules. The actor is operator-supplied attribution, not an authenticated signature or separation-of-duties system.

## Import, drafts and export

```
npm run revenue -- import leapfin examples/leapfin/records.csv --source=sample --dry-run
npm run revenue -- import leapfin examples/leapfin/records.csv --source=sample
npm run revenue -- draft-weekly-review
npm run revenue -- draft-contract-memo example-contract
npm run revenue -- draft-recognition-review
npm run revenue -- export
```

Import accepts a CSV file or a JSON array of contract and line-item records in Leapfin's documented model. --mapping=path.json maps your export's headings to the field names. A source identifies one export account; keep it stable. Review the import guide before loading records. Draft commands save current fact packs as private JSON for prose drafting. Export saves all domain records and the audit history as a private JSON snapshot. Export is portable data, not a tested database backup/restore command. Use database backups for recovery.
