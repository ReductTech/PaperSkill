import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, rrect, arrow, FACTS } from './kit';

const W = 680;
const H = 300;

// 折线箭头（最后一段带箭头）
function elbow(ctx: CanvasRenderingContext2D, pts: [number, number][], color: string, width = 2): void {
  for (let i = 0; i < pts.length - 2; i++) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(pts[i][0], pts[i][1]);
    ctx.lineTo(pts[i + 1][0], pts[i + 1][1]);
    ctx.stroke();
  }
  const a = pts[pts.length - 2];
  const b = pts[pts.length - 1];
  arrow(ctx, a[0], a[1], b[0], b[1], color, width);
}

const X_BOX = { x: 28, y: 122, w: 62, h: 84 };
const Y_BOX = { x: 566, y: 122, w: 62, h: 84 };
const MAIN_Q = { x: 152, y: 96, w: 132, h: 46 };
const MAIN_G = { x: 318, y: 96, w: 132, h: 46 };
const LOW_D = { x: 152, y: 202, w: 132, h: 44 };
const LOW_U = { x: 318, y: 202, w: 132, h: 44 };
const ADD = { x: 505, y: 171, r: 17 };

type Pt = [number, number][];
const E_X_MAIN: Pt = [[90, 140], [120, 140], [120, 119], [152, 119]];
const E_X_LOW: Pt = [[90, 188], [120, 188], [120, 224], [152, 224]];
const E_Q_G: Pt = [[284, 119], [318, 119]];
const E_G_ADD: Pt = [[450, 119], [470, 119], [470, 164], [490, 168]];
const E_D_U: Pt = [[284, 224], [318, 224]];
const E_U_ADD: Pt = [[450, 224], [470, 224], [470, 178], [490, 176]];
const E_ADD_Y: Pt = [[522, 171], [566, 164]];

const STEPS: {
  title: string;
  desc: string;
  hot: Pt[];
  packet: [number, number];
  color: string;
  label: string;
  labelPos: [number, number];
}[] = [
  {
    title: '① 读取激活 X',
    desc: '把整块激活张量 X 从显存读到计算单元——这是最大的一笔搬运。',
    hot: [E_X_LOW],
    packet: [120, 188],
    color: C.blue,
    label: 'X 读 ①',
    labelPos: [120, 170],
  },
  {
    title: '② 低秩分支：X·L₁ 降维',
    desc: '低秩分支做一次小矩阵乘（512→32），FLOPs 很小。',
    hot: [],
    packet: [218, 224],
    color: C.green,
    label: '小计算',
    labelPos: [218, 190],
  },
  {
    title: '③ 主分支：量化 X（第二次读）',
    desc: '主分支要把 X 完整再读一遍做量化——大张量读取翻倍。',
    hot: [E_X_MAIN],
    packet: [120, 119],
    color: C.red,
    label: 'X 读 ②（重复）',
    labelPos: [120, 96],
  },
  {
    title: '④ 低秩分支：升维 + 中间张量往返',
    desc: 'r₁ 要写回 HBM、再读回来——数据虽小，搬运按大张量的规矩走两趟。',
    hot: [E_D_U, E_U_ADD],
    packet: [301, 224],
    color: C.red,
    label: 'r₁ 写→读',
    labelPos: [301, 268],
  },
  {
    title: '⑤ 主分支：4-bit GEMM',
    desc: '主分支读量化权重做 4-bit 矩阵乘——真正的大头计算。',
    hot: [E_Q_G, E_G_ADD],
    packet: [301, 119],
    color: C.blue,
    label: '大头计算',
    labelPos: [301, 96],
  },
  {
    title: '⑥ 写回输出 Y',
    desc: '两条分支相加，把输出 Y 写回显存——又一次大张量搬运。',
    hot: [E_ADD_Y],
    packet: [544, 167],
    color: C.blue,
    label: 'Y 写 ①',
    labelPos: [544, 143],
  },
];

function node(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  title: string,
  sub: string,
  hot: boolean
): void {
  rrect(ctx, b.x, b.y, b.w, b.h, C.white, hot ? C.orange : C.axis, hot ? 2.5 : 1.5, 8);
  text(ctx, title, b.x + b.w / 2, b.y + b.h / 2 - 7, C.ink, 13, 'center');
  text(ctx, sub, b.x + b.w / 2, b.y + b.h / 2 + 11, C.muted, 11, 'center');
}

export const Ch6Memory: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const s = STEPS[step];

  const xReads = step >= 2 ? 2 : 1;
  const r1Hops = step >= 3 ? 2 : 0;
  const yWrites = step >= 5 ? 1 : 0;
  const total = xReads + r1Hops + yWrites;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 背景边
    elbow(ctx, E_X_MAIN, C.axis, 2);
    elbow(ctx, E_X_LOW, C.axis, 2);
    elbow(ctx, E_Q_G, C.axis, 2);
    elbow(ctx, E_G_ADD, C.axis, 2);
    elbow(ctx, E_D_U, C.axis, 2);
    elbow(ctx, E_U_ADD, C.axis, 2);
    elbow(ctx, E_ADD_Y, C.axis, 2);

    // 高亮当前步的搬运
    s.hot.forEach((e) => elbow(ctx, e, s.color, 3));

    node(ctx, X_BOX, 'X', '激活 · 大张量', step === 0 || step === 2);
    node(ctx, MAIN_Q, '主分支 · 量化', '读 X → INT4', step === 2);
    node(ctx, MAIN_G, '主分支 · GEMM', '4-bit 计算', step === 4);
    node(ctx, LOW_D, '低秩 · 降维 L₁', '512→32', step === 1);
    node(ctx, LOW_U, '低秩 · 升维 L₂', '32→512', step === 3);
    node(ctx, Y_BOX, 'Y', '输出 · 大张量', step === 5);

    ctx.strokeStyle = C.axis;
    ctx.fillStyle = C.white;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ADD.x, ADD.y, ADD.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, '+', ADD.x, ADD.y + 1, C.ink, 20, 'center');

    // 搬运包
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(s.packet[0], s.packet[1], 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.white;
    ctx.beginPath();
    ctx.arc(s.packet[0], s.packet[1], 3, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, s.label, s.labelPos[0], s.labelPos[1], s.color, 13, 'center');
  });

  const fb =
    step === 2
    ? { t: 'X 被读了第二遍——低秩分支和主分支各读一次，大张量搬运翻倍，这就是约 50% 延迟开销的元凶之一。', c: 'bad' }
    : step === 3
    ? { t: '中间结果 r₁ 明明很小，却要按大张量的规矩在 HBM 写一遍、读一遍——纯搬运，零计算收益。', c: 'bad' }
    : step === 5
    ? { t: `数一数：X 读 ${xReads} 次、r₁ 往返 ${r1Hops} 次、Y 写 ${yWrites} 次，共 ${total} 次大张量访问——FLOPs 只多 ${FACTS.flopsRatio}，搬运却全是整块张量。下一章的融合就是消掉它们。`, c: 'good' }
    : { t: s.desc, c: '' };

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>搬运计量（累计）</h6>
          <div className="svq-readout">
            <span>X 大张量读取</span>
            <b className={xReads === 2 ? 'bad' : 'blue'}>{xReads} 次</b>
          </div>
          <div className="svq-readout">
            <span>r₁ 中间张量往返</span>
            <b className={r1Hops > 0 ? 'bad' : 'good'}>{r1Hops} 次</b>
          </div>
          <div className="svq-readout">
            <span>Y 大张量写入</span>
            <b className={yWrites > 0 ? 'blue' : ''}>{yWrites} 次</b>
          </div>
          <div className="svq-readout">
            <span>累计大访问</span>
            <b className={total >= 4 ? 'bad' : ''}>{total} 次</b>
          </div>
          <div className="svq-readout">
            <span>低秩 FLOPs</span>
            <b>{FACTS.flopsRatio}</b>
          </div>
          <div className="svq-readout">
            <span>朴素执行开销</span>
            <b className="bad">{FACTS.overheadNaive}</b>
          </div>
        </div>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / {STEPS.length}
        </span>
        <button className="tiny" onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))} disabled={step === STEPS.length - 1}>
          下一步
        </button>
      </div>
      <div className="step-desc">
        <strong>{s.title}</strong> — {s.desc}
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="concept-note">
        <b>瓶颈不在「算」，而在「搬」：</b>低秩分支 FLOPs 只占 {FACTS.flopsRatio}，但朴素执行下 X/r₁/Y 的大张量访问多了 {total} 次
        （计数为教学示意）。橙色 = 当前步搬运的数据包；第③④步（红色）就是下一章融合要消灭的冗余。
      </p>
    </div>
  );
};

export default Ch6Memory;
