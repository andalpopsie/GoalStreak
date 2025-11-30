# Mobile Spacing & Layout Standards

## Base Grid System
**4px base unit** → Use multiples: 8, 16, 24, 32

## Spacing Scale

### Tight Coupling (8px)
- Icon + label pairs
- Tightly coupled UI elements
- Related form fields

### Related Content (16px)
- Title/subtitle pairs
- Button/helper text
- Related content within a card
- Between form inputs

### Moderate Breaks (24px)
- Section breaks within a card
- Between content groups
- Description → price/CTA

### Major Dividers (32px)
- Major section dividers
- Top padding of hero blocks
- Between distinct content sections

## Card Layout Recipe

### Standard Card Structure
```
Outer margin: 16px from screen edge
Inner padding: 16–24px all sides

Spacing within card:
- Title → Description: 16px
- Description → Price/Value: 24–32px
- Price → CTA Button: 24–32px
- CTA → Footer note: 16px
```

### Example Card Implementation
```typescript
{
  marginHorizontal: 16,        // Outer margin
  padding: 16,                 // Inner padding (use 24 for larger cards)
  
  // Internal spacing
  titleMarginBottom: 16,       // Title → Description
  descriptionMarginBottom: 24, // Description → Price
  priceMarginBottom: 24,       // Price → CTA
  ctaMarginBottom: 16,         // CTA → Footer
}
```

## Screen Layout Standards

### Screen Margins
- **Mobile**: 16px from edges
- **Tablet/Large**: 24px from edges

### Section Spacing
- **Between components**: 16px
- **Between sections**: 24px
- **Between major blocks**: 32px

## Touch Targets
- **Minimum**: 48px (iOS/Android recommendation)
- **Comfortable**: 56px for primary actions

## Component Spacing

### Buttons
- **Height**: 48px (md), 56px (lg)
- **Padding**: 16px horizontal, 12px vertical
- **Margin below**: 16px (related), 24px (section break)

### Form Fields
- **Between fields**: 16px
- **Label → Input**: 8px
- **Input → Helper text**: 8px
- **Section break**: 24px

### Lists & Cards
- **Between list items**: 8px (tight), 16px (comfortable)
- **Card margin**: 16px
- **Card padding**: 16–24px

## Typography Spacing

### Line Heights
- **Headings**: 1.2 (tight)
- **Body text**: 1.5 (normal)
- **Long-form**: 1.6 (relaxed)

### Paragraph Spacing
- **Between paragraphs**: 16px
- **After headings**: 16px
- **Before headings**: 24px

## Quick Reference

```typescript
// Use these constants from theme.ts
Spacing.tight: 8,        // Icon-text, tight coupling
Spacing.base: 16,        // Related content (most common)
Spacing.comfortable: 24, // Moderate breaks
Spacing.loose: 32,       // Major dividers
Spacing.spacious: 48,    // Screen sections
```

## Best Practices

1. **Consistency**: Stick to the 8px grid system
2. **Hierarchy**: Use spacing to create visual hierarchy
3. **Breathing room**: Don't be afraid of whitespace
4. **Touch-friendly**: Minimum 48px for interactive elements
5. **Responsive**: Adjust spacing for larger screens (16px → 24px)

## Common Patterns

### Hero Section
```
Top padding: 32px
Title → Subtitle: 16px
Subtitle → CTA: 24px
Bottom padding: 32px
```

### Content Card
```
Outer margin: 16px
Inner padding: 16px
Title → Body: 16px
Body → Action: 24px
```

### Form Section
```
Section title: 24px margin top
Label → Input: 8px
Input → Input: 16px
Input → Button: 24px
```
