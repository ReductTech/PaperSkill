import { useState } from 'react';
import { TimelineControls } from '../animation/TimelineControls';
import { clamp01, easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import type { TimelinePhase } from '../animation/types';
import { SHARED_INFERENCE_SCENARIO, type Tenant } from './evidence/scenarios';
import { ChipRow, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

export type InferenceTopology = 'isolated' | 'shared';
export type SharedInferencePhase = 'separate' | 'authorize' | 'envelopes' | 'converge' | 'cost' | 'boundary';

export interface SharedContextEnvelope {
  tenant: Tenant;
  owner: Tenant;
  mixed: false;
  visible: boolean;
  opacity: number;
  x: number;
  y: number;
}

export interface SharedInferenceScene {
  progress: number;
  topology: InferenceTopology;
  phase: SharedInferencePhase;
  modelInstanceCount: number;
  costLabel: 'O(N × M)' | 'O(M)';
  contexts: SharedContextEnvelope[];
  contextIsolation: true;
  parametricIsolation: false;
  boundaryText: string;
  gateProgress: number;
  convergenceProgress: number;
  boundaryProgress: number;
}

export const SHARED_INFERENCE_LAYOUT = {
  rows: {
    Finance: 70,
    Engineering: 132,
    Legal: 194,
  },
  gate: {
    left: 164,
    width: 34,
    height: 34,
  },
  envelope: {
    width: 110,
    height: 26,
    entryCenterX: 260,
    stageCenterX: 270,
    endpointCenterX: 378,
  },
  sharedTargetY: {
    Finance: 104,
    Engineering: 132,
    Legal: 160,
  },
  model: {
    left: 448,
    width: 88,
    minimumGap: 12,
  },
} as const;

const tenantY: Record<Tenant, number> = SHARED_INFERENCE_LAYOUT.rows;

const tenantColor: Record<Tenant, string> = {
  Finance: C.blue,
  Engineering: C.orange,
  Legal: C.purple,
};

export function deriveSharedInferenceScene(
  progress: number,
  topology: InferenceTopology,
): SharedInferenceScene {
  const p = clamp01(progress);
  const phase: SharedInferencePhase = p < 0.18
    ? 'separate'
    : p < 0.36
      ? 'authorize'
      : p < 0.54
        ? 'envelopes'
        : p < 0.74
          ? 'converge'
          : p < 0.88
            ? 'cost'
            : 'boundary';
  const gateProgress = easeInOutCubic(phaseProgress(p, 0.18, 0.36));
  const envelopeProgress = easeInOutCubic(phaseProgress(p, 0.36, 0.54));
  const convergenceProgress = easeInOutCubic(phaseProgress(p, 0.54, 0.74));
  const boundaryProgress = easeInOutCubic(phaseProgress(p, 0.88, 1));
  const contexts = SHARED_INFERENCE_SCENARIO.tenants.map((tenant): SharedContextEnvelope => ({
    tenant,
    owner: tenant,
    mixed: false,
    visible: p >= 0.36,
    opacity: envelopeProgress,
    x: lerp(
      lerp(
        SHARED_INFERENCE_LAYOUT.envelope.entryCenterX,
        SHARED_INFERENCE_LAYOUT.envelope.stageCenterX,
        envelopeProgress,
      ),
      SHARED_INFERENCE_LAYOUT.envelope.endpointCenterX,
      convergenceProgress,
    ),
    y: topology === 'shared'
      ? lerp(tenantY[tenant], SHARED_INFERENCE_LAYOUT.sharedTargetY[tenant], convergenceProgress)
      : tenantY[tenant],
  }));

  return {
    progress: p,
    topology,
    phase,
    modelInstanceCount: topology === 'shared' && p >= 0.74 ? 1 : 3,
    costLabel: topology === 'shared' && p >= 0.74 ? 'O(M)' : 'O(N × M)',
    contexts,
    contextIsolation: true,
    parametricIsolation: false,
    boundaryText: 'A3 边界：授权上下文保持隔离，但不保护模型参数记忆。',
    gateProgress,
    convergenceProgress,
    boundaryProgress,
  };
}

export function deriveSharedModelTransition(convergenceProgress: number) {
  const progress = clamp01(convergenceProgress);
  return {
    separateOpacity: 1 - easeInOutCubic(phaseProgress(progress, 0, 0.48)),
    sharedOpacity: easeInOutCubic(phaseProgress(progress, 0.52, 1)),
  };
}

const phases: TimelinePhase[] = [
  { id: 'separate', label: '每租户模型', start: 0, end: 0.18 },
  { id: 'authorize', label: '授权门', start: 0.18, end: 0.36 },
  { id: 'envelopes', label: '上下文信封', start: 0.36, end: 0.54 },
  { id: 'converge', label: '共享端点', start: 0.54, end: 0.74 },
  { id: 'cost', label: '部署拓扑', start: 0.74, end: 0.88 },
  { id: 'boundary', label: 'A3 边界', start: 0.88, end: 1 },
];

const phaseLabel: Record<SharedInferencePhase, string> = {
  separate: '① 三个租户各自部署模型',
  authorize: '② 每条路径先通过授权门',
  envelopes: '③ 形成带租户标签的上下文信封',
  converge: '④ 信封收束到共享推理端点',
  cost: '⑤ 模型拓扑从 O(N × M) 降到 O(M)',
  boundary: '⑥ A3 只保证上下文隔离',
};

export function SharedInferenceLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(5_400, 1.5);
  const [topology, setTopology] = useState<InferenceTopology>('shared');
  const scene = deriveSharedInferenceScene(timeline.progress, topology);
  const modelTransition = deriveSharedModelTransition(scene.convergenceProgress);
  const switchTopology = (next: string) => {
    timeline.pause();
    setTopology(next as InferenceTopology);
  };

  return (
    <LabShell>
      <ChipRow
        labelText="推理部署拓扑"
        options={[
          { value: 'isolated', label: '每租户模型' },
          { value: 'shared', label: '共享推理' },
        ]}
        value={topology}
        onChange={switchTopology}
      />
      <LabCanvas
        height={310}
        labelText={`${phaseLabel[scene.phase]}；三份上下文始终保留租户归属；${scene.boundaryText}`}
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          label(ctx, phaseLabel[scene.phase], 280, 19, scene.phase === 'boundary' ? C.orange : C.blue, 13);
          label(ctx, '租户数据', 64, 39, C.muted, 10);
          label(ctx, '策略门', 181, 39, C.muted, 10);
          label(ctx, '授权上下文', 305, 39, C.muted, 10);
          label(ctx, '模型拓扑', 490, 39, C.muted, 10);

          SHARED_INFERENCE_SCENARIO.tenants.forEach((tenant) => {
            const y = tenantY[tenant];
            ctx.save();
            ctx.globalAlpha = 0.35;
            arrow(ctx, 105, y, SHARED_INFERENCE_LAYOUT.model.left - 10, y, C.line, 2);
            ctx.restore();
            box(ctx, 16, y - 20, 90, 40, C.white, tenantColor[tenant], 2);
            label(ctx, tenant, 61, y, tenantColor[tenant], tenant === 'Engineering' ? 9 : 11);

            ctx.save();
            ctx.globalAlpha = 0.25 + scene.gateProgress * 0.75;
            box(
              ctx,
              SHARED_INFERENCE_LAYOUT.gate.left,
              y - SHARED_INFERENCE_LAYOUT.gate.height / 2,
              SHARED_INFERENCE_LAYOUT.gate.width,
              SHARED_INFERENCE_LAYOUT.gate.height,
              scene.gateProgress > 0.8 ? '#eef9f3' : C.white,
              C.green,
              2,
            );
            label(
              ctx,
              scene.gateProgress > 0.8 ? '✓' : 'P',
              SHARED_INFERENCE_LAYOUT.gate.left + SHARED_INFERENCE_LAYOUT.gate.width / 2,
              y,
              C.green,
              13,
            );
            ctx.restore();
          });

          if (topology === 'isolated') {
            SHARED_INFERENCE_SCENARIO.tenants.forEach((tenant) => {
              const y = tenantY[tenant];
              box(
                ctx,
                SHARED_INFERENCE_LAYOUT.model.left,
                y - 21,
                SHARED_INFERENCE_LAYOUT.model.width,
                42,
                C.white,
                tenantColor[tenant],
                2,
              );
              label(ctx, `${tenant === 'Engineering' ? 'Eng.' : tenant} 模型`, 492, y, tenantColor[tenant], 10);
            });
          } else {
            if (modelTransition.separateOpacity > 0.02) {
              SHARED_INFERENCE_SCENARIO.tenants.forEach((tenant) => {
                ctx.save();
                ctx.globalAlpha = modelTransition.separateOpacity * 0.58;
                box(
                  ctx,
                  SHARED_INFERENCE_LAYOUT.model.left,
                  tenantY[tenant] - 18,
                  SHARED_INFERENCE_LAYOUT.model.width,
                  36,
                  C.white,
                  C.line,
                  2,
                );
                label(ctx, '模型', 492, tenantY[tenant], C.muted, 10);
                ctx.restore();
              });
            }
            if (modelTransition.sharedOpacity > 0.02) {
              ctx.save();
              ctx.globalAlpha = modelTransition.sharedOpacity;
              box(
                ctx,
                SHARED_INFERENCE_LAYOUT.model.left,
                99,
                SHARED_INFERENCE_LAYOUT.model.width,
                66,
                '#eef5fb',
                C.blue,
                3,
              );
              label(ctx, '共享模型', 492, 121, C.blue, 12);
              label(ctx, '1 个端点', 492, 145, C.muted, 10);
              ctx.restore();
            }
          }

          scene.contexts.forEach((context) => {
            if (!context.visible) return;
            const color = tenantColor[context.tenant];
            ctx.save();
            ctx.globalAlpha = context.opacity;
            box(
              ctx,
              context.x - SHARED_INFERENCE_LAYOUT.envelope.width / 2,
              context.y - SHARED_INFERENCE_LAYOUT.envelope.height / 2,
              SHARED_INFERENCE_LAYOUT.envelope.width,
              SHARED_INFERENCE_LAYOUT.envelope.height,
              C.white,
              color,
              2,
            );
            label(ctx, `${context.tenant} 信封`, context.x, context.y, color, context.tenant === 'Engineering' ? 9 : 10);
            ctx.restore();
          });

          const boundaryActive = scene.phase === 'boundary';
          box(ctx, 16, 236, 520, 57, boundaryActive ? '#fff8e8' : C.white, boundaryActive ? C.orange : C.line, boundaryActive ? 3 : 1);
          label(ctx, `模型实例：${scene.modelInstanceCount}   部署拓扑：${scene.costLabel}`, 276, 253, topology === 'shared' ? C.green : C.blue, 12);
          label(
            ctx,
            boundaryActive ? scene.boundaryText : '教学拓扑示意；上下文保持租户标签，不是实验性能数据。',
            276,
            276,
            boundaryActive ? C.orange : C.muted,
            boundaryActive ? 11 : 10,
          );
        }}
      />
      <div className="lab-stat-strip">
        <span className="lab-stat">模型实例 {scene.modelInstanceCount}</span>
        <span className="lab-stat safe">隔离上下文 {scene.contexts.length}</span>
        <span className="lab-stat">复杂度 {scene.costLabel}</span>
      </div>
      <TimelineControls timeline={timeline} phases={phases} label="共享推理拓扑演示" />
      <Feedback tone={scene.phase === 'boundary' ? 'warn' : topology === 'shared' ? 'good' : 'info'}>
        {scene.phase === 'boundary'
          ? scene.boundaryText
          : topology === 'shared' && scene.progress < 0.54
            ? '先显示每租户模型的 O(N × M) 基线；播放到收束阶段后，三份授权上下文才会转向共享端点。'
            : topology === 'shared'
              ? '共享的是模型端点，不是租户上下文；每个信封在移动和推理时始终保留自己的 owner。'
            : '每租户复制模型能形成物理分离，但模型部署数量会随租户数 N 和模型数 M 一起增长。'}
      </Feedback>
    </LabShell>
  );
}
