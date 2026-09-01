# Pilot Data Protection Boundary

## Allowed pilot data

Controlled hosted validation is restricted to repository-provided synthetic/demo organizations, identities, XLSX/CSV fixtures, and non-sensitive participant process measures. Real customer financial workbooks, customer names, employee data, credentials, and production exports are prohibited.

## Current workbook controls

Workbooks are stored as tenant-owned private PostgreSQL `Bytes`; the application exposes no public workbook URL. Metadata includes original/sanitized name, MIME type, byte size, SHA-256, tenant, and upload time. Server authorization scopes every read and mutation to the session organization.

Uploads are treated as untrusted input. The implementation:

- accepts only `.xlsx` and `.csv`;
- enforces the 5 MB compressed limit and bounded XLSX expansion/entry/sheet/row/column/formula limits;
- validates extension, MIME and XLSX ZIP signature or CSV null-byte safety;
- strips path components and sanitizes filenames;
- never executes VBA/macros;
- reads formula metadata but does not evaluate formulas;
- persists validation errors and never silently corrects financial source values.

## Real-data gate

Private object storage, tenant-scoped keys, controlled downloads, object retention/versioning, and malware scanning are not certified. Therefore real FP&A workbook use is `BLOCKED`. PostgreSQL byte storage is accepted only for this synthetic controlled validation. Malware scanning status is `PARTIAL`; no scanning claim is made.

Exports are generated on an authorized request from approved/locked tenant data and are not stored at a public URL. Demo credentials must not be reused outside the isolated Preview.
