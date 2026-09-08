import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  deriveSharedInferenceScene,
  deriveSharedModelTransition,
  SharedInferenceLab,
  SHARED_INFERENCE_LAYOUT,
} from './shared-inference-lab';

interface Rect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function rectanglesIntersect(a: Rect, b: Rect) {
  return a.left < b.right
    && a.right > b.left
    && a.top < b.bottom
    && a.bottom > b.top;
}

function contextRect(context: { x: number; y: number }): Rect {
  return {
    left: context.x - SHARED_INFERENCE_LAYOUT.envelope.width / 2,
    right: context.x + SHARED_INFERENCE_LAYOUT.envelope.width / 2,
    top: context.y - SHARED_INFERENCE_LAYOUT.envelope.height / 2,
    bottom: context.y + SHARED_INFERENCE_LAYOUT.envelope.height / 2,
  };
}

describe('Shared Inference topology', () => {
  it('defaults the presentation animation to 1.5x playback', () => {
    const markup = renderToStaticMarkup(createElement(SharedInferenceLab, {
      chapterId: 'chap-4',
      moduleId: '4.1',
    }));
    expect(markup).toContain('<option value="1.5" selected="">1.5×</option>');
  });

  it('shows per-tenant endpoints before consolidation', () => {
    const scene = deriveSharedInferenceScene(0.05, 'isolated');
    expect(scene.phase).toBe('separate');
    expect(scene.modelInstanceCount).toBe(3);
    expect(scene.costLabel).toBe('O(N × M)');
  });

  it('shares the endpoint but never the context envelope', () => {
    const scene = deriveSharedInferenceScene(0.78, 'shared');
    expect(scene.modelInstanceCount).toBe(1);
    expect(scene.contexts.every((context) => context.tenant === context.owner)).toBe(true);
    expect(scene.contexts.some((context) => context.mixed)).toBe(false);
    expect(scene.costLabel).toBe('O(M)');
  });

  it('keeps the per-tenant cost baseline until convergence', () => {
    const scene = deriveSharedInferenceScene(0, 'shared');
    expect(scene.modelInstanceCount).toBe(3);
    expect(scene.costLabel).toBe('O(N × M)');
    expect(scene.convergenceProgress).toBe(0);
  });

  it('ends on the A3 boundary', () => {
    const scene = deriveSharedInferenceScene(1, 'shared');
    expect(scene.phase).toBe('boundary');
    expect(scene.contextIsolation).toBe(true);
    expect(scene.parametricIsolation).toBe(false);
    expect(scene.boundaryText).toContain('参数记忆');
  });

  it('keeps context envelopes clear of policy gates and model endpoints', () => {
    (['isolated', 'shared'] as const).forEach((topology) => {
      for (let step = 0; step <= 100; step += 1) {
        const scene = deriveSharedInferenceScene(step / 100, topology);
        scene.contexts.filter((context) => context.visible).forEach((context) => {
          const envelope = contextRect(context);
          const rowY = SHARED_INFERENCE_LAYOUT.rows[context.tenant];
          const gate: Rect = {
            left: SHARED_INFERENCE_LAYOUT.gate.left,
            right: SHARED_INFERENCE_LAYOUT.gate.left + SHARED_INFERENCE_LAYOUT.gate.width,
            top: rowY - SHARED_INFERENCE_LAYOUT.gate.height / 2,
            bottom: rowY + SHARED_INFERENCE_LAYOUT.gate.height / 2,
          };

          expect(rectanglesIntersect(envelope, gate), `${topology} ${context.tenant} at ${step / 100}`).toBe(false);
          expect(
            SHARED_INFERENCE_LAYOUT.model.left - envelope.right,
            `${topology} ${context.tenant} endpoint gap at ${step / 100}`,
          ).toBeGreaterThanOrEqual(SHARED_INFERENCE_LAYOUT.model.minimumGap);
        });
      }
    });
  });

  it('keeps all shared tenant envelopes visually disjoint', () => {
    for (let step = 0; step <= 100; step += 1) {
      const contexts = deriveSharedInferenceScene(step / 100, 'shared').contexts
        .filter((context) => context.visible);

      for (let first = 0; first < contexts.length; first += 1) {
        for (let second = first + 1; second < contexts.length; second += 1) {
          expect(
            rectanglesIntersect(contextRect(contexts[first]), contextRect(contexts[second])),
            `${contexts[first].tenant}/${contexts[second].tenant} at ${step / 100}`,
          ).toBe(false);
        }
      }
    }
  });

  it('does not cross-fade old and shared model labels over each other', () => {
    for (let step = 0; step <= 100; step += 1) {
      const transition = deriveSharedModelTransition(step / 100);
      expect(
        transition.separateOpacity > 0.001 && transition.sharedOpacity > 0.001,
        `simultaneous model labels at ${step / 100}`,
      ).toBe(false);
    }
  });
});
