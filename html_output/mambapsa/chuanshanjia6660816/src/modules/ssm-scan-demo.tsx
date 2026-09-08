import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// 跑一次扫描：token 逐个流过，记忆曲线 h_t 实时画出。
// 「普通扫描」让每个 token 都写入记忆；「选择性扫描」只在关键 token 处跃升（Δ 大才更新）。
// 两条曲线用各自的最大值归一化到同一绘图区，形状对比为主；真实峰值在结束语里给出。
const C = {
  scene: '#f5f8f0', blue: '#27446e', orange: '#d97706',
  ink: '#21324a', muted: '#68778f', line: '#d7deea', ghost: 'rgba(104,119,143,0.35)',
};

const N = 20;
const IMPORTANT = new Set<number>([2, 5, 9, 13, 17]);
const VAL = (i: number) => (IMPORTANT.has(i) ? 1.0 : 0.15);
type Mode = 'plain' | 'sel';

function computeCurve(mode: Mode): number[] {
  const h: number[] = [0];
  for (let i = 0; i < N; i++) {
    const v = VAL(i);
    let nh: number;
    if (mode === 'plain') {
      nh = 0.9 * h[i] + v; // 每个 token 一视同仁地写入记忆
    } else {
      const g = IMPORTANT.has(i) ? 0.9 : 0.1; // 选择性：关键 Δ 大，普通 Δ 小
      nh = (1 - g) * h[i] + g * v;
    }
    h.push(clamp(nh, 0, 5));
  }
  return h;
}
const CURVES: Record<Mode, number[]> = {
  plain: computeCurve('plain'),
  sel: computeCurve('sel'),
};
const MAXC: Record<Mode, number> = {
  plain: Math.max(...CURVES.plain),
  sel: Math.max(...CURVES.sel),
};

const W = 560, H = 170;
const PX0 = 36, PX1 = W - 12, PY0 = 16, PY1 = H - 26;
const x = (i: number) => map(i, 0, N, PX0, PX1);
const y = (h: number, mode: Mode) => map(h, 0, MAXC[mode], PY1, PY0);

export const SsmScanDemo: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ mode: 'plain' as Mode, t: 0, running: false, last: 0 });
  const [mode, setMode] = useState<Mode>('plain');
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: Mode; t: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.scene;
      ctx.fillRect(0, 0, W, H);

      // baseline + 轻量横向网格
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PX0, PY1); ctx.lineTo(PX1, PY1); ctx.stroke();
      for (let g = 1; g < 4; g++) {
        const gy = map(g, 0, 4, PY1, PY0);
        ctx.beginPath(); ctx.moveTo(PX0, gy); ctx.lineTo(PX1, gy); ctx.stroke();
      }

      // x 轴刻度
      ctx.fillStyle = C.muted;
      ctx.font = '11px "Segoe UI", sans-serif';
      for (let i = 0; i <= N; i += 5) {
        ctx.fillText(String(i), x(i) - 3, PY1 + 16);
      }
      ctx.fillText('token 位置 →', PX0 - 2, H - 3);
      ctx.fillText('记忆值 h（相对）', PX0 - 2, PY0 - 4);

      const curve = CURVES[s.mode];
      const color = s.mode === 'plain' ? C.blue : C.orange;

      // 未扫描部分的幽灵轨迹（虚线，轻微）
      const startIdx = Math.max(1, s.t);
      ctx.strokeStyle = C.ghost;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let i = startIdx; i <= N; i++) {
        const cx = x(i), cy = y(curve[i], s.mode);
        if (i === startIdx) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // 已扫描部分实线 + 圆点
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 1; i <= s.t; i++) {
        const cx = x(i), cy = y(curve[i], s.mode);
        if (i === 1) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      }
      ctx.stroke();
      for (let i = 1; i <= s.t; i++) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x(i), y(curve[i], s.mode), 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // 扫描游标
      if (s.t > 0 && s.t <= N) {
        ctx.strokeStyle = C.ink;
        ctx.lineWidth = 1.4;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(x(s.t), PY0 - 4);
        ctx.lineTo(x(s.t), PY1);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x(s.t), y(curve[s.t], s.mode), 4, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      const s = stateRef.current;
      const now = performance.now();
      if (s.running) {
        if (now - s.last >= 90) {
          s.last = now;
          if (s.t < N) {
            s.t += 1;
            setT(s.t);
          } else {
            s.running = false;
            setRunning(false);
            setFinished(true);
          }
        }
      }
      render(s);
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

  const switchMode = (m: Mode) => {
    stateRef.current = { mode: m, t: 0, running: false, last: 0 };
    setMode(m);
    setT(0);
    setRunning(false);
    setFinished(false);
  };
  const run = () => {
    if (stateRef.current.running) return;
    stateRef.current = { ...stateRef.current, running: true, last: performance.now() };
    setRunning(true);
    setFinished(false);
  };
  const reset = () => {
    stateRef.current = { ...stateRef.current, t: 0, running: false, last: 0 };
    setT(0);
    setRunning(false);
    setFinished(false);
  };

  const hNow = CURVES[mode][t];
  const doneText =
    mode === 'plain'
      ? `普通扫描：每个 token 都一视同仁地写入记忆，普通内容也把记忆占满（峰值 ${MAXC.plain.toFixed(2)}）——「记得太多」未必是好事。`
      : `选择性扫描：记忆只在关键 token 处跃升（Δ 大才更新），普通 token 几乎不动隐状态（峰值仅 ${MAXC.sel.toFixed(2)}）——只记该记的。`;

  return (
    <div className="scan-demo">
      <div className="scan-tokens">
        {Array.from({ length: N }, (_, i) => (
          <span
            key={i}
            className={`scan-tok ${IMPORTANT.has(i) ? 'imp' : ''} ${i < t ? 'seen' : ''} ${
              i === t && (running || finished) ? 'active' : ''
            }`}
          />
        ))}
      </div>
      <div className="scan-legend">
        <span><span className="dot imp" />关键 token（Δ 大，值得记忆）</span>
        <span><span className="dot ord" />普通 token</span>
      </div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <p className="scan-status">
        {running || finished ? (
          <>
            扫描到第 <b>{t}</b> / {N} 个 token · 记忆值 h = <b>{hNow.toFixed(2)}</b>
          </>
        ) : (
          '点「运行」开始扫描'
        )}
      </p>
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${mode === 'plain' ? 'selected' : ''}`}
          onClick={() => switchMode('plain')}
        >
          普通扫描
        </button>
        <button
          type="button"
          className={`chip ${mode === 'sel' ? 'selected' : ''}`}
          onClick={() => switchMode('sel')}
        >
          选择性扫描
        </button>
      </div>
      <div className="scan-ctrls">
        {!running ? (
          <button type="button" className="tiny" onClick={run}>
            运行 ▶
          </button>
        ) : null}
        {t > 0 || finished ? (
          <button type="button" className="tiny ghost" onClick={reset}>
            ↺ 重置
          </button>
        ) : null}
      </div>
      {finished && <div className="feedback good">{doneText}</div>}
    </div>
  );
};
