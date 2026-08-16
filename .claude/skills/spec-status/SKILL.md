---
name: spec-status
description: Analyze a .kiro/specs/<name>/tasks.md (with requirements.md and design.md for context) and report progress, the recommended next task, risks, and gaps. Use when the user asks "what's next on <spec>" or wants a status check on a Kiro spec. Ported from the Kiro "Spec Task Tracker" hook.
---

Given a spec directory under `.kiro/specs/<name>/` (ask the user which one if not specified — current specs: `sso-authentication`, `pro-subscription`, `app-store-launch`, `comprehensive-testing-suite`, `report-and-block`, `accountability-groups`, `habit-timer-feature`):

1. Read `tasks.md`, `requirements.md`, and `design.md`.
2. **Progress**: count checked vs unchecked tasks, compute completion percentage.
3. **Next step**: identify the most logical next unchecked task, noting any prerequisite tasks it depends on.
4. **Quality check**: spot any unchecked requirement that has no corresponding task, or a completed task that doesn't obviously satisfy its linked requirement.
5. **Risk**: flag tasks that look larger/more complex than their checklist entry suggests, or that depend on external services/credentials.
6. **Reality check**: verify a sample of checked-off tasks actually exist in the codebase (grep for the file/function they reference) — specs in this repo have previously been marked complete when the code wasn't actually there (e.g. `habit-timer-feature` and the Detox portion of `comprehensive-testing-suite`), so don't take checkboxes at face value.

Report format:
- 📊 Completion % and raw counts
- ⏭️ Recommended next task + rationale
- ⚠️ Risks or blockers
- ❌ Any checked task that didn't verify against the actual code
- 📝 If asked to update `tasks.md`, edit it in place — never create a separate progress-report file.
