---
inclusion: always
---

# Code Organization Principles

## Core Rule: MODIFY, DON'T MULTIPLY

**NEVER create new files for UI variations - extend existing components with props/variants.**

## Required Pattern
```typescript
// ✅ Single component with variants
interface Props {
  variant?: 'default' | 'enhanced';
  layout?: 'grid' | 'list';
}

// ❌ NEVER create EnhancedComponent.tsx
```

## Decision Tree
1. **UI change?** → Add props to existing component
2. **New screen?** → Only if completely new flow
3. **New service?** → Only if different data source
4. **Utility?** → Add to existing utils file

## Forbidden
```typescript
// ❌ NEVER
EnhancedHabitCard.tsx
CompactHabitCard.tsx
enhancedHabitService.ts
```

## Required
```typescript
// ✅ ALWAYS
HabitCard({ variant, layout, ...props })
habitService.newMethod()
```
