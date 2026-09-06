import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvasScene, C, MW, MH, FONT, text, fillRound, line, arrow, legend } from './kit';

/* ============================================================================
   ClawGUI-RL 的训练闭环（论文 Figure 2 的结构）

   任务 → Rollout 管理器 → 环境层（虚拟环境 / 真实设备）→ 轨迹
        → 奖励管理器（PRM）→ RL 训练器（GiGPO）──「更新模型」──▶ 回到 Rollout

   点「下一步 ▸」逐个点亮：蓝＝当前节点，绿＝已走过，灰＝还没到。
   GiGPO 来自 Feng et al. 2025b，本文是集成而非提出。
   ============================================================================ */

const TOTAL_STEPS = 7;

interface Node {
  title: string;
  sub: string;
  x: number;
  y: number;
}

const NW = 150;
const NH = 54;
const ROW1 = 38;
const ROW2 = 134;

/** 蛇形排列：上排从左到右，下排从右到左，最后一条虚线回流到 Rollout 管理器 */
const NODES: Node[] = [
  { title: '任务 Task', sub: '一条自然语言指令', x: 20, y: ROW1 },
  { title: 'Rollout 管理器', sub: '分发到环境池 · 64 并行', x: 205, y: ROW1 },
  { title: '环境层', sub: '虚拟环境 / 真实设备', x: 390, y: ROW1 },
  { title: '轨迹 Trajectory', sub: '截图 + 动作序列', x: 390, y: ROW2 },
  { title: '奖励管理器 PRM', sub: '结果奖励 + 逐步奖励', x: 205, y: ROW2 },
  { title: 'RL 训练器', sub: 'GiGPO · 非本文提出', x: 20, y: ROW2 },
];

const PILLS = ['任务', 'Rollout', '环境层', '轨迹', '奖励', '训练器', '闭环'];

/** 每一步的职责说明，索引 0 对应「还没开始」 */
const STEP_FB: { text: string; cls: string }[] = [
  { text: '点「下一步 ▸」，跟着走一遍 ClawGUI-RL 的训练闭环，看看这七块各自负责什么。', cls: '' },
  { text: '任务：一条自然语言指令，比如「把这条消息转发给张三」。', cls: '' },
  { text: 'Rollout 管理器：把任务分发到环境池，同时管着 64 个并行环境。', cls: '' },
  {
    text: '环境层：虚拟安卓环境与真实手机藏在同一套接口后，训练循环里可互换（这是首个验证过真机在线训练的开源基建）。',
    cls: '',
  },
  { text: '轨迹：智能体一步步操作留下的截图与动作序列。', cls: '' },
  { text: '奖励管理器：结果奖励 + PRM 逐步奖励，把稀疏信号变稠密。', cls: '' },
  {
    text: 'RL 训练器：集成现成的 GiGPO（Feng et al. 2025b，非本文提出），算出每步优势后更新模型。',
    cls: '',
  },
  {
    text: '闭环完成：更新后的模型回到环境里继续试错，这就是在线 RL。这就是 ClawGUI-RL 的完整闭环：环境、奖励、训练器三块都开源，且虚拟环境与真机走同一套接口。',
    cls: 'good',
  },
];

type NState = 'done' | 'now' | 'todo';

function nstate(i: number, step: number): NState {
  if (step >= TOTAL_STEPS) return 'done';
  if (step === 0) return 'todo';
  if (i < step - 1) return 'done';
  if (i === step - 1) return 'now';
  return 'todo';
}

function stateColor(st: NState): string {
  return st === 'done' ? C.pass : st === 'now' ? C.guide : C.axis;
}

/** 自动缩字号，保证任何字体回退下都不会撑破节点框 */
function fitSize(ctx: CanvasRenderingContext2D, s: string, maxW: number, base: number): number {
  let sz = base;
  while (sz > 8) {
    ctx.font = `400 ${sz}px ${FONT}`;
    if (ctx.measureText(s).width <= maxW) break;
    sz -= 0.5;
  }
  return sz;
}

function drawNode(ctx: CanvasRenderingContext2D, n: Node, idx: number, st: NState) {
  const col = stateColor(st);
  const fill =
    st === 'now' ? 'rgba(39,68,110,0.10)' : st === 'done' ? 'rgba(31,111,67,0.08)' : C.white;
  fillRound(ctx, n.x, n.y, NW, NH, 8, fill, col, st === 'now' ? 2.6 : st === 'done' ? 1.7 : 1.2);

  // 序号徽章
  ctx.save();
  ctx.beginPath();
  ctx.arc(n.x + 16, n.y + 19, 9.5, 0, Math.PI * 2);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
  text(ctx, String(idx + 1), n.x + 16, n.y + 19.5, {
    size: 10.5,
    weight: '800',
    color: st === 'todo' ? C.muted : C.white,
    align: 'center',
    baseline: 'middle',
  });

  text(ctx, n.title, n.x + 31, n.y + 24, {
    size: fitSize(ctx, n.title, NW - 40, 12),
    weight: '800',
    color: st === 'todo' ? C.muted : col,
  });
  text(ctx, n.sub, n.x + 11, n.y + 43, {
    size: fitSize(ctx, n.sub, NW - 22, 10.5),
    color: C.muted,
  });
}

export const RlPipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [step, setStep] = useState(0);

  const canvasRef = useCanvasScene(MW, MH, (ctx) => {
    /* ── 标题行 ── */
    text(ctx, 'ClawGUI-RL 训练闭环（论文 Figure 2 的结构）', 20, 22, {
      size: 12,
      weight: '700',
      color: C.ink,
    });
    text(
      ctx,
      step === 0 ? '还没开始' : step >= TOTAL_STEPS ? '闭环完成' : `第 ${step} / ${TOTAL_STEPS} 步`,
      MW - 20,
      22,
      {
        size: 11,
        weight: '700',
        color: step >= TOTAL_STEPS ? C.pass : C.muted,
        align: 'right',
      }
    );

    /* ── 节点之间的箭头 ── */
    const aCol = (j: number): string =>
      step >= TOTAL_STEPS || step >= j + 2 ? C.pass : step === j + 1 ? C.guide : C.axis;
    const aLw = (j: number): number => (step >= j + 2 || step === j + 1 ? 2.2 : 1.6);

    arrow(ctx, 170, 65, 205, 65, aCol(0), aLw(0), 6);
    arrow(ctx, 355, 65, 390, 65, aCol(1), aLw(1), 6);
    arrow(ctx, 465, 92, 465, 134, aCol(2), aLw(2), 6);
    arrow(ctx, 390, 161, 355, 161, aCol(3), aLw(3), 6);
    arrow(ctx, 205, 161, 170, 161, aCol(4), aLw(4), 6);

    /* ── 回流虚线：RL 训练器 ──▶ Rollout 管理器 ── */
    const retCol = step >= TOTAL_STEPS ? C.pass : step === 6 ? C.guide : C.axis;
    const retLw = step >= 6 ? 2.2 : 1.5;
    line(ctx, 95, ROW2, 95, 116, retCol, retLw, [5, 4]);
    line(ctx, 95, 116, 280, 116, retCol, retLw, [5, 4]);
    arrow(ctx, 280, 116, 280, 92, retCol, retLw, 6);
    text(ctx, '更新模型', 187, 110, {
      size: 10.5,
      weight: step >= 6 ? '800' : '700',
      color: retCol === C.axis ? C.muted : retCol,
      align: 'center',
    });

    /* ── 七个节点 ── */
    NODES.forEach((n, i) => drawNode(ctx, n, i, nstate(i, step)));

    /* ── 图例 ── */
    legend(ctx, 20, 210, [
      { color: C.guide, label: '当前节点' },
      { color: C.pass, label: '已走过' },
      { color: C.axis, label: '还没到' },
    ]);

    /* ── 进度胶囊 ── */
    const pw = 66;
    const gap = 8;
    const x0 = (MW - (PILLS.length * pw + (PILLS.length - 1) * gap)) / 2;
    PILLS.forEach((p, i) => {
      const st = nstate(i, step);
      const col = stateColor(st);
      const px = x0 + i * (pw + gap);
      fillRound(ctx, px, 228, pw, 20, 6, col);
      text(ctx, p, px + pw / 2, 238.5, {
        size: fitSize(ctx, p, pw - 8, 9.5),
        weight: '800',
        color: st === 'todo' ? C.muted : C.white,
        align: 'center',
        baseline: 'middle',
      });
    });
  });

  const fb = STEP_FB[step];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={MW} height={MH} />

      <div className="chip-row">
        <button
          className="tiny"
          disabled={step >= TOTAL_STEPS}
          onClick={() => setStep((v) => Math.min(TOTAL_STEPS, v + 1))}
        >
          下一步 ▸
        </button>
        <button className="tiny ghost" disabled={step === 0} onClick={() => setStep(0)}>
          重置
        </button>
      </div>

      <div className={`feedback ${fb.cls}`}>{fb.text}</div>

      <div className="step-desc">
        一共 7 步：六个节点走一圈，最后那根「更新模型」的虚线把模型送回环境里，闭环才算合上。
      </div>

      <div className="src-note">
        结构对应论文 Figure 2；ClawGUI-RL 基于 verl 与 verl-agent 构建。GiGPO 来自 Feng et al.
        2025b，本文是集成而非提出。
      </div>
    </div>
  );
};

export default RlPipeline;
