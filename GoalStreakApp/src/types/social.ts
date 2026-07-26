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

// ── Accountability Group Types ──

export type GroupStatus = 'active' | 'ended';
export type GroupRole = 'admin' | 'member';
export type GroupInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export type GroupActivityType =
  | 'habit_completed'
  | 'streak_milestone'
  | 'member_joined'
  | 'member_left';

export interface GroupMember {
  userId: string;
  userName: string;
  role: GroupRole;
  joinedAt: Date;
}

export interface Group {
  id: string;
  name: string;                    // 3–50 characters
  description: string;             // 0–200 characters
  category: string;                // habit category from existing system
  adminId: string;                 // userId of creator
  members: GroupMember[];          // 1–10 members (includes admin)
  memberIds: string[];             // denormalized for Firestore array-contains queries
  status: GroupStatus;
  createdAt: Date;
  updatedAt: Date;
  endDate?: Date;                  // optional, at least 1 day in future
  endedAt?: Date;                  // when the group was ended
}

export interface GroupInvitation {
  id: string;
  groupId: string;
  groupName: string;
  groupDescription: string;
  fromUserId: string;              // admin who sent it
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  status: GroupInvitationStatus;
  memberCount: number;             // current member count at time of invite
  createdAt: Date;
  updatedAt?: Date;
}

export interface TrackedHabit {
  id: string;
  groupId: string;
  userId: string;
  habitId: string;
  habitName: string;
  habitCategory: string;
  linkedAt: Date;
}

export interface GroupActivity {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  type: GroupActivityType;
  habitId?: string;
  habitName?: string;
  habitCategory?: string;
  streakCount?: number;
  timestamp: Date;
  reactions?: Reactions;           // reuses existing Reactions type
}

export interface GroupProgress {
  userId: string;
  userName: string;
  habits: {
    habitId: string;
    habitName: string;
    habitCategory: string;
    completedToday: boolean;
    currentStreak: number;
  }[];
}

export interface CreateGroupForm {
  name: string;
  description: string;
  category: string;
  endDate?: Date;
}

// ── Group Chat Types ──

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Date;
}

// ── Moderation Types (Report & Block) ──

export interface Block {
  id: string;
  blockerId: string;
  blockedUserId: string;
  createdAt: Date;
}

export type ReportContentType = 'user' | 'activity' | 'group_activity' | 'group_message';

export type ReportReason =
  | 'harassment'
  | 'spam'
  | 'inappropriate'
  | 'hate_speech'
  | 'impersonation'
  | 'other';

export type ReportStatus = 'pending' | 'reviewed' | 'actioned';

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  contentType: ReportContentType;
  contentId: string;
  reason: ReportReason;
  timestamp: Date;
  status: ReportStatus;
}

export interface ModerationState {
  blockedUserIds: Set<string>;   // bidirectional
  reportedContentIds: Set<string>;
}
