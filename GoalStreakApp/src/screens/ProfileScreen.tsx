import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { useAuth } from '../hooks/useAuth';

export default function ProfileScreen() {
  const { user, isAuthenticated, logout } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={48} color={Colors.accent2} />
          </View>
          <Text style={styles.name}>
            {isAuthenticated ? user?.displayName || 'User' : 'Welcome to GoalStreak!'}
          </Text>
          <Text style={styles.email}>
            {isAuthenticated ? user?.email : 'Sign in to sync your progress'}
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Active Habits</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Total Streaks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Friends</Text>
          </View>
        </View>

        {isAuthenticated ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Account</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color={Colors.primaryText} />
                <Text style={styles.menuText}>Edit Profile</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={24} color={Colors.error} />
                <Text style={[styles.menuText, { color: Colors.error }]}>Sign Out</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Started</Text>
            <View style={styles.authPrompt}>
              <Text style={styles.authPromptText}>
                Sign in to save your habits, track streaks, and connect with friends for accountability!
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="shield-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Privacy</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Help & FAQ</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="mail-outline" size={24} color={Colors.primaryText} />
            <Text style={styles.menuText}>Contact Us</Text>
            <Ionicons name="chevron-forward" size={20} color={Colors.accent2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.accent2,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: Typography.fontSize.base,
    color: Colors.accent2,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.accent1,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.gray.dark,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  menuText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.md,
    flex: 1,
  },
  authPrompt: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.accent1,
    borderStyle: 'dashed',
  },
  authPromptText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
});
