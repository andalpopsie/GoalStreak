#!/usr/bin/env node
/**
 * Auto-generate a CHANGELOG entry from git commits.
 *
 * Reads the current version + build number from app.json and prepends a new
 * section to CHANGELOG.md with all conventional commits since the last release tag.
 *
 * Conventional commit format expected:
 *   feat: ...        → ✨ Features
 *   fix: ...         → 🐛 Bug Fixes
 *   docs: ...        → 📝 Documentation
 *   refactor: ...    → ♻️ Refactor
 *   perf: ...        → ⚡️ Performance
 *   chore: ...       → 🔧 Chores
 *   style: ...       → 💄 Style
 *   test: ...        → 🧪 Tests
 *   build: ...       → 📦 Build System
 *   ci: ...          → 👷 CI
 *
 * Usage:
 *   node scripts/update-changelog.js
 *   npm run changelog
 *
 * Options:
 *   --dry-run   Print the new entry to stdout without modifying CHANGELOG.md
 *   --since=N   Use commits since build N (default: previous build, derived
 *               from the latest "Build X" git tag, or all commits if no tag)
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CHANGELOG_PATH = path.join(PROJECT_ROOT, 'CHANGELOG.md');
const APP_JSON_PATH = path.join(PROJECT_ROOT, 'app.json');

const TYPE_GROUPS = [
  { type: 'feat',      title: '✨ Features' },
  { type: 'fix',       title: '🐛 Bug Fixes' },
  { type: 'perf',      title: '⚡️ Performance' },
  { type: 'refactor',  title: '♻️ Refactor' },
  { type: 'docs',      title: '📝 Documentation' },
  { type: 'style',     title: '💄 Style' },
  { type: 'test',      title: '🧪 Tests' },
  { type: 'build',     title: '📦 Build System' },
  { type: 'ci',        title: '👷 CI' },
  { type: 'chore',     title: '🔧 Chores' },
];

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const sinceArg = args.find((a) => a.startsWith('--since='));
const explicitSince = sinceArg ? sinceArg.split('=')[1] : null;

function sh(cmd) {
  try {
    return execSync(cmd, { cwd: PROJECT_ROOT, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function getAppMeta() {
  const json = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
  return {
    version: json.expo.version,
    buildNumber: json.expo.ios?.buildNumber || '?',
  };
}

function getCommitRange() {
  if (explicitSince) {
    return `build-${explicitSince}..HEAD`;
  }
  // Find the most recent build tag (e.g., "build-13")
  const lastTag = sh('git describe --tags --match "build-*" --abbrev=0 2>/dev/null');
  if (lastTag) return `${lastTag}..HEAD`;
  return ''; // All commits
}

function getCommits(range) {
  // Format: subject%n%n%b%n--END--
  const log = sh(`git log ${range} --pretty=format:"%s%n%H%n--END--"`);
  if (!log) return [];

  return log
    .split('--END--')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [subject, hash] = entry.split('\n');
      return { subject: subject || '', hash: (hash || '').slice(0, 7) };
    });
}

function parseCommit(subject) {
  // Match: type(scope): description  OR  type: description
  const match = subject.match(/^(\w+)(?:\(([^)]+)\))?(!?):\s*(.+)$/);
  if (!match) return null;
  const [, type, scope, breaking, description] = match;
  return { type, scope, breaking: !!breaking, description };
}

function buildEntry(commits, meta) {
  const date = new Date().toISOString().slice(0, 10);
  const groups = new Map();

  for (const c of commits) {
    const parsed = parseCommit(c.subject);
    if (!parsed) continue;
    if (!groups.has(parsed.type)) groups.set(parsed.type, []);
    groups.get(parsed.type).push({ ...parsed, hash: c.hash });
  }

  const lines = [];
  lines.push(`## [${meta.version} - Build ${meta.buildNumber}] - ${date}`);
  lines.push('');

  let hasContent = false;
  for (const { type, title } of TYPE_GROUPS) {
    const items = groups.get(type);
    if (!items || items.length === 0) continue;
    hasContent = true;
    lines.push(`### ${title}`);
    for (const item of items) {
      const scope = item.scope ? `**${item.scope}:** ` : '';
      const breaking = item.breaking ? ' ⚠️ BREAKING' : '';
      lines.push(`- ${scope}${item.description}${breaking} (${item.hash})`);
    }
    lines.push('');
  }

  if (!hasContent) {
    lines.push('_No conventional commits found in this range._');
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  return lines.join('\n');
}

function prependToChangelog(entry) {
  const existing = fs.existsSync(CHANGELOG_PATH)
    ? fs.readFileSync(CHANGELOG_PATH, 'utf8')
    : '# Goalfer Changelog\n\n';

  // Insert the new entry after the title (first H1) but before any existing content
  const lines = existing.split('\n');
  const titleIdx = lines.findIndex((line) => line.startsWith('# '));
  if (titleIdx === -1) {
    return `# Goalfer Changelog\n\n${entry}\n${existing}`;
  }
  const head = lines.slice(0, titleIdx + 1).join('\n');
  const tail = lines.slice(titleIdx + 1).join('\n').replace(/^\n+/, '');
  return `${head}\n\n${entry}\n${tail}`;
}

function main() {
  const meta = getAppMeta();
  const range = getCommitRange();
  const commits = getCommits(range);

  if (commits.length === 0) {
    console.log(`No commits found ${range ? `in range ${range}` : 'in repository'}.`);
    process.exit(0);
  }

  const entry = buildEntry(commits, meta);

  if (isDryRun) {
    console.log('--- DRY RUN ---');
    console.log(entry);
    process.exit(0);
  }

  const updated = prependToChangelog(entry);
  fs.writeFileSync(CHANGELOG_PATH, updated);
  console.log(`✅ CHANGELOG.md updated for v${meta.version} (Build ${meta.buildNumber})`);
  console.log(`📝 ${commits.length} commits since ${range || 'beginning'}`);
}

main();
