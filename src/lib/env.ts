import { z } from "zod";

/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at startup.
 * Fails fast if any required variable is missing.
 */

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  
  // Auth
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 chars").optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  
  // 2FA
  TOTP_ENCRYPTION_KEY: z.string().min(32, "TOTP key must be 32+ chars").optional(),
  
  // Environment
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  
  // Optional integrations
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Validate environment at module load
function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  
  if (!parsed.success) {
    console.error("❌ Invalid environment variables:");
    console.error(parsed.error.flatten().fieldErrors);
    
    // In development, warn but don't crash
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ Running in development mode with invalid env vars");
      return process.env as unknown as Env;
    }
    
    throw new Error("Invalid environment variables");
  }
  
  return parsed.data;
}

export const env = validateEnv();
