---
name: funeral-management-architect
description: "Use when designing, reviewing, or extending the Angular 19 + Firebase Firestore funeral management system. Covers architecture, Firestore modeling, feature structure, billing/contracts, payments, inventory, reporting, printing, and production-safe branch-aware rules."
argument-hint: "Describe the module, feature, or Firestore design you want to build or review."
user-invocable: true
---

# Funeral Management System Architecture

## When to Use
- Creating or updating Angular 19 standalone features for billing, contracts, collections, packages, schedules, inventory, expenses, users, reports, or printing.
- Designing Firestore collections, summary documents, and branch-aware rules for the production app.
- Reviewing an implementation for production safety, role-based access, reporting efficiency, and maintainability.

## Core Rules
1. Use Angular 19 standalone structure.
2. Use Tailwind CSS and PrimeNG for UI.
3. Use Firebase Auth, Firestore, and Firebase Hosting only.
4. Do not design Firestore like SQL.
5. Prefer flat Firestore collections with `branchId` on business documents.
6. Use denormalized data and summary documents for reports and dashboards.
7. Use pagination, `where` filters, and limits for lists.
8. Use real-time subscriptions only when truly needed.
9. Keep the system branch-aware, role-based, and production-safe.

## Project Structure Rules
- Core services and app-wide logic: `src/app/core/`
- Shared reusable UI: `src/app/shared/`
- Business features: `src/app/features/`
- Contract forms: `src/app/features/contracts/pages/contract-form/`
- Printing logic: `src/app/core/printing/`
- Keep business forms in features, not in shared.
- Do not scatter printing logic across feature folders.
- Use feature-first organization with routes, models, services, pages, and components inside each feature.

## Architecture Defaults
- Contracts store current totals such as `grossAmount`, `totalPaid`, `balance`, and `status`.
- Payments are separate documents and never overwrite payment history.
- Inventory uses `inventoryItems` for current stock and `inventoryTransactions` for movement history.
- Packages define reusable billing bundles and are snapshotted into contracts.
- Expenses are branch-aware and report-friendly.
- Reports use summary documents such as `dashboard/{branchId}` and `reports/{branchId}/daily/...` instead of scanning raw data on every request.
- Audit logs capture user activity for owner/admin review.
- Support multiple branches and role-based menus for biller, accounting, admin, and owner.

## Recommended Working Pattern
1. Start from the existing Angular feature structure and extend it instead of introducing duplicates.
2. Identify the business document, its branch scope, and its reporting needs before writing Firestore rules or services.
3. Choose the smallest collection set that supports the feature efficiently:
   - main business collection for current state
   - supporting history collection for movements or payments
   - summary collection for reporting and dashboards
4. Add filters, limits, and pagination for list pages.
5. Keep UI business-like, fast, and easy for staff to use.
6. Verify the design is safe for production: role-based access, branch isolation, auditability, and maintainable code paths.

## What to Avoid
- SQL-style joins, large nested documents, or highly normalized Firestore structures.
- Putting contract forms or printing logic in shared UI folders.
- Realtime listeners for every list screen when pagination or occasional refresh is enough.
- Overwriting payment history or inventing duplicate source-of-truth collections.
- Designing reports by repeatedly scanning large raw collections.

## Output Quality Checklist
Before finalizing any design or code suggestion, confirm that it:
- fits the current Angular 19 standalone project structure,
- uses Firestore in a branch-aware, report-friendly way,
- keeps business logic in the correct feature or core folder,
- avoids fragile or over-engineered patterns,
- and is suitable for a real funeral management operation.
