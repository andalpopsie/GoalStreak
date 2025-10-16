# GoalStreak UI Design Guide

## 🎨 Overview

This guide consolidates all UI design decisions, component specifications, and visual improvements made to GoalStreak. It serves as the single source of truth for design consistency.

## 🎯 Design System

### Color Palette (Current Implementation)
```typescript
const Colors = {
  primaryText: '#154D71',      // Dark Blue
  background: '#FDFDFD',       // Light Gray
  accent1: '#B771E5',          // Purple (Primary accent)
  accent2: '#154D71',          // Dark Blue (Secondary)
  accent3: '#4A90A4',          // Teal (Success/Completed)
  white: '#FFFFFF',
  gray: { light: '#E8E8E8', medium: '#CCCCCC', dark: '#666666' }
}
```

### Typography System
- **Primary Font**: Montserrat (loaded via @expo-google-fonts)
- **Font Weights**: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)
- **Headings**: Bold, Dark Blue (#154D71)
- **Body**: Regular, Dark Blue (#154D71)
- **Secondary/Captions**: Medium weight, Gray (#666666)

### Component Guidelines
- **Primary buttons**: Purple (#B771E5) background with white text
- **Secondary buttons**: Dark Blue (#154D71) outline or fill
- **Completed states**: Teal (#4A90A4)
- **Active streaks**: Purple (#B771E5) highlight
- **Background**: Light Gray (#FDFDFD) for clean, modern look

### Timer Colors (Current Implementation)
```typescript
const TIMER_COLORS = {
  INACTIVE:  '#E8E8E8',  // Light gray for inactive timer
  ACTIVE:    '#FFF58A',  // Light Yellow for active timer  
  COMPLETED: '#37B5B6',  // Teal Green for completed timer
  PAUSED:    '#80C4E9',  // Soft Blue for paused timer
}
```

## 🏷️ Category System

### Simplified 6-Category System
GoalStreak uses a clean, simplified category system with designated colors:

#### **Final Optimized Category Colors (Updated January 2025)**

```typescript
const CategoryColors = {
  fitness:      '#B771E5',  // 🟣 Purple - Exercise, workouts, running, sports
  wellness:     '#48B3AF',  // 🔷 Teal - Health, meditation, sleep, mindfulness
  nutrition:    '#A7E399',  // 🟢 Light Green - Food, water, vitamins, diet
  social:       '#3C3D37',  // � Dark Charcoal - Friends, family, relationships, music
  productivity: '#003161',  // 🔷 Navy - Work, learning, organization, writing
  other:        '#FF9013',  // 🟠 Orange - Other habits
}
```

#### **Category Color Psychology & Benefits**

- **🟣 Purple (#B771E5) - Fitness**
  - *Psychology*: Creativity, inspiration, luxury, motivation
  - *Perfect for*: Exercise, workouts, sports, physical challenges
  - *User Impact*: Inspiring and energizing for fitness goals

- **🔷 Teal (#48B3AF) - Wellness**
  - *Psychology*: Calm, healing, balance, serenity, peace
  - *Perfect for*: Meditation, sleep, mindfulness, health routines
  - *User Impact*: Promotes relaxation and mental well-being

- **🟢 Light Green (#A7E399) - Nutrition**
  - *Psychology*: Fresh, natural, growth, vitality, health
  - *Perfect for*: Healthy eating, water intake, vitamins, diet
  - *User Impact*: Encourages fresh, natural, healthy choices

- **� Dark Charcoal (#3C3D37) - Social**
  - *Psychology*: Sophistication, elegance, strength, reliability
  - *Perfect for*: Friends, family, social activities, communication
  - *User Impact*: Promotes strong, reliable social connections

- **🔷 Navy (#003161) - Productivity**
  - *Psychology*: Focus, professionalism, stability, trust
  - *Perfect for*: Work tasks, learning, organization, goals
  - *User Impact*: Promotes focus and professional mindset

- **🟠 Orange (#FF9013) - Other**
  - *Psychology*: Energy, enthusiasm, warmth, versatility
  - *Perfect for*: Personal care, hobbies, miscellaneous activities
  - *User Impact*: Energizes diverse personal activities
  
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