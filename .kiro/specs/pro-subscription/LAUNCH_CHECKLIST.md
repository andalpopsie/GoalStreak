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
- [ ] Open App Store Connect → **My Apps → Goalfer → Monetization → Subscriptions**
- [ ] Create a Subscription Group named **Goalfer Pro**
- [ ] Add localization (Reference Name + display name + description, EN-US minimum)

### Monthly product
- [ ] Reference Name: `Goalfer Pro Monthly`
- [ ] Product ID: `goalfer_pro_monthly` (must match `PRO_PRODUCT_IDS.monthly`)
- [ ] Subscription Duration: 1 Month
- [ ] Price: **Tier 4 ($3.99 USD)**
- [ ] Localization: title + description
- [ ] Review screenshot (any 1284×2778 image; can use the paywall capture)
- [ ] Status: **Ready to Submit**

### Annual product
- [ ] Reference Name: `Goalfer Pro Annual`
- [ ] Product ID: `goalfer_pro_annual` (must match `PRO_PRODUCT_IDS.annual`)
- [ ] Subscription Duration: 1 Year
- [ ] Price: **Tier 24 ($23.99 USD)**
- [ ] Localization: title + description
- [ ] Review screenshot
- [ ] Status: **Ready to Submit**

### Sandbox tester
- [ ] **Users and Access → Sandbox → Testers → +**
- [ ] Email: a fresh address NOT linked to your real Apple ID (e.g., `popsie+sandbox@…`)
- [ ] Save the password somewhere safe — used on the iPhone during testing
- [ ] Region: United States (matches the USD pricing tiers)

### App Store Connect API key (for RevenueCat receipt validation)
- [ ] **Users and Access → Integrations → App Store Connect API → +**
- [ ] Role: **App Manager** (sufficient for receipt validation)
- [ ] Download the `.p8` private key (one-time download, save it securely)
- [ ] Note the **Issuer ID** (top of the page) and **Key ID** (next to your key)

---

## 2 · RevenueCat dashboard

- [ ] Sign up at https://www.revenuecat.com (free tier is fine for sandbox + early launch)
- [ ] Create a Project named **Goalfer**
- [ ] Add an iOS app
  - Bundle ID: `com.goalstreak.app`
  - App Store Connect API key: upload the `.p8`, paste the Issuer ID and Key ID
- [ ] **Products → Import from App Store Connect**
  - Verify `goalfer_pro_monthly` and `goalfer_pro_annual` both appear
- [ ] **Entitlements → New**
  - Identifier: `pro` (must match `PRO_ENTITLEMENT_ID` in `src/types/subscription.ts`)
  - Attach both products to this entitlement
- [ ] **Offerings → New**
  - Identifier: `default` (must match `DEFAULT_OFFERING_ID`)
  - Add both products as packages (one Monthly, one Annual)
  - Mark `default` as the **Current Offering**
- [ ] **API Keys** (Project Settings → API keys)
  - Copy the **iOS public SDK key** (starts with `appl_…`)

---

## 3 · Local + EAS configuration

### Local development
- [ ] Paste the iOS API key into `GoalStreakApp/.env.development`:
      `EXPO_PUBLIC_REVENUECAT_IOS_KEY=appl_xxxxxxxxxxxxxxxxxx`

### EAS secrets (production)
- [ ] From `GoalStreakApp/`:
      `eas secret:create --scope project --name EXPO_PUBLIC_REVENUECAT_IOS_KEY --value appl_xxxxxxxxxxxxxxxxxx --type string`
- [ ] Verify with: `eas secret:list`

---

## 4 · Build a dev client + test on real iPhone

- [ ] Make sure the device is registered with EAS:
      `eas device:create` (only the first time per device)
- [ ] Build the dev client:
      `eas build --profile development --platform ios`
      *(15–25 min on EAS servers; takes the iOS API key from `.env.development` baked at build time)*
- [ ] Install on the iPhone via the EAS install link
- [ ] Start Metro: `npx expo start --dev-client`

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
