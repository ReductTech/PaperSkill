import { useMemo, useState } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline, type TimelineController } from '../animation/useTimeline';
import { LIBRARY_SCENARIO } from './evidence/scenarios';
import { ChipRow, ContinuousSlider, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, box, dot, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type SecureSetPhase = 'corpus' | 'relevance' | 'relevance-hold' | 'authorize' | 'secure';
export type SetArea = 'outside' | 'relevance-only' | 'authorization-only' | 'secure';

export interface SecureSetDocumentModel {
  id: string;
  title: string;
  displayLabel: string;
  score: number;
  relevant: boolean;
  authorized: boolean;
  secure: boolean;
  targetArea: SetArea;
  x: number;
  y: number;
}

export interface SecureSetScene {
  phase: SecureSetPhase;
  threshold: number;
  documents: SecureSetDocumentModel[];
  relevantIds: string[];
  authorizedIds: string[];
  secureIds: string[];
  authorizationProgress: number;
}

export function deriveSecureSetScene(progress: number, threshold: number, permitLegal: boolean): SecureSetScene {
  const p = clamp01(progress);
  const boundedThreshold = Math.max(55, Math.min(95, threshold));
  const phase: SecureSetPhase = p < 0.18
    ? 'corpus'
    : p < 0.52
      ? 'relevance'
      : p < 0.615
        ? 'relevance-hold'
        : p < 0.86
          ? 'authorize'
          : 'secure';
  const authorizationProgress = easeInOutCubic(phaseProgress(p, 0.615, 0.86));

  const documents = LIBRARY_SCENARIO.documents.map((document, index): SecureSetDocumentModel => {
    const relevant = document.relevanceScore >= boundedThreshold;
    const policyAuthorized = document.tenant === 'Finance' || (document.tenant === 'Legal' && permitLegal);
    const authorized = p >= 0.615 && policyAuthorized;
    const secure = relevant && authorized;
    const finalArea: SetArea = relevant && policyAuthorized
      ? 'secure'
      : relevant
        ? 'relevance-only'
        : policyAuthorized
          ? 'authorization-only'
          : 'outside';
    const targetArea: SetArea = p >= 0.615 ? finalArea : relevant ? 'relevance-only' : 'outside';
    const relevanceStrength = 1 / (1 + Math.exp(-(document.relevanceScore - boundedThreshold) / 1.8));
    const relevanceX = lerp(82, 214, relevanceStrength);
    const targetX = {
      outside: 82,
      'relevance-only': 190,
      'authorization-only': 370,
      secure: 280,
    }[finalArea];
    return {
      id: document.id,
      title: document.title,
      displayLabel: document.tenant === 'Legal'
        ? `Legal · ${document.title} ${document.relevanceScore}`
        : `${document.title} ${document.relevanceScore}`,
      score: document.relevanceScore,
      relevant,
      authorized,
      secure,
      targetArea,
      x: lerp(relevanceX, targetX, authorizationProgress),
      y: 88 + index * 35,
    };
  });

  return {
    phase,
    threshold: boundedThreshold,
    documents,
    relevantIds: documents.filter((document) => document.relevant).map((document) => document.id),
    authorizedIds: documents.filter((document) => document.authorized).map((document) => document.id),
    secureIds: documents.filter((document) => document.secure).map((document) => document.id),
    authorizationProgress,
  };
}

const phases = [
  { id: 'corpus', label: '固定语料', start: 0, end: 0.18 },
  { id: 'relevance', label: '形成相关集合', start: 0.18, end: 0.52 },
  { id: 'hold', label: '集合停留', start: 0.52, end: 0.615 },
  { id: 'authorize', label: '应用授权', start: 0.615, end: 0.86 },
  { id: 'secure', label: '安全交集', start: 0.86, end: 1 },
];

export function SecureSetBuilderLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(4_200);
  const [manualThreshold, setManualThreshold] = useState<number | null>(null);
  const [permitLegal, setPermitLegal] = useState(false);
  const playbackThreshold = lerp(55, 95, easeInOutCubic(phaseProgress(timeline.progress, 0.18, 0.52)));
  const threshold = manualThreshold ?? playbackThreshold;
  const scene = deriveSecureSetScene(timeline.progress, threshold, permitLegal);
  const controlledTimeline: TimelineController = useMemo(() => ({
    ...timeline,
    replay: () => {
      setManualThreshold(null);
      timeline.replay();
    },
  }), [timeline]);

  const setThreshold = (next: number) => {
    setManualThreshold(next);
    timeline.seek(0.9);
  };
  const setPolicy = (next: string) => {
    setPermitLegal(next === 'permit');
    timeline.seek(0.615);
    timeline.play();
  };

  return (
    <LabShell>
      <ContinuousSlider
        label="相关性阈值 θ"
        value={threshold}
        min={55}
        max={95}
        step={0.1}
        valueText={`${threshold.toFixed(1)}%`}
        onTakeControl={timeline.pause}
        onChange={setThreshold}
      />
      <ChipRow
        labelText="Legal 临时授权"
        options={[{ value: 'deny', label: 'deny' }, { value: 'permit', label: 'permit' }]}
        value={permitLegal ? 'permit' : 'deny'}
        onChange={setPolicy}
      />
      <p className="lab-control-note">
        deny：Legal 文档无权进入授权集合；permit：临时允许它参与交集计算，但仍须达到相关性阈值。
      </p>
      <LabCanvas
        height={286}
        labelText="文档先形成相关集合，再与授权集合求交集"
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          ctx.globalAlpha = 0.15;
          ctx.fillStyle = C.orange;
          ctx.beginPath();
          ctx.arc(226, 146, 106, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = C.purple;
          ctx.beginPath();
          ctx.arc(334, 146, 106, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.orange;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(226, 146, 106, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = C.purple;
          ctx.beginPath();
          ctx.arc(334, 146, 106, 0, Math.PI * 2);
          ctx.stroke();
          label(ctx, `相关 ≥ ${scene.threshold.toFixed(1)}%`, 176, 28, C.orange, 13);
          label(ctx, 'P(u,d)=permit', 384, 28, C.purple, 13);

          scene.documents.forEach((document) => {
            const color = document.secure ? C.green : document.relevant ? C.orange : document.authorized ? C.purple : C.muted;
            const documentWidth = document.id === 'legal-contract' ? 124 : 86;
            box(ctx, document.x - documentWidth / 2, document.y - 13, documentWidth, 27, C.white, color, document.secure ? 4 : 2);
            label(ctx, document.displayLabel, document.x, document.y, C.ink, 10);
          });

          box(ctx, 226, 244, 108, 28, '#eef9f3', C.green, 3);
          label(ctx, `安全结果 ${scene.secureIds.length}`, 280, 258, C.green, 11);
          label(ctx, scene.phase === 'relevance-hold' ? '相关集合已形成，授权尚未应用' : scene.phase === 'authorize' ? '拒绝项正移出交集' : '只有绿色交集可以进入上下文', 280, 225, C.muted, 11);
        }}
      />
      <div className="lab-stat-strip">
        <span className="lab-stat">相关集合 {scene.relevantIds.length}</span>
        <span className="lab-stat">授权集合 {scene.authorizedIds.length}</span>
        <span className="lab-stat safe">安全交集 {scene.secureIds.length}</span>
      </div>
      <TimelineControls timeline={controlledTimeline} phases={phases} label="安全结果集演示" />
      <Feedback tone="good">
        提高 θ 只改变相关集合，不能授予权限；最终上下文始终取 R(q) ∩ A(u)，被拒绝的文档不会进入绿色交集。
      </Feedback>
    </LabShell>
  );
}
