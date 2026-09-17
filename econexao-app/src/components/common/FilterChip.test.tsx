import React from 'react';
import { Text } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { FilterChip } from './FilterChip';
import { MotionPressable } from './MotionPressable';

describe('FilterChip Component with MotionPressable (ECO-2701)', () => {
  it('renders label and handles onPress callback', () => {
    const onPressMock = jest.fn();
    let tree: any;

    act(() => {
      tree = renderer.create(
        <FilterChip
          label="Cultura"
          isSelected={false}
          onPress={onPressMock}
        />
      );
    });

    const root = tree.root;
    const motionPressable = root.findByType(MotionPressable);
    expect(motionPressable).toBeDefined();

    const text = root.findByType(Text);
    expect(text.props.children).toBe('Cultura');

    act(() => {
      motionPressable.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('reflects selected state accessibility', () => {
    let tree: any;

    act(() => {
      tree = renderer.create(
        <FilterChip
          label="Praias"
          isSelected={true}
          onPress={() => {}}
        />
      );
    });

    const motionPressable = tree.root.findByType(MotionPressable);
    expect(motionPressable.props.accessibilityState).toEqual({ disabled: false, selected: true });
    expect(motionPressable.props.accessibilityLabel).toBe('Filtro Praias');
  });
});
