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

// 1.1 旧的打分方式：只看讲解稿与「标准范文」有多像。
// 左侧人物 = 讲解者（看得见画面），右侧人物 = 蒙眼学生，黑板 = 分数格。
export const Mod11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sim: 85, correct: 2 });
  const [sim, setSim] = useState(85);
  const [fb, setFb] = useState({
    text: '先把相似度拉高：讲解稿几乎和标准范文一样，可蒙眼学生还是答不出画面细节。',
    cls: 'bad' as string,
  });

  const scoreOf = (s: number) => Math.round(1 + 4 * Math.min(1, s / 100) * 0.25);

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
    const render = (s: { sim: number; correct: number }) => {
      gameField(ctx, W, H);
      drawPictureCard(ctx, 40, 40, 90, 'clean');
      drawDescriber(ctx, 175, 220, 64, C.blue);
      // 桌上的标准范文
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.frame;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(228, 52, 96, 30);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.fillRect(234, 60, 74 * (s.sim / 100), 3);
      ctx.fillRect(234, 69, 60 * (s.sim / 100), 3);
      ctx.restore();
      drawGuesser(ctx, 400, 220, 64, C.blue);
      for (let i = 0; i < 5; i++) {
        drawScoreCell(ctx, 342 + i * 20, 176, 16, i < s.correct, C.green);
      }
      // 右侧：相似度提高，答对题数几乎不动
      const ax = 620, ay = 60, aw = 400, ah = 160;
      drawCurveAxis(ctx, ax, ay, aw, ah);
      const simPts: { x: number; y: number }[] = [];
      const accPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 20; i++) {
        const x = ax + (aw * i) / 20;
        const sv = i * 5;
        simPts.push({ x, y: ay + ah - (ah * sv) / 100 });
        accPts.push({ x, y: ay + ah - (ah * scoreOf(sv)) / 5 });
      }
      drawCurve(ctx, simPts, C.red, 3);
      drawCurve(ctx, accPts, C.green, 3);
      drawLabel(ctx, String(s.correct), 46, 32, C.green, 22);
      drawLegend(ctx, [{ label: '相似度', color: C.red }, { label: '答对', color: C.green }], 620, 32);
      const px = ax + (aw * clamp(s.sim, 0, 100)) / 100;
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, ay);
      ctx.lineTo(px, ay + ah);
      ctx.stroke();
      ctx.restore();
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

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    const c = scoreOf(v);
    stateRef.current = { sim: v, correct: c };
    setSim(v);
    setFb(
      v >= 80
        ? { text: '讲解稿几乎和标准范文一样，蒙眼学生还是答不出画面细节。像，不等于讲清楚。', cls: 'bad' }
        : v >= 30
        ? { text: '相似度掉下来了，可答对题数几乎没变——这条尺子根本没在量「有没有讲清楚」。', cls: '' }
        : { text: '再降也没有区分度：这条尺子已经和讲解质量脱钩了。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          讲解稿与标准范文的相似度 <span className="val">{sim}</span>
        </label>
        <input type="range" min={0} max={100} value={sim} onChange={onChange} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod11;
