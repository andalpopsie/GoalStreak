import { 
  SocialActivity, 
  ActivityType, 
  Friend, 
  FriendRequest, 
  FriendStatus,
  ReactionType,
  Reactions,
  SocialSettings,
  UserProfile,
  ActivityVisibility
} from '../../types/social';

// Generate unique ID for testing
let socialIdCounter = 1;
const generateSocialId = (prefix: string = 'social'): string => `${prefix}-${socialIdCounter++}-${Date.now()}`;

// Realistic activity messages
const ACTIVITY_MESSAGES: Record<ActivityType, string[]> = {
  habit_completed: [
    'just completed their habit!',
    'crushed their daily goal!',
    'stayed consistent today!',
    'made progress on their journey!',
    'kept the streak alive!'
  ],
  streak_milestone: [
    'reached a new streak milestone!',
    'hit an amazing streak record!',
    'achieved consistency greatness!',
    'unlocked a new streak level!',
    'celebrated a streak achievement!'
  ],
  habit_created: [
    'started a new habit journey!',
    'committed to a new goal!',
    'began building a new routine!',
    'set a fresh intention!',
    'embarked on positive change!'
  ],
  goal_achieved: [
    'achieved their goal!',
    'reached their target!',
    'accomplished their mission!',
    'fulfilled their commitment!',
    'succeeded in their quest!'
  ],
  weekly_goal_met: [
    'completed their weekly goal!',
    'nailed their week!',
    'finished strong this week!',
    'achieved weekly success!',
    'conquered the week!'
  ]
};

/**
 * Create a mock Friend
 */
export const createMockFriend = (overrides: Partial<Friend> = {}): Friend => ({
  id: generateSocialId('friend'),
  userId: 'test-user-123',
  friendId: 'test-friend-456',
  friendEmail: 'friend@example.com',
  friendName: 'Friend User',
  status: 'accepted' as FriendStatus,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

/**
 * Create multiple mock friends
 */
export const createMockFriends = (count: number, userId = 'test-user-123'): Friend[] => {
  const friends: Friend[] = [];
  
  for (let i = 0; i < count; i++) {
    const createdDate = new Date('2025-01-01T00:00:00Z');
    createdDate.setDate(createdDate.getDate() + i);
    
    friends.push(createMockFriend({
      id: generateSocialId('friend'),
      userId,
      friendId: `test-friend-${i + 100}`,
      friendEmail: `friend${i + 1}@example.com`,
      friendName: `Friend ${i + 1}`,
      createdAt: createdDate,
      updatedAt: createdDate
    }));
  }
  
  return friends;
};

/**
 * Create a mock Friend Request
 */
export const createMockFriendRequest = (overrides: Partial<FriendRequest> = {}): FriendRequest => ({
  id: generateSocialId('request'),
  fromUserId: 'test-user-123',
  fromUserEmail: 'user@example.com',
  fromUserName: 'Test User',
  toUserId: 'test-user-456',
  toUserEmail: 'friend@example.com',
  status: 'pending' as FriendStatus,
  createdAt: new Date('2025-01-01T00:00:00Z'),
  message: 'Hi! Let\'s be accountability partners!',
  ...overrides
});

/**
 * Create multiple friend requests
 */
export const createMockFriendRequests = (
  count: number, 
  fromUserId = 'test-user-123'
): FriendRequest[] => {
  const requests: FriendRequest[] = [];
  const statuses: FriendStatus[] = ['pending', 'accepted', 'declined'];
  
  for (let i = 0; i < count; i++) {
    const createdDate = new Date('2025-01-01T00:00:00Z');
    createdDate.setHours(createdDate.getHours() + i);
    
    requests.push(createMockFriendRequest({
      id: generateSocialId('request'),
      fromUserId,
      toUserId: `test-user-${i + 200}`,
      toUserEmail: `user${i + 1}@example.com`,
      status: statuses[i % statuses.length],
      createdAt: createdDate
    }));
  }
  
  return requests;
};

/**
 * Create a mock Social Activity
 */
export const createMockSocialActivity = (overrides: Partial<SocialActivity> = {}): SocialActivity => {
  const activityType = (overrides.type || 'habit_completed') as ActivityType;
  const messages = ACTIVITY_MESSAGES[activityType] || ACTIVITY_MESSAGES.habit_completed;
  const randomMessage = messages[Math.floor(Math.random() * messages.length)];
  
  return {
    id: generateSocialId('activity'),
    userId: 'test-user-123',
    userName: 'Test User',
    type: activityType,
    habitId: 'test-habit-123',
    habitName: 'Morning Workout',
    habitCategory: 'fitness',
    timestamp: new Date('2025-01-01T10:00:00Z'),
    visibility: 'friends' as ActivityVisibility,
    streakCount: activityType === 'streak_milestone' ? Math.floor(Math.random() * 50) + 1 : undefined,
    completionCount: activityType === 'habit_completed' ? 1 : undefined,
    milestone: activityType === 'streak_milestone' ? `${Math.floor(Math.random() * 50) + 1} days` : undefined,
    reactions: {
      'test-friend-1': ['heart'],
      'test-friend-2': ['flame', 'medal']
    } as Reactions,
    ...overrides
  };
};

/**
 * Create multiple social activities
 */
export const createMockSocialActivities = (count: number, userId = 'test-user-123'): SocialActivity[] => {
  const activities: SocialActivity[] = [];
  const types: ActivityType[] = ['habit_completed', 'streak_milestone', 'habit_created', 'goal_achieved'];
  const categories = ['fitness', 'wellness', 'productivity', 'learning', 'social'];
  const visibilities: ActivityVisibility[] = ['public', 'friends', 'private'];
  
  for (let i = 0; i < count; i++) {
    const activityType = types[i % types.length];
    const timestamp = new Date('2025-01-01T10:00:00Z');
    timestamp.setHours(timestamp.getHours() + i);
    
    // Create realistic reactions
    const reactions: Reactions = {};
    const numReactors = Math.floor(Math.random() * 4); // 0-3 reactors
    for (let j = 0; j < numReactors; j++) {
      const reactorId = `test-friend-${j + 1}`;
      const reactionTypes: ReactionType[] = ['heart', 'flame', 'medal'];
      const numReactions = Math.floor(Math.random() * 2) + 1; // 1-2 reactions per user
      reactions[reactorId] = [];
      
      for (let k = 0; k < numReactions; k++) {
        const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
        if (!reactions[reactorId].includes(reactionType)) {
          reactions[reactorId].push(reactionType);
        }
      }
    }
    
    activities.push(createMockSocialActivity({
      id: generateSocialId('activity'),
      userId,
      userName: `User ${userId.split('-').pop()}`,
      type: activityType,
      habitId: `test-habit-${i + 1}`,
      habitName: `Habit ${i + 1}`,
      habitCategory: categories[i % categories.length],
      timestamp,
      visibility: visibilities[i % visibilities.length],
      reactions,
      streakCount: activityType === 'streak_milestone' ? Math.floor(Math.random() * 30) + 1 : undefined,
      completionCount: activityType === 'habit_completed' ? 1 : undefined
    }));
  }
  
  return activities;
};

/**
 * Create mock Social Settings
 */
export const createMockSocialSettings = (overrides: Partial<SocialSettings> = {}): SocialSettings => ({
  userId: 'test-user-123',
  defaultVisibility: 'friends' as ActivityVisibility,
  allowFriendRequests: true,
  shareStreakMilestones: true,
  shareHabitCompletions: true,
  shareNewHabits: false,
  notifyOnFriendActivity: true,
  updatedAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides
});

/**
 * Create mock User Profile
 */
export const createMockUserProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  avatar: undefined,
  bio: 'Building better habits every day! 💪',
  totalHabits: Math.floor(Math.random() * 20) + 1,
  totalCompletions: Math.floor(Math.random() * 500) + 50,
  longestStreak: Math.floor(Math.random() * 100) + 10,
  joinedAt: new Date('2025-01-01T00:00:00Z'),
  isPublic: true,
  ...overrides
});

/**
 * Create multiple user profiles
 */
export const createMockUserProfiles = (count: number): UserProfile[] => {
  const profiles: UserProfile[] = [];
  
  for (let i = 0; i < count; i++) {
    const joinedDate = new Date('2025-01-01T00:00:00Z');
    joinedDate.setDate(joinedDate.getDate() + i);
    
    profiles.push(createMockUserProfile({
      id: `test-user-${i + 100}`,
      email: `user${i + 1}@example.com`,
      name: `User ${i + 1}`,
      avatar: i % 3 === 0 ? `https://mock-avatar.com/user-${i}.jpg` : undefined,
      bio: i % 2 === 0 ? `Passionate about growth and habits! Day ${i + 1} of my journey.` : undefined,
      joinedAt: joinedDate,
      isPublic: i % 4 !== 0 // Most profiles are public
    }));
  }
  
  return profiles;
};

/**
 * Create a complete social network (user + friends + activities)
 */
export const createMockSocialNetwork = (userId: string = 'test-user-123') => {
  const friends = createMockFriends(5, userId);
  const activities = createMockSocialActivities(15, userId);
  const friendRequests = createMockFriendRequests(3, userId);
  const socialSettings = createMockSocialSettings({ userId });
  const userProfile = createMockUserProfile({ id: userId });
  
  // Add some activities from friends
  const friendActivities = friends.slice(0, 3).flatMap(friend => 
    createMockSocialActivities(3, friend.friendId)
  );
  
  return {
    user: { id: userId },
    friends,
    activities: [...activities, ...friendActivities],
    friendRequests,
    socialSettings,
    userProfile
  };
};

/**
 * Create reaction data
 */
export const createMockReactions = (activityId: string, userIds: string[]): Reactions => {
  const reactions: Reactions = {};
  const reactionTypes: ReactionType[] = ['heart', 'flame', 'medal'];
  
  userIds.forEach(userId => {
    const numReactions = Math.floor(Math.random() * 2) + 1; // 1-2 reactions per user
    reactions[userId] = [];
    
    for (let i = 0; i < numReactions; i++) {
      const reactionType = reactionTypes[Math.floor(Math.random() * reactionTypes.length)];
      if (!reactions[userId].includes(reactionType)) {
        reactions[userId].push(reactionType);
      }
    }
  });
  
  return reactions;
};

/**
 * Reset social ID counter for consistent testing
 */
export const resetSocialFactoryIds = (): void => {
  socialIdCounter = 1;
};