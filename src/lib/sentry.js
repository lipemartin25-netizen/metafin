import * as Sentry from "@sentry/react";

// The init function will only activate Sentry if VITE_SENTRY_DSN is provided in the environment.
// For production, ensure you add this variable to your Vercel Dashboard.
Sentry.init({
 dsn: import.meta.env.VITE_SENTRY_DSN || "",

 // As integrações essenciais para React e Tracking de Erros de Rede:
 integrations: [
 Sentry.browserTracingIntegration(),
 Sentry.replayIntegration({
 maskAllText: true,
 blockAllMedia: true,
 }),
 ],

 // Performance Monitoring
 tracesSampleRate: 1.0, // Capture 100% of the transactions (reduce in scale to 0.1)

 // Session Replay
 replaysSessionSampleRate: 0.1, // 10% of standard sessions
 replaysOnErrorSampleRate: 1.0, // 100% of sessions with an error

 enabled: import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN
});

export default Sentry;
