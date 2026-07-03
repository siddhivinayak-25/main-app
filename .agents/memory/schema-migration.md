---
name: Schema migration pattern
description: How HireOS applies DB migrations safely on every server boot
---

The schema is loaded at startup via `pool.query(schema.sql)`. Because all tables use `CREATE TABLE IF NOT EXISTS`, new columns added to an existing table must be applied via `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements appended at the bottom of schema.sql under the "Idempotent migrations" comment block.

**Why:** `CREATE TABLE IF NOT EXISTS` is a no-op when the table exists, so column additions from later schema edits never reach the live DB without explicit ALTER statements.

**How to apply:** Add to the "Idempotent migrations" section in `backend/src/db/schema.sql`:
```sql
ALTER TABLE <table> ADD COLUMN IF NOT EXISTS <col> <type> DEFAULT <val>;
```
Never DROP or rename columns here — only ADD COLUMN IF NOT EXISTS.
