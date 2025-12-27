import { Inngest } from "inngest";

// Initialize the Inngest client
export const inngest = new Inngest({ 
  id: "pryzo-ai-erp",
  eventKey: process.env.INNGEST_EVENT_KEY,
  isDev: process.env.NODE_ENV === "development",
});
