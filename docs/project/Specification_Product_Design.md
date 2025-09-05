# GoalStreak - Product Specification & Design Doc

## 1. Product Overview

**GoalStreak** is a mobile accountability app designed to help users build and maintain healthy habits.

The app focuses on streaks, goal tracking, and social accountability by connecting users with friends.

Core values:

- Simple & intuitive
- Motivational & social
- Built for scale

## 2. Core Features (MVP)

1. **Habit Tracking**

- Users can create fitness/wellness habits (e.g., meditation, no sugar, daily run)

- Daily, weekly, and monthly progress views

- Streak visualization

2. **Friends Activity Feed**

- Show recent activity of friends (e.g., **“Alex completed 10 minutes of meditation”**)

- Simple feed with habit, duration/metric, and timestamp

- Quick “👏” reaction option

- Privacy toggle: choose which habits to share

3. A**ccountability Friends**

- Invite accountability partners

- View each other’s goals and streaks

4. **Progress & Tracking**

- Tracker for weight, “days without sugar,” and other wellness goals

- Trend visualization

5. **Ease of Use**

- Minimal taps to log completion

- Clean interface and onboarding flow

## 3. UI Kit & Design System

### Color Palette

- **Primary Text:*** `#001BB7` (Deep Blue)
- **Background:*** `#FFF6E9` (Warm Neutral)
- **Accent 1 (CTA / Progress Highlight):*** `#FF7F3E` (Energetic Orange)
- **Accent 2 (Secondary UI / Tabs):*** `#80C4E9` (Soft Blue)
- **Accent 3 (Success / Completed States):*** `#37B5B6` (Teal Green)

### Typography

- ****Primary Font:*** Proxima Nova
- ****Font Usage:***

- Headings → Bold, Deep Blue (#001BB7)

- Body text → Regular, Deep Blue (#001BB7)

- Secondary text / captions → Light or Medium weight, Accent 2 (#80C4E9)

- ****Fallback:*** System default sans-serif if Proxima Nova unavailable

### Icons

**Phosphor Icons**

- Clean, rounded, monoline style
- Multiple weights (thin, regular, bold) → flexibility
- Open source (MIT license) → safe for commercial use
- Great for fitness + lifestyle themes

### Usage Guidelines

- Primary buttons → Accent 1 with white text
- Secondary buttons → Accent 2 outline/fill
- Completed habits → Accent 3
- Active streaks → Accent 1 highlight
- Feed reactions → Accent 2 & Accent 3 mix
- Background → always `#FFF6E9` for warmth and clarity

### Components

- Design inspo → /design-images/design-inspo.png
- Habit  (show habit name, streak count, CTA checkmark)
- Streak progress bar
- Friends Activity Feed cards (profile pic, habit, time)
- Stats charts (line chart for weight, streak bars)
- Bottom navigation (Home, Habits, Feed, Profile)
- --

## 4. Tech Stack

### Frontend (Mobile)

- ****React Native (Expo)*** → cross-platform, fast deployment
- UI: Tailwind RN or Styled Components
- Navigation: React Navigation

### Backend

- ****Firebase*** (Authentication, Firestore DB, Push Notifications, Hosting)
- Firestore structure:

- `users`

- `habits`

- `completedLogs` (for both personal and friends feed)

### Analytics

- Firebase Analytics + Crashlytics

### Scaling Considerations

- Firebase easily scales with active users
- Later migration path → Backend with Node.js/GraphQL + PostgreSQL if needed

## 5. Development Timeline

- ***Phase 1: Week 1–2***
- Setup Firebase + React Native project
- Authentication (Email/Google/Apple login)
- Habit creation & streak logic
- ***Phase 2: Week 3–4***
- Daily/weekly/monthly streak view
- Completed logs + feed integration
- Basic accountability friends (invite & follow system)
- ***Phase 3: Week 5–6***
- Friends Activity Feed (MVP)
- Emoji reactions
- Progress tracker (weight, no sugar)
- ***Phase 4: Week 7–8***
- Polish UI with final color palette & branding
- QA, bug fixes
- App Store / Play Store submission

## 6. Future Features (Post-MVP)

- Push notifications: “Your friend just completed their streak!”
- Challenges & leaderboards
- Social comments & messaging
- Premium tier (advanced analytics, insights)

## 7. Brand & Identity

- ***Name:*** GoalStreak
- ***Tagline:*** **Stay on track. Hit your goals. Keep the streak alive.*
- ***Logo Ideas:***
- Lightning bolt streak + checkmark
- Progress bar integrated with “G”
- Simple streak flame icon