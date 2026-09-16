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

// 4.1 三关计分：答得对 / 时间戳规范 / 别太长。布局分三段，互不重叠。
const rLenOf = (L: number) => (L <= 2048 ? 1 : L <= 3072 ? 1 - (L - 2048) / 1024 : 0);

export const Mod41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ length: 1200, wAcc: 1, wFormat: 0.5, wLen: 0.5 });
  const [length, setLength] = useState(1200);
  const [wLen, setWLen] = useState(0.5);
  const [fb, setFb] = useState({
    text: '拖动讲解稿长度、开关长度这一关，看三格分数与总分怎么互相牵制。',
    cls: '',
  });

  const total = () => {
    const s = stateRef.current;
    return s.wAcc * 0.72 + s.wFormat * 0.5 + s.wLen * rLenOf(s.length);
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
    const render = (s: { length: number; wAcc: number; wFormat: number; wLen: number }) => {
      gameField(ctx, W, H);
      // ---- 区 A（x 40-330）：三关计分板
      const cells: [string, string, number][] = [
        ['答得对', C.green, s.wAcc * 0.72],
        ['时间戳', C.purple, s.wFormat * 0.5],
        ['别太长', C.orange, s.wLen * rLenOf(s.length)],
      ];
      for (let i = 0; i < 3; i++) {
        const [name, col, v] = cells[i];
        const on = v > 0.01;
        ctx.save();
        ctx.fillStyle = on ? col : '#ffffff';
        ctx.globalAlpha = on ? 0.3 + 0.7 * Math.min(1, v) : 1;
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(46 + i * 94, 92, 78, 52);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        drawLabel(ctx, name, 46 + i * 94, 164, C.muted, 16);
      }
      // ---- 区 B（x 360-620）：长度与沙漏，条形高度随长度增长，不越出本区
      const r = rLenOf(s.length);
      const maxH = 150;
      const paperH = 26 + (s.length / 4000) * (maxH - 26);
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = s.length > 3072 ? C.red : s.length > 2048 ? C.orange : C.green;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(380, 40 + (maxH - paperH), 150, paperH);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, s.length + '', 380, 208, C.muted, 16);
      drawHourglass(ctx, 560, 60, 56, r);
      // ---- 区 C（x 680-1040）：总奖励与截断率
      const ax = 690, ay = 52, aw = 340, ah = 176;
      drawCurveAxis(ctx, ax, ay, aw, ah);
      const totalPts: { x: number; y: number }[] = [];
      const truncPts: { x: number; y: number }[] = [];
      for (let i = 0; i <= 40; i++) {
        const L = 200 + (3800 * i) / 40;
        const x = ax + (aw * i) / 40;
        const t = s.wAcc * 0.72 + s.wFormat * 0.5 + s.wLen * rLenOf(L);
        totalPts.push({ x, y: ay + ah - ah * clamp(t / 1.3, 0, 1) });
        truncPts.push({ x, y: ay + ah - ah * clamp(L <= 3072 ? 0.05 : 0.4 + (L - 3072) / 3800, 0, 1) });
      }
      drawCurve(ctx, totalPts, C.blue, 3);
      drawCurve(ctx, truncPts, C.red, 3, true);
      const px = ax + (aw * clamp((s.length - 200) / 3800, 0, 1));
      ctx.save();
      ctx.strokeStyle = C.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px, ay);
      ctx.lineTo(px, ay + ah);
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, total().toFixed(2), ax, 34, C.green, 22);
      drawLegend(
        ctx,
        [
          { label: '总分', color: C.blue },
          { label: '截断率', color: C.red },
        ],
        ax + 150,
        34
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

  const onLen = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    stateRef.current.length = v;
    setLength(v);
    const off = stateRef.current.wLen === 0;
    setFb(
      v > 3072 && off
        ? { text: '关掉长度这一关，讲解者就一路写长：训练中超过三成的稿子因为太长被直接截断。', cls: 'bad' }
        : v > 3072
        ? { text: '超出预算：长度这一关直接归零，稿子太长还会在训练里被截断。', cls: 'bad' }
        : v > 2048
        ? { text: '进入衰减区：还在得分，但每多写一段就少一点。', cls: 'bad' }
        : { text: '在预算之内，三关都拿分，总分最高。', cls: 'good' }
    );
  };
  const toggleLen = () => {
    const next = stateRef.current.wLen === 0 ? 0.5 : 0;
    stateRef.current.wLen = next;
    setWLen(next);
    setFb(
      next === 0
        ? { text: '关掉长度这一关：总分不再管篇幅，训练里超过三成的稿子会被截断。', cls: 'bad' }
        : { text: '开启长度这一关：篇幅被限制在预算内，总分回到平衡点。', cls: 'good' }
    );
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>
          讲解稿长度 <span className="val">{length} token</span>
        </label>
        <input type="range" min={200} max={4000} step={100} value={length} onChange={onLen} />
        <button className={`chip ${wLen === 0 ? 'selected' : ''}`} onClick={toggleLen}>
          {wLen === 0 ? '长度这一关：已关闭' : '长度这一关：开启'}
        </button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
export default Mod41;
