import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { K, drawLabel, roundRect } from './ana-scene';

// Interactive redraw of the paper's Figure 3 (NTM overview):
//   x_t --f_T--> u_t --f_P(z,y)--> u^_s <--D--> u_s <--f_T-- x_s
// Every node is clickable and explains its structure and design rationale.

const W = 560, H = 316;
type Variant = 'scratch' | 'ft';
type NodeId = 'x' | 'ft' | 'u' | 'z' | 'fp' | 'd';

interface NodeBox { id: NodeId; x: number; y: number; w: number; h: number; label: string }

// layout: two rows (t on top, s on bottom) + z above the predictor + D on the right
const TOP = 84, BOT = 208;
const NODES: NodeBox[] = [
  { id: 'x', x: 22, y: TOP, w: 56, h: 40, label: 'x_t' },
  { id: 'x', x: 22, y: BOT, w: 56, h: 40, label: 'x_s' },
  { id: 'ft', x: 112, y: TOP, w: 74, h: 40, label: 'f_T' },
  { id: 'ft', x: 112, y: BOT, w: 74, h: 40, label: 'f_T' },
  { id: 'u', x: 220, y: TOP, w: 56, h: 40, label: 'u_t' },
  { id: 'u', x: 220, y: BOT, w: 56, h: 40, label: 'u_s' },
  { id: 'fp', x: 310, y: TOP, w: 88, h: 40, label: 'f_P' },
  { id: 'z', x: 330, y: 18, w: 48, h: 32, label: 'z' },
  { id: 'u', x: 432, y: TOP, w: 56, h: 40, label: 'û_s' },
  { id: 'd', x: 452, y: (TOP + BOT) / 2 + 6, w: 56, h: 44, label: 'D' },
];

const CHIP_NODES: { id: NodeId; label: string }[] = [
  { id: 'x', label: 'x_t / x_s' },
  { id: 'ft', label: '搬运器 f_T' },
  { id: 'u', label: 'u 表示' },
  { id: 'z', label: '随机数 z' },
  { id: 'fp', label: '预测器 f_P' },
  { id: 'd', label: '距离 D' },
];

const DETAIL: Record<Variant, Record<NodeId, string>> = {
  scratch: {
    x: 'x_t、x_s：同一条高斯前向轨迹上的相邻两帧（t > s）。训练时整条轨迹联合采样——NTM 不改这条轨迹，只改反向条件的参数化。',
    ft: '搬运器 f_T（上下两支共享同一套权重）：仅 2 块 × 4 层、因果自回归、块间交替扫描方向。因果结构使雅可比是三角阵——det J_T 等于对角元乘积，换元账好算；逐元素仿射保证可逆。',
    u: 'u = f_T(x)：换元后的表示。设计目标只有一个——让反向条件 p(u_s|u_t) 在这里近似高斯，预测器就只需输出 (μ, σ)。',
    z: 'z ∼ N(0, I)：标准高斯随机数，多样性的来源。训练时反解出 z_k，它应落在高密度区——对应 Loss 里的 ½‖z‖² 项（§4）。',
    fp: '预测器 f_P：24 层全注意力、非因果——它不必可逆，容量可以放开。输入 u_t、时间 (t,s)、文本 y 与 z，输出 û_s = μ_P + σ_P ⊙ z；空间与时间步全并行。',
    d: 'D：分布层面的距离。训练时它就是精确 NLL 的三项之和（§4）——不是感知损失，也不是对抗判别器。',
  },
  ft: {
    x: '微调场景相同：相邻两帧来自预训练流匹配模型所用的同一条线性插值轨迹。',
    ft: '微调版搬运器结构相同，但初始化为恒等映射 f_T = id：起点的换元账为零，模型就是预训练模型本身（§5），之后逐渐学出非高斯修正。',
    u: '起点处 u = x（恒等），随微调推进 u 空间才逐渐「弯」出去。',
    z: '同从头训练版：z ∼ N(0, I)，训练时反解、推理时新抽。',
    fp: '微调版预测器 = FLUX.2-klein（4B）骨干 + 零初始化投影层；μ_P 锚到预训练后验均值（命题 2 闭式换算，§5）。',
    d: '同一个 D：精确 NLL，再加均值对齐辅助损失 L_aux 防早期发散（§5）。',
  },
};

function variantLabelFP(v: Variant): string {
  return v === 'scratch' ? '深：24 层 · 非因果 · 并行' : '深：4B 骨干 · 非因果';
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color: string) {
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 7 * Math.cos(a - 0.42), y2 - 7 * Math.sin(a - 0.42));
  ctx.lineTo(x2 - 7 * Math.cos(a + 0.42), y2 - 7 * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
}

export const M3Frame: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ node: NodeId; variant: Variant }>({ node: 'ft', variant: 'scratch' });
  const rafRef = useRef<number | null>(null);
  const [node, setNode] = useState<NodeId>('ft');
  const [variant, setVariant] = useState<Variant>('scratch');
  const [feedback, setFeedback] = useState({ text: DETAIL.scratch.ft, cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      ctx.fillStyle = K.bg;
      ctx.fillRect(0, 0, W, H);
      drawLabel(ctx, s.variant === 'scratch' ? '训练数据流（从头训练版 · 256²）' : '训练数据流（微调版 · FLUX.2-klein 4B · 512²）',
        22, 12, K.text, 12);

      // edges first (under the boxes)
      const c = K.muted;
      arrow(ctx, 78, TOP + 20, 112, TOP + 20, c);            // x_t -> f_T
      arrow(ctx, 186, TOP + 20, 220, TOP + 20, c);           // f_T -> u_t
      arrow(ctx, 276, TOP + 20, 310, TOP + 20, c);           // u_t -> f_P
      arrow(ctx, 398, TOP + 20, 432, TOP + 20, c);           // f_P -> u^_s
      arrow(ctx, 354, 50, 354, TOP, c);                      // z -> f_P
      arrow(ctx, 78, BOT + 20, 112, BOT + 20, c);            // x_s -> f_T
      arrow(ctx, 186, BOT + 20, 220, BOT + 20, c);           // f_T -> u_s
      // u^_s and u_s both feed D
      arrow(ctx, 460, TOP + 40, 474, (TOP + BOT) / 2 + 6, c);
      arrow(ctx, 276, BOT + 20, 452, (TOP + BOT) / 2 + 44, c);
      // shared-weights tie between the two f_T boxes
      ctx.strokeStyle = K.blue;
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(149, TOP + 40);
      ctx.lineTo(149, BOT);
      ctx.stroke();
      ctx.setLineDash([]);
      drawLabel(ctx, '共享权重', 156, (TOP + BOT) / 2 + 14, K.blue, 10);

      // boxes
      NODES.forEach((n) => {
        const sel = n.id === s.node;
        const isFT = n.id === 'ft';
        const isFP = n.id === 'fp';
        const isD = n.id === 'd';
        roundRect(ctx, n.x, n.y, n.w, n.h, isD ? 22 : 6);
        ctx.fillStyle = sel ? (isFP ? K.orange : K.blue) : isFT ? 'rgba(47,107,187,0.10)' : isFP ? 'rgba(196,113,44,0.10)' : K.card;
        ctx.fill();
        ctx.strokeStyle = sel ? (isFP ? K.orange : K.blue) : isFT ? K.blue : isFP ? K.orange : K.border;
        ctx.lineWidth = sel ? 2 : 1.2;
        ctx.stroke();
        drawLabel(ctx, n.label, n.x + n.w / 2, n.y + n.h / 2, sel ? '#ffffff' : K.text, 13, 'center');
      });

      // structural annotations
      drawLabel(ctx, '浅：2 块 × 4 层 · 因果 AR', 112, TOP - 14, K.blue, 10);
      drawLabel(ctx, variantLabelFP(s.variant), 310, TOP - 14, K.orange, 10);
      drawLabel(ctx, '像素空间', 22, TOP + 54, K.muted, 10);
      drawLabel(ctx, 'u 空间（近似高斯）', 220, BOT + 54, K.muted, 10);
      drawLabel(ctx, '分布距离 = 精确 NLL', 420, (TOP + BOT) / 2 + 62, K.muted, 10);

      // detail card
      roundRect(ctx, 22, 262, 516, 44, 5);
      ctx.fillStyle = K.card;
      ctx.fill();
      ctx.strokeStyle = K.border;
      ctx.stroke();
      const text = DETAIL[s.variant][s.node];
      const mid = text.length > 42 ? (text.lastIndexOf('，', 44) + 1 || 42) : text.length;
      drawLabel(ctx, text.slice(0, mid), 34, 276, K.text, 11);
      if (mid < text.length) drawLabel(ctx, text.slice(mid, mid + 44), 34, 292, K.text, 11);
    };

    const tick = () => {
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * W;
      const y = ((e.clientY - rect.top) / rect.height) * H;
      const hit = NODES.find((n) => x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h);
      if (hit) selectNode(hit.id);
    };
    canvas.addEventListener('click', onClick);
    return () => {
      stop();
      disconnect();
      canvas.removeEventListener('click', onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectNode = (id: NodeId) => {
    stateRef.current.node = id;
    setNode(id);
    setFeedback({ text: DETAIL[stateRef.current.variant][id], cls: id === 'ft' || id === 'fp' ? 'good' : '' });
  };
  const pickVariant = (v: Variant) => {
    stateRef.current.variant = v;
    setVariant(v);
    setFeedback({ text: DETAIL[v][stateRef.current.node], cls: stateRef.current.node === 'ft' || stateRef.current.node === 'fp' ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {CHIP_NODES.map((n) => (
          <button key={n.id} className={`chip ${node === n.id ? 'selected' : ''}`} onClick={() => selectNode(n.id)}>
            {n.label}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={`chip ${variant === 'scratch' ? 'selected' : ''}`} onClick={() => pickVariant('scratch')}>
          从头训练版
        </button>
        <button className={`chip ${variant === 'ft' ? 'selected' : ''}`} onClick={() => pickVariant('ft')}>
          微调版
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
