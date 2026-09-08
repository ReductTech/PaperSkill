import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const C = {
  scene: '#f5f8f0', shelf: '#b8c9a7', shelfDark: '#76906a', wood: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea',
};
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clearScene(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = C.scene; ctx.fillRect(0, 0, w, h);
}
function drawSceneLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string, color = C.ink) {
  ctx.fillStyle = color; ctx.font = '13px "Segoe UI", sans-serif'; ctx.fillText(text, x, y);
}
function drawLegend(ctx: CanvasRenderingContext2D, x: number, y: number, items: Array<[string, string]>) {
  items.forEach(([color, label], i) => {
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x + i * 96, y + 4, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '11px "Segoe UI", sans-serif'; ctx.fillText(label, x + i * 96 + 9, y + 8);
  });
}

const W = 560, H = 250;
const N = 8;
// HiPPO-LegS 风格的下三角矩阵：对角强、越往下三角内部越弱（示意）
const hipIntensity = (i: number, j: number): number => {
  if (i === j) return 0.92;
  if (i > j) return 0.12 + 0.58 * (1 - (i - j) / N);
  return 0;
};
const rndIntensity = (i: number, j: number): number => {
  const v = Math.abs(Math.sin(i * 3.7 + j * 5.3) * 43758.5453);
  return v - Math.floor(v);
};
// 记忆保留：A 决定隐状态能记得多远
const memHip = (i: number) => Math.exp(-0.07 * i);   // 长程：慢慢淡出
const memRnd = (i: number) => Math.exp(-0.55 * i);   // 短程：几步就忘光

export const SsmHip: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ init: 'hippo' as 'hippo' | 'rnd' });
  const rafRef = useRef<number | null>(null);
  const [init, setInit] = useState<'hippo' | 'rnd'>('hippo');
  const [feedback, setFeedback] = useState({
    text: 'A 矩阵决定隐状态的演化方式。先观察 HiPPO：隐状态能够保留长程历史。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    const render = (s: { init: 'hippo' | 'rnd' }) => {
      clearScene(ctx, W, H);
      const hippo = s.init === 'hippo';

      // ---- 左：A 矩阵热力图 ----
      drawSceneLabel(ctx, 22, 20, hippo ? 'A ← HiPPO（Legendre 多项式）' : 'A ← 随机初始化', C.ink);
      const cell = 10, gap = 2, mx = 24, my = 30, pitch = cell + gap;
      for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
          const v = hippo ? hipIntensity(i, j) : rndIntensity(i, j);
          ctx.fillStyle = v < 0.03 ? '#e6ecdc' : lerpColor('#e6ecdc', C.blue, v);
          ctx.fillRect(mx + j * pitch, my + i * pitch, cell, cell);
        }
      }
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.strokeRect(mx - 1, my - 1, N * pitch + 1, N * pitch + 1);
      drawSceneLabel(ctx, 24, my + N * pitch + 16, 'A 矩阵（8×8）', C.muted);

      // ---- 右：记忆保留曲线 ----
      const x0 = 300, x1 = 540, yTop = 118, yBase = 210;
      const X = (i: number) => x0 + (i / N) * (x1 - x0);
      const plot = (arr: number[], color: string, w: number) => {
        ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath();
        for (let i = 0; i <= N; i++) {
          const px = X(i), py = yBase - arr[i] * (yBase - yTop);
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
      };
      drawSceneLabel(ctx, x0, 108, '隐状态还能记住多远', C.muted);
      const arr = Array.from({ length: N + 1 }, (_, i) => (hippo ? memHip(i) : memRnd(i)));
      const ref = Array.from({ length: N + 1 }, (_, i) => (hippo ? memRnd(i) : memHip(i)));
      ctx.setLineDash([4, 4]);
      plot(ref, 'rgba(104,119,143,0.6)', 1.4);
      ctx.setLineDash([]);
      plot(arr, hippo ? C.blue : C.red, 2.4);
      ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x0, yBase); ctx.lineTo(x1, yBase); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x0, yTop); ctx.lineTo(x0, yBase); ctx.stroke();
      for (let i = 0; i <= N; i++) {
        ctx.fillStyle = C.muted; ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(String(i), X(i) - 3, yBase + 14);
      }
      drawLegend(ctx, x0, yBase + 24, [[hippo ? C.blue : C.red, hippo ? 'HiPPO' : '随机'], ['rgba(104,119,143,0.6)', hippo ? '随机' : 'HiPPO']]);

      // ---- 底部一句话结论 ----
      if (hippo) {
        drawSceneLabel(ctx, 24, 242, 'HiPPO：长程记忆留得住', C.green);
      } else {
        drawSceneLabel(ctx, 24, 242, '随机：几步就忘光', C.red);
      }
    };
    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const changeInit = (m: 'hippo' | 'rnd') => {
    stateRef.current.init = m; setInit(m);
    setFeedback(
      m === 'hippo'
        ? { text: 'A 以 HiPPO 矩阵初始化：隐状态将历史按 Legendre 多项式投影，长程信息得以保留，这是 SSM 处理长序列的基础。', cls: 'good' }
        : { text: '若改用随机初始化，隐状态记忆迅速衰减至零：历史信息几乎无法保留，长序列建模显著退化。', cls: 'bad' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button type="button" className={`chip ${init === 'hippo' ? 'selected' : ''}`} onClick={() => changeInit('hippo')}>
          HiPPO 初始化
        </button>
        <button type="button" className={`chip ${init === 'rnd' ? 'selected' : ''}`} onClick={() => changeInit('rnd')}>
          随机初始化
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
