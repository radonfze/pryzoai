import { inngest } from "@/lib/inngest/client";

/**
 * Example Background Job: Send Invoice Email
 * 
 * This demonstrates how to define an Inngest function.
 * In production, this would call Resend/SendGrid.
 */
export const sendInvoiceEmail = inngest.createFunction(
  { id: "send-invoice-email" },
  { event: "invoice/sent" },
  async ({ event, step }) => {
    const { invoiceId, email } = event.data;

    // Step 1: Fetch Invoice Data
    const invoice = await step.run("fetch-invoice-data", async () => {
      // simulate db fetch
      return { id: invoiceId, total: 1000 };
    });

    // Step 2: Generate PDF (Simulated)
    const pdfUrl = await step.run("generate-pdf", async () => {
      // call pdf generator
      return `https://files.pryzo.ai/invoices/${invoiceId}.pdf`;
    });

    // Step 3: Send Email
    await step.run("send-email", async () => {
      console.log(`📧 Sending invoice ${invoice.id} to ${email} with PDF ${pdfUrl}`);
      // await emailProvider.send(...)
      return { success: true };
    });

    return { success: true, message: "Email sent" };
  }
);
