// Test Data Factories
import { createMockHabit, createMockHabits, createMockHabitWithData, resetHabitFactoryIds } from './habitFactory';
import { createMockUser, createMockUsers, createMockAuthUser, resetUserFactoryIds } from './userFactory';
import { createMockFriend, createMockSocialNetwork, resetSocialFactoryIds } from './socialFactory';

describe('Test Data Factories', () => {
  beforeEach(() => {
    resetHabitFactoryIds();
    resetUserFactoryIds();
    resetSocialFactoryIds();
  });

  describe('Habit Factory', () => {
    it('should create a valid mock habit', () => {
      const habit = createMockHabit();
      
      expect(habit).toHaveProperty('id');
      expect(habit).toHaveProperty('userId');
      expect(habit).toHaveProperty('name');
      expect(habit).toHaveProperty('category');
      expect(habit).toHaveProperty('frequency');
      expect(habit).toHaveProperty('isPublic');
      expect(habit).toHaveProperty('createdAt');
      expect(habit).toHaveProperty('updatedAt');
      
      expect(typeof habit.id).toBe('string');
      expect(typeof habit.name).toBe('string');
      expect(['daily', 'weekly', 'monthly']).toContain(habit.frequency);
      expect(typeof habit.isPublic).toBe('boolean');
    });

    it('should create multiple habits with variety', () => {
      const habits = createMockHabits(5);
      
      expect(habits).toHaveLength(5);
      
      // Check that habits have different properties
      const categories = new Set(habits.map(h => h.category));
      expect(categories.size).toBeGreaterThan(1);
      
      // Check that all habits have required properties
      habits.forEach(habit => {
        expect(habit).toHaveProperty('id');
        expect(habit).toHaveProperty('name');
        expect(habit).toHaveProperty('category');
      });
    });

    it('should create habit with complete data', () => {
      const { habit, completions, streak } = createMockHabitWithData();
      
      expect(habit).toHaveProperty('id');
      expect(completions).toBeInstanceOf(Array);
      expect(completions.length).toBeGreaterThan(0);
      expect(streak).toHaveProperty('habitId', habit.id);
      expect(streak).toHaveProperty('currentStreak');
      expect(streak).toHaveProperty('longestStreak');
    });

    it('should allow overrides', () => {
      const customName = 'Custom Habit Name';
      const customCategory = 'fitness';
      
      const habit = createMockHabit({
        name: customName,
        category: customCategory
      });
      
      expect(habit.name).toBe(customName);
      expect(habit.category).toBe(customCategory);
    });
  });

  describe('User Factory', () => {
    it('should create a valid mock user', () => {
      const user = createMockUser();
      
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('displayName');
      expect(user).toHaveProperty('createdAt');
      expect(user).toHaveProperty('updatedAt');
      
      expect(typeof user.id).toBe('string');
      expect(typeof user.email).toBe('string');
      expect(user.email).toMatch(/@/);
      expect(typeof user.displayName).toBe('string');
    });

    it('should create multiple users with variety', () => {
      const users = createMockUsers(3);
      
      expect(users).toHaveLength(3);
      
      // Check that users have different emails
      const emails = new Set(users.map(u => u.email));
      expect(emails.size).toBe(3);
      
      // Check that all users have required properties
      users.forEach(user => {
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('displayName');
      });
    });

    it('should create a valid auth user', () => {
      const authUser = createMockAuthUser();
      
      expect(authUser).toHaveProperty('uid');
      expect(authUser).toHaveProperty('email');
      expect(authUser).toHaveProperty('displayName');
      expect(authUser).toHaveProperty('emailVerified');
      expect(authUser).toHaveProperty('getIdToken');
      expect(authUser).toHaveProperty('reload');
      
      expect(typeof authUser.getIdToken).toBe('function');
      expect(typeof authUser.reload).toBe('function');
    });
  });

  describe('Social Factory', () => {
    it('should create a valid mock friend', () => {
      const friend = createMockFriend();
      
      expect(friend).toHaveProperty('id');
      expect(friend).toHaveProperty('userId');
      expect(friend).toHaveProperty('friendId');
      expect(friend).toHaveProperty('friendEmail');
      expect(friend).toHaveProperty('friendName');
      expect(friend).toHaveProperty('status');
      expect(friend).toHaveProperty('createdAt');
      
      expect(typeof friend.id).toBe('string');
      expect(typeof friend.friendEmail).toBe('string');
      expect(friend.friendEmail).toMatch(/@/);
      expect(['pending', 'accepted', 'declined', 'blocked']).toContain(friend.status);
    });

    it('should create a complete social network', () => {
      const network = createMockSocialNetwork();
      
      expect(network).toHaveProperty('user');
      expect(network).toHaveProperty('friends');
      expect(network).toHaveProperty('activities');
      expect(network).toHaveProperty('friendRequests');
      expect(network).toHaveProperty('socialSettings');
      expect(network).toHaveProperty('userProfile');
      
      expect(network.friends).toBeInstanceOf(Array);
      expect(network.activities).toBeInstanceOf(Array);
      expect(network.friendRequests).toBeInstanceOf(Array);
      
      expect(network.friends.length).toBeGreaterThan(0);
      expect(network.activities.length).toBeGreaterThan(0);
    });
  });

  describe('Factory ID Reset', () => {
    it('should generate consistent IDs after reset', () => {
      // Create some data
      const habit1 = createMockHabit();
      const user1 = createMockUser();
      
      // Reset and create again
      resetHabitFactoryIds();
      resetUserFactoryIds();
      
      const habit2 = createMockHabit();
      const user2 = createMockUser();
      
      // IDs should follow the same pattern (but with different timestamps)
      expect(habit1.id).toMatch(/^habit-\d+-\d+$/);
      expect(habit2.id).toMatch(/^habit-\d+-\d+$/);
      expect(user1.id).toMatch(/^test-user-\d+-\d+$/);
      expect(user2.id).toMatch(/^test-user-\d+-\d+$/);
    });
  });
});