import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C,
  clearScene,
  drawRoadH,
  drawCar,
  drawFog,
  drawAlbum,
  drawLighthouse,
  sceneLabel,
  inset,
} from './scene-kit';

const W = 560;
const H = 250;

type Method = 'old' | 'new';

// §1 M1.2 — repair chips: same stress condition, baseline vs InSpatio-World
// (anchor + geometry keeps the scene intact; schematic contrast).
export const M1Repair: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ method: 'old' as Method, dist: 70 });
  const rafRef = useRef<number | null>(null);
  const [method, setMethod] = useState<Method>('old');
  const [dist, setDist] = useState(70);
  const [feedback, setFeedback] = useState({
    text: '基线在 70 距离处已经崩坏。切换到本文方法看看。',
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

    const render = (s: { method: Method; dist: number }, time: number) => {
      const d = clamp(s.dist, 0, 100);
      const isNew = s.method === 'new';
      clearScene(ctx, W, H);
      const roadY = 140;
      const carX = 40 + d * 4.4;
      if (isNew) {
        drawRoadH(ctx, roadY, 16, 540, 24);
        drawLighthouse(ctx, 522, roadY - 14, 1);
        drawAlbum(ctx, 90, 70, 1);
        sceneLabel(ctx, '路书', 76, 96, true, 10);
        ctx.strokeStyle = 'rgba(39,68,110,0.6)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(90, 78);
        ctx.quadraticCurveTo((90 + carX) / 2, 56, carX, roadY - 20);
        ctx.stroke();
        drawCar(ctx, carX, roadY - 2, 0.9, C.blue, Math.sin(time * 0.008) * 0.8);
        if (d >= 95) {
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(500, 60);
          ctx.lineTo(508, 68);
          ctx.lineTo(522, 50);
          ctx.stroke();
        }
      } else {
        drawRoadH(ctx, roadY, 16, Math.max(carX, 16), 24);
        const wav = (d / 100) * 10;
        const alpha = Math.max(0.25, 1 - d / 110);
        ctx.strokeStyle = `rgba(146,64,14,${alpha})`;
        ctx.lineWidth = 2;
        for (const sign of [-1, 1]) {
          ctx.beginPath();
          for (let x = carX; x <= 540; x += 6) {
            const y =
              roadY + sign * 12 + Math.sin(x * 0.08 + time * 0.002) * wav * ((x - carX) / 500);
            if (x === carX) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        if (d >= 60) {
          ctx.fillStyle = C.bg;
          for (let g = 0; g < 3; g++) {
            ctx.fillRect(carX + 60 + g * 90, roadY - 16, 26 + g * 6, 32);
          }
        }
        drawFog(ctx, carX + 40, W, 40, H - 90, (d / 140) * 1.1);
        drawCar(ctx, carX, roadY - 2, 0.9, d >= 60 ? C.red : C.blue, Math.sin(time * 0.008) * 0.8);
      }
      sceneLabel(ctx, isNew ? 'InSpatio-World' : '无记忆基线', 20, 26, false, 12);
      // error curve inset: flat green (new) vs convex red (old)
      inset(ctx, 330, 16, 210, 84);
      sceneLabel(ctx, '漂移误差（示意）', 338, 32, true, 10);
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(342, 90);
      ctx.lineTo(532, 90);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isNew ? C.green : d >= 60 ? C.red : C.blue;
      ctx.beginPath();
      for (let x = 0; x <= 100; x += 2) {
        const px = 342 + (x / 100) * 190;
        const py = isNew ? 86 - (x / 100) * 4 : 90 - Math.pow(x / 100, 2) * 50;
        if (x === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (t: number) => {
      render(stateRef.current, t);
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

  const applyFeedback = (m: Method, d: number) => {
    if (m === 'new') {
      setFeedback({
        text: 'InSpatio-World：参考锚点 + 几何约束把世界「钉」住了——同样距离，结构完好。',
        cls: 'good',
      });
    } else if (d >= 60) {
      setFeedback({ text: '基线：漂移随距离失控。', cls: 'bad' });
    } else {
      setFeedback({ text: '基线短程尚可，但撑不了长途。', cls: '' });
    }
  };

  const pick = (m: Method) => {
    stateRef.current.method = m;
    setMethod(m);
    applyFeedback(m, stateRef.current.dist);
  };

  const onDist = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.dist = v;
    setDist(v);
    applyFeedback(stateRef.current.method, v);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        <button className={`chip ${method === 'old' ? 'selected' : ''}`} onClick={() => pick('old')}>
          无记忆基线
        </button>
        <button className={`chip ${method === 'new' ? 'selected' : ''}`} onClick={() => pick('new')}>
          InSpatio-World
        </button>
      </div>
      <div className="ctrl">
        <label>
          距离 <span className="val">{dist}</span>
        </label>
        <input type="range" min={0} max={100} step={1} value={dist} onChange={onDist} />
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M1Repair;
