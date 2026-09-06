import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../constants/theme';
import { trackScreen, trackEvent } from '../services/enhancedAnalyticsService';
import { useAuth } from '../hooks/useAuth';

export default function FeedScreen() {
  const { user } = useAuth();

  // Track screen view
  useEffect(() => {
    trackScreen('Feed', 'FeedScreen');
    trackEvent('social_feed_viewed', {
      user_id: user?.id,
    });
  }, [user?.id]);

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
            Add friends to see their habit completions and cheer them on! Your activity feed will
            show here once you connect with accountability partners.
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
    padding: 16, // 8 * 2 (base)
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray.light, // Lighter, more subtle
  },
  title: {
    fontSize: 24, // heading
    fontWeight: '700', // bold
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primaryText,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16, // 8 * 2 (base)
  },
  placeholder: {
    backgroundColor: Colors.white,
    padding: 32, // 8 * 4 (loose)
    borderRadius: 16, // Modern rounded
    alignItems: 'center',
    marginBottom: 24, // 8 * 3 (comfortable)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  placeholderTitle: {
    fontSize: 20, // subheading
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    marginTop: 16, // 8 * 2 (base)
    marginBottom: 8, // 8 * 1 (tight)
  },
  placeholderText: {
    fontSize: 16, // body
    fontFamily: Typography.fontFamily.regular,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24, // 1.5 line height
  },
  section: {
    marginBottom: 24, // 8 * 3 (comfortable)
  },
  sectionTitle: {
    fontSize: 20, // subheading
    fontWeight: '600', // semibold
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.primaryText,
    marginBottom: 16, // 8 * 2 (base)
  },
  featureList: {
    backgroundColor: Colors.white,
    borderRadius: 16, // Modern rounded
    padding: 16, // 8 * 2 (base)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12, // 8 * 1.5 (between tight and base)
    paddingHorizontal: 8, // 8 * 1 (tight)
  },
  featureText: {
    fontSize: 16, // body
    fontFamily: Typography.fontFamily.regular,
    color: Colors.primaryText,
    marginLeft: 16, // 8 * 2 (base)
    flex: 1,
    lineHeight: 22, // Comfortable reading
  },
});
