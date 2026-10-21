import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 9.2 扰动实验：横轴「扰动强度σ」（对数映射 σ = 10^(2·pos−1)，0.1..10），
// 纵轴「得分」。三条曲线（对应论文 Figure 3C）：均匀扰动（黑，最伤性能）、
// 逆 Fisher（蓝，最稳）、零空间（橙，按论文原文与逆 Fisher 效果相同——
// 本应无害却同样掉分，说明低估了参数不确定性）。橙色竖线为当前标记，
// 拖动（pointer capture + clamp）+ 方向键微调。

const W = 1080;
const H = 280;
const PLOT = { left: 96, right: 1008, top: 48, bottom: 216 };

const DARK = '#21324a';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const AXIS = '#d7deea';
const MUTED = '#68778f';

const sigmaOf = (pos: number): number => Math.pow(10, 2 * pos - 1); // 0.1 .. 10

// 三条曲线（方向性示意；相对次序按论文 Figure 3C 固定：均匀最伤，
// 零空间与逆 Fisher 效果接近——论文原文“perturbing in this space (orange)
// has the same effect as perturbing in the inverse Fisher space”）
const scoreUniform = (pos: number): number => 1 - 0.72 * Math.pow(pos, 1.1);
const scoreNull = (pos: number): number => 1 - 0.20 * Math.pow(pos, 1.4);
const scoreInv = (pos: number): number => 1 - 0.15 * Math.pow(pos, 1.4);

export const Ch9Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ pos: 0, dragging: false });
  const [sigma, setSigma] = useState(0.1);
  const [feedback, setFeedback] = useState({
    text: '拖动扰动强度，看哪条曲线先掉下来。',
    cls: '',
  });

  const applyPos = (pos: number): void => {
    const p = clamp(pos, 0, 1);
    stateRef.current.pos = p;
    const s = sigmaOf(p);
    setSigma(s);
    setFeedback(
      s < 0.3
        ? { text: '扰动还小，三种方向得分都还稳定。', cls: '' }
        : s <= 0.7
        ? { text: '逆 Fisher 方向最稳：对角 Fisher 确实抓住了最重要的方向。', cls: 'good' }
        : {
            text: '零空间方向也明显掉分——说明当前实现低估了参数不确定性，这是 EWC 的主要局限。',
            cls: 'bad',
          }
    );
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

    const xOf = (u: number): number => PLOT.left + u * (PLOT.right - PLOT.left);
    const yOf = (v: number): number => PLOT.bottom - v * (PLOT.bottom - PLOT.top);

    const drawCurve = (fn: (u: number) => number, color: string, width: number): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) {
        const u = i / 80;
        const x = xOf(u);
        const y = yOf(fn(u));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const render = (s: typeof stateRef.current): void => {
      const pos = s.pos;
      const sx = xOf(pos);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // 网格 + 坐标轴
      ctx.strokeStyle = 'rgba(215,222,234,0.55)';
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75, 1].forEach((v) => {
        const y = yOf(v);
        ctx.beginPath();
        ctx.moveTo(PLOT.left, y);
        ctx.lineTo(PLOT.right, y);
        ctx.stroke();
      });
      ctx.strokeStyle = AXIS;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(PLOT.left, PLOT.bottom);
      ctx.lineTo(PLOT.right, PLOT.bottom);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(PLOT.left, PLOT.top);
      ctx.lineTo(PLOT.left, PLOT.bottom);
      ctx.stroke();

      // x 轴对数刻度（裸数字 0.1 / 1 / 10）
      ctx.fillStyle = MUTED;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('0.1', xOf(0), PLOT.bottom + 8);
      ctx.fillText('1', xOf(0.5), PLOT.bottom + 8);
      ctx.fillText('10', xOf(1), PLOT.bottom + 8);
      // y 轴刻度
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText('0', PLOT.left - 8, yOf(0));
      ctx.fillText('0.5', PLOT.left - 8, yOf(0.5));
      ctx.fillText('1', PLOT.left - 8, yOf(1));

      // 曲线：均匀（黑）、逆Fisher（蓝）、零空间（橙）
      drawCurve(scoreUniform, DARK, 2.6);
      drawCurve(scoreNull, ORANGE, 2.6);
      drawCurve(scoreInv, BLUE, 2.6);

      // 当前 σ 橙色竖线 + 三个交点 + 三个裸数字得分
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(sx, PLOT.top - 4);
      ctx.lineTo(sx, PLOT.bottom);
      ctx.stroke();
      ctx.setLineDash([]);

      const rows = [
        { fn: scoreUniform, color: DARK },
        { fn: scoreInv, color: BLUE },
        { fn: scoreNull, color: ORANGE },
      ];
      rows.forEach((r) => {
        const y = yOf(r.fn(pos));
        ctx.fillStyle = r.color;
        ctx.beginPath();
        ctx.arc(sx, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '600 15px "Segoe UI", sans-serif';
        ctx.textAlign = pos < 0.5 ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(r.fn(pos).toFixed(2), pos < 0.5 ? sx + 12 : sx - 12, y);
      });

      // 轴标签（2 个，≤8 字）
      ctx.fillStyle = DARK;
      ctx.font = '600 15px "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('扰动强度σ', (PLOT.left + PLOT.right) / 2, PLOT.bottom + 34);
      ctx.save();
      ctx.translate(28, (PLOT.top + PLOT.bottom) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('得分', 0, 0);
      ctx.restore();

      // 图例（3 项）
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      const legend = [
        { label: '均匀', color: DARK },
        { label: '逆Fisher', color: BLUE },
        { label: '零空间', color: ORANGE },
      ];
      legend.forEach((item, i) => {
        const lx = 790 + i * 100;
        const ly = 22;
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(lx, ly);
        ctx.lineTo(lx + 16, ly);
        ctx.stroke();
        ctx.fillStyle = DARK;
        ctx.fillText(item.label, lx + 22, ly);
      });
    };

    const tick = (): void => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const posFromEvent = (e: React.PointerEvent<HTMLCanvasElement>): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    return clamp((e.clientX - rect.left) / rect.width, 0, 1);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    stateRef.current.dragging = true;
    applyPos(posFromEvent(e));
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!stateRef.current.dragging) return;
    applyPos(posFromEvent(e));
  };
  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    stateRef.current.dragging = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation(); // 避免触发 App 的章节翻页快捷键
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      applyPos(stateRef.current.pos + dir * 0.03);
    }
  };

  return (
    <div tabIndex={0} onKeyDown={onKeyDown} aria-label="扰动强度调节">
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'grab', touchAction: 'none' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      />
      <div className="ctrl">
        <label>
          扰动强度σ <span className="val">{sigma.toFixed(2)}</span>
        </label>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod2;
