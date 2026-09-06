import { useState } from 'react';
import { easeInOutCubic, lerp, phaseProgress } from '../animation/easing';
import { useTimeline } from '../animation/useTimeline';
import { ChipRow, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, box, label } from './shared/canvasDrawing';
import type { PaperWidgetProps } from './library-scenes';

type AdapterSlot = 'inference' | 'vector' | 'deployment';
interface Providers { inference: string; vector: string; deployment: string }

const deploymentLabels: Record<string, string> = {
  shared: '逻辑隔离',
  tenant: '物理隔离',
  hybrid: '混合隔离',
};

export const OGX_ENFORCEMENT_POINTS = [
  'API route middleware',
  'routing table resolution',
  'storage read time',
] as const;

export function deriveOgxProviderScene(progress: number, provider: string) {
  return {
    progress: Math.max(0, Math.min(1, progress)),
    provider,
    nativeFilter: provider !== 'sqlite-vec',
    enforcementPoints: OGX_ENFORCEMENT_POINTS,
  };
}

export function OgxProviderLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(600);
  const [providers, setProviders] = useState<Providers>({ inference: 'vLLM', vector: 'sqlite-vec', deployment: 'shared' });
  const [previous, setPrevious] = useState<Providers>(providers);
  const [changedSlot, setChangedSlot] = useState<AdapterSlot | null>(null);
  const progress = timeline.status === 'idle' ? 1 : timeline.progress;
  const providerScene = deriveOgxProviderScene(progress, providers.vector);
  const pushdown = providerScene.nativeFilter;

  const swap = (slot: AdapterSlot, next: string) => {
    if (providers[slot] === next) return;
    setPrevious(providers);
    setProviders((current) => ({ ...current, [slot]: next }));
    setChangedSlot(slot);
    timeline.replay();
  };

  const displayValue = (slot: AdapterSlot, value: string) => slot === 'deployment' ? deploymentLabels[value] : value;

  return (
    <LabShell>
      <ChipRow labelText="推理提供者" options={['vLLM', 'OpenAI', 'Ollama'].map((value) => ({ value, label: value }))} value={providers.inference} onChange={(next) => swap('inference', next)} />
      <ChipRow labelText="向量库" options={['sqlite-vec', 'pgvector', 'Qdrant'].map((value) => ({ value, label: value }))} value={providers.vector} onChange={(next) => swap('vector', next)} />
      <ChipRow labelText="部署拓扑" options={[{ value: 'shared', label: '共享实例' }, { value: 'tenant', label: '每租户实例' }, { value: 'hybrid', label: '混合' }]} value={providers.deployment} onChange={(next) => swap('deployment', next)} />
      <LabCanvas
        height={294}
        labelText="OGX 的 API、三个授权执行位置和策略语义保持固定，只有被选择的提供者适配器移动"
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          box(ctx, 60, 12, 440, 40, '#eef3fb', C.blue, 3);
          label(ctx, 'OpenAI-compatible Agent API', 280, 32, C.blue, 13);
          label(ctx, '三个授权执行位置（保持不动）', 280, 67, C.muted, 10);
          const rail = [
            { x: 118, label: 'API 中间件' },
            { x: 280, label: '路由解析' },
            { x: 442, label: '存储读取' },
          ];
          rail.forEach((point, index) => {
            box(ctx, point.x - 50, 79, 100, 34, '#f5f3ff', C.purple, 2);
            label(ctx, point.label, point.x, 96, C.purple, 10);
            if (index < rail.length - 1) arrow(ctx, point.x + 52, 96, rail[index + 1].x - 53, 96, C.purple, 2);
          });
          label(ctx, '统一身份 · ABAC 策略 · 服务端编排', 280, 133, C.purple, 11);

          const slots: Array<{ key: AdapterSlot; x: number; title: string }> = [
            { key: 'inference', x: 35, title: 'Inference' },
            { key: 'vector', x: 208, title: 'Vector' },
            { key: 'deployment', x: 381, title: 'Deploy' },
          ];
          slots.forEach((slot) => {
            const selected = changedSlot === slot.key;
            const accent = slot.key === 'vector' && pushdown ? C.green : C.blue;
            arrow(ctx, slot.x + 72, 143, slot.x + 72, 162, accent, 2);
            box(ctx, slot.x + 7, 163, 130, 12, '#f8fafc', selected ? C.orange : C.line, 2);

            const drawAdapter = (value: string, y: number, alpha: number, stroke: string) => {
              ctx.globalAlpha = alpha;
              box(ctx, slot.x, y, 144, 58, C.white, stroke, 3);
              label(ctx, slot.title, slot.x + 72, y + 18, C.muted, 10);
              label(ctx, displayValue(slot.key, value), slot.x + 72, y + 39, stroke, 12);
              ctx.globalAlpha = 1;
            };

            if (!selected || timeline.status === 'complete' || timeline.status === 'idle') {
              drawAdapter(providers[slot.key], 179, 1, accent);
              return;
            }
            const unplug = easeInOutCubic(phaseProgress(progress, 0, 0.38));
            const insert = easeInOutCubic(phaseProgress(progress, 0.38, 1));
            drawAdapter(previous[slot.key], lerp(179, 221, unplug), 1 - unplug, C.muted);
            drawAdapter(providers[slot.key], lerp(221, 179, insert), insert, accent);
          });
          label(ctx, changedSlot && timeline.status === 'playing' ? '仅选中适配器移动；API、策略与授权位置保持静止' : '接口、策略与三个授权执行位置稳定，提供者可以替换', 280, 270, changedSlot ? C.orange : C.muted, 10);
        }}
      />
      <div className="lab-stat-strip">
        <span className="lab-stat">{providers.inference}</span>
        <span className={pushdown ? 'lab-stat safe' : 'lab-stat danger'}>{pushdown ? '支持原生过滤' : '论文实验：后过滤'}</span>
        <span className="lab-stat">{deploymentLabels[providers.deployment]}</span>
      </div>
      <Feedback tone={pushdown ? 'good' : 'warn'}>
        {pushdown
          ? `${providers.vector} 支持原生过滤，可承载谓词下推；这不表示它与其他后端性能相同，仍需单独基准测试。`
          : 'sqlite-vec 在论文实验中使用后过滤：隔离安全仍成立，但大规模 Recall 会下降。'}
      </Feedback>
    </LabShell>
  );
}
