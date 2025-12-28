// Mock Sentry / Error Monitoring Service

export function initMonitoring() {
    console.log("[Monitoring] Initialized (Mock)");
}

export function captureException(error: any, context?: any) {
    console.error("[Monitoring] Exception Captured:", error, context);
    // In real app: Sentry.captureException(error);
}

export function captureMessage(message: string) {
    console.log("[Monitoring] Message:", message);
}
