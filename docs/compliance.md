# Accounting evidence checks

Checked 18 October 2026. This is an accountant-operated record review tool, not a compliance certificate or a financial reporting standard implementation. Each business determines its applicable reporting framework.

| Check | Source and scope | Behaviour |
|---|---|---|
| IFRS15-22-73 | [NZ IFRS 15, paragraphs 22 and 73](https://standards.xrb.govt.nz/standards-navigator/nz-ifrs-15/): identify distinct obligations and allocate consideration. | Flags draft contracts and allocation gaps. Approval requires a basis, evidence, reviewer and exact allocation total. The accountant performs the underlying assessment. |
| Performance evidence | [NZ IFRS 15, paragraphs 31, 35 and 39](https://standards.xrb.govt.nz/standards-navigator/nz-ifrs-15/): recognition follows satisfaction; progress measurement must fit delivery. | Supports daily allocation or a single point date, selected by the accountant. Completed-month recognition requires evidence. It does not determine control transfer or prove delivery. |
| RECORDS-7Y, NZ | [IRD record keeping](https://www.ird.govt.nz/managing-my-tax/record-keeping/records-of-income-and-expenses). | Flags a retain_until date less than seven years after the operator's retention_basis_on. The operator uses the applicable tax-period end or a later required date. No automatic deletion. |
| RECORDS-7Y, AU | [ASIC company financial records](https://asic.gov.au/for-business/running-a-company/company-officeholder-duties/what-books-and-records-should-my-company-keep/). | Same seven-year check; for an Australian company the basis must be no earlier than completion of the covered transactions. Longer holds remain the operator's responsibility. |
| POLICY-REVIEW | Internal reminder, not a statutory period. | Flags review_on dates before today. The accountant sets the review cadence. |

The schema requires the retention basis to be at least the contract end. That does not establish the legally correct basis for every record. Original evidence, backups, location requirements and legal holds need their own retention controls. The base never deletes history.

Amounts use two-decimal currencies. The fixed-consideration scope excludes variable consideration, tax, automatic standalone selling price allocations, modifications, foreign exchange, billing, payments and ledger posting. Remaining allocated consideration is not labelled deferred revenue because billing and contract liability balances are not modelled. Daily allocation is suitable only when the accountant has established even delivery over time.

The 2023-effective NZ IFRS 15 text is the reference. XRB lists a later version effective from 2027; check the version that applies to your reporting period before changing the rules. Australian users must apply their own relevant framework; the NZ reference is not an Australian compliance certification.
