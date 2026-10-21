import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, drawCyclist, loopX, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch2 Module 2.1 (P4): stride 8/16/32 — denser grid watches small objects,
// coarser grid saves effort on large ones. Linked views: slope riding + grid.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const FB: Record<number, { text: string; cls: string }> = {
  8: { text: '细网格盯小物体：6 px 目标可能被锚点中心覆盖，也可能落空——位置不巧时就是零正样本，这正是第 9 章要修的问题。', cls: '' },
  16: { text: '中档兼顾：最常见的物体尺度落在这里。', cls: '' },
  32: { text: '粗网格省力看大图：大物体交给它，但 6 px 目标在这里没有任何锚点中心。', cls: 'bad' },
};

const BAND: Record<number, string> = { 8: '4–32 px', 16: '16–64 px', 32: '64–256 px' };
const SLOPE: Record<number, number> = { 8: 1, 16: 0.5, 32: 0.12 };
const CELLS: Record<number, number> = { 8: 64, 16: 32, 32: 16 };
const GEAR: Record<number, number> = { 8: 0, 16: 1, 32: 2 };
const BOXSIDE: Record<number, number> = { 8: 22, 16: 52, 32: 110 };

export const Ch2Strides: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stride: 16, slope: 0.5, fade: 1 });
  const [stride, setStride] = useState(16);
  const [fb, setFb] = useState(FB[16]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current.stride;
      // eased slope + a short fade-in on the grid after switching stride
      stateRef.current.slope = lerp(stateRef.current.slope, SLOPE[s], 0.14);
      stateRef.current.fade = Math.min(1, stateRef.current.fade + 0.06);
      const d = stateRef.current.slope;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: slope riding, gentler for larger stride ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 500, 54);
      const slopeH = lerp(70, 8, d);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(500, 232 - slopeH); ctx.stroke();
      const t = (time / 2800) % 1;
      const px = loopX(t, 500, 60);
      const axleY = 232 - (px / 500) * slopeH - 12 + Math.sin(t * Math.PI * (8 + d * 10)) * (4 - d * 2.5);
      drawCyclist(ctx, px, axleY, {
        scale: 0.85, color: C.blue,
        wheelPhase: px / 12, pedalPhase: px / (26 - d * 10),
      });
      // gear indicator: three toothed cogs labeled by stride — the engaged
      // gear spins slowly and glows, so the metaphor reads at a glance
      const gearIdx = GEAR[s];
      const gearLabels = ['8', '16', '32'];
      ctx.fillStyle = C.muted; ctx.font = '11px sans-serif';
      ctx.fillText('档位', 30, 20);
      for (let i = 0; i < 3; i++) {
        const gx = 56 + i * 56; const gy = 44; const r = 11 + i * 3;
        const active = i === gearIdx;
        const col = active ? C.blue : C.muted;
        if (active) {
          ctx.strokeStyle = 'rgba(39,68,110,0.22)'; ctx.lineWidth = 6;
          ctx.beginPath(); ctx.arc(gx, gy, r + 6, 0, Math.PI * 2); ctx.stroke();
        }
        // teeth — the engaged gear rotates
        ctx.strokeStyle = col; ctx.lineWidth = active ? 2.5 : 1.5;
        const spin = active ? time / 900 : 0;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + spin;
          ctx.beginPath();
          ctx.moveTo(gx + Math.cos(a) * r, gy + Math.sin(a) * r);
          ctx.lineTo(gx + Math.cos(a) * (r + 4), gy + Math.sin(a) * (r + 4));
          ctx.stroke();
        }
        ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.stroke();
        // hub
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(gx, gy, 2.5, 0, Math.PI * 2); ctx.fill();
        // stride label under the cog
        ctx.font = '11px sans-serif';
        ctx.fillText(gearLabels[i], gx - ctx.measureText(gearLabels[i]).width / 2, gy + r + 15);
      }
      // ---- right inset: grid + anchors + responsible band ----
      ctx.fillStyle = '#fff'; ctx.fillRect(540, 20, 520, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(540, 20, 520, 240);
      ctx.save();
      ctx.globalAlpha = stateRef.current.fade;
      const cells = CELLS[s];
      const gx0 = 580; const gy0 = 50; const gs = 192;
      ctx.strokeStyle = '#dfe6f0'; ctx.lineWidth = 1;
      const step = gs / Math.sqrt(cells);
      for (let i = 0; i <= Math.sqrt(cells); i++) {
        ctx.beginPath(); ctx.moveTo(gx0 + i * step, gy0); ctx.lineTo(gx0 + i * step, gy0 + gs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx0, gy0 + i * step); ctx.lineTo(gx0 + gs, gy0 + i * step); ctx.stroke();
      }
      // anchor centers (every other grid intersection)
      ctx.fillStyle = C.muted;
      for (let i = 0; i < Math.sqrt(cells); i += 2) {
        for (let j = 0; j < Math.sqrt(cells); j += 2) {
          ctx.beginPath(); ctx.arc(gx0 + (i + 0.5) * step, gy0 + (j + 0.5) * step, 2, 0, Math.PI * 2); ctx.fill();
        }
      }
      // typical responsible box band
      const boxSide = BOXSIDE[s];
      ctx.strokeStyle = C.blue; ctx.lineWidth = 2.5;
      ctx.strokeRect(800 - boxSide / 2, 146 - boxSide / 2, boxSide, boxSide);
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
      ctx.fillText(BAND[s], 800 - 30, 146 + boxSide / 2 + 18);
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('s = ' + s, 580, 244);
      ctx.restore();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  const pick = (v: number) => {
    stateRef.current.stride = v;
    stateRef.current.fade = 0;
    setStride(v);
    setFb(FB[v]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {[8, 16, 32].map((v) => (
            <button key={v} className={`chip ${stride === v ? 'selected' : ''}`} onClick={() => pick(v)}>stride {v}</button>
          ))}
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch2Strides;
