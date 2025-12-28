"use server";

import { createPaymentLink } from "@/lib/gateways/payment";
import { sendSMS, sendWhatsApp } from "@/lib/gateways/messaging";
import { getCompanyId } from "@/lib/auth";

// Payment Gateway Wrapper
export async function processPayment(amount: number, currency: string, description: string, email: string) {
    try {
        const companyId = await getCompanyId();
        
        const result = await createPaymentLink({
            amount,
            currency,
            description,
            customerEmail: email
        });

        // Log transaction to DB (Stub)
        
        return result;

    } catch (e: any) {
        return { success: false, message: e.message };
    }
}

// Notification Gateway Wrapper
export async function sendNotification(to: string, type: "sms" | "whatsapp", content: string) {
    try {
        // Validation...
        if (type === "whatsapp") {
            const result = await sendWhatsApp(to, "generic_template", { text: content });
            return result;
        } else {
            const result = await sendSMS(to, content);
            return result;
        }
    } catch (e: any) {
        return { success: false, message: e.message };
    }
}
