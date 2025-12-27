import postgres from "postgres";
import { sql } from "drizzle-orm";
import "dotenv/config";

/**
 * Auto-Numbering Service
 * 
 * Generates sequential, unique document numbers based on number_series configuration.
 * Uses row-level locking to prevent race conditions.
 */

interface NumberGenerationOptions {
  companyId: string;
  seriesCode: string;
  branchCode?: string;
  warehouseCode?: string;
  transactionDate?: Date;
}

interface GeneratedNumber {
  number: string;
  allocationId: string;
}

/**
 * Generate the next number for a series using row-level locking
 */
export async function generateNextNumber(
  options: NumberGenerationOptions
): Promise<GeneratedNumber> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sqlClient = postgres(databaseUrl);

  try {
    // Use transaction with row-level lock
    const result = await sqlClient.begin(async (tx) => {
      // 1. Get and lock the series row
      const [series] = await tx`
        SELECT * FROM number_series 
        WHERE company_id = ${options.companyId}::uuid 
        AND code = ${options.seriesCode}
        FOR UPDATE
      `;

      if (!series) {
        throw new Error(`Number series not found: ${options.seriesCode}`);
      }

      if (!series.is_active) {
        throw new Error(`Number series is inactive: ${options.seriesCode}`);
      }

      // 2. Check reset rule (yearly reset)
      const txDate = options.transactionDate || new Date();
      const currentYear = txDate.getFullYear();
      let nextNumber = Number(series.current_number) + 1;

      if (series.reset_rule === "yearly" && series.last_reset_year !== currentYear) {
        // Reset to starting number
        nextNumber = Number(series.starting_number);
        await tx`
          UPDATE number_series 
          SET last_reset_year = ${currentYear}
          WHERE id = ${series.id}
        `;
      }

      // 3. Build the formatted number
      let formattedNumber = series.prefix || "";
      
      // Add year format if configured
      if (series.year_format && series.year_format !== "none") {
        const yearStr = series.year_format === "yy" 
          ? String(currentYear).slice(-2)
          : String(currentYear);
        formattedNumber += yearStr + (series.separator || "-");
      }

      // Add branch/warehouse code if scoped
      if (series.scope === "branch" && options.branchCode) {
        formattedNumber += options.branchCode + (series.separator || "-");
      } else if (series.scope === "warehouse" && options.warehouseCode) {
        formattedNumber += options.warehouseCode + (series.separator || "-");
      }

      // Add number with padding
      const paddedNumber = String(nextNumber).padStart(series.number_length || 5, "0");
      formattedNumber += paddedNumber;

      // Add suffix if configured
      if (series.suffix) {
        formattedNumber += series.suffix;
      }

      // 4. Update the series with new current number
      await tx`
        UPDATE number_series 
        SET 
          current_number = ${nextNumber},
          updated_at = NOW()
        WHERE id = ${series.id}
      `;

      // 5. Log the allocation
      const [allocation] = await tx`
        INSERT INTO number_allocation_log (
          company_id, series_id, generated_number, 
          allocated_at, status
        ) VALUES (
          ${options.companyId}::uuid, ${series.id}, ${formattedNumber},
          NOW(), 'allocated'
        )
        RETURNING id
      `;

      return {
        number: formattedNumber,
        allocationId: allocation.id,
      };
    });

    return result;
  } finally {
    await sqlClient.end();
  }
}

/**
 * Mark number as used (link to document)
 */
export async function markNumberAsUsed(
  allocationId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sqlClient = postgres(databaseUrl);

  try {
    await sqlClient`
      UPDATE number_allocation_log 
      SET 
        entity_type = ${entityType},
        entity_id = ${entityId}::uuid,
        status = 'used'
      WHERE id = ${allocationId}::uuid
    `;
  } finally {
    await sqlClient.end();
  }
}

/**
 * Cancel an allocated number (never used)
 */
export async function cancelAllocatedNumber(
  allocationId: string
): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sqlClient = postgres(databaseUrl);

  try {
    await sqlClient`
      UPDATE number_allocation_log 
      SET 
        status = 'cancelled',
        updated_at = NOW()
      WHERE id = ${allocationId}::uuid
      AND status = 'allocated'
    `;
  } finally {
    await sqlClient.end();
  }
}

/**
 * Preview what the next number would be (without allocating)
 */
export async function previewNextNumber(
  options: NumberGenerationOptions
): Promise<string> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL not set");

  const sqlClient = postgres(databaseUrl);

  try {
    const [series] = await sqlClient`
      SELECT * FROM number_series 
      WHERE company_id = ${options.companyId}::uuid 
      AND code = ${options.seriesCode}
    `;

    if (!series) return "N/A";

    const txDate = options.transactionDate || new Date();
    const currentYear = txDate.getFullYear();
    let nextNumber = Number(series.current_number) + 1;

    if (series.reset_rule === "yearly" && series.last_reset_year !== currentYear) {
      nextNumber = Number(series.starting_number);
    }

    let formattedNumber = series.prefix || "";
    
    if (series.year_format && series.year_format !== "none") {
      const yearStr = series.year_format === "yy" 
        ? String(currentYear).slice(-2)
        : String(currentYear);
      formattedNumber += yearStr + (series.separator || "-");
    }

    if (series.scope === "branch" && options.branchCode) {
      formattedNumber += options.branchCode + (series.separator || "-");
    } else if (series.scope === "warehouse" && options.warehouseCode) {
      formattedNumber += options.warehouseCode + (series.separator || "-");
    }

    const paddedNumber = String(nextNumber).padStart(series.number_length || 5, "0");
    formattedNumber += paddedNumber;

    if (series.suffix) {
      formattedNumber += series.suffix;
    }

    return formattedNumber;
  } finally {
    await sqlClient.end();
  }
}
