import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, clearScene, drawRoadH, drawLighthouse, drawFlag, sceneLabel, inset } from './scene-kit';

const W = 560;
const H = 250;

type View = 'pix' | 'lat' | 'depth';

const PAGE_NAMES = ['帧 1 · 弯道', '帧 2 · 灯塔', '帧 3 · 山丘', '帧 4 · 路旗'];

// §2 M2.1 — clickable progression: pick a reference frame and a representation
// view; the fixed inset shows 像素 / 潜变量(示意) / 深度 D_ref(示意) + 内参 K.
export const M2Album: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ page: 0, view: 'pix' as View });
  const rafRef = useRef<number | null>(null);
  const [page, setPage] = useState(0);
  const [view, setView] = useState<View>('pix');
  const [feedback, setFeedback] = useState({
    text: '这是参考视频的原始画面。换个视图看看模型眼中的它。',
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

    const drawMini = (x: number, y: number, w: number, h: number, idx: number) => {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.fillStyle = C.bg;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = C.hill;
      ctx.beginPath();
      ctx.moveTo(x, y + h * 0.5);
      ctx.quadraticCurveTo(x + w * 0.5, y + h * (idx === 2 ? 0.12 : 0.34), x + w, y + h * 0.52);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fill();
      if (idx === 0) {
        ctx.strokeStyle = C.roadEdge;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.85);
        ctx.quadraticCurveTo(x + w * 0.6, y + h * 0.6, x + w, y + h * 0.8);
        ctx.stroke();
      } else if (idx === 1) {
        drawLighthouse(ctx, x + w * 0.55, y + h * 0.85, 0.8);
      } else if (idx === 3) {
        drawRoadH(ctx, y + h * 0.8, x, x + w, 10);
        drawFlag(ctx, x + w * 0.7, y + h * 0.8, 0.8);
      }
      ctx.restore();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, w, h);
    };

    const render = (s: { page: number; view: View }) => {
      clearScene(ctx, W, H);
      sceneLabel(ctx, '参考视频的四帧（路书）', 20, 24, true, 11);
      // album strip
      for (let i = 0; i < 4; i++) {
        const px = 20 + i * 58;
        const py = i === s.page ? 34 : 40;
        drawMini(px, py, 50, 40, i);
        if (i === s.page) {
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.5;
          ctx.strokeRect(px - 1.5, py - 1.5, 53, 43);
        }
      }
      sceneLabel(ctx, PAGE_NAMES[s.page], 20, 108, false, 12);
      // fixed inset
      inset(ctx, 270, 20, 274, 214);
      if (s.view === 'pix') {
        drawMini(282, 34, 250, 160, s.page);
        sceneLabel(ctx, '像素视图：原始外观', 282, 216, true, 11);
      } else if (s.view === 'lat') {
        for (let r = 0; r < 5; r++) {
          for (let c = 0; c < 8; c++) {
            const v = (Math.sin((r * 8 + c + 1) * (s.page + 2) * 1.7) + 1) / 2;
            ctx.fillStyle = `rgba(39,68,110,${0.15 + v * 0.75})`;
            const bx = 284 + c * 31;
            const by = 36 + r * 31;
            ctx.beginPath();
            ctx.moveTo(bx + 5, by);
            ctx.arcTo(bx + 27, by, bx + 27, by + 27, 5);
            ctx.arcTo(bx + 27, by + 27, bx, by + 27, 5);
            ctx.arcTo(bx, by + 27, bx, by, 5);
            ctx.arcTo(bx, by, bx + 27, by, 5);
            ctx.fill();
          }
        }
        sceneLabel(ctx, '潜变量网格（示意）→ 参考锚点 z_ref', 282, 216, true, 11);
      } else {
        for (let r = 0; r < 8; r++) {
          const near = 1 - r / 8;
          const g = Math.round(120 + near * 110 + Math.sin((s.page + 1) * (r + 1)) * 10);
          ctx.fillStyle = `rgb(${g},${g},${g})`;
          ctx.fillRect(282, 34 + r * 20, 250, 19);
        }
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(282, 34, 74, 20);
        ctx.strokeStyle = C.border;
        ctx.strokeRect(282, 34, 74, 20);
        sceneLabel(ctx, 'D_ref 深度', 288, 48, false, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(458, 34, 74, 20);
        ctx.strokeStyle = C.border;
        ctx.strokeRect(458, 34, 74, 20);
        sceneLabel(ctx, '内参 K', 470, 48, false, 11);
        sceneLabel(ctx, '深度条带（示意）：越亮越近', 282, 216, true, 11);
      }
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render(stateRef.current);
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

  const pickPage = (i: number) => {
    stateRef.current.page = i;
    setPage(i);
  };

  const pickView = (v: View) => {
    stateRef.current.view = v;
    setView(v);
    if (v === 'pix') {
      setFeedback({ text: '像素只是外观——模型还需要压缩表示与几何。', cls: '' });
    } else if (v === 'lat') {
      setFeedback({
        text: '潜变量：压缩后的特征，之后作为参考锚点 z_ref 存入缓存（§3）。',
        cls: '',
      });
    } else {
      setFeedback({
        text: '深度 D_ref 与内参 K 由前馈重建（FFR）估计，§5 将用它把画面「搬」到新视角。',
        cls: 'good',
      });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {PAGE_NAMES.map((n, i) => (
          <button key={n} className={`chip ${page === i ? 'selected' : ''}`} onClick={() => pickPage(i)}>
            {n}
          </button>
        ))}
      </div>
      <div className="chip-row">
        <button className={`chip ${view === 'pix' ? 'selected' : ''}`} onClick={() => pickView('pix')}>
          像素
        </button>
        <button className={`chip ${view === 'lat' ? 'selected' : ''}`} onClick={() => pickView('lat')}>
          潜变量
        </button>
        <button className={`chip ${view === 'depth' ? 'selected' : ''}`} onClick={() => pickView('depth')}>
          深度
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M2Album;
