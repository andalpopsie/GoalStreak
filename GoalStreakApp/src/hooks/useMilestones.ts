// useMilestones Hook - Detects and manages milestone celebrations
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Milestone } from '../components/analytics/MilestoneCelebration';
import { Colors } from '../constants/theme';

const MILESTONES_KEY = '@goalstreak_milestones_seen';

// Define milestone thresholds
const COMPLETION_MILESTONES = [1, 10, 25, 50, 100, 250, 500, 1000];
const STREAK_MILESTONES = [3, 7, 14, 21, 30, 60, 100, 365];

interface SeenMilestones {
  completions: number[];
  streaks: number[];
}

export const useMilestones = () => {
  const [seenMilestones, setSeenMilestones] = useState<SeenMilestones>({
    completions: [],
    streaks: [],
  });
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load seen milestones from storage
  useEffect(() => {
    loadSeenMilestones();
  }, []);

  const loadSeenMilestones = async () => {
    try {
      const stored = await AsyncStorage.getItem(MILESTONES_KEY);
      if (stored) {
        setSeenMilestones(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading milestones:', error);
    }
  };

  const saveSeenMilestones = async (milestones: SeenMilestones) => {
    try {
      await AsyncStorage.setItem(MILESTONES_KEY, JSON.stringify(milestones));
      setSeenMilestones(milestones);
    } catch (error) {
      console.error('Error saving milestones:', error);
    }
  };

  const checkCompletionMilestone = useCallback((totalCompletions: number) => {
    // Find the highest milestone reached that hasn't been seen
    const reachedMilestones = COMPLETION_MILESTONES.filter(m => totalCompletions >= m);
    const unseenMilestones = reachedMilestones.filter(m => !seenMilestones.completions.includes(m));
    
    if (unseenMilestones.length > 0) {
      const milestone = unseenMilestones[unseenMilestones.length - 1]; // Get highest unseen
      
      const milestoneData: Milestone = {
        type: 'completion',
        value: milestone,
        title: getMilestoneTitle(milestone, 'completion'),
        message: getMilestoneMessage(milestone, 'completion'),
        icon: getMilestoneIcon(milestone, 'completion'),
        color: Colors.accent1,
      };
      
      setCurrentMilestone(milestoneData);
      setShowCelebration(true);
      
      // Mark as seen
      saveSeenMilestones({
        ...seenMilestones,
        completions: [...seenMilestones.completions, milestone],
      });
      
      return true;
    }
    
    return false;
  }, [seenMilestones]);

  const checkStreakMilestone = useCallback((currentStreak: number) => {
    // Find the highest milestone reached that hasn't been seen
    const reachedMilestones = STREAK_MILESTONES.filter(m => currentStreak >= m);
    const unseenMilestones = reachedMilestones.filter(m => !seenMilestones.streaks.includes(m));
    
    if (unseenMilestones.length > 0) {
      const milestone = unseenMilestones[unseenMilestones.length - 1]; // Get highest unseen
      
      const milestoneData: Milestone = {
        type: 'streak',
        value: milestone,
        title: getMilestoneTitle(milestone, 'streak'),
        message: getMilestoneMessage(milestone, 'streak'),
        icon: getMilestoneIcon(milestone, 'streak'),
        color: Colors.accent1,
      };
      
      setCurrentMilestone(milestoneData);
      setShowCelebration(true);
      
      // Mark as seen
      saveSeenMilestones({
        ...seenMilestones,
        streaks: [...seenMilestones.streaks, milestone],
      });
      
      return true;
    }
    
    return false;
  }, [seenMilestones]);

  const closeCelebration = useCallback(() => {
    setShowCelebration(false);
    setCurrentMilestone(null);
  }, []);

  const resetMilestones = async () => {
    await AsyncStorage.removeItem(MILESTONES_KEY);
    setSeenMilestones({ completions: [], streaks: [] });
  };

  return {
    checkCompletionMilestone,
    checkStreakMilestone,
    currentMilestone,
    showCelebration,
    closeCelebration,
    resetMilestones,
  };
};

// Helper functions for milestone content
function getMilestoneTitle(value: number, type: 'completion' | 'streak'): string {
  if (type === 'completion') {
    if (value === 1) return '🎉 First Completion!';
    if (value === 10) return '🌟 10 Completions!';
    if (value === 50) return '🚀 50 Completions!';
    if (value === 100) return '💯 Century Club!';
    if (value === 500) return '🏆 500 Completions!';
    if (value === 1000) return '👑 1000 Completions!';
    return `🎯 ${value} Completions!`;
  } else {
    if (value === 3) return '🔥 3-Day Streak!';
    if (value === 7) return '⭐ Week Warrior!';
    if (value === 14) return '💪 Two Weeks Strong!';
    if (value === 30) return '🏅 30-Day Champion!';
    if (value === 100) return '👑 100-Day Legend!';
    if (value === 365) return '🎊 Year of Habits!';
    return `🔥 ${value}-Day Streak!`;
  }
}

function getMilestoneMessage(value: number, type: 'completion' | 'streak'): string {
  if (type === 'completion') {
    if (value === 1) return 'Every journey begins with a single step. Great start!';
    if (value === 10) return 'You\'re building momentum! Keep it up!';
    if (value === 50) return 'Halfway to 100! You\'re doing amazing!';
    if (value === 100) return 'Incredible dedication! You\'re a habit master!';
    if (value === 500) return 'Phenomenal achievement! You\'re unstoppable!';
    if (value === 1000) return 'Legendary status achieved! You\'re an inspiration!';
    return `Amazing progress! ${value} completions and counting!`;
  } else {
    if (value === 3) return 'Three days in a row! You\'re building a habit!';
    if (value === 7) return 'A full week! Consistency is your superpower!';
    if (value === 14) return 'Two weeks strong! You\'re on fire!';
    if (value === 30) return 'A full month! This is now part of who you are!';
    if (value === 100) return 'One hundred days! You\'re a true champion!';
    if (value === 365) return 'A full year! You\'ve transformed your life!';
    return `${value} days of consistency! You\'re incredible!`;
  }
}

function getMilestoneIcon(value: number, type: 'completion' | 'streak'): string {
  if (type === 'completion') {
    if (value >= 1000) return 'trophy';
    if (value >= 500) return 'medal';
    if (value >= 100) return 'ribbon';
    if (value >= 50) return 'rocket';
    if (value >= 10) return 'star';
    return 'checkmark-circle';
  } else {
    if (value >= 365) return 'trophy';
    if (value >= 100) return 'medal';
    if (value >= 30) return 'ribbon';
    if (value >= 7) return 'flame';
    return 'flash';
  }
}
