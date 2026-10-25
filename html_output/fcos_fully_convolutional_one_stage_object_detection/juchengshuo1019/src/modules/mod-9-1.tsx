// mod-9-1 (P4): toggle center-ness; scatter (score x IoU) shifts left when on.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { palette, clearScene } from './carpentry-kit';

const W = 1080, H = 280;
// deterministic pseudo-random points: [score, iou, centerness]
const PTS: Array<[number, number, number]> = (() => {
  const pts: Array<[number, number, number]> = [];
  let s = 42;
  const rnd = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  for (let i = 0; i < 60; i++) {
    const ctr = 0.15 + rnd() * 0.85;
    const score = 0.1 + rnd() * 0.85;
    const iou = Math.max(0.02, Math.min(0.98, ctr * (0.5 + rnd() * 0.6)));
    pts.push([score, iou, ctr]);
  }
  return pts;
})();

function drawScatter(canvas: HTMLCanvasElement, on: boolean, prog: number): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearScene(ctx, W, H);
  const gx0 = 90, gx1 = 640, gy0 = 40, gy1 = 240;
  ctx.strokeStyle = palette.techBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(gx0, gy0, gx1 - gx0, gy1 - gy0);
  // y=x dashed
  ctx.strokeStyle = palette.inkMuted;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.moveTo(gx0, gy1);
  ctx.lineTo(gx1, gy0);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('分类分数 →', gx1 - 90, gy1 + 22);
  ctx.save();
  ctx.translate(34, gy1);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('与真框的 IoU →', 0, 0);
  ctx.restore();
  PTS.forEach(([score, iou, ctr]) => {
    const sx = on ? score * ctr : score;
    const x = gx0 + (sx * prog + score * (1 - prog)) * (gx1 - gx0);
    const y = gy1 - iou * (gy1 - gy0);
    const lowQ = iou < sx * 0.9;
    ctx.fillStyle = lowQ ? (on ? palette.emphasis : palette.bad) : palette.good;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  // AP panel (paper Table 4)
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = palette.techBorder;
  ctx.fillRect(700, 60, 320, 150);
  ctx.strokeRect(700, 60, 320, 150);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText('COCO minival AP（论文表 4）', 720, 90);
  ctx.font = 'bold 26px sans-serif';
  ctx.fillStyle = on ? palette.good : palette.bad;
  ctx.fillText(on ? '37.1%' : '33.5%', 720, 135);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText(on ? '中心性：开' : '中心性：关', 720, 165);
  ctx.fillText('低质量框（y<x 下方红点）', 720, 190);
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod91: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [on, setOn] = useState(false);
  const anim = useRef({ from: 0, to: 0, start: 0, active: false });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    void ctx;
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const a = anim.current;
      let prog = a.to;
      if (a.active) {
        prog = Math.min(1, (now - a.start) / 600);
        const e = 1 - Math.pow(1 - prog, 3);
        prog = a.from + (a.to - a.from) * e;
        if (prog === a.to || (a.to === 1 && prog >= 1) || (a.to === 0 && prog <= 0)) a.active = false;
      }
      drawScatter(canvas, a.to === 1, prog);
    };
    raf = requestAnimationFrame(loop);
    const disconnect = observeCanvas(canvas, () => {}, () => {});
    drawScatter(canvas, false, 0);
    return () => {
      cancelAnimationFrame(raf);
      disconnect();
    };
  }, []);

  const toggle = (v: boolean) => {
    anim.current = { from: v ? 0 : 1, to: v ? 1 : 0, start: performance.now(), active: true };
    setOn(v);
  };

  return (
    <div>
      <canvas ref={ref} aria-label="中心性开关对比散点" />
      <div className="controls" role="group" aria-label="中心性开关">
        <button type="button" className={`chip${!on ? ' active' : ''}`} onClick={() => toggle(false)}>
          关
        </button>
        <button type="button" className={`chip${on ? ' active' : ''}`} onClick={() => toggle(true)}>
          开
        </button>
      </div>
      <div className={`feedback ${on ? 'good' : 'bad'}`}>
        {on
          ? '开：低质量框的分数被压低，更容易被 NMS 滤掉——AP 从 33.5% 涨到 37.1%。'
          : '关：很多框分数虚高（y=x 线下方的红点），NMS 很难办。'}
      </div>
    </div>
  );
};
