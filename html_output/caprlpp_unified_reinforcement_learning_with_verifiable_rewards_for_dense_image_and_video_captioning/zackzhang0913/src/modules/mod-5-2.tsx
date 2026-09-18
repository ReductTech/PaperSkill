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

// 5.2 时间戳要求：视频讲解里，时间戳要有效且按时间递增。
export const Mod52: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ kind: 'general' as string, order: 1 });
  const [kind, setKind] = useState('general');
  const [order, setOrder] = useState(1);
  const [fb, setFb] = useState({ text: '视频讲解要按时间讲。切换题目类别，再拖动时间戳顺序，看格式分怎么变。', cls: '' });

  const rFormat = () => (kind === 'general' ? 1 : 0.5 * 1 + 0.5 * (order >= 0 ? 1 : 0));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }
    let raf: number | null = null;
    const render = (s: { kind: string; order: number }) => {
      gameField(ctx, W, H);
      const labels = ['0:05', '0:12', '0:18'];
      const xs = s.order >= 0 ? [120, 320, 520] : [520, 320, 120];
      ctx.save();
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 60);
      ctx.lineTo(1000, 60);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 3; i++) drawTimeBadge(ctx, xs[i], 34, 96, labels[i]);
      const rf = s.kind === 'general' ? 1 : 0.5 + 0.5 * (s.order >= 0 ? 1 : 0);
      drawBar(ctx, 120, 140, 300, 26, s.kind === 'general' ? 1 : 1, C.purple);
      drawBar(ctx, 120, 180, 300, 26, s.kind === 'general' ? 1 : s.order >= 0 ? 1 : 0, C.blue);
      drawLabel(ctx, rf.toFixed(2), 640, 120, C.green, 22);
      drawLabel(ctx, '格式分', 640, 152, C.muted, 16);
      drawLegend(ctx, [{ label: '有效率', color: C.purple }, { label: '时序', color: C.blue }], 120, 240);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(() => render(stateRef.current));
    };
    raf = requestAnimationFrame(() => render(stateRef.current));
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = null; };
    const start = () => { if (!raf) raf = requestAnimationFrame(() => render(stateRef.current)); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const onOrder = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    stateRef.current.order = v;
    setOrder(v);
    setFb(
      v < 0 && stateRef.current.kind === 'temporal'
        ? { text: '时间戳倒序：盲学生按这个顺序根本对不上事件，时序一致性为 0，格式分被腰斩。', cls: 'bad' }
        : stateRef.current.kind === 'temporal'
        ? { text: '时间戳有效且递增，盲学生能按时序还原事件，格式项拿满。', cls: 'good' }
        : { text: '通用理解题不考时间戳，格式项默认满分。', cls: '' }
    );
  };
  const pick = (k: string) => {
    stateRef.current.kind = k;
    setKind(k);
    setFb(
      k === 'general'
        ? { text: '通用理解题不考时间戳，格式项默认满分。', cls: '' }
        : { text: '时间定位题要求时间戳有效且按时间递增。', cls: '' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>题目类别 <span className="val">{kind === 'general' ? '通用理解题' : '时间定位题'}</span></label>
        <div className="chip-row">
          <button className={`chip ${kind === 'general' ? 'selected' : ''}`} onClick={() => pick('general')}>通用理解题</button>
          <button className={`chip ${kind === 'temporal' ? 'selected' : ''}`} onClick={() => pick('temporal')}>时间定位题</button>
        </div>
        <label>时间戳顺序 <span className="val">{order.toFixed(2)}</span></label>
        <input type="range" min={-100} max={100} value={Math.round(order * 100)} onChange={onOrder} />
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod52;
