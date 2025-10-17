import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/theme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Debug: Log screen dimensions
console.log('📱 Screen dimensions:', { width: screenWidth, height: screenHeight });

// Responsive sizing based on screen height
// iPhone 15 Pro: 852px height, 393px width
// iPhone SE: 667px height, 375px width
// iPhone 16 Pro: 956px height, 430px width
const isSmallScreen = screenHeight < 750; // iPhone SE and similar
const isMediumScreen = screenHeight >= 750 && screenHeight < 900; // iPhone 15 Pro, iPhone 14

interface WelcomeSlide {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  benefits: string[];
  color: string;
}

const welcomeSlides: WelcomeSlide[] = [
  {
    id: 'habits',
    title: 'Build Lasting Habits',
    description: 'Transform your daily routines into powerful habits with beautiful progress tracking',
    icon: 'checkmark-circle',
    benefits: ['Visual progress tracking', 'Streak celebrations', '39+ categories'],
    color: Colors.accent1,
  },
  {
    id: 'social',
    title: 'Stay Accountable with Friends',
    description: 'Connect with friends and family to stay motivated and celebrate achievements together',
    icon: 'people',
    benefits: ['Friend accountability', 'Real-time reactions', 'Shared progress'],
    color: Colors.accent2,
  },
  {
    id: 'analytics',
    title: 'Track Your Progress',
    description: 'Get insights into your habits with comprehensive analytics and trend analysis',
    icon: 'analytics',
    benefits: ['Progress charts', 'Streak insights', 'Personal records'],
    color: Colors.accent3,
  },
];

interface WelcomeCarouselProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function WelcomeCarousel({ onComplete, onSkip }: WelcomeCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  
  // Calculate dynamic top position based on safe area
  const skipButtonTop = Math.max(20, insets.top + 10);
  const slideTopPadding = Math.max(100, insets.top + 80);
  
  // Dynamic bottom padding - very generous for devices with home indicator
  // iPhone 15 Pro has ~34px bottom inset, we need substantial extra space
  const footerBottomPadding = insets.bottom > 0 
    ? Math.max(70, insets.bottom + 50)  // Devices with home indicator: minimum 70px, or inset + 50px
    : 50;                                // Devices without home indicator
  
  // Debug logging
  console.log('📱 Safe area insets:', insets);
  console.log('📏 Footer bottom padding:', footerBottomPadding);
  console.log('📐 Screen height:', screenHeight);

  const handleNext = () => {
    if (currentSlide < welcomeSlides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      scrollViewRef.current?.scrollTo({
        x: nextSlide * screenWidth,
        animated: true,
      });
    } else {
      onComplete();
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    setCurrentSlide(slideIndex);
  };

  const renderSlide = (slide: WelcomeSlide) => (
    <View key={slide.id} style={[styles.slide, { paddingTop: slideTopPadding }]}>
      <Animated.View 
        entering={FadeInUp.delay(200)}
        style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}
      >
        <Ionicons 
          name={slide.icon} 
          size={isSmallScreen ? 60 : isMediumScreen ? 70 : 80} 
          color={slide.color} 
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(400)} style={styles.content}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>

        <View style={styles.benefitsContainer}>
          {slide.benefits.map((benefit, benefitIndex) => (
            <Animated.View
              key={benefit}
              entering={FadeInUp.delay(600 + benefitIndex * 100)}
              style={styles.benefitItem}
            >
              <Ionicons name="checkmark-circle" size={20} color={slide.color} />
              <Text style={styles.benefitText}>{benefit}</Text>
            </Animated.View>
          ))}
        </View>
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={[styles.skipButton, { top: skipButtonTop }]} 
        onPress={onSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {welcomeSlides.map(renderSlide)}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: footerBottomPadding }]}>
        <View style={styles.pagination}>
          {welcomeSlides.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                index === currentSlide && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>

        <Animated.View entering={FadeInDown.delay(800)}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentSlide === welcomeSlides.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons 
              name={currentSlide === welcomeSlides.length - 1 ? 'rocket' : 'arrow-forward'} 
              size={24} 
              color={Colors.white} 
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  skipButton: {
    position: 'absolute',
    // top is set dynamically via inline style
    right: 20,
    zIndex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.white + '90',
    borderRadius: 20,
  },
  skipText: {
    ...Typography.body,
    color: Colors.primaryText,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width: screenWidth,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start', // Changed from 'center' to prevent overlap
    paddingHorizontal: Spacing.xl,
    // paddingTop is set dynamically via inline style
    paddingBottom: isSmallScreen ? 40 : 60,
  },
  iconContainer: {
    width: isSmallScreen ? 120 : isMediumScreen ? 140 : 160, // Responsive size
    height: isSmallScreen ? 120 : isMediumScreen ? 140 : 160,
    borderRadius: isSmallScreen ? 60 : isMediumScreen ? 70 : 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: isSmallScreen ? Spacing.xl : Spacing['2xl'], // Less margin on small screens
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    fontSize: isSmallScreen ? 26 : isMediumScreen ? 28 : 32, // Responsive font size
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: isSmallScreen ? Spacing.md : Spacing.lg,
    lineHeight: isSmallScreen ? 32 : isMediumScreen ? 34 : 38,
  },
  description: {
    fontSize: isSmallScreen ? 15 : isMediumScreen ? 16 : 18, // Responsive font size
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: isSmallScreen ? 22 : isMediumScreen ? 24 : 26,
    marginBottom: isSmallScreen ? Spacing.xl : Spacing['2xl'],
    opacity: 0.8,
  },
  benefitsContainer: {
    alignSelf: 'stretch',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingVertical: 4,
  },
  benefitText: {
    fontSize: 16,
    color: Colors.primaryText,
    marginLeft: Spacing.md,
    flex: 1,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    // paddingBottom is set dynamically via inline style
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.gray.light,
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: Colors.accent1,
    width: 30,
  },
  nextButton: {
    backgroundColor: Colors.accent1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    minWidth: 160,
    justifyContent: 'center',
    shadowColor: Colors.accent1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginRight: Spacing.sm,
  },
});