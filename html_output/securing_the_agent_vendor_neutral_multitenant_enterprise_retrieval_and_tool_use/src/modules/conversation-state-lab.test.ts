import { describe, expect, it } from 'vitest';
import {
  CONVERSATION_STATE_LAYOUT,
  deriveAgentPacketMotion,
  deriveAgentPathScene,
  deriveConversationStateDisplayMetrics,
} from './conversation-state-lab';

describe('Agent tool and state risks', () => {
  it('requires authorization before the first tool execution', () => {
    const scene = deriveAgentPathScene(3, 'tenant');
    expect(scene.activeStage).toBe('工具前校验');
    expect(scene.toolAuthorizationRequired).toBe(true);
    expect(scene.historyLeak).toBe(false);
  });

  it('shows that shared state can leak a prior Legal tool result', () => {
    const scene = deriveAgentPathScene(5, 'shared');
    expect(scene.stage).toBe('next-turn');
    expect(scene.historyLeak).toBe(true);
    expect(scene.historyText).toContain('Legal 工具结果');
    expect(scene.nextTurnItems).toContain('Legal 旧工具结果');
  });

  it('keeps the old Legal result in a separate tenant compartment', () => {
    const scene = deriveAgentPathScene(5, 'tenant');
    expect(scene.stateCompartmentCount).toBe(2);
    expect(scene.stateItems).toContain('Legal 旧工具结果');
    expect(scene.nextTurnItems.every((item) => item.startsWith('Finance'))).toBe(true);
    expect(scene.historyLeak).toBe(false);
  });

  it('uses six causal teaching frames for inference, tool use, and the next turn', () => {
    expect(Array.from({ length: 6 }, (_, step) => deriveAgentPathScene(step, 'tenant').activeStage)).toEqual([
      'Finance 请求',
      '授权上下文',
      '首次推理',
      '工具前校验',
      '工具结果',
      '下一轮推理',
    ]);
  });

  it('splits the final transition into state write and history read phases', () => {
    expect(deriveAgentPacketMotion(4, 5, 0.25).phase).toBe('write');
    expect(deriveAgentPacketMotion(4, 5, 0.75).phase).toBe('read');
    expect(deriveAgentPacketMotion(5, 4, 0.25).phase).toBe('read');
    expect(deriveAgentPacketMotion(5, 4, 0.75).phase).toBe('write');
  });

  it('keeps the animated packet inside the Canvas in both directions', () => {
    (['forward', 'reverse'] as const).forEach((direction) => {
      for (let step = 0; step <= 100; step += 1) {
        const motion = direction === 'forward'
          ? deriveAgentPacketMotion(4, 5, step / 100)
          : deriveAgentPacketMotion(5, 4, step / 100);
        expect(motion.x, `${direction} x at ${step / 100}`).toBeGreaterThanOrEqual(0);
        expect(motion.x, `${direction} x at ${step / 100}`).toBeLessThanOrEqual(CONVERSATION_STATE_LAYOUT.width);
        expect(motion.y, `${direction} y at ${step / 100}`).toBeGreaterThanOrEqual(0);
        expect(motion.y, `${direction} y at ${step / 100}`).toBeLessThanOrEqual(CONVERSATION_STATE_LAYOUT.height);
      }
    });
  });

  it('scales the smallest causal labels to a readable desktop size', () => {
    const metrics = deriveConversationStateDisplayMetrics();
    expect(metrics.logicalWidth).toBe(560);
    expect(metrics.maxDisplayWidth).toBe(820);
    expect(metrics.minimumDisplayedFontPx).toBeGreaterThanOrEqual(10.9);
  });
});
