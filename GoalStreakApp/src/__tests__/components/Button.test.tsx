import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils/testUtils';
import Button from '../../components/Button';

describe('Button', () => {
  const defaultProps = {
    title: 'Test Button',
    onPress: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders button title correctly', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} />
      );

      expect(getByText('Test Button')).toBeTruthy();
    });

    it('renders with primary variant by default', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      );
    });

    it('renders with secondary variant', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} variant="secondary" />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String)
          })
        ])
      );
    });

    it('renders with outline variant', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} variant="outline" />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: 'transparent',
            borderWidth: 2
          })
        ])
      );
    });

    it('renders with medium size by default', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 44
          })
        ])
      );
    });

    it('renders with small size', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} size="sm" />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 36
          })
        ])
      );
    });

    it('renders with large size', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} size="lg" />
      );

      const button = getByTestId('button');
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            minHeight: 52
          })
        ])
      );
    });
  });

  describe('States', () => {
    it('renders disabled state correctly', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} disabled={true} />
      );

      const button = getByTestId('button');
      expect(button.props.disabled).toBe(true);
      expect(button.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            opacity: 0.5
          })
        ])
      );
    });

    it('renders loading state correctly', () => {
      const { getByTestId, queryByText } = renderWithProviders(
        <Button {...defaultProps} loading={true} />
      );

      const button = getByTestId('button');
      expect(button.props.disabled).toBe(true);
      expect(queryByText('Test Button')).toBeNull(); // Text hidden during loading
      expect(getByTestId('loading-indicator')).toBeTruthy();
    });

    it('shows correct loading indicator color for primary variant', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} variant="primary" loading={true} />
      );

      const indicator = getByTestId('loading-indicator');
      expect(indicator.props.color).toBeTruthy();
    });

    it('shows correct loading indicator color for outline variant', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} variant="outline" loading={true} />
      );

      const indicator = getByTestId('loading-indicator');
      expect(indicator.props.color).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('calls onPress when pressed', async () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} onPress={mockOnPress} />
      );

      fireEvent.press(getByTestId('button'));

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(1);
      });
    });

    it('does not call onPress when disabled', () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} onPress={mockOnPress} disabled={true} />
      );

      fireEvent.press(getByTestId('button'));

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('does not call onPress when loading', () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} onPress={mockOnPress} loading={true} />
      );

      fireEvent.press(getByTestId('button'));

      expect(mockOnPress).not.toHaveBeenCalled();
    });

    it('handles missing onPress gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <Button title="Test Button" onPress={undefined as any} />
      );

      expect(() => {
        fireEvent.press(getByTestId('button'));
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility properties', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} />
      );

      const button = getByTestId('button');
      expect(button.props.accessible).toBe(true);
      expect(button.props.accessibilityRole).toBe('button');
    });

    it('has descriptive accessibility label', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} />
      );

      const button = getByTestId('button');
      expect(button.props.accessibilityLabel).toBe('Test Button');
    });

    it('indicates disabled state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} disabled={true} />
      );

      const button = getByTestId('button');
      expect(button.props.accessibilityState).toEqual(
        expect.objectContaining({
          disabled: true
        })
      );
    });

    it('indicates loading state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} loading={true} />
      );

      const button = getByTestId('button');
      expect(button.props.accessibilityState).toEqual(
        expect.objectContaining({
          busy: true
        })
      );
    });
  });

  describe('Text Styling', () => {
    it('applies correct text color for primary variant', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="primary" />
      );

      const text = getByText('Test Button');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String)
          })
        ])
      );
    });

    it('applies correct text color for outline variant', () => {
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} variant="outline" />
      );

      const text = getByText('Test Button');
      expect(text.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            color: expect.any(String)
          })
        ])
      );
    });

    it('applies correct text size for different button sizes', () => {
      const sizes = ['sm', 'md', 'lg'] as const;
      
      sizes.forEach(size => {
        const { getByText } = renderWithProviders(
          <Button {...defaultProps} size={size} />
        );

        const text = getByText('Test Button');
        expect(text.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              fontSize: expect.any(Number)
            })
          ])
        );
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} title="" />
      );

      expect(getByTestId('button')).toBeTruthy();
    });

    it('handles very long title', () => {
      const longTitle = 'This is a very long button title that might cause layout issues';
      
      const { getByText } = renderWithProviders(
        <Button {...defaultProps} title={longTitle} />
      );

      expect(getByText(longTitle)).toBeTruthy();
    });

    it('handles rapid successive presses', async () => {
      const mockOnPress = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <Button {...defaultProps} onPress={mockOnPress} />
      );

      const button = getByTestId('button');
      
      // Rapid fire presses
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);

      await waitFor(() => {
        expect(mockOnPress).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe('Variant Combinations', () => {
    it('renders all variant and size combinations correctly', () => {
      const variants = ['primary', 'secondary', 'outline'] as const;
      const sizes = ['sm', 'md', 'lg'] as const;
      
      variants.forEach(variant => {
        sizes.forEach(size => {
          const { getByTestId } = renderWithProviders(
            <Button {...defaultProps} variant={variant} size={size} />
          );

          expect(getByTestId('button')).toBeTruthy();
        });
      });
    });
  });
});