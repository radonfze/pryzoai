// Stub for Messaging Gateway (WhatsApp/SMS/Email)

export async function sendWhatsApp(to: string, template: string, variables: any) {
    console.log(`[WhatsApp Mock] To: ${to}, Template: ${template}`, variables);
    return { success: true, messageId: `wa_${Date.now()}` };
}

export async function sendSMS(to: string, body: string) {
    console.log(`[SMS Mock] To: ${to}, Body: ${body}`);
    return { success: true, messageId: `sms_${Date.now()}` };
}
