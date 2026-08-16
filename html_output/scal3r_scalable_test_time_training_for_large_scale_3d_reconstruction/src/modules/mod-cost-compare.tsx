import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 模块 1.2 —— 对比“一次全局 O(N²)”与“分块并行 ≈N”的代价曲线。
const W = 560;
const H = 220;
const N_MIN = 4;
const N_MAX = 64;

type Mode = 'all' | 'chunk';
interface CostState {
  t: number;
  n: number;
  mode: Mode;
}

function drawValley(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f8f0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#b8c9a7';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.quadraticCurveTo(w * 0.3, h * 0.72, w * 0.6, h * 0.84);
  ctx.quadraticCurveTo(w * 0.85, h * 0.92, w, h * 0.8);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

export const ModCostCompare: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<CostState>({ t: 0, n: 8, mode: 'all' });
  const rafRef = useRef<number | null>(null);
  const [n, setN] = useState(8);
  const [mode, setMode] = useState<Mode>('all');
  const [feedback, setFeedback] = useState({
    text: '一次全局：代价≈N²，很快撑爆。切到“分块并行”看看代价怎么变。',
    cls: 'bad',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const padL = 46;
    const padR = 150;
    const padT = 28;
    const padB = 34;
    const x0 = padL;
    const x1 = W - padR;
    const y0 = H - padB;
    const y1 = padT;
    const xOf = (nn: number) => map(nn, N_MIN, N_MAX, x0, x1);
    // 归一：两条曲线共用同一把尺子——以 N_MAX 处的 N²（真实代价量纲）为满量程。
    // 于是 N² 一路冲顶、线性 N 相对之下几乎贴底，正确呈现“平方爆炸 vs 近似线性”。
    const FULL = N_MAX * N_MAX;
    const yRed = (nn: number) => map((nn * nn) / FULL, 0, 1, y0, y1);
    const yBlue = (nn: number) => map(nn / FULL, 0, 1, y0, y1);

    const render = (s: CostState) => {
      ctx.clearRect(0, 0, W, H);
      drawValley(ctx, W, H);

      // 坐标轴
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, y1);
      ctx.lineTo(x0, y0);
      ctx.lineTo(x1, y0);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", system-ui, sans-serif';
      ctx.fillText('代价', x0 - 34, y1 + 6);
      ctx.fillText('帧数 N', x1 - 40, y0 + 22);

      const dim = 'rgba(120,140,170,0.35)';

      // 红曲线 y∝n²
      ctx.strokeStyle = s.mode === 'all' ? '#c43f52' : dim;
      ctx.lineWidth = s.mode === 'all' ? 3 : 2;
      ctx.beginPath();
      for (let nn = N_MIN; nn <= N_MAX; nn++) {
        const px = xOf(nn);
        const py = yRed(nn);
        nn === N_MIN ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 蓝曲线 y∝n
      ctx.strokeStyle = s.mode === 'chunk' ? '#27446e' : dim;
      ctx.lineWidth = s.mode === 'chunk' ? 3 : 2;
      ctx.beginPath();
      for (let nn = N_MIN; nn <= N_MAX; nn++) {
        const px = xOf(nn);
        const py = yBlue(nn);
        nn === N_MIN ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.stroke();

      // 竖直游标随 n（含轻微呼吸动画使其始终有动感）
      const breathe = Math.sin(s.t * 0.08) * 0.4;
      const cursorN = clamp(s.n + breathe, N_MIN, N_MAX);
      const cx = xOf(cursorN);
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(cx, y1);
      ctx.lineTo(cx, y0);
      ctx.stroke();
      ctx.setLineDash([]);

      // 游标与两曲线交点
      const drawDot = (py: number, active: boolean, color: string) => {
        ctx.fillStyle = active ? color : dim;
        ctx.beginPath();
        ctx.arc(cx, py, active ? 5 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      };
      drawDot(yRed(s.n), s.mode === 'all', '#c43f52');
      drawDot(yBlue(s.n), s.mode === 'chunk', '#27446e');

      // 顶部读数（当前方案高亮）
      const costAll = s.n * s.n;
      ctx.font = '13px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = s.mode === 'all' ? '#c43f52' : '#9aa7b8';
      ctx.fillText(`一次全局 ≈ N² = ${costAll}`, x1 + 8, 52);
      ctx.fillStyle = s.mode === 'chunk' ? '#27446e' : '#9aa7b8';
      ctx.fillText(`分块并行 ≈ N = ${s.n}`, x1 + 8, 74);

      // 顶部标题
      ctx.fillStyle = '#21324a';
      ctx.font = '14px "Segoe UI", system-ui, sans-serif';
      ctx.fillText(`N = ${s.n}`, x1 + 8, 28);
    };

    const tick = () => {
      stateRef.current.t += 1;
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const applyMode = (m: Mode) => {
    stateRef.current.mode = m;
    setMode(m);
    if (m === 'all') {
      setFeedback({ text: '一次全局：代价≈N²，很快撑爆。', cls: 'bad' });
    } else {
      setFeedback({ text: '分块并行：代价≈N，可扩展。', cls: '' });
    }
  };

  const onN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), N_MIN, N_MAX);
    stateRef.current.n = v;
    setN(v);
  };

  const opts: { key: Mode; label: string }[] = [
    { key: 'all', label: '一次全局' },
    { key: 'chunk', label: '分块并行' },
  ];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {opts.map((o) => (
          <button
            key={o.key}
            className={`chip ${mode === o.key ? 'selected' : ''}`}
            onClick={() => applyMode(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div className="ctrl">
        <label>
          序列长度 N <span className="val">{n}</span>
        </label>
        <input type="range" min={N_MIN} max={N_MAX} value={n} onChange={onN} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModCostCompare;
