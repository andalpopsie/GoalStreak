# Developer Guide - GoalStreak

## 🎯 Quick Navigation

### 🔥 Most Used Files (Daily Development)

#### Core App Development
```
src/
├── App.tsx                    # Root component - start here
├── components/                # UI components
│   ├── AnimatedCircularHabitCard.tsx  # Main habit card
│   ├── Button.tsx            # Primary button component
│   └── Input.tsx             # Form input component
├── screens/                   # App screens
│   ├── CleanHomeScreen.tsx   # Main dashboard
│   ├── CreateHabitScreen.tsx # Habit creation
│   ├── SocialScreen.tsx      # Social features
│   └── AnalyticsScreen.tsx   # Analytics dashboard
├── services/                  # Business logic
│   ├── habitService.ts       # Habit CRUD operations
│   ├── authService.ts        # Authentication
│   └── friendService.ts      # Social features
└── hooks/                     # Custom React hooks
    ├── useAuth.tsx           # Authentication state
    ├── useHabits.tsx         # Habit management
    └── useHabitsWithSocial.tsx # Social habit features
```

#### Configuration Files (Root Level)
```
├── package.json              # Dependencies and scripts
├── app.json                  # Expo configuration
├── tsconfig.json             # TypeScript settings
├── jest.config.js            # Main test configuration
└── firebase.json             # Firebase configuration
```

### 🧪 Testing (When Writing Tests)

#### Test Structure
```
__tests__/                    # All tests (moved from src/)
├── unit/                     # Unit tests
│   ├── habitService.test.ts  # Service tests
│   └── authService.test.tsx  # Auth tests
├── components/               # Component tests
│   ├── AnimatedCircularHabitCard.test.tsx
│   └── Button.test.tsx
├── screens/                  # Screen tests
│   ├── CleanHomeScreen.test.tsx
│   └── CreateHabitScreen.test.tsx
├── hooks/                    # Hook tests
│   ├── useAuth.test.tsx
│   └── useHabits.test.tsx
├── integration/              # Firebase integration tests
├── security/                 # Security validation tests
├── performance/              # Performance tests
└── utils/                    # Test utilities and setup
    ├── testSetup.ts          # Main test setup
    ├── testUtils.tsx         # Test helpers
    └── firebaseEmulator.ts   # Firebase test setup
```

#### Test Commands (Most Used)
```bash
npm test                      # Run all tests
npm run test:unit            # Unit tests only
npm run test:watch           # Watch mode for development
npm run test:coverage        # Generate coverage report
npm run test:integration     # Firebase integration tests
```

### 📚 Documentation (When You Need Help)

#### Essential Docs
```
├── README.md                 # Project overview and setup
├── DEVELOPER_GUIDE.md        # This file - quick navigation
├── PROJECT_STRUCTURE.md      # Detailed structure explanation
├── TESTING_SETUP.md          # Testing setup and usage
└── docs/                     # Detailed technical docs
    ├── TESTING_GUIDE.md      # Comprehensive testing guide
    ├── TESTING_PATTERNS.md   # Testing best practices
    └── TESTING_TROUBLESHOOTING.md # Common issues
```

### 🔧 Build & Deploy (When Releasing)

#### Build Files
```
├── scripts/                  # Build and utility scripts
├── .github/workflows/        # CI/CD pipelines
├── reports/                  # Generated test reports
└── app-store/               # App store submission files
```

## 🚀 Common Development Tasks

### Starting Development
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm start

# 3. Run on device/simulator
npm run ios     # iOS
npm run android # Android
```

### Adding a New Feature
```bash
# 1. Create component in src/components/
# 2. Add screen in src/screens/ (if needed)
# 3. Update navigation in src/navigation/
# 4. Add service logic in src/services/
# 5. Create tests in __tests__/
# 6. Run tests
npm run test:watch
```

### Testing Your Changes
```bash
# Quick test during development
npm run test:unit

# Full test before commit
npm run test:all

# Check test coverage
npm run test:coverage
```

### Debugging Issues
```bash
# Check Firebase emulators
npm run emulators:start

# Run integration tests
npm run test:integration

# Check performance
npm run test:performance
```

## 🎨 Code Patterns

### Component Structure
```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ 
  title, 
  onPress 
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### Service Pattern
```typescript
// src/services/myService.ts
import { db } from './firebase';

export const myService = {
  async getData(id: string) {
    try {
      const doc = await db.collection('data').doc(id).get();
      return doc.data();
    } catch (error) {
      console.error('Error getting data:', error);
      throw error;
    }
  },
};
```

### Hook Pattern
```typescript
// src/hooks/useMyData.tsx
import { useState, useEffect } from 'react';
import { myService } from '../services/myService';

export const useMyData = (id: string) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await myService.getData(id);
        setData(result);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  return { data, loading, error };
};
```

### Test Pattern
```typescript
// __tests__/components/MyComponent.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../../src/components/MyComponent';

describe('MyComponent', () => {
  it('renders title correctly', () => {
    const { getByText } = render(
      <MyComponent title="Test Title" />
    );
    
    expect(getByText('Test Title')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <MyComponent title="Test" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test'));
    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

## 🔍 Finding Things Quickly

### Need to find a specific file?
```bash
# Use VS Code's Cmd+P (Mac) or Ctrl+P (Windows/Linux)
# Type partial filename to quickly navigate
```

### Looking for a function or component?
```bash
# Use VS Code's Cmd+Shift+F (Mac) or Ctrl+Shift+F (Windows/Linux)
# Search across all files
```

### Understanding the codebase?
1. Start with `src/App.tsx` - the root component
2. Check `src/navigation/` - understand app flow
3. Look at `src/screens/CleanHomeScreen.tsx` - main screen
4. Explore `src/services/` - business logic
5. Review `__tests__/` - see how things work

### Need help with testing?
1. Check `TESTING_SETUP.md` - setup guide
2. Look at existing tests in `__tests__/` - patterns
3. Run `npm run test:watch` - interactive testing
4. Check `docs/TESTING_GUIDE.md` - comprehensive guide

## 🎯 Pro Tips

### Development Efficiency
- Use `npm run test:watch` during development
- Keep Firebase emulators running for integration tests
- Use TypeScript strict mode - it catches bugs early
- Follow the established patterns in existing code

### Debugging
- Check the console for Firebase errors
- Use React Native Debugger for state inspection
- Test on both iOS and Android regularly
- Use the test utilities in `__tests__/utils/`

### Code Quality
- Run `npm run lint` before committing
- Write tests for new features
- Follow the TypeScript interfaces
- Keep components small and focused

---

**Remember**: The main app code is in `src/`, tests are in `__tests__/`, and documentation is in `docs/`. Everything else is configuration and tooling to support development.