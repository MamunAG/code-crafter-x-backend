# Code Crafter X Backend

NestJS and PostgreSQL backend for the Code Crafter X platform. The HR and payroll domain supports organization/factory isolation, employee lifecycle history, shifts, attendance, leave, compensation, loans, Bangladesh statutory policies, background payroll calculation, approval/locking, payslips, imports, and reports.

## Requirements

- Node.js 22+
- Yarn 1.x
- PostgreSQL with `uuid-ossp`; the existing project also enables PostGIS
- A 32-byte or stronger `ENCRYPTION_KEY`
- A Unicode Bangla TTF/OTF file for Bangla PDF output

Copy `.env.example` to `.env`, provide secrets, and install dependencies:

```bash
yarn install
yarn migration:run
yarn build
```

Run the API and the database-backed payroll/import worker as separate processes:

```bash
yarn start:dev
yarn start:worker:dev
```

Production uses `yarn start:prod` and `yarn start:worker` after building. Do not enable TypeORM synchronization; schema changes must use reviewed migrations.

## HR and payroll modules

HR/payroll code is organized by business domain. Organization settings, generic HR master data, shifts, salary structures, and statutory rules live under `src/hr-payroll/master-data`. Employee, attendance, roster, leave, salary assignment, loan, payroll, imports, reports, audit, and health are independent modules directly under `src/hr-payroll`. Every controller, database entity, and DTO is implemented in its owning module; DTOs and entities use one class per file. Shared enums, tenant pagination, the tenant base entity, TypeORM/DTO registry barrels, and internal cross-domain helpers live under `src/hr-payroll/common`; there is no consolidated `core` module or shared controller layer.

## HR and payroll API

Swagger is served at `/api/docs`. Existing department, designation, and employee routes remain under `/api/v1/hr`. New routes include:

- `/master-data`, `/employees/:id/history`, `/shifts`, and `/rosters`
- `/attendance`, `/integrations/attendance/punches`, and attendance corrections/overtime
- `/leave`, `/compensation`, `/loans`, and `/statutory-rules`
- `/payroll-runs`, `/payslips`, `/reports`, and `/imports`
- `/health`, `/health/ready`, and authenticated admin `/health/metrics`

Administrative requests require JWT authentication and `x-organization-id`. Payroll creation, calculation, and reversal requests require `Idempotency-Key`. Attendance integrations use a one-time generated `x-attendance-key`; only its bcrypt hash is stored.

## Formula model

Salary components use a non-evaluating expression parser. Allowed functions are `MIN`, `MAX`, `ROUND`, `FLOOR`, `CEIL`, `ABS`, `COALESCE`, and `IF`. Arithmetic and comparisons are supported; unknown variables, unsafe syntax, division by zero, and dependency cycles are rejected.

Stable input variables include `BASE`, `CALENDAR_DAYS`, `WORKING_DAYS`, `PAYABLE_DAYS`, `PRESENT_DAYS`, `ABSENT_DAYS`, `UNPAID_LEAVE_DAYS`, `OVERTIME_HOURS`, `LATE_MINUTES`, `LOAN_DEDUCTION`, `ARREARS`, `BONUS`, `TAX_DEDUCTION`, `PF_EMPLOYEE`, `PF_EMPLOYER`, and `GRATUITY`. Earlier component codes may be referenced by later components.

Example:

```text
BASIC = ROUND(BASE * 0.60, 2)
HOUSE = ROUND(BASIC * 0.50, 2)
OVERTIME = ROUND(OVERTIME_HOURS * (BASIC / 208) * 2, 2)
INCOME_TAX = TAX_DEDUCTION
LOAN = LOAN_DEDUCTION
```

Once used by payroll, salary structures and statutory rule packs are locked. Calculated employee rows retain their input snapshots, formula traces, rule versions, and rounding results.

## Payroll workflow

Payroll runs support weekly, biweekly, semimonthly, monthly, bonus, arrears, adjustment, final-settlement, and reversal processing.

```text
DRAFT -> CALCULATING -> PREPARED -> UNDER_REVIEW -> APPROVED -> LOCKED
```

The preparer, reviewer, and approver must be different users. Locked results cannot be edited. Corrections use adjustment or reversal runs. A locked reversal copies the original immutable snapshot with opposite values and marks the original run reversed.

The worker claims queued jobs using PostgreSQL row locks with `SKIP LOCKED`, leases, bounded retries, chunked processing, progress updates, and stalled-job recovery. Redis is not required.

## Imports and reports

`POST /api/v1/hr/imports/:type` accepts the first worksheet of CSV/XLSX files for `employee-details`, `leave-balances`, `loans`, `salary-assignments`, or `payroll-ytd`. Imports are limited to 10,000 rows and return a background job ID with row-level errors.

Reports support JSON pagination, XLSX, and PDF. Available types include attendance, overtime, headcount, leave, salary history, loans, payroll register/variance, deductions, tax, provident fund, gratuity, and final settlements. Payslips may be generated individually or for a locked run in English or Bangla.

## Bangladesh compliance

`POST /api/v1/hr/statutory-rules/bangladesh/default` creates a draft AY 2026-27 reference policy. It is intentionally inactive until a different user reviews and approves it. Every policy retains source URL, publication date, jurisdiction, effective dates, version, approval, and lock metadata.

Compliance values must be reviewed by qualified payroll/legal staff against current NBR and Ministry of Labour publications before activation. Create a new effective-dated version for regulatory changes; never edit a locked version.

## Operations and backup

- Back up PostgreSQL before migrations and test restore procedures regularly.
- Run at least one API process and one worker process; multiple workers are safe.
- Monitor `/api/v1/hr/health/metrics` for failed/stalled jobs and payroll state counts.
- Forward structured HTTP logs and `x-request-id` to the deployment log platform.
- Preserve audit, locked payroll, and snapshot tables. No automatic HR/payroll retention deletion is enabled.
- Rotate JWT, attendance, SMTP, storage, and encryption credentials through the deployment secret manager. Rotating `ENCRYPTION_KEY` requires a controlled data re-encryption migration.

## Verification

```bash
yarn build
yarn test --runInBand
yarn test:e2e --runInBand
yarn migration:show
```
