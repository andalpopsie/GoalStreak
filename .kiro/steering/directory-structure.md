---
inclusion: on-demand
---

# GoalStreak / Goalfer — Directory Structure

> **Single source of truth** for repo layout. Kept intentionally lean: it maps
> the **stable** structure (top-level dirs, key locations, data collections),
> not a file-by-file inventory — those go stale the moment a file is added. To
> see current files in an area, list the directory.

## Project Organization

```
GoalStreak/                              # Workspace root (monorepo-style)
├── GoalStreakApp/                       # Main React Native app (Expo)
│   ├── src/                             # Source: components, screens, services,
│   │                                    #   hooks, utils, types, constants, navigation
│   ├── assets/                          # App assets (icon.png master lives here)
│   ├── ios/ · android/                  # Native projects (prebuilt)
│   ├── scripts/                         # Build & utility scripts
│   ├── firebase/                        # Firebase config + rules (see below)
│   ├── docs/                            # App-level guides (build, iOS, testing, design)
│   └── app-store-assets/                # App Store submission materials (see below)
│
├── goalfer-landing/                     # Landing page website (Next.js)
├── docs/                                # Project-level docs (architecture, process)
├── development-sessions/                # Historical dev logs & planning
└── .kiro/                               # Kiro IDE config
    ├── specs/                           # Feature specs (requirements/design/tasks)
    ├── steering/                        # Development guidelines (this file lives here)
    └── hooks/                           # Agent hooks
```

Root files: `README.md`, `ROADMAP.md`, `CLAUDE.md`, `.gitignore`.

## Key Locations

- **App source**: `GoalStreakApp/src/` — feature logic in `services/`, UI in
  `components/` and `screens/`, data hooks in `hooks/`.
- **Firebase** (`GoalStreakApp/firebase/`): `firebase.json` (project config),
  `firestore.rules` (security rules), `firestore.indexes.json` (composite
  indexes), `storage.rules`. Deploy from this dir:
  `firebase deploy --only firestore:rules` / `firestore:indexes`.
- **App Store** (`GoalStreakApp/app-store-assets/`): `metadata/` (legal docs,
  descriptions, ASC config, checklists), `marketing/`, `feature-graphics/`,
  `real-screenshots/app-store-ready/` (upload-ready PNGs). App icon master is
  `GoalStreakApp/assets/icon.png` — see `.kiro/steering/asset-paths.md`.
- **Feature planning**: `.kiro/specs/<feature>/` with `requirements.md`,
  `design.md`, `tasks.md`.

## Working Directory Guidelines

| Task | Work in |
|------|---------|
| App development | `GoalStreakApp/src/` |
| App Store submission | `GoalStreakApp/app-store-assets/` |
| Firebase rules/indexes | `GoalStreakApp/firebase/` |
| Feature planning | `.kiro/specs/` |

## Firestore Collections

```
users/{userId}                  friends/{friendshipId}       groups/{groupId}
userProfiles/{userId}           friendRequests/{requestId}   groupInvitations/{id}
habits/{habitId}                activities/{activityId}      trackedHabits/{id}
completions/{completionId}      comments/{commentId}         groupActivities/{id}
streaks/{habitId}               blocks/{blockId}             timerStates/{timerId}
```

(Reports live in `reports`; feedback in `feedback`. See `firestore.rules` for
the authoritative, current set — rules are the real source of truth for
collections.)
