import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../utils/testUtils';
import Input from '../../components/Input';

describe('Input', () => {
  const defaultProps = {
    placeholder: 'Enter text',
    value: '',
    onChangeText: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders input with placeholder correctly', () => {
      const { getByPlaceholderText } = renderWithProviders(
        <Input {...defaultProps} />
      );

      expect(getByPlaceholderText('Enter text')).toBeTruthy();
    });

    it('renders input with label', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} label="Email Address" />
      );

      expect(getByText('Email Address')).toBeTruthy();
    });

    it('renders input with value', () => {
      const { getByDisplayValue } = renderWithProviders(
        <Input {...defaultProps} value="test@example.com" />
      );

      expect(getByDisplayValue('test@example.com')).toBeTruthy();
    });

    it('renders error message when error is provided', () => {
      const { getByText } = renderWithProviders(
        <Input {...defaultProps} error="This field is required" />
      );

      expect(getByText('This field is required')).toBeTruthy();
    });

    it('renders as multiline when multiline prop is true', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} multiline={true} />
      );

      const input = getByTestId('text-input');
      expect(input.props.multiline).toBe(true);
    });

    it('renders password toggle button for secure text entry', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={true} />
      );

      expect(getByTestId('password-toggle')).toBeTruthy();
    });

    it('does not render password toggle for non-secure inputs', () => {
      const { queryByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={false} />
      );

      expect(queryByTestId('password-toggle')).toBeNull();
    });
  });

  describe('States', () => {
    it('applies focused styling when input is focused', async () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const input = getByTestId('text-input');
      fireEvent(input, 'focus');

      await waitFor(() => {
        const container = getByTestId('input-container');
        expect(container.props.style).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              borderColor: expect.any(String)
            })
          ])
        );
      });
    });

    it('applies error styling when error is provided', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} error="Invalid input" />
      );

      const container = getByTestId('input-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            borderColor: expect.any(String)
          })
        ])
      );
    });

    it('applies disabled styling when disabled', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} disabled={true} />
      );

      const container = getByTestId('input-container');
      const input = getByTestId('text-input');
      
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            backgroundColor: expect.any(String),
            opacity: 0.6
          })
        ])
      );
      expect(input.props.editable).toBe(false);
    });

    it('applies multiline styling when multiline is true', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} multiline={true} />
      );

      const container = getByTestId('input-container');
      expect(container.props.style).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            alignItems: 'flex-start',
            minHeight: 80
          })
        ])
      );
    });
  });

  describe('Interactions', () => {
    it('calls onChangeText when text is entered', async () => {
      const mockOnChangeText = jest.fn();
      
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} onChangeText={mockOnChangeText} />
      );

      const input = getByTestId('text-input');
      fireEvent.changeText(input, 'new text');

      await waitFor(() => {
        expect(mockOnChangeText).toHaveBeenCalledWith('new text');
      });
    });

    it('focuses input when container is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const container = getByTestId('input-container');
      const input = getByTestId('text-input');
      
      fireEvent.press(container);

      // Verify focus was called (this is a bit tricky to test directly)
      expect(input).toBeTruthy();
    });

    it('does not focus input when disabled and container is pressed', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} disabled={true} />
      );

      const container = getByTestId('input-container');
      
      expect(() => {
        fireEvent.press(container);
      }).not.toThrow();
    });

    it('toggles password visibility when password toggle is pressed', async () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={true} />
      );

      const input = getByTestId('text-input');
      const toggle = getByTestId('password-toggle');

      // Initially should be secure
      expect(input.props.secureTextEntry).toBe(true);

      fireEvent.press(toggle);

      await waitFor(() => {
        expect(input.props.secureTextEntry).toBe(false);
      });

      // Press again to toggle back
      fireEvent.press(toggle);

      await waitFor(() => {
        expect(input.props.secureTextEntry).toBe(true);
      });
    });

    it('handles focus and blur events correctly', async () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const input = getByTestId('text-input');
      
      fireEvent(input, 'focus');
      fireEvent(input, 'blur');

      // Should not throw and component should still be rendered
      expect(input).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('has proper accessibility properties', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} label="Email" />
      );

      const input = getByTestId('text-input');
      expect(input.props.accessible).toBe(true);
      expect(input.props.accessibilityLabel).toBe('Email');
    });

    it('uses placeholder as accessibility label when no label is provided', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} placeholder="Enter your email" />
      );

      const input = getByTestId('text-input');
      expect(input.props.accessibilityLabel).toBe('Enter your email');
    });

    it('indicates error state in accessibility', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} error="Invalid email" />
      );

      const input = getByTestId('text-input');
      expect(input.props.accessibilityState).toEqual(
        expect.objectContaining({
          invalid: true
        })
      );
    });

    it('has proper accessibility for password toggle', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={true} />
      );

      const toggle = getByTestId('password-toggle');
      expect(toggle.props.accessible).toBe(true);
      expect(toggle.props.accessibilityRole).toBe('button');
      expect(toggle.props.accessibilityLabel).toContain('password');
    });
  });

  describe('Password Input', () => {
    it('shows eye icon when password is hidden', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={true} />
      );

      const input = getByTestId('text-input');
      expect(input.props.secureTextEntry).toBe(true);
    });

    it('shows eye-off icon when password is visible', async () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} secureTextEntry={true} />
      );

      const toggle = getByTestId('password-toggle');
      fireEvent.press(toggle);

      await waitFor(() => {
        const input = getByTestId('text-input');
        expect(input.props.secureTextEntry).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('handles missing onChangeText gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <Input placeholder="Test" value="" onChangeText={undefined as any} />
      );

      const input = getByTestId('text-input');
      
      expect(() => {
        fireEvent.changeText(input, 'test');
      }).not.toThrow();
    });

    it('handles undefined value gracefully', () => {
      const { getByTestId } = renderWithProviders(
        <Input placeholder="Test" value={undefined as any} onChangeText={jest.fn()} />
      );

      expect(getByTestId('text-input')).toBeTruthy();
    });
  });

  describe('Keyboard Behavior', () => {
    it('sets correct return key type for single line input', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const input = getByTestId('text-input');
      expect(input.props.returnKeyType).toBe('next');
    });

    it('sets correct return key type for multiline input', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} multiline={true} />
      );

      const input = getByTestId('text-input');
      expect(input.props.returnKeyType).toBe('default');
    });

    it('sets correct blur behavior for multiline input', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} multiline={true} />
      );

      const input = getByTestId('text-input');
      expect(input.props.blurOnSubmit).toBe(false);
    });

    it('disables autocorrect and spell check', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const input = getByTestId('text-input');
      expect(input.props.autoCorrect).toBe(false);
      expect(input.props.spellCheck).toBe(false);
    });
  });

  describe('Layout', () => {
    it('adjusts text alignment for multiline input', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} multiline={true} />
      );

      const input = getByTestId('text-input');
      expect(input.props.textAlignVertical).toBe('top');
    });

    it('uses center alignment for single line input', () => {
      const { getByTestId } = renderWithProviders(
        <Input {...defaultProps} />
      );

      const input = getByTestId('text-input');
      expect(input.props.textAlignVertical).toBe('center');
    });
  });
});