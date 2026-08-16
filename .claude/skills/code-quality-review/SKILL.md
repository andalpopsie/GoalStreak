---
name: code-quality-review
description: Review recently changed source files in GoalStreakApp/src for code smells, RN/TypeScript/Firebase best practices, performance, and security issues. Use after making non-trivial code changes, or when the user asks for a code quality pass. Ported from the Kiro "Code Quality Analyzer" hook.
---

Review the source files changed in this session (use `git diff` to find them, scoped to `GoalStreakApp/src/`). For each changed file, check:

1. **Code smells & anti-patterns** — long functions, duplicate code, complex conditionals
2. **Design patterns** — whether a pattern would clean up the structure
3. **Best practices** — React Native / TypeScript strict-mode / Firebase idioms
4. **Performance** — unnecessary re-renders, unbatched Firestore reads/writes, missing memoization
5. **Readability & maintainability**
6. **Security** — anything that could leak credentials or bypass Firestore rules
7. **GoalStreak conventions** — Service → Hook → Component layering, theme imports (`Colors`/`Typography`/`Spacing`), the 5-size typography scale, 8pt spacing grid (see root `CLAUDE.md`)
8. **File proliferation** — duplicate logic that should be consolidated

**Hard rule — MODIFY, DON'T MULTIPLY** (from `CLAUDE.md`):
- Never suggest a new component file for a UI variation — recommend a `variant` prop instead
- Never suggest a duplicate service — recommend adding a method to the existing service
- Never suggest a new doc file — recommend updating an existing one
- Always check whether similar functionality already exists before proposing new code

For each finding, report: the issue, a concrete before/after snippet, why it matters, and a priority (High/Medium/Low). Only flag things worth the user's attention — skip nitpicks that don't change behavior or readability meaningfully.
