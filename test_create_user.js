import { storage } from "./server/storage.js";
import bcrypt from "bcrypt";

async function testCreateUser() {
  try {
    console.log("Testing createUser method...");

    // Generate a unique ID for testing
    const testUserId = `test-user-${Date.now()}`;

    // Hash a test password
    const hashedPassword = await bcrypt.hash("testpassword", 10);

    // Create test user data
    const testUserData = {
      id: testUserId,
      email: "test@example.com",
      password: hashedPassword,
      firstName: "Test",
      lastName: "User",
      role: "accountant",
      companyId: 1, // Assuming company ID 1 exists
    };

    console.log("Creating user with data:", testUserData);

    // Call createUser method
    const createdUser = await storage.createUser(testUserData);

    console.log("User created successfully:", createdUser);

    // Verify the returned user has the expected properties
    if (createdUser.id === testUserId &&
        createdUser.email === "test@example.com" &&
        createdUser.firstName === "Test" &&
        createdUser.lastName === "User" &&
        createdUser.role === "accountant") {
      console.log("✓ createUser method works correctly");
    } else {
      console.log("✗ createUser method returned unexpected data");
    }

  } catch (error) {
    console.error("Error testing createUser:", error);
  } finally {
    process.exit(0);
  }
}

testCreateUser();
