import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Button from '../../components/Button';

describe('Button Component', () => {
  it('should render with title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={jest.fn()} />
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });

  it('should call onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} />
    );
    
    fireEvent.press(getByText('Test Button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <Button title="Test Button" onPress={mockOnPress} disabled={true} />
    );
    
    const button = getByText('Test Button').parent;
    expect(button?.props.accessibilityState?.disabled).toBe(true);
  });
});