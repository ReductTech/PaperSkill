import { useMemo, useState } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline, type TimelineController } from '../animation/useTimeline';
import { LIBRARY_SCENARIO, illustrativeSimilarity, type Tenant } from './evidence/scenarios';
import { ContinuousSlider, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, dot, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type RelevanceLeakPhase = 'query' | 'ranking' | 'decision-hold' | 'transfer' | 'context';

export interface RankedDocumentModel {
  id: string;
  title: string;
  tenant: Tenant;
  similarity: number;
  rank: number;
  rowY: number;
}

export interface RelevanceLeakScene {
  phase: RelevanceLeakPhase;
  progress: number;
  queryPosition: number;
  illustrativeSimilarity: true;
  documents: RankedDocumentModel[];
  ranking: RankedDocumentModel[];
  transferProgress: number;
  contextTenant: Tenant | null;
  leakage: boolean;
  accidentalSameTenant: boolean;
  enforcedSafety: false;
}

export const RELEVANCE_LIST_LAYOUT = {
  frameX: 28,
  frameY: 86,
  frameWidth: 350,
  frameHeight: 158,
  headingX: 203,
  headingY: 96,
  rowX: 45,
  rowWidth: 310,
  rowHeight: 27,
  rowBaseY: 121,
  tenantX: 232,
  scoreX: 342,
  longestTenantWidth: 64,
  scoreWidth: 32,
  minimumColumnGap: 12,
} as const;

function softRank(documentIndex: number, allSimilarities: number[]): number {
  const similarity = allSimilarities[documentIndex];
  const temperature = 0.035;
  return 1 + allSimilarities.reduce((rank, other, otherIndex) => {
    if (otherIndex === documentIndex) return rank;
    return rank + 1 / (1 + Math.exp(-(other - similarity) / temperature));
  }, 0);
}

export function deriveRelevanceLeakScene(progress: number, queryPosition: number): RelevanceLeakScene {
  const p = clamp01(progress);
  const q = clamp01(queryPosition);
  const scored = LIBRARY_SCENARIO.documents.map((document) => ({
    ...document,
    similarity: illustrativeSimilarity(q, document.anchor),
  }));
  const similarities = scored.map((document) => document.similarity);
  const documents = scored.map((document, documentIndex) => {
    const tiedIndices = similarities
      .map((similarity, index) => Math.abs(similarity - document.similarity) < 1e-8 ? index : -1)
      .filter((index) => index >= 0);
    const tiePosition = tiedIndices.indexOf(documentIndex) - (tiedIndices.length - 1) / 2;
    return {
      id: document.id,
      title: document.title,
      tenant: document.tenant,
      similarity: document.similarity,
      rank: 0,
      rowY: RELEVANCE_LIST_LAYOUT.rowBaseY
        + (softRank(documentIndex, similarities) - 1) * 35
        + tiePosition * 30,
    };
  });
  const ranking = [...documents]
    .sort((left, right) => right.similarity - left.similarity || left.id.localeCompare(right.id))
    .map((document, index) => ({ ...document, rank: index + 1 }));
  const ranks = new Map(ranking.map((document) => [document.id, document.rank]));
  documents.forEach((document) => { document.rank = ranks.get(document.id) ?? 0; });

  const phase: RelevanceLeakPhase = p < 0.18
    ? 'query'
    : p < 0.5
      ? 'ranking'
      : p < 0.594
        ? 'decision-hold'
        : p < 0.86
          ? 'transfer'
          : 'context';
  const transferProgress = easeInOutCubic(phaseProgress(p, 0.594, 0.86));
  const top = ranking[0];
  const inContext = p >= 0.86;
  const contextTenant = inContext ? top.tenant : null;

  return {
    phase,
    progress: p,
    queryPosition: q,
    illustrativeSimilarity: true,
    documents,
    ranking,
    transferProgress,
    contextTenant,
    leakage: contextTenant !== null && contextTenant !== LIBRARY_SCENARIO.activeTenant,
    accidentalSameTenant: contextTenant === LIBRARY_SCENARIO.activeTenant,
    enforcedSafety: false,
  };
}

const phases = [
  { id: 'query', label: '移动查询', start: 0, end: 0.18 },
  { id: 'ranking', label: '连续排序', start: 0.18, end: 0.5 },
  { id: 'decision', label: 'top-1 决策', start: 0.5, end: 0.594 },
  { id: 'transfer', label: '送入上下文', start: 0.594, end: 0.86 },
  { id: 'context', label: '结果', start: 0.86, end: 1 },
];

export function RelevanceLeakLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(4_800);
  const [manualQuery, setManualQuery] = useState<number | null>(null);
  const playbackQuery = lerp(0.08, 0.92, easeInOutCubic(phaseProgress(timeline.progress, 0, 0.48)));
  const queryPosition = manualQuery ?? playbackQuery;
  const scene = deriveRelevanceLeakScene(timeline.progress, queryPosition);
  const top = scene.ranking[0];
  const controlledTimeline: TimelineController = useMemo(() => ({
    ...timeline,
    replay: () => {
      setManualQuery(null);
      timeline.replay();
    },
  }), [timeline]);

  const setQuery = (next: number) => {
    setManualQuery(next);
    timeline.seek(0.9);
  };

  return (
    <LabShell>
      <ContinuousSlider
        label="Finance 查询的语义位置"
        value={queryPosition}
        min={0}
        max={1}
        step={0.001}
        valueText={queryPosition < 0.29 ? '预算' : queryPosition < 0.71 ? '事故' : '合同'}
        onTakeControl={timeline.pause}
        onChange={setQuery}
      />
      <div className="semantic-axis-labels" aria-hidden="true">
        <span>预算</span><span>事故</span><span>合同</span>
      </div>
      <LabCanvas
        height={290}
        labelText="Finance 查询在共享向量库中连续改变排名，并把最相关文档送入上下文"
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          label(ctx, '连续语义意图轴', 155, 20, C.blue, 12);
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(28, 48);
          ctx.lineTo(280, 48);
          ctx.stroke();
          LIBRARY_SCENARIO.queryAnchors.forEach((anchor) => {
            const x = 28 + anchor.position * 252;
            dot(ctx, x, 48, 4, C.muted, C.bg, 1);
            label(ctx, anchor.label.replace('问题', ''), x, 68, C.muted, 9);
          });
          const queryX = 28 + scene.queryPosition * 252;
          dot(ctx, queryX, 48, 9, C.blue);
          label(ctx, 'Q', queryX, 48, C.white, 9);

          const list = RELEVANCE_LIST_LAYOUT;
          box(ctx, list.frameX, list.frameY, list.frameWidth, list.frameHeight, C.white, C.line, 2);
          label(ctx, '共享语料：仅按示意相似度排序', list.headingX, list.headingY, C.muted, 11);
          scene.documents.forEach((document) => {
            const isTop = document.id === top.id;
            const tenantColor = document.tenant === 'Finance' ? C.green : C.red;
            box(ctx, list.rowX, document.rowY - 13, list.rowWidth, list.rowHeight, isTop ? '#fff8e8' : '#f8fafc', isTop ? C.orange : C.line, isTop ? 3 : 1);
            label(ctx, `#${document.rank}`, 61, document.rowY, isTop ? C.orange : C.muted, 10);
            label(ctx, document.title, 82, document.rowY, C.ink, 11, 'left');
            label(ctx, document.tenant, list.tenantX, document.rowY, tenantColor, 10, 'left');
            label(ctx, document.similarity.toFixed(3), list.scoreX, document.rowY, isTop ? C.orange : C.muted, 10, 'right');
          });

          box(ctx, 404, 94, 132, 104, scene.contextTenant ? (scene.leakage ? '#fff1f3' : '#eef9f3') : '#f6f8fc', scene.leakage ? C.red : scene.contextTenant ? C.green : C.line, 3);
          label(ctx, '模型上下文', 470, 116, C.ink, 12);
          label(ctx, scene.contextTenant ?? '等待 top-1', 470, 147, scene.leakage ? C.red : scene.contextTenant ? C.green : C.muted, 14);
          label(ctx, scene.leakage ? '越权内容已进入' : scene.accidentalSameTenant ? '本次碰巧同租户' : '尚未传输', 470, 175, scene.leakage ? C.red : C.muted, 10);

          if (scene.phase === 'decision-hold') {
            box(ctx, 369, 40, 155, 34, '#fff8e8', C.orange, 2);
            label(ctx, `锁定 top-1：${top.tenant}`, 446, 57, C.orange, 11);
          }
          if (scene.transferProgress > 0) {
            const source = scene.documents.find((document) => document.id === top.id)!;
            const x = lerp(344, 414, scene.transferProgress);
            const y = lerp(source.rowY, 147, scene.transferProgress);
            arrow(ctx, 363, source.rowY, 400, 147, top.tenant === LIBRARY_SCENARIO.activeTenant ? C.green : C.red, 2);
            dot(ctx, x, y, 9, top.tenant !== 'Finance' ? C.red : C.green);
          }
          label(ctx, '相似度为教学示意，非论文实测', 280, 272, C.muted, 11);
        }}
      />
      <TimelineControls timeline={controlledTimeline} phases={phases} label="相关性泄漏演示" />
      <Feedback tone={scene.leakage ? 'bad' : scene.accidentalSameTenant ? 'warn' : 'info'}>
        {scene.leakage
          ? `${top.title} 与查询最相关，但它属于 ${top.tenant}；没有 P(u,d) 授权判断，秘密已经进入 Finance 的模型上下文。`
          : scene.accidentalSameTenant
            ? '当前 top-1 碰巧属于 Finance，但这只是一次命中，不是安全保证；系统仍未执行授权。'
            : '拖动语义位置可连续改变排名；播放会在 top-1 决策处停留，再展示文档如何进入上下文。'}
      </Feedback>
    </LabShell>
  );
}
