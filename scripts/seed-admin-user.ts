/**
 * Seed Admin User Script
 * Creates admin@pryzoai.ae with password admin123
 * 
 * Run with: npx tsx scripts/seed-admin-user.ts
 */

import { db } from "../src/db";
import { users } from "../src/db/schema/users";
import { companies } from "../src/db/schema/companies";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seedAdminUser() {
   console.log("🔑 Starting Admin User Seed...");

   try {
      // 1. Check if company exists, create if not
      let company = await db.query.companies.findFirst();
      
      if (!company) {
         console.log("📦 Creating default company...");
         const [newCompany] = await db.insert(companies).values({
            name: "PryzoAI Demo Company",
            nameAr: "شركة بريزو التجريبية",
            legalName: "PryzoAI Demo Company LLC",
            taxRegistrationNumber: "100000000000003",
            email: "info@pryzoai.ae",
            phone: "+971-4-123-4567",
            country: "AE",
            currency: "AED",
            fiscalYearStart: 1,
            isActive: true,
         }).returning();
         company = newCompany;
         console.log("✅ Company created:", company.name);
      } else {
         console.log("✅ Using existing company:", company.name);
      }

      // 2. Check if admin user already exists
      const existingUser = await db.query.users.findFirst({
         where: eq(users.email, "admin@pryzoai.ae"),
      });

      if (existingUser) {
         console.log("⚠️ Admin user already exists. Updating password...");
         
         // Hash the password
         const passwordHash = await bcrypt.hash("admin123", 10);
         
         await db.update(users)
            .set({ 
               passwordHash,
               isActive: true,
               failedLoginAttempts: 0,
               lockedUntil: null,
            })
            .where(eq(users.id, existingUser.id));
         
         console.log("✅ Password updated for admin@pryzoai.ae");
         return;
      }

      // 3. Hash the password
      const passwordHash = await bcrypt.hash("admin123", 10);
      console.log("🔐 Password hashed");

      // 4. Create the admin user
      const [newUser] = await db.insert(users).values({
         companyId: company.id,
         email: "admin@pryzoai.ae",
         passwordHash,
         name: "System Administrator",
         role: "admin",
         isActive: true,
         failedLoginAttempts: 0,
      }).returning();

      console.log("✅ Admin user created successfully!");
      console.log("   Email:", newUser.email);
      console.log("   Name:", newUser.name);
      console.log("   Role:", newUser.role);
      console.log("   Company ID:", newUser.companyId);

   } catch (error) {
      console.error("❌ Error seeding admin user:", error);
      throw error;
   } finally {
      process.exit(0);
   }
}

seedAdminUser();
