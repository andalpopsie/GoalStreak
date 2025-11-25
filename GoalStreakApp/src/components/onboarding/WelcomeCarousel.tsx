import React, { useState, useRef, useMemo, useCallback } from 'react';
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

// Calculate responsive sizes as percentages of screen dimensions
const getResponsiveIconSize = () => {
  // Icon size scales between 60-80px based on screen height
  const baseSize = 80;
  const scale = Math.min(1, Math.max(0.75, screenHeight / 900));
  return Math.round(baseSize * scale);
};

const getResponsiveFontSize = (baseSize: number) => {
  // Font sizes scale proportionally with screen height
  const scale = Math.min(1.1, Math.max(0.85, screenHeight / 850));
  return Math.round(baseSize * scale);
};

const getResponsiveSpacing = (baseSpacing: number) => {
  // Spacing scales with screen height
  const scale = Math.min(1.1, Math.max(0.85, screenHeight / 850));
  return Math.round(baseSpacing * scale);
};

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
  
  // Memoized dynamic calculations based on safe area and screen size
  const skipButtonTop = useMemo(
    () => Math.max(getResponsiveSpacing(20), insets.top + 10),
    [insets.top]
  );
  
  const slideTopPadding = useMemo(
    () => Math.max(getResponsiveSpacing(70), insets.top + getResponsiveSpacing(50)),
    [insets.top]
  );
  
  const footerBottomPadding = useMemo(() => {
    const baseFooterPadding = getResponsiveSpacing(24);
    return insets.bottom > 0 
      ? Math.max(baseFooterPadding, insets.bottom + getResponsiveSpacing(16))
      : baseFooterPadding;
  }, [insets.bottom]);
  
  const slideBottomPadding = useMemo(
    () => getResponsiveSpacing(200), // Increased to ensure content clears footer
    []
  );
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

  const renderSlide = useCallback((slide: WelcomeSlide) => (
    <ScrollView 
      key={slide.id} 
      style={styles.slideScrollView}
      contentContainerStyle={[styles.slide, { 
        paddingTop: slideTopPadding,
        paddingBottom: slideBottomPadding 
      }]}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <Animated.View 
        entering={FadeInUp.delay(200)}
        style={[styles.iconContainer, { backgroundColor: slide.color + '15' }]}
      >
        <Ionicons 
          name={slide.icon} 
          size={getResponsiveIconSize()} 
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
    </ScrollView>
  ), [slideTopPadding, slideBottomPadding]);

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
  slideScrollView: {
    width: screenWidth,
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    // paddingTop and paddingBottom are set dynamically via inline style
  },
  iconContainer: {
    width: getResponsiveSpacing(160), // Fully dynamic size
    height: getResponsiveSpacing(160),
    borderRadius: getResponsiveSpacing(80),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSpacing(32), // Reduced margin to bring content closer
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
    fontSize: getResponsiveFontSize(32), // Fully dynamic font size
    fontWeight: '700',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: getResponsiveSpacing(16), // Reduced spacing
    lineHeight: getResponsiveFontSize(38),
  },
  description: {
    fontSize: getResponsiveFontSize(18), // Fully dynamic font size
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(26),
    marginBottom: getResponsiveSpacing(32), // Reduced spacing
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    // paddingBottom is set dynamically via inline style
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray.light + '40',
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
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
    paddingVertical: Spacing.md,
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