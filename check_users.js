import { db } from "./server/db.js";
import { users } from "./shared/schema.js";

async function checkUsers() {
  try {
    console.log("Checking users in database...");
    const result = await db.select().from(users);
    console.log("Users in database:", result);
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
