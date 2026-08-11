import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { C, clearScene, drawSceneLabel, drawLegend } from './kit-p2';
import type { WidgetProps } from './registry';

// Ch5 M5.1: P4 chips A/B/C — shortcut style + top-1 error bars (Table 3).
const W = 560;
const H = 240;

const OPTIONS = [
  { id: 'A', label: 'A 补零恒等', err: 25.03, note: '无额外参数', cls: '' },
  { id: 'B', label: 'B 升维投影', err: 24.52, note: '仅升维处用 1×1 投影', cls: 'good' },
  { id: 'C', label: 'C 全投影', err: 24.19, note: '13 处投影，参数更多', cls: '' },
];

export const Ch5Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ option: 'B' as string, seen: new Set<string>(['B']) });
  const rafRef = useRef<number | null>(null);
  const [option, setOption] = useState('B');
  const [seenAll, setSeenAll] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    const render = (s: { option: string; seen: Set<string> }) => {
      clearScene(ctx, W, H);
      const cur = OPTIONS.find((o) => o.id === s.option) || OPTIONS[1];
      // mini architecture sketch
      const bx = 40;
      const by = 70;
      const bw = 60;
      const bh = 26;
      for (let i = 0; i < 2; i++) {
        ctx.strokeStyle = C.border;
        ctx.fillStyle = C.white;
        ctx.lineWidth = 1.5;
        ctx.fillRect(bx + i * (bw + 30), by, bw, bh);
        ctx.strokeRect(bx + i * (bw + 30), by, bw, bh);
        ctx.fillStyle = C.ink;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('conv', bx + i * (bw + 30) + bw / 2, by + bh / 2 + 4);
      }
      // shortcut line between blocks
      const x1 = bx + bw;
      const y1 = by + bh / 2;
      const x2 = bx + (bw + 30) + bw;
      const y2 = y1;
      if (cur.id === 'A') {
        ctx.strokeStyle = C.green;
        ctx.setLineDash([4, 3]);
      } else if (cur.id === 'B') {
        ctx.strokeStyle = C.orange;
        ctx.setLineDash([]);
        ctx.fillStyle = C.orange;
        ctx.fillRect((x1 + x2) / 2 - 5, y1 - 5, 10, 10);
      } else {
        ctx.strokeStyle = C.purple;
        ctx.setLineDash([]);
      }
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x1, y1 - 8);
      ctx.lineTo(x2, y2 - 8);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.ink;
      ctx.textAlign = 'left';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('捷径：' + cur.label, bx, by + bh + 24);
      ctx.fillStyle = C.muted;
      ctx.fillText(cur.note, bx, by + bh + 44);
      // error bars
      const ox = 330;
      const oy = 190;
      const maxErr = 30;
      drawSceneLabel(ctx, 'top-1 误差（越低越好）', ox, 40, C.muted);
      // plain-34 baseline
      ctx.fillStyle = '#b8c9a7';
      ctx.fillRect(ox, oy - (28.54 / maxErr) * 120, 180, 12);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('plain-34  28.54', ox, oy - (28.54 / maxErr) * 120 - 14);
      OPTIONS.forEach((o, i) => {
        const h = (o.err / maxErr) * 120;
        const y = oy - h;
        const isSel = o.id === cur.id;
        ctx.fillStyle = isSel ? C.green : C.border;
        ctx.fillRect(ox, y, 180, 12);
        ctx.fillStyle = isSel ? C.ink : C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(`${o.label}  ${o.err}`, ox, y - 4);
      });
      drawLegend(ctx, [
        { color: C.green, label: '选中' },
        { color: '#b8c9a7', label: 'plain 基线' },
      ], ox, oy + 22);
    };
    const tick = () => {
      render(stateRef.current);
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

  const pick = (id: string) => {
    const seen = new Set(stateRef.current.seen);
    seen.add(id);
    stateRef.current.option = id;
    stateRef.current.seen = seen;
    setOption(id);
    setSeenAll(seen.size === 3);
  };

  const cur = OPTIONS.find((o) => o.id === option) || OPTIONS[1];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {OPTIONS.map((o) => (
          <button key={o.id} className={`chip ${o.id === option ? 'active' : ''}`} onClick={() => pick(o.id)}>
            {o.label}
          </button>
        ))}
      </div>
      <div className="feedback">
        {seenAll
          ? '三种方案都远好于 plain（28.54）；B 略好于 A、C 略好于 B，但差距很小——投影对解决退化并非必需。'
          : `方案 ${cur.id}：${cur.label}，top-1 误差 ${cur.err}%，${cur.note}。`}
      </div>
    </div>
  );
};

export default Ch5Mod1;
