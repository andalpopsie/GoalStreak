x---
inclusion: always
---

# GoalStreak Code Organization Principles

## Core Principle: MODIFY, DON'T MULTIPLY

**ALWAYS modify existing files instead of creating new ones for UI changes.**

## Rules to Follow

### ✅ DO: Extend Existing Components
- Add props/variants to existing components instead of creating new files
- Use conditional styling based on props (`variant="enhanced"`, `layout="grid"`)
- Extend functionality within the same file
- Add new features as optional props

### ❌ DON'T: Create Duplicate Components
- Don't create `EnhancedXComponent.tsx` - enhance the original `XComponent.tsx`
- Don't create separate files for minor variations
- Don't duplicate functionality across multiple files
- Don't create new files when props/variants can handle the change

## Implementation Pattern

```typescript
// GOOD: Single component with variants
interface ComponentProps {
  variant?: 'default' | 'enhanced' | 'compact';
  layout?: 'grid' | 'list' | 'card';
  // ... other props
}

export default function Component({ variant = 'default', layout = 'list', ...props }) {
  // Conditional logic based on variants
  const styles = getStylesForVariant(variant, layout);
  // ... implementation
}
```

```typescript
// BAD: Multiple separate components
// EnhancedComponent.tsx
// CompactComponent.tsx  
// GridComponent.tsx
```

## File Organization Goals

1. **Minimal file count** - Each component type has ONE file
2. **Clear responsibility** - Each file has a single, well-defined purpose
3. **Easy maintenance** - Changes happen in one place
4. **Reduced complexity** - Less cognitive overhead for developers

## Before Creating Any New File, Ask:

1. Can this be added as a prop to an existing component?
2. Can this be handled with conditional styling?
3. Is this truly a different component or just a variation?
4. Will this create unnecessary duplication?

## Exception Cases (Rare)

Only create new files when:
- Completely different functionality (not just visual changes)
- Different data structures/APIs
- Fundamentally different component architecture
- Performance requires separate optimization

**Remember: The goal is LESS clutter, BETTER organization, SINGLE source of truth.**