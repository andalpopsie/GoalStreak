# Custom SVG Icons for Maximum Aesthetics

## Free Icon Sources
Here are excellent sources for free, high-quality icons:

### 1. Heroicons (https://heroicons.com/)
- 292 beautiful SVG icons
- Made by Tailwind CSS team
- MIT license (completely free)
- Perfect for modern apps

### 2. Lucide (https://lucide.dev/)
- 1,000+ beautiful icons
- Fork of Feather icons
- ISC license (free)
- Very clean and consistent

### 3. Tabler Icons (https://tabler-icons.io/)
- 4,000+ free SVG icons
- MIT license
- Designed for web interfaces
- Great variety for habits

### 4. Phosphor Icons (https://phosphoricons.com/)
- 6,000+ flexible icons
- MIT license
- Multiple weights (thin, light, regular, bold)
- Excellent for mobile apps

## Implementation with react-native-svg
```bash
npm install react-native-svg
```

## Example SVG Icon Component
```typescript
import Svg, { Path } from 'react-native-svg';

const FitnessIcon = ({ size = 24, color = '#000' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7.01 10.01h-.01m9.99 0h.01M13 2L8.22 2a1.78 1.78 0 0 0 0 3.56h7.56A1.78 1.78 0 0 0 16 2h-3ZM7 8v8M17 8v8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);
```

## Recommended Icon Categories for Habits

### Fitness & Health
- Dumbbell (strength training)
- Running figure (cardio)
- Yoga pose (flexibility)
- Heart with pulse (health monitoring)
- Water droplet (hydration)

### Wellness & Mindfulness  
- Meditation figure (mindfulness)
- Leaf (nature/wellness)
- Moon and stars (sleep)
- Lotus flower (meditation)
- Breathing lungs (breathing exercises)

### Productivity & Learning
- Book with bookmark (reading)
- Pencil and paper (writing)
- Lightbulb (learning)
- Clock (time management)
- Target with arrow (goals)

### Social & Personal
- Two people (social activities)
- House with heart (family time)
- Phone with message (communication)
- Calendar with heart (relationships)
- Hands helping (community)
