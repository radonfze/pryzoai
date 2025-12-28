"use server";

import { authenticator } from "otplib";

export async function verifyOTP(token: string, secret: string) {
    try {
        const isValid = authenticator.check(token, secret);
        return { success: isValid };
    } catch (e) {
        return { success: false };
    }
}
