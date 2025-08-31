# Testing Patterns and Best Practices

## Overview

This document outlines the established testing patterns, conventions, and best practices for the GoalStreak application. Following these patterns ensures consistency, maintainability, and reliability across our test suite.

## Core Testing Principles

### 1. Test Pyramid Structure
- **70% Unit Tests**: Fast, isolated, focused on individual functions/components
- **20% Integration Tests**: Test interactions between components and services
- **10% E2E Tests**: Test complete user workflows and critical paths

### 2. Testing Philosophy
- **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
- **Fail Fast**: Tests should fail quickly and provide clear error messages
- **Isolation**: Each test should be independent and not rely on other tests
- **Repeatability**: Tests should produce the same results every time

## Unit Testing Patterns

### 1. Service Layer Testing

```typescript
// Pattern: Service method testing with mocks
describe('HabitService', () => {
  let habitService: HabitService;
  let mockFirestore: jest.Mocked<FirestoreService>;

  beforeEach(() => {
    mockFirestore = createMockFirestore();
    habitService = new HabitService(mockFirestore);
  });

  describe('createHabit', () => {
    it('should create habit and return habit ID', async () => {
      // Arrange
      const habitData = createMockHabit({ name: 'Morning Run' });
      const expectedId = 'habit-123';
      mockFirestore.collection().add.mockResolvedValue({ id: expectedId });

      // Act
      const result = await habitService.createHabit('user-123', habitData);

      // Assert
      expect(result.id).toBe(expectedId);
      expect(mockFirestore.collection).toHaveBeenCalledWith('habits');
    });

    it('should validate habit data before creation', async () => {
      // Arrange
      const invalidHabit = createMockHabit({ name: '' });

      // Act & Assert
      await expect(
        habitService.createHabit('user-123', invalidHabit)
      ).rejects.toThrow('Habit name is required');
    });

    it('should handle Firestore errors gracefully', async () => {
      // Arrange
      const habitData = createMockHabit();
      mockFirestore.collection().add.mockRejectedValue(
        new Error('Firestore error')
      );

      // Act & Assert
      await expect(
        habitService.createHabit('user-123', habitData)
      ).rejects.toThrow('Failed to create habit');
    });
  });
});
```

### 2. Utility Function Testing

```typescript
// Pattern: Pure function testing
describe('streakCalculator', () => {
  describe('calculateCurrentStreak', () => {
    it('should return 0 for empty completions', () => {
      expect(calculateCurrentStreak([])).toBe(0);
    });

    it('should calculate consecutive days correctly', () => {
      const completions = [
        { date: '2025-01-01', completed: true },
        { date: '2025-01-02', completed: true },
        { date: '2025-01-03', completed: false },
        { date: '2025-01-04', completed: true }
      ];

      expect(calculateCurrentStreak(completions)).toBe(1);
    });

    it('should handle timezone edge cases', () => {
      const completions = [
        { date: '2025-01-01T23:59:59Z', completed: true },
        { date: '2025-01-02T00:00:01Z', completed: true }
      ];

      expect(calculateCurrentStreak(completions)).toBe(2);
    });
  });
});
```

### 3. Custom Hook Testing

```typescript
// Pattern: Hook testing with renderHook
import { renderHook, act } from '@testing-library/react-hooks';

describe('useHabits', () => {
  let mockHabitService: jest.Mocked<HabitService>;

  beforeEach(() => {
    mockHabitService = createMockHabitService();
  });

  it('should load habits on mount', async () => {
    // Arrange
    const mockHabits = [createMockHabit(), createMockHabit()];
    mockHabitService.getUserHabits.mockResolvedValue(mockHabits);

    // Act
    const { result, waitForNextUpdate } = renderHook(() => useHabits());

    // Assert initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.habits).toEqual([]);

    // Wait for async operation
    await waitForNextUpdate();

    // Assert final state
    expect(result.current.isLoading).toBe(false);
    expect(result.current.habits).toEqual(mockHabits);
  });

  it('should handle habit creation', async () => {
    const { result } = renderHook(() => useHabits());
    const newHabit = createMockHabit({ name: 'New Habit' });

    await act(async () => {
      await result.current.createHabit(newHabit);
    });

    expect(mockHabitService.createHabit).toHaveBeenCalledWith(newHabit);
  });
});
```

## Component Testing Patterns

### 1. Basic Component Rendering

```typescript
// Pattern: Component rendering and prop testing
describe('HabitCard', () => {
  const defaultProps = {
    habit: createMockHabit(),
    onToggle: jest.fn(),
    onDelete: jest.fn()
  };

  it('should render habit information', () => {
    const { getByText } = render(<HabitCard {...defaultProps} />);
    
    expect(getByText(defaultProps.habit.name)).toBeTruthy();
    expect(getByText(defaultProps.habit.category)).toBeTruthy();
  });

  it('should handle different habit states', () => {
    const completedHabit = createMockHabit({ completed: true });
    
    const { getByTestId } = render(
      <HabitCard {...defaultProps} habit={completedHabit} />
    );
    
    expect(getByTestId('completed-indicator')).toBeTruthy();
  });
});
```

### 2. User Interaction Testing

```typescript
// Pattern: User interaction and event handling
describe('HabitCard interactions', () => {
  it('should call onToggle when habit is pressed', () => {
    const mockOnToggle = jest.fn();
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onToggle={mockOnToggle} />
    );

    fireEvent.press(getByTestId('habit-card'));

    expect(mockOnToggle).toHaveBeenCalledWith(mockHabit.id);
    expect(mockOnToggle).toHaveBeenCalledTimes(1);
  });

  it('should show confirmation before deletion', async () => {
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <HabitCard habit={mockHabit} onDelete={mockOnDelete} />
    );

    fireEvent.press(getByTestId('delete-button'));

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(getByTestId('confirmation-dialog')).toBeTruthy();
    });

    fireEvent.press(getByTestId('confirm-delete'));

    expect(mockOnDelete).toHaveBeenCalledWith(mockHabit.id);
  });
});
```

### 3. Async Component Testing

```typescript
// Pattern: Testing components with async operations
describe('HabitList async behavior', () => {
  it('should show loading state initially', () => {
    const { getByTestId } = render(<HabitList />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('should display habits after loading', async () => {
    const mockHabits = [createMockHabit(), createMockHabit()];
    mockUseHabits.mockReturnValue({
      habits: mockHabits,
      isLoading: false,
      error: null
    });

    const { getByText } = render(<HabitList />);

    await waitFor(() => {
      mockHabits.forEach(habit => {
        expect(getByText(habit.name)).toBeTruthy();
      });
    });
  });

  it('should handle error states', async () => {
    mockUseHabits.mockReturnValue({
      habits: [],
      isLoading: false,
      error: new Error('Failed to load habits')
    });

    const { getByText } = render(<HabitList />);

    expect(getByText('Failed to load habits')).toBeTruthy();
  });
});
```

## Integration Testing Patterns

### 1. Firebase Integration Testing

```typescript
// Pattern: Firebase emulator integration tests
describe('Firebase Habit Integration', () => {
  let testEnv: RulesTestEnvironment;
  let authenticatedContext: RulesTestContext;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'goalstreak-test',
      firestore: { rules: firestoreRules }
    });
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
    authenticatedContext = testEnv.authenticatedContext('user-123');
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('should enforce security rules for habit access', async () => {
    const habitRef = authenticatedContext
      .firestore()
      .collection('habits')
      .doc('habit-123');

    // User can create their own habit
    await firebase.assertSucceeds(
      habitRef.set({
        userId: 'user-123',
        name: 'Test Habit',
        category: 'fitness'
      })
    );

    // Different user cannot access the habit
    const otherUserContext = testEnv.authenticatedContext('user-456');
    await firebase.assertFails(
      otherUserContext.firestore().collection('habits').doc('habit-123').get()
    );
  });
});
```

### 2. Service Integration Testing

```typescript
// Pattern: Multi-service integration testing
describe('Habit and Streak Integration', () => {
  let habitService: HabitService;
  let streakService: StreakService;

  beforeEach(() => {
    // Use real services with test database
    habitService = new HabitService(testFirestore);
    streakService = new StreakService(testFirestore);
  });

  it('should update streak when habit is completed', async () => {
    // Create habit
    const habit = await habitService.createHabit('user-123', {
      name: 'Daily Exercise',
      category: 'fitness'
    });

    // Complete habit
    await habitService.completeHabit(habit.id);

    // Verify streak is updated
    const streak = await streakService.getStreak(habit.id);
    expect(streak.currentStreak).toBe(1);
  });
});
```

## End-to-End Testing Patterns

### 1. User Journey Testing

```typescript
// Pattern: Complete user workflow testing
describe('Habit Management Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should complete full habit lifecycle', async () => {
    // Login
    await loginUser('test@example.com', 'password123');

    // Create habit
    await element(by.id('add-habit-button')).tap();
    await element(by.id('habit-name-input')).typeText('Morning Meditation');
    await element(by.id('category-mindfulness')).tap();
    await element(by.id('create-habit-button')).tap();

    // Verify habit appears
    await expect(element(by.text('Morning Meditation'))).toBeVisible();

    // Complete habit
    await element(by.id('habit-Morning Meditation')).tap();
    await expect(element(by.id('completed-indicator'))).toBeVisible();

    // Check streak
    await expect(element(by.text('1 day streak'))).toBeVisible();

    // Delete habit
    await element(by.id('habit-Morning Meditation')).longPress();
    await element(by.text('Delete')).tap();
    await element(by.text('Confirm')).tap();

    // Verify habit is removed
    await expect(element(by.text('Morning Meditation'))).not.toBeVisible();
  });
});
```

### 2. Cross-Platform Testing

```typescript
// Pattern: Platform-specific behavior testing
describe('Cross-Platform Compatibility', () => {
  it('should handle platform-specific navigation', async () => {
    if (device.getPlatform() === 'ios') {
      // iOS-specific navigation
      await element(by.id('back-button')).tap();
    } else {
      // Android-specific navigation
      await device.pressBack();
    }

    await expect(element(by.id('home-screen'))).toBeVisible();
  });

  it('should adapt to different screen sizes', async () => {
    const screenSize = await device.getScreenSize();
    
    if (screenSize.width < 400) {
      // Small screen layout
      await expect(element(by.id('compact-layout'))).toBeVisible();
    } else {
      // Large screen layout
      await expect(element(by.id('expanded-layout'))).toBeVisible();
    }
  });
});
```

## Test Data Patterns

### 1. Factory Pattern

```typescript
// Pattern: Flexible test data creation
export const createMockHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: `habit-${Date.now()}`,
  userId: 'user-123',
  name: 'Default Habit',
  category: 'fitness',
  frequency: 'daily',
  isPublic: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

export const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: `user-${Date.now()}`,
  email: 'test@example.com',
  displayName: 'Test User',
  createdAt: new Date(),
  ...overrides
});

// Usage in tests
const fitnessHabit = createMockHabit({ 
  category: 'fitness', 
  name: 'Morning Run' 
});

const completedHabit = createMockHabit({ 
  completed: true,
  completedAt: new Date()
});
```

### 2. Builder Pattern

```typescript
// Pattern: Complex test data building
class HabitBuilder {
  private habit: Partial<Habit> = {};

  withName(name: string): HabitBuilder {
    this.habit.name = name;
    return this;
  }

  withCategory(category: HabitCategory): HabitBuilder {
    this.habit.category = category;
    return this;
  }

  completed(): HabitBuilder {
    this.habit.completed = true;
    this.habit.completedAt = new Date();
    return this;
  }

  withStreak(days: number): HabitBuilder {
    this.habit.currentStreak = days;
    return this;
  }

  build(): Habit {
    return createMockHabit(this.habit);
  }
}

// Usage
const habit = new HabitBuilder()
  .withName('Morning Workout')
  .withCategory('fitness')
  .completed()
  .withStreak(7)
  .build();
```

## Mock Patterns

### 1. Service Mocking

```typescript
// Pattern: Comprehensive service mocking
export const createMockHabitService = (): jest.Mocked<HabitService> => ({
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  getUserHabits: jest.fn(),
  completeHabit: jest.fn(),
  uncompleteHabit: jest.fn(),
  getHabitCompletions: jest.fn()
});

// Usage with default implementations
const mockHabitService = createMockHabitService();
mockHabitService.getUserHabits.mockResolvedValue([]);
mockHabitService.createHabit.mockImplementation(async (userId, habit) => ({
  ...habit,
  id: `habit-${Date.now()}`,
  userId
}));
```

### 2. Firebase Mocking

```typescript
// Pattern: Firebase service mocking
export const createMockFirestore = () => ({
  collection: jest.fn(() => ({
    doc: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      onSnapshot: jest.fn()
    })),
    add: jest.fn(),
    where: jest.fn(() => mockFirestore.collection()),
    orderBy: jest.fn(() => mockFirestore.collection()),
    limit: jest.fn(() => mockFirestore.collection()),
    get: jest.fn(() => ({ docs: [] })),
    onSnapshot: jest.fn()
  }))
});
```

## Error Testing Patterns

### 1. Network Error Simulation

```typescript
// Pattern: Network failure testing
describe('Network Error Handling', () => {
  it('should retry failed requests', async () => {
    let callCount = 0;
    mockHabitService.getUserHabits.mockImplementation(() => {
      callCount++;
      if (callCount < 3) {
        throw new Error('Network error');
      }
      return Promise.resolve([]);
    });

    const result = await habitService.getUserHabitsWithRetry();
    
    expect(callCount).toBe(3);
    expect(result).toEqual([]);
  });

  it('should show user-friendly error messages', async () => {
    mockHabitService.getUserHabits.mockRejectedValue(
      new Error('Network error')
    );

    const { getByText } = render(<HabitList />);

    await waitFor(() => {
      expect(getByText('Unable to load habits. Please try again.')).toBeTruthy();
    });
  });
});
```

### 2. Validation Error Testing

```typescript
// Pattern: Input validation testing
describe('Input Validation', () => {
  it('should validate habit name length', async () => {
    const longName = 'a'.repeat(101); // Exceeds 100 char limit
    
    await expect(
      habitService.createHabit('user-123', { name: longName })
    ).rejects.toThrow('Habit name must be less than 100 characters');
  });

  it('should sanitize user input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('alert("xss")');
  });
});
```

## Performance Testing Patterns

### 1. Component Performance

```typescript
// Pattern: Component rendering performance
describe('HabitList Performance', () => {
  it('should render large lists efficiently', () => {
    const largeHabitList = Array.from({ length: 1000 }, (_, i) => 
      createMockHabit({ name: `Habit ${i}` })
    );

    const startTime = performance.now();
    render(<HabitList habits={largeHabitList} />);
    const renderTime = performance.now() - startTime;

    expect(renderTime).toBeLessThan(100); // 100ms threshold
  });

  it('should handle rapid state updates', async () => {
    const { rerender } = render(<HabitList habits={[]} />);

    const startTime = performance.now();
    
    for (let i = 0; i < 100; i++) {
      rerender(<HabitList habits={[createMockHabit()]} />);
    }
    
    const updateTime = performance.now() - startTime;
    expect(updateTime).toBeLessThan(500); // 500ms for 100 updates
  });
});
```

### 2. Memory Leak Testing

```typescript
// Pattern: Memory leak detection
describe('Memory Management', () => {
  it('should cleanup subscriptions on unmount', () => {
    const mockUnsubscribe = jest.fn();
    mockFirestore.collection().onSnapshot.mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<HabitList />);
    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should not retain references after cleanup', () => {
    const component = render(<HabitList />);
    const componentInstance = component.container;

    component.unmount();

    // Verify no lingering references
    expect(componentInstance.children.length).toBe(0);
  });
});
```

## Security Testing Patterns

### 1. Input Sanitization

```typescript
// Pattern: Security vulnerability testing
describe('Security Tests', () => {
  it('should prevent XSS attacks', () => {
    const maliciousInput = '<img src="x" onerror="alert(1)">';
    const sanitized = sanitizeHabitName(maliciousInput);
    
    expect(sanitized).not.toContain('<img');
    expect(sanitized).not.toContain('onerror');
  });

  it('should validate Firebase security rules', async () => {
    const unauthorizedContext = testEnv.unauthenticatedContext();
    
    await firebase.assertFails(
      unauthorizedContext.firestore().collection('habits').get()
    );
  });
});
```

### 2. Authentication Testing

```typescript
// Pattern: Authentication security testing
describe('Authentication Security', () => {
  it('should not expose sensitive data in logs', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    
    authService.signIn('user@test.com', 'password123');
    
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('password123')
    );
  });

  it('should handle token expiration', async () => {
    mockAuth.currentUser = null; // Simulate expired token
    
    const { getByText } = render(<ProtectedScreen />);
    
    await waitFor(() => {
      expect(getByText('Please sign in')).toBeTruthy();
    });
  });
});
```

## Accessibility Testing Patterns

### 1. Screen Reader Testing

```typescript
// Pattern: Accessibility compliance testing
describe('Accessibility', () => {
  it('should provide proper accessibility labels', () => {
    const { getByLabelText } = render(<HabitCard habit={mockHabit} />);
    
    expect(getByLabelText('Complete habit')).toBeTruthy();
    expect(getByLabelText(`Habit: ${mockHabit.name}`)).toBeTruthy();
  });

  it('should support keyboard navigation', () => {
    const { getByTestId } = render(<HabitForm />);
    const nameInput = getByTestId('habit-name-input');
    
    fireEvent(nameInput, 'focus');
    fireEvent(nameInput, 'keyPress', { key: 'Tab' });
    
    expect(getByTestId('category-picker')).toHaveFocus();
  });
});
```

## Test Maintenance Patterns

### 1. Test Refactoring

```typescript
// Pattern: Extracting common test setup
describe('HabitService Tests', () => {
  let habitService: HabitService;
  let mockFirestore: jest.Mocked<FirestoreService>;

  const setupHabitService = () => {
    mockFirestore = createMockFirestore();
    habitService = new HabitService(mockFirestore);
  };

  const createTestHabit = async (overrides = {}) => {
    const habitData = createMockHabit(overrides);
    return await habitService.createHabit('user-123', habitData);
  };

  beforeEach(() => {
    setupHabitService();
  });

  // Tests use helper functions for consistency
  it('should create habit', async () => {
    const habit = await createTestHabit({ name: 'Test Habit' });
    expect(habit.name).toBe('Test Habit');
  });
});
```

### 2. Test Documentation

```typescript
// Pattern: Self-documenting tests
describe('Streak Calculation Algorithm', () => {
  /**
   * Test Case: Consecutive Daily Completions
   * 
   * Given: A user has completed a habit for 5 consecutive days
   * When: The streak is calculated
   * Then: The current streak should be 5
   * 
   * Business Rule: Streaks are calculated based on consecutive days
   * without gaps, considering the user's timezone.
   */
  it('should calculate consecutive daily completions correctly', () => {
    const completions = createConsecutiveCompletions(5);
    const streak = calculateStreak(completions);
    expect(streak.currentStreak).toBe(5);
  });
});
```

These patterns provide a solid foundation for maintaining consistent, reliable, and maintainable tests across the GoalStreak application. Following these patterns helps ensure that our test suite remains effective as the application grows and evolves.