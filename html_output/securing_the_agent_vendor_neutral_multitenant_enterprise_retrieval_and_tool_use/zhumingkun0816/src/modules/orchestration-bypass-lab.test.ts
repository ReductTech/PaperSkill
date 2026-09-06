import { describe, expect, it } from 'vitest';
import {
  ATTACK_VISUALS,
  ORCHESTRATION_GEOMETRY,
  deriveOrchestrationScene,
  type AttackType,
  type Point,
  type Rect,
} from './orchestration-bypass-lab';

const attacks: AttackType[] = ['skipGate', 'unauthorizedTool', 'staleContext'];

function circleIntersectsRect(point: Point, radius: number, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const deltaX = point.x - closestX;
  const deltaY = point.y - closestY;
  return deltaX * deltaX + deltaY * deltaY <= radius * radius;
}

describe('paper-grounded orchestration bypass scenes', () => {
  it('gives every attack its own narration phases', () => {
    expect(ATTACK_VISUALS.skipGate.phases.map((phase) => phase.label)).toEqual([
      '发起越权检索',
      '路径分流',
      '门控判定',
      '结果',
    ]);
    expect(ATTACK_VISUALS.unauthorizedTool.phases.map((phase) => phase.label)).toEqual([
      '生成 tool_call',
      '调用路径分支',
      '执行 / 逐次授权',
      '结果',
    ]);
    expect(ATTACK_VISUALS.staleContext.phases.map((phase) => phase.label)).toEqual([
      '读取历史',
      '构造上下文',
      '送入推理',
      '结果',
    ]);
  });

  it('routes the client-side retrieval token around the ABAC gate at every sampled frame', () => {
    const gate = ORCHESTRATION_GEOMETRY.skipGate.clientGate;
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveOrchestrationScene(index / 100, 'skipGate');
      expect(scene.attack).toBe('skipGate');
      if (scene.attack !== 'skipGate') throw new Error('unexpected scene');
      expect(scene.client.gateVisited).toBe(false);
      expect(circleIntersectsRect(scene.client.token, 7, gate)).toBe(false);
    }

    const result = deriveOrchestrationScene(1, 'skipGate');
    if (result.attack !== 'skipGate') throw new Error('unexpected scene');
    expect(result.client.searchReached).toBe(true);
  });

  it('forces the server-side retrieval token into the ABAC gate and never reaches search', () => {
    const checking = deriveOrchestrationScene(0.65, 'skipGate');
    const result = deriveOrchestrationScene(1, 'skipGate');
    if (checking.attack !== 'skipGate' || result.attack !== 'skipGate') throw new Error('unexpected scene');

    expect(circleIntersectsRect(checking.server.token, 7, ORCHESTRATION_GEOMETRY.skipGate.serverGate)).toBe(true);
    expect(result.server.gateState).toBe('denied');
    expect(result.server.searchReached).toBe(false);
  });

  it('executes an unpropagated client tool call but blocks it at server authorization', () => {
    const scene = deriveOrchestrationScene(1, 'unauthorizedTool');
    if (scene.attack !== 'unauthorizedTool') throw new Error('unexpected scene');

    expect(scene.client.authorizationVisited).toBe(false);
    expect(scene.client.toolExecuted).toBe(true);
    expect(scene.server.authorizationVisited).toBe(true);
    expect(scene.server.authorizationState).toBe('denied');
    expect(scene.server.toolExecuted).toBe(false);
  });

  it('contaminates only the client-built Finance context with Legal history', () => {
    const scene = deriveOrchestrationScene(1, 'staleContext');
    if (scene.attack !== 'staleContext') throw new Error('unexpected scene');

    expect(scene.client.contextCards).toEqual(['finance', 'legal']);
    expect(scene.client.contaminated).toBe(true);
    expect(scene.server.contextCards).toEqual(['finance']);
    expect(scene.server.contaminated).toBe(false);
  });

  it('moves the client Finance and Legal cards without covering each other', () => {
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveOrchestrationScene(index / 100, 'staleContext');
      if (scene.attack !== 'staleContext') throw new Error('unexpected scene');
      const horizontalOverlap = Math.abs(scene.client.legalCard.x - scene.client.financeCard.x) < 58;
      const verticalOverlap = Math.abs(scene.client.legalCard.y - scene.client.financeCard.y) < 22;
      expect(horizontalOverlap && verticalOverlap).toBe(false);
    }
  });

  it('keeps the server Legal card inside its tenant partition for the whole animation', () => {
    const legalPartition = ORCHESTRATION_GEOMETRY.staleContext.serverLegalPartition;
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveOrchestrationScene(index / 100, 'staleContext');
      if (scene.attack !== 'staleContext') throw new Error('unexpected scene');
      expect(circleIntersectsRect(scene.server.legalCard, 5, legalPartition)).toBe(true);
    }
  });

  it('keeps initial moving tokens clear of the node labels', () => {
    const retrieval = deriveOrchestrationScene(0, 'skipGate');
    const tool = deriveOrchestrationScene(0, 'unauthorizedTool');
    if (retrieval.attack !== 'skipGate' || tool.attack !== 'unauthorizedTool') throw new Error('unexpected scene');

    expect(retrieval.client.token.y).toBeLessThan(87);
    expect(retrieval.server.token.y).toBeLessThan(87);
    expect(tool.client.toolCall.y).toBeLessThan(83);
    expect(tool.server.toolCall.y).toBeLessThan(83);
  });

  it('parks terminal tokens on node input ports instead of covering labels', () => {
    const retrieval = deriveOrchestrationScene(1, 'skipGate');
    const tool = deriveOrchestrationScene(1, 'unauthorizedTool');
    const state = deriveOrchestrationScene(1, 'staleContext');
    if (
      retrieval.attack !== 'skipGate'
      || tool.attack !== 'unauthorizedTool'
      || state.attack !== 'staleContext'
    ) throw new Error('unexpected scene');

    expect(retrieval.server.token.x).toBeLessThan(115);
    expect(tool.client.toolCall.x).toBeLessThan(188);
    expect(tool.server.toolCall.y).toBeLessThan(165);
    expect(state.client.contextPacket.y).toBeLessThan(210);
    expect(state.server.contextPacket.y).toBeLessThan(210);
  });

  it.each(attacks)('clamps %s progress and reaches a stable terminal state', (attack) => {
    expect(deriveOrchestrationScene(-1, attack)).toEqual(deriveOrchestrationScene(0, attack));
    expect(deriveOrchestrationScene(2, attack)).toEqual(deriveOrchestrationScene(1, attack));
  });

  it.each([
    ['skipGate', [0.18, 0.58, 0.8]],
    ['unauthorizedTool', [0.2, 0.5, 0.8]],
    ['staleContext', [0.22, 0.62, 0.82]],
  ] as const)('keeps %s motion continuous at phase boundaries', (attack, boundaries) => {
    for (const boundary of boundaries) {
      const before = deriveOrchestrationScene(boundary - 0.00001, attack);
      const after = deriveOrchestrationScene(boundary + 0.00001, attack);
      const pointsBefore = before.motionPoints;
      const pointsAfter = after.motionPoints;
      expect(pointsAfter).toHaveLength(pointsBefore.length);
      pointsBefore.forEach((point, index) => {
        expect(Math.hypot(point.x - pointsAfter[index].x, point.y - pointsAfter[index].y)).toBeLessThan(0.2);
      });
    }
  });
});
