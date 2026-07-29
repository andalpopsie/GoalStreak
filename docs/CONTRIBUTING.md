# Contributing to Goalfer

This is the plain-language guide to how changes get into the app. If you only
read one thing, read **The flow** below. Everything else fills in details.

The golden rule: **you never edit `main` directly.** Every change — a feature,
a one-line fix, even a typo — travels the same short path: a branch, a pull
request, an automatic check, then a merge.

---

## The flow (six steps)

Think of `main` as the always-working, official version of the app. You build
on a copy, prove it's good, then fold it back in.

```
1. Branch   →  make a personal copy to work on
2. Commit   →  save checkpoints with a clear message
3. Push     →  upload your branch to GitHub
4. PR       →  open a Pull Request (the review + checks page)
5. Merge    →  once the required check is green, fold it into main
6. Deploy   →  push the result to production (Firebase / App Store)
```

You can't skip the PR. GitHub is configured to reject direct pushes to `main`
(see [Branch protection](#branch-protection-whats-enforced)).

---

## Step by step (with the actual commands)

Run git from the **project root**: `/Users/popsieandal/Documents/GoalStreak`.
App commands (`npm ...`) run from `GoalStreakApp/`.

### 1. Start from an up-to-date main

```bash
git checkout main
git pull --ff-only
```

### 2. Create a branch

Name it `<type>/<short-description>` (see [Branch names](#branch-names)):

```bash
git checkout -b fix/streak-off-by-one
```

### 3. Do the work and commit

Make your changes, then save a checkpoint. Stage **specific files** rather than
`git add .` so you don't sweep in unrelated work:

```bash
git add GoalStreakApp/src/services/streakService.ts
git commit -m "fix(streak): count completions in the user's local timezone"
```

Commit messages follow [Conventional Commits](#commit-messages). Small, focused
commits are better than one giant one.

### 4. Push your branch

```bash
git push -u origin fix/streak-off-by-one
```

### 5. Open a Pull Request

```bash
gh pr create --base main --fill
```

`--fill` uses your commit message for the title/body. For anything non-trivial,
write a proper description (see [PR description](#pr-description)). Opening the
PR automatically starts the [CI checks](#what-ci-does).

### 6. Wait for the check, then merge

The **`Firestore rules tests (required)`** check must be green. When it is:

```bash
gh pr merge --squash --delete-branch
```

Squash merge keeps `main` tidy — one PR becomes one clean commit.

### 7. Sync your local main

```bash
git checkout main
git pull --ff-only
```

That's the whole loop. Deploys are separate — see [Deploying](#deploying).

---

## Branch names

Prefix with the change type, kebab-case for the rest:

| Type      | Prefix       | Example                              |
|-----------|--------------|--------------------------------------|
| Feature   | `feature/`   | `feature/pro-subscription`           |
| Bug fix   | `fix/`       | `fix/streak-off-by-one`              |
| Chore     | `chore/`     | `chore/bump-build-number`            |
| Docs      | `docs/`      | `docs/contributing-workflow`         |
| Refactor  | `refactor/`  | `refactor/habit-service`             |
| CI/build  | `ci/`        | `ci/optimize-runs`                   |

One logical change per branch. If you're mid-feature and spot an unrelated
cleanup, ship it as its own branch/PR.

---

## Commit messages

Format: `type(scope): short summary in the imperative mood`

```
feat(pro): add Goalfer Pro paywall
fix(streak): count completions in the user's local timezone
chore(assets): consolidate icon paths
docs(contributing): document the PR + CI workflow
ci: cache the Firestore emulator jar
```

Rules of thumb:
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `style`.
- Keep the summary under ~72 characters, lowercase after the colon, no period.
- Use the body (a blank line then prose) to explain *what and why*, not *how*.

---

## What CI does

When you open or update a PR, GitHub Actions runs automatically
(config: `.github/workflows/ci.yml`). Two jobs:

| Job | Blocks merge? | What it checks |
|-----|---------------|----------------|
| **Detect changes** | — | Figures out whether the PR touches rules, so the gate can skip needless work |
| **Firestore rules tests (required)** | ✅ yes | Runs the security-rules tests against the Firestore emulator |

The rules check is the one required gate. It's deliberately narrow: it protects
the security-critical, easy-to-get-wrong Firestore rules (the class of bug that
once reached production), and it's cheap — a docs/metadata-only PR skips the
emulator run entirely, so the check still reports green in a couple of seconds.

Note: unit tests (`npm test`) and type-check (`npm run type-check`) currently
have known failures/debt, so they are **not** run in CI — a perpetually-red
check just trains you to ignore red. Run them locally as needed. When the debt
is paid down, add them back as required checks.

---

## Branch protection: what's enforced

`main` is protected by an organization ruleset. GitHub enforces this — it's not
just a promise:

- **No direct pushes** to `main`. You must go through a PR.
- **No force-pushes** to `main` and **`main` can't be deleted**.
- **The `Firestore rules tests (required)` check must pass** before a PR merges.

If a merge is ever "blocked," the fix is to make the required check pass — not
to disable the rule.

---

## PR description

For non-trivial PRs, a good body has:

```markdown
## Summary
One or two sentences: what and why.

## Changes
- Bullet list of the concrete things done

## Verification
- Tests run, type-check status, anything you clicked manually

## Risk & rollback
- Blast radius (local / module / cross-cutting)
- How to roll back (git revert <sha>, or re-deploy previous rules, etc.)
```

---

## Running things locally

From `GoalStreakApp/`:

```bash
npm start                 # run the app (choose iOS / Android / Web)
npm test -- --ci          # unit tests (has known failures today)
npm run type-check        # TypeScript check (has known errors today)
npm run test:emulator     # Firestore rules tests — the required check
```

`npm run test:emulator` needs **Java** installed (the Firestore emulator is a
Java program). On macOS: `brew install openjdk`, then either symlink it or
prepend it for the run:

```bash
export PATH="/opt/homebrew/opt/openjdk/bin:$PATH"
npm run test:emulator
```

---

## Deploying

Deploys are deliberate, separate steps — merging to `main` does **not** deploy
automatically (yet).

### Firestore security rules

After a rules change is merged to `main`:

```bash
git checkout main && git pull --ff-only
cd GoalStreakApp/firebase
npx firebase deploy --only firestore:rules --project goalstreak-app2
```

`goalstreak-app2` is the production project. The rules are validated by CI
before merge, and Firebase keeps a version history you can roll back to in the
console if needed.

### iOS build & submit

See the build/submit scripts in `GoalStreakApp/package.json`
(`build:production:ios`, `submit:ios`) and the app-store docs. Remember to
increment and commit the build number first.

---

## Common situations

### "I have half-finished work and need to start something else"

Finish and commit, or stash it, before switching tasks — a clean `git status`
before you branch saves a lot of untangling.

```bash
git stash push -m "wip: what I was doing"
# ... do the other thing on its own branch ...
git checkout <my-branch> && git stash pop
```

### "My branch is behind main and the PR shows conflicts / stale"

Pull the latest `main` into your branch:

```bash
gh pr update-branch          # merges main into your PR branch, or:
git checkout <my-branch>
git merge origin/main
```

### "I accidentally committed to main locally"

```bash
git reset --soft HEAD~1      # undo the commit, keep the changes
git checkout -b fix/whatever # move them onto a proper branch
```

### "A merged change broke something"

Revert is safe and non-destructive — it creates a new commit that undoes the old
one:

```bash
git revert <sha>
# then open a PR with the revert
```

---

## Quick reference

```bash
# Start a change
git checkout main && git pull --ff-only
git checkout -b fix/thing

# Save + share
git add <files>
git commit -m "fix(scope): summary"
git push -u origin fix/thing

# Review + merge
gh pr create --base main --fill
gh pr merge --squash --delete-branch

# Back to a clean main
git checkout main && git pull --ff-only
```

---

**Repository**: https://github.com/goalfer-app/GoalStreak

**More detail**: the full standard operating procedure lives in
`.kiro/steering/git-workflow-sop.md`.
