/**
 * Checkpoint 6 — Accountability Groups UI Component Render Tests
 *
 * Verifies that all group UI components render without errors.
 * Each component is tested with minimal valid props and appropriate mocks.
 */
import React from 'react';
import { render } from '@testing-library/react-native';
import { Group, GroupInvitation, GroupProgress, GroupActivity } from '../../types/social';

// ── Mocks ──

// Mock useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-1', email: 'test@test.com', displayName: 'Test User' },
  }),
}));

// Mock useGroups
jest.mock('../../hooks/useGroups', () => ({
  useGroups: () => ({
    groups: [],
    recentlyEndedGroups: [],
    pendingInvitations: [],
    isLoadingGroups: false,
    isCreating: false,
    isProcessingInvitation: false,
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    createGroup: jest.fn(),
    refreshGroups: jest.fn(),
    pendingInvitationCount: 0,
    error: null,
  }),
  __esModule: true,
  default: () => ({
    groups: [],
    recentlyEndedGroups: [],
    pendingInvitations: [],
    isLoadingGroups: false,
    isCreating: false,
    isProcessingInvitation: false,
    acceptInvitation: jest.fn(),
    declineInvitation: jest.fn(),
    createGroup: jest.fn(),
    refreshGroups: jest.fn(),
    pendingInvitationCount: 0,
    error: null,
  }),
}));

// Mock useGroupDetail
jest.mock('../../hooks/useGroupDetail', () => ({
  useGroupDetail: () => ({
    group: null,
    progress: [],
    feed: [],
    trackedHabits: [],
    completionPercentage: 0,
    isLoading: false,
    isLinking: false,
    linkHabits: jest.fn(),
    unlinkHabit: jest.fn(),
    inviteMember: jest.fn(),
    removeMember: jest.fn(),
    leaveGroup: jest.fn(),
    endGroup: jest.fn(),
    updateGroup: jest.fn(),
    addReaction: jest.fn(),
    isAdmin: false,
    error: null,
  }),
  __esModule: true,
  default: () => ({
    group: null,
    progress: [],
    feed: [],
    trackedHabits: [],
    completionPercentage: 0,
    isLoading: false,
    isLinking: false,
    linkHabits: jest.fn(),
    unlinkHabit: jest.fn(),
    inviteMember: jest.fn(),
    removeMember: jest.fn(),
    leaveGroup: jest.fn(),
    endGroup: jest.fn(),
    updateGroup: jest.fn(),
    addReaction: jest.fn(),
    isAdmin: false,
    error: null,
  }),
}));

// Mock useHabits
jest.mock('../../hooks/useHabits', () => ({
  useHabits: () => ({
    habits: [],
    isLoading: false,
    error: null,
  }),
  __esModule: true,
  default: () => ({
    habits: [],
    isLoading: false,
    error: null,
  }),
}));

// Mock groupService
jest.mock('../../services/groupService', () => ({
  __esModule: true,
  default: {
    validateGroupName: jest.fn((name: string) => {
      const trimmed = name.trim();
      if (trimmed.length < 3 || trimmed.length > 50) {
        return { valid: false, error: 'Group name must be between 3 and 50 characters' };
      }
      return { valid: true };
    }),
    validateGroupDescription: jest.fn((desc: string) => {
      if (desc.length > 200) {
        return { valid: false, error: 'Description must be 200 characters or less' };
      }
      return { valid: true };
    }),
    validateEndDate: jest.fn(() => ({ valid: true })),
    getGroupCompletionPercentage: jest.fn(() => Promise.resolve(0)),
    getGroupInvitableFriends: jest.fn(() => Promise.resolve([])),
    calculateCompletionPercentage: jest.fn(() => 0),
    subscribeToUserGroups: jest.fn(() => jest.fn()),
    subscribeToGroupInvitations: jest.fn(() => jest.fn()),
    subscribeToGroupFeed: jest.fn(() => jest.fn()),
    subscribeToGroupProgress: jest.fn(() => jest.fn()),
    getTrackedHabits: jest.fn(() => Promise.resolve([])),
    getGroup: jest.fn(() => Promise.resolve(null)),
    getUserGroups: jest.fn(() => Promise.resolve([])),
    getPendingInvitations: jest.fn(() => Promise.resolve([])),
    createGroup: jest.fn(() => Promise.resolve('group-1')),
    linkHabits: jest.fn(() => Promise.resolve()),
    unlinkHabit: jest.fn(() => Promise.resolve()),
    inviteMember: jest.fn(() => Promise.resolve()),
    removeMember: jest.fn(() => Promise.resolve()),
    leaveGroup: jest.fn(() => Promise.resolve()),
    endGroup: jest.fn(() => Promise.resolve()),
    updateGroup: jest.fn(() => Promise.resolve()),
    addGroupReaction: jest.fn(() => Promise.resolve()),
  },
}));

// Mock categoryIcons utility
jest.mock('../../utils/categoryIcons', () => ({
  getCategoryIcon: jest.fn(() => 'fitness'),
  getCategoryColor: jest.fn(() => '#B771E5'),
}));

// Mock timeUtils
jest.mock('../../utils/timeUtils', () => ({
  formatRelativeTime: jest.fn(() => '2m ago'),
}));

// Mock react-navigation
jest.mock('@react-navigation/native', () => ({
  useRoute: () => ({ params: { groupId: 'group-1' } }),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
}));

jest.mock('@react-navigation/stack', () => ({
  StackNavigationProp: {},
}));

// ── Test Data Factories ──

const makeGroup = (overrides?: Partial<Group>): Group => ({
  id: 'group-1',
  name: 'Morning Runners',
  description: 'Run every morning together',
  category: 'fitness',
  adminId: 'user-1',
  members: [
    { userId: 'user-1', userName: 'Test User', role: 'admin', joinedAt: new Date() },
    { userId: 'user-2', userName: 'Jane Doe', role: 'member', joinedAt: new Date() },
  ],
  status: 'active',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const makeInvitation = (overrides?: Partial<GroupInvitation>): GroupInvitation => ({
  id: 'inv-1',
  groupId: 'group-1',
  groupName: 'Morning Runners',
  groupDescription: 'Run every morning together',
  fromUserId: 'user-1',
  fromUserName: 'Test User',
  toUserId: 'user-3',
  toUserName: 'Bob Smith',
  status: 'pending',
  memberCount: 2,
  createdAt: new Date(),
  ...overrides,
});

const makeProgress = (overrides?: Partial<GroupProgress>): GroupProgress => ({
  userId: 'user-1',
  userName: 'Test User',
  habits: [
    {
      habitId: 'habit-1',
      habitName: 'Morning Run',
      habitCategory: 'fitness',
      completedToday: true,
      currentStreak: 7,
    },
    {
      habitId: 'habit-2',
      habitName: 'Stretching',
      habitCategory: 'wellness',
      completedToday: false,
      currentStreak: 3,
    },
  ],
  ...overrides,
});

const makeActivity = (overrides?: Partial<GroupActivity>): GroupActivity => ({
  id: 'activity-1',
  groupId: 'group-1',
  userId: 'user-2',
  userName: 'Jane Doe',
  type: 'habit_completed',
  habitId: 'habit-1',
  habitName: 'Morning Run',
  habitCategory: 'fitness',
  timestamp: new Date(),
  ...overrides,
});

// ── Component Imports (after mocks) ──

import GroupCard from '../../components/social/GroupCard';
import GroupInvitationCard from '../../components/social/GroupInvitationCard';
import GroupProgressCard from '../../components/social/GroupProgressCard';
import GroupFeedCard from '../../components/social/GroupFeedCard';
import GroupCreateForm from '../../components/social/GroupCreateForm';
import GroupsTab from '../../components/social/GroupsTab';
import LinkHabitsModal from '../../components/social/LinkHabitsModal';
import InviteMembersModal from '../../components/social/InviteMembersModal';
import GroupSettingsModal from '../../components/social/GroupSettingsModal';

// ── Tests ──

describe('Accountability Groups — UI Component Render Tests', () => {
  // ── GroupCard ──
  describe('GroupCard', () => {
    it('renders without errors with valid props', () => {
      const group = makeGroup();
      const { getByText } = render(
        <GroupCard group={group} completionPercentage={57} onPress={jest.fn()} />
      );
      expect(getByText('Morning Runners')).toBeTruthy();
      expect(getByText('57%')).toBeTruthy();
      expect(getByText('2 members')).toBeTruthy();
    });

    it('renders singular member count for 1 member', () => {
      const group = makeGroup({
        members: [{ userId: 'user-1', userName: 'Test User', role: 'admin', joinedAt: new Date() }],
      });
      const { getByText } = render(
        <GroupCard group={group} completionPercentage={100} onPress={jest.fn()} />
      );
      expect(getByText('1 member')).toBeTruthy();
    });

    it('renders 0% completion', () => {
      const group = makeGroup();
      const { getByText } = render(
        <GroupCard group={group} completionPercentage={0} onPress={jest.fn()} />
      );
      expect(getByText('0%')).toBeTruthy();
    });
  });

  // ── GroupInvitationCard ──
  describe('GroupInvitationCard', () => {
    it('renders without errors with valid props', () => {
      const invitation = makeInvitation();
      const { getByText } = render(
        <GroupInvitationCard
          invitation={invitation}
          onAccept={jest.fn()}
          onDecline={jest.fn()}
          isProcessing={false}
        />
      );
      expect(getByText('Morning Runners')).toBeTruthy();
      expect(getByText('Invited by Test User')).toBeTruthy();
      expect(getByText('Run every morning together')).toBeTruthy();
      expect(getByText('2 members')).toBeTruthy();
      expect(getByText('Accept')).toBeTruthy();
      expect(getByText('Decline')).toBeTruthy();
    });

    it('renders without description when empty', () => {
      const invitation = makeInvitation({ groupDescription: '' });
      const { getByText, queryByText } = render(
        <GroupInvitationCard
          invitation={invitation}
          onAccept={jest.fn()}
          onDecline={jest.fn()}
          isProcessing={false}
        />
      );
      expect(getByText('Morning Runners')).toBeTruthy();
      expect(queryByText('Run every morning together')).toBeNull();
    });

    it('renders singular member count for 1 member', () => {
      const invitation = makeInvitation({ memberCount: 1 });
      const { getByText } = render(
        <GroupInvitationCard
          invitation={invitation}
          onAccept={jest.fn()}
          onDecline={jest.fn()}
          isProcessing={false}
        />
      );
      expect(getByText('1 member')).toBeTruthy();
    });
  });

  // ── GroupProgressCard ──
  describe('GroupProgressCard', () => {
    it('renders without errors with habits', () => {
      const progress = makeProgress();
      const { getByText } = render(<GroupProgressCard memberProgress={progress} />);
      expect(getByText('Test User')).toBeTruthy();
      expect(getByText('1/2 completed today')).toBeTruthy();
      expect(getByText('Morning Run')).toBeTruthy();
      expect(getByText('Stretching')).toBeTruthy();
      expect(getByText('7')).toBeTruthy(); // streak count
    });

    it('renders empty state when no habits linked', () => {
      const progress = makeProgress({ habits: [] });
      const { getByText } = render(<GroupProgressCard memberProgress={progress} />);
      expect(getByText('No habits linked yet')).toBeTruthy();
      expect(getByText('0/0 completed today')).toBeTruthy();
    });
  });

  // ── GroupFeedCard ──
  describe('GroupFeedCard', () => {
    it('renders habit_completed activity', () => {
      const activity = makeActivity();
      const { getByText } = render(
        <GroupFeedCard activity={activity} onReaction={jest.fn()} currentUserId="user-1" />
      );
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('renders streak_milestone activity', () => {
      const activity = makeActivity({
        type: 'streak_milestone',
        streakCount: 30,
      });
      const { getByText } = render(
        <GroupFeedCard activity={activity} onReaction={jest.fn()} currentUserId="user-1" />
      );
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('renders member_joined system event', () => {
      const activity = makeActivity({ type: 'member_joined' });
      const { getByText } = render(
        <GroupFeedCard activity={activity} onReaction={jest.fn()} currentUserId="user-1" />
      );
      expect(getByText('Jane Doe')).toBeTruthy();
    });

    it('renders member_left system event', () => {
      const activity = makeActivity({ type: 'member_left' });
      const { getByText } = render(
        <GroupFeedCard activity={activity} onReaction={jest.fn()} currentUserId="user-1" />
      );
      expect(getByText('Jane Doe')).toBeTruthy();
    });
  });

  // ── GroupCreateForm ──
  describe('GroupCreateForm', () => {
    it('renders without errors when visible', () => {
      const { getAllByText, getByText } = render(
        <GroupCreateForm
          visible={true}
          onClose={jest.fn()}
          onCreate={jest.fn()}
          isCreating={false}
        />
      );
      // "Create Group" appears in both header and submit button
      expect(getAllByText('Create Group').length).toBeGreaterThanOrEqual(1);
      expect(getByText(/Group Name/)).toBeTruthy();
    });

    it('does not render content when not visible', () => {
      const { queryByText } = render(
        <GroupCreateForm
          visible={false}
          onClose={jest.fn()}
          onCreate={jest.fn()}
          isCreating={false}
        />
      );
      // Modal content should not be rendered when not visible
      expect(queryByText('Create Group')).toBeNull();
    });
  });

  // ── GroupsTab ──
  describe('GroupsTab', () => {
    it('renders empty state when no groups and no invitations', () => {
      const { getByText } = render(
        <GroupsTab onCreateGroup={jest.fn()} onNavigateToGroup={jest.fn()} />
      );
      expect(getByText('No Groups Yet')).toBeTruthy();
    });
  });

  // ── LinkHabitsModal ──
  describe('LinkHabitsModal', () => {
    it('renders without errors when visible with no habits', () => {
      const { getAllByText, getByText } = render(
        <LinkHabitsModal
          visible={true}
          onClose={jest.fn()}
          onLink={jest.fn()}
          userHabits={[]}
          alreadyLinkedHabitIds={[]}
          isLinking={false}
        />
      );
      // "Link Habits" appears in header title and may appear in button
      expect(getAllByText(/Link Habits?/).length).toBeGreaterThanOrEqual(1);
      expect(getByText('No habits to link. Create some habits first!')).toBeTruthy();
    });

    it('renders habit list when habits provided', () => {
      const habits = [
        {
          id: 'h1',
          userId: 'user-1',
          name: 'Morning Run',
          category: 'fitness' as const,
          frequency: 'daily' as const,
          isPublic: true,
        },
      ];
      const { getByText } = render(
        <LinkHabitsModal
          visible={true}
          onClose={jest.fn()}
          onLink={jest.fn()}
          userHabits={habits as any}
          alreadyLinkedHabitIds={[]}
          isLinking={false}
        />
      );
      expect(getByText('Morning Run')).toBeTruthy();
    });
  });

  // ── InviteMembersModal ──
  describe('InviteMembersModal', () => {
    it('renders without errors when visible', () => {
      const { getByText } = render(
        <InviteMembersModal
          visible={true}
          onClose={jest.fn()}
          groupId="group-1"
          onInvite={jest.fn()}
          memberCount={3}
        />
      );
      expect(getByText('Invite Members')).toBeTruthy();
      expect(getByText('3/10 members')).toBeTruthy();
    });

    it('shows full message when at member limit', () => {
      const { getByText } = render(
        <InviteMembersModal
          visible={true}
          onClose={jest.fn()}
          groupId="group-1"
          onInvite={jest.fn()}
          memberCount={10}
        />
      );
      expect(getByText('Full')).toBeTruthy();
    });
  });

  // ── GroupSettingsModal ──
  describe('GroupSettingsModal', () => {
    it('renders admin view without errors', () => {
      const group = makeGroup();
      const { getByText } = render(
        <GroupSettingsModal
          visible={true}
          onClose={jest.fn()}
          group={group}
          isAdmin={true}
          onUpdateGroup={jest.fn()}
          onRemoveMember={jest.fn()}
          onLeaveGroup={jest.fn()}
          onEndGroup={jest.fn()}
        />
      );
      expect(getByText('Group Settings')).toBeTruthy();
      expect(getByText('End Group')).toBeTruthy();
    });

    it('renders member view without errors', () => {
      const group = makeGroup();
      const { getByText } = render(
        <GroupSettingsModal
          visible={true}
          onClose={jest.fn()}
          group={group}
          isAdmin={false}
          onUpdateGroup={jest.fn()}
          onRemoveMember={jest.fn()}
          onLeaveGroup={jest.fn()}
          onEndGroup={jest.fn()}
        />
      );
      expect(getByText('Group Settings')).toBeTruthy();
      expect(getByText('Leave Group')).toBeTruthy();
    });
  });
});
