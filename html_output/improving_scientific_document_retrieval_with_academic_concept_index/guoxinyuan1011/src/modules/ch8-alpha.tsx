import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 模块 5.3（融合打分 · §5.3）
// 命题：rel = (1−α)·sim(q_test, d) + α·sim(q_test, s*_d) —— 全局信号与片段信号按 α 加权合成。
//       α 的两端都更差，最优落在中间：只用全局等于放弃概念聚焦，只用片段等于放弃整篇语境。
// 画面：左 = 两个信号条（全局 0.33 / 片段 0.52）+ α 的权重分配条；中 = rel 随 α 的曲线；右 = 读数。
// 自包含：只 import react 与 ../lib/canvasKit。

const W = 1080;
const H = 320;
const SANS = '"Segoe UI", "Microsoft YaHei", sans-serif';

const SIG_GLOBAL = 0.33;
const SIG_SNIP = 0.52;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
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

export const Ch8Alpha: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const alphaRef = useRef(0);
  const [alpha, setAlpha] = useState(0);
  const [feedback, setFeedback] = useState({
    text: 'α = 0：片段信号完全没用上，rel 退化成原检索器的相似度。',
    cls: 'bad',
  });

  const relSchem = (a: number) => 0.3313 + 0.06 * Math.sin(Math.PI * a);

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const a = Number(e.target.value) / 100;
    alphaRef.current = a;
    setAlpha(a);
    if (a === 0)
      setFeedback({
        text: 'α = 0：片段信号完全没用上，rel 退化成原检索器的相似度。',
        cls: 'bad',
      });
    else if (a < 0.4) setFeedback({ text: '片段信号开始参与，但权重还很低。', cls: '' });
    else if (a <= 0.6)
      setFeedback({
        text: '论文在两个数据集上的实现值落在这里（CSFCube α = 0.6 / DORIS-MAE α = 0.4）：两个信号互补。',
        cls: 'good',
      });
    else setFeedback({ text: '片段权重过高，全局信号被挤掉了。', cls: '' });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = () => {
      const a = alphaRef.current;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.textBaseline = 'alphabetic';

      // ── 顶部
      text(ctx, '两个信号按 α 加权合成一个分数', 56, 28, '#4b4a45', 16.5, 'left', true);
      text(ctx, 'rel = (1−α)·全局 + α·片段', 1030, 28, '#8a8780', 14, 'right');

      // ── 左：两个信号
      const LW = 220;
      text(ctx, '两个信号（示意）', 56, 54, '#6b6a63', 13);

      text(ctx, `全局 sim(q_test, d) = ${SIG_GLOBAL.toFixed(2)}`, 56, 76, '#0c447c', 13.5);
      roundRect(ctx, 56, 82, LW * SIG_GLOBAL, 16, 5);
      ctx.fillStyle = '#b5d4f4';
      ctx.fill();

      text(ctx, `片段 sim(q_test, s*_d) = ${SIG_SNIP.toFixed(2)}`, 56, 122, '#166534', 13.5);
      roundRect(ctx, 56, 128, LW * SIG_SNIP, 16, 5);
      ctx.fillStyle = '#86d0a5';
      ctx.fill();

      text(ctx, '片段信号更高：它没被整篇文档稀释', 56, 164, '#8a8780', 13);

      // 分隔线
      ctx.strokeStyle = '#dfe5ee';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(56, 178);
      ctx.lineTo(400, 178);
      ctx.stroke();

      // ── 左：α 的权重分配
      text(ctx, 'α 在分配权重', 56, 198, '#6b6a63', 13);
      text(ctx, `(1−α)·全局 = ${(1 - a).toFixed(2)}`, 56, 220, '#0c447c', 13.5);
      roundRect(ctx, 56, 226, Math.max((1 - a) * LW, 2), 14, 5);
      ctx.fillStyle = '#b5d4f4';
      ctx.fill();

      text(ctx, `α·片段 = ${a.toFixed(2)}`, 56, 264, '#166534', 13.5);
      roundRect(ctx, 56, 270, Math.max(a * LW, 2), 14, 5);
      ctx.fillStyle = '#86d0a5';
      ctx.fill();

      // ── 中：rel 曲线
      const r = { x: 430, y: 70, w: 360, h: 160 };
      ctx.strokeStyle = '#c7d0da';
      ctx.lineWidth = 1;
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      text(ctx, 'rel 随 α 变化（机制示意）', r.x, 54, '#6b6a63', 13);

      const fn = (t: number) => (relSchem(t) - 0.3) / 0.1;
      ctx.strokeStyle = '#185fa5';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const N = 96;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const v = clamp(fn(t), 0, 1);
        const x = r.x + t * r.w;
        const y = r.y + (1 - v) * r.h;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // 两处论文实现值
      for (const mk of [0.4, 0.6]) {
        const mx = r.x + mk * r.w;
        ctx.strokeStyle = '#f07e47';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(mx, r.y);
        ctx.lineTo(mx, r.y + r.h);
        ctx.stroke();
        ctx.setLineDash([]);
        text(ctx, mk.toFixed(1), mx, r.y + r.h - 8, '#d9611f', 13, 'center', true);
      }
      text(ctx, '论文实现值', r.x + r.w, r.y - 7, '#d9611f', 13, 'right', true);

      // 当前点
      const cx = r.x + a * r.w;
      const cy = r.y + (1 - clamp(fn(a), 0, 1)) * r.h;
      ctx.fillStyle = '#228d5c';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // 轴标
      text(ctx, 'α = 0', r.x, r.y + r.h + 18, '#8a8780', 13);
      text(ctx, 'α = 1', r.x + r.w - 30, r.y + r.h + 18, '#8a8780', 13);
      text(ctx, 'rel', r.x + 6, r.y + 16, '#8a8780', 13);

      // ── 右：读数
      text(ctx, `α = ${a.toFixed(2)}`, 840, 110, '#21324a', 22, 'left', true);
      text(ctx, `rel ≈ ${relSchem(a).toFixed(4)}`, 840, 142, '#228d5c', 18, 'left', true);
      text(ctx, '（示意值）', 840, 166, '#8a8780', 13);

      ctx.fillStyle = '#f07e47';
      roundRect(ctx, 840, 196, 12, 12, 3);
      ctx.fill();
      text(ctx, '论文实现值 α = 0.4 / 0.6', 858, 207, '#5c5a52', 13.5);

      // ── 脚注
      text(
        ctx,
        '曲线为机制示意，非论文实测曲线；两端更差、最优在中间是论文的结论。',
        56,
        302,
        '#8a8780',
        13
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          片段权重 α <span className="val">{alpha.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(alpha * 100)} onChange={onSlide} />
      </div>
      <div className="note">
        论文两处表述不一致：实现设置 α = 0.6 / 0.4（§6.1.5）；扫描最优区间 α ∈ {'{0.6, 0.8, 1.0}'}（§6.3.4）。曲线与信号值为机制示意。
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
