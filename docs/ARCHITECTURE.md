# 🏗️ GoalStreak Architecture Overview

Technical architecture, design decisions, and patterns for the GoalStreak social habit tracking platform.

## 🎯 System Overview

GoalStreak is a cross-platform mobile application built with React Native and Expo, featuring real-time social interactions, habit tracking, and productivity tools. The architecture emphasizes scalability, maintainability, and user experience.

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Web Client    │    │  Admin Panel    │
│  (iOS/Android)  │    │   (Future)      │    │   (Future)      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │              API Gateway / CDN                  │
         └─────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────┐
         │                Firebase Suite                   │
         │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
         │  │    Auth     │ │  Firestore  │ │   Storage   ││
         │  └─────────────┘ └─────────────┘ └─────────────┘│
         │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐│
         │  │     FCM     │ │  Analytics  │ │ Crashlytics ││
         │  └─────────────┘ └─────────────┘ └─────────────┘│
         └─────────────────────────────────────────────────┘
```

## 📱 Frontend Architecture

### Technology Stack
- **React Native 0.74.5** - Cross-platform mobile framework
- **Expo SDK 54** - Development platform and tooling
- **TypeScript** - Type safety and developer experience
- **React Navigation 7.x** - Navigation and routing
- **React Native Reanimated 3.x** - High-performance animations
- **Firebase SDK** - Backend integration

### Component Architecture
```
src/
├── components/
│   ├── common/              # Shared UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── ProgressCircle.tsx
│   ├── habit/               # Habit-specific components
│   │   ├── HabitCard.tsx
│   │   ├── HabitForm.tsx
│   │   └── TimerComponent.tsx
│   ├── social/              # Social feature components
│   │   ├── ActivityFeed.tsx
│   │   ├── FriendCard.tsx
│   │   └── ReactionButton.tsx
│   └── analytics/           # Analytics components
│       ├── ProgressChart.tsx
│       └── StreakDisplay.tsx
├── screens/                 # Screen-level components
├── navigation/              # Navigation configuration
├── services/                # Business logic and API calls
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript definitions
├── constants/               # App constants and themes
└── utils/                   # Helper functions
```

### State Management Strategy
```typescript
// Global state with React Context
interface AppContextType {
  user: User | null;
  habits: Habit[];
  friends: Friend[];
  loading: boolean;
  error: string | null;
}

// Local state with useState for component-specific data
// Custom hooks for complex logic and Firebase operations
// Real-time subscriptions for live data updates
```

## 🔥 Backend Architecture

### Firebase Services
- **Authentication** - User registration, login, and session management
- **Firestore** - Real-time NoSQL database for all app data
- **Storage** - File storage for profile photos and assets
- **Cloud Messaging** - Push notifications
- **Analytics** - User behavior tracking
- **Crashlytics** - Error monitoring and crash reporting

### Data Model Design
```typescript
// Core entities with relationships
interface User {
  id: string;                    // Primary key
  email: string;                 // Unique identifier
  displayName: string;           // User's chosen name
  profilePicture?: string;       // Storage URL
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Habit {
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  name: string;                  // Habit name
  category: HabitCategory;       // Categorization
  frequency: 'daily' | 'weekly' | 'monthly';
  targetValue?: number;          // For quantified habits
  unit?: string;                 // Unit of measurement
  icon?: string;                 // Icon identifier
  isPublic: boolean;             // Social sharing setting
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

interface Completion {
  id: string;                    // Primary key
  habitId: string;               // Foreign key to Habit
  userId: string;                // Foreign key to User
  completedAt: Timestamp;        // When completed
  value?: number;                // Actual value (for quantified habits)
  streak: number;                // Current streak at time of completion
}

interface Friend {
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  friendId: string;              // Foreign key to User
  friendEmail: string;           // Friend's email
  friendName: string;            // Friend's display name
  status: 'accepted';            // Friendship status
  createdAt: Timestamp;
}

interface SocialActivity {
  id: string;                    // Primary key
  userId: string;                // Foreign key to User
  userName: string;              // Cached user name
  type: ActivityType;            // Type of activity
  habitId: string;               // Foreign key to Habit
  habitName: string;             // Cached habit name
  habitCategory: string;         // Cached category
  timestamp: Timestamp;
  foundingMember?: boolean;      // true if author is a founding member (R8.4)
  foundingNumber?: number | null; // author founding number 1-100, null if unavailable
  reactions?: {                  // Reaction counts
    heart: number;
    flame: number;
    medal: number;
  };
}
```

### Database Collections
```
firestore/
├── users/{userId}                    # User profiles and settings
├── habits/{habitId}                  # User habits and configurations
├── completions/{completionId}        # Habit completion records
├── streaks/{habitId}                 # Streak calculations and history
├── friends/{friendshipId}            # Friend relationships
├── friendRequests/{requestId}        # Pending friend requests
├── activities/{activityId}           # Social activity feed
├── reactions/{reactionId}            # User reactions to activities
├── notifications/{notificationId}    # Scheduled notifications
├── userProfiles/{userId}             # Extended user profile data
└── socialSettings/{userId}           # User privacy and social settings
```

## 🔒 Security Architecture

### Authentication & Authorization
```typescript
// Firebase Auth integration
interface AuthService {
  signUp(email: string, password: string): Promise<User>;
  signIn(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  onAuthStateChanged(callback: (user: User | null) => void): () => void;
}

// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Habits - users can only access their own habits
    match /habits/{habitId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
    
    // Social activities - friends can read shared activities
    match /activities/{activityId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.visibility == 'public' ||
         (resource.data.visibility == 'friends' && 
          exists(/databases/$(database)/documents/friends/$(request.auth.uid + '_' + resource.data.userId))));
      allow write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### Data Protection
- **Input Validation** - Client and server-side validation
- **Sanitization** - Clean user inputs before storage
- **Encryption** - Firebase handles encryption at rest and in transit
- **Privacy Controls** - Granular user privacy settings
- **Access Control** - Role-based access through security rules

## 🚀 Performance Architecture

### Optimization Strategies
```typescript
// Component optimization
export default React.memo(function HabitCard({ habit, onToggle }) {
  const handlePress = useCallback(() => {
    onToggle(habit.id);
  }, [habit.id, onToggle]);

  const progressValue = useMemo(() => {
    return calculateProgress(habit.completions);
  }, [habit.completions]);

  return (
    <TouchableOpacity onPress={handlePress}>
      <ProgressCircle value={progressValue} />
    </TouchableOpacity>
  );
});

// Efficient Firebase queries
const getHabitsQuery = (userId: string) => {
  return query(
    collection(db, 'habits'),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
};
```

### Caching Strategy
- **Local Storage** - AsyncStorage for user preferences and offline data
- **Memory Caching** - React state and context for active data
- **Image Caching** - Expo Image for profile photos and assets
- **Query Caching** - Firebase offline persistence for Firestore data

### Real-time Updates
```typescript
// Efficient real-time subscriptions
const useHabitsRealtime = (userId: string) => {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const q = getHabitsQuery(userId);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const habitsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Habit));
      setHabits(habitsData);
    });

    return unsubscribe; // Cleanup subscription
  }, [userId]);

  return habits;
};
```

## 🔔 Notification Architecture

### System Design
```typescript
// Notification scheduling service
interface NotificationService {
  scheduleHabitReminder(habit: Habit, time: Date): Promise<string>;
  cancelHabitReminder(habitId: string): Promise<void>;
  updateHabitReminder(habitId: string, newTime: Date): Promise<void>;
  requestPermissions(): Promise<boolean>;
}

// 7-day advance scheduling strategy
const scheduleWeeklyNotifications = async (habit: Habit, reminderTime: Date) => {
  const notifications = [];
  
  for (let i = 0; i < 7; i++) {
    const notificationDate = new Date(reminderTime);
    notificationDate.setDate(notificationDate.getDate() + i);
    
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Reminder',
        body: `Time to complete: ${habit.name}`,
        data: { habitId: habit.id }
      },
      trigger: { date: notificationDate }
    });
    
    notifications.push(notificationId);
  }
  
  return notifications;
};
```

## 📊 Analytics Architecture

### Data Collection
```typescript
// Analytics service
interface AnalyticsService {
  trackEvent(eventName: string, parameters?: object): void;
  trackScreenView(screenName: string): void;
  setUserProperties(properties: object): void;
  trackHabitCompletion(habitId: string, streak: number): void;
  trackSocialInteraction(type: string, targetUserId: string): void;
}

// Custom analytics for habit insights
const calculateHabitAnalytics = (completions: Completion[]) => {
  return {
    totalCompletions: completions.length,
    currentStreak: getCurrentStreak(completions),
    longestStreak: getLongestStreak(completions),
    completionRate: getCompletionRate(completions),
    weeklyTrend: getWeeklyTrend(completions),
    categoryBreakdown: getCategoryBreakdown(completions)
  };
};
```

## 🔄 Data Flow Architecture

### Unidirectional Data Flow
```
User Action → Component → Service → Firebase → Real-time Update → Component → UI Update

Example: Habit Completion Flow
1. User taps habit completion button
2. HabitCard component calls onToggle handler
3. Handler calls habitService.completeHabit()
4. Service updates Firestore completion collection
5. Real-time listener detects change
6. useHabits hook updates local state
7. Component re-renders with new data
8. UI shows updated completion status
```

### Error Handling Flow
```typescript
// Centralized error handling
interface ErrorBoundary {
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void;
  render(): ReactNode;
}

// Service-level error handling
const habitService = {
  async completeHabit(habitId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'completions', completionId), data);
    } catch (error) {
      console.error('Failed to complete habit:', error);
      crashlytics().recordError(error);
      throw new Error('Failed to complete habit. Please try again.');
    }
  }
};
```

## 🎨 UI/UX Architecture

### Design System
```typescript
// Centralized design tokens
export const Colors = {
  primaryText: '#154D71',      // Dark blue for text
  background: '#FDFDFD',       // Light gray background
  accent1: '#FF894F',          // Warm orange for CTAs
  accent2: '#154D71',          // Dark blue for secondary
  accent3: '#4A90A4',          // Teal for completed states
  white: '#FFFFFF',
  gray: {
    light: '#E8E8E8',
    medium: '#CCCCCC',
    dark: '#666666'
  }
};

export const Typography = {
  fontFamily: {
    regular: 'Montserrat_400Regular',
    medium: 'Montserrat_500Medium',
    semibold: 'Montserrat_600SemiBold',
    bold: 'Montserrat_700Bold',
  },
  fontSize: {
    xs: 12, sm: 14, base: 16, lg: 18, xl: 20, '2xl': 24
  }
};

export const Spacing = {
  xs: 4, sm: 8, md: 16, lg: 24, xl: 32, '2xl': 48
};
```

### Animation Architecture
```typescript
// Reanimated 3 integration
import { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const ProgressCircle = ({ progress }: { progress: number }) => {
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withSpring(progress);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${animatedProgress.value * 360}deg` }]
  }));

  return <Animated.View style={animatedStyle} />;
};
```

## 🔧 Development Architecture

### Code Organization Principles
- **Single Responsibility** - Each component/service has one clear purpose
- **Dependency Injection** - Services injected through props/context
- **Composition over Inheritance** - Favor composition patterns
- **Immutable Data** - Use immutable update patterns
- **Type Safety** - Comprehensive TypeScript coverage

### Testing Strategy
```typescript
// Component testing approach
describe('HabitCard', () => {
  it('should display habit name and progress', () => {
    const habit = createMockHabit();
    render(<HabitCard habit={habit} onToggle={jest.fn()} />);
    
    expect(screen.getByText(habit.name)).toBeInTheDocument();
    expect(screen.getByTestId('progress-circle')).toBeInTheDocument();
  });
});

// Service testing approach
describe('habitService', () => {
  it('should complete habit and update streak', async () => {
    const habitId = 'test-habit-id';
    await habitService.completeHabit(habitId);
    
    const completion = await getLatestCompletion(habitId);
    expect(completion.streak).toBeGreaterThan(0);
  });
});
```

## 📈 Scalability Considerations

### Current Limitations
- **Single Region** - Firebase project in single region
- **Client-Side Logic** - Most business logic on client
- **Manual Scaling** - No auto-scaling infrastructure
- **Limited Caching** - Basic client-side caching only

### Future Scaling Plans
- **Multi-Region** - Deploy to multiple Firebase regions
- **Cloud Functions** - Move complex logic to server-side
- **CDN Integration** - Global content delivery network
- **Advanced Caching** - Redis for session and query caching
- **Microservices** - Break into smaller, focused services

### Performance Monitoring
```typescript
// Performance tracking
import perf from '@react-native-firebase/perf';

const trackScreenTransition = async (screenName: string) => {
  const trace = perf().newTrace(`screen_${screenName}`);
  await trace.start();
  
  return {
    stop: () => trace.stop()
  };
};
```

## 🎯 Architecture Decisions

### Key Technical Decisions
1. **React Native + Expo** - Chosen for rapid cross-platform development
2. **Firebase Suite** - Provides complete backend-as-a-service
3. **TypeScript** - Ensures type safety and better developer experience
4. **Real-time Architecture** - Firestore real-time listeners for live updates
5. **Component-Based UI** - Modular, reusable component architecture
6. **Context + Hooks** - Modern React patterns for state management

### Trade-offs Made
- **Firebase Lock-in** vs **Development Speed** - Chose speed for MVP
- **Client-Side Logic** vs **Server Performance** - Chose simplicity for MVP
- **Real-time Updates** vs **Battery Life** - Chose user experience
- **Feature Richness** vs **App Size** - Balanced with code splitting

### Future Architectural Evolution
```
Phase 1 (Current): Monolithic React Native + Firebase
Phase 2 (Growth): Enhanced Monolith + CDN + Cloud Functions
Phase 3 (Scale): Microservices + API Gateway + Multi-region
Phase 4 (Enterprise): Cloud-Native + Edge Computing + AI/ML
```

---

This architecture provides a solid foundation for GoalStreak's current needs while maintaining flexibility for future growth and evolution. The design emphasizes user experience, development velocity, and maintainability while preparing for scalability challenges as the platform grows.