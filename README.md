# Revenue Schedules for Claude Code

Own the records behind your revenue review: fixed consideration, obligations, monthly schedules and accountant evidence. Free under the MIT licence. Works with Claude Code, Codex, OpenCode or Cursor.

| Do it yourself | We customise it | We run it for you |
|---|---|---|
| Free. Install and run the fictional demo. | Your accounting policies, exports, fields and paperwork. | Installed and operated through Omni by Enterprise DNA. One setup fee, then a retainer. |
| [Start here](#quick-start) | [Get your version built](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=leapfin&utm_medium=readme) | [Talk to Sam](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=leapfin&utm_medium=readme) |

## What this replaces

The fixed-consideration revenue review desk: bring in source records, identify obligations, reconcile allocations, calculate monthly schedules and record the accountant's recognition review. This is a scoped alternative to part of Leapfin. It is not a billing platform, payment processor or complete accounting system.

Leapfin lists Premium from $1,000/month, equivalent to $12,000 for twelve months; its FAQ says subscriptions are annual. The vendor page uses a dollar symbol without an explicit currency code. Confirm currency and scope in a quote. Standard is cheaper, and Enterprise is quoted privately. This is a public price, not a verified customer invoice. [Pricing](https://www.leapfin.com/pricing), checked 18 October 2026.

## Quick start

```bash
git clone https://github.com/Enterprise-DNA-OS/revenue-schedules-for-claude-code.git
cd revenue-schedules-for-claude-code
npm install
npm test
npm run demo
```

Node 20.11 or later. The demo uses temporary fictional records and removes them afterwards. For a persistent demo, run npm run migrate then npm run seed. For real records, migrate without seeding and import into a clean database. Do not mix fictional and real accounting records.

PGlite runs locally. DATABASE_URL selects Postgres. Use one organisation per private database and trusted operator credentials. Ordinary database roles have no default access. This base does not authenticate accountants or enforce separate preparer and approver identities. Review roles, backups, storage and retention before loading real records. Exports and generated paperwork stay private.

## The weekly job

Review new source records. Resolve unallocated consideration and missing links. Read the monthly waterfall without adding currencies together. Confirm performance evidence with the accountant, record the completed month and lock it. Draft the supporting contract memo and retain the evidence.

Schedules allocate every cent exactly, including partial months and leap days. Approved contract facts cannot change. A locked month rejects new schedules and recognition changes. Incorrect recognition records can be voided with a reason before locking, and remain in history. No command posts a journal or moves money.

## Commands

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

All reads support --json. Source IDs, UUID prefixes and case-insensitive names work. Ambiguous names list candidates and exit 1. [CLI reference](docs/cli.md).

## Ten questions answered from your records

Leapfin documents that its accounting-record search cannot filter through linked records. These joined questions run today through insights. Leapfin's warehouse reporting can also support custom analysis; this is not a claim that its whole platform cannot answer them.

1. Which contracts have an allocation gap and an overdue review?
2. Which approved contracts have past revenue awaiting review?
3. Which imported line items have no obligation linked to them?
4. Which owners have both overdue reviews and pending revenue?
5. Which customers have contracts in more than one currency?
6. Which point-in-time obligations await a completed-month review?
7. Which approved contracts have short evidence retention dates?
8. Which draft obligations are already in past reporting months?
9. How much allocated consideration remains unrecorded by contract?
10. Which contracts have notes and outstanding allocation gaps?

## Your first hour: ten things to ask for

1. Show the allocation gaps.
2. Find the contracts with overdue reviews.
3. Which source lines have not been linked to an obligation?
4. Show completed months waiting for recognition review.
5. Separate the revenue waterfall by currency.
6. Draft a contract assessment from the recorded evidence.
7. Put our name and logo on the schedule documents.
8. Test our Leapfin export and show the retained fields.
9. Add a service category and group the monthly review by it.
10. Change the review cadence to our approved policy.

## Bring your records

One import command loads supported Leapfin contract and line-item CSV exports, or a JSON array using its documented record model, into the source inbox. Mapping handles different headings. Full payloads stay preserved. Changed rows fail instead of silently overwriting history. An accountant then enters the working contract, links obligations and approves the basis. [Switch guide](docs/replace-leapfin.md).

## Documents and views

npm run docs creates contract assessment memos, revenue schedule records and evidence retention reviews. npm run view creates the week, waterfall and attention pages. Set brand.json once for your business name, logo and colours. Output is read-only HTML, printable to PDF, with no server or editing screen.

## Accounting scope

Only fixed consideration with accountant-selected daily or point recognition is included. The base does not calculate standalone selling price allocations, tax, variable consideration, modifications or foreign exchange. It does not infer recognition from imported invoices. Remaining allocated consideration is not a cash, receivable or deferred revenue balance. The accountant confirms the applicable standard and evidence. [Checks and cited rules](docs/compliance.md).

npm test uses isolated storage and checks exact cents, leap days, rollback, immutable history, locked periods, imports, role access, every CLI route, documents and views. CI is configured for Linux and Windows with Node 20 and 22. A workflow file does not prove a Windows run occurred.

## Licence

MIT. Copyright 2026 Enterprise DNA. Leapfin is its owner's trademark. This independent project is not affiliated with or endorsed by Leapfin or Airwallex.
