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

// 8.2 SpaBoot：三种训练顺序的图像/视频平均分对照（Table 8）。
const RECIPES = [
  { id: 'image-only', label: '只训图像', img: 49.3, vid: 21.7 },
  { id: 'video-only', label: '只训视频', img: 49.3, vid: 25.0 },
  { id: 'spaboot', label: '先图后视频（SpaBoot）', img: 50.3, vid: 26.1 },
];

export const Mod82: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ recipe: 'spaboot' });
  const [recipe, setRecipe] = useState('spaboot');
  const [fb, setFb] = useState({ text: '切换训练顺序，比较图像侧与视频侧的平均分：先学静态、再学动态是不是更好？', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const render = (s: { recipe: string }) => {
      gameField(ctx, W, H);
      const r = RECIPES.find((x) => x.id === s.recipe) || RECIPES[2];
      // 左：两阶段示意
      drawPictureCard(ctx, 70, 60, 80, 'clean');
      drawPictureCard(ctx, 70, 160, 80, 'clean');
      ctx.save();
      ctx.strokeStyle = C.purple;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(180, 100);
      ctx.lineTo(300, 100);
      ctx.stroke();
      ctx.restore();
      drawTimeBadge(ctx, 300, 150, 90, '0:05');
      drawLabel(ctx, '阶段 1', 70, 40, C.muted, 16);
      drawLabel(ctx, '阶段 2', 300, 40, C.muted, 16);
      // 右：两条对比条
      drawBar(ctx, 520, 70, 420, 30, r.img / 60, C.green);
      drawBar(ctx, 520, 130, 420, 30, r.vid / 32, C.blue);
      drawLabel(ctx, r.img.toFixed(1), 520, 190, C.green, 22);
      drawLabel(ctx, r.vid.toFixed(1), 640, 190, C.blue, 22);
      drawLegend(ctx, [{ label: '图像平均', color: C.green }, { label: '视频平均', color: C.blue }], 520, 40);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(() => render(stateRef.current)); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const pick = (id: string) => {
    stateRef.current.recipe = id;
    setRecipe(id);
    setFb(
      id === 'video-only'
        ? { text: '视频分数上去了，但细粒度空间推理明显吃亏：视频帧不是学空间对齐的好来源。', cls: 'bad' }
        : id === 'image-only'
        ? { text: '图像很强，视频几乎没学到——时间能力需要显式训练。', cls: 'bad' }
        : { text: '先打空间底子再学时间：两侧都拿到好成绩，是三者里最均衡的。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>训练顺序 <span className="val">{RECIPES.find((r) => r.id === recipe)?.label}</span></label>
        <div className="chip-row">
          {RECIPES.map((r) => (
            <button key={r.id} className={`chip ${recipe === r.id ? 'selected' : ''}`} onClick={() => pick(r.id)}>
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod82;
