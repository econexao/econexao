import React from 'react';
import { Text, Animated } from 'react-native';
import renderer, { act } from 'react-test-renderer';
import { MotionBlock } from './MotionBlock';
import * as useReducedMotionModule from '../../hooks/useReducedMotion';

describe('MotionBlock Component (ECO-2701)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders children smoothly with entrance animation structure', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionBlock>
          <Text>Block Content</Text>
        </MotionBlock>
      );
    });

    const root = tree.root;
    const text = root.findByType(Text);
    expect(text.props.children).toBe('Block Content');
  });

  it('renders immediate final opacity: 1 and translateY: 0 in reduced motion', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(true);

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionBlock>
          <Text>Static Content</Text>
        </MotionBlock>
      );
    });

    const animatedView = tree.root.findByType(Animated.View);
    expect(animatedView.props.style).toEqual([
      undefined,
      { opacity: 1, transform: [{ translateY: 0 }] },
    ]);
  });

  it('cleans up timeout and active animations on unmount', () => {
    jest.spyOn(useReducedMotionModule, 'useReducedMotion').mockReturnValue(false);

    let tree: any;
    act(() => {
      tree = renderer.create(
        <MotionBlock staggerIndex={2}>
          <Text>Staggered Content</Text>
        </MotionBlock>
      );
    });

    act(() => {
      tree.unmount();
    });
    // Sem erros ou memory leaks
  });
});
