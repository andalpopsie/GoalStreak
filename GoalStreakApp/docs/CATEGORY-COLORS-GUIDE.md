# GoalStreak Category Colors Guide

## 🎨 **Simplified 5-Category System**

GoalStreak now uses a clean, simplified category system with designated colors for better user experience:

### **6 Main Categories with Designated Colors**
- **Fitness**: `#FF894F` - Orange for energy and movement
- **Wellness**: `#538392` - Teal for health and mindfulness
- **Nutrition**: `#B3E2A7` - Light Green for food and healthy eating
- **Social**: `#B771E5` - Purple for relationships and creativity
- **Productivity**: `#003161` - Navy for work and learning
- **Other**: `#B95E82` - Pink for miscellaneous habits

## 🏷️ **Category Details**

### **🟠 Fitness (#FF894F)**
**Includes**: Exercise, workouts, running, sports, yoga, cycling, swimming
**Color Psychology**: Energy, motivation, strength, action

### **🟦 Wellness (#538392)**
**Includes**: Health, meditation, sleep, mindfulness, breathing, self-care
**Color Psychology**: Calm, peace, healing, serenity

### **🟢 Nutrition (#B3E2A7)**
**Includes**: Food, water, vitamins, diet, healthy eating
**Color Psychology**: Fresh, natural, light, vitality

### **🟣 Social (#B771E5)**
**Includes**: Friends, family, relationships, music, creative activities
**Color Psychology**: Connection, creativity, inspiration, joy

### **🔷 Productivity (#003161)**
**Includes**: Work, learning, writing, coding, organization, reading
**Color Psychology**: Focus, professionalism, authority, trust

### **🌸 Other (#B95E82)**
**Includes**: Miscellaneous habits, hobbies, personal goals, unique activities
**Color Psychology**: Creativity, individuality, flexibility, personal expression

### **Complete Color Palette**
```typescript
// Fitness & Workout
fitness: '#FF894F',        // Warm orange
workout: '#FF4444',        // Red for intensity
running: '#D78FEE',        // 🟣 NEW: Soft purple
yoga: '#4A90A4',           // Teal for calm
cycling: '#154D71',        // Dark blue
swimming: '#154D71',       // Blue theme

// Health & Wellness  
wellness: '#4A90A4',       // Teal
health: '#4A90A4',         // Teal variant
sleep: '#154D71',          // Dark blue
meditation: '#043915',     // 🟢 NEW: Forest green
breathing: '#4A90A4',      // Teal

// Nutrition
nutrition: '#043915',      // 🟢 NEW: Forest green
water: '#154D71',          // Blue
diet: '#4A90A4',           // Green
vitamins: '#D78FEE',       // 🟣 NEW: Soft purple

// And more...
```

## 🎯 **Usage Examples**

### **In Components**
```typescript
import { getCategoryColor, getCategoryBackgroundColor } from '../constants/theme';

// Get category color
const categoryColor = getCategoryColor('running'); // Returns '#FFFA8D'
const bgColor = getCategoryBackgroundColor('meditation'); // Returns light green

// Use in styles
const styles = StyleSheet.create({
  categoryBadge: {
    backgroundColor: getCategoryColor(habit.category),
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBackground: {
    backgroundColor: getCategoryBackgroundColor(habit.category),
    borderRadius: 8,
  }
});
```

### **Visual Impact**
- **Running habits** now have a bright, energetic yellow that conveys movement and energy
- **Meditation habits** use deep forest green for a natural, peaceful feeling
- **Nutrition habits** use the same forest green to represent healthy, natural eating
- **Music habits** use bright yellow to represent joy and creativity
- **Vitamin habits** use bright yellow to represent energy and health

## 🚀 **App Store Impact**

### **✅ Minimal Impact on Launch**
- Colors are purely visual enhancements
- No functional changes required
- Existing screenshots will still look professional
- Can update screenshots later if desired

### **🎨 Enhanced User Experience**
- More vibrant and engaging category system
- Better visual distinction between habit types
- Improved user motivation through color psychology
- Professional yet energetic appearance

## 🔧 **Implementation Status**

### **✅ Completed**
- ✅ Added colors to theme constants
- ✅ Created category color mapping system
- ✅ Added helper functions for easy usage
- ✅ Updated TypeScript types with color annotations
- ✅ Created background color variants

### **🔄 Next Steps (Optional)**
- Update habit creation screen to show color previews
- Regenerate screenshots with new colors (if desired)
- Test color accessibility and contrast ratios

## 🎯 **Color Psychology**

### **Soft Purple (#D78FEE)**
- **Emotion**: Creativity, inspiration, gentle energy, connection
- **Perfect for**: Running, music, friends, vitamins
- **User impact**: Inspires creativity and gentle motivation

### **Forest Green (#043915)**
- **Emotion**: Growth, nature, peace, health
- **Perfect for**: Meditation, nutrition, mindfulness
- **User impact**: Promotes calm focus and healthy choices

Your color choices perfectly complement the existing palette and enhance the user experience without disrupting the App Store launch timeline! 🎉