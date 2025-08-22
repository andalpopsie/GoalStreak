import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';

export default function FeedScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Activity Feed</Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.placeholder}>
          <Ionicons name="people-outline" size={48} color={Colors.accent2} />
          <Text style={styles.placeholderTitle}>Connect with friends</Text>
          <Text style={styles.placeholderText}>
            Add friends to see their habit completions and cheer them on! 
            Your activity feed will show here once you connect with accountability partners.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.accent3} />
              <Text style={styles.featureText}>See when friends complete habits</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="heart" size={24} color={Colors.accent1} />
              <Text style={styles.featureText}>React with encouragement</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color={Colors.accent2} />
              <Text style={styles.featureText}>Celebrate streak milestones together</Text>
            </View>
          </View>
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
  header: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent2,
  },
  title: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.md,
  },
  placeholder: {
    backgroundColor: Colors.white,
    padding: Spacing.xl,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.accent2,
    borderStyle: 'dashed',
  },
  placeholderTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  placeholderText: {
    fontSize: Typography.fontSize.base,
    color: Colors.gray.dark,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed * Typography.fontSize.base,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
    marginBottom: Spacing.md,
  },
  featureList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  featureText: {
    fontSize: Typography.fontSize.base,
    color: Colors.primaryText,
    marginLeft: Spacing.md,
    flex: 1,
  },
});
