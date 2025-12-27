import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7736ca4da39fb98476cd8605360f7028@o4510606547419136.ingest.de.sentry.io/4510606622130256", // User provided DSN

  // Add optional Integrations here
  integrations: [
    Sentry.replayIntegration(),
  ],

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],

  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
