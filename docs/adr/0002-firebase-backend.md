# ADR-0002: Firebase as the backend platform

**Date:** 2024-08-01
**Status:** Accepted

## Context
The app required real-time sync (streaks, social feed), authentication, file storage (profile pictures), and push notifications — all standard mobile backend needs. A custom backend would add significant infrastructure overhead for a solo developer.

## Decision
Use Firebase as the sole backend: Firestore for data, Firebase Auth for authentication, Firebase Storage for profile pictures, and Firebase Cloud Messaging for push notifications.

## Consequences
- Zero infrastructure to manage — fully serverless
- Real-time listeners make streak and social feed updates seamless
- Firebase Security Rules enforce data access at the database level
- Vendor lock-in to Google's ecosystem
- Firestore's document model requires denormalization (e.g. storing friend lists vs. joins)
- Cost scales with reads/writes — needs monitoring as user base grows

## Alternatives considered
- **Supabase** — good Postgres-based alternative but less mature FCM/push story at the time
- **Custom Node.js + PostgreSQL** — full control but significant DevOps burden for a solo project
- **AWS Amplify** — viable but more complex setup and steeper learning curve
