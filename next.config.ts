import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing nextConfig
};

// Sentry SDK v8+ - minimal valid options only
export default withSentryConfig(nextConfig, {
  silent: true,
  org: "pryzoai",
  project: "pryzoai-nextjs",
  
  // Route browser requests through Next.js to avoid ad-blockers
  tunnelRoute: "/monitoring",
  
  // Widen client file upload for better stack traces
  widenClientFileUpload: true,
});
