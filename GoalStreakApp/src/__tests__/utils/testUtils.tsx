// Comprehensive Test Utilities for GoalStreak
import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react-native';

// Simple test wrapper for component testing
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  wrapper?: React.ComponentType<any>;
}

export const renderWithProviders = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
): RenderResult => {
  const { wrapper = TestWrapper, ...renderOptions } = options;
  return render(ui, { wrapper, ...renderOptions });
};

// Render with authenticated user (simplified for component testing)
export const renderWithAuth = (
  ui: ReactElement,
  userOverrides: any = {},
  options: Omit<CustomRenderOptions, 'initialAuthUser'> = {}
): RenderResult => {
  return renderWithProviders(ui, options);
};

// Render without authentication
export const renderWithoutAuth = (
  ui: ReactElement,
  options: Omit<CustomRenderOptions, 'initialAuthUser'> = {}
): RenderResult => {
  return renderWithProviders(ui, options);
};

// Re-export everything from React Native Testing Library
export * from '@testing-library/react-native';

// Export the custom render as the default render
export { renderWithProviders as render };