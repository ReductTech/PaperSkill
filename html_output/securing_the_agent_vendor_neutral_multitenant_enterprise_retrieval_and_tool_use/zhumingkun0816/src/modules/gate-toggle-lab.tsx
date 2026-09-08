import { useState } from 'react';
import { useTimeline } from '../animation/useTimeline';
import { clamp01, easeInOutCubic, lerp } from '../animation/easing';
import { ChipRow, Feedback, LabCanvas, LabShell } from './shared/LabChrome';
import { C, arrow, book, box, dot, label } from './shared/canvasDrawing';
import { PAPER_EVIDENCE } from './evidence/paperEvidence';
import type { PaperWidgetProps } from './library-scenes';

type GateMode = 'relevance' | 'authorized';

export const GATE_TOGGLE_LAYOUT = {
  gateX: 300,
  gateY: 62,
  gateWidth: 110,
  gateHeight: 96,
  gateCenterX: 355,
  legalStartX: 252,
  legalStopX: 278,
  financeStartX: 252,
  tokenRadius: 9,
  rejectionMarkX: 291,
  rejectionMarkHalfWidth: 7,
  legalY: 72,
  financeY: 147,
  titleY: 80,
  legalDecisionY: 104,
  financeDecisionY: 128,
} as const;

export interface GateToggleScene {
  gated: boolean;
  progress: number;
  legalX: number;
  financeX: number;
  legalDecision: 'selected' | 'deny';
  financeDecision: 'not-selected' | 'permit';
  legalLabel: '#1 Legal · 已选择' | 'Legal → DENY';
  financeLabel: '#2 Finance · 未选择' | 'Finance → PERMIT';
  financeTokenVisible: boolean;
}

export function deriveGateToggleScene(progress: number, gated: boolean): GateToggleScene {
  const eased = easeInOutCubic(clamp01(progress));
  const layout = GATE_TOGGLE_LAYOUT;
  return {
    gated,
    progress: eased,
    legalX: gated
      ? lerp(layout.legalStartX, layout.legalStopX, eased)
      : lerp(layout.legalStartX, 470, eased),
    financeX: gated
      ? lerp(layout.financeStartX, 470, eased)
      : lerp(layout.financeStartX, 392, eased),
    legalDecision: gated ? 'deny' : 'selected',
    financeDecision: gated ? 'permit' : 'not-selected',
    legalLabel: gated ? 'Legal → DENY' : '#1 Legal · 已选择',
    financeLabel: gated ? 'Finance → PERMIT' : '#2 Finance · 未选择',
    financeTokenVisible: gated,
  };
}

export function GateToggleLab(_props: PaperWidgetProps) {
  const timeline = useTimeline(700);
  const [mode, setMode] = useState<GateMode>('relevance');
  const progress = timeline.status === 'idle' ? 1 : clamp01(timeline.progress);
  const eased = easeInOutCubic(progress);
  const gated = mode === 'authorized';
  const scene = deriveGateToggleScene(progress, gated);
  const selectMode = (next: string) => {
    setMode(next as GateMode);
    timeline.replay();
  };

  return (
    <LabShell>
      <ChipRow
        labelText="选择规则"
        options={[{ value: 'relevance', label: '仅相关性' }, { value: 'authorized', label: '相关性 ∩ 授权' }]}
        value={mode}
        onChange={selectMode}
      />
      <div className="lab-stat-strip">
        <span className={gated ? 'lab-stat safe' : 'lab-stat danger'}>{gated ? 'CTLR B/D = 0% / 0%' : 'CTLR A/C = 100% / 98%'}</span>
        {gated && <span className="lab-stat">门控搜索开销 ≈ {PAPER_EVIDENCE.gatedSearchOverhead.valueMs} ms</span>}
        <span className="lab-protocol">合成三租户测试床 · CTLR 越低越好</span>
      </div>
      <LabCanvas
        height={230}
        labelText="相同查询在门控前后的上下文差异"
        onOutOfView={timeline.pause}
        draw={(ctx) => {
          const layout = GATE_TOGGLE_LAYOUT;
          label(ctx, gated ? '先求授权交集，再送入模型' : '相似度结果直接进入模型', 280, 24, gated ? C.green : C.red, 13);
          box(ctx, 24, 74, 90, 66, C.white, C.blue, 2);
          label(ctx, 'Finance 查询', 69, 97, C.blue, 11);
          label(ctx, '合同问题', 69, 119, C.muted, 10);

          book(ctx, 164, 46, 88, 52, C.red, 'Legal', true);
          book(ctx, 164, 122, 88, 52, C.green, 'Finance');
          arrow(ctx, 116, 91, 157, 73, gated ? C.orange : C.red, 3);
          arrow(ctx, 116, 123, 157, 147, C.green, 3);

          box(ctx, layout.gateX, layout.gateY, layout.gateWidth, layout.gateHeight, C.white, gated ? C.purple : C.orange, 3);
          label(ctx, gated ? '授权判断' : '相似度排名', layout.gateCenterX, layout.titleY, gated ? C.purple : C.orange, 12);
          label(ctx, scene.legalLabel, layout.gateCenterX, layout.legalDecisionY, C.red, 10);
          label(ctx, scene.financeLabel, layout.gateCenterX, layout.financeDecisionY, gated ? C.green : C.muted, 9);

          box(ctx, 433, 72, 111, 76, gated ? '#eef9f3' : '#fff1f3', gated ? C.green : C.red, 3);
          label(ctx, '模型上下文', 488, 94, C.ink, 11);
          label(ctx, gated ? 'Finance' : 'Legal', 488, 121, gated ? C.green : C.red, 14);

          const legalAlpha = gated ? 1 - Math.max(0, (eased - 0.72) / 0.28) : 1;
          ctx.globalAlpha = legalAlpha;
          dot(ctx, scene.legalX, layout.legalY, layout.tokenRadius, C.red);
          label(ctx, 'L', scene.legalX, layout.legalY, C.white, 9);
          ctx.globalAlpha = 1;
          if (scene.financeTokenVisible) {
            dot(ctx, scene.financeX, layout.financeY, layout.tokenRadius, C.green);
            label(ctx, 'F', scene.financeX, layout.financeY, C.white, 9);
          }

          if (gated && eased > 0.42) {
            const markX = layout.rejectionMarkX;
            ctx.strokeStyle = C.red;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(markX - layout.rejectionMarkHalfWidth, 62);
            ctx.lineTo(markX + layout.rejectionMarkHalfWidth, 82);
            ctx.moveTo(markX + layout.rejectionMarkHalfWidth, 62);
            ctx.lineTo(markX - layout.rejectionMarkHalfWidth, 82);
            ctx.stroke();
            label(ctx, 'DENY', markX, 48, C.red, 9);
          }
          label(ctx, gated ? '安全结果只保留 Finance' : 'Legal 机密已进入上下文', 280, 207, gated ? C.green : C.red, 12);
        }}
      />
      <Feedback tone={gated ? 'good' : 'bad'}>
        {gated
          ? '门控把结果限制在相关性 ∩ 授权集合；配置 B/D 的 CTLR 均为 0%，评估设置中的门控搜索开销约 19 ms。'
          : '仅相关性：最相关的 Legal 文档继续前进；论文配置 A/C 的 CTLR 分别为 100% 和 98%。'}
      </Feedback>
    </LabShell>
  );
}
