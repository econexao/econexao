import { motion } from './motion';
import { theme } from './theme';

describe('Motion Design Tokens (ECO-2701)', () => {
  it('exports motion tokens with exact nominal durations matching specification', () => {
    expect(motion.durations.instant).toBe(0);
    expect(motion.durations.pressIn).toBe(100);
    expect(motion.durations.pressOut).toBe(140);
    expect(motion.durations.hover).toBe(140);
    expect(motion.durations.pinSelectedMin).toBe(160);
    expect(motion.durations.pinSelectedMax).toBe(200);
    expect(motion.durations.pinEnter).toBe(180);
    expect(motion.durations.blockEnter).toBe(180);
    expect(motion.durations.photoFade).toBe(180);
    expect(motion.durations.favoritePulse).toBe(180);
    expect(motion.durations.geometrySwap).toBe(180);
    expect(motion.durations.modalEnter).toBe(220);
    expect(motion.durations.modalExit).toBe(160);
    expect(motion.durations.galleryStep).toBe(240);
    expect(motion.durations.sheetEnter).toBe(280);
    expect(motion.durations.sheetExit).toBe(180);
    expect(motion.durations.cameraPan).toBe(300);
    expect(motion.durations.sequenceMaxTotal).toBe(300);
    expect(motion.durations.routeHighlight).toBe(650);
    expect(motion.durations.routeHighlightMax).toBe(700);
  });

  it('exports sequence interval tokens with stagger and max items limit', () => {
    expect(motion.intervals.sequenceStagger).toBe(35);
    expect(motion.intervals.sequenceMaxItems).toBe(4);
  });

  it('exports nominal transform values', () => {
    expect(motion.transforms.pressScale).toBe(0.98);
    expect(motion.transforms.hoverTranslateY).toBe(-2);
    expect(motion.transforms.blockEnterTranslateY).toBe(8);
    expect(motion.transforms.pinEnterScale).toBe(0.9);
    expect(motion.transforms.pinSelectedScale).toBe(0.98);
    expect(motion.transforms.favoritePulseScale).toBe(1.12);
    expect(motion.transforms.modalEnterTranslateY).toBe(8);
  });

  it('exports reduced motion default state with 0 duration and identity transforms', () => {
    expect(motion.reduced.duration).toBe(0);
    expect(motion.reduced.scale).toBe(1);
    expect(motion.reduced.translateY).toBe(0);
    expect(motion.reduced.opacity).toBe(1);
  });

  it('integrates motion tokens into central theme object', () => {
    expect(theme.motion).toBe(motion);
    expect(theme.motion.durations.pressIn).toBe(100);
  });
});
