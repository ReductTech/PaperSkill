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

// 3.1 两把尺子并排跑：左边只量「与参考答案的相似度」（旧），
// 右边让看不见画面的学生真答一遍（新）。右边同时给出题数与百分比。
export const Mod31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ phase: 'idle' as 'idle' | 'running' | 'done', t: 0 });
  const [phase, setPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [n, setN] = useState(0);
  const [fb, setFb] = useState({
    text: '按同一个「开始」，让两把尺子从同一起点跑起来：左边只量相似度，右边看学生真答对几题。',
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
    let t0 = 0;
    const loop = (now: number) => {
      const s = stateRef.current;
      if (s.phase === 'running') {
        if (!t0) t0 = now;
        s.t = clamp((now - t0) / 1800, 0, 1);
        if (s.t >= 1) {
          s.phase = 'done';
          t0 = 0;
          setPhase('done');
          setN(5);
          setFb({
            text: '同一段讲解内容：左边相似度拉满、右边学生 5/5。旧尺子只看「像不像范文」，新尺子才知道「信息有没有传过去」。',
            cls: 'good',
          });
        }
      }
      draw(ctx, s);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = null;
    };
    const startFn = () => {
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const disconnect = observeCanvas(canvas, startFn, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const draw = (ctx: CanvasRenderingContext2D, s: { phase: string; t: number }) => {
    gameField(ctx, W, H);
    // ---- 左：旧尺子，只量相似度（一条横条，不给分数数字，避免与准确率混淆）
    ctx.save();
    ctx.strokeStyle = C.red;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(40, 24, 460, 120);
    ctx.stroke();
    ctx.restore();
    drawPictureCard(ctx, 60, 44, 76, 'clean');
    drawDescriber(ctx, 172, 132, 52, C.red);
    drawBar(ctx, 250, 52, 220, 20, 0.98 * s.t, C.red);
    drawBar(ctx, 250, 84, 220, 20, 0.98, C.axis);
    // 右侧下带：两条曲线
    // ---- 右：新尺子，学生真答一遍
    ctx.save();
    ctx.strokeStyle = C.green;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.rect(540, 24, 500, 120);
    ctx.stroke();
    ctx.restore();
    drawPictureCard(ctx, 560, 44, 76, 'clean');
    drawDescriber(ctx, 672, 132, 52, C.green);
    const n = Math.floor(s.t * 5);
    for (let i = 0; i < 5; i++) drawQuestionCard(ctx, 760 + i * 54, 44, 48, i < n ? 'right' : 'idle');
    drawLabel(ctx, n + '/5', 900, 122, C.green, 22);
    // ---- 下带：两条曲线（左=相似度，右=答对率）
    const ax = 60, ay = 172, aw = 960, ah = 84;
    drawCurveAxis(ctx, ax, ay, aw, ah);
    const p1: { x: number; y: number }[] = [];
    const p2: { x: number; y: number }[] = [];
    for (let i = 0; i <= 20; i++) {
      const x = ax + (aw * i) / 20;
      const tt = i / 20;
      p1.push({ x, y: ay + ah - ah * (1 - Math.exp(-4 * tt)) * 0.95 });
      p2.push({ x, y: ay + ah - ah * (1 - Math.exp(-1.6 * tt)) * 0.95 });
    }
    drawCurve(ctx, p1, C.red, 3);
    drawCurve(ctx, p2, C.green, 3);
    drawLegend(
      ctx,
      [
        { label: '相似度', color: C.red },
        { label: '答对率', color: C.green },
      ],
      700,
      194
    );
  };

  const start = () => {
    stateRef.current = { phase: 'running', t: 0 };
    setPhase('running');
    setN(0);
    setFb({ text: '注意两条曲线的含义不同：一条是「像不像范文」，一条是「学生答对多少」。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          两把尺子 <span className="val">{phase === 'idle' ? '待开始' : phase === 'running' ? '运行中' : '已完成'}</span>
        </label>
        <button className="chip selected" onClick={start} disabled={phase === 'running'}>
          {phase === 'done' ? '再跑一次' : '同时开始'}
        </button>
      </div>
      <div className="ctrl">
        <label>
          左：与参考答案的相似度 <span className="val">98%</span>
        </label>
        <label>
          右：蒙眼学生答对 <span className="val">{n} / 5（{Math.round((n / 5) * 100)}%）</span>
        </label>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod31;
