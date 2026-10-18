# Move the revenue review desk from Leapfin

## Export and inspect

In Leapfin, open Accounting > Accounting Records, select the contract and line-item record types and export the records. Alternatively, export those record types from your connected warehouse. Leapfin describes its [accounting records](https://leapfin.atlassian.net/wiki/spaces/PD/pages/316473365/Navigating+Leapfin) and [warehouse access](https://leapfin.atlassian.net/wiki/spaces/PD/pages/148930605). Your permissions and export layout determine the available fields. Keep a full archive of the original reports, attachments, journals and rule definitions before cancelling anything.

The importer accepts CSV headings matching the documented fields: objectType, id, amount, currencyCode, description, startDate and endDate. A JSON array in that same model also works. [Line-item fields](https://leapfin.atlassian.net/wiki/spaces/PD/pages/166854666/Line+item+records) and [contract fields](https://leapfin.atlassian.net/wiki/spaces/PD/pages/166920250/Contract+records) are the reference, checked 18 October 2026. The fixture is synthetic, not a captured customer export. Field names differ between integrations; use a mapping JSON object such as {"Record Type":"objectType","External ID":"id"}. A warehouse export containing nested record data must be flattened to this documented model first.

## One import command

```
npm run revenue -- import leapfin imports/records.csv --source=your-account --mapping=imports/mapping.json --dry-run
```

Review the counts, then repeat without --dry-run. Omit --mapping when headings already match. Each record is identified by source, type and external ID. Repeat imports leave unchanged records alone. A changed record or invalid row rolls back the whole import. Different source systems with overlapping IDs need separate source names. Import each account separately.

## What maps

The amount becomes exact integer cents; currency stays separate. The description becomes the inbox label. Service dates become calendar dates, preserving the date portion of the source value without timezone conversion. All source fields, including links, customFields, discounts and statuses, remain in the original payload with a fingerprint. The source inbox is evidence, not an accounting conclusion. Inspect discounts, credits and contract status before using amounts in a recognition model.

Use the example contract and obligation formats to enter accountant-approved consideration and distinct performance obligations. Link each obligation with source_record_id from source-inbox. A line item is not automatically a distinct performance obligation. A contract's allocated consideration must reconcile before approve-contract accepts it. The imported contract remains in the source archive; the working contract is entered explicitly from the signed agreement.

## Cutover

Run both review processes for a completed month. Reconcile record counts, source amounts per currency, allocation, dates and recognised amounts. Record the accountant's evidence, then lock the month. A supported export can be loaded in a day; reconciling complex accounting or historical recognitions takes its own review. No historical recognition is inferred from an invoice line.

The base does not transfer Leapfin rule code, postings, integrations, historic approvals or files automatically. Refunds, taxes, payments and disputes are rejected by this importer and remain in their source systems. There is no billing or payment processor here. Variable consideration, multi-element automatic allocation, contract modifications, foreign exchange and ledger posting need a separately agreed implementation. Enterprise DNA maps the owner's exports and builds those agreed workflows into their version.
