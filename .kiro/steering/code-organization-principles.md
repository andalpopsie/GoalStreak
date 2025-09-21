---
inclusion: always
---

# GoalStreak Code Organization Principles

## Core Principle: MODIFY, DON'T MULTIPLY

**ALWAYS modify existing files instead of creating new ones for UI changes.**

## Mandatory Rules for AI Assistant

### ✅ REQUIRED: Extend Existing Components
- **NEVER** create new component files for UI variations
- **ALWAYS** add props/variants to existing components (`variant="enhanced"`, `layout="grid"`)
- **MUST** extend functionality within the same file using conditional logic
- **REQUIRED** to add new features as optional props with sensible defaults

### ❌ FORBIDDEN: Create Duplicate Components
- **NEVER** create `EnhancedXComponent.tsx` - enhance the original `XComponent.tsx`
- **FORBIDDEN** to create separate files for minor variations
- **NEVER** duplicate functionality across multiple files
- **MUST NOT** create new files when props/variants can handle the change

## Required Implementation Pattern

```typescript
// MANDATORY: Single component with variants
interface ComponentProps {
  variant?: 'default' | 'enhanced' | 'compact';
  layout?: 'grid' | 'list' | 'card';
  showAnalytics?: boolean;
  enhanced?: boolean;
  // Always include existing props
}

export default function Component({ 
  variant = 'default', 
  layout = 'list', 
  showAnalytics = false,
  enhanced = false,
  ...existingProps 
}) {
  // Use conditional logic for variants
  const styles = enhanced ? enhancedStyles : defaultStyles;
  const layoutStyles = getLayoutStyles(layout);
  
  return (
    <View style={[styles, layoutStyles]}>
      {/* Conditional rendering based on props */}
      {enhanced && <EnhancedFeature />}
      {showAnalytics && <AnalyticsSection />}
      {/* Existing content */}
    </View>
  );
}
```

## File Structure Enforcement

### Current Structure (DO NOT CHANGE)
```
src/
├── components/
│   ├── common/           # Shared UI components
│   ├── habit/           # Habit-specific components  
│   ├── social/          # Social feature components
│   ├── timer/           # Timer-related components
│   └── analytics/       # Analytics components
├── screens/             # Screen components (11 total)
├── services/            # Firebase & API services
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
├── constants/          # Theme, limits, configs
└── utils/              # Helper functions
```

### Component Modification Rules
1. **HabitCard.tsx** - Modify for all habit display variations
2. **ProgressCircle.tsx** - Extend for different progress visualizations
3. **SocialFeed.tsx** - Enhance for new social features
4. **AnalyticsChart.tsx** - Add variants for different chart types

## Decision Tree for AI Assistant

**Before ANY file creation:**

1. **Does this modify existing UI?** → Modify existing component with props
2. **Is this a new screen?** → Only create if completely new user flow
3. **Is this a new service?** → Only if different data source/API
4. **Is this a utility function?** → Add to existing utils file if related

## Specific GoalStreak Patterns

### Component Enhancement Pattern
```typescript
// When enhancing HabitCard for analytics
interface HabitCardProps {
  habit: Habit;
  showAnalytics?: boolean;    // NEW: Add analytics view
  layout?: 'compact' | 'full'; // NEW: Layout variants
  interactive?: boolean;       // NEW: Interaction modes
  // Keep all existing props
}
```

### Service Extension Pattern
```typescript
// When adding features to habitService.ts
export const habitService = {
  // Existing methods...
  createHabit,
  updateHabit,
  
  // NEW: Add methods to same service
  getHabitAnalytics,
  exportHabitData,
  // Don't create new service files
};
```

## Performance Considerations

### Conditional Rendering (Required)
```typescript
// Use React.memo for performance with variants
export default React.memo(function Component({ variant, ...props }) {
  const memoizedStyles = useMemo(() => 
    getStylesForVariant(variant), [variant]
  );
  
  return <View style={memoizedStyles}>...</View>;
});
```

### Code Splitting (When Allowed)
- **Only** for completely different feature domains
- **Never** for UI variations or enhancements
- **Must** have different data models and business logic

## Error Prevention Checklist

Before modifying any file, verify:
- [ ] Component exists in current structure
- [ ] Props interface includes new requirements
- [ ] Backward compatibility maintained
- [ ] TypeScript types updated
- [ ] Default values provided for new props
- [ ] Conditional logic handles all variants
- [ ] Performance optimizations in place

## Forbidden Patterns

```typescript
// ❌ NEVER DO THIS
// Creating separate enhanced components
export function EnhancedHabitCard() { ... }
export function CompactHabitCard() { ... }
export function AnalyticsHabitCard() { ... }

// ❌ NEVER DO THIS  
// Creating duplicate services
export const enhancedHabitService = { ... }
export const analyticsHabitService = { ... }
```

## Required Patterns

```typescript
// ✅ ALWAYS DO THIS
// Single component with all variants
export function HabitCard({ 
  variant = 'default',
  showAnalytics = false,
  layout = 'standard',
  ...props 
}) {
  // Handle all cases in one component
}

// ✅ ALWAYS DO THIS
// Single service with extended functionality  
export const habitService = {
  // All habit-related operations in one place
  create, update, delete, getAnalytics, export
};
```

**CRITICAL**: This is a production app with established architecture. Maintain consistency and avoid file proliferation at all costs.