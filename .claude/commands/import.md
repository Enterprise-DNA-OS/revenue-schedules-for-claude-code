# import

Import Leapfin accounting records into the source inbox.

Run `npm run revenue -- import leapfin <file.csv> --source=<export-account> --dry-run --json`. Read the full result before summarising.

Read docs/replace-leapfin.md first. Check the dry-run counts and retained fields. With the operator's instruction, repeat without --dry-run. Review source-inbox, then create contracts and link obligations to their imported source IDs. Import never approves accounting treatment.

If a name is ambiguous, show the candidates and stop that action. Never guess a record or manufacture evidence.
