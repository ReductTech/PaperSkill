import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, lerp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1 Module 1.2 (P4): with-DFL vs DFL-free head — parameters, FLOPs and the
// regression range cap (K-1)*stride. Bars ease toward their targets on chip switch.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

const FB = {
  old: { text: 'DFL 把 4 个数扩成 64 个 logits：头更重，回归范围被锁在 (K−1)×stride 内。', cls: '' },
  neu: { text: '移除 DFL：参数 −12%、FLOPs −20%（nano 模型），回归不再受限——定位质量由 L1 损失与 STAL 补回。', cls: 'good' },
};

export const Ch1Lighten: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ p: 2.6, f: 6.5, r: 480, needle: 0.62, dfl: true, swap: 1 });
  const [dfl, setDfl] = useState(true);
  const [fb, setFb] = useState(FB.old);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const bar = (x: number, y: number, wMax: number, val: number, max: number, color: string) => {
      ctx.fillStyle = '#e8edf5'; ctx.fillRect(x, y, wMax, 24);
      ctx.fillStyle = color; ctx.fillRect(x, y, wMax * clamp01(val / max), 24);
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
    };
    const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

    const render = (time: number) => {
      const s = stateRef.current;
      const tgt = s.dfl
        ? { p: 2.6, f: 6.5, r: 480 }
        : { p: 2.3, f: 5.2, r: 1010 };
      s.p = lerp(s.p, tgt.p, 0.18); s.f = lerp(s.f, tgt.f, 0.18); s.r = lerp(s.r, tgt.r, 0.18);
      s.needle = lerp(s.needle, 0.62 + Math.sin(time / 480) * 0.02, 0.2);
      const col = s.dfl ? C.blue : C.green;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // three bars
      ctx.fillStyle = C.text; ctx.font = '14px sans-serif';
      ctx.fillText('参数量', 60, 62);
      bar(150, 46, 560, s.p, 3, col);
      ctx.fillText(s.p.toFixed(1) + ' M', 726, 64);
      ctx.fillText('计算量', 60, 132);
      bar(150, 116, 560, s.f, 7, col);
      ctx.fillText(s.f.toFixed(1) + ' G', 726, 134);
      ctx.fillText('单边回归上限', 60, 202);
      bar(150, 186, 560, s.r, 1010, col);
      if (s.dfl) {
        // red truncation cap at 480 px per side (K=16, s=32)
        ctx.strokeStyle = C.red; ctx.lineWidth = 3;
        ctx.strokeRect(150 + 560 * (480 / 1010) - 4, 182, 8, 32);
        ctx.fillStyle = C.red; ctx.font = '12px sans-serif';
        ctx.fillText('截断 480 px', 150 + 560 * (480 / 1010) - 14, 176);
      } else {
        ctx.fillStyle = C.green; ctx.font = '12px sans-serif';
        ctx.fillText('不限', 694, 176);
      }
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText('s=32、K=16：单边上限 (K−1)×stride = 480 px；整框宽/高界 ≈ 2(K−1)×stride ≈ 960 px', 60, 258);
      // right gauge icon: dial vs digital — cross-fades on chip switch
      s.swap = Math.min(1, s.swap + 0.055);
      const gx = 920; const gy = 130;
      ctx.save();
      ctx.globalAlpha = easeOutCubic(s.swap);
      ctx.strokeStyle = C.muted; ctx.lineWidth = 2;
      ctx.strokeRect(840, 40, 170, 180);
      if (s.dfl) {
        ctx.strokeStyle = C.route; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(gx, gy + 20, 44, Math.PI, 0); ctx.stroke();
        for (let i = 0; i <= 16; i++) {
          const a = Math.PI + (i / 16) * Math.PI;
          ctx.strokeStyle = i === 16 ? C.red : C.muted; ctx.lineWidth = i % 4 === 0 ? 2.5 : 1;
          ctx.beginPath();
          ctx.moveTo(gx + Math.cos(a) * 38, gy + 20 + Math.sin(a) * 38);
          ctx.lineTo(gx + Math.cos(a) * 44, gy + 20 + Math.sin(a) * 44);
          ctx.stroke();
        }
        ctx.strokeStyle = C.blue; ctx.lineWidth = 3;
        const a = Math.PI + s.needle * Math.PI;
        ctx.beginPath(); ctx.moveTo(gx, gy + 20); ctx.lineTo(gx + Math.cos(a) * 32, gy + 20 + Math.sin(a) * 32); ctx.stroke();
      } else {
        ctx.fillStyle = C.green; ctx.fillRect(gx - 52, gy - 6, 104, 40);
        ctx.fillStyle = '#fff'; ctx.font = '24px monospace';
        ctx.fillText('1204', gx - 32, gy + 22);
      }
      ctx.restore();
    };

    return startCanvasLoop(canvas, render);
  }, []);

  const pick = (v: boolean) => {
    stateRef.current.dfl = v;
    stateRef.current.swap = 0; // restart the gauge cross-fade
    setDfl(v);
    setFb(v ? FB.old : FB.neu);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          <button className={`chip ${dfl ? 'selected' : ''}`} onClick={() => pick(true)}>带 DFL（旧）</button>
          <button className={`chip ${!dfl ? 'selected' : ''}`} onClick={() => pick(false)}>移除 DFL（本文）</button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch1Lighten;
