
import { db } from "../db";
import * as schema from "../db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { hash } from "bcryptjs";

// Fixed IDs for reference
const COMPANY_ID = "00000000-0000-0000-0000-000000000000";
const USER_ADMIN_ID = "10000000-0000-0000-0000-000000000001";
const WAREHOUSE_MAIN_ID = uuidv4();
const CUSTOMER_1_ID = uuidv4();
const SUPPLIER_1_ID = uuidv4();
const CURRENCY_AED_ID = uuidv4();
const ITEM_1_ID = uuidv4(); // Physical Product
const ITEM_2_ID = uuidv4(); // Service

async function main() {
  console.log("🌱 Starting Database Seeding...");
  console.log("⚠️  WARNING: This will clear existing test data!");

  try {
    // 1. Clear existing data (in reverse order of dependencies)
    console.log("Cleaning old data...");
    
    // Helper to safely delete
    const safeDelete = async (table: any, name: string) => {
        try {
            if (!table) {
                console.log(`Skipping ${name} (table undefined in schema)`);
                return;
            }
            console.log(`Deleting from ${name}...`);
            await db.delete(table);
        } catch (e) {
            console.error(`Error deleting from ${name}:`, e);
            throw e; // Fail fast to debug
        }
    };

    // Sales
    await safeDelete(schema.salesLines, "salesLines");
    await safeDelete(schema.salesInvoices, "salesInvoices");
    await safeDelete(schema.salesOrders, "salesOrders");
    await safeDelete(schema.salesQuotations, "salesQuotations");
    
    // Purchase
    await safeDelete(schema.purchaseLines, "purchaseLines");
    await safeDelete(schema.purchaseInvoices, "purchaseInvoices");
    await safeDelete(schema.goodsReceipts, "goodsReceipts");
    await safeDelete(schema.purchaseOrders, "purchaseOrders");
    
    // Inventory
    await safeDelete(schema.stockTransactions, "stockTransactions");
    await safeDelete(schema.stockLedger, "stockLedger");
    await safeDelete(schema.items, "items");
    console.log("Deleted items");

    // CRM
    await safeDelete(schema.customers, "customers");
    console.log("Deleted customers");
    await safeDelete(schema.suppliers, "suppliers");
    console.log("Deleted suppliers");
    
    // Projects & HR
    await safeDelete(schema.projectTasks, "projectTasks");
    console.log("Deleted projectTasks");
    await safeDelete(schema.workOrders, "workOrders");
    console.log("Deleted workOrders");
    await safeDelete(schema.projects, "projects");
    console.log("Deleted projects");
    await safeDelete(schema.attendance, "attendance");
    await safeDelete(schema.employees, "employees");
    
    // Settings
    await safeDelete(schema.warehouses, "warehouses");
    await safeDelete(schema.chartOfAccounts, "chartOfAccounts");
    await safeDelete(schema.bankAccounts, "bankAccounts");
    await safeDelete(schema.taxes, "taxes");
    await safeDelete(schema.paymentTerms, "paymentTerms");
    await safeDelete(schema.currencies, "currencies");
    
    // Clear Relations
    await safeDelete(schema.userRoles, "userRoles");

    // Clear Core
    await safeDelete(schema.roles, "roles");
    await safeDelete(schema.users, "users");
    // Don't delete company if possible, or delete last
    await safeDelete(schema.companies, "companies");

    console.log("✅ Data cleared");

    // 2. Create Company
    console.log("Creating Company...");
    await db.insert(schema.companies).values({
      id: COMPANY_ID,
      code: "CMP-001",
      legalName: "Radon Systems FZE",
      tradeName: "Radon Systems",
      email: "admin@radon.ae",
      phone: "+971500000000",
      address: "Dubai Silicon Oasis",
      currency: "AED",
      fiscalYearStart: new Date("2025-01-01"),
      active: true,
      createdAt: new Date(),
    });

    // 3. Create Roles
    console.log("Creating Roles...");
    const roleAdminId = uuidv4();
    const roleSalesId = uuidv4();
    
    await db.insert(schema.roles).values([
      {
        id: roleAdminId,
        companyId: COMPANY_ID,
        code: "ROLE-ADMIN",
        name: "Administrator",
        description: "Full system access",
        permissions: ["*"],
        isActive: true,
        isSystemRole: true
      },
      {
        id: roleSalesId,
        companyId: COMPANY_ID,
        code: "ROLE-SALES",
        name: "Sales Manager",
        description: "Access to sales module",
        permissions: ["sales.view", "sales.create", "sales.edit", "sales.approve"],
        isActive: true,
        isSystemRole: false
      }
    ]);

    // 4. Create Users
    console.log("Creating Users...");
    const hashedPassword = await hash("password123", 10);
    
    await db.insert(schema.users).values([
      {
        id: USER_ADMIN_ID,
        email: "admin@pryzo.com",
        name: "System Admin",
        companyId: COMPANY_ID,
        role: "admin",
        isActive: true,
        createdAt: new Date(),
      },
      {
        id: uuidv4(),
        email: "sales@pryzo.com",
        name: "Sales User",
        companyId: COMPANY_ID,
        role: "user",
        isActive: true,
        createdAt: new Date(),
      }
    ]);

    // Assign Role
    await db.insert(schema.userRoles).values({
      userId: USER_ADMIN_ID,
      roleId: roleAdminId,
      assignedAt: new Date(),
      assignedBy: USER_ADMIN_ID
    });

    // 4a. Create Currencies
    console.log("Creating Currencies...");
    await db.insert(schema.currencies).values({
      id: CURRENCY_AED_ID,
      companyId: COMPANY_ID,
      code: "AED",
      name: "United Arab Emirates Dirham",
      symbol: "AED",
      isBaseCurrency: true,
      isActive: true
    });

    // 5. Create Warehouses
    console.log("Creating Warehouses...");
    await db.insert(schema.warehouses).values([
      {
        id: WAREHOUSE_MAIN_ID,
        companyId: COMPANY_ID,
        name: "Main Warehouse - DXB",
        code: "WH-DXB-001",
        location: "Dubai Investment Park",
        type: "physical",
        active: true
      },
      {
        id: uuidv4(),
        companyId: COMPANY_ID,
        name: "Showroom Store",
        code: "WH-SHR-001",
        location: "Sheikh Zayed Road",
        type: "retail",
        active: true
      }
    ]);

    // 6. Create Customers & Suppliers
    console.log("Creating Masters...");
    await db.insert(schema.customers).values([
      {
        id: CUSTOMER_1_ID,
        companyId: COMPANY_ID,
        code: "CUS-001",
        name: "Al Futtaim Group",
        customerType: "corporate",
        email: "accounts@alfuttaim.ae",
        phone: "+97142223333",
        trn: "100200300400500",
        address: "Festival City, Dubai",
        creditLimit: "500000",
        isActive: true
      },
      {
        id: uuidv4(),
        companyId: COMPANY_ID,
        code: "CUS-002",
        name: "Emaar Properties",
        customerType: "corporate",
        email: "procurement@emaar.ae",
        phone: "+97143334444",
        trn: "100900800700600",
        address: "Downtown Dubai",
        creditLimit: "1000000",
        isActive: true
      }
    ]);

    await db.insert(schema.suppliers).values([
      {
        id: SUPPLIER_1_ID,
        companyId: COMPANY_ID,
        code: "SUP-001",
        name: "Microsoft Regional Sales",
        supplierType: "international",
        email: "sales@microsoft.com",
        phone: "+35312345678",
        trn: "900800700600500",
        address: "Dublin, Ireland",
        isActive: true
      }
    ]);

    // 7. Create Items
    console.log("Creating Items...");
    await db.insert(schema.items).values([
      {
        id: ITEM_1_ID,
        companyId: COMPANY_ID,
        code: "LAP-DELL-XPS",
        name: "Dell XPS 15 Laptop",
        itemType: "stock",
        sku: "XPS-9530",
        barcode: "840012345678",
        uom: "PCS",
        costPrice: "4500.00",
        sellingPrice: "5999.00",
        taxPercent: "5",
        isActive: true
      },
      {
        id: ITEM_2_ID,
        companyId: COMPANY_ID,
        code: "SVC-INSTALL",
        name: "Software Installation Service",
        itemType: "service",
        sku: "SVC-001",
        uom: "HRS",
        costPrice: "0.00",
        sellingPrice: "250.00",
        taxPercent: "5",
        isActive: true
      }
    ]);

    // 8. Create Transactions
    console.log("Creating Transactions...");

    // Sales Invoice
    await db.insert(schema.salesInvoices).values({
      id: uuidv4(),
      companyId: COMPANY_ID,
      invoiceNumber: "INV-2025-001", // Fixed field name
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
      customerId: CUSTOMER_1_ID,
      status: "sent",
       subtotal: "11998.00",
       taxAmount: "599.90",
       totalAmount: "12597.90",
       currencyId: CURRENCY_AED_ID,
       exchangeRate: "1",
      notes: "Annual hardware refresh",
      
      isPosted: true,
      balanceAmount: "12597.90",
      createdAt: new Date()
    });

    // Sales Order
    await db.insert(schema.salesOrders).values({
      id: uuidv4(),
      companyId: COMPANY_ID,
      orderNumber: "SO-2025-042", // Fixed field name
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
      customerId: CUSTOMER_1_ID,
      status: "issued",
      subtotal: "5000.00",
      taxAmount: "250.00",
      totalAmount: "5250.00",
      currencyId: CURRENCY_AED_ID,
      exchangeRate: "1",
      createdAt: new Date()
    });

    // Purchase Order
    await db.insert(schema.purchaseOrders).values({
      id: uuidv4(),
      companyId: COMPANY_ID,
      orderNumber: "PO-2025-089", // Fixed field name
      orderDate: new Date().toISOString().split('T')[0],
      supplierId: SUPPLIER_1_ID,
      status: "draft",
      subtotal: "2000.00",
      taxAmount: "100.00",
      totalAmount: "2100.00",
      currencyId: CURRENCY_AED_ID, // Ideally USD but using AED for simplicity or create USD key
      exchangeRate: "3.6725",
      createdAt: new Date()
    });

    // 9. HR & Projects
    console.log("Creating HR & Projects...");
    const employeeId = uuidv4();
    await db.insert(schema.employees).values({
      id: employeeId,
      companyId: COMPANY_ID,
      code: "EMP-001",
      firstName: "John",
      lastName: "Doe",
      email: "john@pryzo.com",
      phone: "+971555555555",
      department: "IT",
      designation: "Senior Developer", // position -> designation
      joiningDate: "2024-01-01",
      status: "active",
      basicSalary: "15000",
      createdAt: new Date()
    });

    const projectId = uuidv4();
    await db.insert(schema.projects).values({
      id: projectId,
      companyId: COMPANY_ID,
      projectName: "ERP Implementation - Phase 1", // Fixed field name
      projectCode: "PRJ-001", // Fixed field name
      status: "active",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 90)).toISOString().split('T')[0],
      budgetAmount: "50000", // Fixed field name
      projectManagerId: employeeId,
      customerId: CUSTOMER_1_ID,
      createdAt: new Date()
    });

    await db.insert(schema.projectTasks).values({
      id: uuidv4(),
      companyId: COMPANY_ID,
      projectId: projectId,
      taskName: "Requirements Gathering", // Fixed field name
      taskCode: "TSK-001",
      status: "pending",
      priority: "high",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0],
      description: "Initial client meeting",
      createdAt: new Date()
    });

    // Time entries not in schema, skipping

    console.log("✅ Seeding Complete!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding Failed:", error);
    process.exit(1);
  }
}

main();
