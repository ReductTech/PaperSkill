import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §4 module — k 次试运行，估计有多稳 (1080x280, P1 slider)
// 12 个任务的真值灰点 + 当前 k 的伯努利估计蓝竖线 + 平均绝对误差柱。

const W = 1080;
const H = 280;
const N_TASKS = 12;

const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  deep: '#76906a',
  text: '#21324a',
  muted: '#68778f',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#f07e47',
  border: '#d7deea',
};

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// fixed pseudo-random truth values in (0,1)
const TRUTH: number[] = (() => {
  const rng = mulberry32(20260412);
  return Array.from({ length: N_TASKS }, () => 0.06 + rng() * 0.88);
})();

function sampleEstimates(k: number, seed: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < N_TASKS; i++) {
    const rng = mulberry32(seed * 7919 + i * 104729 + 13);
    let s = 0;
    for (let j = 0; j < k; j++) s += rng() < TRUTH[i] ? 1 : 0;
    out.push(s / k);
  }
  return out;
}

function feedbackFor(k: number): { text: string; cls: string } {
  if (k === 1)
    return { text: '只试一次，估计在 0 和 1 之间跳——部分通过的信号完全丢失', cls: 'bad' };
  if (k === 2)
    return { text: 'AHE 的选择：每个任务都带通过率信号，部分通过的任务可以锚定对比诊断', cls: 'good' };
  if (k >= 5)
    return { text: '更稳，但每轮评估成本线性上涨——k 是精度与预算的权衡', cls: '' };
  return { text: '误差在缩小，成本也在线性增加——继续拖到 k=5 以上对比', cls: '' };
}

export const ModPassK: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({
    k: 2,
    seed: 1,
    target: sampleEstimates(2, 1),
    shown: sampleEstimates(2, 1).map(() => 0.5),
    targetMae: 0,
    shownMae: 0,
  });
  stateRef.current.targetMae =
    stateRef.current.target.reduce((acc, v, i) => acc + Math.abs(v - TRUTH[i]), 0) / N_TASKS;
  const [k, setK] = useState(2);
  const [feedback, setFeedback] = useState(feedbackFor(2));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const plotL = 70;
    const plotR = 1010;
    const plotT = 30;
    const plotB = 158;
    const yOf = (v: number) => plotB - clamp(v, 0, 1) * (plotB - plotT);
    const xOf = (i: number) => plotL + ((i + 0.5) / N_TASKS) * (plotR - plotL);

    const render = () => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);

      // background
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // axes
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plotL - 14, plotT - 6);
      ctx.lineTo(plotL - 14, plotB);
      ctx.lineTo(plotR + 8, plotB);
      ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('1', plotL - 22, yOf(1) + 4);
      ctx.fillText('0', plotL - 22, yOf(0) + 4);
      ctx.textAlign = 'left';
      // dotted gridlines at 0.5
      ctx.strokeStyle = 'rgba(104,119,143,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.moveTo(plotL - 14, yOf(0.5));
      ctx.lineTo(plotR + 8, yOf(0.5));
      ctx.stroke();
      ctx.setLineDash([]);

      // per-task truth dots, estimate ticks, error links
      for (let i = 0; i < N_TASKS; i++) {
        const x = xOf(i);
        const yT = yOf(TRUTH[i]);
        const yE = yOf(s.shown[i]);
        // error link
        ctx.strokeStyle = 'rgba(196,63,82,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, yT);
        ctx.lineTo(x, yE);
        ctx.stroke();
        // blue estimate tick (vertical line)
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 9, yE);
        ctx.lineTo(x + 9, yE);
        ctx.stroke();
        // truth gray dot
        ctx.beginPath();
        ctx.arc(x, yT, 5, 0, Math.PI * 2);
        ctx.fillStyle = C.muted;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fff';
        ctx.stroke();
      }

      // k=2 orange marker
      ctx.fillStyle = C.orange;
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('k=2 AHE取值', plotR - 96, plotT - 8);
      ctx.beginPath();
      ctx.moveTo(plotR - 102, plotT - 16);
      ctx.lineTo(plotR - 94, plotT - 16);
      ctx.lineTo(plotR - 98, plotT - 8);
      ctx.closePath();
      ctx.fill();

      // mean absolute error bar (bottom 40%)
      const barX = plotL;
      const barY = 216;
      const barH = 26;
      const barMax = 520;
      const bw = clamp(s.shownMae / 0.5, 0, 1) * barMax;
      ctx.fillStyle = '#e3e9f1';
      ctx.fillRect(barX, barY, barMax, barH);
      ctx.fillStyle = C.green;
      ctx.fillRect(barX, barY, bw, barH);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(barX, barY, barMax, barH);
      ctx.fillStyle = C.text;
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText(s.shownMae.toFixed(3), barX + barMax + 12, barY + 19);

      // legend (3 entries)
      ctx.font = '13px "Segoe UI", sans-serif';
      const ly = 198;
      ctx.beginPath();
      ctx.arc(barX + 6, ly - 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = C.muted;
      ctx.fill();
      ctx.fillStyle = C.text;
      ctx.fillText('真值', barX + 16, ly);
      ctx.strokeStyle = C.blue;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(barX + 66, ly - 4);
      ctx.lineTo(barX + 84, ly - 4);
      ctx.stroke();
      ctx.fillStyle = C.text;
      ctx.fillText('估计', barX + 90, ly);
      ctx.fillStyle = C.green;
      ctx.fillRect(barX + 140, ly - 10, 14, 12);
      ctx.fillStyle = C.text;
      ctx.fillText('平均误差', barX + 160, ly);
    };

    const tick = () => {
      const s = stateRef.current;
      for (let i = 0; i < N_TASKS; i++) s.shown[i] = lerp(s.shown[i], s.target[i], 0.14);
      s.shownMae = lerp(s.shownMae, s.targetMae, 0.14);
      render();
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
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

  const resample = (nextK: number, nextSeed: number) => {
    const s = stateRef.current;
    s.k = nextK;
    s.seed = nextSeed;
    s.target = sampleEstimates(nextK, nextSeed);
    s.targetMae = s.target.reduce((acc, v, i) => acc + Math.abs(v - TRUTH[i]), 0) / N_TASKS;
  };

  const onSlide = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    resample(v, stateRef.current.seed);
    setK(v);
    setFeedback(feedbackFor(v));
  };

  const onResample = () => {
    resample(stateRef.current.k, stateRef.current.seed + 1);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          每任务试运行次数 k <span className="val">{k}</span>
        </label>
        <input type="range" min={1} max={8} step={1} value={k} onChange={onSlide} />
        <button type="button" className="tiny ghost" onClick={onResample}>
          再抽一次
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModPassK;
