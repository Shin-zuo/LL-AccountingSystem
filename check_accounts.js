import { db } from "./server/db.js";
import { chartOfAccounts } from "./shared/schema.js";

async function checkAccounts() {
  try {
    const accounts = await db.select().from(chartOfAccounts).limit(10);
    console.log("Chart of Accounts:", accounts);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkAccounts();
