---
inclusion: always
---

# GoalStreak UI/UX Design Standards

Based on "The Basics of UI Design – V2" and the GoalStreak design system.

## Core Principles

### Visual Hierarchy
Establish clear importance through size, weight, color, and spacing — not by adding more elements.

```typescript
// ✅ Good — hierarchy through weight and color
<Text style={{ fontSize: 24, fontWeight: '700', color: '#154D71' }}>Screen Title</Text>
<Text style={{ fontSize: 16, fontWeight: '400', color: '#666666' }}>Supporting text</Text>

// ❌ Bad — hierarchy through arbitrary sizes
<Text style={{ fontSize: 26 }}>Title</Text>
<Text style={{ fontSize: 18 }}>Subtitle</Text>
<Text style={{ fontSize: 15 }}>Body</Text>
```

**Rules:**
- Use the 5-size type scale only: 12, 14, 16, 20, 24
- Differentiate with weight (400–700) and color, not more sizes
- Primary content uses `#154D71`, secondary uses `#666666`
- CTAs use `#B771E5` (purple accent)

### Consistency
Every screen must feel like it belongs to the same app.

- Same spacing rhythm (8pt grid) across all screens
- Same color palette — no one-off hex values
- Same component patterns — cards, buttons, lists look identical everywhere
- Import from `theme.ts`, never hardcode design values

### Alignment & Grid
All elements sit on the 8pt grid. No exceptions.

```typescript
// ✅ Good — 8pt multiples
padding: 16,        // 8 × 2
marginBottom: 24,   // 8 × 3
gap: 8,             // 8 × 1
minHeight: 56,      // 8 × 7

// ❌ Bad — arbitrary values
padding: 15,
marginBottom: 22,
gap: 10,
minHeight: 50,
```

## Typography

### The 5-Size Scale

| Token | Size | Weight | Use |
|-------|------|--------|-----|
| heading | 24px | Bold (700) | Screen titles |
| subheading | 20px | Semibold (600) | Section headers, card titles |
| body | 16px | Regular (400) | All standard content |
| caption | 14px | Regular (400) | Secondary info, labels |
| small | 12px | Regular (400) | Disclaimers only |

### Font Family
Montserrat throughout. Use `Typography.fontFamily` from theme.

### Line Height
- Headers: 1.2 (tight)
- Body: 1.5 (normal)
- Long-form: 1.6 (relaxed)

## Color System

### Primary Palette
```
#154D71  — Primary text, icons, dark blue
#FDFDFD  — Background
#B771E5  — Purple accent (CTAs, highlights)
#4A90A4  — Teal (success, completed states)
#666666  — Secondary text
#E8E8E8  — Borders, dividers
#FFFFFF  — Card surfaces
```

### Category Colors (6 categories)
```
Fitness:      #B771E5 (Purple)
Wellness:     #48B3AF (Teal)
Nutrition:    #A7E399 (Green)
Social:       #3C3D37 (Charcoal)
Productivity: #003161 (Navy)
Other:        #FF9013 (Orange)
```

### Color Usage Rules
- Never introduce new colors — use the palette
- Semantic colors: success = `#4A90A4`, error = `#FF4444`
- Backgrounds for categories use lightened variants from `getCategoryBackgroundColor()`
- Sufficient contrast: dark text on light backgrounds, always

## Spacing & Layout

### Spacing Scale
| Token | Value | When to use |
|-------|-------|-------------|
| tight | 8px | Icon + label pairs, tightly coupled elements |
| base | 16px | Related content (title/subtitle, most common) |
| comfortable | 24px | Section breaks within a card |
| loose | 32px | Major section dividers |
| spacious | 48px | Screen-level sections |

### Screen Margins
- Standard: 16px horizontal
- Large screens: 24px horizontal

### Card Recipe
```typescript
{
  marginHorizontal: 16,       // Outer margin
  padding: 16,                // Inner padding (24 for large cards)
  titleMarginBottom: 16,      // Title → description
  descriptionMarginBottom: 24, // Description → CTA
  borderRadius: 16,
}
```

### Internal ≤ External Rule
Padding inside an element must be ≤ margin around it.

```typescript
// ✅ padding (16) ≤ margin (24)
<View style={{ padding: 16, margin: 24 }} />

// ❌ padding (24) > margin (16)
<View style={{ padding: 24, margin: 16 }} />
```

## Touch Targets & Interaction (Fitts's Law)

**Bigger + closer = easier + faster.**

### Minimum Sizes
| Element | Min | Recommended | Optimal |
|---------|-----|-------------|---------|
| Primary button | 48px | 56px | 64px |
| Secondary button | 44px | 48px | 56px |
| Icon (standalone) | 44px | 48px | 56px |
| List item | 48px | 56px | 64px |
| Tab bar item | 48px | 56px | 64px |

### Placement
- Important actions go near the bottom (thumb zone)
- Floating actions: bottom-right corner
- Minimum 16px gap between interactive elements
- Never place destructive actions next to confirm actions without spacing

### Button Patterns
```typescript
primaryButton: {
  minHeight: 56,           // 8 × 7
  paddingVertical: 16,
  paddingHorizontal: 24,
  borderRadius: 12,
}
```

## Reducing Cognitive Load

### Hick's Law — Fewer choices = faster decisions
- Max 3–7 primary options per screen
- Use progressive disclosure (collapsible sections)
- Most common action (80%) gets prominence; rest goes in menus
- Smart defaults reduce required decisions

### Miller's Law — Working memory holds 7 ± 2 items
- Limit groups to 5–7 items
- Chunk related content with headings and spacing
- Complex/new content: 3–5 items per chunk
- Use pagination or "View All" for longer lists

### Jakob's Law — Users prefer familiar patterns
- Standard bottom tab navigation
- Universal icons (home, search, settings, person)
- Platform-native gestures (swipe to delete, pull to refresh)
- Only break conventions when the improvement justifies the learning curve

## Engagement & Motivation (Zeigarnik Effect)

**Incomplete tasks create psychological tension that motivates completion.**

### Progress Indicators
- Show completion percentages: "5/7 days this week"
- Use progress bars and circular indicators
- Display streak counts with "beat your record" messaging

### Gamification
- Streaks, points, badges, levels
- "150 points to next level!" creates pull
- Achievement progress: "2 more days to earn badge"

### Auto-Save
- Save form progress automatically
- Let users resume where they left off
- Never show "progress will be lost" warnings

### Gentle Reminders
- Helpful, not pushy
- Once per day max
- Always dismissible
- Timed to user's typical activity window

## Component Standards

### Cards
```typescript
{
  backgroundColor: '#FFFFFF',
  borderRadius: 16,
  padding: 16,
  marginBottom: 24,
  ...Shadows.sm,  // subtle elevation
}
```

### Lists
```typescript
{
  paddingVertical: 16,
  paddingHorizontal: 24,
  minHeight: 56,
  borderBottomWidth: 1,
  borderBottomColor: '#E8E8E8',
}
```

### Forms
- Labels above inputs
- Required fields marked with *
- Error states in red (#FF4444)
- Success states in teal (#4A90A4)
- Group related fields with section headings
- Break long forms into steps

## Accessibility

- All interactive elements ≥ 48px touch target
- Color is never the only indicator — pair with icons or text
- Sufficient contrast ratios (4.5:1 for body text)
- Screen reader labels on all interactive elements
- Test on actual devices, not just simulators

## Quick Decision Guide

**Before styling anything:**
1. Is the value from `theme.ts`? → Use the import
2. Is the spacing an 8pt multiple? → If not, round to nearest
3. Is the touch target ≥ 48px? → If not, increase it
4. Does this screen match existing screens? → If not, align it
5. Are there more than 7 options visible? → Chunk or hide extras

**Before adding a new component:**
1. Can an existing component handle this with a prop variant?
2. Does the pattern already exist elsewhere in the app?
3. Will this create visual inconsistency?

## Implementation Reference

Always import from theme:
```typescript
import { Colors, Typography, Spacing, Layout } from '../constants/theme';
```

Add 8pt comments for clarity:
```typescript
paddingTop: 96,              // 8 × 12
marginBottom: Spacing.base,  // 16px
minHeight: 56,               // 8 × 7 (touch target)
```

---

**Source**: "The Basics of UI Design – V2" adapted for GoalStreak's React Native + Expo stack.
**Design System**: See `GoalStreakApp/docs/DESIGN_SYSTEM.md` for full documentation.
**Theme Constants**: See `GoalStreakApp/src/constants/theme.ts` for implementation values.
