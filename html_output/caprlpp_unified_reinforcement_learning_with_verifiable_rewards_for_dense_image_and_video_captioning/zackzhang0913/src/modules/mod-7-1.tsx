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

// 7.1 组内相对优势：两个数字分别标注「组内平均」与「最大差距」。
export const Mod71: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ n: 1, g: 4, seed: 1 });
  const [n, setN] = useState(1);
  const [g, setG] = useState(4);
  const [fb, setFb] = useState({ text: '先看只问一次（N=1）时组内分数有多不稳，再把 N 提上去。', cls: '' });

  const scores = (n: number, g: number, seed: number) => {
    const out: number[] = [];
    for (let i = 0; i < g; i++) {
      const base = 0.5 + 0.34 * Math.sin(seed * 1.7 + i * 2.1);
      const jitter = n === 1 ? 0.22 : n === 2 ? 0.1 : n === 4 ? 0.04 : 0.02;
      out.push(clamp(base + jitter * Math.sin(seed * 3.1 + i * 5.3), 0, 1));
    }
    return out;
  };

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
    const render = (s: { n: number; g: number; seed: number }) => {
      const sc = scores(s.n, s.g, s.seed);
      const mean = sc.reduce((a, b) => a + b, 0) / sc.length;
      gameField(ctx, W, H);
      for (let i = 0; i < sc.length; i++) {
        const y = 40 + i * (150 / s.g);
        drawBar(ctx, 80, y, 420, Math.max(14, 150 / s.g - 10), sc[i], sc[i] >= mean ? C.green : C.red);
      }
      const bx = 80 + 420 * mean;
      ctx.save();
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(bx, 26);
      ctx.lineTo(bx, 196);
      ctx.stroke();
      ctx.restore();
      const maxAdv = Math.max(...sc.map((x) => Math.abs(x - mean)));
      // 两个数字：数值 + 短标签
      drawLabel(ctx, mean.toFixed(2), 600, 60, C.blue, 22);
      drawLabel(ctx, '组内平均', 600, 88, C.muted, 16);
      drawLabel(ctx, maxAdv.toFixed(2), 600, 140, C.orange, 22);
      drawLabel(ctx, '最大差距', 600, 168, C.muted, 16);
      // 右侧：扰动幅度条（只做读者强调）
      drawBar(ctx, 820, 60, 180, 22, s.n === 1 ? 1 : s.n === 2 ? 0.5 : s.n === 4 ? 0.18 : 0.1, C.red);
      drawLegend(
        ctx,
        [
          { label: '组均值', color: C.blue },
          { label: '高于均值', color: C.green },
          { label: '低于均值', color: C.red },
        ],
        600,
        218
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

  const onN = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = [1, 2, 4, 8][Number(e.target.value)];
    stateRef.current.n = v;
    setN(v);
    setFb(
      v === 1
        ? { text: '只问一次时，选项位置偏好会污染分数，组内谁高谁低不可信。', cls: 'bad' }
        : v < 4
        ? { text: '多轮平均已经开始稳住分数，但还不算稳。', cls: '' }
        : { text: '多轮平均后分数稳定，讲解者之间的相对高低才可信。', cls: 'good' }
    );
  };
  const onG = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = [2, 4, 8][Number(e.target.value)];
    stateRef.current.g = v;
    setG(v);
    setFb(
      v < 4
        ? { text: '一组里讲解稿太少，组均值的基线不稳。', cls: 'bad' }
        : { text: '组内有足够样本，组均值这条基线更稳。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          轮数 N <span className="val">{n}</span>
        </label>
        <input type="range" min={0} max={3} step={1} value={[1, 2, 4, 8].indexOf(n)} onChange={onN} />
        <label>
          一组几段稿 <span className="val">{g}</span>
        </label>
        <input type="range" min={0} max={2} step={1} value={[2, 4, 8].indexOf(g)} onChange={onG} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod71;
