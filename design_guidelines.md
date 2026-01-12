# LLAS Accounting System - Design Guidelines

## Design Approach

**System Selected**: Material Design principles adapted for financial/enterprise applications

**Rationale**: This is a data-heavy, utility-focused accounting tool requiring clear hierarchy, efficient forms, and professional credibility for Philippine small business owners. Material Design provides excellent patterns for complex data tables, multi-step forms, and dashboard layouts.

**Key Design Principles**:
- Clarity and data legibility above visual flair
- Efficient workflows for daily voucher entry
- Professional appearance that builds trust for financial data
- Accessible to non-technical sari-sari store owners

---

## Typography

**Font Families** (via Google Fonts):
- Primary: Inter (clean, excellent for forms and data tables)
- Monospace: JetBrains Mono (for currency amounts, account codes)

**Type Scale**:
- Page Headers: text-3xl (30px) font-semibold
- Section Headers: text-xl (20px) font-semibold  
- Card Titles: text-lg (18px) font-medium
- Body/Forms: text-base (16px) font-normal
- Table Data: text-sm (14px) font-normal
- Currency Amounts: text-base or text-lg font-mono font-semibold
- Captions/Labels: text-xs (12px) font-medium uppercase tracking-wide

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 6, 8, 12, 16** for consistent rhythm
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Form field gaps: gap-4
- Card padding: p-6
- Page margins: px-6 lg:px-8

**Grid Structure**:
- Main layout: Sidebar (240px fixed) + Content area (flex-1)
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Form layouts: Single column max-w-4xl for voucher entry
- Tables: Full-width within content area with horizontal scroll on mobile

**Container Widths**:
- Forms: max-w-4xl
- Data tables: w-full
- Reports viewer: max-w-7xl

---

## Component Library

### Navigation
- **Top Bar**: Fixed header with company name, user profile dropdown, subscription status indicator
- **Sidebar**: Fixed left navigation with icons + labels, collapsible on mobile
  - Dashboard, Cash Receipts, Cash Disbursements, Chart of Accounts, Reports, Settings
  - Admin-only section for user management

### Forms (Voucher Entry)
- **Input Fields**: Bordered inputs (border-2) with clear labels above, focus ring-2
- **Currency Inputs**: Right-aligned with PHP prefix, monospace font
- **Date Pickers**: Calendar icon trigger with dropdown
- **Dynamic Account Entry**: Add/remove rows for multiple credited/debited accounts
- **VAT Toggle**: Checkbox to enable VAT calculation with auto-computed 12% breakdown
- **Zero-Sum Validator**: Real-time display showing sum at bottom, green when balanced, red when unbalanced
- **User Fields**: "Prepared by" (auto-filled from logged-in user), "Approved by" (dropdown of approvers)

### Data Tables
- **Voucher Lists**: Sortable columns (Date, CRN/CDN, Payor/Payee, Amount), row hover state
- **Excel Preview**: Tabbed interface showing different sheets (7 tabs), read-only spreadsheet grid
- **Sticky Headers**: Column headers stay visible on scroll
- **Row Actions**: Edit, Delete, Approve icons on hover
- **Pagination**: Bottom of tables with rows per page selector

### Cards & Panels
- **Dashboard Cards**: Elevated (shadow-md), rounded-lg, p-6
  - Monthly summary cards showing total receipts, disbursements, VAT
  - Recent vouchers list
  - Subscription status card with renewal date
- **Report Viewer**: Large panel with download/print buttons

### Buttons
- **Primary CTA**: Solid fill, rounded, px-6 py-2.5, font-medium
- **Secondary**: Outlined border-2, same sizing
- **Icon Buttons**: Square or circular, p-2, for table actions
- **Download Excel**: Prominent button with download icon, positioned top-right of viewers

### Status Indicators
- **Subscription**: Badge showing "Active" (green), "Expiring Soon" (yellow), "Expired" (red)
- **Approval Status**: Badge on vouchers - "Draft", "Pending Approval", "Approved"
- **Balance Validator**: Inline indicator showing ₱0.00 with check icon when balanced

### Modals & Overlays
- **Confirmation Dialogs**: Centered, max-w-md, for delete/approve actions
- **Payment Modal**: For GCash/Stripe subscription payment flow
- **User Management**: Admin modal for editing privileges

---

## Animations

**Minimal Approach**: Use sparingly only for functional feedback
- Sidebar collapse/expand: 200ms ease
- Dropdown menus: 150ms fade-in
- Success/error toast notifications: Slide in from top-right
- No decorative animations on data tables or forms

---

## Philippine Business Context

- **Currency Display**: Always show ₱ symbol before amounts (₱1,234.56)
- **Number Formatting**: Comma separators for thousands (₱123,456.78)
- **Date Format**: MM/DD/YYYY or DD-MMM-YYYY for BIR compliance
- **VAT Rate**: Hardcoded 12% with clear breakdown showing base amount + VAT
- **Account Code Format**: Support both numeric (1000-1) and alpha (CASH-001) formats

---

## Images

**No hero images required** - this is a utility application focused on data entry and reports. Visual elements limited to:
- Company logo placeholder in top bar (upload via settings)
- Empty state illustrations for no data (simple line art)
- User avatars in profile dropdown (initials fallback)