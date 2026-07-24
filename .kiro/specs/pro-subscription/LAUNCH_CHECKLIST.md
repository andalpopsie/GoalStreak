# Goalfer Pro · Launch Readiness Checklist

> Tracks the **external** (dashboard / device) work required to ship the Pro
> subscription. Code is complete and merged on `feature/pro-subscription`.
> See `.kiro/specs/pro-subscription/{requirements,design,tasks}.md` for the
> full spec.

## Status legend
- [ ] Not started
- [~] In progress
- [x] Done
- [!] Blocked / needs attention

---

## 1 · App Store Connect

### Subscription Group
- [x] Open App Store Connect → **My Apps → Goalfer → Monetization → Subscriptions**
- [x] Create a Subscription Group named **Goalfer Pro**
- [x] Add localization (Reference Name + display name + description, EN-US minimum)

### Monthly product
- [x] Reference Name: `Goalfer Pro Monthly`
- [x] Product ID: `goalfer_pro_monthly` (must match `PRO_PRODUCT_IDS.monthly`)
- [x] Subscription Duration: 1 Month
- [x] Price: **Tier 4 ($3.99 USD)**
- [x] Localization: title + description
- [x] Review screenshot (any 1284×2778 image; can use the paywall capture)
- [x] Status: **Ready to Submit**

### Annual product
- [x] Reference Name: `Goalfer Pro Annual`
- [x] Product ID: `goalfer_pro_annual` (must match `PRO_PRODUCT_IDS.annual`)
- [x] Subscription Duration: 1 Year
- [x] Price: **Tier 24 ($23.99 USD)**
- [x] Localization: title + description
- [x] Review screenshot
- [x] Status: **Ready to Submit**

### Sandbox tester
- [x] **Users and Access → Sandbox → Testers → +**
- [x] Email: a fresh address NOT linked to your real Apple ID (e.g., `popsie+sandbox@…`)
- [x] Save the password somewhere safe — used on the iPhone during testing
- [x] Region: United States (matches the USD pricing tiers)

### App Store Connect API key (for RevenueCat receipt validation)
- [x] **Users and Access → Integrations → App Store Connect API → +**
- [x] Role: **App Manager** (sufficient for receipt validation)
- [x] Download the `.p8` private key (one-time download, save it securely)
- [x] Note the **Issuer ID** (top of the page) and **Key ID** (next to your key)

---

## 2 · RevenueCat dashboard

- [x] Sign up at https://www.revenuecat.com (free tier is fine for sandbox + early launch)
- [x] Create a Project named **Goalfer**
- [x] Add an iOS App Store app
  - Bundle ID: `com.goalstreak.app`
  - **Subscription Key** (not the App Store Connect API key!): upload the
    `SubscriptionKey_XXXXXXXXXX.p8`, paste the Key ID
  - ⚠️ Correction from Phase 1E: RevenueCat needs a **Subscription Key**
    (filename `SubscriptionKey_...p8`) generated from **Users and Access
    → Integrations → In-App Purchase** (NOT the App Store Connect API key
    from `App Store Connect API` sub-tab). Both are `.p8` files but for
    different Apple services.
- [x] **API Keys** (sidebar → API keys)
  - Copy the **iOS public SDK key** (starts with `appl_…`)
  - Saved to `GoalStreakApp/.env.development` as `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- [x] **Product catalog → Products → Import from App Store Connect**
  - Verified `goalfer_pro_monthly` and `goalfer_pro_annual` both appear
  - Required an **App Store Connect API key** (`AuthKey_XXXXXXXXXX.p8`) uploaded
    under App settings → App Store Connect API, in addition to the
    Subscription Key. Both `.p8` files are needed:
    Subscription Key = receipt validation; API key = product import/metadata.
  - Both products reached **Ready to Submit** after filling ASC metadata
    (review screenshot 1290×2796 + localizations)
- [x] **Product catalog → Entitlements → New**
  - Identifier: `pro` (matches `PRO_ENTITLEMENT_ID` in `src/types/subscription.ts`)
  - Display name `Goalfer Pro` is fine — code reads the identifier, not the name
  - Attached exactly `goalfer_pro_monthly` + `goalfer_pro_annual`
  - Removed the auto-added RevenueCat Test Store products (iOS-only scope)
- [x] **Product catalog → Offerings → New**
  - Identifier: `default` (matches `DEFAULT_OFFERING_ID`)
  - `$rc_monthly` package → `goalfer_pro_monthly`; `$rc_annual` package → `goalfer_pro_annual`
  - Code matches by product ID, not package ID, so the standard rc_* package
    slots are fine
  - `default` set as the **Current Offering**

---

## 3 · Local + EAS configuration

### Local development
- [x] Paste the iOS API key into `GoalStreakApp/.env.development`:
      `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_sjBceswlYDThWxWYsidrNttXMXR`

### EAS secrets (production)
- [x] Created project secret `EXPO_PUBLIC_REVENUECAT_IOS_KEY` (id 8b3a8b57…)
      via `eas secret:create --scope project ... --type string`
- [x] Verified with `eas secret:list`
- Note: `eas secret:*` is deprecated in newer CLI in favour of `eas env:*`;
  works fine on the current pinned version

---

## 4 · Test on real iPhone

### ⚠️ Pivoted from dev client → TestFlight
The dev-client path (ad-hoc provisioning) requires installing a config
profile on the iPhone, which repeatedly triggers a 1-hour iOS **Stolen
Device Protection** security delay. Not worth fighting. TestFlight needs
no device registration or profile install, and sandbox purchases work in
TestFlight builds — so we use that instead.

- [x] Ensure production build has the RevenueCat key
      - EAS project secret `EXPO_PUBLIC_REVENUECAT_IOS_KEY` set
      - ALSO hardcoded the `appl_...` key in `.env.production` (publishable
        client key, safe to ship — same class as the Firebase EXPO_PUBLIC_*
        keys) to avoid empty-placeholder overriding the secret at build time
- [ ] Build store-signed binary: `eas build --profile production-ios --platform ios`
- [ ] Submit to TestFlight: `eas submit --profile production --platform ios`
- [ ] Wait for App Store Connect processing (~10–20 min)
- [ ] Install via the **TestFlight** app on the iPhone (no profile needed)

### Sandbox test scenarios
- [ ] **Sign out of your real Apple ID** in iPhone Settings → App Store
- [ ] **Free user · normal flow** — create habits 1–6, verify "Add Habit" button works
- [ ] **Free user · paywall trigger from CreateHabitScreen** — submit a 7th habit, verify the paywall slides up and the form is preserved
- [ ] **Free user · paywall trigger from dashboard** — return to home with 6 habits, verify the "Want more? · From $1.99/mo" upgrade card appears, tap it, paywall opens
- [ ] **Purchase Monthly** — sign in with the sandbox tester when prompted, complete the purchase, verify:
  - Paywall dismisses
  - Pending habit (if from CreateHabitScreen) is created
  - Limit jumps to 15
  - Dashboard shows the standard "Add Habit" button again
  - Firestore `users/{uid}` has `isPro: true` and `proSince` (check Firebase console)
- [ ] **Purchase Annual** — repeat with a fresh sandbox account or wait for the auto-cancellation of the monthly (sandbox renews at accelerated rates)
- [ ] **Restore Purchases** — uninstall the app, reinstall, sign in to the same account, open paywall, tap Restore, verify Pro is restored without re-charge
- [ ] **Network error path** — turn on Airplane Mode, tap Subscribe, verify "No internet connection. Please try again." inline message
- [ ] **Cancel** — tap Subscribe, dismiss the StoreKit sheet, verify the modal stays open and shows no error
- [ ] **Pro user at 15 habits** — create 9 more habits (15 total), verify "All Set! 🎯 Focus on your 15 habits" copy

---

## 5 · App Store submission updates

When the dashboard work is verified working in sandbox:

- [ ] Update **App Store description** to mention Pro pricing and benefits
- [ ] Update **Keywords** if needed (e.g., add "subscription", "pro")
- [ ] Add **paywall screenshot** to the App Store screenshots (recommended)
- [ ] Update **Privacy Policy** (RevenueCat collects subscriber data — disclose this)
- [ ] Update **What's New** in App Store Connect for the launch build
- [ ] Increment build number: `npm run increment-build` from `GoalStreakApp/`
- [ ] Production build: `npm run build:production:ios`
- [ ] Submit: `npm run submit:ios`
- [ ] After review approval, monitor first real purchase via the RevenueCat dashboard

---

## Open questions / decisions to revisit

- [ ] Do we need a "Manage subscription" link in Settings before launch, or is "Restore purchases" in the paywall enough? (Apple guidelines accept either.)
- [ ] Should the upgrade card price label refresh dynamically from RevenueCat offerings instead of being hardcoded `$1.99/mo`? Future enhancement, not blocking.
- [ ] Should we add a Profile-screen "You're Pro 🌟" badge for converted users? Future enhancement.
- [ ] Promo offers / introductory pricing — out of scope for v1, revisit after we have conversion data.
