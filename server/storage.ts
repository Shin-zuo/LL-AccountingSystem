import { db } from "./db";
import { eq, and, desc, sql, gte, lte, sum, inArray } from "drizzle-orm";
import {
  users,
  companies,
  chartOfAccounts,
  cashReceipts,
  cashReceiptLines,
  cashDisbursements,
  cashDisbursementLines,
  subscriptions,
  employees,
  payrollPeriods,
  payrollRecords,
  taxSettings,
  mcitCredits,
  nolcoEntries,
  finalWithholdingIncomes,
  type UpsertUser,
  type User,
  type Company,
  type InsertCompany,
  type ChartOfAccount,
  type InsertChartOfAccount,
  type CashReceipt,
  type InsertCashReceipt,
  type CashReceiptLine,
  type InsertCashReceiptLine,
  type CashDisbursement,
  type InsertCashDisbursement,
  type CashDisbursementLine,
  type InsertCashDisbursementLine,
  type Subscription,
  type InsertSubscription,
  type Employee,
  type InsertEmployee,
  type PayrollPeriod,
  type InsertPayrollPeriod,
  type PayrollRecord,
  type InsertPayrollRecord,
  type TaxSettings,
  type InsertTaxSettings,
  type McitCredit,
  type InsertMcitCredit,
  type NolcoEntry,
  type InsertNolcoEntry,
  type FinalWithholdingIncome,
  type InsertFinalWithholdingIncome,
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUsersByCompanyId(companyId: number): Promise<User[]>;
  getApprovers(companyId: number): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<User>;

  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  getCompanyByStripeCustomerId(stripeCustomerId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  updateCompanyStripeCustomer(companyId: number, stripeCustomerId: string): Promise<Company>;
  updateCompanySubscription(companyId: number, stripeSubscriptionId: string, status: string, endDate: string): Promise<Company>;

  // Chart of Accounts operations
  getChartOfAccounts(companyId: number): Promise<ChartOfAccount[]>;
  getChartOfAccountById(id: number): Promise<ChartOfAccount | undefined>;
  createChartOfAccount(account: InsertChartOfAccount): Promise<ChartOfAccount>;
  updateChartOfAccount(id: number, account: Partial<InsertChartOfAccount>): Promise<ChartOfAccount>;
  deleteChartOfAccount(id: number): Promise<void>;

  // Cash Receipts operations
  getCashReceipts(companyId: number): Promise<CashReceipt[]>;
  getCashReceiptById(id: number): Promise<CashReceipt | undefined>;
  getCashReceiptWithLines(id: number): Promise<(CashReceipt & { lines: CashReceiptLine[] }) | undefined>;
  createCashReceipt(receipt: InsertCashReceipt, lines: InsertCashReceiptLine[]): Promise<CashReceipt>;
  updateCashReceipt(id: number, receipt: Partial<InsertCashReceipt>, lines?: InsertCashReceiptLine[]): Promise<CashReceipt>;
  deleteCashReceipt(id: number): Promise<void>;
  approveCashReceipt(id: number, approvedById: string): Promise<CashReceipt>;
  getVatableCashReceipts(companyId: number, year: number): Promise<CashReceipt[]>;

  // Cash Disbursements operations
  getCashDisbursements(companyId: number): Promise<CashDisbursement[]>;
  getCashDisbursementById(id: number): Promise<CashDisbursement | undefined>;
  getCashDisbursementWithLines(id: number): Promise<(CashDisbursement & { lines: CashDisbursementLine[] }) | undefined>;
  createCashDisbursement(disbursement: InsertCashDisbursement, lines: InsertCashDisbursementLine[]): Promise<CashDisbursement>;
  updateCashDisbursement(id: number, disbursement: Partial<InsertCashDisbursement>, lines?: InsertCashDisbursementLine[]): Promise<CashDisbursement>;
  deleteCashDisbursement(id: number): Promise<void>;
  approveCashDisbursement(id: number, approvedById: string): Promise<CashDisbursement>;
  getVatableCashDisbursements(companyId: number, year: number): Promise<CashDisbursement[]>;

  // Subscription operations
  getSubscriptions(companyId: number): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription>;

  // Report operations
  getDashboardStats(companyId: number): Promise<any>;
  getRecentVouchers(companyId: number, limit: number): Promise<any[]>;
  getJournalEntries(companyId: number, year: number): Promise<any[]>;
  getProfitLossData(companyId: number, year: number): Promise<any[]>;
  getBalanceSheetData(companyId: number, year: number): Promise<any[]>;

  // Employee operations
  getEmployees(companyId: number): Promise<Employee[]>;
  getEmployeeById(id: number): Promise<Employee | undefined>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee>;
  deleteEmployee(id: number): Promise<void>;
  bulkCreateEmployees(employees: InsertEmployee[]): Promise<Employee[]>;

  // Payroll Period operations
  getPayrollPeriods(companyId: number): Promise<PayrollPeriod[]>;
  getPayrollPeriodById(id: number): Promise<PayrollPeriod | undefined>;
  createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod>;
  updatePayrollPeriod(id: number, period: Partial<InsertPayrollPeriod>): Promise<PayrollPeriod>;
  deletePayrollPeriod(id: number): Promise<void>;

  // Payroll Record operations
  getPayrollRecords(periodId: number): Promise<(PayrollRecord & { employee: Employee })[]>;
  createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord>;
  bulkCreatePayrollRecords(records: InsertPayrollRecord[]): Promise<PayrollRecord[]>;
  updatePayrollRecord(id: number, record: Partial<InsertPayrollRecord>): Promise<PayrollRecord>;
  deletePayrollRecord(id: number): Promise<void>;

  // BIR Data Aggregation
  getPayrollSummaryByPeriod(companyId: number, startDate: string, endDate: string): Promise<any>;
  getWithholdingTaxSummary(companyId: number, startDate: string, endDate: string): Promise<any>;
  getVatSummary(companyId: number, startDate: string, endDate: string): Promise<any>;
  getIncomeSummary(companyId: number, startDate: string, endDate: string): Promise<any>;
  getSupplierPaymentsSummary(companyId: number, startDate: string, endDate: string): Promise<any>;
  getEmployeeAlphalist(companyId: number, year: number): Promise<any[]>;
  getSalesList(companyId: number, startDate: string, endDate: string): Promise<any[]>;
  getPurchasesList(companyId: number, startDate: string, endDate: string): Promise<any[]>;
  getWithholdingTaxCredits(companyId: number, startDate: string, endDate: string): Promise<any[]>;

  // Onboarding
  createCompanyWithDefaults(userId: string, companyName: string): Promise<Company>;

  // Tax Settings operations
  getTaxSettings(companyId: number, taxYear: number): Promise<TaxSettings | undefined>;
  upsertTaxSettings(settings: InsertTaxSettings): Promise<TaxSettings>;

  // MCIT Credits operations
  getMcitCredits(companyId: number): Promise<McitCredit[]>;
  getAvailableMcitCredits(companyId: number, currentYear: number): Promise<McitCredit[]>;
  createMcitCredit(credit: InsertMcitCredit): Promise<McitCredit>;
  updateMcitCredit(id: number, credit: Partial<InsertMcitCredit>): Promise<McitCredit>;
  deleteMcitCredit(id: number): Promise<void>;

  // NOLCO operations
  getNolcoEntries(companyId: number): Promise<NolcoEntry[]>;
  getAvailableNolco(companyId: number, currentYear: number): Promise<NolcoEntry[]>;
  createNolcoEntry(entry: InsertNolcoEntry): Promise<NolcoEntry>;
  updateNolcoEntry(id: number, entry: Partial<InsertNolcoEntry>): Promise<NolcoEntry>;
  deleteNolcoEntry(id: number): Promise<void>;

  // Final Withholding Income operations
  getFinalWithholdingIncomes(companyId: number, taxYear?: number): Promise<FinalWithholdingIncome[]>;
  createFinalWithholdingIncome(income: InsertFinalWithholdingIncome): Promise<FinalWithholdingIncome>;
  deleteFinalWithholdingIncome(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUsersByCompanyId(companyId: number): Promise<User[]> {
    return db.select().from(users).where(eq(users.companyId, companyId));
  }

  async getApprovers(companyId: number): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          sql`${users.role} IN ('admin', 'approver')`
        )
      );
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Company operations
  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const user = await this.getUser(userId);
    if (!user?.companyId) return undefined;
    return this.getCompany(user.companyId);
  }

  async getCompanyByStripeCustomerId(stripeCustomerId: string): Promise<Company | undefined> {
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.stripeCustomerId, stripeCustomerId));
    return company;
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db.insert(companies).values(company).returning();
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ ...company, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return updated;
  }

  async updateCompanyStripeCustomer(companyId: number, stripeCustomerId: string): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ stripeCustomerId, updatedAt: new Date() })
      .where(eq(companies.id, companyId))
      .returning();
    return updated;
  }

  async updateCompanySubscription(companyId: number, stripeSubscriptionId: string, status: string, endDate: string): Promise<Company> {
    const [updated] = await db
      .update(companies)
      .set({ 
        stripeSubscriptionId, 
        subscriptionStatus: status,
        subscriptionEndDate: endDate,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, companyId))
      .returning();
    return updated;
  }

  // Chart of Accounts operations
  async getChartOfAccounts(companyId: number): Promise<ChartOfAccount[]> {
    return db
      .select()
      .from(chartOfAccounts)
      .where(eq(chartOfAccounts.companyId, companyId))
      .orderBy(chartOfAccounts.code);
  }

  async getChartOfAccountById(id: number): Promise<ChartOfAccount | undefined> {
    const [account] = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.id, id));
    return account;
  }

  async createChartOfAccount(account: InsertChartOfAccount): Promise<ChartOfAccount> {
    const [newAccount] = await db.insert(chartOfAccounts).values(account).returning();
    return newAccount;
  }

  async updateChartOfAccount(id: number, account: Partial<InsertChartOfAccount>): Promise<ChartOfAccount> {
    const [updated] = await db
      .update(chartOfAccounts)
      .set(account)
      .where(eq(chartOfAccounts.id, id))
      .returning();
    return updated;
  }

  async deleteChartOfAccount(id: number): Promise<void> {
    await db.delete(chartOfAccounts).where(eq(chartOfAccounts.id, id));
  }

  // Cash Receipts operations
  async getCashReceipts(companyId: number): Promise<CashReceipt[]> {
    return db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId))
      .orderBy(desc(cashReceipts.voucherDate));
  }

  async getCashReceiptById(id: number): Promise<CashReceipt | undefined> {
    const [receipt] = await db.select().from(cashReceipts).where(eq(cashReceipts.id, id));
    return receipt;
  }

  async getCashReceiptWithLines(id: number): Promise<(CashReceipt & { lines: CashReceiptLine[] }) | undefined> {
    const receipt = await this.getCashReceiptById(id);
    if (!receipt) return undefined;
    const lines = await db.select().from(cashReceiptLines).where(eq(cashReceiptLines.cashReceiptId, id));
    return { ...receipt, lines };
  }

  async createCashReceipt(receipt: InsertCashReceipt, lines: InsertCashReceiptLine[]): Promise<CashReceipt> {
    const [newReceipt] = await db.insert(cashReceipts).values(receipt).returning();
    
    if (lines.length > 0) {
      await db.insert(cashReceiptLines).values(
        lines.map((line) => ({ ...line, cashReceiptId: newReceipt.id }))
      );
    }
    
    return newReceipt;
  }

  async updateCashReceipt(id: number, receipt: Partial<InsertCashReceipt>, lines?: InsertCashReceiptLine[]): Promise<CashReceipt> {
    const [updated] = await db
      .update(cashReceipts)
      .set({ ...receipt, updatedAt: new Date() })
      .where(eq(cashReceipts.id, id))
      .returning();

    if (lines) {
      await db.delete(cashReceiptLines).where(eq(cashReceiptLines.cashReceiptId, id));
      if (lines.length > 0) {
        await db.insert(cashReceiptLines).values(
          lines.map((line) => ({ ...line, cashReceiptId: id }))
        );
      }
    }

    return updated;
  }

  async deleteCashReceipt(id: number): Promise<void> {
    await db.delete(cashReceipts).where(eq(cashReceipts.id, id));
  }

  async approveCashReceipt(id: number, approvedById: string): Promise<CashReceipt> {
    const [updated] = await db
      .update(cashReceipts)
      .set({ status: "approved", approvedById, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(cashReceipts.id, id))
      .returning();
    return updated;
  }

  async getVatableCashReceipts(companyId: number, year: number): Promise<CashReceipt[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const receipts = await db
      .select()
      .from(cashReceipts)
      .where(and(
        eq(cashReceipts.companyId, companyId),
        eq(cashReceipts.isVatable, true)
      ));
      
    return receipts
      .filter(r => r.voucherDate >= startDate && r.voucherDate <= endDate)
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());
  }

  // Cash Disbursements operations
  async getCashDisbursements(companyId: number): Promise<CashDisbursement[]> {
    return db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId))
      .orderBy(desc(cashDisbursements.voucherDate));
  }

  async getCashDisbursementById(id: number): Promise<CashDisbursement | undefined> {
    const [disbursement] = await db.select().from(cashDisbursements).where(eq(cashDisbursements.id, id));
    return disbursement;
  }

  async getCashDisbursementWithLines(id: number): Promise<(CashDisbursement & { lines: CashDisbursementLine[] }) | undefined> {
    const disbursement = await this.getCashDisbursementById(id);
    if (!disbursement) return undefined;
    const lines = await db.select().from(cashDisbursementLines).where(eq(cashDisbursementLines.cashDisbursementId, id));
    return { ...disbursement, lines };
  }

  async createCashDisbursement(disbursement: InsertCashDisbursement, lines: InsertCashDisbursementLine[]): Promise<CashDisbursement> {
    const [newDisbursement] = await db.insert(cashDisbursements).values(disbursement).returning();
    
    if (lines.length > 0) {
      await db.insert(cashDisbursementLines).values(
        lines.map((line) => ({ ...line, cashDisbursementId: newDisbursement.id }))
      );
    }
    
    return newDisbursement;
  }

  async updateCashDisbursement(id: number, disbursement: Partial<InsertCashDisbursement>, lines?: InsertCashDisbursementLine[]): Promise<CashDisbursement> {
    const [updated] = await db
      .update(cashDisbursements)
      .set({ ...disbursement, updatedAt: new Date() })
      .where(eq(cashDisbursements.id, id))
      .returning();

    if (lines) {
      await db.delete(cashDisbursementLines).where(eq(cashDisbursementLines.cashDisbursementId, id));
      if (lines.length > 0) {
        await db.insert(cashDisbursementLines).values(
          lines.map((line) => ({ ...line, cashDisbursementId: id }))
        );
      }
    }

    return updated;
  }

  async deleteCashDisbursement(id: number): Promise<void> {
    await db.delete(cashDisbursements).where(eq(cashDisbursements.id, id));
  }

  async approveCashDisbursement(id: number, approvedById: string): Promise<CashDisbursement> {
    const [updated] = await db
      .update(cashDisbursements)
      .set({ status: "approved", approvedById, approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(cashDisbursements.id, id))
      .returning();
    return updated;
  }

  async getVatableCashDisbursements(companyId: number, year: number): Promise<CashDisbursement[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const disbursements = await db
      .select()
      .from(cashDisbursements)
      .where(and(
        eq(cashDisbursements.companyId, companyId),
        eq(cashDisbursements.hasInputVat, true)
      ));
      
    return disbursements
      .filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate)
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());
  }

  // Subscription operations
  async getSubscriptions(companyId: number): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.companyId, companyId))
      .orderBy(desc(subscriptions.createdAt));
  }

  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db.insert(subscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateSubscription(id: number, subscription: Partial<InsertSubscription>): Promise<Subscription> {
    const [updated] = await db
      .update(subscriptions)
      .set(subscription)
      .where(eq(subscriptions.id, id))
      .returning();
    return updated;
  }

  // Report operations
  async getDashboardStats(companyId: number): Promise<any> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

    const receipts = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));

    const disbursements = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));

    const monthlyReceipts = receipts
      .filter((r) => r.voucherDate >= monthStart && r.voucherDate <= monthEnd)
      .reduce((sum, r) => sum + parseFloat(r.cashAmount || "0"), 0);

    const monthlyDisbursements = disbursements
      .filter((d) => d.voucherDate >= monthStart && d.voucherDate <= monthEnd)
      .reduce((sum, d) => sum + parseFloat(d.cashAmount || "0"), 0);

    const totalReceipts = receipts.reduce((sum, r) => sum + parseFloat(r.cashAmount || "0"), 0);
    const totalDisbursements = disbursements.reduce((sum, d) => sum + parseFloat(d.cashAmount || "0"), 0);

    const pendingApprovals =
      receipts.filter((r) => r.status === "pending" || r.status === "draft").length +
      disbursements.filter((d) => d.status === "pending" || d.status === "draft").length;

    return {
      monthlyReceipts,
      monthlyDisbursements,
      totalReceipts,
      totalDisbursements,
      netCashFlow: totalReceipts - totalDisbursements,
      pendingApprovals,
    };
  }

  async getRecentVouchers(companyId: number, limit: number): Promise<any[]> {
    const receipts = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId))
      .orderBy(desc(cashReceipts.createdAt))
      .limit(limit);

    const disbursements = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId))
      .orderBy(desc(cashDisbursements.createdAt))
      .limit(limit);

    const combined = [
      ...receipts.map((r) => ({
        id: r.id,
        type: "receipt" as const,
        number: r.crn,
        date: r.voucherDate,
        name: r.payorName,
        amount: r.cashAmount,
        status: r.status,
        createdAt: r.createdAt,
      })),
      ...disbursements.map((d) => ({
        id: d.id,
        type: "disbursement" as const,
        number: d.cdn,
        date: d.voucherDate,
        name: d.payeeName,
        amount: d.cashAmount,
        status: d.status,
        createdAt: d.createdAt,
      })),
    ];

    return combined
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getJournalEntries(companyId: number, year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const receipts = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));

    const disbursements = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));

    const combined = [
      ...receipts
        .filter((r) => new Date(r.voucherDate) >= startDate && new Date(r.voucherDate) <= endDate)
        .map((r) => ({
          id: r.id,
          type: "receipt" as const,
          voucherNumber: r.crn,
          voucherDate: r.voucherDate,
          name: r.payorName,
          particulars: r.particulars || "",
          debit: r.cashAmount,
          credit: "0",
        })),
      ...disbursements
        .filter((d) => new Date(d.voucherDate) >= startDate && new Date(d.voucherDate) <= endDate)
        .map((d) => ({
          id: d.id,
          type: "disbursement" as const,
          voucherNumber: d.cdn,
          voucherDate: d.voucherDate,
          name: d.payeeName,
          particulars: d.particulars || "",
          debit: "0",
          credit: d.cashAmount,
        })),
    ];

    return combined.sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());
  }

  async getProfitLossData(companyId: number, year: number): Promise<any[]> {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const accounts = await this.getChartOfAccounts(companyId);
    const accountTypeMap = new Map(accounts.map(a => [a.id, a.accountType]));
    const accountCodeMap = new Map(accounts.map(a => [a.id, a.code]));
    const accountNameMap = new Map(accounts.map(a => [a.id, a.name]));

    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));

    const receipts = receiptsAll.filter(r => new Date(r.voucherDate) >= startDate && new Date(r.voucherDate) <= endDate);
    
    let receiptLines: CashReceiptLine[] = [];
    if (receipts.length > 0) {
       receiptLines = await db
        .select()
        .from(cashReceiptLines)
        .where(inArray(cashReceiptLines.cashReceiptId, receipts.map(r => r.id)));
    }
    
    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
      
    const disbursements = disbursementsAll.filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate);

    let disbursementLines: CashDisbursementLine[] = [];
    if (disbursements.length > 0) {
       disbursementLines = await db
        .select()
        .from(cashDisbursementLines)
        .where(inArray(cashDisbursementLines.cashDisbursementId, disbursements.map(d => d.id)));
    }

    const monthlyData: { [key: string]: { [month: number]: number } } = {};

    // Process Receipts with Fallback
    for (const receipt of receipts) {
      const month = new Date(receipt.voucherDate).getMonth() + 1;
      const lines = receiptLines.filter(l => l.cashReceiptId === receipt.id);
      let revenueFound = false;

      // 1. Try to find Revenue from Lines
      for (const line of lines) {
        const accountType = accountTypeMap.get(line.accountId);
        const accountCode = accountCodeMap.get(line.accountId);
        const amount = parseFloat(line.amount || "0");

        if (accountCode && accountType === "revenue") {
          if (!monthlyData[accountCode]) monthlyData[accountCode] = {};
          monthlyData[accountCode][month] = (monthlyData[accountCode][month] || 0) + amount;
          revenueFound = true;
        }
      }

      // 2. Fallback: If no revenue lines found, categorize under generic sales
      if (!revenueFound) {
        const amount = parseFloat(receipt.netAmount || receipt.cashAmount || "0");
        if (amount > 0) {
           let fallbackCode = "4000";
           // Ensure the fallback code exists or map to first available revenue account
           if (!accounts.some(a => a.code === fallbackCode)) {
              const anyRevenue = accounts.find(a => a.accountType === "revenue");
              if (anyRevenue) fallbackCode = anyRevenue.code;
           }
           
           if (!monthlyData[fallbackCode]) monthlyData[fallbackCode] = {};
           monthlyData[fallbackCode][month] = (monthlyData[fallbackCode][month] || 0) + amount;
        }
      }
    }

    // Process Disbursements with Fallback
    for (const disbursement of disbursements) {
      const month = new Date(disbursement.voucherDate).getMonth() + 1;
      const lines = disbursementLines.filter(l => l.cashDisbursementId === disbursement.id);
      let expenseFound = false;

      for (const line of lines) {
        const accountType = accountTypeMap.get(line.accountId);
        const accountCode = accountCodeMap.get(line.accountId);
        const amount = parseFloat(line.amount || "0");

        if (accountCode && (accountType === "cost" || accountType === "expense")) {
          if (!monthlyData[accountCode]) monthlyData[accountCode] = {};
          monthlyData[accountCode][month] = (monthlyData[accountCode][month] || 0) + amount;
          expenseFound = true;
        }
      }

      // Fallback: If no expense lines found
      if (!expenseFound) {
        const amount = parseFloat(disbursement.netAmount || disbursement.cashAmount || "0");
        if (amount > 0) {
           let fallbackCode = "6900"; // Misc Expense
           if (!accounts.some(a => a.code === fallbackCode)) {
              const anyExpense = accounts.find(a => a.accountType === "expense");
              if (anyExpense) fallbackCode = anyExpense.code;
           }

           if (!monthlyData[fallbackCode]) monthlyData[fallbackCode] = {};
           monthlyData[fallbackCode][month] = (monthlyData[fallbackCode][month] || 0) + amount;
        }
      }
    }

    const result: any[] = [];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    for (const [accountCode, monthData] of Object.entries(monthlyData)) {
      const accountName = accounts.find(a => a.code === accountCode)?.name || "Uncategorized";
      const row: any = {
        accountCode,
        accountName,
        jan: monthData[1] || 0,
        feb: monthData[2] || 0,
        mar: monthData[3] || 0,
        q1: (monthData[1] || 0) + (monthData[2] || 0) + (monthData[3] || 0),
        apr: monthData[4] || 0,
        may: monthData[5] || 0,
        jun: monthData[6] || 0,
        q2: (monthData[4] || 0) + (monthData[5] || 0) + (monthData[6] || 0),
        jul: monthData[7] || 0,
        aug: monthData[8] || 0,
        sep: monthData[9] || 0,
        q3: (monthData[7] || 0) + (monthData[8] || 0) + (monthData[9] || 0),
        oct: monthData[10] || 0,
        nov: monthData[11] || 0,
        dec: monthData[12] || 0,
        q4: (monthData[10] || 0) + (monthData[11] || 0) + (monthData[12] || 0),
        annual: months.reduce((sum, m) => sum + (monthData[m] || 0), 0),
      };
      result.push(row);
    }

    return result.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  async getBalanceSheetData(companyId: number, year: number): Promise<any[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const accounts = await this.getChartOfAccounts(companyId);
    const accountTypeMap = new Map(accounts.map(a => [a.id, a.accountType]));
    const accountCodeMap = new Map(accounts.map(a => [a.id, a.code]));

    // Fetch Receipts
    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));
    const receipts = receiptsAll.filter(r => new Date(r.voucherDate) >= new Date(startDate) && new Date(r.voucherDate) <= new Date(endDate));

    let receiptLines: CashReceiptLine[] = [];
    if (receipts.length > 0) {
       receiptLines = await db
        .select()
        .from(cashReceiptLines)
        .where(inArray(cashReceiptLines.cashReceiptId, receipts.map(r => r.id)));
    }

    // Fetch Disbursements
    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
    const disbursements = disbursementsAll.filter(d => new Date(d.voucherDate) >= new Date(startDate) && new Date(d.voucherDate) <= new Date(endDate));

    let disbursementLines: CashDisbursementLine[] = [];
    if (disbursements.length > 0) {
       disbursementLines = await db
        .select()
        .from(cashDisbursementLines)
        .where(inArray(cashDisbursementLines.cashDisbursementId, disbursements.map(d => d.id)));
    }

    // P&L Calculation for Retained Earnings (Net Income)
    const monthlyNetIncome: { [month: number]: number } = {};
    for (let m = 1; m <= 12; m++) monthlyNetIncome[m] = 0;

    // Calculate Net Income month by month
    // Revenue
    for (const receipt of receipts) {
      const month = new Date(receipt.voucherDate).getMonth() + 1;
      const lines = receiptLines.filter(l => l.cashReceiptId === receipt.id);
      let revenueFound = false;
      for(const line of lines) {
         if (accountTypeMap.get(line.accountId) === "revenue") {
           monthlyNetIncome[month] += parseFloat(line.amount || "0");
           revenueFound = true;
         }
      }
      if (!revenueFound) monthlyNetIncome[month] += parseFloat(receipt.netAmount || receipt.cashAmount || "0");
    }
    // Expense
    for (const disbursement of disbursements) {
      const month = new Date(disbursement.voucherDate).getMonth() + 1;
      const lines = disbursementLines.filter(l => l.cashDisbursementId === disbursement.id);
      let expenseFound = false;
      for(const line of lines) {
         const type = accountTypeMap.get(line.accountId);
         if (type === "expense" || type === "cost") {
           monthlyNetIncome[month] -= parseFloat(line.amount || "0");
           expenseFound = true;
         }
      }
      if (!expenseFound) monthlyNetIncome[month] -= parseFloat(disbursement.netAmount || disbursement.cashAmount || "0");
    }

    // Calculate cumulative balances by month
    const cumulativeBalances: { [key: string]: { [month: number]: number } } = {};

    // Helper to add value
    const addToBalance = (code: string, month: number, amount: number) => {
      if (!cumulativeBalances[code]) cumulativeBalances[code] = {};
      cumulativeBalances[code][month] = (cumulativeBalances[code][month] || 0) + amount;
    };

    // 1. Add Net Income to Retained Earnings (3200)
    const retainedEarningsCode = "3200";
    if (accounts.some(a => a.code === retainedEarningsCode)) {
       for (let m = 1; m <= 12; m++) {
          addToBalance(retainedEarningsCode, m, monthlyNetIncome[m]);
       }
    }

    // 2. Process Transactions for Balance Sheet items
    const allTransactions: Array<{
      date: string;
      type: 'receipt' | 'disbursement';
      receipt?: typeof receipts[0];
      disbursement?: typeof disbursements[0];
      receiptLines?: CashReceiptLine[];
      disbursementLines?: CashDisbursementLine[];
    }> = [];

    for (const receipt of receipts) {
      allTransactions.push({
        date: receipt.voucherDate,
        type: 'receipt',
        receipt,
        receiptLines: receiptLines.filter(l => l.cashReceiptId === receipt.id)
      });
    }

    for (const disbursement of disbursements) {
      allTransactions.push({
        date: disbursement.voucherDate,
        type: 'disbursement',
        disbursement,
        disbursementLines: disbursementLines.filter(l => l.cashDisbursementId === disbursement.id)
      });
    }

    // Sort transactions by date
    allTransactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const transaction of allTransactions) {
      const month = new Date(transaction.date).getMonth() + 1;

      if (transaction.type === 'receipt') {
        const receipt = transaction.receipt!;
        const totalAmount = parseFloat(receipt.cashAmount || "0");

        // Debit Side: Increase Cash (Asset) - FORCE THIS FROM HEADER
        const cashAccountCode = "1010"; // Default Cash in Bank
        addToBalance(cashAccountCode, month, totalAmount);

        // Credit Side: Liabilities / Equity from lines
        for (const line of transaction.receiptLines || []) {
          const accountType = accountTypeMap.get(line.accountId);
          const accountCode = accountCodeMap.get(line.accountId);
          const amount = parseFloat(line.amount || "0");

          if (accountCode && (accountType === "equity" || accountType === "liability")) {
             addToBalance(accountCode, month, amount);
          }
        }
      } else {
        const disbursement = transaction.disbursement!;
        const totalAmount = parseFloat(disbursement.cashAmount || "0");

        // Credit Side: Decrease Cash (Asset) - FORCE THIS FROM HEADER
        const cashAccountCode = "1010";
        addToBalance(cashAccountCode, month, -totalAmount);

        // Debit Side: Assets/Liabilities/Equity from lines
        for (const line of transaction.disbursementLines || []) {
          const accountType = accountTypeMap.get(line.accountId);
          const accountCode = accountCodeMap.get(line.accountId);
          const amount = parseFloat(line.amount || "0");

          if (accountCode) {
             if (accountType === "asset") {
               addToBalance(accountCode, month, amount);
             } else if (accountType === "liability" || accountType === "equity") {
               addToBalance(accountCode, month, -amount);
             }
          }
        }
      }
    }

    // Calculate cumulative balances for each month (each month includes all previous months)
    const finalBalances: { [key: string]: { [month: number]: number } } = {};

    for (const [accountCode, monthData] of Object.entries(cumulativeBalances)) {
      finalBalances[accountCode] = {};
      let runningTotal = 0;

      for (let month = 1; month <= 12; month++) {
        runningTotal += monthData[month] || 0;
        finalBalances[accountCode][month] = runningTotal;
      }
    }

    const result: any[] = [];
    const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    for (const [accountCode, monthData] of Object.entries(finalBalances)) {
      const accountName = accounts.find(a => a.code === accountCode)?.name || "Unknown Account";
      // Skip if all zeros
      const total = months.reduce((sum, m) => sum + Math.abs(monthData[m] || 0), 0);
      if (total === 0) continue;

      const row: any = {
        accountCode,
        accountName,
        jan: monthData[1] || 0,
        feb: monthData[2] || 0,
        mar: monthData[3] || 0,
        q1: monthData[3] || 0,
        apr: monthData[4] || 0,
        may: monthData[5] || 0,
        jun: monthData[6] || 0,
        q2: monthData[6] || 0,
        jul: monthData[7] || 0,
        aug: monthData[8] || 0,
        sep: monthData[9] || 0,
        q3: monthData[9] || 0,
        oct: monthData[10] || 0,
        nov: monthData[11] || 0,
        dec: monthData[12] || 0,
        q4: monthData[12] || 0,
        annual: monthData[12] || 0,
      };
      result.push(row);
    }

    return result.sort((a, b) => a.accountCode.localeCompare(b.accountCode));
  }

  // Onboarding - Create company with default chart of accounts
  async createCompanyWithDefaults(userId: string, companyName: string): Promise<Company> {
    const today = new Date();
    const trialEnd = new Date(today);
    trialEnd.setDate(trialEnd.getDate() + 30);

    const [company] = await db.insert(companies).values({
      name: companyName,
      subscriptionStatus: "trial",
      subscriptionStartDate: today.toISOString().split('T')[0],
      subscriptionEndDate: trialEnd.toISOString().split('T')[0],
    }).returning();

    await db.update(users)
      .set({ 
        companyId: company.id, 
        role: "general_manager",
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));

    const defaultAccounts: Omit<InsertChartOfAccount, "companyId">[] = [
      { code: "1000", name: "Cash on Hand", accountType: "asset", category: "balance_sheet" },
      { code: "1010", name: "Cash in Bank", accountType: "asset", category: "balance_sheet" },
      { code: "1100", name: "Accounts Receivable", accountType: "asset", category: "balance_sheet" },
      { code: "1200", name: "Inventory - Merchandise", accountType: "asset", category: "balance_sheet" },
      { code: "1300", name: "Prepaid Expenses", accountType: "asset", category: "balance_sheet" },
      { code: "1400", name: "Input VAT", accountType: "asset", category: "balance_sheet" },
      { code: "1500", name: "Property and Equipment", accountType: "asset", category: "balance_sheet" },
      { code: "1510", name: "Accumulated Depreciation", accountType: "asset", category: "balance_sheet" },
      { code: "2000", name: "Accounts Payable", accountType: "liability", category: "balance_sheet" },
      { code: "2100", name: "Output VAT", accountType: "liability", category: "balance_sheet" },
      { code: "2200", name: "Withholding Tax Payable", accountType: "liability", category: "balance_sheet" },
      { code: "2300", name: "SSS/PhilHealth/Pag-IBIG Payable", accountType: "liability", category: "balance_sheet" },
      { code: "2400", name: "Loans Payable", accountType: "liability", category: "balance_sheet" },
      { code: "3000", name: "Owner's Capital", accountType: "equity", category: "balance_sheet" },
      { code: "3100", name: "Owner's Drawings", accountType: "equity", category: "balance_sheet" },
      { code: "3200", name: "Retained Earnings", accountType: "equity", category: "balance_sheet" },
      { code: "4000", name: "Sales Revenue", accountType: "revenue", category: "profit_loss" },
      { code: "4100", name: "Service Revenue", accountType: "revenue", category: "profit_loss" },
      { code: "4200", name: "Other Income", accountType: "revenue", category: "profit_loss" },
      { code: "5000", name: "Cost of Goods Sold", accountType: "cost", category: "profit_loss" },
      { code: "5100", name: "Purchases", accountType: "cost", category: "profit_loss" },
      { code: "5150", name: "Freight-In", accountType: "cost", category: "profit_loss" },
      { code: "5200", name: "Direct Materials", accountType: "cost", category: "profit_loss" },
      { code: "5250", name: "Direct Labor", accountType: "cost", category: "profit_loss" },
      { code: "6000", name: "Salaries and Wages", accountType: "expense", category: "profit_loss" },
      { code: "6100", name: "Rent Expense", accountType: "expense", category: "profit_loss" },
      { code: "6200", name: "Utilities Expense", accountType: "expense", category: "profit_loss" },
      { code: "6300", name: "Transportation Expense", accountType: "expense", category: "profit_loss" },
      { code: "6400", name: "Office Supplies Expense", accountType: "expense", category: "profit_loss" },
      { code: "6500", name: "Communication Expense", accountType: "expense", category: "profit_loss" },
      { code: "6600", name: "Depreciation Expense", accountType: "expense", category: "profit_loss" },
      { code: "6700", name: "Professional Fees", accountType: "expense", category: "profit_loss" },
      { code: "6800", name: "Taxes and Licenses", accountType: "expense", category: "profit_loss" },
      { code: "6900", name: "Miscellaneous Expense", accountType: "expense", category: "profit_loss" },
    ];

    await db.insert(chartOfAccounts).values(
      defaultAccounts.map(acc => ({ ...acc, companyId: company.id }))
    );

    return company;
  }

  // Employee operations
  async getEmployees(companyId: number): Promise<Employee[]> {
    return db.select().from(employees).where(eq(employees.companyId, companyId)).orderBy(employees.lastName);
  }

  async getEmployeeById(id: number): Promise<Employee | undefined> {
    const [employee] = await db.select().from(employees).where(eq(employees.id, id));
    return employee;
  }

  async createEmployee(employee: InsertEmployee): Promise<Employee> {
    const [newEmployee] = await db.insert(employees).values(employee).returning();
    return newEmployee;
  }

  async updateEmployee(id: number, employee: Partial<InsertEmployee>): Promise<Employee> {
    const [updated] = await db.update(employees).set({ ...employee, updatedAt: new Date() }).where(eq(employees.id, id)).returning();
    return updated;
  }

  async deleteEmployee(id: number): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  async bulkCreateEmployees(employeesList: InsertEmployee[]): Promise<Employee[]> {
    if (employeesList.length === 0) return [];
    return db.insert(employees).values(employeesList).returning();
  }

  // Payroll Period operations
  async getPayrollPeriods(companyId: number): Promise<PayrollPeriod[]> {
    return db.select().from(payrollPeriods).where(eq(payrollPeriods.companyId, companyId)).orderBy(desc(payrollPeriods.startDate));
  }

  async getPayrollPeriodById(id: number): Promise<PayrollPeriod | undefined> {
    const [period] = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id));
    return period;
  }

  async createPayrollPeriod(period: InsertPayrollPeriod): Promise<PayrollPeriod> {
    const [newPeriod] = await db.insert(payrollPeriods).values(period).returning();
    return newPeriod;
  }

  async updatePayrollPeriod(id: number, period: Partial<InsertPayrollPeriod>): Promise<PayrollPeriod> {
    const [updated] = await db.update(payrollPeriods).set({ ...period, updatedAt: new Date() }).where(eq(payrollPeriods.id, id)).returning();
    return updated;
  }

  async deletePayrollPeriod(id: number): Promise<void> {
    await db.delete(payrollPeriods).where(eq(payrollPeriods.id, id));
  }

  // Payroll Record operations
  async getPayrollRecords(periodId: number): Promise<(PayrollRecord & { employee: Employee })[]> {
    const records = await db.select().from(payrollRecords).where(eq(payrollRecords.payrollPeriodId, periodId));
    const results: (PayrollRecord & { employee: Employee })[] = [];
    for (const record of records) {
      const employee = await this.getEmployeeById(record.employeeId);
      if (employee) {
        results.push({ ...record, employee });
      }
    }
    return results;
  }

  async createPayrollRecord(record: InsertPayrollRecord): Promise<PayrollRecord> {
    const [newRecord] = await db.insert(payrollRecords).values(record).returning();
    return newRecord;
  }

  async bulkCreatePayrollRecords(records: InsertPayrollRecord[]): Promise<PayrollRecord[]> {
    if (records.length === 0) return [];
    return db.insert(payrollRecords).values(records).returning();
  }

  async updatePayrollRecord(id: number, record: Partial<InsertPayrollRecord>): Promise<PayrollRecord> {
    const [updated] = await db.update(payrollRecords).set({ ...record, updatedAt: new Date() }).where(eq(payrollRecords.id, id)).returning();
    return updated;
  }

  async deletePayrollRecord(id: number): Promise<void> {
    await db.delete(payrollRecords).where(eq(payrollRecords.id, id));
  }

  // BIR Data Aggregation helpers
  async getPayrollSummaryByPeriod(companyId: number, startDate: string, endDate: string): Promise<any> {
    const periods = await db.select().from(payrollPeriods)
      .where(and(
        eq(payrollPeriods.companyId, companyId),
        gte(payrollPeriods.startDate, startDate),
        lte(payrollPeriods.endDate, endDate)
      ));

    let totalGrossCompensation = 0;
    let totalWithholdingTax = 0;
    let totalSssEmployee = 0;
    let totalPhilhealthEmployee = 0;
    let totalHdmfEmployee = 0;
    let totalSssEmployer = 0;
    let totalPhilhealthEmployer = 0;
    let totalHdmfEmployer = 0;
    let employeeCount = 0;

    for (const period of periods) {
      const records = await db.select().from(payrollRecords).where(eq(payrollRecords.payrollPeriodId, period.id));
      employeeCount = Math.max(employeeCount, records.length);
      
      for (const record of records) {
        totalGrossCompensation += parseFloat(record.grossCompensation || "0");
        totalWithholdingTax += parseFloat(record.withholdingTax || "0");
        totalSssEmployee += parseFloat(record.sssEmployee || "0");
        totalPhilhealthEmployee += parseFloat(record.philhealthEmployee || "0");
        totalHdmfEmployee += parseFloat(record.hdmfEmployee || "0");
        totalSssEmployer += parseFloat(record.sssEmployer || "0");
        totalPhilhealthEmployer += parseFloat(record.philhealthEmployer || "0");
        totalHdmfEmployer += parseFloat(record.hdmfEmployer || "0");
      }
    }

    return {
      periodCount: periods.length,
      employeeCount,
      totalGrossCompensation,
      totalWithholdingTax,
      totalSssEmployee,
      totalPhilhealthEmployee,
      totalHdmfEmployee,
      totalSssEmployer,
      totalPhilhealthEmployer,
      totalHdmfEmployer,
      totalEmployeeContributions: totalSssEmployee + totalPhilhealthEmployee + totalHdmfEmployee,
      totalEmployerContributions: totalSssEmployer + totalPhilhealthEmployer + totalHdmfEmployer,
    };
  }

  async getWithholdingTaxSummary(companyId: number, startDate: string, endDate: string): Promise<any> {
    const payrollSummary = await this.getPayrollSummaryByPeriod(companyId, startDate, endDate);
    
    return {
      compensationWithholdingTax: payrollSummary.totalWithholdingTax,
      expandedWithholdingTax: 0, 
      finalWithholdingTax: 0,
      totalWithholdingTax: payrollSummary.totalWithholdingTax,
    };
  }

  async getVatSummary(companyId: number, startDate: string, endDate: string): Promise<any> {
    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));
      
    const receipts = receiptsAll.filter(r => r.voucherDate >= startDate && r.voucherDate <= endDate);

    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
      
    const disbursements = disbursementsAll.filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate);

    let vatableSales = 0;
    let zeroRatedSales = 0;
    let exemptSales = 0;
    let outputVat = 0;

    for (const receipt of receipts) {
      if (receipt.isVatable) {
        vatableSales += parseFloat(receipt.netAmount || "0");
        outputVat += parseFloat(receipt.vatAmount || "0");
      } else if (receipt.isZeroRated) {
        zeroRatedSales += parseFloat(receipt.netAmount || "0");
      } else {
        exemptSales += parseFloat(receipt.cashAmount || "0");
      }
    }

    let inputVat = 0;
    for (const disbursement of disbursements) {
      if (disbursement.hasInputVat) {
        inputVat += parseFloat(disbursement.vatAmount || "0");
      }
    }

    return {
      vatableSales,
      zeroRatedSales,
      exemptSales,
      outputVat,
      inputVat,
      vatPayable: outputVat - inputVat,
    };
  }

  async getIncomeSummary(companyId: number, startDate: string, endDate: string): Promise<any> {
    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));
    
    const receipts = receiptsAll.filter(r => r.voucherDate >= startDate && r.voucherDate <= endDate);

    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
      
    const disbursements = disbursementsAll.filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate);

    const grossIncome = receipts.reduce((sum, r) => sum + parseFloat(r.netAmount || r.cashAmount || "0"), 0);
    const deductions = disbursements.reduce((sum, d) => sum + parseFloat(d.netAmount || d.cashAmount || "0"), 0);
    const taxableIncome = grossIncome - deductions;
    const incomeTaxRate = 0.25;
    const incomeTaxDue = Math.max(0, taxableIncome * incomeTaxRate);

    return {
      grossIncome,
      deductions,
      taxableIncome,
      incomeTaxDue,
      incomeTaxRate,
    };
  }

  async getSupplierPaymentsSummary(companyId: number, startDate: string, endDate: string): Promise<any> {
    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
      
    const disbursements = disbursementsAll.filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate);

    const supplierPayments: { [key: string]: { totalPayments: number; count: number } } = {};
    
    for (const d of disbursements) {
      const payeeName = d.payeeName || "Unknown";
      if (!supplierPayments[payeeName]) {
        supplierPayments[payeeName] = { totalPayments: 0, count: 0 };
      }
      supplierPayments[payeeName].totalPayments += parseFloat(d.cashAmount || "0");
      supplierPayments[payeeName].count += 1;
    }

    return {
      totalPayments: disbursements.reduce((sum, d) => sum + parseFloat(d.cashAmount || "0"), 0),
      supplierCount: Object.keys(supplierPayments).length,
      suppliers: Object.entries(supplierPayments).map(([name, data]) => ({
        name,
        ...data,
      })),
    };
  }

  async getEmployeeAlphalist(companyId: number, year: number): Promise<any[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;

    const empList = await this.getEmployees(companyId);
    
    const periodsAll = await db
      .select()
      .from(payrollPeriods)
      .where(eq(payrollPeriods.companyId, companyId));
      
    const periods = periodsAll.filter(p => p.startDate >= startDate && p.endDate <= endDate);

    const alphalist: any[] = [];

    for (const emp of empList) {
      let totalCompensation = 0;
      let totalWithholdingTax = 0;
      let totalSss = 0;
      let totalPhilhealth = 0;
      let totalHdmf = 0;

      for (const period of periods) {
        const records = await db.select().from(payrollRecords)
          .where(and(
            eq(payrollRecords.payrollPeriodId, period.id),
            eq(payrollRecords.employeeId, emp.id)
          ));

        for (const record of records) {
          totalCompensation += parseFloat(record.grossCompensation || "0");
          totalWithholdingTax += parseFloat(record.withholdingTax || "0");
          totalSss += parseFloat(record.sssEmployee || "0");
          totalPhilhealth += parseFloat(record.philhealthEmployee || "0");
          totalHdmf += parseFloat(record.hdmfEmployee || "0");
        }
      }

      alphalist.push({
        employeeCode: emp.employeeCode,
        tin: emp.tin || "",
        lastName: emp.lastName,
        firstName: emp.firstName,
        middleName: emp.middleName || "",
        totalCompensation,
        totalWithholdingTax,
        totalSss,
        totalPhilhealth,
        totalHdmf,
        netPay: totalCompensation - totalWithholdingTax - totalSss - totalPhilhealth - totalHdmf,
      });
    }

    return alphalist.sort((a, b) => a.lastName.localeCompare(b.lastName));
  }

  async getSalesList(companyId: number, startDate: string, endDate: string): Promise<any[]> {
    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(eq(cashReceipts.companyId, companyId));
      
    const receipts = receiptsAll
      .filter(r => r.voucherDate >= startDate && r.voucherDate <= endDate)
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());

    return receipts.map(r => ({
      date: r.voucherDate,
      crn: r.crn,
      customerTin: r.customerTin || "",
      customerName: r.payorName || "",
      customerAddress: r.payorAddress || "",
      salesAmount: parseFloat(r.netAmount || r.cashAmount || "0"),
      vatAmount: parseFloat(r.vatAmount || "0"),
      grossAmount: parseFloat(r.cashAmount || "0"),
      isVatable: r.isVatable || false,
    }));
  }

  async getPurchasesList(companyId: number, startDate: string, endDate: string): Promise<any[]> {
    const disbursementsAll = await db
      .select()
      .from(cashDisbursements)
      .where(eq(cashDisbursements.companyId, companyId));
      
    const disbursements = disbursementsAll
      .filter(d => d.voucherDate >= startDate && d.voucherDate <= endDate)
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());

    return disbursements.map(d => ({
      date: d.voucherDate,
      cvn: d.cvn,
      supplierTin: d.supplierTin || "",
      supplierName: d.payeeName || "",
      supplierAddress: d.payeeAddress || "",
      purchaseAmount: parseFloat(d.netAmount || d.cashAmount || "0"),
      vatAmount: parseFloat(d.inputVatAmount || "0"),
      grossAmount: parseFloat(d.cashAmount || "0"),
      hasInputVat: d.hasInputVat || false,
    }));
  }

  async getWithholdingTaxCredits(companyId: number, startDate: string, endDate: string): Promise<any[]> {
    const receiptsAll = await db
      .select()
      .from(cashReceipts)
      .where(and(
        eq(cashReceipts.companyId, companyId),
        sql`CAST(${cashReceipts.withholdingTaxAmount} AS DECIMAL) > 0`
      ));
      
    const receipts = receiptsAll
      .filter(r => r.voucherDate >= startDate && r.voucherDate <= endDate)
      .sort((a, b) => new Date(a.voucherDate).getTime() - new Date(b.voucherDate).getTime());

    return receipts.map(r => ({
      date: r.voucherDate,
      crn: r.crn,
      withholdingAgentTin: r.customerTin || "",
      withholdingAgentName: r.payorName || "",
      withholdingAgentAddress: r.payorAddress || "",
      incomePayment: parseFloat(r.netAmount || r.cashAmount || "0"),
      taxWithheld: parseFloat(r.withholdingTaxAmount || "0"),
      atcCode: r.atcCode || "",
    }));
  }

  // Tax Settings operations
  async getTaxSettings(companyId: number, taxYear: number): Promise<TaxSettings | undefined> {
    const [settings] = await db.select().from(taxSettings)
      .where(and(eq(taxSettings.companyId, companyId), eq(taxSettings.taxYear, taxYear)));
    return settings;
  }

  async upsertTaxSettings(settings: InsertTaxSettings): Promise<TaxSettings> {
    const existing = await this.getTaxSettings(settings.companyId, settings.taxYear);
    if (existing) {
      const [updated] = await db.update(taxSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(taxSettings.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(taxSettings).values(settings).returning();
    return created;
  }

  // MCIT Credits operations
  async getMcitCredits(companyId: number): Promise<McitCredit[]> {
    return db.select().from(mcitCredits)
      .where(eq(mcitCredits.companyId, companyId))
      .orderBy(desc(mcitCredits.taxYear));
  }

  async getAvailableMcitCredits(companyId: number, currentYear: number): Promise<McitCredit[]> {
    return db.select().from(mcitCredits)
      .where(and(
        eq(mcitCredits.companyId, companyId),
        gte(mcitCredits.expiryYear, currentYear),
        sql`CAST(${mcitCredits.remainingAmount} AS DECIMAL) > 0`
      ))
      .orderBy(mcitCredits.taxYear);
  }

  async createMcitCredit(credit: InsertMcitCredit): Promise<McitCredit> {
    const [created] = await db.insert(mcitCredits).values(credit).returning();
    return created;
  }

  async updateMcitCredit(id: number, credit: Partial<InsertMcitCredit>): Promise<McitCredit> {
    const [updated] = await db.update(mcitCredits).set(credit).where(eq(mcitCredits.id, id)).returning();
    return updated;
  }

  async deleteMcitCredit(id: number): Promise<void> {
    await db.delete(mcitCredits).where(eq(mcitCredits.id, id));
  }

  // NOLCO operations
  async getNolcoEntries(companyId: number): Promise<NolcoEntry[]> {
    return db.select().from(nolcoEntries)
      .where(eq(nolcoEntries.companyId, companyId))
      .orderBy(desc(nolcoEntries.lossYear));
  }

  async getAvailableNolco(companyId: number, currentYear: number): Promise<NolcoEntry[]> {
    return db.select().from(nolcoEntries)
      .where(and(
        eq(nolcoEntries.companyId, companyId),
        gte(nolcoEntries.expiryYear, currentYear),
        sql`CAST(${nolcoEntries.remainingAmount} AS DECIMAL) > 0`
      ))
      .orderBy(nolcoEntries.lossYear);
  }

  async createNolcoEntry(entry: InsertNolcoEntry): Promise<NolcoEntry> {
    const [created] = await db.insert(nolcoEntries).values(entry).returning();
    return created;
  }

  async updateNolcoEntry(id: number, entry: Partial<InsertNolcoEntry>): Promise<NolcoEntry> {
    const [updated] = await db.update(nolcoEntries).set(entry).where(eq(nolcoEntries.id, id)).returning();
    return updated;
  }

  async deleteNolcoEntry(id: number): Promise<void> {
    await db.delete(nolcoEntries).where(eq(nolcoEntries.id, id));
  }

  // Final Withholding Income operations
  async getFinalWithholdingIncomes(companyId: number, taxYear?: number): Promise<FinalWithholdingIncome[]> {
    if (taxYear) {
      return db.select().from(finalWithholdingIncomes)
        .where(and(
          eq(finalWithholdingIncomes.companyId, companyId),
          eq(finalWithholdingIncomes.taxYear, taxYear)
        ))
        .orderBy(desc(finalWithholdingIncomes.taxYear));
    }
    return db.select().from(finalWithholdingIncomes)
      .where(eq(finalWithholdingIncomes.companyId, companyId))
      .orderBy(desc(finalWithholdingIncomes.taxYear));
  }

  async createFinalWithholdingIncome(income: InsertFinalWithholdingIncome): Promise<FinalWithholdingIncome> {
    const [created] = await db.insert(finalWithholdingIncomes).values(income).returning();
    return created;
  }

  async deleteFinalWithholdingIncome(id: number): Promise<void> {
    await db.delete(finalWithholdingIncomes).where(eq(finalWithholdingIncomes.id, id));
  }
}

export const storage = new DatabaseStorage();