import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, gameField, drawCurveAxis, drawCurve, drawLabel, drawLegend } from '../canvas-scene';

const W = 1080;
const H = 280;

// 9.2 多出来的收益涨在哪种能力上：一张图两条曲线，配一个「题量规模」滑块。
export const Mod94: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ side: 'video' as string, size: 0.4 });
  const [side, setSide] = useState('video');
  const [size, setSize] = useState(0.4);
  const [fb, setFb] = useState({
    text: '拖动题量：视频侧两条曲线很快分开，「看懂顺序」涨得最猛。',
    cls: '',
  });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;
    const render = (s: { side: string; size: number }) => {
      gameField(ctx, W, H);
      const ax = 130, ay = 46, aw = 620, ah = 170;
      drawCurveAxis(ctx, ax, ay, aw, ah);
      const isVideo = s.side === 'video';
      const g: { x: number; y: number }[] = [];
      const t: { x: number; y: number }[] = [];
      for (let i = 0; i <= 30; i++) {
        const u = i / 30;
        const x = ax + aw * u;
        const gv = isVideo ? 0.42 + 0.28 * (1 - Math.exp(-2.2 * u)) : 0.35 + 0.6 * (1 - Math.exp(-1.6 * u));
        const tv = isVideo ? 0.08 + 0.85 * (1 - Math.exp(-3.2 * u)) : 0.2 + 0.55 * (1 - Math.exp(-1.8 * u));
        g.push({ x, y: ay + ah - ah * clamp(gv, 0, 1) });
        t.push({ x, y: ay + ah - ah * clamp(tv, 0, 1) });
      }
      drawCurve(ctx, g, C.green, 3);
      drawCurve(ctx, t, C.purple, 3);
      const gi = isVideo ? 0.42 + 0.28 * (1 - Math.exp(-2.2 * s.size)) : 0.35 + 0.6 * (1 - Math.exp(-1.6 * s.size));
      const ti = isVideo ? 0.08 + 0.85 * (1 - Math.exp(-3.2 * s.size)) : 0.2 + 0.55 * (1 - Math.exp(-1.8 * s.size));
      drawLabel(ctx, gi.toFixed(2), 790, 90, C.green, 22);
      drawLabel(ctx, ti.toFixed(2), 790, 142, C.purple, 22);
      const px = ax + aw * s.size;
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, ay);
      ctx.lineTo(px, ay + ah);
      ctx.stroke();
      ctx.restore();
      drawLegend(
        ctx,
        [
          { label: '看懂画面', color: C.green },
          { label: '看懂顺序', color: C.purple },
        ],
        130,
        250
      );
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(() => render(stateRef.current));
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const onSize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.size = v;
    setSize(v);
    const isVideo = stateRef.current.side === 'video';
    setFb(
      isVideo && v >= 0.5
        ? { text: '题量上去后，「看懂顺序」涨得最快：多加题主要换来的是时间理解。', cls: 'good' }
        : isVideo
        ? { text: '「看懂画面」很快就接近饱和，缺的正是「看懂顺序」。', cls: '' }
        : { text: '图像侧两条曲线一起平滑上升，还没看到明显天花板。', cls: '' }
    );
  };
  const pickSide = (s2: string) => {
    stateRef.current.side = s2;
    setSide(s2);
    setFb(
      s2 === 'video'
        ? { text: '视频侧：紫线（看懂顺序）的斜率明显更陡。', cls: '' }
        : { text: '图像侧：绿线随题量平滑上升。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          看哪一侧 <span className="val">{side === 'video' ? '视频' : '图像'}</span>
        </label>
        <button className={`chip ${side === 'image' ? 'selected' : ''}`} onClick={() => pickSide('image')}>
          图像侧
        </button>
        <button className={`chip ${side === 'video' ? 'selected' : ''}`} onClick={() => pickSide('video')}>
          视频侧
        </button>
        <label>
          题量规模 <span className="val">{Math.round(size * 100)}%</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(size * 100)} onChange={onSize} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod94;
