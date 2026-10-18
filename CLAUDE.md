# Revenue Schedules for Claude Code

Read README.md and docs/cli.md. This is a finance team's fixed-consideration revenue review desk. The accountant owns accounting judgements. The database owns the record of those judgements.

## Working rules

- Read the whole contract before changing it. Names match without case sensitivity; ambiguity lists candidates and stops.
- Approved consideration, allocation and method are immutable. Correct an unposted recognition by voiding it with a reason. Locked months cannot be reopened here. Contract modifications need a separately designed, tested process.
- Use integer cents. Never add currencies together. The remaining allocated amount is not cash, receivables or deferred revenue.
- Require recorded performance evidence before recognising a completed month. Do not claim an IFRS or ASC certificate.
- Nothing sends, posts to a ledger, charges a card, or calls an external system. Drafts stay in drafts/.
- One organisation per private database, trusted operator credentials only. No public endpoints. Inspect access, backups and retention before using real records.
- Every runtime uses .claude/commands. AGENTS.md is the compatibility entry for Codex, OpenCode and Cursor. Do not make another command library.
- Make changes on main. Run npm test before committing. Keep exports and real imports out of git.

## Recurring jobs

| Command | Job |
|---|---|
| /contract-review | Read current contract review records. |
| /obligations | Read current obligations records. |
| /revenue-waterfall | Read current revenue waterfall records. |
| /recognition-due | Read current recognition due records. |
| /source-inbox | Read current source inbox records. |
| /retention-review | Read current retention review records. |
| /periods | Read current periods records. |
| /recognitions | Read current recognitions records. |
| /attention | Read current attention records. |
| /compliance | Read current compliance records. |
| /notes | Read current notes records. |
| /history | Read current history records. |
| /weekly-review | Read current weekly review records. |
| /insights | Read current insights records. |
| /contract | Read one contract, its obligations, schedule and notes. |
| /add | Add a verified contract, obligation or note from a JSON file. |
| /log | Record a contract review note. |
| /approve-contract | Record the accountant assessment after allocations reconcile. |
| /record-period | Record the completed month after evidence review. |
| /void-recognition | Void an incorrect review record with a reason. |
| /lock-period | Lock a fully reviewed month. |
| /review-contract | Record a review and set its next date. |
| /retain-evidence | Extend the evidence retention date. |
| /draft-weekly-review | Draft the Monday review from three current reports. |
| /draft-contract-memo | Draft a contract assessment fact pack. |
| /draft-recognition-review | Draft the completed-month recognition review. |
| /import | Import Leapfin accounting records into the source inbox. |
| /export | Export all records and their change history. |
| /view | Render private read-only dashboards. |
| /documents | Render branded contract, schedule and retention documents. |
| /customise | Change a field, rule or report with a reviewed migration. |
| /new-view | Add a read-only report from the existing records. |

## Files

scripts/revenue.mjs is the CLI. scripts/lib/db.mjs chooses local PGlite or DATABASE_URL for Postgres. Migrations live in supabase/migrations. views.json and documents.json describe private, read-only HTML output. brand.json supplies the business name, logo and colours.

Omni by Enterprise DNA builds and runs the owner's version: https://enterprisedna.co/omni/instead-of/leapfin
