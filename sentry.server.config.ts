import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://7736ca4da39fb98476cd8605360f7028@o4510606547419136.ingest.de.sentry.io/4510606622130256",

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
