# ADR-0001: React Native + Expo as the mobile framework

**Date:** 2024-08-01
**Status:** Accepted

## Context
GoalStreak needed a mobile-first app targeting iOS initially, with Android to follow. The team is primarily a solo developer, so productivity and iteration speed were critical. Native Swift/Kotlin would require maintaining two codebases.

## Decision
Use React Native with Expo SDK as the primary framework. Use EAS Build for production builds and EAS Submit for App Store delivery.

## Consequences
- Single codebase for iOS and Android
- Fast iteration with Expo Go during development
- Managed workflow reduces native tooling overhead
- EAS handles signing, provisioning profiles, and submission
- Trade-off: some native APIs require bare workflow or config plugins

## Alternatives considered
- **Flutter** — strong performance but Dart ecosystem is smaller and Firebase integration less mature at the time
- **Native Swift** — best iOS performance but no path to Android without a full rewrite
- **Capacitor/Ionic** — web-based; weaker native feel for a habit-tracking app that relies on daily engagement
