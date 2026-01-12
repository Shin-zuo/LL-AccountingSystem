import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function testLogin() {
  try {
    console.log("Testing login with admin@example.com / password123");

    // Check if user exists
    const user = await db.select().from(users).where(eq(users.email, "admin@example.com")).limit(1);
    if (user.length === 0) {
      console.log("User not found");
      return;
    }

    console.log("User found:", {
      id: user[0].id,
      email: user[0].email,
      firstName: user[0].firstName,
      lastName: user[0].lastName,
      role: user[0].role
    });

    // Test password
    const isValidPassword = await bcrypt.compare("password123", user[0].password);
    console.log("Password valid:", isValidPassword);

  } catch (error) {
    console.error("Error testing login:", error);
  } finally {
    process.exit(0);
  }
}

testLogin();
