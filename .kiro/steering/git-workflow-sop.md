# Git & PR Workflow — Standard Operating Procedure

> The default flow for any code change on GoalStreak. Applies to features,
> fixes, docs, and cleanups. Kiro follows this without asking — it's the
> path of least surprise.

## Principles

1. **Never commit directly to `main`.** Every change goes through a branch + PR.
2. **One logical change per branch.** If you're mid-feature and notice a
   cleanup, ship the cleanup as its own PR.
3. **Small, reviewable PRs.** Under ~500 lines when possible. Big features
   split across multiple PRs are better than one giant merge.
4. **`main` is always deployable.** Merging to `main` is a green light for
   the next production build.
5. **Feature branches are throwaway.** Delete them after merge.

## Branch naming

Use the Conventional Commits type as the prefix. Kebab-case for the rest.

| Type      | Prefix       | Example                                  |
|-----------|--------------|------------------------------------------|
| Feature   | `feature/`   | `feature/pro-subscription`               |
| Bug fix   | `fix/`       | `fix/streak-off-by-one`                  |
| Chore     | `chore/`     | `chore/consolidate-icon-paths`           |
| Docs      | `docs/`      | `docs/pro-subscription-launch-checklist` |
| Refactor  | `refactor/`  | `refactor/habit-service-error-handling`  |
| Perf      | `perf/`      | `perf/dashboard-render`                  |
| Tests     | `test/`      | `test/paywall-modal-edge-cases`          |

## Commit messages

Use [Conventional Commits](https://www.conventionalcommits.org/).

```
<type>(<scope>): <short summary in imperative mood>

<body — what and why, not how>

<optional footers: BREAKING CHANGE, Fixes #123>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`.

**Examples**
```
feat(pro): add Goalfer Pro subscription with paywall

chore(assets): consolidate icon paths to canonical assets/

fix(streak): count completions in user's local timezone (Fixes #42)
```

Subject line rules:
- Max 72 chars
- Imperative mood ("add", not "added")
- No trailing period
- Lowercase after the `:`

## The end-to-end flow (Kiro's default)

Every change follows this arc. Steps 4–9 are what `gh` automates.

1. **Sync `main`** — `git checkout main && git pull --ff-only`
2. **Branch** — `git checkout -b <type>/<name>`
3. **Work + commit** — small, focused commits with Conventional messages
4. **Verify** — run tests + typecheck locally before pushing
5. **Push** — `git push -u origin <branch>`
6. **Open PR** — `gh pr create` with a title and body (see template below)
7. **Wait for review** — do not self-merge unless the change is trivial and
   explicitly approved
8. **Merge** — `gh pr merge --squash --delete-branch` (squash keeps history linear)
9. **Sync local** — `git checkout main && git pull --ff-only`

## PR template

Every PR body should have:

```markdown
## Summary
One or two sentences: what and why.

## Changes
- Bullet list of the concrete things done
- Group by area if the diff is large

## Verification
- Tests: `npm test -- --run` (list any new suites)
- Type check: `npx tsc --noEmit` (state passing)
- Manual: what you clicked/tested if UI

## Screenshots (if UI change)
Before / after or new-only.

## Risk & rollback
- Blast radius: local / module / cross-cutting
- Rollback: `git revert <sha>` or specific file restore instructions

## Follow-ups
- Anything intentionally deferred (link to issue if opened)

## ADR check
- Does this change involve a significant architectural decision (new library, new pattern, data model change, platform choice)? If yes, add or update a record in `docs/adr/`.
```

## Merge strategy

**Squash-merge by default.** Rationale:
- One PR = one commit on `main`, easy to `git bisect` and `git revert`
- Keeps `main` linear (no merge bubbles) matching the pre-existing style
- Individual "work-in-progress" commits stay in the branch history if
  someone needs to trace the thought process

**When to use merge-commit instead:**
- Long-running feature branches where individual commits matter
- Anything with a coauthored change set that must preserve authorship per commit

**Never use rebase-and-merge on this repo** — it rewrites SHAs and breaks
the traceability we get from squash.

## Recovery from mistakes

**Committed to `main` by accident:**
```bash
# Undo the last commit but keep the changes
git reset --soft HEAD~1

# Then follow the normal flow
git checkout -b <type>/<name>
git commit -F ...
```

**Pushed to `main` by accident (before anyone pulled):**
```bash
# Only if no one else has pulled — check with the team first
git reset --hard HEAD~1
git push --force-with-lease origin main
```

**Merged a broken PR:**
```bash
# Revert on main (creates a revert commit — safe, non-destructive)
git revert -m 1 <merge-sha>
git push
```

## Tools

- **GitHub CLI (`gh`)** — install via `brew install gh`; auth via
  `gh auth login`. Kiro uses it for all PR operations.
- **Conventional commits linter** (optional) — commit hooks that reject
  non-conforming messages. Not currently enforced; keep it in mind.

## What Kiro does automatically

Without asking:
- Create feature/chore/fix branches when starting new work
- Write Conventional Commit messages
- Push branches with upstream tracking
- Draft PR titles and bodies following the template
- Verify tests + typecheck before opening the PR
- After merge, sync `main` locally and delete the merged branch

Kiro will PAUSE for confirmation before:
- Merging a PR (unless it's a trivial chore/docs PR that Kiro authored end-to-end)
- Force-pushing to any branch
- Rewriting history (`git reset --hard`, `git rebase -i`, amending pushed commits)
- Any operation touching `main` other than a fast-forward pull

## Quick reference — the SOP as a one-liner

```
sync main → branch → commit (conv msgs) → verify → push → gh pr create →
  (wait for review) → gh pr merge --squash --delete-branch → sync main
```
