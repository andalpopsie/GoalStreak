import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity, Text } from 'react-native';

// Simple test component
const SimpleButton = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} testID="simple-button">
    <Text>{title}</Text>
  </TouchableOpacity>
);

describe('SimpleButton', () => {
  it('renders and handles press', () => {
    const mockPress = jest.fn();
    const { getByText, getByTestId } = render(
      <SimpleButton title="Click me" onPress={mockPress} />
    );

    expect(getByText('Click me')).toBeTruthy();
    
    fireEvent.press(getByTestId('simple-button'));
    expect(mockPress).toHaveBeenCalledTimes(1);
  });
});