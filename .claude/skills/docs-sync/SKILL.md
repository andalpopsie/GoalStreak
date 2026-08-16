---
name: docs-sync
description: Check whether recent source changes need documentation updates, and review any new file under GoalStreakApp/docs/ for redundancy against the existing guides. Use after a feature/architecture change, or when the user is about to add a new doc file. Ported from the Kiro "Source to Docs Sync" and "Documentation Maintenance" hooks.
---

This repo enforces a single-source-of-truth documentation structure. Current guides live in `GoalStreakApp/docs/`:

```
README.md                        # Documentation overview & navigation
BUILD_GUIDE.md                   # Build and deployment procedures
IOS_SUBMISSION_GUIDE.md          # iOS App Store submission process
TESTING_GUIDE.md                 # Testing procedures
ANALYTICS-GUIDE.md               # Analytics implementation & monitoring
FIREBASE_GUIDE.md                # Firebase configuration & troubleshooting
UI_DESIGN_GUIDE.md / DESIGN_SYSTEM.md  # UI components & design system
APP_STORE_OPTIMIZATION.md        # App Store optimization strategy
ONBOARDING-ENHANCEMENT-PLAN.md   # User onboarding
PRE-LAUNCH-FOCUS-AREAS.md        # Project planning & focus areas
KIRO_BEST_PRACTICES.md           # Kiro-era workflow notes
PHASE2_ENHANCEMENTS.md           # Discovery log for Phase 2 (see phase2-log skill)
reports/                         # Generated reports & validation ONLY
```

(Re-run `ls GoalStreakApp/docs/` before relying on this list — it drifts.)

**When source changed (services, hooks, components, config):**
1. Check if any existing guide above covers the area that changed (architecture, build process, Firebase config, a new service/hook/utility, a feature).
2. If yes, update that file in place. Do not write a summary of "what changed" as a new file — put incremental notes in `CHANGELOG.md` if one exists, or fold them into the relevant guide.
3. If genuinely nothing existing covers it, say so explicitly before proposing a new file.

**When reviewing a proposed new file in `docs/`:**
1. Identify its topic and check it against the list above for overlap.
2. If it overlaps, merge the content into the existing guide instead of creating the new file (update that guide's table of contents if it has one).
3. Only keep it as a separate file if it serves a purpose no existing guide covers — and even then, prefer extending `README.md`'s navigation over adding an orphan file.
4. `docs/reports/` is the one exception — generated validation/audit reports belong there, not as new top-level guides.

**Hard rule:** never create a new summary, status, or "what I changed" file. Update existing docs or use the changelog.
