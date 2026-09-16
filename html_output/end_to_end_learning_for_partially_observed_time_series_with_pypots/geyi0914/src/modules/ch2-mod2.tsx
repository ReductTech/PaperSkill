import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §2 Module 2.2 — 拖动覆盖率标尺：只有人工缺失的位置有真值，天然缺失永远无法评估。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const RED = '#c43f52';
const GREEN = '#228d5c';
const BORDER = '#d7deea';

const AXIS_X = 70;
const AXIS_W = 940;
const STEPS = 48;

type Scope = 'artificial' | 'natural' | 'all';

// deterministic three-state layout over the 48 steps
const STATE: ("observed" | "artificial" | "natural")[] = Array.from({ length: STEPS }, (_, i) => {
  if (i % 7 === 3 || i % 11 === 5) return 'artificial';
  if (i % 5 === 2) return 'natural';
  return 'observed';
});

const COUNTS = {
  observed: STATE.filter((s) => s === 'observed').length,
  artificial: STATE.filter((s) => s === 'artificial').length,
  natural: STATE.filter((s) => s === 'natural').length,
};

export const Ch2Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ scope: 'artificial' as Scope, lineX: 0 });
  const draggingRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const [scope, setScope] = useState<Scope>('artificial');
  const [lineX, setLineX] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '只有人工注入的缺失才有真值——这也是可复现 benchmark 必须先"造缺失"的原因。',
    cls: 'good',
  });

  const applyScope = (s: Scope) => {
    stateRef.current.scope = s;
    setScope(s);
    if (s === 'natural')
      setFeedback({
        text: '天然缺失没有真值：这里的误差永远算不出来，指标会是空的。',
        cls: 'bad',
      });
    else if (s === 'artificial')
      setFeedback({
        text: '只有人工注入的缺失才有真值——这也是可复现 benchmark 必须先"造缺失"的原因。',
        cls: 'good',
      });
    else
      setFeedback({
        text: '把两类混在一起统计，会把无法评估的位置也算进分母，指标会被稀释。',
        cls: '',
      });
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

    const render = (s: { scope: Scope; lineX: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 244, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 244);
      ctx.lineTo(W, 244);
      ctx.stroke();

      // time axis
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(AXIS_X, 96);
      ctx.lineTo(AXIS_X + AXIS_W, 96);
      ctx.stroke();

      // three-state band: each step is a short segment
      const sw = AXIS_W / STEPS;
      for (let i = 0; i < STEPS; i++) {
        const st = STATE[i];
        ctx.fillStyle = st === 'natural' ? '#f0f0ec' : st === 'artificial' ? '#fde8dc' : '#e4ebf5';
        ctx.fillRect(AXIS_X + i * sw, 108, Math.max(1, sw - 1), 16);
        ctx.fillStyle = st === 'natural' ? RED : st === 'artificial' ? '#f07e47' : BLUE;
        ctx.fillRect(AXIS_X + i * sw, 128, Math.max(1, sw - 1), 4);
      }

      // scoring band: length depends on the chosen scope
      const eligible = s.scope === 'artificial' ? COUNTS.artificial : s.scope === 'natural' ? COUNTS.natural : STEPS;
      ctx.fillStyle = 'rgba(34,141,92,0.30)';
      ctx.fillRect(AXIS_X, 150, (eligible / STEPS) * AXIS_W, 14);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 2;
      ctx.strokeRect(AXIS_X, 150, (eligible / STEPS) * AXIS_W, 14);

      // coverage ruler
      const lx = AXIS_X + s.lineX * AXIS_W;
      ctx.strokeStyle = '#f07e47';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(lx, 100);
      ctx.lineTo(lx, 172);
      ctx.stroke();
      ctx.fillStyle = '#f07e47';
      ctx.beginPath();
      ctx.moveTo(lx - 7, 100);
      ctx.lineTo(lx + 7, 100);
      ctx.lineTo(lx, 90);
      ctx.closePath();
      ctx.fill();

      // inset
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(70, 190, 940, 46);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(70, 190, 940, 46);
      const scanned = Math.round(s.lineX * STEPS);
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(`已扫描 ${scanned} / ${STEPS} 步`, 86, 220);
      ctx.fillStyle = '#68778f';
      ctx.fillText(
        `有真值 ${COUNTS.artificial}　无真值 ${COUNTS.natural}　已观测 ${COUNTS.observed}`,
        300,
        220
      );

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 16px "Segoe UI", sans-serif';
      ctx.fillText('评分口径', 70, 48);
      ctx.fillText(
        s.scope === 'artificial' ? '人工缺失' : s.scope === 'natural' ? '天然缺失' : '全部位置',
        170,
        48
      );

      // legend
      const legend: { color: string; text: string }[] = [
        { color: BLUE, text: '已观测' },
        { color: '#f07e47', text: '有真值' },
        { color: RED, text: '无真值' },
      ];
      ctx.font = '13px "Segoe UI", sans-serif';
      legend.forEach((item, i) => {
        const px = 700 + i * 120;
        ctx.fillStyle = item.color;
        ctx.fillRect(px, 252, 14, 10);
        ctx.fillStyle = '#68778f';
        ctx.fillText(item.text, px + 20, 262);
      });
    };

    const tick = () => {
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

  const moveTo = (clientX: number, target: HTMLCanvasElement) => {
    const rect = target.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const next = clamp((x - AXIS_X) / AXIS_W, 0, 1);
    stateRef.current.lineX = next;
    setLineX(next);
  };

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* best-effort */
    }
    moveTo(e.clientX, e.currentTarget);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    moveTo(e.clientX, e.currentTarget);
  };
  const onUp = () => {
    draggingRef.current = false;
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
      />
      <div className="chip-row">
        <button
          type="button"
          className={`chip ${scope === 'artificial' ? 'selected' : ''}`}
          onClick={() => applyScope('artificial')}
        >
          只看人工缺失
        </button>
        <button
          type="button"
          className={`chip ${scope === 'natural' ? 'selected' : ''}`}
          onClick={() => applyScope('natural')}
        >
          只看天然缺失
        </button>
        <button
          type="button"
          className={`chip ${scope === 'all' ? 'selected' : ''}`}
          onClick={() => applyScope('all')}
        >
          全部位置
        </button>
      </div>
      <div className="ctrl">
        <label>
          覆盖率标尺 <span className="val">{Math.round(lineX * 100)}%</span>
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(lineX * 100)}
          onChange={(e) => {
            const next = clamp(Number(e.target.value) / 100, 0, 1);
            stateRef.current.lineX = next;
            setLineX(next);
          }}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod2;
