import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 2.1（主题侧 · 方案 A1「摊开子树再平均」）
// 命题：s(d,c) 不能只拿 c 这一个标签算 —— 要把以 c 为根的整棵子树摊开，逐个子节点并入，最后取平均。
// 画面：文档 d → 主题 c → 摊开 4 个子节点（各带 cos），底部算式逐项亮起 + 两条对照条。
// 自包含：只 import react 与 ../lib/canvasKit，export React.FC<WidgetProps>。

const W = 1080;
const H = 440;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const C_SELF = 0.41;
const SUBS = [
  { name: '信息检索', cos: 0.72 },
  { name: '自然语言', cos: 0.7 },
  { name: '推荐系统', cos: 0.68 },
  { name: '计算机视觉', cos: 0.49 },
];
const ITEMS = [C_SELF, ...SUBS.map((s) => s.cos)];
const SUM_ALL = ITEMS.reduce((a, b) => a + b, 0); // 3.00
const FULL_AVG = SUM_ALL / ITEMS.length; // 0.60

const SUB_CX = [320, 480, 640, 800];
const SUB_TOP = 182;
const SUB_W = 152;
const SUB_H = 52;

const BAR_X = 300;
const BAR_W = 620;
const BAR_H = 16;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  color: string,
  size: number,
  align: CanvasTextAlign = 'left',
  bold = false
) {
  ctx.textAlign = align;
  ctx.fillStyle = color;
  ctx.font = `${bold ? '600 ' : ''}${size}px ${SANS}`;
  ctx.fillText(s, x, y);
  ctx.textAlign = 'left';
}

export const Ch2Subtree: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const mergedRef = useRef(0);
  const holdRef = useRef(800);
  const autoRef = useRef(true);
  const [merged, setMerged] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(now - last, 90);
      last = now;

      if (autoRef.current) {
        holdRef.current -= dt;
        if (holdRef.current <= 0) {
          const n = mergedRef.current + 1;
          if (n > SUBS.length) {
            mergedRef.current = 0;
            holdRef.current = 1600;
          } else {
            mergedRef.current = n;
            holdRef.current = n === SUBS.length ? 2600 : 950;
          }
          setMerged(mergedRef.current);
        }
      }

      const m = mergedRef.current; // 已并入的子节点数 0..4
      let sum = C_SELF;
      for (let i = 0; i < m; i++) sum += SUBS[i].cos;
      const denom = 1 + m;
      const avg = sum / denom;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── c 的子节点连线（已并入的加粗着色）
      SUBS.forEach((_, i) => {
        const on = i < m;
        ctx.strokeStyle = on ? '#7fb2e0' : '#cfd8e2';
        ctx.lineWidth = on ? 2.4 : 1.2;
        if (!on) ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(540, 90);
        ctx.lineTo(SUB_CX[i], SUB_TOP);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── d → c 的标签相似度（虚线）
      ctx.setLineDash([6, 5]);
      ctx.strokeStyle = '#b9c2cc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(172, 146);
      ctx.lineTo(440, 66);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'cos(e_d, e_c) = 0.41', 190, 96, '#8a8780', 13);

      // ── 文档 d
      roundRect(ctx, 56, 120, 116, 56, 9);
      ctx.fillStyle = '#f1efe8';
      ctx.fill();
      ctx.strokeStyle = '#a8a49b';
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, '文档 d', 114, 145, '#4b4a45', 15, 'center');
      text(ctx, 'BERT 向量', 114, 165, '#7a776e', 12.5, 'center');

      // ── 主题节点 c
      text(ctx, '主题节点 c', 540, 22, '#8a8780', 13, 'center');
      roundRect(ctx, 440, 34, 200, 54, 9);
      ctx.fillStyle = '#e6f1fb';
      ctx.fill();
      ctx.strokeStyle = '#185fa5';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      text(ctx, '机器学习', 540, 68, '#0c447c', 17, 'center', true);

      // ── 子节点
      SUBS.forEach((s, i) => {
        const on = i < m;
        const x = SUB_CX[i] - SUB_W / 2;
        roundRect(ctx, x, SUB_TOP, SUB_W, SUB_H, 9);
        ctx.fillStyle = on ? '#e6f1fb' : '#fbfcfe';
        ctx.fill();
        ctx.strokeStyle = on ? '#185fa5' : '#cfd8e2';
        ctx.lineWidth = on ? 1.6 : 1;
        ctx.stroke();
        text(ctx, s.name, SUB_CX[i], SUB_TOP + 32, on ? '#0c447c' : '#9aa3ae', 15, 'center');
        text(
          ctx,
          `cos ${s.cos.toFixed(2)}`,
          SUB_CX[i],
          SUB_TOP - 10,
          on ? '#185fa5' : '#b6bec8',
          13,
          'center'
        );
      });

      // ── 分隔线
      ctx.strokeStyle = '#dfe5ee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(56, 264);
      ctx.lineTo(1024, 264);
      ctx.stroke();

      // ── 算式行一：逐项并入
      let x = 56;
      text(ctx, 'Σ cos(e_d, e_j)  =  ', x, 296, '#5c5a52', 15);
      x += ctx.measureText('Σ cos(e_d, e_j)  =  ').width;
      ITEMS.forEach((v, i) => {
        const on = i === 0 ? true : i - 1 < m;
        const piece = v.toFixed(2) + (i < ITEMS.length - 1 ? '  +  ' : '');
        ctx.fillStyle = on ? '#0c447c' : '#c8cfd8';
        ctx.font = `15px ${SANS}`;
        ctx.fillText(piece, x, 296);
        x += ctx.measureText(piece).width;
      });
      ctx.fillStyle = '#5c5a52';
      ctx.font = `15px ${SANS}`;
      ctx.fillText(`  =  ${sum.toFixed(2)}`, x, 296);

      // ── 算式行二：除以 |N_c| 取平均
      text(
        ctx,
        `s(d,c) = ${sum.toFixed(2)} / ${denom} = ${avg.toFixed(2)}`,
        56,
        324,
        '#0c447c',
        16,
        'left',
        true
      );
      text(ctx, '（|N_c| = 5，含 c 自己）', 330, 324, '#8a8780', 13.5);

      // ── 对照条一：只用 c 自己的标签
      text(ctx, '只用 c 自己的标签', 56, 353, '#5c5a52', 14.5);
      roundRect(ctx, BAR_X, 340, C_SELF * BAR_W, BAR_H, 6);
      ctx.fillStyle = '#b5d4f4';
      ctx.fill();
      text(ctx, C_SELF.toFixed(2), BAR_X + C_SELF * BAR_W + 10, 353, '#185fa5', 14.5);

      // ── 对照条二：整棵子树平均
      text(ctx, '整棵子树平均', 56, 389, '#5c5a52', 14.5);
      roundRect(ctx, BAR_X, 376, avg * BAR_W, BAR_H, 6);
      ctx.fillStyle = '#378add';
      ctx.fill();
      text(ctx, avg.toFixed(2), BAR_X + avg * BAR_W + 10, 389, '#185fa5', 14.5);

      // ── 脚注
      text(
        ctx,
        `不除 |N_c|，加数越多分越高，浅层小节点与深层大节点就没法比；除完，才落在同一把尺子上（目标 ${FULL_AVG.toFixed(
          2
        )}）。`,
        56,
        422,
        '#8a8780',
        13
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const startLoop = () => {
      if (!rafRef.current) {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    const disconnect = observeCanvas(canvas, startLoop, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onToggle = () => {
    const next = !auto;
    setAuto(next);
    autoRef.current = next;
    holdRef.current = next ? 320 : 1e9;
  };

  const onReset = () => {
    mergedRef.current = 0;
    setMerged(0);
    holdRef.current = 900;
  };

  const avgNow =
    (C_SELF + SUBS.slice(0, merged).reduce((a, s) => a + s.cos, 0)) / (1 + merged);
  const fb =
    merged === 0
      ? '只看 c 自己那一个标签：0.41。两三个词的标签撑不起整块语义，分数明显偏低。'
      : merged < SUBS.length
        ? `已并入 ${merged} 个子节点：s(d,c) = ${avgNow.toFixed(2)}。`
        : `整棵子树（含 c 自己共 5 个节点）取平均：${avgNow.toFixed(2)}。分数被抬起来，也稳住了。`;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button type="button" onClick={onToggle}>
          {auto ? '暂停自动演示' : '继续自动演示'}
        </button>
        <button type="button" onClick={onReset}>
          重新演示
        </button>
      </div>
      <div className={`feedback ${merged === SUBS.length ? 'good' : ''}`}>{fb}</div>
    </div>
  );
};
