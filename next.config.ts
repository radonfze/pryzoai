import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Your existing nextConfig
};

// Sentry SDK v8+ only accepts 2 arguments
export default withSentryConfig(nextConfig, {
  // Sentry configuration options
  silent: true,
  org: "pryzoai",
  project: "pryzoai-nextjs",
  
  // Widen client file upload for better stack traces
  widenClientFileUpload: true,
  
  // Transpile SDK for IE11 compatibility
  transpileClientSDK: true,
  
  // Route browser requests through Next.js to avoid ad-blockers
  tunnelRoute: "/monitoring",
  
  // Hide source maps from client bundles
  hideSourceMaps: true,
  
  // Tree-shake Sentry logger statements
  disableLogger: true,
  
  // Auto-instrument Vercel Cron Monitors
  automaticVercelMonitors: true,
});
