import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Chap9Mod1 — Merge strategy + H-mAP trade-off bars (P4 chip + bars).

const W = 560;
const H = 220;

const STRATEGIES: Record<string, { name: string; map: number; hmap: number; levels: number; color: string; cls: string; feedback: string }> = {
  baseline: { name: 'Baseline (仅末层)', map: 49.33, hmap: 50.67, levels: 1, color: '#d7deea', cls: '', feedback: 'Baseline：仅用 ViT 末层 F^L，mAP 49.33，H-mAP 50.67。' },
  concat: { name: '(a) 拼接 (Concat)', map: 50.25, hmap: 51.60, levels: 3, color: '#c43f52', cls: '', feedback: '拼接：把多尺度特征 concat 后投影；提升有限 (50.25 / 51.60)。' },
  sum: { name: '(b) 逐元素求和', map: 50.31, hmap: 51.55, levels: 3, color: '#c43f52', cls: '', feedback: '逐元素求和：与 concat 类似，未带来显著增益。' },
  perlayer: { name: '(c) 逐层投影', map: 49.88, hmap: 50.92, levels: 4, color: '#c43f52', cls: 'bad', feedback: '逐层独立投影：<b>增加复杂度反而下降</b>，49.88 / 50.92。' },
  lvsa: { name: '(d) LVSA 共享投影（本文）', map: 51.57, hmap: 53.02, levels: 5, color: '#228d5c', cls: 'good', feedback: '<b>LVSA + 共享投影</b>：最佳权衡，51.57 / 53.02（论文 Table 5）。' },
};

type Key = keyof typeof STRATEGIES;
const ORDER: Key[] = ['baseline', 'concat', 'sum', 'perlayer', 'lvsa'];

export const Chap9Mod1: React.FC<WidgetProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ sel: 'lvsa' as Key, anim: 0 });
  const rafRef = useRef<number | null>(null);
  const [sel, setSel] = useState<Key>('lvsa');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = () => {
      const s = stateRef.current;
      s.anim = Math.min(1, s.anim + 0.05);
      const a = easeOutCubic(s.anim);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      const ox = 30, oy = 30, w = W - 60, h = H - 60;

      // axis baseline
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(ox, oy + h);
      ctx.lineTo(ox + w, oy + h);
      ctx.stroke();

      // vertical lines for the 5 strategies
      const colW = w / ORDER.length;
      const maxVal = 55; // mAP/H-mAP max in this plot
      ORDER.forEach((k, i) => {
        const s2 = STRATEGIES[k];
        const cx = ox + i * colW + colW / 2;
        // strategy label
        ctx.fillStyle = k === s.sel ? '#21324a' : '#68778f';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(s2.name, cx, oy + h + 14);

        // mAP bar (blue)
        const mh = (s2.map / maxVal) * (h - 30) * a;
        ctx.fillStyle = '#27446e';
        ctx.fillRect(cx - 16, oy + h - mh, 14, mh);
        // H-mAP bar (green)
        const hh = (s2.hmap / maxVal) * (h - 30) * a;
        ctx.fillStyle = '#228d5c';
        ctx.fillRect(cx + 2, oy + h - hh, 14, hh);

        // value labels on top
        ctx.fillStyle = '#27446e';
        ctx.font = 'bold 10px "Segoe UI", sans-serif';
        ctx.fillText(s2.map.toFixed(1), cx - 9, oy + h - mh - 4);
        ctx.fillStyle = '#228d5c';
        ctx.fillText(s2.hmap.toFixed(1), cx + 9, oy + h - hh - 4);

        // highlight selected
        if (k === s.sel) {
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.strokeRect(cx - 22, oy + 2, 44, h - 8);
        }
      });

      // legend
      ctx.fillStyle = '#27446e';
      ctx.fillRect(ox, 4, 10, 8);
      ctx.fillStyle = '#21324a';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('mAP', ox + 14, 12);
      ctx.fillStyle = '#228d5c';
      ctx.fillRect(ox + 50, 4, 10, 8);
      ctx.fillText('H-mAP', ox + 64, 12);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(render);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = (e.clientX - rect.left) * (W / rect.width);
      const sy = (e.clientY - rect.top) * (H / rect.height);
      const w = W - 60;
      const colW = w / ORDER.length;
      const x = sx - 30;
      if (sy < H - 30 && x >= 0 && x <= w) {
        const idx = Math.min(ORDER.length - 1, Math.floor(x / colW));
        const k = ORDER[idx];
        stateRef.current.sel = k;
        stateRef.current.anim = 0;
        setSel(k);
      }
    };
    canvas.addEventListener('click', onClick);

    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(render); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); canvas.removeEventListener('click', onClick); };
  }, []);

  const cur = STRATEGIES[sel];

  return (
    <div>
      <canvas ref={canvasRef} width={W} height={H} style={{ cursor: 'pointer' }} />
      <div className="chip-row">
        {ORDER.map((k) => (
          <button key={k} className={`chip ${sel === k ? 'selected' : ''}`} onClick={() => { stateRef.current.sel = k; stateRef.current.anim = 0; setSel(k); }}>
            {STRATEGIES[k].name}
          </button>
        ))}
      </div>
      <div className={`feedback ${cur.cls}`} dangerouslySetInnerHTML={{ __html: cur.feedback }} />
    </div>
  );
};

export default Chap9Mod1;
