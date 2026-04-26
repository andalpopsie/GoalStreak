// Social Feature Types for GoalStreak

export interface Friend {
  id: string;
  userId: string;
  friendId: string;
  friendEmail: string;
  friendName: string;
  status: FriendStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type FriendStatus = 'pending' | 'accepted' | 'declined' | 'blocked';

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  fromUserName: string;
  toUserId: string;
  toUserEmail: string;
  status: FriendStatus;
  createdAt: Date;
  message?: string;
}

// Reaction types
export type ReactionType = 'heart' | 'flame' | 'medal';

export interface Reactions {
  [userId: string]: ReactionType[];
}

export interface SocialActivity {
  id: string;
  userId: string;
  userName: string;
  type: ActivityType;
  habitId: string;
  habitName: string;
  habitCategory: string;
  timestamp: Date;
  visibility: ActivityVisibility;
  streakCount?: number;
  completionCount?: number;
  milestone?: string;
  reactions?: Reactions;
  photoUrl?: string;
  caption?: string;
}

export type ActivityType = 
  | 'habit_completed'
  | 'streak_milestone'
  | 'habit_created'
  | 'goal_achieved'
  | 'weekly_goal_met'
  | 'progress_post';

export type ActivityVisibility = 'public' | 'friends' | 'private';

export interface SocialSettings {
  userId: string;
  defaultVisibility: ActivityVisibility;
  allowFriendRequests: boolean;
  shareStreakMilestones: boolean;
  shareHabitCompletions: boolean;
  shareNewHabits: boolean;
  notifyOnFriendActivity: boolean;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  totalHabits: number;
  totalCompletions: number;
  longestStreak: number;
  joinedAt: Date;
  isPublic: boolean;
}

// API Response Types
export interface FriendsResponse {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: FriendRequest[];
}

export interface ActivityFeedResponse {
  activities: SocialActivity[];
  hasMore: boolean;
  lastActivityId?: string;
}

// Search and Discovery
export interface UserSearchResult {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  mutualFriends: number;
  isFriend: boolean;
  hasPendingRequest: boolean;
}
