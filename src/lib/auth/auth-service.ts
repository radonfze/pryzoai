// Authentication Service
// Handles login, session management, password hashing, and account lockout

"use server";

import { db } from "@/db";
import { users, userSessions, companies } from "@/db/schema";
import { eq, and, lt } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const SESSION_COOKIE_NAME = "pryzoai_session"; // FIXED: Was "pryzoft_session"
const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export interface LoginResult {
  success: boolean;
  error?: string;
  sessionToken?: string;
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    companyId: string;
  };
  requiresTwoFactor?: boolean;
}

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
  sessionId: string;
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Check if account is locked
 */
async function isAccountLocked(user: typeof users.$inferSelect): Promise<boolean> {
  if (!user.lockedUntil) return false;
  
  const now = new Date();
  if (now < user.lockedUntil) {
    return true; // Still locked
  }
  
  // Lockout expired, reset failed attempts
  await db.update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLogin: null,
    })
    .where(eq(users.id, user.id));
  
  return false;
}

/**
 * Handle failed login attempt
 */
async function handleFailedLogin(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId)
  });
  
  if (!user) return;
  
  const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
  const now = new Date();
  
  const updateData: any = {
    failedLoginAttempts: newFailedAttempts,
    lastFailedLogin: now,
  };
  
  // Lock account if max attempts reached
  if (newFailedAttempts >= MAX_LOGIN_ATTEMPTS) {
    updateData.lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
  }
  
  await db.update(users)
    .set(updateData)
    .where(eq(users.id, userId));
}

/**
 * Reset failed login attempts on successful login
 */
async function resetFailedAttempts(userId: string) {
  await db.update(users)
    .set({
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastFailedLogin: null,
      lastLoginAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Create session
 */
async function createSession(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const sessionId = uuidv4();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  
  await db.insert(userSessions).values({
    id: sessionId,
    userId,
    ipAddress,
    userAgent,
    expiresAt,
  });
  
  return sessionId;
}

/**
 * Login with email and password
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<LoginResult> {
  try {
    // 1. Check if user exists
    const user = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    
    if (!user) {
        // Security: Simulate time taken for hash comparison to prevent timing attacks
        await new Promise(resolve => setTimeout(resolve, 100)); 
        return { success: false, error: "Invalid email or password" };
    }

    // 2. Check if account is locked
    if (await isAccountLocked(user)) {
        return { success: false, error: "Account is locked due to too many failed attempts. Try again in 15 minutes." };
    }

    // 3. Check if user is active
    if (!user.isActive) {
        return { success: false, error: "Account is disabled. Contact administrator." };
    }

    // 4. Verify Password
    const isValid = await verifyPassword(password, user.passwordHash);

    if (!isValid) {
        await handleFailedLogin(user.id);
        const attempts = (user.failedLoginAttempts || 0) + 1;
        const remaining = MAX_LOGIN_ATTEMPTS - attempts;
        
        if (remaining <= 0) {
             return { success: false, error: "Account locked due to too many failed attempts." };
        }
        
        return { success: false, error: "Invalid email or password" };
    }
    
    // 5. Success - Reset failed attempts
    await resetFailedAttempts(user.id);
    
    // Create session
    const sessionId = await createSession(user.id, ipAddress, userAgent);
    
    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });
    
    return {
      success: true,
      sessionToken: sessionId,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
    };
    
  } catch (error: any) {
    console.error("[AuthService] Login error:", error);
    return { success: false, error: "An error occurred during login" };
  }
}

/**
 * Validate session and return user data
 */
export async function validateSession(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    // 1. Attempt to validate real session
    if (sessionToken) {
      const session = await db.query.userSessions.findFirst({
        where: eq(userSessions.id, sessionToken),
        with: {
          user: true,
        }
      });
      
      if (session) {
          const now = new Date();
          if (now <= session.expiresAt && session.user.isActive) {
               return {
                  userId: session.user.id,
                  email: session.user.email,
                  name: session.user.name,
                  role: session.user.role,
                  companyId: session.user.companyId,
                  sessionId: session.id,
                };
          }
      }
    }

    return null;
    
  } catch (error: any) {
    console.error("[AuthService] Validate session error:", error);
    return null;
  }
}

/**
 * Logout - destroy session
 */
export async function logout(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    
    if (sessionToken) {
      // Delete session from database
      await db.delete(userSessions).where(eq(userSessions.id, sessionToken));
    }
    
    // Clear cookie
    cookieStore.delete(SESSION_COOKIE_NAME);
    
  } catch (error: any) {
    console.error("[AuthService] Logout error:", error);
  }
}

/**
 * Extend session (refresh)
 */
export async function extendSession(): Promise<boolean> {
  try {
    const session = await validateSession();
    if (!session) return false;
    
    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS);
    
    await db.update(userSessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(userSessions.id, session.sessionId));
    
    // Update cookie
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION_MS / 1000,
      path: "/",
    });
    
    return true;
    
  } catch (error: any) {
    console.error("[AuthService] Extend session error:", error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    const deleted = await db.delete(userSessions)
      .where(lt(userSessions.expiresAt, now));
    
    return deleted.length;
  } catch (error: any) {
    console.error("[AuthService] Cleanup error:", error);
    return 0;
  }
}

/**
 * Unlock user account (admin function)
 */
export async function unlockAccount(userId: string): Promise<boolean> {
  try {
    await db.update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastFailedLogin: null,
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error: any) {
    console.error("[AuthService] Unlock account error:", error);
    return false;
  }
}
