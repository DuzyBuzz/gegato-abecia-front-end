# Firestore Backend Structure  
## Funeral Management System

This document defines the recommended Firestore backend structure for the funeral management system.

The goal is to keep the database:
- production-safe
- branch-aware
- fast to query
- friendly for daily billing and collection work
- good for reports
- easy to maintain in Angular + Firebase

---

# 1. System modules

The system includes:

- Billing / Contracts
- Collections / Payments
- Packages
- Burial Schedules
- Inventory
- Inventory Transactions
- Suppliers
- Expenses
- Users / Roles
- Audit Logs
- Dashboard
- Reports
- Printing / Document Generation

---

# 2. Core design rules

## 2.1 Keep it Firestore-native
Do not design this like SQL tables and joins.

Use:
- flat root collections
- document snapshots
- summary documents
- transaction history documents
- pagination
- branch filtering

## 2.2 Put `branchId` on every business document
Every important record must have:

```json
{
  "branchId": "branch_001"
}
```

This includes:
- contracts
- payments
- contract items
- inventory items
- inventory transactions
- expenses
- schedules
- packages
- audit logs
- clients
- suppliers if branch-specific

## 2.3 Keep current state and history separate
Examples:
- `inventoryItems` = current stock state
- `inventoryTransactions` = stock movement history
- `contracts` = current billing state
- `payments` = payment history

## 2.4 Use summary documents for reports
Do not calculate dashboard totals from raw data every time.

Use:
- `dashboard/{branchId}`
- `reports/{branchId}/daily/{yyyy-mm-dd}`
- `reports/{branchId}/monthly/{yyyy-mm}`
- `reports/{branchId}/yearly/{yyyy}`

## 2.5 Use real-time listeners only when needed
Use `onSnapshot` only for:
- schedules
- active live status screens
- notifications

Avoid subscribing to everything on the dashboard.

---

# 3. Recommended Firestore structure

```text
branches/{branchId}

users/{userId}

clients/{clientId}

servicePackages/{packageId}
packageItems/{packageItemId}

contracts/{contractId}
contractItems/{contractItemId}

payments/{paymentId}

suppliers/{supplierId}

inventoryItems/{itemId}
inventoryTransactions/{transactionId}

expenses/{expenseId}

burialSchedules/{scheduleId}

auditLogs/{logId}

dashboard/{branchId}

reports/{branchId}/daily/{yyyy-mm-dd}
reports/{branchId}/weekly/{yyyy-ww}
reports/{branchId}/monthly/{yyyy-mm}
reports/{branchId}/yearly/{yyyy}
```

---

# 4. Collection definitions

## 4.1 branches

Stores branch records.

### Document path
```text
branches/{branchId}
```

### Example
```json
{
  "branchCode": "BR-001",
  "branchName": "Main Branch",
  "address": "Cebu City",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 4.2 users

Stores system users and access control data.

### Document path
```text
users/{userId}
```

### Example
```json
{
  "fullName": "Juan Dela Cruz",
  "email": "juan@example.com",
  "role": "admin",
  "branchId": "branch_001",
  "isActive": true,
  "permissions": {
    "canViewReports": true,
    "canManageUsers": true,
    "canEditContracts": true
  },
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Roles
- `owner`
- `admin`
- `accounting`
- `biller`
- `viewer`

---

## 4.3 clients

Optional but recommended if one customer can have multiple deceased cases and you want one SOA per client.

### Document path
```text
clients/{clientId}
```

### Example
```json
{
  "branchId": "branch_001",
  "clientCode": "CL-0001",
  "fullName": "Juan Dela Cruz",
  "contactNo": "09123456789",
  "address": "Tuburan, Cebu",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 4.4 servicePackages

Defines funeral packages.

### Document path
```text
servicePackages/{packageId}
```

### Example
```json
{
  "branchId": "branch_001",
  "packageCode": "PKG-001",
  "packageName": "Basic Funeral Package",
  "description": "Standard package with casket and embalming",
  "basePrice": 45000,
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 4.5 packageItems

Defines what is included in a package.

### Document path
```text
packageItems/{packageItemId}
```

### Example
```json
{
  "branchId": "branch_001",
  "packageId": "package_001",
  "itemType": "INVENTORY",
  "itemId": "item_001",
  "itemName": "Standard Casket",
  "quantity": 1,
  "includedPrice": 20000,
  "createdAt": "timestamp"
}
```

### For service-based items
```json
{
  "branchId": "branch_001",
  "packageId": "package_001",
  "itemType": "SERVICE",
  "description": "Embalming Service",
  "quantity": 1,
  "includedPrice": 5000,
  "createdAt": "timestamp"
}
```

---

## 4.6 contracts

This is the billing header and the main financial document.

### Document path
```text
contracts/{contractId}
```

### Example
```json
{
  "branchId": "branch_001",
  "contractNo": "CTR-2026-0001",
  "clientId": "client_001",
  "clientName": "Juan Dela Cruz",
  "deceasedName": "Maria Dela Cruz",
  "packageId": "package_001",
  "packageName": "Basic Funeral Package",
  "packagePrice": 45000,
  "grossAmount": 50000,
  "discountAmount": 5000,
  "netAmount": 45000,
  "totalPaid": 15000,
  "balance": 30000,
  "status": "ACTIVE",
  "remarks": "",
  "createdBy": "user_001",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Status values
- `DRAFT`
- `ACTIVE`
- `PAID`
- `COMPLETED`
- `CANCELLED`

---

## 4.7 contractItems

Stores billing details, including packages, services, and inventory items.

### Document path
```text
contractItems/{contractItemId}
```

### Example
```json
{
  "branchId": "branch_001",
  "contractId": "contract_001",
  "contractNo": "CTR-2026-0001",
  "itemType": "INVENTORY",
  "itemId": "item_001",
  "itemCode": "CAS-001",
  "description": "Premium Casket",
  "quantity": 1,
  "unitPrice": 18000,
  "totalPrice": 18000,
  "createdAt": "timestamp"
}
```

### Service item example
```json
{
  "branchId": "branch_001",
  "contractId": "contract_001",
  "contractNo": "CTR-2026-0001",
  "itemType": "SERVICE",
  "description": "Embalming Service",
  "quantity": 1,
  "unitPrice": 5000,
  "totalPrice": 5000,
  "createdAt": "timestamp"
}
```

---

## 4.8 payments

Stores payment history. Do not overwrite payment records.

### Document path
```text
payments/{paymentId}
```

### Example
```json
{
  "branchId": "branch_001",
  "contractId": "contract_001",
  "contractNo": "CTR-2026-0001",
  "clientId": "client_001",
  "clientName": "Juan Dela Cruz",
  "receiptNo": "OR-2026-0001",
  "paymentDate": "timestamp",
  "paymentMethod": "CASH",
  "amount": 5000,
  "receivedBy": "user_001",
  "remarks": "",
  "createdAt": "timestamp"
}
```

### Payment methods
- `CASH`
- `GCASH`
- `BANK_TRANSFER`
- `CHECK`
- `OTHER`

---

## 4.9 suppliers

Stores suppliers for inventory IN transactions.

### Document path
```text
suppliers/{supplierId}
```

### Example
```json
{
  "supplierCode": "SUP-001",
  "supplierName": "ABC Casket Supplier",
  "contactPerson": "Juan Dela Cruz",
  "contactNo": "09123456789",
  "address": "Cebu City",
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 4.10 inventoryItems

Stores current item stock state.

### Document path
```text
inventoryItems/{itemId}
```

### Example
```json
{
  "branchId": "branch_001",
  "itemCode": "CAS-001",
  "itemName": "Premium Casket",
  "category": "Casket",
  "unit": "pcs",
  "supplierId": "supplier_001",
  "supplierName": "ABC Casket Supplier",
  "stockOnHand": 15,
  "reservedQuantity": 2,
  "availableQuantity": 13,
  "costPrice": 12000,
  "sellingPrice": 18000,
  "reorderLevel": 5,
  "isActive": true,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Rule
`stockOnHand` is the current stock snapshot.
Do not treat it as the only truth. The history is in `inventoryTransactions`.

---

## 4.11 inventoryTransactions

Stores stock movement history.

### Document path
```text
inventoryTransactions/{transactionId}
```

### Allowed transaction types
- `IN`
- `OUT`
- `ADJUSTMENT`
- `TRANSFER_IN`
- `TRANSFER_OUT`

### IN example
```json
{
  "branchId": "branch_001",
  "itemId": "item_001",
  "itemCode": "CAS-001",
  "itemName": "Premium Casket",
  "category": "Casket",
  "transactionType": "IN",
  "quantity": 10,
  "unitCost": 12000,
  "totalCost": 120000,
  "supplierId": "supplier_001",
  "supplierName": "ABC Casket Supplier",
  "referenceNo": "PO-2026-0001",
  "remarks": "Initial stock purchase",
  "createdBy": "user_001",
  "createdAt": "timestamp"
}
```

### OUT example
```json
{
  "branchId": "branch_001",
  "itemId": "item_001",
  "itemCode": "CAS-001",
  "itemName": "Premium Casket",
  "category": "Casket",
  "transactionType": "OUT",
  "quantity": 1,
  "contractId": "contract_001",
  "contractNo": "CTR-2026-0001",
  "remarks": "Used in billing",
  "createdBy": "user_001",
  "createdAt": "timestamp"
}
```

### ADJUSTMENT example
```json
{
  "branchId": "branch_001",
  "itemId": "item_001",
  "itemCode": "CAS-001",
  "itemName": "Premium Casket",
  "category": "Casket",
  "transactionType": "ADJUSTMENT",
  "quantity": -1,
  "reason": "Damaged item",
  "remarks": "Physical count correction",
  "createdBy": "user_001",
  "createdAt": "timestamp"
}
```

---

## 4.12 expenses

Stores operational expenses.

### Document path
```text
expenses/{expenseId}
```

### Example
```json
{
  "branchId": "branch_001",
  "expenseDate": "timestamp",
  "category": "Transportation",
  "description": "Fuel Expense",
  "amount": 1500,
  "paidTo": "Gas Station",
  "paymentMethod": "CASH",
  "createdBy": "user_001",
  "createdAt": "timestamp"
}
```

### Expense categories
- Transportation
- Utilities
- Office Supplies
- Maintenance
- Salary
- Food
- Miscellaneous

---

## 4.13 burialSchedules

Stores funeral or burial schedules.

### Document path
```text
burialSchedules/{scheduleId}
```

### Example
```json
{
  "branchId": "branch_001",
  "contractId": "contract_001",
  "contractNo": "CTR-2026-0001",
  "deceasedName": "Maria Dela Cruz",
  "scheduleDate": "timestamp",
  "location": "Cemetery A",
  "status": "PENDING",
  "remarks": "",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Status values
- `PENDING`
- `CONFIRMED`
- `COMPLETED`
- `CANCELLED`

---

## 4.14 auditLogs

Stores all important user actions for owner/admin review.

### Document path
```text
auditLogs/{logId}
```

### Example
```json
{
  "branchId": "branch_001",
  "userId": "user_001",
  "userName": "Juan Dela Cruz",
  "role": "biller",
  "module": "contracts",
  "actionType": "CREATE",
  "recordId": "contract_001",
  "description": "Created new funeral contract",
  "beforeData": null,
  "afterData": {},
  "createdAt": "timestamp"
}
```

### Action types
- `CREATE`
- `UPDATE`
- `DELETE`
- `LOGIN`
- `LOGOUT`
- `PRINT`
- `APPROVE`
- `CANCEL`
- `PAYMENT_POSTED`
- `INVENTORY_OUT`
- `INVENTORY_IN`

---

## 4.15 dashboard

Stores precomputed branch summary values.

### Document path
```text
dashboard/{branchId}
```

### Example
```json
{
  "todayBillings": 25000,
  "todayCollections": 15000,
  "monthBillings": 300000,
  "monthCollections": 220000,
  "todayExpenses": 3000,
  "monthExpenses": 80000,
  "activeContracts": 32,
  "paidContracts": 18,
  "lowStockCount": 4,
  "upcomingSchedules": 6,
  "updatedAt": "timestamp"
}
```

---

## 4.16 reports

Use summary reports for speed.

### Daily
```text
reports/{branchId}/daily/{yyyy-mm-dd}
```

### Monthly
```text
reports/{branchId}/monthly/{yyyy-mm}
```

### Yearly
```text
reports/{branchId}/yearly/{yyyy}
```

### Example report document
```json
{
  "billings": 50000,
  "collections": 15000,
  "expenses": 5000,
  "net": 10000,
  "contractsCount": 3,
  "paymentsCount": 5,
  "updatedAt": "timestamp"
}
```

---

# 5. Recommended business flows

## 5.1 Create contract
1. Create `contracts` document
2. Create `contractItems` documents
3. If package selected, copy package items into contract snapshot
4. If inventory item is used, create `inventoryTransactions` OUT
5. Update inventory stock
6. Update dashboard/report summaries
7. Add audit log

## 5.2 Post payment
1. Create `payments` document
2. Update contract `totalPaid`
3. Recalculate `balance`
4. Update status if fully paid
5. Update dashboard/report summaries
6. Add audit log

## 5.3 Inventory IN
1. Create `inventoryTransactions` IN
2. Update `inventoryItems.stockOnHand`
3. Update `availableQuantity`
4. Save supplier reference
5. Add audit log

## 5.4 Inventory OUT
1. Create `inventoryTransactions` OUT
2. Update `inventoryItems.stockOnHand`
3. Update `availableQuantity`
4. Link to contract
5. Add audit log

## 5.5 Expense entry
1. Create `expenses` document
2. Update dashboard/report summaries
3. Add audit log

## 5.6 Schedule creation
1. Create `burialSchedules` document
2. Link to contract
3. Update schedule summary widgets
4. Add audit log

---

# 6. What to avoid

## 6.1 Avoid nested business data like this
```text
clients/{clientId}/contracts/{contractId}/payments/{paymentId}
```

This is bad for:
- reporting
- branch-wide queries
- collections summaries
- dashboard performance

## 6.2 Avoid calculating everything from raw data every time
Do not load all records and compute totals in Angular for dashboards and reports.

## 6.3 Avoid real-time listeners everywhere
Do not subscribe to contracts, payments, expenses, and inventory all at once on every screen.

## 6.4 Avoid missing branchId
If `branchId` is missing, branch security and filtering will become messy.

## 6.5 Avoid huge documents
Keep payment history, inventory movement, and contract items in separate collections.

## 6.6 Avoid editing history directly
Payments and inventory transactions should be append-only in normal operations.

---

# 7. Query strategy

Use this pattern:
- `where`
- `orderBy`
- `limit`
- pagination with `startAfter`

### Example contract query
```ts
where("branchId", "==", branchId)
where("status", "==", "ACTIVE")
orderBy("createdAt", "desc")
limit(20)
```

### Example payment query
```ts
where("branchId", "==", branchId)
where("paymentDate", ">=", startDate)
where("paymentDate", "<=", endDate)
orderBy("paymentDate", "desc")
limit(50)
```

### Example inventory transaction query
```ts
where("branchId", "==", branchId)
where("transactionType", "==", "OUT")
orderBy("createdAt", "desc")
limit(50)
```

---

# 8. Suggested composite indexes

Create indexes for the queries you will actually use.

## Contracts
- `branchId + status + createdAt`
- `branchId + contractNo`
- `branchId + clientName + createdAt`

## Payments
- `branchId + paymentDate`
- `branchId + contractId + paymentDate`
- `branchId + receiptNo`

## Inventory
- `branchId + category`
- `branchId + itemName`
- `branchId + createdAt`

## Inventory transactions
- `branchId + transactionType + createdAt`
- `branchId + itemId + createdAt`
- `branchId + contractId + createdAt`

## Expenses
- `branchId + expenseDate`
- `branchId + category + expenseDate`

## Schedules
- `branchId + scheduleDate`
- `branchId + status + scheduleDate`

## Audit logs
- `branchId + createdAt`
- `branchId + userId + createdAt`
- `branchId + module + createdAt`

---

# 9. Security rules concept

Rules should enforce:
- authenticated users only
- branch isolation
- role-based access
- viewer-only schedule access
- admin/owner access to all branches
- no open access to finance data

General rule idea:
- user can read/write only if their `branchId` matches the document
- admin/owner can access all
- viewer can only read schedules and limited dashboard data

---

# 10. Printing integration

Do not put printing logic inside feature pages.

Use a centralized module:

```text
src/app/core/printing/
```

Store print templates/services for:
- contract print
- statement of account
- receipts
- schedule print
- inventory reports
- expense reports

---

# 11. Production checklist

Before going live, make sure:
- every document has `branchId`
- all money-related updates use transactions
- inventory updates create transaction history
- all lists use pagination
- dashboards use summary documents
- reports are precomputed where possible
- audit logs are written for important actions
- security rules block unauthorized access
- contract numbers and receipt numbers are controlled
- print templates are centralized

---

# 12. Final recommendation

This Firestore structure is the one to use for a funeral management system that needs:
- contracts
- collections
- packages
- inventory
- expenses
- schedules
- reports
- owner auditing
- multi-branch support

It is production-safe if you follow the rules above.

