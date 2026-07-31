#!/usr/bin/env node
/**
 * view-feedback.js — read in-app feedback from Firestore (admin, read-only).
 *
 * The `feedback` collection is write-only for clients (security rules deny
 * reads), so this uses the Firebase Admin SDK, which runs with a service
 * account and bypasses rules. Runs locally only; nothing here ships in the app.
 *
 * AUTH (one-time setup):
 *   1. Create a service account in the goalstreak-app2 project with a
 *      read role (e.g. "Cloud Datastore Viewer").
 *   2. Download its JSON key. Keep it OUT of git.
 *   3. Point the standard Google env var at it:
 *        export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json
 *
 * USAGE:
 *   npm run feedback                       # 50 most recent
 *   npm run feedback -- --limit 100
 *   npm run feedback -- --since 2026-07-01 # on/after a date
 *   npm run feedback -- --min-rating 1     # only 1-2 star (unhappy) feedback
 *   npm run feedback -- --max-rating 2
 *   npm run feedback -- --csv feedback.csv # also export to CSV
 */

const admin = require('firebase-admin');

const PROJECT_ID = 'goalstreak-app2';
const COLLECTION = 'feedback';

// ── Arg parsing ──
function parseArgs(argv) {
  const args = { limit: 50 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--limit') args.limit = parseInt(next(), 10);
    else if (a === '--since') args.since = next();
    else if (a === '--min-rating') args.minRating = parseInt(next(), 10);
    else if (a === '--max-rating') args.maxRating = parseInt(next(), 10);
    else if (a === '--csv') args.csv = next();
    else if (a === '--help' || a === '-h') args.help = true;
  }
  return args;
}

function printHelp() {
  console.log(`
View in-app feedback (read-only, admin).

Usage:
  npm run feedback -- [options]

Options:
  --limit <n>        Max entries to fetch (default 50)
  --since <date>     Only feedback on/after this date (e.g. 2026-07-01)
  --min-rating <n>   Only ratings >= n
  --max-rating <n>   Only ratings <= n
  --csv <file>       Also write results to a CSV file
  --help             Show this help

Auth: set GOOGLE_APPLICATION_CREDENTIALS to a service-account key with
Firestore read access on the ${PROJECT_ID} project.
`);
}

function initAdmin() {
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error(
      '\n✗ GOOGLE_APPLICATION_CREDENTIALS is not set.\n' +
      '  Point it at a service-account key JSON with Firestore read access:\n' +
      '    export GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json\n' +
      '  See the header of scripts/view-feedback.js for setup steps.\n'
    );
    process.exit(1);
  }
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
  return admin.firestore();
}

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

function stars(rating) {
  const r = Number(rating) || 0;
  return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
}

function csvEscape(v) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return printHelp();

  const db = initAdmin();

  let query = db.collection(COLLECTION).orderBy('createdAt', 'desc');
  if (args.since) {
    const since = new Date(args.since);
    if (isNaN(since.getTime())) {
      console.error(`✗ Invalid --since date: ${args.since}`);
      process.exit(1);
    }
    query = query.where('createdAt', '>=', since);
  }
  if (args.limit) query = query.limit(args.limit);

  const snapshot = await query.get();
  let rows = snapshot.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      createdAt: toDate(d.createdAt),
      rating: d.rating ?? '',
      text: d.text || '',
      source: d.source || '',
      platform: d.platform || '',
      appVersion: d.appVersion || '',
      userName: d.userName || '',
      userId: d.userId || '',
    };
  });

  // Client-side rating filters (avoids extra composite indexes).
  if (args.minRating != null) rows = rows.filter((r) => Number(r.rating) >= args.minRating);
  if (args.maxRating != null) rows = rows.filter((r) => Number(r.rating) <= args.maxRating);

  if (rows.length === 0) {
    console.log('\nNo feedback found for the given filters.\n');
    return;
  }

  // ── Console report ──
  console.log(`\n${rows.length} feedback entr${rows.length === 1 ? 'y' : 'ies'}:\n`);
  for (const r of rows) {
    const when = r.createdAt ? r.createdAt.toISOString().replace('T', ' ').slice(0, 16) : 'unknown date';
    console.log(`${stars(r.rating)}  ${when}  ${r.platform}${r.appVersion ? ' v' + r.appVersion : ''}  ${r.source ? '[' + r.source + ']' : ''}`);
    console.log(`  by ${r.userName || 'Anonymous'} (${r.userId || 'no uid'})`);
    if (r.text) console.log(`  "${r.text}"`);
    console.log('');
  }

  // ── Summary ──
  const rated = rows.filter((r) => Number(r.rating) > 0);
  if (rated.length) {
    const avg = rated.reduce((s, r) => s + Number(r.rating), 0) / rated.length;
    const dist = [1, 2, 3, 4, 5].map((n) => `${n}★:${rated.filter((r) => Number(r.rating) === n).length}`).join('  ');
    console.log(`Average rating: ${avg.toFixed(2)} across ${rated.length} rated (${dist})\n`);
  }

  // ── Optional CSV ──
  if (args.csv) {
    const fs = require('fs');
    const header = ['createdAt', 'rating', 'source', 'platform', 'appVersion', 'userName', 'userId', 'text'];
    const lines = [header.join(',')];
    for (const r of rows) {
      lines.push([
        r.createdAt ? r.createdAt.toISOString() : '',
        r.rating, r.source, r.platform, r.appVersion, r.userName, r.userId, r.text,
      ].map(csvEscape).join(','));
    }
    fs.writeFileSync(args.csv, lines.join('\n'));
    console.log(`Wrote ${rows.length} rows to ${args.csv}\n`);
  }
}

main().catch((err) => {
  console.error('\n✗ Failed to read feedback:', err.message || err);
  if (String(err).includes('PERMISSION_DENIED') || String(err).includes('permission')) {
    console.error('  The service account needs Firestore read access (e.g. Cloud Datastore Viewer).');
  }
  process.exit(1);
});
