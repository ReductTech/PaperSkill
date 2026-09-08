import { useState } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { ChipRow, Feedback, LabCanvas, LabShell, type Tone } from './shared/LabChrome';
import { C, arrow, box, dot, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type PolicyMode = 'owner' | 'team' | 'deny';
export type PolicyDecision = 'permit' | 'deny' | 'pending';
export type AbacPhase = 'request' | 'resource-eval' | 'resource-hold' | 'search' | 'chunk-eval' | 'chunk-hold' | 'context' | 'inference' | 'denied-before-search';

export interface AbacChunkScene {
  id: string;
  decision: PolicyDecision;
  targetDecision: Exclude<PolicyDecision, 'pending'>;
  filterProgress: number;
  destinationProgress: number;
  destination: 'context' | 'rejected' | 'waiting';
}

export interface AbacScene {
  phase: AbacPhase;
  resourceDecision: PolicyDecision;
  resourceRule: string;
  chunkDecisions: PolicyDecision[];
  chunks: AbacChunkScene[];
  searchActive: boolean;
  inferenceActive: boolean;
  contextChunkCount: number;
  returnedChunkCount: number;
  passedChunkCount: number;
  rejectedChunkCount: number;
  downstreamLocked: boolean;
  requestProgress: number;
  resourceEvaluationProgress: number;
  gateOpenProgress: number;
  searchReveal: number;
  chunkFilterProgress: number;
  contextAssemblyProgress: number;
  inferenceProgress: number;
}

export function deriveAbacScene(progress: number, mode: PolicyMode): AbacScene {
  const p = clamp01(progress);
  const resourcePass = mode !== 'deny';
  const resourceDecision: PolicyDecision = p < 0.26 ? 'pending' : resourcePass ? 'permit' : 'deny';
  const downstreamLocked = !resourcePass && p >= 0.26;
  const phase: AbacPhase = downstreamLocked
    ? 'denied-before-search'
    : p < 0.14
    ? 'request'
    : p < 0.26
      ? 'resource-eval'
      : p < 0.35
        ? 'resource-hold'
        : p < 0.5
          ? 'search'
          : p < 0.62
            ? 'chunk-eval'
            : p < 0.71
              ? 'chunk-hold'
              : p < 0.86
                ? 'context'
                : 'inference';
  const targetDecisions: Exclude<PolicyDecision, 'pending'>[] = mode === 'owner'
    ? ['permit', 'permit', 'permit', 'permit']
    : mode === 'team'
      ? ['permit', 'deny', 'permit', 'deny']
      : ['deny', 'deny', 'deny', 'deny'];
  const requestProgress = easeInOutCubic(phaseProgress(p, 0, 0.14));
  const resourceEvaluationProgress = easeInOutCubic(phaseProgress(p, 0.14, 0.26));
  const gateOpenProgress = resourcePass ? easeInOutCubic(phaseProgress(p, 0.26, 0.35)) : 0;
  const searchReveal = resourcePass ? easeInOutCubic(phaseProgress(p, 0.35, 0.5)) : 0;
  const chunkFilterProgress = resourcePass ? phaseProgress(p, 0.5, 0.62) : 0;
  const contextAssemblyProgress = resourcePass ? easeInOutCubic(phaseProgress(p, 0.71, 0.86)) : 0;
  const inferenceProgress = resourcePass ? easeInOutCubic(phaseProgress(p, 0.86, 1)) : 0;
  const returnedChunkCount = downstreamLocked || searchReveal <= 0 ? 0 : Math.min(4, Math.ceil(searchReveal * 4));

  const chunks: AbacChunkScene[] = targetDecisions.map((targetDecision, index) => {
    const staggered = returnedChunkCount > index
      ? easeInOutCubic(clamp01((chunkFilterProgress - index * 0.17) / 0.49))
      : 0;
    const decision: PolicyDecision = staggered >= 0.55 ? targetDecision : 'pending';
    return {
      id: `chunk-${index + 1}`,
      decision,
      targetDecision,
      filterProgress: staggered,
      destinationProgress: decision === 'pending' ? 0 : contextAssemblyProgress,
      destination: decision === 'pending' ? 'waiting' : targetDecision === 'permit' ? 'context' : 'rejected',
    };
  });
  const chunkDecisions = chunks.map((chunk) => chunk.decision);
  const passedChunkCount = chunkDecisions.filter((decision) => decision === 'permit').length;
  const rejectedChunkCount = chunkDecisions.filter((decision) => decision === 'deny').length;
  const finalPassedCount = targetDecisions.filter((decision) => decision === 'permit').length;
  const contextChunkCount = p >= 0.71 && resourcePass ? finalPassedCount : 0;

  return {
    phase,
    resourceDecision,
    resourceRule: mode === 'owner'
      ? 'user.tenant = resource.owner'
      : mode === 'team'
        ? 'project:Apollo ∈ resource.teams'
        : 'user.tenant ≠ resource.owner',
    chunkDecisions,
    chunks,
    searchActive: resourcePass && searchReveal > 0,
    inferenceActive: resourcePass && p >= 0.86 && contextChunkCount > 0,
    contextChunkCount,
    returnedChunkCount,
    passedChunkCount,
    rejectedChunkCount,
    downstreamLocked,
    requestProgress,
    resourceEvaluationProgress,
    gateOpenProgress,
    searchReveal,
    chunkFilterProgress,
    contextAssemblyProgress,
    inferenceProgress,
  };
}

const phases = [
  { id: 'request', label: '请求', start: 0, end: 0.14 },
  { id: 'resource', label: '资源级 ABAC', start: 0.14, end: 0.35 },
  { id: 'search', label: '搜索', start: 0.35, end: 0.5 },
  { id: 'chunk', label: 'chunk 级过滤', start: 0.5, end: 0.71 },
  { id: 'context', label: '上下文', start: 0.71, end: 0.86 },
  { id: 'inference', label: '推理', start: 0.86, end: 1 },
];

export function AbacPolicyLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(5_000);
  const [mode, setMode] = useState<PolicyMode>('deny');
  const scene = deriveAbacScene(timeline.progress, mode);
  const tone: Tone = scene.resourceDecision === 'deny'
    ? 'bad'
    : scene.inferenceActive
      ? 'good'
      : scene.rejectedChunkCount > 0
        ? 'warn'
        : 'info';
  const resourceValue = mode === 'owner'
    ? 'owner:Finance'
    : mode === 'team'
      ? 'team:Finance · mixed chunks'
      : 'owner:Legal';

  const selectMode = (next: string) => {
    setMode(next as PolicyMode);
    timeline.replay();
  };

  return (
    <LabShell>
      <div className="attribute-line">
        <span>用户</span><b>Finance analyst · project:Apollo</b>
        <span>资源</span><b>{resourceValue}</b>
      </div>
      <ChipRow
        labelText="策略预设"
        options={[{ value: 'owner', label: '所有者匹配' }, { value: 'team', label: '团队匹配' }, { value: 'deny', label: '默认拒绝' }]}
        value={mode}
        onChange={selectMode}
      />
      <LabCanvas
        height={360}
        labelText={`两级检索门控：资源级 ${scene.resourceDecision}；搜索返回 ${scene.returnedChunkCount} 个 chunk；chunk 级允许 ${scene.passedChunkCount} 个、拒绝 ${scene.rejectedChunkCount} 个；上下文 ${scene.contextChunkCount} 个。`}
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          const resourceColor = scene.resourceDecision === 'deny'
            ? C.red
            : scene.resourceDecision === 'permit'
              ? C.green
              : scene.resourceEvaluationProgress > 0
                ? C.orange
                : C.purple;
          const resourceStatus = scene.resourceDecision === 'pending'
            ? `CHECK ${Math.round(scene.resourceEvaluationProgress * 100)}%`
            : scene.resourceDecision.toUpperCase();

          label(ctx, '① 资源级决策室 · 搜索前', 140, 20, C.purple, 12);
          label(ctx, '② chunk 筛选台 · 检索后', 420, 20, C.blue, 12);
          ctx.save();
          ctx.setLineDash([5, 6]);
          ctx.strokeStyle = C.line;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(280, 38);
          ctx.lineTo(280, 340);
          ctx.stroke();
          ctx.restore();

          box(ctx, 18, 45, 112, 58, C.white, C.blue, 2);
          label(ctx, '用户属性', 74, 60, C.blue, 10);
          label(ctx, 'tenant:Finance', 74, 79, C.ink, 10);
          label(ctx, 'project:Apollo', 74, 94, C.muted, 9);

          box(ctx, 18, 122, 112, 58, C.white, C.purple, 2);
          label(ctx, '资源属性', 74, 137, C.purple, 10);
          label(ctx, mode === 'team' ? 'team:Finance' : resourceValue, 74, 157, C.ink, mode === 'team' ? 10 : 9);
          if (mode === 'team') label(ctx, 'mixed chunks', 74, 171, C.muted, 8);

          arrow(ctx, 132, 74, 171, 101, C.line, 2);
          arrow(ctx, 132, 151, 171, 124, C.line, 2);
          if (scene.requestProgress < 1) {
            ctx.save();
            ctx.globalAlpha = Math.max(0.2, 1 - scene.requestProgress * 0.75);
            dot(ctx, lerp(136, 171, scene.requestProgress), lerp(74, 101, scene.requestProgress), 6, C.blue);
            label(ctx, 'U', lerp(136, 171, scene.requestProgress), lerp(74, 101, scene.requestProgress), C.white, 7);
            dot(ctx, lerp(136, 171, scene.requestProgress), lerp(151, 124, scene.requestProgress), 6, C.purple);
            label(ctx, 'R', lerp(136, 171, scene.requestProgress), lerp(151, 124, scene.requestProgress), C.white, 7);
            ctx.restore();
          }

          box(ctx, 171, 57, 88, 112, C.white, resourceColor, scene.resourceDecision === 'pending' ? 2 : 4);
          label(ctx, '资源级 ABAC', 215, 75, resourceColor, 10);
          box(ctx, 188, 89, 54, 42, '#f6f8fc', resourceColor, 2);
          const doorShift = scene.gateOpenProgress * 11;
          ctx.fillStyle = resourceColor;
          ctx.fillRect(193 - doorShift, 95, 20, 30);
          ctx.fillRect(217 + doorShift, 95, 20, 30);
          if (scene.resourceDecision === 'deny') {
            ctx.strokeStyle = C.white;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(202, 103);
            ctx.lineTo(228, 117);
            ctx.moveTo(228, 103);
            ctx.lineTo(202, 117);
            ctx.stroke();
          }
          label(ctx, resourceStatus, 215, 148, resourceColor, 10);

          box(ctx, 20, 198, 240, 54, '#f8fafc', resourceColor, 2);
          label(ctx, scene.resourceRule, 140, 215, C.ink, 10);
          label(
            ctx,
            scene.resourceDecision === 'deny'
              ? '资源级 DENY · 在搜索前终止'
              : scene.resourceDecision === 'permit'
                ? '资源级 PERMIT · 搜索可以启动'
                : '同时比较用户与资源属性',
            140,
            238,
            resourceColor,
            10,
          );

          if (scene.resourceDecision === 'permit') {
            arrow(ctx, 260, 113, 305, 113, C.green, 3);
            if (scene.searchReveal > 0 && scene.searchReveal < 1) {
              const queryX = lerp(269, 301, scene.searchReveal);
              dot(ctx, queryX, 113, 8, C.blue);
              label(ctx, 'Q', queryX, 113, C.white, 8);
            }
          } else if (scene.resourceDecision === 'deny') {
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(268, 98);
            ctx.lineTo(268, 128);
            ctx.stroke();
            label(ctx, 'STOP', 268, 143, C.red, 8);
          }

          if (scene.downstreamLocked) {
            box(ctx, 301, 48, 238, 282, '#fff7f8', C.red, 2);
            label(ctx, '第一道门已关闭', 420, 94, C.red, 13);
            box(ctx, 349, 118, 142, 82, C.white, C.red, 3);
            label(ctx, '搜索未启动', 420, 143, C.red, 16);
            label(ctx, '0 chunks', 420, 174, C.muted, 11);
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(369, 215);
            ctx.lineTo(471, 273);
            ctx.stroke();
            label(ctx, '无检索结果', 362, 246, C.muted, 10);
            label(ctx, '无授权上下文', 476, 246, C.muted, 10);
            label(ctx, '推理保持关闭', 420, 306, C.red, 12);
          } else {
            box(ctx, 306, 43, 226, 82, '#f8fafc', scene.searchActive ? C.blue : C.line, scene.searchActive ? 3 : 2);
            label(ctx, '向量搜索', 419, 59, scene.searchActive ? C.blue : C.muted, 11);
            label(ctx, scene.searchActive ? `依次返回 ${scene.returnedChunkCount}/4 chunks` : '等待第一级 PERMIT', 419, 77, C.muted, 9);

            const chunkStartX = [333, 390, 447, 504];
            const permitTargets = [420, 448, 476, 504];
            const rejectTargets = [326, 366];
            let permitIndex = 0;
            let rejectIndex = 0;

            box(ctx, 306, 228, 82, 50, '#fff7f8', scene.rejectedChunkCount > 0 ? C.red : C.line, 2);
            label(ctx, `拒绝区 ${scene.rejectedChunkCount}`, 347, 240, scene.rejectedChunkCount > 0 ? C.red : C.muted, 9);
            box(ctx, 404, 228, 128, 50, '#eef9f3', scene.passedChunkCount > 0 ? C.green : C.line, 2);
            label(ctx, `授权上下文 ${scene.passedChunkCount}/4`, 468, 240, scene.passedChunkCount > 0 ? C.green : C.muted, 9);
            label(ctx, '四个 chunk 独立判定', 419, 144, C.muted, 10);

            scene.chunks.forEach((chunk, index) => {
              const startX = chunkStartX[index];
              const reveal = clamp01(scene.searchReveal * 4 - index);
              ctx.save();
              ctx.globalAlpha = 0.18;
              box(ctx, startX - 13, 89, 26, 24, '#f6f8fc', C.line, 1);
              ctx.restore();

              const decisionColor = chunk.decision === 'permit'
                ? C.green
                : chunk.decision === 'deny'
                  ? C.red
                  : chunk.filterProgress > 0
                    ? C.orange
                    : C.line;
              box(ctx, startX - 16, 164, 32, 34, C.white, decisionColor, chunk.decision === 'pending' ? 2 : 3);
              label(ctx, chunk.decision === 'permit' ? 'P' : chunk.decision === 'deny' ? 'D' : '·', startX, 207, decisionColor, 9);

              if (reveal > 0) {
                let destinationX = startX;
                if (chunk.targetDecision === 'permit') {
                  destinationX = permitTargets[permitIndex];
                  permitIndex += 1;
                } else {
                  destinationX = rejectTargets[rejectIndex] ?? rejectTargets[rejectTargets.length - 1];
                  rejectIndex += 1;
                }
                const filterY = lerp(101, 181, chunk.filterProgress);
                const chunkX = lerp(startX, destinationX, chunk.destinationProgress);
                const chunkY = lerp(filterY, 260, chunk.destinationProgress);
                ctx.save();
                ctx.globalAlpha = reveal;
                const chunkColor = chunk.decision === 'permit'
                  ? C.green
                  : chunk.decision === 'deny'
                    ? C.red
                    : C.blue;
                box(ctx, chunkX - 12, chunkY - 11, 24, 22, C.white, chunkColor, 3);
                label(ctx, `${index + 1}`, chunkX, chunkY, chunkColor, 9);
                ctx.restore();
              }
            });

            arrow(ctx, 468, 280, 468, 299, scene.inferenceProgress > 0 ? C.green : C.line, scene.inferenceProgress > 0 ? 3 : 2);
            if (scene.inferenceProgress > 0) {
              dot(ctx, 468, lerp(284, 298, scene.inferenceProgress), 6, C.green);
            }
            box(ctx, 414, 302, 108, 40, scene.inferenceActive ? '#eef9f3' : '#f6f8fc', scene.inferenceActive ? C.green : C.line, scene.inferenceActive ? 3 : 2);
            label(ctx, '模型推理', 468, 315, scene.inferenceActive ? C.green : C.muted, 11);
            label(ctx, scene.inferenceActive ? '仅接收授权上下文' : '等待上下文', 468, 332, C.muted, 8);
          }
        }}
      />
      <div className="lab-stat-strip">
        <span className={`lab-stat ${scene.resourceDecision === 'deny' ? 'danger' : scene.resourceDecision === 'permit' ? 'safe' : ''}`}>
          第一级 {scene.resourceDecision === 'pending' ? '检查中' : scene.resourceDecision.toUpperCase()}
        </span>
        <span className="lab-stat">搜索 {scene.downstreamLocked ? '未启动' : scene.searchActive ? `${scene.returnedChunkCount}/4 chunks` : '等待'}</span>
        <span className={`lab-stat ${scene.rejectedChunkCount > 0 ? 'danger' : scene.passedChunkCount > 0 ? 'safe' : ''}`}>
          第二级 {scene.returnedChunkCount > 0 ? `${scene.passedChunkCount} PERMIT · ${scene.rejectedChunkCount} DENY` : '未执行'}
        </span>
        <span className="lab-stat safe">授权上下文 {scene.contextChunkCount}/4</span>
      </div>
      <TimelineControls timeline={timeline} phases={phases} label="两级检索门控状态机" />
      <Feedback tone={tone}>
        {scene.phase === 'denied-before-search'
          ? '资源级 DENY：第一道门直接关闭，右侧搜索、chunk 过滤、上下文与推理都不会启动。'
          : scene.inferenceActive
            ? `资源级 PERMIT 只允许启动搜索；第二级逐项筛选后，${scene.passedChunkCount}/4 个 chunk 进入授权上下文，${scene.rejectedChunkCount}/4 个被丢弃。`
            : scene.phase === 'chunk-eval' || scene.phase === 'chunk-hold'
              ? '搜索已返回 4 个 chunk；第二道门正在逐项判断，每个 chunk 都可能得到不同结果。'
              : scene.resourceDecision === 'permit'
                ? '第一道门已打开，搜索开始；返回结果还必须逐个通过第二道门。'
                : '用户属性与资源属性先在第一道门汇合；只有资源级 PERMIT 才会启动搜索。'}
      </Feedback>
    </LabShell>
  );
}
