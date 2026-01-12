# LLAS (LLAccounting System)

## Overview
LLAS is a multi-user Excel-based accounting application for Philippine small businesses (particularly sari-sari stores). The system simplifies double-entry bookkeeping into single-entry format and automatically generates Excel workbooks with 7 sheets.

## Recent Changes
- **2024-12-31**: Updated BIR forms - removed 2550-M (now quarterly only), added SLS/SLP Summary Lists
- **2024-12-31**: Added Tax Computation tab with MCIT/NOLCO schedules to Financial Reports
- **2024-12-27**: Implemented comprehensive BIR Tax Reporting system with 14 forms
- **2024-12-27**: Added payroll management system (employees, payroll periods, payroll records)
- **2024-12-27**: Created BIR Reports page with Monthly/Quarterly/Annual tabs and Excel export
- **2024-12-18**: Integrated Stripe payment system for annual subscriptions at PHP 2,999/year
- **2024-12-18**: Added Stripe checkout, customer portal, and webhook handlers
- **2024-12-18**: Created LLAS product and annual price in Stripe

## Architecture

### Stack
- **Frontend**: React with Vite, TailwindCSS, shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Payments**: Stripe for subscriptions

### Key Features
1. **Chart of Accounts** - 30+ standard Philippine accounts
2. **Cash Receipts** - Record income with VAT calculations
3. **Cash Disbursements** - Record expenses with VAT calculations
4. **Journal-Ledger** - Consolidated view of all transactions
5. **VAT Sales Book** - BIR-compliant VAT sales report
6. **VAT Purchase Book** - BIR-compliant VAT purchase report
7. **Financial Reports** - Summary financial statements
8. **Excel Export** - Complete 7-sheet workbook generation

### Payment Integration
- **Payment Method**: GCash only (manual payment processing)
- **Subscription**: PHP 2,000/month paid annually (PHP 24,000/year)
- **Contact**: support@llas.ph for payment inquiries
- **Legacy Stripe**: Card payment code exists but not primary method

### File Structure
```
server/
  stripeClient.ts      - Stripe SDK initialization
  stripeService.ts     - Stripe API operations
  webhookHandlers.ts   - Stripe webhook processing
  routes.ts            - API endpoints
  storage.ts           - Database operations

client/src/pages/
  Subscription.tsx     - Payment & subscription management
  Dashboard.tsx        - Main dashboard
  Onboarding.tsx       - Company setup flow

scripts/
  seed-stripe-products.ts - Create Stripe products
```

## API Routes

### Stripe Routes
- `GET /api/stripe/products` - List products with prices
- `GET /api/stripe/publishable-key` - Get Stripe public key
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create customer portal session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Core Routes
- `GET /api/company` - Get current company
- `GET /api/chart-of-accounts` - List accounts
- `GET /api/cash-receipts` - List receipts
- `GET /api/cash-disbursements` - List disbursements
- `GET /api/export/excel/:year` - Export workbook

## User Preferences
- Company-based subscriptions (not user-based)
- Philippine Peso (PHP) currency
- 12% VAT rate for Philippine tax compliance
- BIR-compliant report formats
