import { db } from "./server/db.js";
import { chartOfAccounts } from "./shared/schema.js";
import { eq } from "drizzle-orm";

async function checkIncomeExpense() {
  try {
    const incomeAccounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.accountType, 'income'));
    const expenseAccounts = await db.select().from(chartOfAccounts).where(eq(chartOfAccounts.accountType, 'expense'));
    console.log("Income Accounts:", incomeAccounts);
    console.log("Expense Accounts:", expenseAccounts);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkIncomeExpense();
