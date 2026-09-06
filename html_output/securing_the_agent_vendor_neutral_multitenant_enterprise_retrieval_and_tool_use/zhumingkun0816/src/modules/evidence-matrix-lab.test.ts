import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EVIDENCE_QUESTIONS, EvidenceMatrixLab, deriveEvidenceFrame } from './evidence-matrix-lab';
import { PAPER_EVIDENCE } from './evidence/paperEvidence';

describe('question-driven evidence verifier', () => {
  it('groups all evidence under security, quality, and cost', () => {
    expect(Object.keys(EVIDENCE_QUESTIONS)).toEqual(['security', 'quality', 'cost']);
    expect(EVIDENCE_QUESTIONS.security.ctlr).toEqual(PAPER_EVIDENCE.security.ctlr);
    expect(EVIDENCE_QUESTIONS.security.avr).toEqual(PAPER_EVIDENCE.security.avr);
    expect(EVIDENCE_QUESTIONS.security.injectionLeaks).toEqual(PAPER_EVIDENCE.injectionLeaks);
    expect(EVIDENCE_QUESTIONS.cost.qpsAt25).toEqual(PAPER_EVIDENCE.qpsAt25);
  });

  it('states the paper mechanism split exactly', () => {
    expect(EVIDENCE_QUESTIONS.security.conclusion).toContain('门控提供安全');
    expect(EVIDENCE_QUESTIONS.security.conclusion).toContain('服务端编排提供强制执行');
  });

  it('points the scale recall evidence to chapter 3', () => {
    expect(EVIDENCE_QUESTIONS.quality.protocol).toContain('§3');
    expect(EVIDENCE_QUESTIONS.quality.protocol).not.toContain('§5');
    expect(EVIDENCE_QUESTIONS.quality.conclusion).toContain('§3');
    expect(EVIDENCE_QUESTIONS.quality.conclusion).not.toContain('§5');
  });

  it('never overshoots exact values during reveal', () => {
    const early = deriveEvidenceFrame('cost', 0.25);
    const end = deriveEvidenceFrame('cost', 1);
    early.animatedValues.forEach((value, index) => {
      expect(value).toBeLessThanOrEqual(end.animatedValues[index]);
    });
  });

  it('gives the evidence canvas its own large desktop viewport', () => {
    const markup = renderToStaticMarkup(createElement(EvidenceMatrixLab, {
      chapterId: 'chap-7',
      moduleId: '7.1',
    }));
    expect(markup).toContain('evidence-matrix-canvas');
  });
});
