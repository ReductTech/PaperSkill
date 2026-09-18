import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, map } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', orange: '#f07e47', purple: '#7c3aed',
  text: '#21324a', muted: '#68778f', border: '#d7deea', red: '#c43f52',
};

/** P1：n_max 滑块 + 可选 n_min 风格模式芯片 */
export const Ch9Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ nMax: 33, styleOn: false, T: 50 });
  const rafRef = useRef<number | null>(null);
  const [nMax, setNMax] = useState(33);
  const [styleOn, setStyleOn] = useState(false);
  const [feedback, setFeedback] = useState({
    text: 'n_max≈33（SD3 常用）：跳过早期步，编辑更稳。',
    cls: 'good',
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

    const render = () => {
      const { nMax: nm, styleOn: st, T } = stateRef.current;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(50, 40, W - 100, H - 80);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(50, 40, W - 100, H - 80);

      // timeline T
      const x0 = 120;
      const x1 = 920;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0, 120);
      ctx.lineTo(x1, 120);
      ctx.stroke();

      const cut = map(nm, 0, T, x0, x1);
      ctx.strokeStyle = C.muted;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x0, 120);
      ctx.lineTo(cut, 120);
      ctx.stroke();
      ctx.strokeStyle = C.green;
      ctx.beginPath();
      ctx.moveTo(cut, 120);
      ctx.lineTo(x1, 120);
      ctx.stroke();

      // aperture dial on photo
      const cx = 280;
      const cy = 200;
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(cx - 40, cy - 32, 80, 64);
      ctx.strokeRect(cx - 40, cy - 32, 80, 64);
      const ang = map(nm, 0, T, 0.2, Math.PI * 1.8);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.beginPath();
      ctx.arc(cx, cy, 18, -Math.PI / 2, -Math.PI / 2 + ang);
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('跳过', x0, 100);
      ctx.fillText('FlowEdit 段', cut + 8, 100);
      ctx.fillText('n_max = ' + nm, 420, 200);
      if (st) {
        ctx.fillStyle = C.purple;
        ctx.fillText('风格模式：早期跟 Vtar（n_min）', 420, 230);
      }
      canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const off = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      off();
    };
  }, []);

  const updateFb = (nm: number, st: boolean) => {
    if (st) {
      setFeedback({ text: '开启 n_min 风格模式：早期更跟目标提示。', cls: '' });
    } else if (nm >= 28 && nm <= 38) {
      setFeedback({ text: 'n_max 适中：结构与编辑强度较平衡。', cls: 'good' });
    } else if (nm < 15) {
      setFeedback({ text: 'n_max 过小：编辑太弱，几乎不改。', cls: 'bad' });
    } else {
      setFeedback({ text: 'n_max 很大：接近完整路径，改动更强。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          n_max <span className="val">{nMax}</span>
        </label>
        <input
          type="range"
          min={0}
          max={50}
          value={nMax}
          onChange={(e) => {
            const v = clamp(Number(e.target.value), 0, 50);
            setNMax(v);
            stateRef.current.nMax = v;
            updateFb(v, styleOn);
          }}
        />
        <button
          type="button"
          className={`chip${styleOn ? ' selected' : ''}`}
          aria-pressed={styleOn}
          onClick={() => {
            const v = !styleOn;
            setStyleOn(v);
            stateRef.current.styleOn = v;
            updateFb(nMax, v);
          }}
        >
          n_min 风格
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch9Mod1;
