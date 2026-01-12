import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function fixPassword() {
  try {
    console.log("Fixing password for user: test.general_manager+withcompany+1767842463634@example.com");

    const hashedPassword = await bcrypt.hash("TestPass!89557", 10);

    const result = await db.update(users)
      .set({ password: hashedPassword })
      .where(eq(users.email, "test.general_manager+withcompany+1767842463634@example.com"))
      .returning();

    if (result.length > 0) {
      console.log("Password updated successfully!");
      console.log("New hash:", hashedPassword);
    } else {
      console.log("User not found");
    }

  } catch (error) {
    console.error("Error fixing password:", error);
  } finally {
    process.exit(0);
  }
}

fixPassword();
