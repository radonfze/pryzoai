import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { sendInvoiceEmail } from "@/lib/inngest/functions/send-invoice-email";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendInvoiceEmail, // Register the function
  ],
});
