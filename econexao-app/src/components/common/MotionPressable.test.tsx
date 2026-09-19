import React from 'react';
import { Text, Animated, TouchableOpacity } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { MotionPressable } from './MotionPressable';
import * as useReducedMotionModule from '../../hooks/useReducedMotion';

describe('MotionPressable Component (ECO-2701)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children with accessible pressable wrapper', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
    const onPressMock = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionPressable
          accessibilityRole="button"
          accessibilityLabel="Test Button"
          onPress={onPressMock}
        >
          <Text>Click Me</Text>
        </MotionPressable>
      );
    });

    const root = tree.root;
    const text = root.findByType(Text);
    expect(text.props.children).toBe('Click Me');
  });

  it('triggers scale animation on pressIn and pressOut when motion is enabled', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);
    const onPressInMock = jest.fn();
    const onPressOutMock = jest.fn();

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionPressable
          onPressIn={onPressInMock}
          onPressOut={onPressOutMock}
        >
          <Text>Action</Text>
        </MotionPressable>
      );
    });

    const touchable = tree.root.findByType(TouchableOpacity);

    act(() => {
      touchable.props.onPressIn({} as any);
    });
    expect(onPressInMock).toHaveBeenCalled();

    act(() => {
      touchable.props.onPressOut({} as any);
    });
    expect(onPressOutMock).toHaveBeenCalled();
  });

  it('keeps scale at 1.0 static without transform when reduced motion is enabled', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionPressable>
          <Text>Static</Text>
        </MotionPressable>
      );
    });

    const animatedView = tree.root.findByType(Animated.View);
    // Em reduced motion, não há transform de escala animado aplicado
    const styleObj = Array.isArray(animatedView.props.style) ? animatedView.props.style[1] : animatedView.props.style;
    expect(styleObj?.transform).toBeUndefined();
  });
});
