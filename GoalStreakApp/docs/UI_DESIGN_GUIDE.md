# GoalStreak UI Design Guide

## 🎨 Overview

This guide consolidates all UI design decisions, component specifications, and visual improvements made to GoalStreak. It serves as the single source of truth for design consistency.

## 🎯 Design System

### Color Palette
```typescript
const colors = {
  primaryText: '#001BB7',      // Deep Blue
  background: '#FFF6E9',       // Warm Neutral
  accent1: '#FF7F3E',          // Energetic Orange (CTA/Progress)
  accent2: '#80C4E9',          // Soft Blue (Secondary UI)
  accent3: '#37B5B6',          // Teal Green (Success/Completed)
}
```

### Typography
- **Primary Font**: Proxima Nova (fallback to system sans-serif)
- **Headings**: Bold, Deep Blue (#001BB7)
- **Body**: Regular, Deep Blue (#001BB7)
- **Secondary/Captions**: Light/Medium, Accent 2 (#80C4E9)

### Component Guidelines
- **Primary buttons**: Accent 1 background with white text
- **Secondary buttons**: Accent 2 outline or fill
- **Completed states**: Accent 3
- **Active streaks**: Accent 1 highlight
- **Background**: Always use #FFF6E9 for warmth

## 🏷️ Category System

### Simplified 6-Category System
GoalStreak uses a clean, simplified category system with designated colors:

#### **Category Colors & Psychology**
- **🟠 Fitness (#FF894F)** - Orange for energy and movement
  - *Includes*: Exercise, workouts, running, sports, yoga, cycling, swimming
  
- **🟦 Wellness (#538392)** - Teal for health and mindfulness
  - *Includes*: Health, meditation, sleep, mindfulness, breathing, self-care
  
- **🟢 Nutrition (#B3E2A7)** - Light Green for food and healthy eating
  - *Includes*: Food, water, vitamins, diet, healthy eating
  
- **🟣 Social (#B771E5)** - Purple for relationships and creativity
  - *Includes*: Friends, family, relationships, music, creative activities
  
- **🔷 Productivity (#003161)** - Navy for work and learning
  - *Includes*: Work, learning, reading, organization, planning
  
- **🌸 Other (#B95E82)** - Pink for miscellaneous habits
  - *Includes*: Personal care, hobbies, miscellaneous activities

## 📱 Component Specifications

### Category Selection Cards

#### **Compact Rectangular Layout**
The category selection uses optimized rectangular cards for better space utilization:

**Design Specifications**:
- **Card Height**: 60px (reduced from 120px)
- **Layout**: Horizontal with left-aligned content
- **Icon Size**: 32px in 40px container
- **Typography**: Base font size with semibold weight
- **Spacing**: Medium gaps with optimized padding

**Layout Structure**:
```
┌─────────────────────────────────────────┐
│ [Icon] Category Name              [✓]   │
└─────────────────────────────────────────┘
```

**Benefits**:
- **50% reduction** in vertical space usage
- **Better thumb reach** with horizontal layout
- **Clear visual hierarchy** with icon → text → indicator
- **Professional appearance** with optimized spacing

#### **Enhanced Visual Impact**
Recent improvements to maximize visual impact:

**Icon Enhancements**:
- **Size**: 32px icons in 64px containers (33% larger)
- **Containers**: Larger padding for better proportions
- **Touch Targets**: Improved accessibility and usability

**Typography Improvements**:
- **Font Size**: Base size with semibold weight
- **Readability**: Better contrast and visual hierarchy
- **Consistency**: Uniform text treatment across categories

**Selection Indicators**:
- **Size**: Larger checkmark icons for better visibility
- **Position**: Right-aligned for natural reading flow
- **Feedback**: Clear visual confirmation of selection

### Progress Components

#### **Circular Progress Indicators**
- **Primary Color**: Accent 1 (#FF7F3E) for active progress
- **Completed Color**: Accent 3 (#37B5B6) for finished habits
- **Background**: Light gray with subtle transparency
- **Animation**: Smooth progress transitions

#### **Streak Counters**
- **Highlight Color**: Accent 1 for active streaks
- **Typography**: Bold numbers with medium labels
- **Background**: Subtle background with rounded corners
- **Celebration**: Special styling for milestone streaks

### Form Components

#### **Input Fields**
- **Border**: Subtle border with focus states
- **Background**: White with slight transparency
- **Typography**: Consistent with design system
- **Validation**: Clear error and success states

#### **Buttons**
- **Primary**: Accent 1 background, white text, rounded corners
- **Secondary**: Accent 2 border, accent 2 text, transparent background
- **Disabled**: Reduced opacity with gray styling
- **Touch Feedback**: Subtle press animations

## 🎯 Layout Optimizations

### Space Utilization
- **Compact Layouts**: Horizontal arrangements where appropriate
- **Reduced Scrolling**: Optimized spacing to fit more content
- **Visual Hierarchy**: Clear information architecture
- **Breathing Room**: Balanced spacing for readability

### Mobile-First Design
- **Touch Targets**: Minimum 44px for accessibility
- **Thumb Reach**: Important actions within easy reach
- **Screen Sizes**: Responsive design for all device sizes
- **Orientation**: Optimized for portrait usage

## 🔧 Implementation Guidelines

### Component Creation Rules
- **Extend, Don't Duplicate**: Add variants to existing components
- **Props-Based Variations**: Use props for different styles
- **Consistent Naming**: Follow established naming conventions
- **Accessibility**: Include proper accessibility props

### Code Examples

#### **Category Card Component**
```typescript
interface CategoryCardProps {
  category: HabitCategory;
  isSelected: boolean;
  onSelect: (category: HabitCategory) => void;
  variant?: 'default' | 'compact';
  layout?: 'vertical' | 'horizontal';
}

export default function CategoryCard({ 
  category, 
  isSelected, 
  onSelect,
  variant = 'default',
  layout = 'horizontal'
}) {
  const cardStyle = layout === 'horizontal' 
    ? styles.horizontalCard 
    : styles.verticalCard;
    
  return (
    <TouchableOpacity 
      style={[cardStyle, isSelected && styles.selected]}
      onPress={() => onSelect(category)}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={category.icon} size={32} color={category.color} />
      </View>
      <Text style={styles.categoryName}>{category.name}</Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={colors.accent3} />
      )}
    </TouchableOpacity>
  );
}
```

### Styling Patterns

#### **Consistent Spacing**
```typescript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};
```

#### **Border Radius**
```typescript
const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999
};
```

## 📊 Performance Considerations

### Optimization Strategies
- **React.memo**: Memoize components with variants
- **useMemo**: Cache expensive style calculations
- **Conditional Rendering**: Efficient variant handling
- **Image Optimization**: Proper asset sizing and caching

### Code Example
```typescript
export default React.memo(function CategoryCard({ variant, ...props }) {
  const memoizedStyles = useMemo(() => 
    getStylesForVariant(variant), [variant]
  );
  
  return <View style={memoizedStyles}>...</View>;
});
```

## 🎨 Visual Consistency

### Design Tokens
- **Colors**: Centralized color definitions
- **Typography**: Consistent font scales and weights
- **Spacing**: Standardized spacing system
- **Shadows**: Consistent elevation and depth

### Quality Assurance
- **Cross-Platform**: Consistent appearance on iOS and Android
- **Screen Sizes**: Responsive design validation
- **Accessibility**: Color contrast and touch target compliance
- **Performance**: Smooth animations and interactions

---

**Status**: ✅ Design system implemented and optimized
**Last Updated**: January 2025
**Next Review**: Post-launch user feedback integration