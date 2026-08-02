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

> 📖 **Detailed Guide**: See `.kiro/steering/uiux-design-standards.md` for comprehensive spacing patterns and examples

## 🎯 Zeigarnik Effect - Leveraging Incomplete Tasks

### Zeigarnik Effect Principle
**"People remember incomplete tasks better than completed ones."**

The Zeigarnik Effect states that the brain keeps thinking about unfinished tasks:
- **Incomplete tasks** → Mental tension → Desire to complete → Return to app
- **Progress indicators** → Motivation to finish → Higher engagement → Better retention

**Impact on UX:**
- Unfinished tasks create psychological tension (in a good way)
- Progress visualization motivates completion
- Saved progress reduces friction for returning users
- Gentle reminders bring users back without annoyance

### Zeigarnik Effect Best Practices

#### 1. Show Progress Indicators
```typescript
// ✅ Good - Visual progress creates desire to complete
habitStreak: {
  current: 5,
  goal: 7,
  display: '5/7 days',
  progressBar: 71,              // 5/7 = 71%
  message: 'Only 2 more days to reach your weekly goal!',
  // Creates tension to complete
}

onboarding: {
  steps: [
    { title: 'Welcome', completed: true },
    { title: 'Create Habit', completed: true },
    { title: 'Set Reminder', completed: false },
  ],
  progress: '2/3',
  // User wants to finish that last step
}

// ❌ Bad - No progress indication
noProgress: {
  status: 'In Progress',
  // No motivation to complete
}
```

#### 2. Use Gamification Elements
```typescript
// ✅ Good - Points, badges, levels create goals
gamification: {
  points: {
    current: 850,
    nextMilestone: 1000,
    message: '150 points to next level!',
  },
  badges: {
    earned: 5,
    available: 12,
    next: 'Complete 7-day streak',
  },
  level: {
    current: 3,
    progress: 85,               // 85% to level 4
    message: 'Almost level 4!',
  }
  // Multiple incomplete goals = engagement
}

// ✅ Good - Streak tracking (GoalStreak!)
streak: {
  current: 12,
  best: 15,
  message: 'Only 3 days to beat your record!',
  // Psychological pull to continue
}

// ❌ Bad - No gamification
plain: {
  status: 'Active',
  // No motivation or goals
}
```

#### 3. Save Progress Automatically
```typescript
// ✅ Good - Auto-save reduces friction
formProgress: {
  autoSave: true,
  saveInterval: 2000,           // Save every 2 seconds
  savedFields: ['name', 'category', 'icon'],
  message: 'Progress saved',
  // Users can leave and return easily
}

habitCreation: {
  draft: {
    name: 'Morning Meditation',
    category: 'Wellness',
    savedAt: Date.now(),
  },
  restoreOnReturn: true,
  // No need to start over
}

// ❌ Bad - No save, must complete in one session
noSave: {
  warning: 'Progress will be lost if you leave',
  // Creates anxiety, not motivation
}
```

#### 4. Send Gentle Reminders
```typescript
// ✅ Good - Helpful, not annoying
reminder: {
  type: 'incomplete_habit',
  message: 'You\'re on a 5-day streak! Don\'t break it today.',
  timing: 'evening',            // When user usually completes
  frequency: 'once_per_day',
  dismissible: true,
  // Gentle nudge to complete
}

notification: {
  title: 'Almost there!',
  body: 'Complete 2 more habits to reach your daily goal',
  action: 'Open App',
  // Reminds of incomplete task
}

// ❌ Bad - Annoying, pushy
spammy: {
  frequency: 'every_hour',
  dismissible: false,
  message: 'COMPLETE YOUR HABITS NOW!!!',
  // Creates resentment, not motivation
}
```

#### 5. Break Large Tasks into Steps
```typescript
// ✅ Good - Multi-step process shows progress
onboarding: {
  steps: [
    { id: 1, title: 'Create Account', status: 'complete' },
    { id: 2, title: 'Add First Habit', status: 'complete' },
    { id: 3, title: 'Set Reminder', status: 'current' },
    { id: 4, title: 'Invite Friends', status: 'pending' },
  ],
  currentStep: 3,
  totalSteps: 4,
  progress: 75,                 // 3/4 = 75%
  // Clear path to completion
}

// ✅ Good - Checklist creates completion desire
setupChecklist: {
  items: [
    { task: 'Add profile picture', done: true },
    { task: 'Create first habit', done: true },
    { task: 'Complete first day', done: false },
    { task: 'Invite a friend', done: false },
  ],
  completed: 2,
  total: 4,
  // Users want to check off remaining items
}

// ❌ Bad - One big task, no progress
bigTask: {
  title: 'Complete Setup',
  status: 'In Progress',
  // No sense of progress
}
```

### Implementation Patterns

#### Progress Bars
```typescript
// ✅ Good - Visual progress indicator
<View style={styles.progressContainer}>
  <Text>5/7 days this week</Text>
  <View style={styles.progressBar}>
    <View style={[styles.progressFill, { width: '71%' }]} />
  </View>
  <Text>2 more days to reach your goal!</Text>
</View>
// Creates desire to fill that bar
```

#### Streak Counters
```typescript
// ✅ Good - Streak visualization (GoalStreak!)
<View style={styles.streakCard}>
  <Text style={styles.streakNumber}>12</Text>
  <Text>Day Streak</Text>
  <Text style={styles.record}>Best: 15 days</Text>
  <Text style={styles.motivation}>
    Keep going! Only 3 days to beat your record!
  </Text>
</View>
// Psychological pull to continue streak
```

#### Step Indicators
```typescript
// ✅ Good - Multi-step progress
<View style={styles.stepIndicator}>
  {steps.map((step, index) => (
    <View key={index} style={styles.step}>
      <View style={[
        styles.stepCircle,
        step.completed && styles.stepCompleted,
        step.current && styles.stepCurrent,
      ]}>
        {step.completed ? '✓' : index + 1}
      </View>
      {index < steps.length - 1 && (
        <View style={[
          styles.stepLine,
          step.completed && styles.lineCompleted
        ]} />
      )}
    </View>
  ))}
</View>
// Shows progress and what's left
```

#### Completion Percentage
```typescript
// ✅ Good - Percentage creates urgency
<View style={styles.completionCard}>
  <CircularProgress
    percentage={85}
    size={120}
    strokeWidth={12}
  />
  <Text>85% Complete</Text>
  <Text>Just 15% more to finish!</Text>
</View>
// So close! Must complete!
```

### GoalStreak Applications

#### ✅ Already Using Zeigarnik Effect
1. **Streak Tracking** - Shows current streak, creates desire to continue
2. **Progress Circles** - Visual completion indicators
3. **Daily Goals** - Incomplete habits create tension to complete
4. **Onboarding Steps** - 3-step process shows progress
5. **Milestone Celebrations** - Acknowledges completion, sets new goals

#### 🎯 Opportunities to Enhance
1. **Weekly Goals** - "4/7 habits completed this week"
2. **Profile Completion** - "Your profile is 60% complete"
3. **Achievement Progress** - "2 more days to earn 7-day streak badge"
4. **Friend Challenges** - "You're ahead by 3 habits!"
5. **Monthly Streaks** - "15/30 days completed this month"

### Psychological Balance

#### ✅ Good - Motivating, Not Stressful
```typescript
motivation: {
  tone: 'encouraging',
  message: 'You\'re doing great! Keep it up!',
  frequency: 'appropriate',
  dismissible: true,
  // Positive reinforcement
}
```

#### ❌ Bad - Creates Anxiety
```typescript
pressure: {
  tone: 'demanding',
  message: 'You\'re falling behind!',
  frequency: 'constant',
  dismissible: false,
  // Negative pressure
}
```

### Testing Checklist

- [ ] Progress indicators show completion percentage
- [ ] Streaks and goals create desire to continue
- [ ] Progress is saved automatically
- [ ] Users can resume where they left off
- [ ] Reminders are helpful, not annoying
- [ ] Large tasks broken into visible steps
- [ ] Gamification elements motivate without pressure
- [ ] Completion feels rewarding
- [ ] Incomplete tasks are visible but not stressful
- [ ] Users return to complete unfinished tasks

### Examples from GoalStreak

```typescript
// ✅ Excellent - Streak tracking creates Zeigarnik Effect
<HabitCard
  habit={habit}
  streak={12}
  bestStreak={15}
  message="3 days to beat your record!"
/>
// Creates psychological pull to continue

// ✅ Good - Progress circle shows incomplete task
<CircularProgress
  percentage={habit.completedToday ? 100 : 0}
  size={80}
/>
// Incomplete circle creates desire to complete

// ✅ Good - Onboarding progress
<OnboardingScreen
  currentStep={2}
  totalSteps={3}
  progress={67}
/>
// Users want to finish that last step

// 🎯 Opportunity - Weekly progress
<WeeklyProgress
  completed={4}
  total={7}
  message="Complete 3 more habits to reach your weekly goal!"
/>
// Creates motivation to complete week
```

### Zeigarnik Effect + Other Laws

**Combined with Miller's Law:**
- Miller's Law: Break into 5-7 chunks
- Zeigarnik Effect: Show progress through chunks
- Result: Manageable steps with clear progress

**Combined with Gamification:**
- Gamification: Points, badges, levels
- Zeigarnik Effect: Incomplete achievements motivate
- Result: Engaging progression system

## 🧮 Miller's Law - Chunking Information

### Miller's Law Principle
**"The average person can only hold 7 (±2) items in working memory at once."**

Miller's Law states that short-term memory has limited capacity:
- **Too much information** → Cognitive overload → Confusion → Abandonment
- **Chunked information** → Easier processing → Better comprehension → Higher completion

**Impact on UX:**
- Users can't process everything at once
- Grouping related items reduces cognitive load
- Breaking content into chunks improves scanning and understanding

### The Magic Number: 7 ± 2

**Working Memory Capacity:**
- **5-9 items** - Maximum most people can hold
- **7 items** - The sweet spot for most users
- **3-5 items** - Optimal for complex or unfamiliar content

**Why It Matters:**
- Phone numbers: 555-1234 (chunked into 3-4 digits)
- Credit cards: 1234 5678 9012 3456 (chunked into 4 groups)
- Navigation: 4-5 main tabs (not 10+)

### Miller's Law Best Practices

#### 1. Chunk Related Content
```typescript
// ✅ Good - Grouped into logical chunks
settingsScreen: {
  sections: [
    {
      title: 'App Settings',        // Chunk 1 (2 items)
      items: ['Dark Mode', 'Sound']
    },
    {
      title: 'Notifications',       // Chunk 2 (2 items)
      items: ['Daily Reminder', 'New Releases']
    },
    {
      title: 'Account',             // Chunk 3 (2 items)
      items: ['Profile', 'Privacy']
    }
  ]
  // 3 chunks of 2 items = Easy to process
}

// ❌ Bad - Flat list of 12 items
flatList: {
  items: [
    'Dark Mode', 'Sound', 'Reminder', 'Releases',
    'Profile', 'Privacy', 'Language', 'Storage',
    'Backup', 'Security', 'Help', 'About'
  ]
  // 12 items = Cognitive overload
}
```

#### 2. Use Visual Grouping
```typescript
// ✅ Good - Visual separation between chunks
form: {
  personalInfo: {
    heading: 'Personal Information',
    spacing: 24,                    // Space before section
    fields: ['Name', 'Email', 'Phone'],
    marginBottom: 32,               // Space after section
  },
  preferences: {
    heading: 'Preferences',
    spacing: 24,
    fields: ['Language', 'Timezone'],
    marginBottom: 32,
  }
  // Clear visual chunks
}

// ❌ Bad - No visual grouping
crammedForm: {
  fields: [
    'Name', 'Email', 'Phone', 'Language',
    'Timezone', 'Notifications', 'Privacy'
  ],
  spacing: 8,                       // Minimal spacing
  // All fields blur together
}
```

#### 3. Limit Items Per Group
```typescript
// ✅ Good - 3-5 items per group
navigation: {
  mainTabs: ['Home', 'Social', 'Analytics', 'Profile'],
  // 4 tabs = Easy to remember
}

categoryList: {
  categories: [
    'Fitness', 'Wellness', 'Nutrition',
    'Social', 'Productivity', 'Other'
  ],
  // 6 categories = Manageable
}

// ❌ Bad - Too many items
overwhelmingNav: {
  tabs: [
    'Home', 'Discover', 'Social', 'Messages',
    'Notifications', 'Analytics', 'Goals',
    'Habits', 'Profile', 'Settings'
  ],
  // 10 tabs = Can't remember them all
}
```

#### 4. Use Headings & Hierarchy
```typescript
// ✅ Good - Clear hierarchy
content: {
  structure: [
    { type: 'heading', text: 'Getting Started' },
    { type: 'body', text: 'Step 1: Create account' },
    { type: 'body', text: 'Step 2: Add first habit' },
    { type: 'body', text: 'Step 3: Track progress' },
    
    { type: 'heading', text: 'Advanced Features' },
    { type: 'body', text: 'Social connections' },
    { type: 'body', text: 'Analytics dashboard' },
  ]
  // Headings create mental chunks
}

// ❌ Bad - Wall of text
textWall: {
  content: 'Create account add habit track progress...',
  // No structure = Hard to scan
}
```

#### 5. Progressive Disclosure
```typescript
// ✅ Good - Show 5-7 items, hide rest
habitList: {
  visible: 6,                       // Show 6 habits
  action: 'View All (12)',          // Access to rest
  // Manageable initial view
}

// ✅ Good - Collapsible sections (GoalStreak!)
createHabit: {
  alwaysVisible: [
    'Habit Name',                   // 1
    'Category (collapsed)',         // 2
    'Icon (collapsed)',             // 3
    'Options (collapsed)',          // 4
    'Create Button'                 // 5
  ],
  // 5 items initially = Perfect!
  expandable: {
    category: 6,                    // 6 categories when expanded
    options: 4,                     // 4 options when expanded
  }
  // Complexity revealed progressively
}
```

### Chunking Techniques

#### Phone Number Pattern
```typescript
// ✅ Good - Chunked for readability
phoneInput: {
  format: '(555) 123-4567',         // 3-3-4 pattern
  // Easier to remember and verify
}

// ❌ Bad - No chunking
flatPhone: {
  format: '5551234567',             // Hard to read
}
```

#### Card Number Pattern
```typescript
// ✅ Good - 4-digit chunks
cardInput: {
  format: '1234 5678 9012 3456',    // 4-4-4-4 pattern
  // Standard, easy to verify
}
```

#### List Pagination
```typescript
// ✅ Good - Limit items per page
list: {
  itemsPerPage: 10,                 // Manageable chunk
  pagination: true,
  // Users can process one page at a time
}

// ❌ Bad - Infinite scroll with no breaks
endlessList: {
  itemsPerPage: 100,                // Overwhelming
  // Users lose track of position
}
```

### Context-Dependent Chunking

#### For New/Complex Content
```typescript
// ✅ Good - Fewer items for complex content
onboarding: {
  stepsPerScreen: 1,                // One concept at a time
  totalSteps: 3,                    // Short onboarding
  // Don't overwhelm new users
}

tutorial: {
  conceptsPerLesson: 3,             // 3 new concepts max
  // Complex = smaller chunks
}
```

#### For Familiar Content
```typescript
// ✅ Good - More items for familiar patterns
settingsScreen: {
  itemsPerSection: 5-7,             // Users know settings
  // Familiar = can handle more
}

habitList: {
  visibleHabits: 8,                 // Users know their habits
  // Familiar content = larger chunks
}
```

### Visual Chunking with Spacing

```typescript
// ✅ Good - Use spacing to create chunks
layout: {
  withinChunk: 8,                   // Tight spacing (related items)
  betweenChunks: 24,                // Comfortable spacing (separate groups)
  betweenSections: 32,              // Loose spacing (major divisions)
  // Spacing creates visual grouping
}

// Example: Settings screen
settings: {
  appSettings: {
    items: ['Dark Mode', 'Sound'],
    itemSpacing: 8,                 // Within chunk
    sectionSpacing: 24,             // After chunk
  },
  notifications: {
    items: ['Reminder', 'Releases'],
    itemSpacing: 8,
    sectionSpacing: 24,
  }
  // Clear visual chunks through spacing
}
```

### GoalStreak Applications

#### ✅ Already Following Miller's Law
1. **Bottom Navigation** - 4 tabs (perfect!)
2. **Habit Categories** - 6 categories (within 7±2)
3. **CreateHabitScreen** - Collapsible sections reduce cognitive load
4. **Settings Groups** - Organized into logical sections
5. **Onboarding Steps** - 3 slides (manageable)

#### 🎯 Opportunities to Apply
1. **Habit List** - Show 6-8 habits initially, "View All" for more
2. **Analytics** - Group metrics into 3-4 categories
3. **Social Feed** - Paginate or limit initial items
4. **Form Fields** - Group related fields with headings

### Testing Checklist

- [ ] No more than 7 items in any single group
- [ ] Related items grouped together
- [ ] Visual spacing between chunks (24-32px)
- [ ] Headings clearly separate sections
- [ ] Complex content broken into smaller chunks (3-5 items)
- [ ] Familiar content can have larger chunks (5-7 items)
- [ ] Progressive disclosure for additional items
- [ ] Users can scan and understand quickly
- [ ] No cognitive overload during testing

### Examples from GoalStreak

```typescript
// ✅ Excellent - Bottom navigation (4 items)
<Tab.Navigator>
  <Tab.Screen name="Habits" />      // 1
  <Tab.Screen name="Social" />      // 2
  <Tab.Screen name="Analytics" />   // 3
  <Tab.Screen name="Profile" />     // 4
</Tab.Navigator>
// 4 tabs = Well within 7±2 limit

// ✅ Excellent - Collapsible sections reduce cognitive load
<View>
  <TextInput placeholder="Habit Name" />           // 1
  <CollapsibleSection title="Category" />          // 2
  <CollapsibleSection title="Icon" />              // 3
  <CollapsibleSection title="Options" />           // 4
  <Button title="Create Habit" />                  // 5
</View>
// 5 visible items initially (perfect!)
// Complexity hidden until needed

// ✅ Good - Habit categories (6 items)
categories: [
  'Fitness',      // 1
  'Wellness',     // 2
  'Nutrition',    // 3
  'Social',       // 4
  'Productivity', // 5
  'Other'         // 6
]
// 6 categories = Within optimal range

// ✅ Good - Settings grouped by category
<ScrollView>
  <Section title="App Settings">
    <Setting name="Dark Mode" />
    <Setting name="Sound Effects" />
  </Section>
  
  <Section title="Notifications">
    <Setting name="Daily Reminder" />
    <Setting name="New Releases" />
  </Section>
  
  <Section title="Account">
    <Setting name="Profile Information" />
    <Setting name="Privacy" />
  </Section>
</ScrollView>
// 3 sections, 2 items each = Easy to process
```

### Miller's Law + Other Laws

**Combined with Hick's Law:**
- Hick's Law: Limit choices to reduce decision time
- Miller's Law: Chunk choices into groups of 5-7
- Result: Fast decisions with organized options

**Combined with Jakob's Law:**
- Jakob's Law: Use familiar patterns
- Miller's Law: Group familiar patterns together
- Result: Instant recognition of organized content

## 🔄 Jakob's Law - Leveraging Familiarity

### Jakob's Law Principle
**"Users spend most of their time on other apps. They prefer your app to work the same way."**

Jakob's Law states that users transfer expectations from familiar products to new ones:
- **Familiar patterns** → Instant understanding → Comfortable experience → Higher adoption
- **Unfamiliar patterns** → Confusion → Frustration → Abandonment

**Impact on UX:**
- Users have mental models from apps they already use
- Breaking conventions requires extra cognitive effort
- Familiarity reduces learning curve and increases confidence

### Jakob's Law Best Practices

#### 1. Use Standard Patterns & Conventions
```typescript
// ✅ Good - Standard iOS/Android patterns
navigation: {
  type: 'BottomTabs',           // Familiar mobile pattern
  icons: 'Ionicons',            // Standard icon library
  placement: 'bottom',          // Expected location
  // Users know how to use this immediately
}

searchBar: {
  icon: 'search',               // Universal search icon
  placeholder: 'Search...',     // Standard placeholder
  position: 'top',              // Expected location
  // No explanation needed
}

// ❌ Bad - Unconventional patterns
weirdNavigation: {
  type: 'CircularMenu',         // Unfamiliar
  placement: 'center',          // Unexpected
  gestures: 'swipe-diagonal',   // Non-standard
  // Users will be confused
}
```

#### 2. Follow Platform Guidelines
```typescript
// ✅ Good - iOS Human Interface Guidelines
iosButton: {
  minHeight: 44,                // Apple's minimum
  borderRadius: 10,             // iOS style
  hapticFeedback: true,         // Expected feedback
  // Feels native to iOS users
}

// ✅ Good - Material Design (Android)
androidButton: {
  minHeight: 48,                // Material guideline
  elevation: 2,                 // Material shadow
  rippleEffect: true,           // Expected feedback
  // Feels native to Android users
}

// ❌ Bad - Custom that breaks conventions
customButton: {
  shape: 'hexagon',             // Unusual
  feedback: 'bounce',           // Non-standard
  // Feels foreign and confusing
}
```

#### 3. Use Familiar Icons & Symbols
```typescript
// ✅ Good - Universal icons
icons: {
  home: 'home',                 // House icon
  search: 'search',             // Magnifying glass
  settings: 'settings',         // Gear icon
  profile: 'person',            // Person silhouette
  add: 'add',                   // Plus sign
  delete: 'trash',              // Trash can
  edit: 'pencil',               // Pencil
  share: 'share',               // Share arrow
  // Everyone recognizes these
}

// ❌ Bad - Unconventional icons
confusingIcons: {
  home: 'rocket',               // Not intuitive
  search: 'eye',                // Misleading
  delete: 'star',               // Wrong meaning
  // Users won't understand
}
```

#### 4. Balance Familiarity with Brand Identity
```typescript
// ✅ Good - Familiar structure + unique style
app: {
  structure: {
    navigation: 'BottomTabs',   // Familiar
    layout: 'CardBased',        // Standard
    gestures: 'SwipeToDelete',  // Expected
  },
  branding: {
    colors: '#B771E5',          // Unique purple
    typography: 'Montserrat',   // Distinctive font
    illustrations: 'Custom',    // Brand personality
  }
  // Familiar to use, memorable to see
}

// ❌ Bad - Everything custom
overlyUnique: {
  navigation: 'CustomGestures', // Confusing
  layout: 'Experimental',       // Unfamiliar
  interactions: 'Novel',        // Requires learning
  // Too different = high friction
}
```

#### 5. Guide Users Through New Patterns
```typescript
// ✅ Good - Introduce unfamiliar features carefully
newFeature: {
  firstUse: {
    tooltip: 'Swipe left to see friend activity',
    animation: 'ShowGesture',
    dismissible: true,
  },
  onboarding: {
    tutorial: 'Interactive walkthrough',
    skippable: true,
  }
  // Help users learn new patterns
}

// ✅ Good - Progressive disclosure of complexity
advancedFeature: {
  basic: 'Simple, familiar interface',
  advanced: 'Hidden until user is ready',
  help: 'Always accessible',
  // Don't overwhelm with novelty
}
```

### Common Familiar Patterns

#### Navigation Patterns
```typescript
// ✅ Standard mobile navigation
bottomTabs: {
  items: ['Home', 'Search', 'Profile'],
  position: 'bottom',
  // Used by Instagram, Twitter, Facebook
}

hamburgerMenu: {
  icon: '☰',
  position: 'top-left',
  // Universal "more options" pattern
}

backButton: {
  icon: '←',
  position: 'top-left',
  // Standard navigation hierarchy
}
```

#### Interaction Patterns
```typescript
// ✅ Familiar gestures
gestures: {
  swipeToDelete: 'left',        // Email apps
  pullToRefresh: 'down',        // Social feeds
  pinchToZoom: 'two-finger',    // Photos
  doubleTapToLike: 'quick',     // Instagram
  // Users already know these
}
```

#### Form Patterns
```typescript
// ✅ Standard form conventions
form: {
  labelPosition: 'above',       // Expected
  requiredIndicator: '*',       // Universal
  errorColor: 'red',            // Standard
  successColor: 'green',        // Standard
  submitButton: 'bottom',       // Expected
  // No surprises
}
```

#### Feedback Patterns
```typescript
// ✅ Universal feedback
feedback: {
  loading: 'spinner',           // Standard
  success: 'checkmark',         // Universal
  error: 'X or !',              // Recognized
  warning: '⚠',                 // Standard
  // Instant recognition
}
```

### GoalStreak Applications

#### ✅ Already Following Jakob's Law
1. **Bottom Tab Navigation** - Standard mobile pattern (Home, Social, Analytics, Profile)
2. **Swipe Gestures** - Familiar interactions
3. **Card-Based Layout** - Common in modern apps
4. **Standard Icons** - Ionicons (universally recognized)
5. **Pull to Refresh** - Expected social feed behavior
6. **Settings Gear Icon** - Universal convention

#### 🎯 Opportunities to Apply
1. **Onboarding** - Use familiar tutorial patterns (you already have WelcomeCarousel!)
2. **Habit Creation** - Follow standard form patterns (already good with collapsible sections)
3. **Notifications** - Use platform-standard notification styles
4. **Search** - Standard search bar at top with magnifying glass icon

### Platform-Specific Conventions

#### iOS Conventions
```typescript
ios: {
  navigation: 'Bottom tabs or top navigation bar',
  backButton: 'Top-left with "<" chevron',
  actionButton: 'Top-right',
  modals: 'Slide up from bottom',
  alerts: 'Center with blur background',
  switches: 'iOS-style toggle',
  // Follow Apple HIG
}
```

#### Android Conventions
```typescript
android: {
  navigation: 'Bottom tabs or drawer',
  backButton: 'Hardware back button or top-left arrow',
  actionButton: 'Floating action button (FAB)',
  modals: 'Slide up or fade in',
  alerts: 'Material dialog',
  switches: 'Material toggle',
  // Follow Material Design
}
```

### When to Break Conventions

**Only break conventions when:**
1. You have a significantly better solution
2. The improvement is worth the learning curve
3. You provide clear guidance/tutorials
4. It's not a core interaction pattern
5. User testing validates the new approach

**Example:**
```typescript
// ✅ Acceptable innovation
uniqueFeature: {
  pattern: 'Novel circular progress indicator',
  reason: 'Better visualizes habit streaks',
  guidance: 'Tooltip on first use',
  fallback: 'Standard list view available',
  // Innovation with safety net
}

// ❌ Risky innovation
riskyChange: {
  pattern: 'Reinvent navigation',
  reason: 'Looks cool',
  guidance: 'None',
  fallback: 'None',
  // High risk of user confusion
}
```

### Testing Checklist

- [ ] Navigation follows platform conventions
- [ ] Icons use universal symbols
- [ ] Gestures match user expectations
- [ ] Forms follow standard patterns
- [ ] Feedback uses familiar indicators
- [ ] New patterns have tutorials/tooltips
- [ ] Brand identity doesn't override usability
- [ ] Tested with users unfamiliar with the app
- [ ] No "how do I...?" questions during testing

### Examples from GoalStreak

```typescript
// ✅ Excellent - Standard bottom tab navigation
<Tab.Navigator>
  <Tab.Screen name="Habits" icon="home" />
  <Tab.Screen name="Social" icon="people" />
  <Tab.Screen name="Analytics" icon="analytics" />
  <Tab.Screen name="Profile" icon="person" />
</Tab.Navigator>
// Users immediately understand this pattern

// ✅ Good - Familiar card-based habit display
<HabitCard
  onPress={handleComplete}      // Tap to complete (expected)
  onLongPress={showOptions}     // Long press for options (standard)
  swipeActions={['edit', 'delete']}  // Swipe actions (familiar)
/>
// Follows patterns from email, todo apps
```

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
