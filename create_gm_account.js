import { db } from "./server/db.js";
import { users } from "./shared/schema.js";
import bcrypt from "bcrypt";

// Define all user roles
const USER_ROLES = {
  ACCOUNTANT: "accountant",
  TAX_COMPLIANCE_OFFICER: "tax_compliance_officer",
  PAYROLL_OFFICER: "payroll_officer",
  COMPTROLLER: "comptroller",
  GENERAL_MANAGER: "general_manager",
};

async function createTestAccountsForAllRoles() {
  try {
    console.log("Creating test accounts for all user roles...");

    // Hash the password once for all accounts
    const hashedPassword = await bcrypt.hash("test123456", 10);

    const accounts = [
      {
        email: "accountant@testcompany.com",
        firstName: "Alice",
        lastName: "Johnson",
        role: USER_ROLES.ACCOUNTANT,
      },
      {
        email: "tax_officer@testcompany.com",
        firstName: "Bob",
        lastName: "Smith",
        role: USER_ROLES.TAX_COMPLIANCE_OFFICER,
      },
      {
        email: "payroll_officer@testcompany.com",
        firstName: "Carol",
        lastName: "Williams",
        role: USER_ROLES.PAYROLL_OFFICER,
      },
      {
        email: "comptroller@testcompany.com",
        firstName: "David",
        lastName: "Brown",
        role: USER_ROLES.COMPTROLLER,
      },
      {
        email: "general_manager@testcompany.com",
        firstName: "Eve",
        lastName: "Davis",
        role: USER_ROLES.GENERAL_MANAGER,
      },
    ];

    for (const account of accounts) {
      try {
        const newUser = await db.insert(users).values({
          email: account.email,
          password: hashedPassword,
          firstName: account.firstName,
          lastName: account.lastName,
          role: account.role,
          companyId: 1, // Assuming company ID 1 exists
        }).returning();

        console.log(`✅ ${account.role} account created successfully!`);
        console.log(`📧 Email: ${account.email}`);
        console.log(`👤 Role: ${account.role}`);
        console.log("---");

      } catch (error) {
        console.error(`❌ Error creating ${account.role} account:`, error.message);
      }
    }

    console.log("\n🎉 All test accounts created!");
    console.log("🔑 Password for all accounts: test123456");
    console.log("🏢 Company ID: 1");

  } catch (error) {
    console.error("❌ Error creating test accounts:", error);
  } finally {
    process.exit(0);
  }
}

createTestAccountsForAllRoles();
