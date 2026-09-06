import { describe, expect, it } from 'vitest';
import { deriveAnalogyScene, deriveHeroScene } from './library-scenes';

describe('authorization-neutral Hero comparison', () => {
  it.each([
    [0, 'query'],
    [0.3, 'rank'],
    [0.55, 'scope'],
    [0.75, 'select'],
    [1, 'context'],
  ] as const)('keeps both panels synchronized at %s', (progress, phase) => {
    expect(deriveHeroScene(progress, 'old').phase).toBe(phase);
    expect(deriveHeroScene(progress, 'new').phase).toBe(phase);
  });

  it('shows Legal as a counterfactual rank without selecting it in the paper panel', () => {
    const paper = deriveHeroScene(0.75, 'new');
    expect(paper.counterfactualTopTenant).toBe('Legal');
    expect(paper.authorizedTenants).toEqual(['Finance']);
    expect(paper.selectedTenant).toBe('Finance');
    expect(paper.legalExcluded).toBe(true);
  });

  it('ends with different contexts for the same query', () => {
    expect(deriveHeroScene(1, 'old').contextTenant).toBe('Legal');
    expect(deriveHeroScene(1, 'new').contextTenant).toBe('Finance');
  });

  it('points the paper-panel scale explanation to chapter 3', () => {
    expect(deriveHeroScene(1, 'new')).toMatchObject({
      footer: expect.stringContaining('§3'),
    });
  });
});

describe('reordered chapter analogy scenes', () => {
  it.each([
    ['chap-1', '目录排名'],
    ['chap-2', '集合交集'],
    ['chap-3', '两层验卡'],
    ['chap-4', '共享端点'],
    ['chap-5', '工具与状态'],
    ['chap-6', '完整地图'],
    ['chap-7', '证据矩阵'],
  ] as const)('maps %s to %s', (chapterId, title) => {
    expect(deriveAnalogyScene(chapterId).title).toBe(title);
  });
});
