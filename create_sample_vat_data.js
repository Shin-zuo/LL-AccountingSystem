import { db } from "./server/db.js";
import { cashReceipts, cashDisbursements, cashReceiptLines, cashDisbursementLines } from "./shared/schema.js";

async function createSampleVATData() {
  try {
    console.log("Creating sample VAT data...");

    // Get the first company (assuming there's at least one)
    const { companies } = await import("./shared/schema.js");
    const companyList = await db.select().from(companies).limit(1);
    if (companyList.length === 0) {
      console.log("No companies found. Please create a company first.");
      return;
    }

    const companyId = companyList[0].id;
    console.log(`Using company ID: ${companyId}`);

    // Create sample vatable cash receipts (Sales)
    const sampleReceipts = [
      {
        companyId,
        crn: "CR-2024-001",
        voucherDate: "2024-01-15",
        invoiceNumber: "INV-001",
        invoiceDate: "2024-01-15",
        payorName: "ABC Corporation",
        particulars: "Sale of goods",
        cashAmount: "11200.00", // Gross amount
        isVatable: true,
        vatAmount: "1200.00", // 12% VAT
        netAmount: "10000.00", // Net sales
        status: "approved",
        preparedById: null,
        approvedById: null,
      },
      {
        companyId,
        crn: "CR-2024-002",
        voucherDate: "2024-02-20",
        invoiceNumber: "INV-002",
        invoiceDate: "2024-02-20",
        payorName: "XYZ Company",
        particulars: "Service revenue",
        cashAmount: "5640.00",
        isVatable: true,
        vatAmount: "640.00",
        netAmount: "5000.00",
        status: "approved",
        preparedById: null,
        approvedById: null,
      },
    ];

    // Create sample vatable cash disbursements (Purchases)
    const sampleDisbursements = [
      {
        companyId,
        cdn: "CD-2024-001",
        voucherDate: "2024-01-10",
        supplierInvoiceNumber: "SUP-INV-001",
        supplierInvoiceDate: "2024-01-10",
        payeeName: "Office Supplies Inc.",
        particulars: "Purchase of office supplies",
        cashAmount: "5640.00", // Gross amount
        hasInputVat: true,
        vatAmount: "640.00", // 12% VAT
        netAmount: "5000.00", // Net purchase
        status: "approved",
        preparedById: null,
        approvedById: null,
      },
      {
        companyId,
        cdn: "CD-2024-002",
        voucherDate: "2024-03-05",
        supplierInvoiceNumber: "SUP-INV-002",
        supplierInvoiceDate: "2024-03-05",
        payeeName: "Tech Solutions Ltd.",
        particulars: "IT equipment purchase",
        cashAmount: "14100.00",
        hasInputVat: true,
        vatAmount: "1600.00",
        netAmount: "12500.00",
        status: "approved",
        preparedById: null,
        approvedById: null,
      },
    ];

    // Insert receipts
    for (const receipt of sampleReceipts) {
      const [inserted] = await db.insert(cashReceipts).values(receipt).returning();
      console.log(`Created receipt: ${inserted.crn}`);

      // Add a line item for each receipt (crediting sales revenue)
      await db.insert(cashReceiptLines).values({
        cashReceiptId: inserted.id,
        accountId: 178, // Sales Revenue account
        amount: receipt.netAmount,
        description: receipt.particulars,
      });
    }

    // Insert disbursements
    for (const disbursement of sampleDisbursements) {
      const [inserted] = await db.insert(cashDisbursements).values(disbursement).returning();
      console.log(`Created disbursement: ${inserted.cdn}`);

      // Add a line item for each disbursement (debiting expense account)
      await db.insert(cashDisbursementLines).values({
        cashDisbursementId: inserted.id,
        accountId: 101, // Office Supplies Expense account
        amount: disbursement.netAmount,
        description: disbursement.particulars,
      });
    }

    console.log("Sample VAT data created successfully!");
    console.log("You can now check the VAT Books page to see the data.");

  } catch (error) {
    console.error("Error creating sample VAT data:", error);
  } finally {
    process.exit(0);
  }
}

createSampleVATData();
