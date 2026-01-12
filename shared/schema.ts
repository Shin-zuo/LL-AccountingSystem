import { sql, relations } from "drizzle-orm";
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  numeric,
  boolean,
  integer,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Roles - defines access permissions throughout the app
export const USER_ROLES = {
  ACCOUNTANT: "accountant",
  TAX_COMPLIANCE_OFFICER: "tax_compliance_officer",
  PAYROLL_OFFICER: "payroll_officer",
  COMPTROLLER: "comptroller",
  GENERAL_MANAGER: "general_manager",
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  [USER_ROLES.ACCOUNTANT]: {
    cashReceipts: true,
    cashDisbursements: true,
    chartOfAccounts: true,
    journalLedger: true,
    vatBooks: true,
    financialReports: false,
    birReports: false,
    payroll: false,
    userManagement: false,
    settings: false,
    canApprove: false,
  },
  [USER_ROLES.TAX_COMPLIANCE_OFFICER]: {
    cashReceipts: false,
    cashDisbursements: false,
    chartOfAccounts: false,
    journalLedger: false,
    vatBooks: true,
    financialReports: true,
    birReports: true,
    payroll: false,
    userManagement: false,
    settings: false,
    canApprove: false,
  },
  [USER_ROLES.PAYROLL_OFFICER]: {
    cashReceipts: false,
    cashDisbursements: false,
    chartOfAccounts: false,
    journalLedger: false,
    vatBooks: false,
    financialReports: false,
    birReports: false,
    payroll: true,
    userManagement: false,
    settings: false,
    canApprove: false,
  },
  [USER_ROLES.COMPTROLLER]: {
    cashReceipts: true,
    cashDisbursements: true,
    chartOfAccounts: true,
    journalLedger: true,
    vatBooks: true,
    financialReports: true,
    birReports: true,
    payroll: true,
    userManagement: false,
    settings: false,
    canApprove: true,
  },
  [USER_ROLES.GENERAL_MANAGER]: {
    cashReceipts: true,
    cashDisbursements: true,
    chartOfAccounts: true,
    journalLedger: true,
    vatBooks: true,
    financialReports: true,
    birReports: true,
    payroll: true,
    userManagement: true,
    settings: true,
    canApprove: true,
  },
} as const;

export type Permission = keyof typeof ROLE_PERMISSIONS[UserRole];

// Helper to check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

// Session storage table for connect-pg-simple
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table for custom authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password for custom auth
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("accountant").notNull(), // Uses USER_ROLES values
  companyId: integer("company_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Companies table - one per subscription
export const companies = pgTable("companies", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  tin: varchar("tin", { length: 50 }), // Tax Identification Number
  subscriptionStatus: varchar("subscription_status").default("trial").notNull(), // 'trial', 'active', 'expired'
  subscriptionStartDate: date("subscription_start_date"),
  subscriptionEndDate: date("subscription_end_date"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chart of Accounts
export const chartOfAccounts = pgTable("chart_of_accounts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  accountType: varchar("account_type").notNull(), // 'asset', 'liability', 'equity', 'revenue', 'cost', 'expense'
  category: varchar("category"), // 'profit_loss', 'balance_sheet'
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cash Receipts Voucher
export const cashReceipts = pgTable("cash_receipts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  crn: varchar("crn", { length: 50 }).notNull(), // Cash Receipt Number
  voucherDate: date("voucher_date").notNull(),
  invoiceNumber: varchar("invoice_number", { length: 100 }),
  invoiceDate: date("invoice_date"),
  payorName: varchar("payor_name", { length: 255 }).notNull(),
  particulars: text("particulars"),
  cashAmount: numeric("cash_amount", { precision: 18, scale: 2 }).notNull(), // Debit (+)
  isVatable: boolean("is_vatable").default(false),
  vatAmount: numeric("vat_amount", { precision: 18, scale: 2 }).default("0"), // 12% Output VAT
  netAmount: numeric("net_amount", { precision: 18, scale: 2 }), // Amount without VAT
  status: varchar("status").default("draft").notNull(), // 'draft', 'pending', 'approved'
  preparedById: varchar("prepared_by_id").references(() => users.id),
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cash Receipt Line Items (credited accounts)
export const cashReceiptLines = pgTable("cash_receipt_lines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cashReceiptId: integer("cash_receipt_id").notNull().references(() => cashReceipts.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => chartOfAccounts.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(), // Credit (-)
  description: text("description"),
});

// Cash Disbursements Voucher
export const cashDisbursements = pgTable("cash_disbursements", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  cdn: varchar("cdn", { length: 50 }).notNull(), // Cash Disbursement Number
  voucherDate: date("voucher_date").notNull(),
  supplierInvoiceNumber: varchar("supplier_invoice_number", { length: 100 }),
  supplierInvoiceDate: date("supplier_invoice_date"),
  payeeName: varchar("payee_name", { length: 255 }).notNull(),
  particulars: text("particulars"),
  cashAmount: numeric("cash_amount", { precision: 18, scale: 2 }).notNull(), // Credit (-)
  hasInputVat: boolean("has_input_vat").default(false),
  vatAmount: numeric("vat_amount", { precision: 18, scale: 2 }).default("0"), // 12% Input VAT
  netAmount: numeric("net_amount", { precision: 18, scale: 2 }), // Amount without VAT
  status: varchar("status").default("draft").notNull(), // 'draft', 'pending', 'approved'
  preparedById: varchar("prepared_by_id").references(() => users.id),
  approvedById: varchar("approved_by_id").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cash Disbursement Line Items (debited accounts)
export const cashDisbursementLines = pgTable("cash_disbursement_lines", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  cashDisbursementId: integer("cash_disbursement_id").notNull().references(() => cashDisbursements.id, { onDelete: "cascade" }),
  accountId: integer("account_id").notNull().references(() => chartOfAccounts.id),
  amount: numeric("amount", { precision: 18, scale: 2 }).notNull(), // Debit (+)
  description: text("description"),
});

// Subscriptions/Payments
export const subscriptions = pgTable("subscriptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  paymentMethod: varchar("payment_method"), // 'gcash', 'stripe'
  paymentReference: varchar("payment_reference"),
  amountPaid: numeric("amount_paid", { precision: 18, scale: 2 }),
  paymentDate: timestamp("payment_date"),
  periodStart: date("period_start"),
  periodEnd: date("period_end"),
  status: varchar("status").default("pending"), // 'pending', 'completed', 'failed'
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  company: one(companies, {
    fields: [users.companyId],
    references: [companies.id],
  }),
}));

export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  chartOfAccounts: many(chartOfAccounts),
  cashReceipts: many(cashReceipts),
  cashDisbursements: many(cashDisbursements),
  subscriptions: many(subscriptions),
}));

export const chartOfAccountsRelations = relations(chartOfAccounts, ({ one }) => ({
  company: one(companies, {
    fields: [chartOfAccounts.companyId],
    references: [companies.id],
  }),
}));

export const cashReceiptsRelations = relations(cashReceipts, ({ one, many }) => ({
  company: one(companies, {
    fields: [cashReceipts.companyId],
    references: [companies.id],
  }),
  preparedBy: one(users, {
    fields: [cashReceipts.preparedById],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [cashReceipts.approvedById],
    references: [users.id],
  }),
  lines: many(cashReceiptLines),
}));

export const cashReceiptLinesRelations = relations(cashReceiptLines, ({ one }) => ({
  cashReceipt: one(cashReceipts, {
    fields: [cashReceiptLines.cashReceiptId],
    references: [cashReceipts.id],
  }),
  account: one(chartOfAccounts, {
    fields: [cashReceiptLines.accountId],
    references: [chartOfAccounts.id],
  }),
}));

export const cashDisbursementsRelations = relations(cashDisbursements, ({ one, many }) => ({
  company: one(companies, {
    fields: [cashDisbursements.companyId],
    references: [companies.id],
  }),
  preparedBy: one(users, {
    fields: [cashDisbursements.preparedById],
    references: [users.id],
  }),
  approvedBy: one(users, {
    fields: [cashDisbursements.approvedById],
    references: [users.id],
  }),
  lines: many(cashDisbursementLines),
}));

export const cashDisbursementLinesRelations = relations(cashDisbursementLines, ({ one }) => ({
  cashDisbursement: one(cashDisbursements, {
    fields: [cashDisbursementLines.cashDisbursementId],
    references: [cashDisbursements.id],
  }),
  account: one(chartOfAccounts, {
    fields: [cashDisbursementLines.accountId],
    references: [chartOfAccounts.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  company: one(companies, {
    fields: [subscriptions.companyId],
    references: [companies.id],
  }),
}));

// Employees table for payroll
export const employees = pgTable("employees", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  employeeCode: varchar("employee_code", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  middleName: varchar("middle_name", { length: 100 }),
  tin: varchar("tin", { length: 50 }),
  sssNumber: varchar("sss_number", { length: 50 }),
  philhealthNumber: varchar("philhealth_number", { length: 50 }),
  hdmfNumber: varchar("hdmf_number", { length: 50 }),
  position: varchar("position", { length: 100 }),
  department: varchar("department", { length: 100 }),
  employmentStatus: varchar("employment_status").default("regular"), // regular, casual, contractual, probationary
  isMinimumWageEarner: boolean("is_minimum_wage_earner").default(false),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll periods
export const payrollPeriods = pgTable("payroll_periods", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  periodName: varchar("period_name", { length: 100 }).notNull(), // e.g., "January 2025", "January 1-15, 2025"
  periodType: varchar("period_type").default("monthly"), // monthly, semi-monthly
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  payDate: date("pay_date"),
  status: varchar("status").default("draft"), // draft, finalized
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Payroll records - individual employee payroll for a period
export const payrollRecords = pgTable("payroll_records", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  payrollPeriodId: integer("payroll_period_id").notNull().references(() => payrollPeriods.id, { onDelete: "cascade" }),
  employeeId: integer("employee_id").notNull().references(() => employees.id),
  
  // Gross compensation
  basicSalary: numeric("basic_salary", { precision: 18, scale: 2 }).default("0"),
  overtimePay: numeric("overtime_pay", { precision: 18, scale: 2 }).default("0"),
  holidayPay: numeric("holiday_pay", { precision: 18, scale: 2 }).default("0"),
  nightDifferential: numeric("night_differential", { precision: 18, scale: 2 }).default("0"),
  allowances: numeric("allowances", { precision: 18, scale: 2 }).default("0"),
  thirteenthMonthPay: numeric("thirteenth_month_pay", { precision: 18, scale: 2 }).default("0"),
  otherTaxableIncome: numeric("other_taxable_income", { precision: 18, scale: 2 }).default("0"),
  deminimis: numeric("deminimis", { precision: 18, scale: 2 }).default("0"),
  grossCompensation: numeric("gross_compensation", { precision: 18, scale: 2 }).default("0"),
  
  // Employee deductions
  sssEmployee: numeric("sss_employee", { precision: 18, scale: 2 }).default("0"),
  philhealthEmployee: numeric("philhealth_employee", { precision: 18, scale: 2 }).default("0"),
  hdmfEmployee: numeric("hdmf_employee", { precision: 18, scale: 2 }).default("0"),
  withholdingTax: numeric("withholding_tax", { precision: 18, scale: 2 }).default("0"),
  otherDeductions: numeric("other_deductions", { precision: 18, scale: 2 }).default("0"),
  totalDeductions: numeric("total_deductions", { precision: 18, scale: 2 }).default("0"),
  
  // Employer contributions
  sssEmployer: numeric("sss_employer", { precision: 18, scale: 2 }).default("0"),
  philhealthEmployer: numeric("philhealth_employer", { precision: 18, scale: 2 }).default("0"),
  hdmfEmployer: numeric("hdmf_employer", { precision: 18, scale: 2 }).default("0"),
  ecContribution: numeric("ec_contribution", { precision: 18, scale: 2 }).default("0"),
  
  // Net pay
  netPay: numeric("net_pay", { precision: 18, scale: 2 }).default("0"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tax Settings table - stores company tax configuration
export const taxSettings = pgTable("tax_settings", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  taxYear: integer("tax_year").notNull(),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }).default("25"), // Default 25% corporate tax
  mcitRate: numeric("mcit_rate", { precision: 5, scale: 2 }).default("2"), // 2% MCIT
  isMcitApplicable: boolean("is_mcit_applicable").default(false), // MCIT applies after 4th year
  creditsAvailable: numeric("credits_available", { precision: 18, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// MCIT Credits table - tracks excess MCIT credits (3-year carryover)
export const mcitCredits = pgTable("mcit_credits", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  taxYear: integer("tax_year").notNull(), // Year when MCIT excess was generated
  excessAmount: numeric("excess_amount", { precision: 18, scale: 2 }).notNull(),
  usedAmount: numeric("used_amount", { precision: 18, scale: 2 }).default("0"),
  remainingAmount: numeric("remaining_amount", { precision: 18, scale: 2 }).notNull(),
  expiryYear: integer("expiry_year").notNull(), // 3 years from generation
  createdAt: timestamp("created_at").defaultNow(),
});

// NOLCO table - tracks Net Operating Loss Carry-Over
export const nolcoEntries = pgTable("nolco_entries", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  lossYear: integer("loss_year").notNull(), // Year when loss was incurred
  originalAmount: numeric("original_amount", { precision: 18, scale: 2 }).notNull(),
  usedAmount: numeric("used_amount", { precision: 18, scale: 2 }).default("0"),
  remainingAmount: numeric("remaining_amount", { precision: 18, scale: 2 }).notNull(),
  expiryYear: integer("expiry_year").notNull(), // 3 years (or 5 years for 2020-2021 losses)
  createdAt: timestamp("created_at").defaultNow(),
});

// Final Withholding Income table - tracks income already subjected to final tax
export const finalWithholdingIncomes = pgTable("final_withholding_incomes", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  companyId: integer("company_id").notNull().references(() => companies.id),
  taxYear: integer("tax_year").notNull(),
  quarter: integer("quarter"), // Optional: 1-4 for quarterly, null for annual
  incomeType: text("income_type").notNull(), // bank_interest, royalties, dividends, etc.
  description: text("description"), // Additional details
  grossAmount: numeric("gross_amount", { precision: 18, scale: 2 }).notNull(),
  taxWithheld: numeric("tax_withheld", { precision: 18, scale: 2 }).notNull(),
  certificateNumber: text("certificate_number"), // BIR Form 2306/2307 number
  createdAt: timestamp("created_at").defaultNow(),
});

// Payroll relations
export const employeesRelations = relations(employees, ({ one, many }) => ({
  company: one(companies, {
    fields: [employees.companyId],
    references: [companies.id],
  }),
  payrollRecords: many(payrollRecords),
}));

export const payrollPeriodsRelations = relations(payrollPeriods, ({ one, many }) => ({
  company: one(companies, {
    fields: [payrollPeriods.companyId],
    references: [companies.id],
  }),
  records: many(payrollRecords),
}));

export const payrollRecordsRelations = relations(payrollRecords, ({ one }) => ({
  payrollPeriod: one(payrollPeriods, {
    fields: [payrollRecords.payrollPeriodId],
    references: [payrollPeriods.id],
  }),
  employee: one(employees, {
    fields: [payrollRecords.employeeId],
    references: [employees.id],
  }),
}));

// Insert schemas - using proper typing
export const insertCompanySchema = createInsertSchema(companies, {
  name: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertChartOfAccountsSchema = createInsertSchema(chartOfAccounts, {
  code: z.string().min(1),
  name: z.string().min(1),
}).omit({ id: true, createdAt: true } as const);

export const insertCashReceiptSchema = createInsertSchema(cashReceipts, {
  crn: z.string().min(1),
  payorName: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertCashReceiptLineSchema = createInsertSchema(cashReceiptLines).omit({ id: true } as const);

export const insertCashDisbursementSchema = createInsertSchema(cashDisbursements, {
  cdn: z.string().min(1),
  payeeName: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertCashDisbursementLineSchema = createInsertSchema(cashDisbursementLines).omit({ id: true } as const);

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ id: true, createdAt: true } as const);

export const insertEmployeeSchema = createInsertSchema(employees, {
  employeeCode: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertPayrollPeriodSchema = createInsertSchema(payrollPeriods, {
  periodName: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertPayrollRecordSchema = createInsertSchema(payrollRecords).omit({ id: true, createdAt: true, updatedAt: true } as const);

export const insertTaxSettingsSchema = createInsertSchema(taxSettings).omit({ id: true, createdAt: true, updatedAt: true } as const);
export const insertMcitCreditSchema = createInsertSchema(mcitCredits).omit({ id: true, createdAt: true } as const);
export const insertNolcoEntrySchema = createInsertSchema(nolcoEntries).omit({ id: true, createdAt: true } as const);
export const insertFinalWithholdingIncomeSchema = createInsertSchema(finalWithholdingIncomes).omit({ id: true, createdAt: true } as const);

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type ChartOfAccount = typeof chartOfAccounts.$inferSelect;
export type InsertChartOfAccount = z.infer<typeof insertChartOfAccountsSchema>;
export type CashReceipt = typeof cashReceipts.$inferSelect;
export type InsertCashReceipt = z.infer<typeof insertCashReceiptSchema>;
export type CashReceiptLine = typeof cashReceiptLines.$inferSelect;
export type InsertCashReceiptLine = z.infer<typeof insertCashReceiptLineSchema>;
export type CashDisbursement = typeof cashDisbursements.$inferSelect;
export type InsertCashDisbursement = z.infer<typeof insertCashDisbursementSchema>;
export type CashDisbursementLine = typeof cashDisbursementLines.$inferSelect;
export type InsertCashDisbursementLine = z.infer<typeof insertCashDisbursementLineSchema>;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type PayrollPeriod = typeof payrollPeriods.$inferSelect;
export type InsertPayrollPeriod = z.infer<typeof insertPayrollPeriodSchema>;
export type PayrollRecord = typeof payrollRecords.$inferSelect;
export type InsertPayrollRecord = z.infer<typeof insertPayrollRecordSchema>;
export type TaxSettings = typeof taxSettings.$inferSelect;
export type InsertTaxSettings = z.infer<typeof insertTaxSettingsSchema>;
export type McitCredit = typeof mcitCredits.$inferSelect;
export type InsertMcitCredit = z.infer<typeof insertMcitCreditSchema>;
export type NolcoEntry = typeof nolcoEntries.$inferSelect;
export type InsertNolcoEntry = z.infer<typeof insertNolcoEntrySchema>;
export type FinalWithholdingIncome = typeof finalWithholdingIncomes.$inferSelect;
export type InsertFinalWithholdingIncome = z.infer<typeof insertFinalWithholdingIncomeSchema>;

// BIR Report types (not stored in DB, used for data generation)
export interface BIRReportConfig {
  formNumber: string;
  formName: string;
  description: string;
  frequency: "monthly" | "quarterly" | "annual";
  deadline: string;
  dataFields: string[];
}

export const BIR_REPORTS: BIRReportConfig[] = [
  // Monthly Withholding Tax Returns
  { formNumber: "1601-C", formName: "Monthly Remittance Return of Income Taxes Withheld on Compensation", description: "Withholding tax on employee salaries", frequency: "monthly", deadline: "10th of following month", dataFields: ["employeeCount", "grossCompensation", "taxableCompensation", "withholdingTax"] },
  { formNumber: "1601-E", formName: "Monthly Remittance Return of Creditable Income Taxes Withheld (Expanded)", description: "Expanded withholding tax on payments to suppliers", frequency: "monthly", deadline: "10th of following month", dataFields: ["payeeList", "paymentsToSuppliers", "expandedWithholdingTax"] },
  { formNumber: "1601-F", formName: "Monthly Remittance Return of Final Income Taxes Withheld", description: "Final withholding tax on passive income", frequency: "monthly", deadline: "10th of following month", dataFields: ["interestPayments", "dividendPayments", "finalWithholdingTax"] },
  
  // Quarterly VAT and Tax Returns
  { formNumber: "2550-Q", formName: "Quarterly VAT Return", description: "Quarterly Value Added Tax return for VAT-registered taxpayers", frequency: "quarterly", deadline: "25th after quarter end", dataFields: ["vatableSales", "zeroRatedSales", "exemptSales", "outputVat", "inputVat", "vatPayable"] },
  { formNumber: "SLS", formName: "Summary List of Sales", description: "Detailed list of all VAT sales transactions (attachment to 2550-Q)", frequency: "quarterly", deadline: "25th after quarter end", dataFields: ["customerTin", "customerName", "salesAmount", "outputVat"] },
  { formNumber: "SLP", formName: "Summary List of Purchases", description: "Detailed list of all VAT purchase transactions (attachment to 2550-Q)", frequency: "quarterly", deadline: "25th after quarter end", dataFields: ["supplierTin", "supplierName", "purchaseAmount", "inputVat"] },
  { formNumber: "2307-Summary", formName: "Summary of Creditable Withholding Tax (Form 2307)", description: "List of creditable withholding taxes from tenants/customers for tax credit claims", frequency: "quarterly", deadline: "With ITR filing", dataFields: ["withholdingAgentTin", "withholdingAgentName", "incomePayment", "taxWithheld", "period"] },
  { formNumber: "1702-Q", formName: "Quarterly Income Tax Return", description: "Corporate quarterly income tax", frequency: "quarterly", deadline: "60 days after quarter end", dataFields: ["grossIncome", "deductions", "taxableIncome", "incomeTaxDue"] },
  { formNumber: "2551-Q", formName: "Quarterly Percentage Tax Return", description: "For non-VAT registered businesses (3% percentage tax)", frequency: "quarterly", deadline: "25th after quarter end", dataFields: ["grossReceipts", "percentageTaxRate", "percentageTaxDue"] },
  { formNumber: "1602-Q", formName: "Quarterly Remittance Return of Final Income Taxes Withheld on Interest", description: "Final tax on interest paid on deposits", frequency: "quarterly", deadline: "Last day of following month", dataFields: ["interestPaid", "finalTaxWithheld"] },
  { formNumber: "1603-Q", formName: "Quarterly Remittance Return of Final Income Taxes Withheld on Fringe Benefits", description: "Fringe benefit tax for managerial employees", frequency: "quarterly", deadline: "Last day of following month", dataFields: ["fringeBenefitsValue", "fringeBenefitTax"] },
  
  // Annual Returns
  { formNumber: "1702-RT", formName: "Annual Income Tax Return (Regular)", description: "Annual corporate income tax return", frequency: "annual", deadline: "April 15", dataFields: ["annualGrossIncome", "annualDeductions", "taxableIncome", "incomeTaxDue", "taxCredits"] },
  { formNumber: "1604-C", formName: "Annual Information Return of Income Taxes Withheld on Compensation", description: "Alphalist of employees with taxes withheld", frequency: "annual", deadline: "January 31", dataFields: ["employeeAlphalist", "totalCompensation", "totalTaxWithheld"] },
  { formNumber: "1604-F", formName: "Annual Information Return of Final Withholding Taxes", description: "Alphalist of payees subjected to final withholding", frequency: "annual", deadline: "January 31", dataFields: ["payeeAlphalist", "totalPayments", "totalFinalTax"] },
  { formNumber: "1709", formName: "Information Return on Related Party Transactions", description: "Transactions with related parties", frequency: "annual", deadline: "With ITR (April 15)", dataFields: ["relatedPartyTransactions"] },
  { formNumber: "BOA", formName: "Books of Accounts", description: "Annual registration of books of accounts", frequency: "annual", deadline: "January 15-30", dataFields: ["journalEntries", "ledgerBalances"] },
];
