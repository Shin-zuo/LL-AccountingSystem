import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { 
  insertCashReceiptSchema, 
  insertCashDisbursementSchema, 
  insertChartOfAccountsSchema, 
  insertCompanySchema,
  insertEmployeeSchema,
  insertPayrollPeriodSchema,
  insertPayrollRecordSchema,
  insertTaxSettingsSchema,
  insertMcitCreditSchema,
  insertNolcoEntrySchema,
  insertFinalWithholdingIncomeSchema,
  BIR_REPORTS,
  hasPermission,
  type Permission,
  type UserRole,
  USER_ROLES,
} from "@shared/schema";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { users } from "@shared/schema";
import { db } from "./db";
import * as XLSX from "xlsx";

// Middleware to check authentication
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};

// Middleware to get user's company ID
async function getCompanyId(req: Request): Promise<number | null> {
  const userId = getUserId(req);
  if (!userId) return null;

  const dbUser = await storage.getUser(userId);
  return dbUser?.companyId || null;
}

// Helper to get user ID from request
function getUserId(req: Request): string | null {
  const user = req.user as any;
  return user?.id || null;
}

// Helper to get user role from request
async function getUserRole(req: Request): Promise<UserRole | null> {
  const userId = getUserId(req);
  if (!userId) return null;
  const dbUser = await storage.getUser(userId);
  return (dbUser?.role as UserRole) || null;
}

// Middleware to check if user has specific permission
function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await getUserRole(req);
      if (!role) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!hasPermission(role, permission)) {
        return res.status(403).json({ message: "Access denied - insufficient permissions" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
}

// Middleware to check if user can approve transactions
function requireApproval() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await getUserRole(req);
      if (!role) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!hasPermission(role, "canApprove")) {
        return res.status(403).json({ message: "Access denied - approval rights required" });
      }
      next();
    } catch (error) {
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
}

// Configure Passport Local Strategy
passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, async (email, password, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user.length === 0) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    const isValidPassword = await bcrypt.compare(password, user[0].password);
    if (!isValidPassword) {
      return done(null, false, { message: 'Invalid email or password' });
    }
    return done(null, user[0]);
  } catch (error) {
    return done(error);
  }
}));

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
    done(null, user[0]);
  } catch (error) {
    done(error);
  }
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<void> {
  // Setup Passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    // Prevent caching of login response
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: 'Login failed' });
      }
      if (!user) {
        return res.status(401).json({ message: info.message });
      }
      req.logIn(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed' });
        }
        res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: 'Logout failed' });
      }
      // Clear the session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Session destroy error:", sessionErr);
          return res.status(500).json({ message: 'Session cleanup failed' });
        }
        // FIXED: Explicitly clear the cookie with path
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ message: 'Logged out successfully' });
      });
    });
  });

  // Session refresh endpoint
  app.post("/api/refresh-session", requireAuth, (req, res) => {
    res.json({ message: 'Session refreshed successfully' });
  });

  // FIXED: Get current user - Added Anti-Caching Headers
  app.get("/api/me", (req, res) => {
    // Crucial headers to stop browser from serving "User A" when you are "User B"
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log("Checking /api/me - isAuthenticated:", req.isAuthenticated());
    if (req.isAuthenticated()) {
      const user = req.user as any;
      console.log("Current session user:", user.email);
      res.json({ user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role } });
    } else {
      console.log("User not authenticated");
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Onboarding - Create company for new users
  app.post("/api/onboarding", requireAuth, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Check if user already has a company
      const existingUser = await storage.getUser(userId);
      if (existingUser?.companyId) {
        return res.status(400).json({ message: "User already has a company" });
      }

      const { companyName } = req.body;
      if (!companyName || typeof companyName !== "string" || companyName.trim().length === 0) {
        return res.status(400).json({ message: "Company name is required" });
      }

      const company = await storage.createCompanyWithDefaults(userId, companyName.trim());
      res.status(201).json(company);
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  // Company routes
  app.get("/api/company", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const company = await storage.getCompany(companyId);
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.patch("/api/company", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const validated = insertCompanySchema.partial().parse(req.body);
      const updated = await storage.updateCompany(companyId, validated);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  // Chart of Accounts routes
  app.get("/api/chart-of-accounts", requireAuth, requirePermission("chartOfAccounts"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const accounts = await storage.getChartOfAccounts(companyId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/chart-of-accounts", requireAuth, requirePermission("chartOfAccounts"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const validated = insertChartOfAccountsSchema.parse({ ...req.body, companyId });
      const account = await storage.createChartOfAccount(validated);
      res.status(201).json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.patch("/api/chart-of-accounts/:id", requireAuth, requirePermission("chartOfAccounts"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validated = insertChartOfAccountsSchema.partial().parse(req.body);
      const updated = await storage.updateChartOfAccount(id, validated);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update account" });
    }
  });

  app.delete("/api/chart-of-accounts/:id", requireAuth, requirePermission("chartOfAccounts"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChartOfAccount(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Cash Receipts routes
  app.get("/api/cash-receipts", requireAuth, requirePermission("cashReceipts"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const receipts = await storage.getCashReceipts(companyId);
      res.json(receipts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipts" });
    }
  });

  app.get("/api/cash-receipts/:id", requireAuth, requirePermission("cashReceipts"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const receipt = await storage.getCashReceiptWithLines(id);
      if (!receipt) {
        return res.status(404).json({ message: "Receipt not found" });
      }
      res.json(receipt);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch receipt" });
    }
  });

  app.post("/api/cash-receipts", requireAuth, requirePermission("cashReceipts"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const userId = getUserId(req);
      const { lines, ...receiptData } = req.body;
      const validated = insertCashReceiptSchema.parse({
        ...receiptData,
        companyId,
        preparedById: userId,
      });
      const receipt = await storage.createCashReceipt(validated, lines || []);
      res.status(201).json(receipt);
    } catch (error) {
      console.error("Create receipt error:", error);
      res.status(500).json({ message: "Failed to create receipt" });
    }
  });

  app.patch("/api/cash-receipts/:id", requireAuth, requirePermission("cashReceipts"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { lines, ...receiptData } = req.body;
      const updated = await storage.updateCashReceipt(id, receiptData, lines);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update receipt" });
    }
  });

  app.delete("/api/cash-receipts/:id", requireAuth, requirePermission("cashReceipts"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCashReceipt(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete receipt" });
    }
  });

  app.post("/api/cash-receipts/:id/approve", requireAuth, requireApproval(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const approved = await storage.approveCashReceipt(id, userId!);
      res.json(approved);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve receipt" });
    }
  });

  // Cash Disbursements routes
  app.get("/api/cash-disbursements", requireAuth, requirePermission("cashDisbursements"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const disbursements = await storage.getCashDisbursements(companyId);
      res.json(disbursements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disbursements" });
    }
  });

  app.get("/api/cash-disbursements/:id", requireAuth, requirePermission("cashDisbursements"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const disbursement = await storage.getCashDisbursementWithLines(id);
      if (!disbursement) {
        return res.status(404).json({ message: "Disbursement not found" });
      }
      res.json(disbursement);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch disbursement" });
    }
  });

  app.post("/api/cash-disbursements", requireAuth, requirePermission("cashDisbursements"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const userId = getUserId(req);
      const { lines, ...disbursementData } = req.body;
      const validated = insertCashDisbursementSchema.parse({
        ...disbursementData,
        companyId,
        preparedById: userId,
      });
      const disbursement = await storage.createCashDisbursement(validated, lines || []);
      res.status(201).json(disbursement);
    } catch (error) {
      console.error("Create disbursement error:", error);
      res.status(500).json({ message: "Failed to create disbursement" });
    }
  });

  app.patch("/api/cash-disbursements/:id", requireAuth, requirePermission("cashDisbursements"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { lines, ...disbursementData } = req.body;
      const updated = await storage.updateCashDisbursement(id, disbursementData, lines);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update disbursement" });
    }
  });

  app.delete("/api/cash-disbursements/:id", requireAuth, requirePermission("cashDisbursements"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCashDisbursement(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete disbursement" });
    }
  });

  app.post("/api/cash-disbursements/:id/approve", requireAuth, requireApproval(), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const approved = await storage.approveCashDisbursement(id, userId!);
      res.json(approved);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve disbursement" });
    }
  });

  // User routes - require userManagement permission for listing and role changes
  app.get("/api/users", requireAuth, requirePermission("userManagement"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const users = await storage.getUsersByCompanyId(companyId);
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/users/approvers", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const approvers = await storage.getApprovers(companyId);
      res.json(approvers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch approvers" });
    }
  });

  // Get available roles - accessible to users who can manage users
  app.get("/api/roles", requireAuth, requirePermission("userManagement"), async (req, res) => {
    res.json(Object.values(USER_ROLES));
  });

  app.post("/api/users", requireAuth, requirePermission("userManagement"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }

      const { email, firstName, lastName, role } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, first name, last name, and role are required" });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }

      // Validate role
      const validRoles = Object.values(USER_ROLES);
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Valid roles are: " + validRoles.join(", ") });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Set default password to "user123"
      const defaultPassword = "user123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      // Create the user
      const newUser = await storage.createUser({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        role,
        companyId,
      });

      // TODO: Send invitation email with login instructions
      // For now, we'll just return success and log the default password
      console.log(`New user created: ${email}, default password: ${defaultPassword}`);

      res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        createdAt: newUser.createdAt,
        message: "User created successfully with default password 'user123'. Please inform the user of their login credentials."
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.patch("/api/users/:id/role", requireAuth, requirePermission("userManagement"), async (req, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;
      const validRoles = Object.values(USER_ROLES);
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role. Valid roles are: " + validRoles.join(", ") });
      }
      const updated = await storage.updateUserRole(userId, role);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.patch("/api/users/:id/reset-password", requireAuth, requirePermission("userManagement"), async (req, res) => {
    try {
      const userId = req.params.id;
      const defaultPassword = "user123";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const updated = await storage.updateUserPassword(userId, hashedPassword);
      res.json({ message: "Password reset to default successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset user password" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const stats = await storage.getDashboardStats(companyId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/dashboard/recent", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const vouchers = await storage.getRecentVouchers(companyId, 10);
      res.json(vouchers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent vouchers" });
    }
  });

  // Journal-Ledger routes
  app.get("/api/journal-ledger", requireAuth, requirePermission("journalLedger"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const entries = await storage.getJournalEntries(companyId, year);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal-ledger/totals", requireAuth, requirePermission("journalLedger"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const entries = await storage.getJournalEntries(companyId, year);
      
      const months = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
      
      const totals = months.map((month, idx) => {
        const monthNum = idx + 1;
        const monthEntries = entries.filter((e: any) => {
          const entryMonth = new Date(e.voucherDate).getMonth() + 1;
          return entryMonth === monthNum;
        });
        
        const monthlyDebit = monthEntries.reduce((sum: number, e: any) => sum + parseFloat(e.debit || "0"), 0);
        const monthlyCredit = monthEntries.reduce((sum: number, e: any) => sum + parseFloat(e.credit || "0"), 0);
        
        const isQuarterEnd = monthNum % 3 === 0;
        let quarterlyDebit, quarterlyCredit;
        
        if (isQuarterEnd) {
          const quarterMonths = [monthNum - 2, monthNum - 1, monthNum];
          const quarterEntries = entries.filter((e: any) => {
            const entryMonth = new Date(e.voucherDate).getMonth() + 1;
            return quarterMonths.includes(entryMonth);
          });
          quarterlyDebit = quarterEntries.reduce((sum: number, e: any) => sum + parseFloat(e.debit || "0"), 0);
          quarterlyCredit = quarterEntries.reduce((sum: number, e: any) => sum + parseFloat(e.credit || "0"), 0);
        }
        
        return {
          month,
          monthlyDebit,
          monthlyCredit,
          isQuarterEnd,
          quarterlyDebit,
          quarterlyCredit,
        };
      });
      
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch totals" });
    }
  });

  // VAT Books routes
  app.get("/api/vat-sales-book", requireAuth, requirePermission("vatBooks"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const receipts = await storage.getVatableCashReceipts(companyId, year);
      
      const entries = receipts.map((r) => ({
        id: r.id,
        crn: r.crn,
        voucherDate: r.voucherDate,
        invoiceNumber: r.invoiceNumber,
        invoiceDate: r.invoiceDate,
        payorName: r.payorName,
        netAmount: r.netAmount,
        vatAmount: r.vatAmount,
        grossAmount: r.cashAmount,
      }));
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch VAT sales book" });
    }
  });

  app.get("/api/vat-purchase-book", requireAuth, requirePermission("vatBooks"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const disbursements = await storage.getVatableCashDisbursements(companyId, year);
      
      const entries = disbursements.map((d) => ({
        id: d.id,
        cdn: d.cdn,
        voucherDate: d.voucherDate,
        supplierInvoiceNumber: d.supplierInvoiceNumber,
        supplierInvoiceDate: d.supplierInvoiceDate,
        payeeName: d.payeeName,
        netAmount: d.netAmount,
        vatAmount: d.vatAmount,
        grossAmount: d.cashAmount,
      }));
      
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch VAT purchase book" });
    }
  });

  app.get("/api/vat-totals", requireAuth, requirePermission("vatBooks"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      const receipts = await storage.getVatableCashReceipts(companyId, year);
      const disbursements = await storage.getVatableCashDisbursements(companyId, year);
      
      const months = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
      
      const totals = months.map((month, idx) => {
        const monthNum = idx + 1;
        
        const monthReceipts = receipts.filter((r) => {
          const entryMonth = new Date(r.voucherDate).getMonth() + 1;
          return entryMonth === monthNum;
        });
        
        const monthDisbursements = disbursements.filter((d) => {
          const entryMonth = new Date(d.voucherDate).getMonth() + 1;
          return entryMonth === monthNum;
        });
        
        const outputVat = monthReceipts.reduce((sum, r) => sum + parseFloat(r.vatAmount || "0"), 0);
        const inputVat = monthDisbursements.reduce((sum, d) => sum + parseFloat(d.vatAmount || "0"), 0);
        
        const isQuarterEnd = monthNum % 3 === 0;
        let quarterlyOutput, quarterlyInput, quarterlyNet;
        
        if (isQuarterEnd) {
          const quarterMonths = [monthNum - 2, monthNum - 1, monthNum];
          
          const quarterReceipts = receipts.filter((r) => {
            const entryMonth = new Date(r.voucherDate).getMonth() + 1;
            return quarterMonths.includes(entryMonth);
          });
          
          const quarterDisbursements = disbursements.filter((d) => {
            const entryMonth = new Date(d.voucherDate).getMonth() + 1;
            return quarterMonths.includes(entryMonth);
          });
          
          quarterlyOutput = quarterReceipts.reduce((sum, r) => sum + parseFloat(r.vatAmount || "0"), 0);
          quarterlyInput = quarterDisbursements.reduce((sum, d) => sum + parseFloat(d.vatAmount || "0"), 0);
          quarterlyNet = quarterlyOutput - quarterlyInput;
        }
        
        return {
          month,
          outputVat,
          inputVat,
          netVat: outputVat - inputVat,
          isQuarterEnd,
          quarterlyOutput,
          quarterlyInput,
          quarterlyNet,
        };
      });
      
      res.json(totals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch VAT totals" });
    }
  });

  // Financial Reports routes
  app.get("/api/reports/summary/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year) || new Date().getFullYear();
      
      // Get all accounts to determine account types
      const accounts = await storage.getChartOfAccounts(companyId);
      const accountTypeMap = new Map(accounts.map(a => [a.id, a.accountType]));
      
      // Get receipts (revenue) and disbursements (cost/expense)
      const receipts = await storage.getCashReceipts(companyId);
      const disbursements = await storage.getCashDisbursements(companyId);
      
      // Filter by year
      const yearStart = new Date(`${year}-01-01`);
      const yearEnd = new Date(`${year}-12-31`);
      
      const yearReceipts = receipts.filter(r => {
        const date = new Date(r.voucherDate);
        return date >= yearStart && date <= yearEnd;
      });
      
      const yearDisbursements = disbursements.filter(d => {
        const date = new Date(d.voucherDate);
        return date >= yearStart && date <= yearEnd;
      });
      
      // Calculate totals - receipts are revenue
      const totalRevenue = yearReceipts.reduce((sum, r) => sum + parseFloat(r.cashAmount || "0"), 0);
      
      // For disbursements, we need to check the account type
      // Get lines for each disbursement to determine if it's cost or expense
      let totalCost = 0;
      let totalExpenses = 0;
      
      for (const d of yearDisbursements) {
        const disbWithLines = await storage.getCashDisbursementWithLines(d.id);
        if (disbWithLines?.lines) {
          for (const line of disbWithLines.lines) {
            const accountType = accountTypeMap.get(line.accountId);
            const amount = parseFloat(line.amount || "0");
            if (accountType === "cost") {
              totalCost += amount;
            } else if (accountType === "expense") {
              totalExpenses += amount;
            }
          }
        }
      }
      
      const grossProfit = totalRevenue - totalCost;
      const netIncome = grossProfit - totalExpenses;
      
      res.json({
        totalRevenue,
        totalCost,
        totalExpenses,
        grossProfit,
        netIncome,
        totalAssets: totalRevenue,
        totalLiabilities: 0,
        totalEquity: netIncome,
      });
    } catch (error) {
      console.error("Failed to fetch summary:", error);
      res.status(500).json({ message: "Failed to fetch summary" });
    }
  });

  app.get("/api/reports/profit-loss/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year) || new Date().getFullYear();
      const data = await storage.getProfitLossData(companyId, year);
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch P&L data:", error);
      res.status(500).json({ message: "Failed to fetch P&L data" });
    }
  });

  app.get("/api/reports/balance-sheet/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year) || new Date().getFullYear();
      const data = await storage.getBalanceSheetData(companyId, year);
      res.json(data);
    } catch (error) {
      console.error("Failed to fetch balance sheet data:", error);
      res.status(500).json({ message: "Failed to fetch balance sheet data" });
    }
  });

  // Excel Export route
  app.get("/api/export/excel", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      const company = await storage.getCompany(companyId);
      const accounts = await storage.getChartOfAccounts(companyId);
      const receipts = await storage.getCashReceipts(companyId);
      const disbursements = await storage.getCashDisbursements(companyId);
      const entries = await storage.getJournalEntries(companyId, year);
      const vatSales = await storage.getVatableCashReceipts(companyId, year);
      const vatPurchases = await storage.getVatableCashDisbursements(companyId, year);
      
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Chart of Accounts
      const coaData = [
        ["Chart of Accounts"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["Code", "Account Name", "Type", "Category", "Status"],
        ...accounts.map((a) => [a.code, a.name, a.accountType, a.category, a.isActive ? "Active" : "Inactive"]),
      ];
      const coaSheet = XLSX.utils.aoa_to_sheet(coaData);
      XLSX.utils.book_append_sheet(workbook, coaSheet, "Chart of Accounts");
      
      // Sheet 2: Cash Receipts
      const crData = [
        ["Cash Receipts Vouchers"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["CRN", "Date", "Invoice No.", "Invoice Date", "Payor", "Particulars", "Cash Amount", "Net Amount", "VAT", "Status"],
        ...receipts.map((r) => [
          r.crn,
          r.voucherDate,
          r.invoiceNumber || "",
          r.invoiceDate || "",
          r.payorName,
          r.particulars || "",
          parseFloat(r.cashAmount || "0"),
          parseFloat(r.netAmount || "0"),
          parseFloat(r.vatAmount || "0"),
          r.status,
        ]),
      ];
      const crSheet = XLSX.utils.aoa_to_sheet(crData);
      XLSX.utils.book_append_sheet(workbook, crSheet, "Cash Receipts");
      
      // Sheet 3: Cash Disbursements
      const cdData = [
        ["Cash Disbursements Vouchers"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["CDN", "Date", "Supplier Inv.", "Inv. Date", "Payee", "Particulars", "Cash Amount", "Net Amount", "Input VAT", "Status"],
        ...disbursements.map((d) => [
          d.cdn,
          d.voucherDate,
          d.supplierInvoiceNumber || "",
          d.supplierInvoiceDate || "",
          d.payeeName,
          d.particulars || "",
          parseFloat(d.cashAmount || "0"),
          parseFloat(d.netAmount || "0"),
          parseFloat(d.vatAmount || "0"),
          d.status,
        ]),
      ];
      const cdSheet = XLSX.utils.aoa_to_sheet(cdData);
      XLSX.utils.book_append_sheet(workbook, cdSheet, "Cash Disbursements");
      
      // Sheet 4: Consolidated Journal-Ledger
      const jlData = [
        ["Consolidated Journal-Ledger"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["Type", "Voucher No.", "Date", "Name", "Particulars", "Debit", "Credit"],
        ...entries.map((e: any) => [
          e.type === "receipt" ? "CR" : "CD",
          e.voucherNumber,
          e.voucherDate,
          e.name,
          e.particulars,
          parseFloat(e.debit || "0"),
          parseFloat(e.credit || "0"),
        ]),
      ];
      const jlSheet = XLSX.utils.aoa_to_sheet(jlData);
      XLSX.utils.book_append_sheet(workbook, jlSheet, "Journal-Ledger");
      
      // Sheet 5: VAT Sales Book
      const vsData = [
        ["VAT Sales Book (Output VAT)"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["CRN", "Date", "Invoice No.", "Invoice Date", "Customer", "Net Sales", "Output VAT", "Gross"],
        ...vatSales.map((r) => [
          r.crn,
          r.voucherDate,
          r.invoiceNumber || "",
          r.invoiceDate || "",
          r.payorName,
          parseFloat(r.netAmount || "0"),
          parseFloat(r.vatAmount || "0"),
          parseFloat(r.cashAmount || "0"),
        ]),
      ];
      const vsSheet = XLSX.utils.aoa_to_sheet(vsData);
      XLSX.utils.book_append_sheet(workbook, vsSheet, "VAT Sales Book");
      
      // Sheet 6: VAT Purchase Book
      const vpData = [
        ["VAT Purchase Book (Input VAT)"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["CDN", "Date", "Supplier Inv.", "Inv. Date", "Supplier", "Net Purchase", "Input VAT", "Gross"],
        ...vatPurchases.map((d) => [
          d.cdn,
          d.voucherDate,
          d.supplierInvoiceNumber || "",
          d.supplierInvoiceDate || "",
          d.payeeName,
          parseFloat(d.netAmount || "0"),
          parseFloat(d.vatAmount || "0"),
          parseFloat(d.cashAmount || "0"),
        ]),
      ];
      const vpSheet = XLSX.utils.aoa_to_sheet(vpData);
      XLSX.utils.book_append_sheet(workbook, vpSheet, "VAT Purchase Book");
      
      // Sheet 7: Financial Reports Summary
      const totalReceipts = receipts.reduce((sum, r) => sum + parseFloat(r.cashAmount || "0"), 0);
      const totalDisbursements = disbursements.reduce((sum, d) => sum + parseFloat(d.cashAmount || "0"), 0);
      const totalOutputVat = vatSales.reduce((sum, r) => sum + parseFloat(r.vatAmount || "0"), 0);
      const totalInputVat = vatPurchases.reduce((sum, d) => sum + parseFloat(d.vatAmount || "0"), 0);
      
      const frData = [
        ["Financial Reports Summary"],
        ["Company:", company?.name || ""],
        ["Year:", year.toString()],
        [],
        ["Category", "Amount"],
        ["Total Cash Receipts", totalReceipts],
        ["Total Cash Disbursements", totalDisbursements],
        ["Net Cash Flow", totalReceipts - totalDisbursements],
        [],
        ["VAT Summary", ""],
        ["Total Output VAT", totalOutputVat],
        ["Total Input VAT", totalInputVat],
        ["Net VAT Payable", totalOutputVat - totalInputVat],
      ];
      const frSheet = XLSX.utils.aoa_to_sheet(frData);
      XLSX.utils.book_append_sheet(workbook, frSheet, "Financial Reports");
      
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="LLAS-Workbook-${year}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("Excel export error:", error);
      res.status(500).json({ message: "Failed to export Excel" });
    }
  });

  // Subscription routes
  app.get("/api/subscriptions", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const subs = await storage.getSubscriptions(companyId);
      res.json(subs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscriptions" });
    }
  });

  app.get("/api/subscription/status", requireAuth, async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      res.json({
        status: company.subscriptionStatus,
        startDate: company.subscriptionStartDate,
        endDate: company.subscriptionEndDate,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subscription status" });
    }
  });

  // GCash payment - contact for quotation
  app.post("/api/subscriptions/gcash", requireAuth, async (req, res) => {
    try {
      res.json({ 
        message: "To subscribe via GCash, please contact us for a quotation. Email: support@llas.ph",
        contactEmail: "support@llas.ph"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // ============================================
  // EMPLOYEE ROUTES (Admin only)
  // ============================================

  app.get("/api/employees", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const employees = await storage.getEmployees(companyId);
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(parseInt(req.params.id));
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const parsed = insertEmployeeSchema.safeParse({ ...req.body, companyId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid employee data", errors: parsed.error.errors });
      }
      const employee = await storage.createEmployee(parsed.data);
      res.status(201).json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to create employee" });
    }
  });

  app.patch("/api/employees/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const employee = await storage.updateEmployee(parseInt(req.params.id), req.body);
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      await storage.deleteEmployee(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  app.post("/api/employees/bulk", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const { employees: employeeList } = req.body;
      if (!Array.isArray(employeeList)) {
        return res.status(400).json({ message: "employees must be an array" });
      }
      const employeesWithCompany = employeeList.map((e: any) => ({ ...e, companyId }));
      const created = await storage.bulkCreateEmployees(employeesWithCompany);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk create employees" });
    }
  });

  // ============================================
  // PAYROLL PERIOD ROUTES (Admin only)
  // ============================================

  app.get("/api/payroll-periods", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const periods = await storage.getPayrollPeriods(companyId);
      res.json(periods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll periods" });
    }
  });

  app.get("/api/payroll-periods/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const period = await storage.getPayrollPeriodById(parseInt(req.params.id));
      if (!period) {
        return res.status(404).json({ message: "Payroll period not found" });
      }
      res.json(period);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll period" });
    }
  });

  app.post("/api/payroll-periods", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const parsed = insertPayrollPeriodSchema.safeParse({ ...req.body, companyId });
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payroll period data", errors: parsed.error.errors });
      }
      const period = await storage.createPayrollPeriod(parsed.data);
      res.status(201).json(period);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payroll period" });
    }
  });

  app.patch("/api/payroll-periods/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const period = await storage.updatePayrollPeriod(parseInt(req.params.id), req.body);
      res.json(period);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payroll period" });
    }
  });

  app.delete("/api/payroll-periods/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      await storage.deletePayrollPeriod(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payroll period" });
    }
  });

  // ============================================
  // PAYROLL RECORDS ROUTES (Admin only)
  // ============================================

  app.get("/api/payroll-periods/:periodId/records", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const records = await storage.getPayrollRecords(parseInt(req.params.periodId));
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payroll records" });
    }
  });

  app.post("/api/payroll-records", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const parsed = insertPayrollRecordSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid payroll record data", errors: parsed.error.errors });
      }
      const record = await storage.createPayrollRecord(parsed.data);
      res.status(201).json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payroll record" });
    }
  });

  app.post("/api/payroll-records/bulk", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const { records } = req.body;
      if (!Array.isArray(records)) {
        return res.status(400).json({ message: "records must be an array" });
      }
      const created = await storage.bulkCreatePayrollRecords(records);
      res.status(201).json(created);
    } catch (error) {
      res.status(500).json({ message: "Failed to bulk create payroll records" });
    }
  });

  app.patch("/api/payroll-records/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      const record = await storage.updatePayrollRecord(parseInt(req.params.id), req.body);
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Failed to update payroll record" });
    }
  });

  app.delete("/api/payroll-records/:id", requireAuth, requirePermission("payroll"), async (req, res) => {
    try {
      await storage.deletePayrollRecord(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete payroll record" });
    }
  });

  // ============================================
  // BIR REPORT ROUTES
  // ============================================

  // Get list of all BIR reports with configuration
  app.get("/api/bir-reports", requireAuth, requirePermission("birReports"), async (req, res) => {
    try {
      res.json(BIR_REPORTS);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch BIR reports" });
    }
  });

  // Generate data for specific BIR form
  app.get("/api/bir-reports/:formCode/data", requireAuth, requirePermission("birReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }

      const { formCode } = req.params;
      const { year, quarter, month } = req.query;

      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      const yearNum = parseInt(year as string);
      let startDate: string;
      let endDate: string;

      // Calculate date range based on period type
      if (month) {
        const monthNum = parseInt(month as string);
        startDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        endDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;
      } else if (quarter) {
        const quarterNum = parseInt(quarter as string);
        const startMonth = (quarterNum - 1) * 3 + 1;
        const endMonth = quarterNum * 3;
        startDate = `${yearNum}-${startMonth.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, endMonth, 0).getDate();
        endDate = `${yearNum}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;
      } else {
        startDate = `${yearNum}-01-01`;
        endDate = `${yearNum}-12-31`;
      }

      const company = await storage.getCompany(companyId);
      let reportData: any = {
        formCode,
        period: { year: yearNum, quarter, month, startDate, endDate },
        company: {
          name: company?.name,
          tin: company?.tin || "",
          address: company?.address || "",
        },
        generatedAt: new Date().toISOString(),
      };

      // Fetch appropriate data based on form type
      switch (formCode) {
        case "1601-C":
        case "1601-E":
        case "1601-F":
          // Withholding tax forms - need payroll data
          const withholdingData = await storage.getWithholdingTaxSummary(companyId, startDate, endDate);
          const payrollSummary = await storage.getPayrollSummaryByPeriod(companyId, startDate, endDate);
          reportData.data = {
            ...withholdingData,
            payrollSummary,
          };
          break;

        case "2550-Q":
          // VAT Return (Quarterly)
          const vatData = await storage.getVatSummary(companyId, startDate, endDate);
          reportData.data = vatData;
          break;

        case "SLS":
          // Summary List of Sales (attachment to 2550-Q)
          const salesList = await storage.getSalesList(companyId, startDate, endDate);
          const slsSummary = await storage.getVatSummary(companyId, startDate, endDate);
          reportData.data = {
            transactions: salesList,
            summary: {
              totalSales: slsSummary.vatableSales + slsSummary.zeroRatedSales + slsSummary.exemptSales,
              vatableSales: slsSummary.vatableSales,
              zeroRatedSales: slsSummary.zeroRatedSales,
              exemptSales: slsSummary.exemptSales,
              totalOutputVat: slsSummary.outputVat,
              transactionCount: salesList.length,
            },
          };
          break;

        case "SLP":
          // Summary List of Purchases (attachment to 2550-Q)
          const purchasesList = await storage.getPurchasesList(companyId, startDate, endDate);
          const slpSummary = await storage.getVatSummary(companyId, startDate, endDate);
          reportData.data = {
            transactions: purchasesList,
            summary: {
              totalPurchases: purchasesList.reduce((sum, p) => sum + p.grossAmount, 0),
              vatablePurchases: purchasesList.filter(p => p.hasInputVat).reduce((sum, p) => sum + p.purchaseAmount, 0),
              totalInputVat: slpSummary.inputVat,
              transactionCount: purchasesList.length,
            },
          };
          break;

        case "2307-Summary":
          // Summary of Creditable Withholding Tax (Form 2307)
          const withholdingCredits = await storage.getWithholdingTaxCredits(companyId, startDate, endDate);
          reportData.data = {
            transactions: withholdingCredits,
            summary: {
              totalIncomePayments: withholdingCredits.reduce((sum, w) => sum + w.incomePayment, 0),
              totalTaxWithheld: withholdingCredits.reduce((sum, w) => sum + w.taxWithheld, 0),
              transactionCount: withholdingCredits.length,
              withholdingAgentCount: new Set(withholdingCredits.map(w => w.withholdingAgentTin)).size,
            },
          };
          break;

        case "2551-Q":
          // Percentage Tax - for non-VAT registered
          const percentageData = await storage.getIncomeSummary(companyId, startDate, endDate);
          reportData.data = {
            ...percentageData,
            percentageTaxRate: 0.03, // 3% percentage tax
            percentageTaxDue: percentageData.grossIncome * 0.03,
          };
          break;

        case "1702-Q":
        case "1702-RT":
          // Quarterly/Annual Income Tax Return
          const incomeData = await storage.getIncomeSummary(companyId, startDate, endDate);
          reportData.data = incomeData;
          break;

        case "1602-Q":
        case "1603-Q":
          // Quarterly Withholding Returns
          const qWithholding = await storage.getWithholdingTaxSummary(companyId, startDate, endDate);
          reportData.data = qWithholding;
          break;

        case "1604-C":
        case "1604-F":
          // Annual Alphalist
          const alphalist = await storage.getEmployeeAlphalist(companyId, yearNum);
          reportData.data = {
            alphalist,
            totalEmployees: alphalist.length,
            totalCompensation: alphalist.reduce((sum, e) => sum + e.totalCompensation, 0),
            totalWithholdingTax: alphalist.reduce((sum, e) => sum + e.totalWithholdingTax, 0),
          };
          break;

        case "1709":
          // Information Return
          const supplierData = await storage.getSupplierPaymentsSummary(companyId, startDate, endDate);
          reportData.data = supplierData;
          break;

        case "BOA":
          // Books of Accounts - summary of all transactions
          const booksVat = await storage.getVatSummary(companyId, startDate, endDate);
          const booksIncome = await storage.getIncomeSummary(companyId, startDate, endDate);
          const booksPayroll = await storage.getPayrollSummaryByPeriod(companyId, startDate, endDate);
          reportData.data = {
            vat: booksVat,
            income: booksIncome,
            payroll: booksPayroll,
          };
          break;

        default:
          return res.status(400).json({ message: `Unknown form code: ${formCode}` });
      }

      res.json(reportData);
    } catch (error) {
      console.error("BIR report generation error:", error);
      res.status(500).json({ message: "Failed to generate BIR report data" });
    }
  });

  // Export BIR data to Excel
  app.get("/api/bir-reports/:formCode/export", requireAuth, requirePermission("birReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }

      const { formCode } = req.params;
      const { year, quarter, month } = req.query;

      if (!year) {
        return res.status(400).json({ message: "Year is required" });
      }

      const yearNum = parseInt(year as string);
      let startDate: string;
      let endDate: string;
      let periodLabel: string;

      if (month) {
        const monthNum = parseInt(month as string);
        startDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, monthNum, 0).getDate();
        endDate = `${yearNum}-${monthNum.toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = `${yearNum}-${monthNum.toString().padStart(2, '0')}`;
      } else if (quarter) {
        const quarterNum = parseInt(quarter as string);
        const startMonth = (quarterNum - 1) * 3 + 1;
        const endMonth = quarterNum * 3;
        startDate = `${yearNum}-${startMonth.toString().padStart(2, '0')}-01`;
        const lastDay = new Date(yearNum, endMonth, 0).getDate();
        endDate = `${yearNum}-${endMonth.toString().padStart(2, '0')}-${lastDay}`;
        periodLabel = `${yearNum}-Q${quarterNum}`;
      } else {
        startDate = `${yearNum}-01-01`;
        endDate = `${yearNum}-12-31`;
        periodLabel = `${yearNum}`;
      }

      const company = await storage.getCompany(companyId);
      const workbook = XLSX.utils.book_new();

      // Add form-specific data
      if (formCode === "1604-C" || formCode === "1604-F") {
        const alphalist = await storage.getEmployeeAlphalist(companyId, yearNum);
        const sheetData = [
          [`BIR Form ${formCode} - Alphalist of Employees`],
          [`Company: ${company?.name || ""}`],
          [`TIN: ${company?.tin || ""}`],
          [`Year: ${yearNum}`],
          [],
          ["Employee Code", "TIN", "Last Name", "First Name", "Middle Name", "Total Compensation", "Withholding Tax", "SSS", "PhilHealth", "HDMF", "Net Pay"],
          ...alphalist.map((e: any) => [
            e.employeeCode,
            e.tin,
            e.lastName,
            e.firstName,
            e.middleName,
            e.totalCompensation,
            e.totalWithholdingTax,
            e.totalSss,
            e.totalPhilhealth,
            e.totalHdmf,
            e.netPay,
          ]),
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Alphalist");
      } else if (formCode === "2550-Q") {
        const vatData = await storage.getVatSummary(companyId, startDate, endDate);
        const sheetData = [
          [`BIR Form 2550-Q - Quarterly VAT Return`],
          [`Company: ${company?.name || ""}`],
          [`Period: ${periodLabel}`],
          [],
          ["Category", "Amount"],
          ["Vatable Sales", vatData.vatableSales],
          ["Zero-Rated Sales", vatData.zeroRatedSales],
          ["Exempt Sales", vatData.exemptSales],
          ["Output VAT", vatData.outputVat],
          ["Input VAT", vatData.inputVat],
          ["VAT Payable", vatData.vatPayable],
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "VAT Summary");
      } else if (formCode === "SLS") {
        const salesList = await storage.getSalesList(companyId, startDate, endDate);
        const sheetData = [
          [`Summary List of Sales (SLS)`],
          [`Company: ${company?.name || ""}`],
          [`TIN: ${company?.tin || ""}`],
          [`Period: ${periodLabel}`],
          [],
          ["Date", "CRN", "Customer TIN", "Customer Name", "Address", "Sales Amount", "VAT Amount", "Gross Amount"],
          ...salesList.map((s: any) => [
            s.date,
            s.crn,
            s.customerTin,
            s.customerName,
            s.customerAddress,
            s.salesAmount,
            s.vatAmount,
            s.grossAmount,
          ]),
          [],
          ["TOTAL", "", "", "", "", 
            salesList.reduce((sum: number, s: any) => sum + s.salesAmount, 0),
            salesList.reduce((sum: number, s: any) => sum + s.vatAmount, 0),
            salesList.reduce((sum: number, s: any) => sum + s.grossAmount, 0),
          ],
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Summary List of Sales");
      } else if (formCode === "SLP") {
        const purchasesList = await storage.getPurchasesList(companyId, startDate, endDate);
        const sheetData = [
          [`Summary List of Purchases (SLP)`],
          [`Company: ${company?.name || ""}`],
          [`TIN: ${company?.tin || ""}`],
          [`Period: ${periodLabel}`],
          [],
          ["Date", "CVN", "Supplier TIN", "Supplier Name", "Address", "Purchase Amount", "VAT Amount", "Gross Amount"],
          ...purchasesList.map((p: any) => [
            p.date,
            p.cvn,
            p.supplierTin,
            p.supplierName,
            p.supplierAddress,
            p.purchaseAmount,
            p.vatAmount,
            p.grossAmount,
          ]),
          [],
          ["TOTAL", "", "", "", "",
            purchasesList.reduce((sum: number, p: any) => sum + p.purchaseAmount, 0),
            purchasesList.reduce((sum: number, p: any) => sum + p.vatAmount, 0),
            purchasesList.reduce((sum: number, p: any) => sum + p.grossAmount, 0),
          ],
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Summary List of Purchases");
      } else if (formCode === "2307-Summary") {
        const withholdingCredits = await storage.getWithholdingTaxCredits(companyId, startDate, endDate);
        const sheetData = [
          [`Summary of Creditable Withholding Tax (Form 2307)`],
          [`Company: ${company?.name || ""}`],
          [`TIN: ${company?.tin || ""}`],
          [`Period: ${periodLabel}`],
          [],
          ["Date", "CRN", "Withholding Agent TIN", "Withholding Agent Name", "Address", "Income Payment", "Tax Withheld", "ATC Code"],
          ...withholdingCredits.map((w: any) => [
            w.date,
            w.crn,
            w.withholdingAgentTin,
            w.withholdingAgentName,
            w.withholdingAgentAddress,
            w.incomePayment,
            w.taxWithheld,
            w.atcCode,
          ]),
          [],
          ["TOTAL", "", "", "", "",
            withholdingCredits.reduce((sum: number, w: any) => sum + w.incomePayment, 0),
            withholdingCredits.reduce((sum: number, w: any) => sum + w.taxWithheld, 0),
            "",
          ],
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Form 2307 Summary");
      } else {
        // Generic summary for other forms
        const incomeData = await storage.getIncomeSummary(companyId, startDate, endDate);
        const withholdingData = await storage.getWithholdingTaxSummary(companyId, startDate, endDate);
        const sheetData = [
          [`BIR Form ${formCode}`],
          [`Company: ${company?.name || ""}`],
          [`Period: ${periodLabel}`],
          [],
          ["Income Summary", ""],
          ["Gross Income", incomeData.grossIncome],
          ["Deductions", incomeData.deductions],
          ["Taxable Income", incomeData.taxableIncome],
          ["Income Tax Due", incomeData.incomeTaxDue],
          [],
          ["Withholding Summary", ""],
          ["Compensation Withholding Tax", withholdingData.compensationWithholdingTax],
          ["Total Withholding Tax", withholdingData.totalWithholdingTax],
        ];
        const sheet = XLSX.utils.aoa_to_sheet(sheetData);
        XLSX.utils.book_append_sheet(workbook, sheet, "Summary");
      }

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="BIR-${formCode}-${periodLabel}.xlsx"`);
      res.send(buffer);
    } catch (error) {
      console.error("BIR export error:", error);
      res.status(500).json({ message: "Failed to export BIR report" });
    }
  });

  // Tax Settings routes
  app.get("/api/tax-settings/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year);
      const settings = await storage.getTaxSettings(companyId, year);
      res.json(settings || { taxYear: year, taxRate: "25", mcitRate: "2" });
    } catch (error) {
      console.error("Get tax settings error:", error);
      res.status(500).json({ message: "Failed to fetch tax settings" });
    }
  });

  app.post("/api/tax-settings", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const data = insertTaxSettingsSchema.parse({ ...req.body, companyId });
      const settings = await storage.upsertTaxSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Save tax settings error:", error);
      res.status(500).json({ message: "Failed to save tax settings" });
    }
  });

  // MCIT Credits routes
  app.get("/api/mcit-credits", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const credits = await storage.getMcitCredits(companyId);
      res.json(credits);
    } catch (error) {
      console.error("Get MCIT credits error:", error);
      res.status(500).json({ message: "Failed to fetch MCIT credits" });
    }
  });

  app.get("/api/mcit-credits/available/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year);
      const credits = await storage.getAvailableMcitCredits(companyId, year);
      res.json(credits);
    } catch (error) {
      console.error("Get available MCIT credits error:", error);
      res.status(500).json({ message: "Failed to fetch available MCIT credits" });
    }
  });

  app.post("/api/mcit-credits", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const taxYear = parseInt(req.body.taxYear);
      const excessAmount = req.body.excessAmount;
      const data = insertMcitCreditSchema.parse({
        companyId,
        taxYear,
        excessAmount,
        remainingAmount: excessAmount,
        usedAmount: "0",
        expiryYear: taxYear + 3,
      });
      const credit = await storage.createMcitCredit(data);
      res.status(201).json(credit);
    } catch (error) {
      console.error("Create MCIT credit error:", error);
      res.status(500).json({ message: "Failed to create MCIT credit" });
    }
  });

  app.patch("/api/mcit-credits/:id", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const credit = await storage.updateMcitCredit(id, req.body);
      res.json(credit);
    } catch (error) {
      console.error("Update MCIT credit error:", error);
      res.status(500).json({ message: "Failed to update MCIT credit" });
    }
  });

  app.delete("/api/mcit-credits/:id", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteMcitCredit(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete MCIT credit error:", error);
      res.status(500).json({ message: "Failed to delete MCIT credit" });
    }
  });

  // NOLCO routes
  app.get("/api/nolco", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const entries = await storage.getNolcoEntries(companyId);
      res.json(entries);
    } catch (error) {
      console.error("Get NOLCO entries error:", error);
      res.status(500).json({ message: "Failed to fetch NOLCO entries" });
    }
  });

  app.get("/api/nolco/available/:year", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const year = parseInt(req.params.year);
      const entries = await storage.getAvailableNolco(companyId, year);
      res.json(entries);
    } catch (error) {
      console.error("Get available NOLCO error:", error);
      res.status(500).json({ message: "Failed to fetch available NOLCO" });
    }
  });

  app.post("/api/nolco", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const lossYear = parseInt(req.body.lossYear);
      const originalAmount = req.body.originalAmount;
      const expiryYears = (lossYear === 2020 || lossYear === 2021) ? 5 : 3;
      const data = insertNolcoEntrySchema.parse({
        companyId,
        lossYear,
        originalAmount,
        remainingAmount: originalAmount,
        usedAmount: "0",
        expiryYear: lossYear + expiryYears,
      });
      const entry = await storage.createNolcoEntry(data);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Create NOLCO entry error:", error);
      res.status(500).json({ message: "Failed to create NOLCO entry" });
    }
  });

  app.patch("/api/nolco/:id", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entry = await storage.updateNolcoEntry(id, req.body);
      res.json(entry);
    } catch (error) {
      console.error("Update NOLCO entry error:", error);
      res.status(500).json({ message: "Failed to update NOLCO entry" });
    }
  });

  app.delete("/api/nolco/:id", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNolcoEntry(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete NOLCO entry error:", error);
      res.status(500).json({ message: "Failed to delete NOLCO entry" });
    }
  });

  // Final Withholding Income routes
  app.get("/api/final-withholding-income", requireAuth, requirePermission("financialReports"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const taxYear = req.query.taxYear ? parseInt(req.query.taxYear as string) : undefined;
      const incomes = await storage.getFinalWithholdingIncomes(companyId, taxYear);
      res.json(incomes);
    } catch (error) {
      console.error("Get final withholding incomes error:", error);
      res.status(500).json({ message: "Failed to fetch final withholding incomes" });
    }
  });

  app.post("/api/final-withholding-income", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const companyId = await getCompanyId(req);
      if (!companyId) {
        return res.status(404).json({ message: "Company not found" });
      }
      const parseResult = insertFinalWithholdingIncomeSchema.safeParse({
        ...req.body,
        companyId,
      });
      if (!parseResult.success) {
        return res.status(400).json({ message: "Invalid data", errors: parseResult.error.errors });
      }
      const income = await storage.createFinalWithholdingIncome(parseResult.data);
      res.status(201).json(income);
    } catch (error) {
      console.error("Create final withholding income error:", error);
      res.status(500).json({ message: "Failed to create final withholding income" });
    }
  });

  app.delete("/api/final-withholding-income/:id", requireAuth, requirePermission("settings"), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteFinalWithholdingIncome(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete final withholding income error:", error);
      res.status(500).json({ message: "Failed to delete final withholding income" });
    }
  });
}
