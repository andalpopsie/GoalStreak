# Goalfer — App Review Rejection Response Playbook

A calm, ready-to-use guide for the most likely App Review flags on a **social
app with auto-renewable subscriptions**. For each flag: what it looks like, why
it happens, what Goalfer **already ships** to satisfy it, and a Resolution
Center reply you can adapt.

> **Golden rules when you get a rejection**
> 1. **Don't panic and don't just re-submit.** A rejection is usually a
>    conversation, not a verdict. Most are resolved with a reply + evidence.
> 2. **Reply in Resolution Center**, not by starting a new version, unless the
>    fix requires a new binary (see "Needs new build?" on each item).
> 3. **Give evidence**: exact navigation steps, a screen recording, or a
>    screenshot. Reviewers work fast — make the feature impossible to miss.
> 4. **Be specific and factual.** Reference the guideline number they cited and
>    state exactly where the feature lives (screen → button).
> 5. **One reply, all points.** If they cite multiple guidelines, address every
>    one in a single response.
> 6. **Keep the demo account seeded and alive** during the whole review.

---

## While your app is in review (build 21 submitted)

You've submitted — now it's a waiting game. What to do (and not do):

**Status meanings in App Store Connect:**
- **Waiting for Review** — in the queue, not yet assigned. Usually < 24–48h.
- **In Review** — a reviewer is actively testing. Often resolved same day.
- **Pending Developer Release** — ✅ approved; goes live when you tap release.
- **Rejected / Metadata Rejected** — reply in Resolution Center (this playbook).
  "Metadata Rejected" means **no new build needed** — it's an ASC/text fix.

**Do while waiting:**
- ✅ Keep the **demo account** seeded with **exactly 6 habits** (one tap from the
  paywall) and make sure it still logs in.
- ✅ Keep the **Sandbox tester** active; confirm the Paid Apps Agreement is still
  "active" and the two IAPs are "Ready to Submit" / submitted **with the build**.
- ✅ Record the pre-emptive clips (see the checklist at the bottom) now, so a
  reply is instant if a flag comes back.
- ✅ Keep `hello@goalfer.app` monitored — a reviewer may email.

**Do NOT while waiting:**
- ❌ **Don't upload a new build or edit the version** — it can cancel the current
  review and send you to the back of the queue. Only rebuild if you get a
  rejection that genuinely requires it.
- ❌ Don't change IAP product IDs, the RevenueCat offering, or pricing mid-review.
- ❌ Don't remove the demo account or let the sandbox tester lapse.

**If you need to expedite:** for a genuine time-critical issue you can request an
Expedited Review from Apple — use sparingly; it's a limited favor, not a lever
for every submission.

---

## Quick triage: does the fix need a new build?

| Flag | Typical fix | New build (build 22+)? |
|------|-------------|------------------------|
| 2.1 couldn't test IAP / login | Better demo acct + steps in reply | Usually **no** |
| 3.1.2 subscription disclosures | Metadata / binary text edits | Sometimes |
| 2.3.x metadata/screenshots | Fix in App Store Connect | **No** (metadata) |
| 1.2 UGC safety | Point to existing report/block/EULA | **No** |
| 5.1.1(v) account deletion | Point to existing Delete Account | **No** |
| 4.8 Sign in with Apple | Explain it doesn't apply (no 3rd-party login) | **No** |
| 5.1.1(i)/5.1.2 privacy label | Reconcile ASC label with actual collection | **No** (config) |
| "products not loading" | Fix RevenueCat/ASC config | **No** (config) |
| Actual code/UX bug | Fix + rebuild | **Yes** |

Bumping the build: `npm run increment-build` → commit → `npm run build:production:ios` → `npm run submit:ios`.

---

# IN-APP PURCHASE FLAGS

## 2.1 — App Completeness (reviewer couldn't test the purchase)

**What it looks like:** "We were unable to complete the in-app purchase," or
"We could not locate the paywall," or a note that the demo account didn't work.

**Why it happens:** This is the **#1 IAP rejection** and it's almost always
logistics, not your app. The reviewer used a live Apple ID instead of Sandbox,
couldn't find the 6→7 habit trigger, or the demo account was empty/broken.

**Your status:** Paywall triggers when a Free user attempts a 7th habit (limit
6). A paywall preview also exists on the Profile tab in dev builds. Reviewer
notes already document sandbox steps.

**Response (reply, usually no new build):**
> The Goalfer Pro paywall appears when a Free user tries to create a **7th
> habit** (Free is limited to 6). To reproduce:
> 1. Sign in with the demo account (credentials in App Review Information).
> 2. Create habits until you have 6 (Home tab → "+").
> 3. Tap "+" to add a 7th — the Goalfer Pro paywall appears with Monthly
>    ($3.99) and Annual ($23.99) options.
> 4. Please test with a **Sandbox Apple Account**: sign out of your production
>    Apple Account in Settings → App Store first, then approve the purchase
>    with the sandbox tester when prompted.
>
> A screen recording of the full flow is attached. Please let us know if the
> sandbox account needs to be re-provisioned on your side.

**Prevention:** Pre-seed the demo account with **exactly 6 habits** so the
reviewer is one tap from the paywall. Attach a screen recording proactively.

---

## 3.1.1 — In-App Purchase (must use Apple's IAP for digital goods)

**What it looks like:** "App unlocks features using a purchase mechanism other
than in-app purchase," or mentions of external payment links.

**Why it happens:** The app appears to sell digital content outside StoreKit, or
links out to a website to subscribe.

**Your status:** All purchases go through **StoreKit via RevenueCat**
(`react-native-purchases`). There is no external payment path and no "buy on our
website" link. Low risk.

**Response (reply, no new build):**
> Goalfer Pro is sold exclusively through Apple In-App Purchase via StoreKit
> (managed by RevenueCat, which validates App Store receipts). There is no
> alternate payment mechanism or external purchase link anywhere in the app.

---

## 3.1.2 — Subscriptions (missing required disclosures)

**What it looks like:** Rejection for missing auto-renewal terms, price/period,
or **functional** links to Terms (EULA) and Privacy Policy — at the point of
purchase, in the metadata, or both.

**Why it happens:** Apple requires the binary and/or App Store description to
disclose: subscription **title**, **length**, **price per period**, that it
**auto-renews unless turned off ≥24h before period end**, and tappable links to
**Privacy Policy** and **Terms (EULA)**.

**Your status:** Terms of Service covers auto-renewal, pricing ($3.99/mo,
$23.99/yr), cancellation, refunds-via-Apple, and restore. In-app Terms/Privacy
links exist via `linkingUtils` (SignUp + Profile). Privacy/Terms URLs use
`goalfer.app`.

**Response (reply; new build only if the paywall screen itself lacks the text/links):**
> Auto-renewable subscription details are disclosed as follows:
> - **Products:** Goalfer Pro Monthly ($3.99/month), Goalfer Pro Annual
>   ($23.99/year), auto-renewing.
> - **Auto-renewal terms** (renews unless canceled ≥24h before the period ends,
>   managed in the user's Apple Account settings) appear in our Terms of
>   Service, linked from the Sign-Up screen and Profile → Terms of Service.
> - **Privacy Policy:** https://goalfer.app/privacy • **Terms:** https://goalfer.app/terms
>
> If the standard auto-renew disclosure text is required directly on the paywall
> screen, we will add it in the next build — please confirm.

**Prevention:** Make sure the paywall screen itself shows the auto-renew
sentence + Terms/Privacy links. If it doesn't, that's the one item here that
needs a new build.

---

## 2.3.1 / 2.3.7 — Accurate Metadata (hidden features & screenshots)

**What it looks like:** "Your metadata references features that are not visible"
(the "Coming soon" Pro features) or "screenshots do not reflect the app."

**Why it happens:** Metadata advertises benefits the shipped build doesn't
deliver, or screenshots show the wrong UI / mismatched dimensions.

**Your status:** Description advertises **only** the concrete 15-habit benefit;
roadmap items are labelled "coming soon." The "first 100 users get Pro free for
life" promo must be a real entitlement in the build.

**Response (reply / fix metadata, no new build):**
> The only Pro benefit advertised as currently active is the higher habit limit
> (Free 6 → Pro 15), which is live in this build. All other Pro features are
> explicitly labelled "coming soon" and are not presented as available.

**Prevention:** Confirm the founding-100 promo entitlement actually grants Pro
in the build, or soften that promo line. Ensure every screenshot in a display
slot shares dimensions (re-render the paywall shots to **1320×2868** for the
6.9" set).

---

## Operational: "Products not loading" / empty paywall (RevenueCat + ASC)

Not a guideline number, but the most common self-inflicted IAP failure. If the
paywall shows no packages:

- **Paid Applications Agreement** must be **active** (Business section) — banking
  + tax complete. Nothing loads until it is.
- **Product IDs must match exactly:** `goalfer_pro_monthly`, `goalfer_pro_annual`
  (App Store Connect ↔ RevenueCat ↔ `src/types/subscription.ts`).
- **RevenueCat**: entitlement id `pro`, offering id `default`, both products
  attached to the offering.
- IAP status in ASC should be "Ready to Submit" and **submitted with the build**.
- Sandbox tester created; test on a real device (not the simulator).

---

# SOCIAL / USER-GENERATED CONTENT FLAGS

## 1.2 — Safety: User-Generated Content

**What it looks like:** "Apps with user-generated content must include" — a
checklist of: a method to filter objectionable content, a mechanism to **report**
content, the ability to **block** abusive users, a published way to contact you,
and an **EULA** where users agree there's no tolerance for objectionable content.

**Why it happens:** Any app where users see each other's content (names, habits,
activity feed, group chat) is held to Guideline 1.2. Reviewers look for all five
pieces and reject if one is missing or hard to find.

**Your status — you have all five:**
1. **Filter:** client-side moderation filter (`moderationFilter`) hides blocked
   /reported content across feeds and group activities.
2. **Report:** `reportContent` via `useModeration` — available on user profiles,
   activity cards, group feed, and group chat.
3. **Block:** `blockUser` via `useModeration`; blocked users tear down the
   friendship + pending requests; a `BlockedUsersScreen` lets users manage/unblock.
4. **Contact:** support reachable at hello@goalfer.app and https://goalfer.app/support.
5. **EULA:** Sign-Up screen has a required acceptance checkbox for the Terms of
   Service **including a zero-tolerance clause** for objectionable content and
   abusive behavior — account creation is gated on it.

**Response (reply, no new build):**
> Goalfer implements all Guideline 1.2 requirements for user-generated content:
> - **Report:** tap the "…" / overflow on any user profile, activity feed post,
>   group activity, or group chat message → "Report" with a reason.
> - **Block:** same menu → "Block user." Blocked users are removed as friends and
>   their content is filtered everywhere. Users manage blocks in
>   Profile → Blocked Users.
> - **Content filtering:** blocked/reported content is filtered from all social
>   surfaces client-side.
> - **EULA:** account creation requires accepting our Terms of Service, which
>   include an explicit zero-tolerance clause for objectionable content and
>   abusive users (checkbox on the Sign-Up screen).
> - **Contact:** hello@goalfer.app and https://goalfer.app/support.
> - We act on reports of objectionable content and abusive users within 24 hours.
>
> A screen recording showing report + block is attached.

**Prevention:** Seed the demo account so the reviewer can reach a profile/feed
post with a visible report/block affordance in one or two taps.

---

## 5.1.1(v) — Data Collection & Storage: Account Deletion

**What it looks like:** "Apps that support account creation must also let users
initiate deletion of their account from within the app."

**Why it happens:** A signup exists but there's no self-service in-app deletion,
or it only "deactivates," or it hides deletion behind an email request.

**Your status — implemented:** Profile → **Delete Account** →
`accountDeletionService.reauthenticateAndDeleteAccount`. It re-authenticates with
the password, then permanently deletes user docs across all collections, the
profile photo in Storage, and the Firebase Auth user. Irreversible, in-app, no
email round-trip.

**Response (reply, no new build):**
> Users can permanently delete their account entirely in-app: Profile tab →
> "Delete Account" (red, at the bottom of the menu). It requires password
> re-authentication for security, then permanently removes the account, all
> habit/social data across our database, and the stored profile photo. No email
> request or support ticket is required. A screen recording is attached.

---

## 4.8 — Login Services (Sign in with Apple)

**What it looks like:** "Your app uses a third-party login service but does not
offer Sign in with Apple," or a reflexive note asking why Sign in with Apple
isn't offered.

**Why it happens:** Apple requires Sign in with Apple **only** when an app uses a
**third-party or social login** (Google, Facebook, etc.) as a sign-in option. It
is sometimes raised in error on any app that has accounts.

**Your status — does not apply.** Goalfer uses **Firebase email/password
authentication only**. There is no Google, Facebook, Apple, or other third-party
/ social sign-in anywhere in the app, so the Sign in with Apple requirement is
not triggered.

**Response (reply, no new build):**
> Guideline 4.8 does not apply to Goalfer. The app offers only a first-party
> email-and-password account system (Firebase Authentication). It does not use
> Sign in with Google, Facebook, or any other third-party or social login
> service, so the Sign in with Apple requirement is not triggered. Account
> creation, sign-in, and password reset are all handled directly by our own
> email/password flow.

**Prevention:** If a third-party/social login is ever added later, Sign in with
Apple becomes mandatory alongside it — revisit this before shipping that feature.

---

## 5.1.1(i) / 5.1.2 — Privacy: Data Collection & Nutrition-Label Accuracy

**What it looks like:** "Your privacy label does not match the data your app
collects," questions about permission usage strings, or a request to justify a
declared data type.

**Why it happens:** Apple cross-checks the App Store Connect privacy
("nutrition") label, the app's permission prompts, and the on-device privacy
manifest. A mismatch — declaring data you don't collect, or collecting data you
didn't declare — is a common metadata rejection.

**Your status:** The app requests **only** Camera and Photo Library
(`NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`) via
`expo-image-picker`, for profile pictures. All previously-declared but unused
permission strings (Location, Contacts, Microphone, Calendars, Reminders, FaceID)
were removed. `PrivacyInfo.xcprivacy` sets `NSPrivacyTracking=false`, there is no
IDFA / ATT prompt, and analytics is first-party Firebase only. Purchase History
is collected by the RevenueCat SDK (which ships its own manifest); the aggregated
label declares **Purchases → Purchase History**.

**Response (reply / reconcile the label in ASC, no new build):**
> Goalfer's data practices match its privacy label:
> - **Camera & Photos:** requested only for setting a profile picture
>   (`expo-image-picker`). No other device permissions are requested.
> - **No tracking:** the app does not use ATT/IDFA and does not track users across
>   apps or websites (`NSPrivacyTracking=false`). Analytics is first-party
>   Firebase only.
> - **Purchases:** subscription purchase history is processed by our payments SDK
>   (RevenueCat) and declared as Purchases → Purchase History.
> - Account data (email, display name, habit/social content) is used only to
>   provide the service and is deletable in-app (Profile → Delete Account).
>
> If a specific declared data type needs adjustment, please let us know which and
> we will reconcile the label.

**Prevention:** After each production build, re-verify the ASC privacy label
against the shipped permissions and confirm the aggregated label shows
Purchases → Purchase History (RevenueCat's manifest is only merged in the
production binary, not in Expo Go / dev clients).

---

## 1.1 — Safety: Objectionable Content

**What it looks like:** The reviewer saw content they deem objectionable, or is
concerned the app could host it.

**Why it happens:** Often triggered by the presence of free-text fields (habit
names, display names, group names) without visible moderation.

**Your status:** Report/block/filter + EULA (see 1.2). Content is user-private by
default; social sharing is opt-in.

**Response (reply, no new build):**
> Free-text content (habit names, display names, group names) is private by
> default and only shared when the user opts in. All social surfaces have report
> and block controls, blocked/reported content is filtered, and the EULA
> prohibits objectionable content. We respond to reports within 24 hours.

---

## 4.0 / 4.3 — Design & Spam (lower risk)

**What it looks like:** "Minimum functionality" or "spam / duplicate app."

**Why it happens:** Thin apps or many near-identical submissions. Not a concern
for a full-featured habit tracker with social + analytics + subscriptions, but
be ready to enumerate the feature set if asked.

**Response (reply, no new build):**
> Goalfer is a full-featured habit tracker: habit creation across 39+ categories,
> streak tracking and analytics, a social accountability layer (friends, activity
> feed, reactions), accountability groups with shared progress and chat, and a
> Pro subscription. It is a single original app, not a template or reskin.

---

# RESOLUTION CENTER — REPLY STRUCTURE

Use this shape for any reply:

1. **Thank + acknowledge** the specific guideline: "Thank you for the review.
   Regarding Guideline X.Y.Z…"
2. **State the facts**: where the feature lives (screen → control) or why the
   concern doesn't apply.
3. **Give reproduction steps** the reviewer can follow verbatim.
4. **Attach evidence**: screen recording (best) or annotated screenshots.
5. **Offer to fix** if it's genuinely a gap: "If you'd prefer X on screen Y, we
   will add it in the next build — please confirm."

**When to appeal instead of reply:** If you believe the rejection is a factual
mistake and a reply didn't resolve it, use "Submit an appeal" in Resolution
Center to escalate to the App Review Board. Keep it factual, cite the guideline,
and attach evidence. Appeal only after a normal reply has failed.

**When you must ship a new build:** real bug, missing on-screen disclosure text,
or a UX change the reviewer requires. Bump the build number first
(`npm run increment-build`) — App Store Connect rejects duplicate build numbers.

---

# PRE-EMPTIVE ATTACHMENTS TO HAVE READY

Record these short clips now so a reply is instant later:
- [ ] Free → 6 habits → 7th tap → paywall → sandbox purchase → Pro unlocked
- [ ] Report a post + block a user + unblock from Profile → Blocked Users
- [ ] Delete Account (password re-auth → account gone → back at login)
- [ ] Terms/Privacy links opening from Sign-Up and Profile

_Last updated: August 5, 2026 — build 21 / v1.0.0 in "Waiting for Review"; IAP products + RevenueCat, paywall screenshot dimensions, and App Review contact/demo account/Korea trade-rep are all now in place. Added Guideline 4.8 (Sign in with Apple — does not apply, verified no third-party login in `src`) and 5.1.1(i)/5.1.2 (privacy nutrition-label accuracy) entries. Verified against code: account deletion (`accountDeletionService.reauthenticateAndDeleteAccount`, password re-auth), report/block surfaces, and IAP product IDs all match the shipped build._
