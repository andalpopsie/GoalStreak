---
name: app-store-assets-check
description: Validate GoalStreakApp/app-store-assets/ structure, naming, screenshot sizes, icons, and metadata JSON for App Store/Play Store submission readiness. Use when preparing a submission or after adding/changing store assets. Ported from the Kiro "App Store Asset Organizer" hook.
---

Current structure (verify with `find app-store-assets -maxdepth 2 -type d` before relying on this — it can drift):

```
app-store-assets/
├── metadata/            # JSON + markdown metadata, legal docs, checklists
├── marketing/           # social-media, press-kit, app-preview
├── feature-graphics/
└── real-screenshots/    # ios/, app-store-ready/
```

Check:

1. **Structure**: required directories present, files in the right place, naming follows App Store conventions
2. **Screenshots**: required iOS sizes present (6.7", 5.5", 12.9" if iPad supported); Android sizes if applicable; screenshots actually showcase key features; resolution/quality acceptable
3. **Icons/graphics**: app icon present in all required sizes; Android adaptive icon present; feature graphics meet store guidelines
4. **Metadata files**: `ios-metadata.json`/`android-metadata.json` are valid JSON; markdown files well-formed; no fields missing; consistent across files
5. **Optimization**: file sizes reasonable for submission, correct formats, no duplicate/unused assets
6. **Cross-reference**: check against `app-store-assets/metadata/ios-submission-checklist.md` and `ios-legal-compliance-checklist.md` for anything still outstanding

**Hard rule:** don't create a new asset-report file — update `ios-submission-checklist.md` (or the relevant `docs/reports/*.md` validation report) in place.

Report: 📁 structure status, 🖼️ completeness checklist, ⚡ optimization notes, ❌ missing/problematic assets, ✅ readiness score, 📋 next steps.
