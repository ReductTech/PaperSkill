import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  C, gameField, drawPictureCard, drawDescriber, drawGuesser, drawQuestionCard,
  drawScoreboard, drawScoreCell, drawHourglass, drawTimeBadge, drawBiasCoin,
  drawCurveAxis, drawCurve, drawBar, drawBars, drawLabel, drawLegend,
} from '../canvas-scene';

const W = 1080;
const H = 280;

// 9.1 每张图要几道题：一张图只画饱和曲线，配一个滑块。
const IMG = [40.6, 48.0, 48.5, 48.5];
const VID = [39.7, 45.2, 46.5, 46.5];
const IMG_LAB = ['0 道', '1 道', '2 道', '3 道'];
const VID_LAB = ['0 道', '1 道', '4 道', '8 道'];

export const Mod91: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ modality: 'image' as string, idx: 1 });
  const [modality, setModality] = useState('image');
  const [idx, setIdx] = useState(1);
  const [fb, setFb] = useState({
    text: '先调到「每张图 1 道题」：几乎全部收益在这一步就已经拿到。',
    cls: 'good' as string,
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
    const render = (s: { modality: string; idx: number }) => {
      const vals = s.modality === 'image' ? IMG : VID;
      const labs = s.modality === 'image' ? IMG_LAB : VID_LAB;
      gameField(ctx, W, H);
      const ax = 120, ay = 46, aw = 700, ah = 170;
      drawCurveAxis(ctx, ax, ay, aw, ah);
      // 曲线
      const pts = vals.map((v, i) => ({
        x: ax + (aw * i) / (vals.length - 1),
        y: ay + ah - ah * clamp((v - 38) / 14, 0, 1),
      }));
      drawCurve(ctx, pts, C.blue, 3);
      // 数据点：当前选中的那一点用橙色强调
      for (let i = 0; i < pts.length; i++) {
        const on = i === s.idx;
        ctx.save();
        ctx.fillStyle = on ? C.orange : C.blue;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pts[i].x, pts[i].y, on ? 9 : 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, labs[i], pts[i].x - 18, ay + ah + 22, on ? C.orange : C.muted, 16);
      }
      // 当前值
      drawLabel(ctx, vals[s.idx].toFixed(1), 880, 90, C.green, 22);
      // 已获得收益比例条
      const gained = (vals[s.idx] - vals[0]) / (vals[vals.length - 1] - vals[0]);
      drawBar(ctx, 860, 130, 170, 22, clamp(gained, 0, 1), C.green);
      drawLabel(ctx, '收益', 860, 176, C.muted, 16);
      drawLegend(ctx, [{ label: '平均分', color: C.blue }], 120, 250);
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

  const onIdx = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.idx = v;
    setIdx(v);
    const vals = stateRef.current.modality === 'image' ? IMG : VID;
    setFb(
      v === 0
        ? { text: '这是基线：一道题都没有，等于没有任何反馈。', cls: 'bad' }
        : v === 1
        ? { text: `只用到 1 道题，平均分就从 ${vals[0].toFixed(1)} 升到 ${vals[1].toFixed(1)}——大部分收益已经拿到。`, cls: 'good' }
        : { text: '再加题只剩一点点提升：收益已经饱和。', cls: '' }
    );
  };
  const pickModality = (m: string) => {
    stateRef.current.modality = m;
    stateRef.current.idx = 1;
    setModality(m);
    setIdx(1);
    setFb(
      m === 'video'
        ? { text: '视频侧：更少的题就拿到相近增益，因为一段视频本身信息更密。', cls: '' }
        : { text: '图像侧：1 道题之后曲线就接近平台。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          模态 <span className="val">{modality === 'image' ? '图像' : '视频'}</span>
        </label>
        <button className={`chip ${modality === 'image' ? 'selected' : ''}`} onClick={() => pickModality('image')}>
          图像
        </button>
        <button className={`chip ${modality === 'video' ? 'selected' : ''}`} onClick={() => pickModality('video')}>
          视频
        </button>
        <label>
          每张图 / 每段视频的题数 <span className="val">{modality === 'image' ? IMG_LAB[idx] : VID_LAB[idx]}</span>
        </label>
        <input type="range" min={0} max={3} step={1} value={idx} onChange={onIdx} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod91;
