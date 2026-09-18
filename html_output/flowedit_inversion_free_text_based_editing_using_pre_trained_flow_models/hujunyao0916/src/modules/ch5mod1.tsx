import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  text: '#21324a', muted: '#68778f', border: '#d7deea',
};

/** P1：双 CFG 滑块，反馈失衡 */
export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ src: 3.5, tar: 13.5 });
  const rafRef = useRef<number | null>(null);
  const [src, setSrc] = useState(3.5);
  const [tar, setTar] = useState(13.5);
  const [feedback, setFeedback] = useState({
    text: '推荐 SD3：源 3.5 / 目标 13.5，目标引导更强。',
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
      const { src: s, tar: t } = stateRef.current;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(60, 40, W - 120, H - 80);
      ctx.strokeStyle = C.dark;
      ctx.strokeRect(60, 40, W - 120, H - 80);

      // photo
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(480, 100, 80, 64);
      ctx.strokeRect(480, 100, 80, 64);

      // leashes
      const srcPull = s / 20;
      const tarPull = t / 20;
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 2 + srcPull * 4;
      ctx.beginPath();
      ctx.moveTo(200, 130);
      ctx.lineTo(480, 132);
      ctx.stroke();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2 + tarPull * 4;
      ctx.beginPath();
      ctx.moveTo(840, 130);
      ctx.lineTo(560, 132);
      ctx.stroke();

      ctx.fillStyle = C.blue;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('源 CFG ' + s.toFixed(1), 150, 90);
      ctx.fillStyle = C.orange;
      ctx.fillText('目标 CFG ' + t.toFixed(1), 760, 90);

      // balance meter
      const ratio = t / Math.max(s, 0.1);
      const bal = clamp((ratio - 1) / 5, 0, 1);
      ctx.fillStyle = C.border;
      ctx.fillRect(300, 220, 480, 12);
      ctx.fillStyle = ratio > 5 || ratio < 1.5 ? C.red : C.green;
      ctx.fillRect(300, 220, 480 * bal, 12);
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

  const updateFb = (s: number, t: number) => {
    const r = t / Math.max(s, 0.1);
    if (r > 5 && s >= 2 && s <= 5) {
      setFeedback({ text: '目标引导明显更强，利于语义改写并保结构。', cls: 'good' });
    } else if (t < s) {
      setFeedback({ text: '目标弱于源：编辑力不足，几乎不动。', cls: 'bad' });
    } else if (s > 10 && t > 15) {
      setFeedback({ text: '双侧过强：易过曝或伪影。', cls: 'bad' });
    } else {
      setFeedback({ text: '调整两侧尺度，感受牵引失衡。', cls: '' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          源 CFG <span className="val">{src.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={src}
          onChange={(e) => {
            const v = Number(e.target.value);
            setSrc(v);
            stateRef.current.src = v;
            updateFb(v, tar);
          }}
        />
        <label>
          目标 CFG <span className="val">{tar.toFixed(1)}</span>
        </label>
        <input
          type="range"
          min={1}
          max={20}
          step={0.5}
          value={tar}
          onChange={(e) => {
            const v = Number(e.target.value);
            setTar(v);
            stateRef.current.tar = v;
            updateFb(src, v);
          }}
        />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch5Mod1;
