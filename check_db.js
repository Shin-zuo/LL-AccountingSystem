import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function checkUsers() {
  try {
    console.log("Checking users in database...");

    const allUsers = await db.select().from(users);
    console.log(`Found ${allUsers.length} users:`);

    for (const user of allUsers) {
      console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}, Company: ${user.companyId}`);
    }

    // Always create a test user with known credentials
    console.log("Creating a test user with known credentials...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Check if test user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, "admin@example.com")).limit(1);

    if (existingUser.length > 0) {
      console.log("Test user already exists:", existingUser[0]);
    } else {
      const newUser = await db.insert(users).values({
        email: "admin@example.com",
        password: hashedPassword,
        firstName: "Admin",
        lastName: "User",
        role: "general_manager",
        companyId: null, // Will be set during onboarding
      }).returning();

      console.log("Created test user:", newUser[0]);
    }

    console.log("Login credentials: admin@example.com / password123");

  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    process.exit(0);
  }
}

checkUsers();
