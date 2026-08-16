import { describe, expect, it } from 'vitest';
import { deriveGateToggleScene, GATE_TOGGLE_LAYOUT } from './gate-toggle-lab';

describe('gate toggle visual contract', () => {
  it('stops the Legal token outside the authorization box', () => {
    const layout = GATE_TOGGLE_LAYOUT;
    const scene = deriveGateToggleScene(1, true);
    expect(scene.legalX + layout.tokenRadius).toBeLessThan(layout.gateX);
    expect(layout.rejectionMarkX + layout.rejectionMarkHalfWidth).toBeLessThan(layout.gateX);
  });

  it('uses separate decision rows inside the authorization box', () => {
    const scene = deriveGateToggleScene(1, true);
    expect(scene.legalDecision).toBe('deny');
    expect(scene.financeDecision).toBe('permit');
    expect(GATE_TOGGLE_LAYOUT.legalDecisionY).toBeLessThan(GATE_TOGGLE_LAYOUT.financeDecisionY);
  });

  it('keeps the Finance decision row above the passing token lane', () => {
    const layout = GATE_TOGGLE_LAYOUT;
    const decisionBottom = layout.financeDecisionY + 5;
    const tokenTop = layout.financeY - layout.tokenRadius;
    expect(decisionBottom + 4).toBeLessThanOrEqual(tokenTop);
  });

  it('shows Finance as a static unselected candidate until authorization permits it', () => {
    const relevanceOnly = deriveGateToggleScene(1, false);
    const authorized = deriveGateToggleScene(1, true);

    expect(relevanceOnly.financeTokenVisible).toBe(false);
    expect(relevanceOnly.financeLabel).toBe('#2 Finance · 未选择');
    expect(authorized.financeTokenVisible).toBe(true);
    expect(authorized.financeLabel).toBe('Finance → PERMIT');
  });
});
