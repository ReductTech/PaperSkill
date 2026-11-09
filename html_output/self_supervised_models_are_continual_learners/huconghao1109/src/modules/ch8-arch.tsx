import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawNode,
  drawArrow,
  drawBox,
  inset,
  label,
  bar,
  legend,
} from './scene';

const W = 1080;
const H = 280;

type Feedback = { text: string; cls: string; color?: string };

function feedbackStyle(f: Feedback): React.CSSProperties | undefined {
  if (!f.color) return undefined;
  return { color: f.color, borderLeftColor: f.color, fontStyle: 'normal' };
}

/* ------------------------------ §8.1 ------------------------------ */

type NodeKey = 'aug' | 'enc' | 'g' | 'frozen' | 'loss';
type LossKey = 'infonce' | 'mse' | 'ce' | 'corr';
type ArchState = { node: NodeKey; loss: LossKey };

type NodeDef = {
  key: NodeKey;
  text: string;
  short: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

const ARCH_NODES: NodeDef[] = [
  { key: 'aug', text: '增强视图', short: '增强视图', x: 24, y: 113, w: 120, h: 54 },
  { key: 'enc', text: '当前编码器', short: '当前编码器', x: 190, y: 50, w: 140, h: 54 },
  { key: 'g', text: '预测头 g', short: '预测头', x: 380, y: 50, w: 120, h: 54 },
  { key: 'frozen', text: '冻结编码器', short: '冻结编码器', x: 190, y: 176, w: 140, h: 54 },
  { key: 'loss', text: '损失', short: '损失', x: 560, y: 113, w: 130, h: 54 },
];

type LossDef = {
  key: LossKey;
  text: string;
  methods: string;
  freezeProto: boolean;
};

// 论文表 1：四类损失的代表方法与是否需冻结原型。
const ARCH_LOSSES: LossDef[] = [
  { key: 'infonce', text: 'InfoNCE', methods: 'SimCLR / MoCo / NNCLR', freezeProto: false },
  { key: 'mse', text: 'MSE', methods: 'BYOL / SimSiam / VICReg', freezeProto: false },
  { key: 'ce', text: '交叉熵原型', methods: 'SwAV / DCV2 / DINO', freezeProto: true },
  { key: 'corr', text: '互相关', methods: 'BarlowTwins / VICReg', freezeProto: false },
];

const NODE_FEEDBACK: Record<NodeKey, string> = {
  aug: '随机裁剪、颜色抖动、翻转生成两个视图。',
  enc: '当前编码器持续更新，产出 z。',
  g: '两层 MLP、2048 隐单元、ReLU，把 z 投回旧空间。',
  frozen: '上一个任务的副本，detach，不接收梯度。',
  loss: '同一个 L_SSL，这次比较 g(z) 与 z̄。',
};

const archFeedback = (s: ArchState): Feedback => {
  const l = ARCH_LOSSES.find((x) => x.key === s.loss) || ARCH_LOSSES[0];
  return {
    text:
      NODE_FEEDBACK[s.node] +
      l.text +
      '：' +
      l.methods +
      '；' +
      (l.freezeProto ? '需冻结原型' : '无需冻结原型') +
      '。',
    cls: '',
  };
};

type EdgeDef = {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  frozen?: boolean;
};

const ARCH_EDGES: EdgeDef[] = [
  { key: 'aug-enc', x1: 144, y1: 128, x2: 190, y2: 90 },
  { key: 'enc-g', x1: 330, y1: 77, x2: 380, y2: 77 },
  { key: 'g-loss', x1: 500, y1: 90, x2: 560, y2: 126 },
  { key: 'aug-frozen', x1: 144, y1: 152, x2: 190, y2: 190, frozen: true },
  { key: 'frozen-loss', x1: 330, y1: 196, x2: 560, y2: 154, frozen: true },
];

// 选中节点通往损失节点的路径；冻结支路断开，不参与高亮。
const ARCH_PATHS: Record<NodeKey, string[]> = {
  aug: ['aug-enc', 'enc-g', 'g-loss'],
  enc: ['enc-g', 'g-loss'],
  g: ['g-loss'],
  frozen: [],
  loss: ['g-loss'],
};

export const Ch8Arch: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<ArchState>({ node: 'enc', loss: 'infonce' });
  const drawRef = useRef<((s: ArchState, t: number) => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<ArchState>({ node: 'enc', loss: 'infonce' });
  const [feedback, setFeedback] = useState<Feedback>(
    archFeedback({ node: 'enc', loss: 'infonce' })
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: ArchState, _t: number) => {
      clearScene(ctx, W, H);

      // 左：架构图
      const active = ARCH_PATHS[s.node];
      for (const e of ARCH_EDGES) {
        const on = !e.frozen && active.includes(e.key);
        const col = on ? C.blue : e.frozen ? C.muted : C.light;
        drawArrow(ctx, e.x1, e.y1, e.x2, e.y2, col, on ? 3 : 2);
      }

      // 冻结支路断点（detach，路径断开）
      const mx = 445;
      const my = 175;
      ctx.save();
      ctx.fillStyle = C.bg;
      ctx.fillRect(mx - 10, my - 10, 20, 20);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(mx - 6, my + 7);
      ctx.lineTo(mx + 2, my - 7);
      ctx.moveTo(mx + 1, my + 7);
      ctx.lineTo(mx + 9, my - 7);
      ctx.stroke();
      ctx.restore();

      for (const n of ARCH_NODES) {
        const selected = s.node === n.key;
        const st = n.key === 'frozen' ? 'frozen' : selected ? 'active' : 'idle';
        drawNode(ctx, n.x, n.y, n.w, n.h, n.text, st);
        if (n.key === 'g') {
          if (!selected) drawBox(ctx, n.x, n.y, n.w, n.h, undefined, C.purple, 9);
          ctx.save();
          ctx.fillStyle = C.purple;
          ctx.beginPath();
          ctx.arc(n.x + 12, n.y + 12, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 右：detailPane（白底 inset）。标记都配文字，别只画一个圆点让人猜。
      inset(ctx, 752, 24, 296, 232);
      const nodeDef = ARCH_NODES.find((n) => n.key === s.node) || ARCH_NODES[1];
      const lossDef = ARCH_LOSSES.find((l) => l.key === s.loss) || ARCH_LOSSES[0];
      label(ctx, nodeDef.short, 772, 62, 15, C.ink);

      // 有 / 无梯度
      const grad = s.node !== 'aug' && s.node !== 'frozen';
      ctx.save();
      if (grad) {
        ctx.fillStyle = C.green;
        ctx.beginPath();
        ctx.arc(790, 96, 7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.strokeStyle = C.muted;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(790, 96, 7, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(785, 101);
        ctx.lineTo(795, 91);
        ctx.stroke();
      }
      ctx.restore();
      label(ctx, grad ? '接收梯度' : '不接收梯度', 806, 101, 12, grad ? C.green : C.muted);

      // 当前损失与是否需要冻结原型
      label(ctx, lossDef.text, 772, 136, 15, C.ink);
      ctx.save();
      if (lossDef.freezeProto) {
        ctx.fillStyle = C.purple;
        ctx.fillRect(772, 152, 14, 14);
      } else {
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 2;
        ctx.strokeRect(772, 152, 14, 14);
      }
      ctx.restore();
      label(
        ctx,
        lossDef.freezeProto ? '需冻结原型' : '不需冻结原型',
        796,
        165,
        12,
        lossDef.freezeProto ? C.purple : C.muted
      );
        };

    drawRef.current = render;
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (time: number) => {
      render(stateRef.current, time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      drawRef.current = null;
    };
  }, []);

  const apply = (next: Partial<ArchState>) => {
    const s = { ...stateRef.current, ...next };
    stateRef.current = s;
    setSel(s);
    setFeedback(archFeedback(s));
    drawRef.current?.(s, 0);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    for (const n of ARCH_NODES) {
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        apply({ node: n.key });
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        {ARCH_NODES.map((n) => (
          <button
            key={n.key}
            className={`chip ${sel.node === n.key ? 'selected' : ''}`}
            onClick={() => apply({ node: n.key })}
          >
            {n.text}
          </button>
        ))}
      </div>
      <div className="chip-row">
        {ARCH_LOSSES.map((l) => (
          <button
            key={l.key}
            className={`chip ${sel.loss === l.key ? 'selected' : ''}`}
            onClick={() => apply({ loss: l.key })}
          >
            {l.text}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};

/* ------------------------------ §8.2 ------------------------------ */

type Variant = 'full' | 'linear' | 'none';
type PredState = { variant: Variant };

const PRED_CHIPS: { key: Variant; text: string }[] = [
  { key: 'full', text: '完整 g' },
  { key: 'linear', text: '去掉非线性' },
  { key: 'none', text: '去掉 g' },
];

// Tab.6：No pred. / Ours 两列真实值（CIFAR100 class-inc 5 tasks，top-1 ↑）。
const PRED_ROWS: { noPred: number; ours: number }[] = [
  { noPred: 52.6, ours: 58.3 },
  { noPred: 57.3, ours: 60.4 },
  { noPred: 58.6, ours: 62.2 },
];

const PRED_FB: Record<Variant, Feedback> = {
  full: { text: '完整预测头在三种方法上都最好。', cls: 'good' },
  linear: {
    text: '去掉 ReLU，SimCLR 在 CIFAR100 五任务上只降 0.3%；另两种方法论文没有报告。',
    cls: '',
    color: C.blue,
  },
  none: { text: '没有 g 相当于强行把两个空间绑在一起。', cls: 'bad' },
};

const PRED_LAYERS = [
  { x: 120, text: '输入' },
  { x: 460, text: '2048' },
  { x: 800, text: '输出' },
];

export const Ch8Predictor: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<PredState>({ variant: 'full' });
  const drawRef = useRef<((s: PredState, t: number) => void) | null>(null);
  const rafRef = useRef<number | null>(null);
  const [variant, setVariant] = useState<Variant>('full');
  const [feedback, setFeedback] = useState<Feedback>(PRED_FB.full);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: PredState, _t: number) => {
      clearScene(ctx, W, H);

      const gray = s.variant === 'none';
      const linkColor =
        s.variant === 'full' ? C.green : s.variant === 'linear' ? C.blue : C.muted;
      const ly = 38;
      const lh = 56;
      const lw = 160;

      for (const l of PRED_LAYERS) {
        drawNode(ctx, l.x, ly, lw, lh, l.text, gray ? 'frozen' : 'idle');
      }
      drawArrow(ctx, 280, 66, 460, 66, gray ? C.muted : linkColor, gray ? 2 : 3);
      drawArrow(ctx, 620, 66, 800, 66, gray ? C.muted : linkColor, gray ? 2 : 3);

      // 中间层标记：完整 g 为 ReLU 折线，去掉非线性后为直线
      const gx = 540;
      const gy = 110;
      ctx.save();
      ctx.strokeStyle = gray ? C.muted : linkColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      if (s.variant === 'full') {
        ctx.moveTo(gx - 18, gy + 7);
        ctx.lineTo(gx - 4, gy + 7);
        ctx.lineTo(gx + 18, gy - 7);
      } else {
        ctx.moveTo(gx - 18, gy + 7);
        ctx.lineTo(gx + 18, gy - 7);
      }
      ctx.stroke();
      ctx.restore();

      // 下：真实数值。行名写在左侧，避免读者去猜哪一行是哪种方法。
      const rows = [178, 210, 242];
      ['SimCLR', 'Barlow Twins', 'BYOL'].forEach((n, i) =>
        label(ctx, n, 150, rows[i] + 15, 11, C.muted, 'right')
      );
      if (s.variant === 'linear') {
        // 论文只报了 SimCLR 的 −0.3%，另外两种方法没有对应结果，
        // 所以这里不能沿用完整 g 的柱值。
        label(ctx, '相对完整 g', 765, 158, 12, C.blue, 'center');
        label(ctx, '−0.3', 765, rows[0] + 15, 15, C.blue, 'center');
        label(ctx, '未报告', 765, rows[1] + 15, 11, C.muted, 'center');
        label(ctx, '未报告', 765, rows[2] + 15, 11, C.muted, 'center');
      } else {
        const leftColor = s.variant === 'none' ? C.red : C.muted;
        label(ctx, '无 g', 325, 158, 13, leftColor, 'center');
        label(ctx, '完整 g', 765, 158, 13, C.green, 'center');
        PRED_ROWS.forEach((r, i) => {
          bar(ctx, 160, rows[i], 330, 22, r.noPred, 70, leftColor, r.noPred.toFixed(1));
          bar(ctx, 600, rows[i], 330, 22, r.ours, 70, C.green, r.ours.toFixed(1));
        });
      }
    };

    drawRef.current = render;
    render(stateRef.current, 0);
    canvas.classList.add('is-ready');

    const tick = (time: number) => {
      render(stateRef.current, time);
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
      drawRef.current = null;
    };
  }, []);

  const select = (v: Variant) => {
    stateRef.current = { variant: v };
    setVariant(v);
    setFeedback(PRED_FB[v]);
    drawRef.current?.(stateRef.current, 0);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {PRED_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`chip ${variant === c.key ? 'selected' : ''}`}
            onClick={() => select(c.key)}
          >
            {c.text}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`} style={feedbackStyle(feedback)}>
        {feedback.text}
      </div>
    </div>
  );
};
