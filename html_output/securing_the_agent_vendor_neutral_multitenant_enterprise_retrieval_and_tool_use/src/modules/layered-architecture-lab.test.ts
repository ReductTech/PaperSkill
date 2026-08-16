import { describe, expect, it } from 'vitest';
import {
  ARCHITECTURE_GEOMETRY,
  ARCHITECTURE_NODE_RECTS,
  ARCHITECTURE_PHASES,
  deriveArchitectureScene,
  type Point,
  type Rect,
} from './layered-architecture-scene';

function circleIntersectsRect(point: Point, radius: number, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(point.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(point.y, rect.y + rect.height));
  const deltaX = point.x - closestX;
  const deltaY = point.y - closestY;
  return deltaX * deltaX + deltaY * deltaY <= radius * radius;
}

function rectanglesOverlap(left: Rect, right: Rect, gap = 0): boolean {
  return left.x - gap < right.x + right.width
    && left.x + left.width + gap > right.x
    && left.y - gap < right.y + right.height
    && left.y + left.height + gap > right.y;
}

describe('paper-grounded architecture request loop', () => {
  it('uses the seven causal phases from Figures 1 and 2', () => {
    expect(ARCHITECTURE_PHASES.map((phase) => [phase.id, phase.start, phase.end])).toEqual([
      ['ingestion', 0, 0.15],
      ['takeover', 0.15, 0.27],
      ['retrieval', 0.27, 0.45],
      ['context', 0.45, 0.58],
      ['agent-loop', 0.58, 0.75],
      ['state', 0.75, 0.88],
      ['response', 0.88, 1],
    ]);
  });

  it('keeps the server trust boundary present for the whole story', () => {
    for (let index = 0; index <= 100; index += 1) {
      expect(deriveArchitectureScene(index / 100).boundaryVisible).toBe(true);
    }
  });

  it('keeps fixed architecture nodes in three non-overlapping presentation lanes', () => {
    const entries = Object.entries(ARCHITECTURE_NODE_RECTS);
    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
      const [leftName, left] = entries[leftIndex];
      expect(left.x).toBeGreaterThanOrEqual(ARCHITECTURE_GEOMETRY.boundary.x);
      expect(left.x + left.width).toBeLessThanOrEqual(
        ARCHITECTURE_GEOMETRY.boundary.x + ARCHITECTURE_GEOMETRY.boundary.width,
      );
      for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
        const [rightName, right] = entries[rightIndex];
        expect(
          rectanglesOverlap(left, right, 3),
          `${leftName} overlaps ${rightName}`,
        ).toBe(false);
      }
    }
  });

  it('separates offline ingestion from the online Finance query', () => {
    const ingestion = deriveArchitectureScene(0.1);
    expect(ingestion.phase).toBe('ingestion');
    expect(ingestion.query.visible).toBe(false);

    for (let index = 15; index <= 100; index += 1) {
      const scene = deriveArchitectureScene(index / 100);
      expect(circleIntersectsRect(scene.query.legitimate, 7, ARCHITECTURE_GEOMETRY.ingestionNode)).toBe(false);
    }
  });

  it('stops the client bypass attempt at the trust boundary', () => {
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveArchitectureScene(index / 100);
      expect(scene.query.bypass.x).toBeLessThanOrEqual(ARCHITECTURE_GEOMETRY.boundary.x);
    }
    expect(deriveArchitectureScene(0.27).query.bypassBlocked).toBe(true);
  });

  it('keeps Finance and Legal chunks on separate non-overlapping routes', () => {
    for (let index = 27; index <= 58; index += 1) {
      const scene = deriveArchitectureScene(index / 100);
      const distance = Math.hypot(
        scene.retrieval.financeChunk.x - scene.retrieval.legalChunk.x,
        scene.retrieval.financeChunk.y - scene.retrieval.legalChunk.y,
      );
      expect(distance, `chunk separation at ${index / 100}`).toBeGreaterThanOrEqual(14);
    }
  });

  it('never admits Legal into the authorized context or shared inference', () => {
    for (let index = 0; index <= 100; index += 1) {
      const scene = deriveArchitectureScene(index / 100);
      expect(scene.context.cardIds).not.toContain('legal');
    }

    const context = deriveArchitectureScene(0.58);
    expect(context.context.cardIds).toEqual(['finance']);
    expect(context.context.inferenceReady).toBe(true);
    expect(context.retrieval.legalDenied).toBe(true);
  });

  it('activates the tool only after propagated user and tenant authorization permits it', () => {
    for (let index = 0; index <= 100; index += 1) {
      const tool = deriveArchitectureScene(index / 100).tool;
      if (tool.active) expect(tool.authorization).toBe('permit');
      if (tool.authorization !== 'permit') expect(tool.active).toBe(false);
    }
  });

  it('writes the result only to Finance state while Legal remains untouched', () => {
    const state = deriveArchitectureScene(0.88).state;
    expect(state.financeStored).toBe(true);
    expect(state.legalUntouched).toBe(true);
  });

  it('returns a response only after the server-controlled path completes', () => {
    expect(deriveArchitectureScene(0.87).response.returned).toBe(false);
    expect(deriveArchitectureScene(1).response.returned).toBe(true);
  });

  it('clamps progress and produces stable terminal states', () => {
    expect(deriveArchitectureScene(-1)).toEqual(deriveArchitectureScene(0));
    expect(deriveArchitectureScene(2)).toEqual(deriveArchitectureScene(1));
  });

  it.each([0.15, 0.27, 0.45, 0.58, 0.75, 0.88])(
    'keeps every moving object continuous at progress %s',
    (boundary) => {
      const before = deriveArchitectureScene(boundary - 0.00001).motionPoints;
      const after = deriveArchitectureScene(boundary + 0.00001).motionPoints;
      expect(after).toHaveLength(before.length);
      before.forEach((point, index) => {
        expect(Math.hypot(point.x - after[index].x, point.y - after[index].y)).toBeLessThan(0.2);
      });
    },
  );
});
