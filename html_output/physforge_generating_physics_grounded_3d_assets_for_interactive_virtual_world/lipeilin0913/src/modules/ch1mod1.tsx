import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, lerpColor } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 Module 1.1 (P1 slider + repair button, hybrid): stress the hollow shell, then repair it.
const W = 1080;
const H = 280;

// 耄耋猫（cat4）透明帧序列：预载 public/cat4，来回播放成无缝循环
const CAT_SRCS = Array.from(
  { length: 16 },
  (_, i) => `${import.meta.env.BASE_URL}cat4/f${String(i).padStart(2, '0')}.png`
);
const catImgs: HTMLImageElement[] = CAT_SRCS.map((s) => {
  const im = new Image();
  im.src = s;
  return im;
});
const CAT_ORDER = [
  ...Array.from({ length: 16 }, (_, i) => i),
  ...Array.from({ length: 14 }, (_, i) => 14 - i),
];
// anchor = 猫右缘 ax、底边 ay（站在地面上、侧身顶住柜子）；返回 false 时调用方画回退图形
const drawCatAt = (
  ctx: CanvasRenderingContext2D,
  time: number,
  ax: number,
  ay: number,
  h: number
): boolean => {
  const im = catImgs[CAT_ORDER[Math.floor(time / 66) % CAT_ORDER.length]];
  if (!im.complete || im.naturalWidth === 0) return false;
  const w = (h * im.naturalWidth) / im.naturalHeight;
  ctx.drawImage(im, ax - w, ay - h, w, h);
  return true;
};

export const Ch1Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ strength: 0.2, repaired: false });
  // smoothed display state: every visual follows these, so slider/button pops ease in
  const animRef = useRef({ strength: 0.2, repair: 0, last: 0 });
  const rafRef = useRef<number | null>(null);
  const [strength, setStrength] = useState(0.2);
  const [repaired, setRepaired] = useState(false);
  const [feedback, setFeedback] = useState({ text: '需求很低时，它还能当个漂亮的摆件。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (time: number) => {
      const s = stateRef.current;
      const a = animRef.current;
      // delta-correct exponential smoothing toward the interactive state
      const dt = a.last ? Math.min(time - a.last, 64) : 16;
      a.last = time;
      a.strength += (s.strength - a.strength) * (1 - Math.exp(-dt / 100));
      a.repair += ((s.repaired ? 1 : 0) - a.repair) * (1 - Math.exp(-dt / 260));
      const rep = a.repair;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(0, 238, W, 8);
      ctx.fillStyle = '#76906a';
      ctx.fillRect(0, 246, W, 3);
      // cabinet: tremor grows with demand, dies out as the repair lands
      const shake = Math.sin(time / 90) * a.strength * 4 * (1 - rep);
      const cx = 320 + shake;
      const cy = 70;
      ctx.fillStyle = '#92400e';
      ctx.fillRect(cx, cy, 240, 168);
      // door: nailed shut it only shudders in place (never opens); after the
      // repair it swings on the new hinge — and the stronger the demand, the
      // WIDER it opens (matching the 门缝开度 gauge on the right).
      const dj = (1 - rep) * Math.sin(time / 70) * a.strength * 2.5;
      // revealed recess behind the opening door: dark interior + a soft
      // shadow spilling from the free edge
      const doorF = rep * (0.12 + 0.5 * a.strength);
      if (doorF > 0.005) {
        const ex = cx + 14 + dj + 212 * (1 - doorF);
        ctx.fillStyle = `rgba(74,44,18,${rep})`;
        ctx.fillRect(ex, cy + 12, 212 * doorF, 66);
        const sg = ctx.createLinearGradient(ex, 0, ex + 34, 0);
        sg.addColorStop(0, `rgba(0,0,0,${0.35 * rep})`);
        sg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(ex, cy + 12, Math.min(34, 212 * doorF), 66);
      }
      ctx.save();
      ctx.translate(cx + 14 + dj, cy + 12);
      ctx.transform(1 - doorF, 0, 0, 1, 0, 0);
      ctx.fillStyle = lerpColor('#a0522d', '#228d5c', rep);
      ctx.fillRect(0, 0, 212, 66);
      ctx.restore();
      // nails fade out as the repair proceeds; density follows demand
      if (rep < 0.99) {
        const n = 2 + Math.round(a.strength * 6);
        ctx.fillStyle = `rgba(196,63,82,${1 - rep})`;
        for (let i = 0; i < n; i++) {
          const nx = cx + 24 + (i % 2) * 192 + dj;
          const ny = cy + 20 + Math.floor(i / 2) * 22;
          ctx.beginPath();
          ctx.arc(nx, ny, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      // hinge fades in at the pivot
      if (rep > 0.01) {
        ctx.fillStyle = `rgba(34,141,92,${rep})`;
        ctx.beginPath();
        ctx.arc(cx + 14, cy + 20, 5, 0, Math.PI * 2);
        ctx.arc(cx + 14, cy + 70, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      // drawer
      ctx.fillStyle = '#7a3509';
      ctx.fillRect(cx + 14, cy + 92, 212, 62);
      // 修复前：猫顶住柜体左缘使劲（带颤抖）；修复后：回到门边安静站着，
      // 随需求轻轻顶门（无颤抖），门随强度开大（见上方门板与右侧仪表）
      const tremble = Math.sin(time / 55) * 3 * a.strength * (1 - rep);
      const axCat =
        (320 + a.strength * 12 + tremble) * (1 - rep) +
        (330 + Math.sin(time / 600) * 2 * a.strength) * rep;
      if (!drawCatAt(ctx, time, axCat, 238, 168)) {
        const hx = axCat - 10;
        ctx.fillStyle = '#21324a';
        ctx.fillRect(hx - 78, cy + 38, 78, 14); // forearm
        ctx.beginPath();
        ctx.arc(hx, cy + 45, 10, 0, Math.PI * 2); // fist against the door
        ctx.fill();
      }
      // right: "门缝开度" gauge — titled, unit mm, 0 baseline, target dashed
      // line at 5 mm; while nailed the fill only trembles near 0, after the
      // repair the gap opens with the door toward/past the target.
      const gx = 872;
      const gTop = 64;
      const gH = 156;
      const gBot = gTop + gH;
      const gMax = 10;
      const gapMm = clamp(
        rep * a.strength * 7.5 + (1 - rep) * (Math.sin(time / 120) * 0.5 + 0.5) * a.strength * 0.7,
        0,
        gMax
      );
      // title + unit
      ctx.fillStyle = '#21324a';
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText('门缝开度', gx - 14, 28);
      ctx.fillStyle = '#68778f';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('单位 mm', gx + 56, 28);
      // live readout just above the track
      ctx.fillStyle = '#21324a';
      ctx.font = '16px "Segoe UI", sans-serif';
      ctx.fillText(`${gapMm.toFixed(1)} mm`, gx - 6, gTop - 12);
      // track
      ctx.fillStyle = '#d7deea';
      ctx.fillRect(gx, gTop, 44, gH);
      // fill (red while failing, green once the repair works)
      const fh = (gapMm / gMax) * gH;
      ctx.fillStyle = lerpColor('#c43f52', '#228d5c', rep);
      ctx.fillRect(gx, gBot - fh, 44, fh);
      // target dashed line at 5 mm
      const ty = gBot - (5 / gMax) * gH;
      ctx.strokeStyle = '#c43f52';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(gx - 6, ty);
      ctx.lineTo(gx + 50, ty);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#c43f52';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('目标 5 mm', gx + 56, ty + 4);
      // 0 baseline + tick labels
      ctx.strokeStyle = '#68778f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(gx - 6, gBot);
      ctx.lineTo(gx + 50, gBot);
      ctx.stroke();
      ctx.fillStyle = '#68778f';
      ctx.fillText('0', gx - 20, gBot + 4);
      ctx.fillText('5', gx - 20, ty + 4);
      ctx.fillText('10', gx - 27, gTop + 4);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = (time: number) => {
      render(time);
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

  const updateFeedback = (st: number, rep: boolean) => {
    if (rep) setFeedback({ text: '补上物理后果然能用了：需求越强，门开得越大（看门缝开度），猫也能正常用柜子。', cls: 'good' });
    else if (st >= 0.6) setFeedback({ text: '需求越强，空心壳越无能为力：抓不了、推不动、开不了。', cls: 'bad' });
    else setFeedback({ text: '只能看，不能用——它只是没有物理信息的几何壳。', cls: '' });
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value) / 100, 0, 1);
    stateRef.current.strength = v;
    setStrength(v);
    updateFeedback(v, stateRef.current.repaired);
  };

  const onRepair = () => {
    stateRef.current.repaired = true;
    setRepaired(true);
    updateFeedback(stateRef.current.strength, true);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          交互需求强度 <span className="val">{strength.toFixed(2)}</span>
        </label>
        <input type="range" min={0} max={100} value={Math.round(strength * 100)} onChange={onChange} />
        <button className="chip" onClick={onRepair} disabled={repaired}>
          {repaired ? '已用物理思路重做' : '用物理思路重做'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch1Mod1;
