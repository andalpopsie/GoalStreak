# GoalStreak Design System

## Overview

GoalStreak follows industry-standard design principles with an 8pt grid system and simplified font scale for a clean, professional mobile UI.

## 🎨 Typography

### Simplified Font Scale (5 Sizes)

Use font **weight** and **color** for hierarchy, not more sizes.

| Name | Size | Usage | Weight |
|------|------|-------|--------|
| **Heading** | 24px | Screen titles, primary headers | Bold (700) |
| **Subheading** | 20px | Section headers, card titles | Semibold (600) |
| **Body** | 16px | All standard readable content | Regular (400) |
| **Caption** | 14px | Secondary info, labels | Regular (400) |
| **Small** | 12px | Disclaimers only (use sparingly) | Regular (400) |

### Font Weights

| Weight | Value | Usage |
|--------|-------|-------|
| Regular | 400 | Body text |
| Medium | 500 | Subtle emphasis |
| Semibold | 600 | Section headers |
| Bold | 700 | Primary headers, CTAs |

### Line Heights

| Name | Value | Usage |
|------|-------|-------|
| Tight | 1.2 | Headers |
| Normal | 1.5 | Body text (improved readability) |
| Relaxed | 1.6 | Long-form content |

### Examples

```typescript
// ✅ Good - Use weight for hierarchy
<Text style={{ fontSize: 24, fontWeight: '700' }}>Title</Text>
<Text style={{ fontSize: 24, fontWeight: '600' }}>Subtitle</Text>

// ❌ Bad - Don't create more sizes
<Text style={{ fontSize: 22 }}>Title</Text>
<Text style={{ fontSize: 26 }}>Bigger Title</Text>
```

## 📏 Spacing (4px Base Grid → 8, 16, 24, 32)

All spacing should be **multiples of 4px** (preferably 8px) for consistency across screen sizes.

### Primary Spacing Scale

| Name | Value | Usage |
|------|-------|-------|
| **Tight** | 8px | Icon + label pairs, tightly coupled UI elements |
| **Base** | 16px | Related content pairs (title/subtitle, button/helper text) |
| **Comfortable** | 24px | Moderate section breaks within a card |
| **Loose** | 32px | Major section dividers (top padding, hero blocks) |
| **Spacious** | 48px | Major page sections, screen padding |

### Screen Margins

| Type | Value | Usage |
|------|-------|-------|
| Standard | 16px | Mobile devices (most common) |
| Large | 24px | Tablets, larger screens |

### Card Layout Recipe

Standard card structure following mobile best practices:

```typescript
card: {
  marginHorizontal: 16,        // Outer margin from screen edge
  padding: 16,                 // Inner padding (use 24 for larger cards)
  
  // Internal spacing
  titleMarginBottom: 16,       // Title → Description
  descriptionMarginBottom: 24, // Description → Price/Value
  priceMarginBottom: 24,       // Price → CTA Button
  ctaMarginBottom: 16,         // CTA → Footer note
}
```

### Internal ≤ External Rule

**Padding inside elements should be ≤ margin around them**

```typescript
// ✅ Good
<View style={{ padding: 16, margin: 24 }}>  // 16 ≤ 24

// ❌ Bad
<View style={{ padding: 24, margin: 16 }}>  // 24 > 16
```

### Examples

```typescript
// ✅ Good - Use 8pt multiples
paddingVertical: 16,    // 8 * 2
marginBottom: 24,       // 8 * 3
gap: 8,                 // 8 * 1

// ❌ Bad - Arbitrary values
paddingVertical: 15,
marginBottom: 22,
gap: 10,
```

> 📖 **Detailed Guide**: See `.kiro/steering/spacing-standards.md` for comprehensive spacing patterns and examples

## 🧠 Hick's Law - Simplifying Choices

### Hick's Law Principle
**"The more choices you give people, the longer they take to decide."**

Hick's Law states that decision time increases logarithmically with the number of options:
- **More options** → Longer decision time → User confusion → Overwhelm → Abandonment
- **Fewer options** → Faster decisions → Clear path forward → Better UX

**Impact on UX:**
- Too many choices cause analysis paralysis
- Users feel stressed and may leave without taking action
- Simple, focused interfaces lead to higher completion rates

### Hick's Law Best Practices

#### 1. Limit Choices
```typescript
// ✅ Good - 3-5 primary options
mainActions: {
  options: [
    'Create Habit',
    'View Progress', 
    'Social Feed'
  ]
  // Clear, focused choices
}

// ❌ Bad - Too many options at once
overwhelmingMenu: {
  options: [
    'Create', 'Edit', 'Delete', 'Share', 'Export',
    'Import', 'Settings', 'Help', 'About', 'Feedback',
    'Rate Us', 'Invite Friends', 'Premium'
  ]
  // 13 options = decision paralysis
}
```

#### 2. Use Categories & Grouping
```typescript
// ✅ Good - Organized into logical groups
settingsScreen: {
  sections: [
    {
      title: 'App Settings',
      items: ['Dark Mode', 'Sound Effects']
    },
    {
      title: 'Notifications', 
      items: ['Daily Reminder', 'New Releases']
    },
    {
      title: 'Account',
      items: ['Profile Information', 'Privacy']
    }
  ]
  // Grouped by category = easier to scan
}

// ❌ Bad - Flat list of all options
flatSettings: {
  items: [
    'Dark Mode', 'Sound', 'Reminder', 'Releases',
    'Profile', 'Privacy', 'Language', 'Storage',
    'Backup', 'Security', 'Help', 'About'
  ]
  // No organization = cognitive overload
}
```

#### 3. Progressive Disclosure
```typescript
// ✅ Good - Show main actions, hide advanced options
habitCreation: {
  visible: [
    'Habit Name',
    'Category',
    'Create Button'
  ],
  collapsible: [
    'Icon Selection',
    'Timer Settings',
    'Reminder Options',
    'Privacy Settings'
  ]
  // Essential first, advanced hidden until needed
}

// ✅ Good - "More Options" pattern
cardActions: {
  primary: ['Complete', 'Skip'],
  secondary: ['Edit', 'Delete', 'Share'], // Hidden in menu
  // Most common actions visible, others accessible
}

// ❌ Bad - Everything visible at once
allOptions: {
  visible: [
    'Name', 'Category', 'Icon', 'Color', 'Timer',
    'Reminder', 'Privacy', 'Tags', 'Notes', 'Goal',
    'Frequency', 'Duration', 'Difficulty'
  ]
  // Overwhelming = users abandon form
}
```

#### 4. Prioritize Common Actions
```typescript
// ✅ Good - Most-used actions prominent
habitCard: {
  primaryAction: 'Complete Habit',     // 80% of interactions
  secondaryActions: {                   // 20% of interactions
    menu: ['Edit', 'Delete', 'Share']
  }
  // Follow 80/20 rule
}

// ✅ Good - Smart defaults reduce choices
createHabit: {
  defaults: {
    frequency: 'daily',      // Most common
    category: 'fitness',     // Most popular
    privacy: 'private'       // Safest default
  }
  // Users can change, but don't have to decide everything
}
```

### Implementation Patterns

#### Collapsible Sections (GoalStreak Example)
```typescript
// ✅ Excellent - CreateHabitScreen implementation
const [isCategoryExpanded, setIsCategoryExpanded] = useState(false);
const [isIconExpanded, setIsIconExpanded] = useState(false);
const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

// Shows: Name input + collapsed sections
// User expands only what they need
// Reduces initial cognitive load from ~15 fields to 3
```

#### Tabbed Navigation
```typescript
// ✅ Good - Organize related content
tabs: {
  items: ['Overview', 'Details', 'History'],
  // 3-5 tabs maximum
  // Related content grouped together
}

// ❌ Bad - Too many tabs
tooManyTabs: {
  items: ['Tab1', 'Tab2', 'Tab3', 'Tab4', 'Tab5', 'Tab6', 'Tab7'],
  // More than 5 tabs = hard to scan
}
```

#### Stepped Forms
```typescript
// ✅ Good - Break complex forms into steps
onboarding: {
  steps: [
    { title: 'Welcome', fields: 1 },
    { title: 'Profile', fields: 3 },
    { title: 'Preferences', fields: 4 }
  ]
  // One step at a time = less overwhelming
}

// ❌ Bad - All fields on one screen
longForm: {
  fields: 15,  // All at once = abandonment
}
```

#### Smart Filtering
```typescript
// ✅ Good - Reduce visible options dynamically
habitList: {
  filters: ['All', 'Active', 'Completed'],
  search: true,
  // Users see only relevant habits
}

// ✅ Good - Contextual options
habitActions: {
  active: ['Complete', 'Skip', 'Edit'],
  completed: ['Undo', 'View Stats'],
  // Different options based on state
}
```

### Decision Time Formula

**Hick's Law Formula:** `T = b × log₂(n + 1)`
- T = Time to make decision
- n = Number of choices
- b = Constant (varies by task)

**Practical Impact:**
- 2 choices: ~1 second
- 4 choices: ~2 seconds  
- 8 choices: ~3 seconds
- 16 choices: ~4 seconds

**Takeaway:** Doubling choices doesn't double time, but still adds friction.

### GoalStreak Applications

#### ✅ Already Following Hick's Law
1. **CreateHabitScreen** - Collapsible sections reduce initial choices
2. **Tab Navigation** - 4 main tabs (Habits, Social, Analytics, Profile)
3. **Habit Categories** - 6 categories (manageable, not overwhelming)
4. **Card Actions** - Primary action prominent, secondary in menu

#### 🎯 Opportunities to Apply
1. **Settings Screen** - Group into categories (App, Notifications, Account)
2. **Habit Templates** - Show 6-8 popular templates, hide rest in "More"
3. **Filter Options** - Limit to 3-5 most useful filters
4. **Notification Settings** - Group related settings, use progressive disclosure

### Testing Checklist

- [ ] No screen has more than 7 primary options
- [ ] Related options grouped into categories
- [ ] Advanced features hidden until needed
- [ ] Most common actions (80%) are prominent
- [ ] Less common actions (20%) accessible but not cluttering
- [ ] Forms broken into logical steps or sections
- [ ] Smart defaults reduce required decisions
- [ ] Users can complete primary tasks in 3 taps or less

### Examples from GoalStreak

```typescript
// ✅ Excellent - Collapsible category selection
<TouchableOpacity onPress={() => setIsCategoryExpanded(!isCategoryExpanded)}>
  <View>
    <Text>Category</Text>
    <Text>{selectedCategory}</Text>
  </View>
</TouchableOpacity>

{isCategoryExpanded && (
  <View>
    {categories.map(renderCategory)}  // 6 categories
  </View>
)}
// Reduces initial choices from 6 to 1 (current selection)
```

## 🎯 Touch Targets & Fitts's Law

### Fitts's Law Principle
**"The bigger and closer a button is, the easier and faster it is to tap."**

Fitts's Law states that the time to acquire a target is a function of:
- **Size**: Larger targets are easier to hit
- **Distance**: Closer targets are faster to reach

**Impact on UX:**
- Small or distant buttons → Harder to use → User frustration → App abandonment
- Large, well-placed buttons → Faster interaction → Smoother experience → Higher engagement

### Touch Target Sizes

| Element | Minimum | Recommended | Optimal |
|---------|---------|-------------|---------|
| Primary Buttons | 48px | 56px | 64px |
| Secondary Buttons | 44px | 48px | 56px |
| Icons (standalone) | 44px | 48px | 56px |
| Icons with labels | 40px icon | 48px total | 56px total |
| List items | 48px | 56px | 64px |
| Tab bar items | 48px | 56px | 64px |

### Fitts's Law Best Practices

#### 1. Make Buttons Large
```typescript
// ✅ Excellent - Large, easy to tap
primaryButton: {
  minHeight: 64,           // 8 * 8 (optimal)
  paddingVertical: 20,     // Generous padding
  paddingHorizontal: 32,   // Wide touch area
}

// ✅ Good - Adequate size
secondaryButton: {
  minHeight: 56,           // 8 * 7 (recommended)
  paddingVertical: 16,     // Good padding
  paddingHorizontal: 24,   // Comfortable width
}

// ❌ Bad - Too small
tinyButton: {
  height: 32,              // Too small for fingers
  padding: 8,              // Insufficient touch area
}
```

#### 2. Use Icons with Text Labels
```typescript
// ✅ Good - Icon + label increases tap area
iconButton: {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 56,           // Large tap area
  paddingHorizontal: 16,
  gap: 8,                  // Icon-text spacing
}

// Icon: 24px + Label text = ~56px total height
// Easier to understand AND larger tap target
```

#### 3. Position Important Buttons Strategically
```typescript
// ✅ Good - Bottom placement (thumb-friendly)
bottomActions: {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 16,
  // Easy to reach without stretching
}

// ✅ Good - Edge placement for quick access
floatingAction: {
  position: 'absolute',
  bottom: 24,
  right: 24,
  // Within natural thumb zone
}

// ❌ Bad - Top center (hard to reach on large phones)
topCenterButton: {
  position: 'absolute',
  top: 100,
  alignSelf: 'center',
  // Requires stretching or two-handed use
}
```

#### 4. Maintain Adequate Spacing
```typescript
// ✅ Good - Clear separation prevents mis-taps
buttonGroup: {
  gap: 16,                 // Clear space between buttons
  padding: 16,             // Space from edges
}

// ❌ Bad - Too close together
crammedButtons: {
  gap: 4,                  // Easy to tap wrong button
  padding: 4,              // No breathing room
}
```

### Mobile Thumb Zones

**Easy to Reach (Green Zone):**
- Bottom third of screen
- Center area
- Natural thumb arc

**Stretch Required (Yellow Zone):**
- Top corners
- Far edges
- Requires hand repositioning

**Hard to Reach (Red Zone):**
- Top center
- Opposite top corner
- Requires two hands

### Implementation Examples

```typescript
// Primary CTA - Maximum accessibility
primaryCTA: {
  minHeight: 64,              // 8 * 8 (optimal size)
  paddingVertical: 20,        // Generous vertical padding
  paddingHorizontal: 32,      // Wide horizontal padding
  borderRadius: 16,           // Rounded for visual appeal
  marginHorizontal: 16,       // Screen edge spacing
  marginBottom: 24,           // Bottom spacing
  // Result: Large, easy-to-tap button
}

// Icon button with label
iconButtonWithLabel: {
  flexDirection: 'row',
  alignItems: 'center',
  minHeight: 56,              // 8 * 7 (recommended)
  paddingVertical: 16,
  paddingHorizontal: 16,
  gap: 8,                     // Icon-text spacing
  // Icon (24px) + Text = larger tap area
}

// List item - Full width tap area
listItem: {
  minHeight: 64,              // 8 * 8 (comfortable)
  paddingVertical: 16,
  paddingHorizontal: 24,
  flexDirection: 'row',
  alignItems: 'center',
  // Entire row is tappable
}

// Tab bar item - Bottom navigation
tabBarItem: {
  flex: 1,
  minHeight: 64,              // 8 * 8 (easy to reach)
  justifyContent: 'center',
  alignItems: 'center',
  // Bottom placement + large size = optimal
}
```

### Testing Checklist

- [ ] All primary buttons ≥ 56px height
- [ ] All interactive elements ≥ 48px touch area
- [ ] Buttons have adequate spacing (≥ 16px)
- [ ] Important actions near bottom/edges
- [ ] Icons paired with text labels where possible
- [ ] Tested on actual device (not just simulator)
- [ ] Comfortable for one-handed use
- [ ] No accidental taps during testing

## 🎨 Colors

### Primary Palette

```typescript
primaryText: '#154D71'    // Dark blue for text
background: '#FDFDFD'     // Light gray background
accent1: '#B771E5'        // Purple primary accent
accent2: '#154D71'        // Dark blue secondary
accent3: '#4A90A4'        // Teal for completed states
```

### Usage

- **Primary Text**: All body text, headers
- **Accent1**: CTAs, primary actions, highlights
- **Accent2**: Secondary actions, icons
- **Accent3**: Success states, completed items

## 📦 Components

### Cards

```typescript
card: {
  backgroundColor: Colors.white,
  borderRadius: 16,           // 8 * 2
  padding: 16,                // Base spacing
  marginBottom: 24,           // Comfortable spacing
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 8,
  elevation: 3,
}
```

### Buttons

```typescript
button: {
  paddingVertical: 16,        // 8 * 2
  paddingHorizontal: 24,      // Comfortable
  borderRadius: 12,
  minHeight: 56,              // 8 * 7 (touch target)
}
```

### Lists

```typescript
listItem: {
  paddingVertical: 16,        // Base spacing
  paddingHorizontal: 24,      // Comfortable
  minHeight: 56,              // Touch target
  borderBottomWidth: 1,
  borderBottomColor: Colors.gray.light,
}
```

## 📐 Layout

### Screen Structure

```typescript
screen: {
  paddingHorizontal: 16,      // Screen margin
  paddingTop: 64,             // 8 * 8
  paddingBottom: 120,         // 8 * 15
}
```

### Vertical Rhythm

```typescript
// Between list items
marginBottom: 16,             // Base

// Between sections
marginBottom: 24,             // Comfortable

// Between major sections
marginBottom: 32,             // Loose

// Screen sections
marginBottom: 48,             // Spacious
```

## ✅ Best Practices

### Do's

✅ Use the 5-size font scale
✅ Use weight and color for hierarchy
✅ Use 8pt grid for all spacing
✅ Ensure 48px+ touch targets
✅ Follow internal ≤ external rule
✅ Test on actual devices

### Don'ts

❌ Create custom font sizes
❌ Use arbitrary spacing values
❌ Make touch targets < 44px
❌ Use padding > margin
❌ Rely on desktop preview only

## 🔧 Implementation

### Using the Theme

```typescript
import { Colors, Typography, Spacing } from '../constants/theme';

const styles = StyleSheet.create({
  title: {
    fontSize: Typography.fontSize.heading,      // 24px
    fontWeight: Typography.fontWeight.bold,     // 700
    color: Colors.primaryText,
    marginBottom: Spacing.tight,                // 8px
  },
  container: {
    padding: Spacing.base,                      // 16px
    gap: Spacing.tight,                         // 8px
  },
  button: {
    paddingVertical: 16,                        // 8 * 2
    paddingHorizontal: Spacing.comfortable,     // 24px
    minHeight: 56,                              // 8 * 7
  },
});
```

### Inline Comments

Add comments showing 8pt multiples for clarity:

```typescript
paddingTop: 96,              // 8 * 12
marginBottom: Spacing.base,  // 16px
minHeight: 56,               // 8 * 7 (touch target)
```

## 📱 Mobile Considerations

### Breathing Room

Mobile apps need **more space** than desktop:
- Increase padding by 1.5x for mobile
- Use 16px minimum screen margins
- Add 48px+ between major sections

### Testing

Always test on actual devices:
- What looks spacious on desktop feels cramped on 5" phone
- Touch targets feel smaller on device
- Text readability differs on small screens

## 📊 Before & After

### Before (Inconsistent)

```typescript
// Multiple font sizes
fontSize: 18, 19, 21, 22, 23, 25

// Arbitrary spacing
padding: 15, 18, 22, 27

// Small touch targets
height: 36, 40, 42
```

### After (8pt Grid)

```typescript
// Simplified font scale
fontSize: 12, 14, 16, 20, 24

// 8pt grid spacing
padding: 8, 16, 24, 32, 48

// Proper touch targets
minHeight: 48, 56, 64
```

## 🎯 Results

- ✅ Cleaner, more professional UI
- ✅ Better visual hierarchy
- ✅ Easier to maintain
- ✅ Consistent across screens
- ✅ Better mobile usability
- ✅ Follows industry standards

---

**Last Updated**: January 2025
**Status**: ✅ Active Design System
