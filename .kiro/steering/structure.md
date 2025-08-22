# GoalStreak - Project Structure & Organization

## Project Organization
This is a React Native + Expo project following standard mobile app architecture patterns.

## Recommended Folder Structure
```
/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components (Button, Card, etc.)
│   │   ├── habit/           # Habit-specific components
│   │   └── charts/          # Chart and visualization components
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── home/            # Home/Today view screens
│   │   ├── progress/        # Progress dashboard screens
│   │   ├── accountability/  # Friend/accountability screens
│   │   └── profile/         # Profile and settings screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # Firebase and API services
│   │   ├── auth.ts          # Authentication service
│   │   ├── firestore.ts     # Database operations
│   │   └── notifications.ts # Push notification service
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Helper functions and utilities
│   ├── hooks/               # Custom React hooks
│   └── constants/           # App constants (colors, dimensions, etc.)
├── assets/                  # Images, fonts, icons
├── design-images/           # Design inspiration and mockups
└── .kiro/                   # Kiro configuration and steering
```

## File Naming Conventions
- **Components**: PascalCase (e.g., `HabitCard.tsx`, `ProgressChart.tsx`)
- **Screens**: PascalCase with Screen suffix (e.g., `HomeScreen.tsx`, `LoginScreen.tsx`)
- **Services**: camelCase (e.g., `authService.ts`, `firestoreService.ts`)
- **Types**: PascalCase with Type suffix (e.g., `UserType.ts`, `HabitType.ts`)
- **Utils**: camelCase (e.g., `dateUtils.ts`, `validationUtils.ts`)

## Navigation Structure
Bottom Tab Navigation with 4 main tabs:
- **Home**: Today's habits and daily checklist
- **Progress**: Weekly/monthly charts and weight tracking
- **Accountability**: Friend management and progress sharing
- **Profile**: Settings, notifications, and user management

## Data Flow Patterns
- Use Firebase Firestore for real-time data synchronization
- Implement proper loading states for all async operations
- Use React hooks for state management (useState, useEffect, custom hooks)
- Follow unidirectional data flow principles
- Implement proper error boundaries and error handling

## Component Architecture
- Keep components small and focused on single responsibilities
- Use composition over inheritance
- Implement proper prop typing with TypeScript interfaces
- Follow React Native performance best practices
- Use memo() for expensive components when appropriate