import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, rrect, arrow, FACTS } from './kit';

const W = 680;
const H = 300;

type Stage = 'naive' | 'fA' | 'fAB';

// —— 节点几何 ——
const X_BOX = { x: 28, y: 122, w: 62, h: 84 };
const Y_BOX = { x: 566, y: 122, w: 62, h: 84 };
const MAIN_Q = { x: 152, y: 96, w: 132, h: 46 };
const MAIN_G = { x: 318, y: 96, w: 132, h: 46 };
const LOW_D = { x: 152, y: 202, w: 132, h: 44 };
const LOW_U = { x: 318, y: 202, w: 132, h: 44 };
const ADD = { x: 505, y: 171, r: 17 };

function node(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number },
  title: string,
  sub: string,
  dim: boolean
): void {
  ctx.globalAlpha = dim ? 0.35 : 1;
  rrect(ctx, b.x, b.y, b.w, b.h, C.white, C.axis, 1.5, 8);
  text(ctx, title, b.x + b.w / 2, b.y + b.h / 2 - 7, C.ink, 13.5, 'center');
  text(ctx, sub, b.x + b.w / 2, b.y + b.h / 2 + 11, C.muted, 11, 'center');
  ctx.globalAlpha = 1;
}

function badge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: string,
  color: string
): void {
  ctx.font = '12px "Segoe UI", "PingFang SC", sans-serif';
  const w = ctx.measureText(s).width + 16;
  rrect(ctx, x, y, w, 22, color, color, 1, 11);
  text(ctx, s, x + w / 2, y + 11, C.white, 12, 'center');
}

// 折线箭头（最后一段带箭头）
function elbow(
  ctx: CanvasRenderingContext2D,
  pts: [number, number][],
  color: string,
  width = 2
): void {
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

// 8.1 数据流实验台：切换朴素 / 融合A / 融合A+B，看大张量读写次数
export const Ch8Flow: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState<Stage>('naive');
  const fusedA = stage !== 'naive';
  const fusedB = stage === 'fAB';
  const xReads = fusedA ? 1 : 2;
  const yWrites = fusedB ? 1 : 2;

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 融合分组底框
    if (fusedA) {
      ctx.fillStyle = 'rgba(34,141,92,0.08)';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(142, 88, 152, 168, 10);
      ctx.fill();
      ctx.stroke();
      text(ctx, '融合 kernel A', 218, 268, C.green, 12.5, 'center');
    }
    if (fusedB) {
      ctx.fillStyle = 'rgba(34,141,92,0.08)';
      ctx.strokeStyle = C.green;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(310, 88, 240, 168, 10);
      ctx.fill();
      ctx.stroke();
      text(ctx, '融合 kernel B', 430, 268, C.green, 12.5, 'center');
    }

    // 边
    const main = fusedA ? C.green : C.ink;
    const lw = fusedA ? 3 : 2;
    elbow(ctx, [[90, 140], [120, 140], [120, 119], [152, 119]], main, lw);
    elbow(ctx, [[90, 188], [120, 188], [120, 224], [152, 224]], main, lw);
    elbow(ctx, [[284, 119], [318, 119]], fusedA ? C.green : C.ink, lw);
    elbow(ctx, [[450, 119], [470, 119], [470, 164], [490, 168]], fusedB ? C.green : C.ink, fusedB ? 3 : 2);
    elbow(ctx, [[284, 224], [318, 224]], fusedA ? C.green : C.ink, lw);
    elbow(ctx, [[450, 224], [470, 224], [470, 178], [490, 176]], fusedB ? C.green : C.ink, fusedB ? 3 : 2);
    elbow(ctx, [[522, 171], [566, 164]], fusedB ? C.green : C.ink, fusedB ? 3 : 2);

    // 节点
    const dimMainQ = fusedA;
    const dimLowD = fusedA;
    const dimMainG = fusedB;
    const dimLowU = fusedB;
    node(ctx, X_BOX, 'X', '激活张量', false);
    node(ctx, MAIN_Q, '主分支 · 量化', '读 X → INT4', dimMainQ);
    node(ctx, MAIN_G, '主分支 · GEMM', '4-bit 计算', dimMainG);
    node(ctx, LOW_D, '低秩 · 降维 L₁', '读 X，512→32', dimLowD);
    node(ctx, LOW_U, '低秩 · 升维 L₂', '32→512', dimLowU);
    node(ctx, Y_BOX, 'Y', '输出张量', false);

    // ⊕
    ctx.globalAlpha = fusedB ? 0.35 : 1;
    ctx.strokeStyle = C.axis;
    ctx.fillStyle = C.white;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(ADD.x, ADD.y, ADD.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    text(ctx, '+', ADD.x, ADD.y + 1, C.ink, 20, 'center');
    ctx.globalAlpha = 1;

    // 流量徽章
    badge(ctx, X_BOX.x - 6, X_BOX.y - 28, `读 ×${xReads}`, xReads === 1 ? C.green : C.red);
    badge(ctx, Y_BOX.x - 6, Y_BOX.y - 28, `写 ×${yWrites}`, yWrites === 1 ? C.green : C.red);

    if (!fusedA) {
      text(ctx, 'X 被读 2 次', 120, 76, C.red, 12, 'center');
    }
    if (!fusedB) {
      text(ctx, 'Y 被写 2 次', 544, 76, C.red, 12, 'center');
    }
    if (stage === 'naive') {
      text(ctx, 'r₁ 写→读（中间张量）', 301, 268, C.red, 12, 'center');
    }
  });

  const fb =
    stage === 'naive'
    ? { t: `朴素执行：X 被读 2 次、Y 被写 2 次，外加中间张量 r₁ 的一次写读——FLOPs 只多 ${FACTS.flopsRatio}，延迟却多出 ${FACTS.overheadNaive}。`, c: 'bad' }
    : stage === 'fA'
    ? { t: '融合 A：降维与量化合成一个 kernel，两边并行读同一个 X——大张量读取减半，这就是「共享输入」。', c: '' }
    : { t: `融合 A+B：升维结果直接注入 4-bit GEMM 的 epilogue，Y 只写一次、r₁ 全程留在片上——低秩分支开销压到 ${FACTS.overheadFused}，接近免费。`, c: 'good' };

  const traffic = (n: number) => `${(n / 2) * 100}%`;

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>大张量流量计（示意计数）</h6>
          <div className="svq-readout">
            <span>X 读取</span>
            <b className={xReads === 1 ? 'good' : 'bad'}>{xReads} 次</b>
          </div>
          <div className="svq-meter">
            <i style={{ width: traffic(xReads), background: xReads === 1 ? C.green : C.red }} />
          </div>
          <div className="svq-readout">
            <span>Y 写入</span>
            <b className={yWrites === 1 ? 'good' : 'bad'}>{yWrites} 次</b>
          </div>
          <div className="svq-meter">
            <i style={{ width: traffic(yWrites), background: yWrites === 1 ? C.green : C.red }} />
          </div>
          <div className="svq-readout">
            <span>中间张量 r₁</span>
            <b className={fusedB ? 'good' : 'bad'}>{fusedB ? '0 次 · 片上驻留' : '写 + 读 2 次'}</b>
          </div>
          <h6>论文报告开销</h6>
          <div className="svq-readout">
            <span>额外读写开销</span>
            <b className={fusedB ? 'good' : 'bad'}>
              {stage === 'naive' ? FACTS.overheadNaive : stage === 'fA' ? '部分消除' : FACTS.overheadFused}
            </b>
          </div>
          <div className="svq-readout">
            <span>低秩分支 FLOPs</span>
            <b>{FACTS.flopsRatio}（恒定）</b>
          </div>
        </div>
      </div>
      <div className="chip-row">
        <button className={`chip ${stage === 'naive' ? 'selected' : ''}`} onClick={() => setStage('naive')}>
          朴素执行
        </button>
        <button className={`chip ${stage === 'fA' ? 'selected' : ''}`} onClick={() => setStage('fA')}>
          融合 A · 共享输入
        </button>
        <button className={`chip ${stage === 'fAB' ? 'selected' : ''}`} onClick={() => setStage('fAB')}>
          融合 A+B · 完整 Nunchaku
        </button>
      </div>
      <div className={`feedback ${fb.c}`}>{fb.t}</div>
      <p className="concept-note">
        <b>融合省的不是 FLOPs（仍约 +1.5%），而是 HBM 上的大张量读写。</b>
        「{FACTS.overheadNaive} → {FACTS.overheadFused}」为论文报告值；流量计次数为教学示意计数，非逐 cycle 仿真。
      </p>
    </div>
  );
};

// —— 8.2 延迟堆叠分解（带补间动画） ——
const LW = 1080;
const LH = 230;
const BAR_X = 90;
const PX_PER_UNIT = 470;
const SEG_MAIN = 1.0;
const SEG_FLOPS = 0.015;
const EXTRA = { naive: 0.5, fused: 0.075 };

export const Ch8Latency: React.FC<WidgetProps> = () => {
  const [fused, setFused] = useState(false);
  const [t, setT] = useState(0); // 0=朴素 1=融合
  const timer = useRef<number | null>(null);
  const tRef = useRef(0);

  useEffect(() => {
    const target = fused ? 1 : 0;
    if (timer.current) clearInterval(timer.current);
    timer.current = window.setInterval(() => {
      const cur = tRef.current;
      const next = cur + (target - cur) * 0.25 + (target > cur ? 0.01 : -0.01);
      const done = Math.abs(target - next) < 0.01;
      const v = done ? target : next;
      tRef.current = v;
      setT(v);
      if (done && timer.current) {
        clearInterval(timer.current);
        timer.current = null;
      }
    }, 25);
    return () => {
      if (timer.current) clearInterval(timer.current);
      timer.current = null;
    };
  }, [fused]);

  const extra = EXTRA.naive + (EXTRA.fused - EXTRA.naive) * t;
  const total = SEG_MAIN + SEG_FLOPS + extra;
  const segColor = `rgb(${Math.round(196 + (34 - 196) * t)},${Math.round(63 + (141 - 63) * t)},${Math.round(82 + (92 - 82) * t)})`;

  const ref = useCanvas(LW, LH, (ctx) => {
    clearScene(ctx, LW, LH);
    grid(ctx, 10, 14, LW - 20, LH - 28, 28);
    const y = 108;
    const h = 46;

    // 刻度轴（0 / 0.5× / 1.0× / 1.5×）
    for (let u = 0; u <= 1.51; u += 0.5) {
      const gx = BAR_X + u * PX_PER_UNIT;
      ctx.strokeStyle = 'rgba(118,144,106,0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gx, y - 18);
      ctx.lineTo(gx, y + h + 6);
      ctx.stroke();
      text(ctx, `${u}×`, gx, y + h + 22, C.muted, 12, 'center');
    }

    // 三段堆叠
    const wMain = SEG_MAIN * PX_PER_UNIT;
    const wFlops = SEG_FLOPS * PX_PER_UNIT;
    const wExtra = extra * PX_PER_UNIT;
    rrect(ctx, BAR_X, y, wMain, h, C.blue, C.blue, 1, 6);
    text(ctx, '主分支 4-bit 计算 = 1×', BAR_X + wMain / 2, y + h / 2, C.white, 14, 'center');
    rrect(ctx, BAR_X + wMain + 2, y, wFlops, h, C.purple, C.purple, 1, 4);
    rrect(ctx, BAR_X + wMain + wFlops + 4, y, wExtra, h, segColor, segColor, 1, 6);
    if (wExtra > 120) {
      text(
        ctx,
        fused ? '额外读写 5–10%' : '额外读写 约 50%',
        BAR_X + wMain + wFlops + 4 + wExtra / 2,
        y + h / 2,
        C.white,
        14,
        'center'
      );
    }
    // 低秩段太小，引线标注
    const fx = BAR_X + wMain + 2 + wFlops / 2;
    ctx.strokeStyle = C.purple;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(fx, y - 4);
    ctx.lineTo(fx, y - 26);
    ctx.stroke();
    text(ctx, '低秩计算 +1.5% FLOPs', fx + 8, y - 26, C.purple, 12.5);

    // 总延迟读数（右对齐，保证完整可见）
    text(ctx, `总延迟 ×${total.toFixed(2)}`, LW - 28, y + h / 2 - 2, C.ink, 22, 'right');
    text(
      ctx,
      fused ? '低秩分支几乎免费' : '低秩分支「算得少，搬得多」',
      LW - 28,
      y + h / 2 + 24,
      fused ? C.green : C.red,
      13,
      'right'
    );
    text(ctx, '总延迟构成（以主分支计算 = 1× 为基准）', 36, 40, C.ink, 15);
  });

  return (
    <div>
      <canvas ref={ref} width={LW} height={LH} />
      <div className="svq-readout-grid">
        <div className="svq-readout">
          <span>低秩分支 FLOPs</span>
          <b>{FACTS.flopsRatio}</b>
        </div>
        <div className="svq-readout">
          <span>额外读写开销（论文）</span>
          <b className={fused ? 'good' : 'bad'}>
            {FACTS.overheadNaive} → {FACTS.overheadFused}
          </b>
        </div>
        <div className="svq-readout">
          <span>总延迟（估算）</span>
          <b className={fused ? 'good' : 'bad'}>×1.52 → ×1.09</b>
        </div>
      </div>
      <div className="chip-row">
        <button className={`chip ${!fused ? 'selected' : ''}`} onClick={() => setFused(false)}>
          朴素执行
        </button>
        <button className={`chip ${fused ? 'selected' : ''}`} onClick={() => setFused(true)}>
          Nunchaku 融合
        </button>
      </div>
      <div className={`feedback ${fused ? 'good' : 'bad'}`}>
        {fused
          ? `融合后额外读写从 ${FACTS.overheadNaive} 压到 ${FACTS.overheadFused}：总延迟 ≈ ×1.09——这就是论文说「接近朴素 INT4」的含义。`
          : `朴素执行下，额外大张量读写占主分支计算的一半：总延迟 ≈ ×1.5。FLOPs 只多 ${FACTS.flopsRatio}，瓶颈全在「搬」。`}
      </div>
      <p className="concept-note">
        堆叠比例为示意分解：主分支 = 1×，低秩 FLOPs +1.5%，额外读写取论文报告的 {FACTS.overheadNaive}（朴素）与
        {' '}{FACTS.overheadFused}（融合）；总延迟倍数按此模型估算，非论文逐项实测。
      </p>
    </div>
  );
};

export default Ch8Flow;
