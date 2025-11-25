# Monitoring & Alerting Setup

## Sentry Configuration

### Installation

```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Configuration

```javascript
// sentry.client.config.js
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
});
```

### Alerts

- Error rate > 5% → Slack notification
- Response time > 5s → Email alert
- Failed deployment → Immediate notification

## Vercel Analytics

### Setup

```bash
npm install @vercel/analytics
```

```javascript
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

## Database Monitoring

- Neon dashboard for connection pool stats
- Slow query logging enabled
- Alert if connections > 80% of limit

## Uptime Monitoring

- UptimeRobot: Check every 5 minutes
- Alert if downtime > 2 minutes
- Monitor: /, /api/health, /shop

## Metrics to Track

- Response time (avg, p95, p99)
- Error rate
- Database query time
- API endpoint performance
- User signups
- Orders created
- Payment success rate
- Email delivery rate
