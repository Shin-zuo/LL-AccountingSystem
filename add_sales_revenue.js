import { db } from "./server/db.js";
import { chartOfAccounts } from "./shared/schema.js";

async function addSalesRevenue() {
  try {
    const [newAccount] = await db.insert(chartOfAccounts).values({
      companyId: 1,
      code: '4000',
      name: 'Sales Revenue',
      accountType: 'income',
      category: 'profit_loss',
      isActive: true,
    }).returning();

    console.log("Created Sales Revenue account:", newAccount);
  } catch (error) {
    console.error("Error creating sales revenue account:", error);
  } finally {
    process.exit(0);
  }
}

addSalesRevenue();
