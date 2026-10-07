import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, startCanvasLoop, lerp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch9 Module 9.1 (P1+P4): the zero-supervision blind spot. When the box side is
// under the 8 px minimum stride, no anchor center falls inside the GT box, so
// TAL gives it zero positives. STAL screens with a 16 px proxy box instead.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', light: '#b8c9a7', route: '#92400e', purple: '#7c3aed', orange: '#f07e47',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', text: '#21324a', muted: '#68778f',
};

// 8x8 anchor centers in a 64 px field, scaled x3 for display
const CENTERS = [4, 12, 20, 28, 36, 44, 52, 60];

const countHits = (sidePx: number) => {
  let n = 0;
  for (const cx of CENTERS) for (const cy of CENTERS) {
    if (Math.abs(cx - 32) <= sidePx / 2 && Math.abs(cy - 32) <= sidePx / 2) n++;
  }
  return n;
};

export const Ch9Stal: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sizePx: 6, method: 'stal' });
  const easeRef = useRef({ size: 6, hits: countHits(16) });
  const [sizePx, setSizePx] = useState(6);
  const [method, setMethod] = useState<'tal' | 'stal'>('stal');
  const [fb, setFb] = useState({ text: '代理框只用于候选筛选，回归仍用原始真值框——小目标拿回监督，s_ref=16 时 APS +0.6。', cls: 'good' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (time: number) => {
      const s = stateRef.current;
      const e = easeRef.current;
      // eased box size so slider drags glide instead of snapping
      e.size = lerp(e.size, s.sizePx, 0.16);
      const screenSide = s.method === 'stal' ? (e.size < 8 ? 16 : e.size) : e.size;
      const hits = countHits(screenSide);
      // eased count-up for the badge number
      e.hits = lerp(e.hits, hits, 0.2);
      const hitsShown = Math.round(e.hits);
      const zero = hits === 0;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // ---- left: rider tightening the screw ----
      ctx.fillStyle = C.light; ctx.fillRect(0, 226, 460, 54);
      ctx.strokeStyle = C.route; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(0, 232); ctx.lineTo(460, 232); ctx.stroke();
      // frame with a tiny screw
      ctx.strokeStyle = C.blue; ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(140, 200); ctx.lineTo(220, 120); ctx.lineTo(360, 200); ctx.lineTo(140, 200);
      ctx.stroke();
      const sx = 220; const sy = 120;
      const screwR = Math.max(4, e.size * 0.8);
      ctx.fillStyle = zero ? C.red : C.green;
      ctx.beginPath(); ctx.arc(sx, sy, screwR, 0, Math.PI * 2); ctx.fill();
      if (zero) {
        // pulsing warning
        ctx.fillStyle = C.red;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time / 150);
        ctx.font = '13px sans-serif';
        ctx.fillText('松动!', sx + 16, sy - 10);
        ctx.globalAlpha = 1;
      } else {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(sx - screwR * 0.5, sy); ctx.lineTo(sx - screwR * 0.15, sy + screwR * 0.4); ctx.lineTo(sx + screwR * 0.6, sy - screwR * 0.4); ctx.stroke();
      }
      // wrench
      const wig = zero ? Math.sin(time / 90) * 0.3 : Math.sin(time / 200) * 0.08;
      const wa = -Math.PI / 3 + wig;
      ctx.strokeStyle = C.muted; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(sx + 30 * Math.cos(wa), sy + 30 * Math.sin(wa)); ctx.lineTo(sx + 88 * Math.cos(wa), sy + 88 * Math.sin(wa)); ctx.stroke();
      // ---- right inset: anchor grid ----
      ctx.fillStyle = '#fff'; ctx.fillRect(500, 20, 560, 240);
      ctx.strokeStyle = '#d7deea'; ctx.lineWidth = 2; ctx.strokeRect(500, 20, 560, 240);
      const gx0 = 570; const gy0 = 44; const sc = 3;
      // grid lines (8 px cells)
      ctx.strokeStyle = '#e4eaf2'; ctx.lineWidth = 1;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(gx0 + i * 8 * sc, gy0); ctx.lineTo(gx0 + i * 8 * sc, gy0 + 64 * sc); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(gx0, gy0 + i * 8 * sc); ctx.lineTo(gx0 + 64 * sc, gy0 + i * 8 * sc); ctx.stroke();
      }
      // gt box (orange) and STAL proxy (purple dashed, marching ants)
      const bcx = gx0 + 32 * sc; const bcy = gy0 + 32 * sc;
      if (s.method === 'stal' && e.size < 8) {
        ctx.strokeStyle = C.purple; ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -time / 40;
        ctx.strokeRect(bcx - (16 * sc) / 2, bcy - (16 * sc) / 2, 16 * sc, 16 * sc);
        ctx.setLineDash([]);
      }
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2.5;
      ctx.strokeRect(bcx - (e.size * sc) / 2, bcy - (e.size * sc) / 2, e.size * sc, e.size * sc);
      // anchor centers: green if inside, gray otherwise
      for (const cx of CENTERS) for (const cy of CENTERS) {
        const inside = Math.abs(cx - 32) <= screenSide / 2 && Math.abs(cy - 32) <= screenSide / 2;
        ctx.fillStyle = inside ? C.green : '#b6c0cf';
        ctx.beginPath(); ctx.arc(gx0 + cx * sc, gy0 + cy * sc, inside ? 4 : 2.5, 0, Math.PI * 2); ctx.fill();
      }
      // count badge
      ctx.fillStyle = zero ? C.red : C.green;
      ctx.fillRect(830, 60, 190, 52);
      ctx.fillStyle = '#fff'; ctx.font = '15px sans-serif';
      ctx.fillText(`正样本计数：${hitsShown}`, 846, 92);
      ctx.fillStyle = C.muted; ctx.font = '12px sans-serif';
      ctx.fillText(s.method === 'stal' ? 'd<8 时按 16 筛选，否则按 d' : '筛选尺寸 = d', 830, 140);
      ctx.fillText(`真值框：${s.sizePx} px`, 830, 164);
    };

    return startCanvasLoop(canvas, render);
  }, []);

  const update = (size: number, m: 'tal' | 'stal') => {
    stateRef.current.sizePx = size;
    stateRef.current.method = m;
    setSizePx(size); setMethod(m);
    if (m === 'tal' && size < 8) setFb({ text: '框内没有任何锚点中心：该目标 0 正样本、0 梯度，训练时等于不存在。', cls: 'bad' });
    else if (m === 'tal') setFb({ text: 'TAL 正常覆盖。', cls: '' });
    else if (size < 8) setFb({ text: '代理框只用于候选筛选，回归仍用原始真值框——小目标拿回监督，s_ref=16 时 APS +0.6。', cls: 'good' });
    else setFb({ text: 'd ≥ 8 时按原始 d 筛选，STAL 与 TAL 一致——代理仅在 d < 8 时介入。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <label>
          真值框边长 <span className="val">{sizePx} px</span>
        </label>
        <input type="range" min={4} max={24} value={sizePx} onChange={(e) => update(Number(e.target.value), method)} />
        <div className="chip-row">
          <button className={`chip ${method === 'tal' ? 'selected' : ''}`} onClick={() => update(sizePx, 'tal')}>TAL（旧）</button>
          <button className={`chip ${method === 'stal' ? 'selected' : ''}`} onClick={() => update(sizePx, 'stal')}>STAL（本文）</button>
        </div>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch9Stal;
