import { describe, expect, it } from 'vitest';
import { tutorial } from './tutorial';

const expectedTitles = [
  '最相关，为什么仍然会泄密？',
  '安全结果从哪里来？',
  '门控怎样兼顾安全与检索质量？',
  '租户需要隔离，为什么模型还能共享？',
  '检索之外，Agent 还会从哪里泄密？',
  '完整架构如何落到 OGX？',
  '实验究竟证明了什么，代价是什么？',
];

const expectedComponents = [
  ['relevance-leak-lab'],
  ['secure-set-builder-lab', 'ingestion-stamp-lab'],
  ['abac-policy-lab', 'pushdown-scale-lab'],
  ['shared-inference-lab'],
  ['conversation-state-lab', 'orchestration-bypass-lab'],
  ['layered-architecture-lab'],
  ['evidence-matrix-lab'],
];

describe('approved tutorial storyline', () => {
  it('uses the approved seven-chapter causal order', () => {
    expect(tutorial.chapters.map((chapter) => chapter.title)).toEqual(expectedTitles);
    expect(tutorial.chapters.map((chapter) => chapter.modules.map((module) => module.componentId)))
      .toEqual(expectedComponents);
  });

  it('keeps one prerequisite sentence and ten sequential active modules', () => {
    expect(tutorial.meta.prerequisite).toContain('RAG 按语义相关性');
    expect(tutorial.meta.prerequisite).toContain('进入模型上下文前');
    expect(tutorial.chapters.map((chapter) => chapter.id)).toEqual([
      'chap-1', 'chap-2', 'chap-3', 'chap-4', 'chap-5', 'chap-6', 'chap-7',
    ]);
    expect(tutorial.chapters.flatMap((chapter) => chapter.modules).map((module) => module.id)).toEqual([
      '1.1', '2.1', '2.2', '3.1', '3.2', '4.1', '5.1', '5.2', '6.1', '7.1',
    ]);
  });

  it('keeps Chapter 5 Agent modules causally separate', () => {
    const chapter = tutorial.chapters[4];
    expect(chapter.modules.map((module) => module.id)).toEqual(['5.1', '5.2']);
    expect(chapter.bridge).toContain('工具');
    expect(chapter.bridge).toContain('状态');
    expect(chapter.bridge).toContain('客户端');
  });
});
