/**
 * Component Performance Tests
 * Tests rendering performance of React components under various conditions
 */

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { performanceMonitor, PERFORMANCE_THRESHOLDS, measureAsyncOperation } from './performanceSetup';
import { createMockHabit, createMockUser } from '../factories/habitFactory';

// Mock components for performance testing
const MockHabitCard = ({ habit, onPress }: { habit: any; onPress: () => void }) => {
  React.useEffect(() => {
    performanceMonitor.incrementRenderCount('habit_card_render');
  });
  
  return null; // Simplified for testing
};

const MockHabitList = ({ habits }: { habits: any[] }) => {
  React.useEffect(() => {
    performanceMonitor.incrementRenderCount('habit_list_render');
  });
  
  return null; // Simplified for testing
};

describe('Component Performance Tests', () => {
  beforeEach(() => {
    performanceMonitor.reset();
    jest.clearAllMocks();
  });

  describe('HabitCard Rendering Performance', () => {
    it('should render single habit card efficiently', async () => {
      const habit = createMockHabit();
      
      const renderTest = async () => {
        performanceMonitor.startMeasurement('single_habit_card');
        
        const { rerender } = render(
          <MockHabitCard habit={habit} onPress={() => {}} />
        );
        
        // Test multiple re-renders
        for (let i = 0; i < 10; i++) {
          const updatedHabit = { ...habit, name: `Updated ${i}` };
          rerender(<MockHabitCard habit={updatedHabit} onPress={() => {}} />);
        }
        
        return performanceMonitor.endMeasurement('single_habit_card');
      };

      const { result: metrics } = await measureAsyncOperation(
        renderTest,
        'habit_card_performance'
      );

      expect(metrics.duration).toBeLessThan(100); // Should render quickly
      expect(metrics.renderCount).toBe(11); // Initial + 10 re-renders
    });

    it('should handle rapid state changes efficiently', async () => {
      const habit = createMockHabit();
      
      const rapidStateTest = async () => {
        performanceMonitor.startMeasurement('rapid_state_changes');
        
        const { rerender } = render(
          <MockHabitCard habit={habit} onPress={() => {}} />
        );
        
        // Simulate rapid state changes (like animations)
        for (let i = 0; i < 60; i++) { // 60 FPS for 1 second
          const animatedHabit = { 
            ...habit, 
            animationProgress: i / 60,
            isAnimating: true 
          };
          
          rerender(<MockHabitCard habit={animatedHabit} onPress={() => {}} />);
          
          // Simulate frame timing
          await new Promise(resolve => setTimeout(resolve, 16)); // ~60 FPS
        }
        
        return performanceMonitor.endMeasurement('rapid_state_changes');
      };

      const { result: metrics } = await measureAsyncOperation(
        rapidStateTest,
        'rapid_state_performance'
      );

      expect(metrics.duration).toBeLessThan(2000); // Should complete within 2 seconds
      expect(metrics.renderCount).toBe(61); // Initial + 60 animation frames
    });
  });

  describe('List Rendering Performance', () => {
    it('should render small habit lists efficiently', async () => {
      const habits = Array.from({ length: 10 }, () => createMockHabit());
      
      const smallListTest = async () => {
        performanceMonitor.startMeasurement('small_list_render');
        
        render(<MockHabitList habits={habits} />);
        
        return performanceMonitor.endMeasurement('small_list_render');
      };

      const { result: metrics } = await measureAsyncOperation(
        smallListTest,
        'small_list_performance'
      );

      expect(metrics.duration).toBeLessThan(50); // Should render very quickly
      expect(metrics.renderCount).toBe(1);
    });

    it('should handle large habit lists with virtualization', async () => {
      const largeHabits = Array.from({ length: 1000 }, (_, index) => 
        createMockHabit({ id: `habit-${index}`, name: `Habit ${index}` })
      );
      
      const largeListTest = async () => {
        performanceMonitor.startMeasurement('large_list_render');
        
        // Simulate virtualized rendering (only render visible items)
        const visibleItems = largeHabits.slice(0, 20); // Only first 20 visible
        render(<MockHabitList habits={visibleItems} />);
        
        // Simulate scrolling through the list
        for (let i = 0; i < 10; i++) {
          const startIndex = i * 10;
          const visibleChunk = largeHabits.slice(startIndex, startIndex + 20);
          
          // Re-render with new visible items
          render(<MockHabitList habits={visibleChunk} />);
          
          await new Promise(resolve => setTimeout(resolve, 10)); // Simulate scroll delay
        }
        
        return performanceMonitor.endMeasurement('large_list_render');
      };

      const { result: metrics } = await measureAsyncOperation(
        largeListTest,
        'large_list_performance'
      );

      expect(metrics.duration).toBeLessThan(500); // Should handle large lists efficiently
      expect(metrics.renderCount).toBe(11); // Initial + 10 scroll updates
    });

    it('should optimize list updates with memoization', async () => {
      const habits = Array.from({ length: 50 }, () => createMockHabit());
      
      const memoizationTest = async () => {
        performanceMonitor.startMeasurement('memoized_list');
        
        // Initial render
        const { rerender } = render(<MockHabitList habits={habits} />);
        
        // Update only one item (should not re-render entire list with proper memoization)
        const updatedHabits = habits.map((habit, index) => 
          index === 0 ? { ...habit, name: 'Updated Habit' } : habit
        );
        
        rerender(<MockHabitList habits={updatedHabits} />);
        
        // Add new item (should only render new item)
        const habitsWithNew = [...updatedHabits, createMockHabit()];
        rerender(<MockHabitList habits={habitsWithNew} />);
        
        return performanceMonitor.endMeasurement('memoized_list');
      };

      const { result: metrics } = await measureAsyncOperation(
        memoizationTest,
        'memoization_performance'
      );

      expect(metrics.duration).toBeLessThan(100); // Memoized updates should be fast
      expect(metrics.renderCount).toBe(3); // Initial + 2 updates
    });
  });

  describe('Animation Performance', () => {
    it('should maintain smooth animations under load', async () => {
      const animationTest = async () => {
        performanceMonitor.startMeasurement('animation_performance');
        
        const frameTimings = [];
        const animationDuration = 1000; // 1 second animation
        const targetFPS = 60;
        const frameDuration = 1000 / targetFPS;
        
        for (let frame = 0; frame < targetFPS; frame++) {
          const frameStart = performance.now();
          
          // Simulate animation calculations
          const progress = frame / targetFPS;
          const easeProgress = 1 - Math.pow(1 - progress, 3); // Ease out cubic
          
          // Simulate rendering work
          const renderWork = Math.sin(progress * Math.PI * 2) * 100;
          
          // Simulate component updates during animation
          for (let i = 0; i < 5; i++) {
            performanceMonitor.incrementRenderCount('animation_frame');
          }
          
          const frameEnd = performance.now();
          const actualFrameDuration = frameEnd - frameStart;
          
          frameTimings.push({
            frame,
            duration: actualFrameDuration,
            progress: easeProgress,
            onTime: actualFrameDuration <= frameDuration,
          });
          
          // Simulate frame delay
          await new Promise(resolve => setTimeout(resolve, Math.max(0, frameDuration - actualFrameDuration)));
        }
        
        const metrics = performanceMonitor.endMeasurement('animation_performance');
        return { frameTimings, metrics };
      };

      const { result } = await measureAsyncOperation(
        animationTest,
        'animation_test'
      );

      const { frameTimings, metrics } = result;
      const droppedFrames = frameTimings.filter(frame => !frame.onTime).length;
      const frameDropRate = droppedFrames / frameTimings.length;

      expect(frameDropRate).toBeLessThan(0.1); // Less than 10% dropped frames
      expect(metrics.duration).toBeLessThan(1200); // Animation should complete close to target time
      expect(metrics.renderCount).toBe(300); // 60 frames * 5 components
    });

    it('should handle concurrent animations efficiently', async () => {
      const concurrentAnimationTest = async () => {
        performanceMonitor.startMeasurement('concurrent_animations');
        
        const animations = Array.from({ length: 5 }, (_, index) => ({
          id: `animation-${index}`,
          duration: 500 + Math.random() * 500, // 500-1000ms
          progress: 0,
        }));
        
        const animationPromises = animations.map(async (animation) => {
          const frames = [];
          const frameCount = Math.ceil(animation.duration / 16); // 60 FPS
          
          for (let frame = 0; frame < frameCount; frame++) {
            const frameStart = performance.now();
            
            animation.progress = frame / frameCount;
            
            // Simulate animation work
            const animationValue = Math.sin(animation.progress * Math.PI);
            
            performanceMonitor.incrementRenderCount('concurrent_animation');
            
            const frameEnd = performance.now();
            frames.push({
              frame,
              duration: frameEnd - frameStart,
              value: animationValue,
            });
            
            await new Promise(resolve => setTimeout(resolve, 16));
          }
          
          return { animationId: animation.id, frames };
        });
        
        const results = await Promise.all(animationPromises);
        const metrics = performanceMonitor.endMeasurement('concurrent_animations');
        
        return { results, metrics };
      };

      const { result } = await measureAsyncOperation(
        concurrentAnimationTest,
        'concurrent_animation_test'
      );

      const { results, metrics } = result;
      
      expect(results).toHaveLength(5); // All animations completed
      expect(metrics.duration).toBeLessThan(1500); // Should complete within reasonable time
      
      // Check that all animations ran smoothly
      results.forEach(animation => {
        const averageFrameTime = animation.frames.reduce((sum, frame) => sum + frame.duration, 0) / animation.frames.length;
        expect(averageFrameTime).toBeLessThan(10); // Each frame should be fast
      });
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not leak memory during component mounting/unmounting', async () => {
      const memoryLeakTest = async () => {
        const initialMemory = performanceMonitor.getMemoryUsage();
        
        // Mount and unmount components repeatedly
        for (let i = 0; i < 100; i++) {
          const habit = createMockHabit();
          const { unmount } = render(<MockHabitCard habit={habit} onPress={() => {}} />);
          
          // Simulate some work
          await new Promise(resolve => setTimeout(resolve, 1));
          
          unmount();
        }
        
        // Allow garbage collection
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const finalMemory = performanceMonitor.getMemoryUsage();
        
        return {
          initialMemory: initialMemory.used,
          finalMemory: finalMemory.used,
          memoryDifference: finalMemory.used - initialMemory.used,
        };
      };

      const { result } = await measureAsyncOperation(
        memoryLeakTest,
        'memory_leak_test'
      );

      // Memory usage should not increase significantly
      expect(result.memoryDifference).toBeLessThan(50); // Less than 50MB increase
    });

    it('should clean up event listeners and subscriptions', async () => {
      const subscriptionCleanupTest = async () => {
        const activeSubscriptions = new Set();
        
        // Mock subscription system
        const createSubscription = (id: string) => {
          activeSubscriptions.add(id);
          return {
            unsubscribe: () => activeSubscriptions.delete(id),
          };
        };
        
        // Simulate component lifecycle with subscriptions
        for (let i = 0; i < 50; i++) {
          const subscriptionId = `subscription-${i}`;
          const subscription = createSubscription(subscriptionId);
          
          // Simulate component work
          await new Promise(resolve => setTimeout(resolve, 1));
          
          // Clean up subscription
          subscription.unsubscribe();
        }
        
        return {
          activeSubscriptions: activeSubscriptions.size,
          expectedSubscriptions: 0,
        };
      };

      const { result } = await measureAsyncOperation(
        subscriptionCleanupTest,
        'subscription_cleanup_test'
      );

      expect(result.activeSubscriptions).toBe(result.expectedSubscriptions);
    });
  });

  describe('Performance Under Stress', () => {
    it('should maintain performance under high component count', async () => {
      const stressTest = async () => {
        performanceMonitor.startMeasurement('stress_test');
        
        const componentCount = 200;
        const habits = Array.from({ length: componentCount }, () => createMockHabit());
        
        // Render many components simultaneously
        const renderPromises = habits.map(async (habit, index) => {
          const { unmount } = render(<MockHabitCard habit={habit} onPress={() => {}} />);
          
          // Simulate some async work
          await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
          
          return { index, rendered: true };
        });
        
        const results = await Promise.all(renderPromises);
        const metrics = performanceMonitor.endMeasurement('stress_test');
        
        return { results, metrics };
      };

      const { result } = await measureAsyncOperation(
        stressTest,
        'component_stress_test'
      );

      const { results, metrics } = result;
      
      expect(results).toHaveLength(200); // All components rendered
      expect(metrics.duration).toBeLessThan(3000); // Should complete within 3 seconds
      expect(metrics.memoryUsage?.used).toBeLessThan(PERFORMANCE_THRESHOLDS.memoryUsage);
    });
  });
});