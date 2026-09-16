import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const C = {
  bg: '#f5f8f0', light: '#b8c9a7', dark: '#76906a', brown: '#92400e',
  blue: '#27446e', orange: '#f07e47', green: '#228d5c', text: '#21324a',
  muted: '#68778f', border: '#d7deea',
};

/** P5：点击/拖放源照片；芯片切换源/目标提示是否在场 */
export const Ch2Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ x: 200, y: 140, srcOn: true, tarOn: true, drag: false });
  const rafRef = useRef<number | null>(null);
  const [srcOn, setSrcOn] = useState(true);
  const [tarOn, setTarOn] = useState(true);
  const [feedback, setFeedback] = useState({
    text: '把照片放到灯箱中央，并确认两条提示标签。',
    cls: '',
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
      const s = stateRef.current;
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.light;
      ctx.fillRect(80, 40, W - 160, H - 80);
      ctx.strokeStyle = C.dark;
      ctx.lineWidth = 2;
      ctx.strokeRect(80, 40, W - 160, H - 80);
      ctx.fillStyle = C.muted;
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillText('灯箱桌面 · 拖动照片', 100, 64);

      if (s.srcOn) {
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.roundRect(s.x + 50, s.y - 40, 72, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('源提示', s.x + 62, s.y - 21);
      }
      if (s.tarOn) {
        ctx.fillStyle = C.orange;
        ctx.beginPath();
        ctx.roundRect(s.x + 50, s.y + 16, 80, 28, 6);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('目标提示', s.x + 58, s.y + 35);
      }

      ctx.fillStyle = '#fff';
      ctx.strokeStyle = C.brown;
      ctx.lineWidth = 2;
      ctx.fillRect(s.x - 30, s.y - 24, 60, 48);
      ctx.strokeRect(s.x - 30, s.y - 24, 60, 48);
      ctx.fillStyle = C.light;
      ctx.fillRect(s.x - 16, s.y - 10, 32, 24);
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

    const toLocal = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - r.left) / r.width) * W,
        y: ((e.clientY - r.top) / r.height) * H,
      };
    };
    const onDown = (e: PointerEvent) => {
      const p = toLocal(e);
      const s = stateRef.current;
      if (Math.abs(p.x - s.x) < 40 && Math.abs(p.y - s.y) < 30) {
        s.drag = true;
        canvas.setPointerCapture(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!stateRef.current.drag) return;
      const p = toLocal(e);
      stateRef.current.x = clamp(p.x, 120, W - 120);
      stateRef.current.y = clamp(p.y, 80, H - 80);
      updateFb();
    };
    const onUp = () => {
      stateRef.current.drag = false;
    };
    const updateFb = () => {
      const s = stateRef.current;
      if (s.srcOn && s.tarOn) {
        setFeedback({ text: '源图 + 双提示齐备，可以构造编辑流。', cls: 'good' });
      } else if (!s.srcOn && !s.tarOn) {
        setFeedback({ text: '缺少提示，模型不知道改什么。', cls: 'bad' });
      } else {
        setFeedback({ text: '只开一侧提示时，编辑方向不完整。', cls: '' });
      }
    };

    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerup', onUp);
    return () => {
      stop();
      off();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
    };
  }, []);

  const toggle = (which: 'src' | 'tar') => {
    if (which === 'src') {
      const v = !srcOn;
      setSrcOn(v);
      stateRef.current.srcOn = v;
    } else {
      const v = !tarOn;
      setTarOn(v);
      stateRef.current.tarOn = v;
    }
    const s = stateRef.current;
    if (s.srcOn && s.tarOn) setFeedback({ text: '源图 + 双提示齐备，可以构造编辑流。', cls: 'good' });
    else if (!s.srcOn && !s.tarOn) setFeedback({ text: '缺少提示，模型不知道改什么。', cls: 'bad' });
    else setFeedback({ text: '只开一侧提示时，编辑方向不完整。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} style={{ cursor: 'grab' }} />
      <div className="ctrl">
        <button type="button" className={`chip${srcOn ? ' selected' : ''}`} aria-pressed={srcOn} onClick={() => toggle('src')}>
          源提示
        </button>
        <button type="button" className={`chip${tarOn ? ' selected' : ''}`} aria-pressed={tarOn} onClick={() => toggle('tar')}>
          目标提示
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch2Mod1;
