import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, clearScene, drawPainter, drawOrderSheet, drawSceneLabel, drawLegend, C } from './studioKit';
import type { WidgetProps } from './registry';

// §1 模块 1.1：长度阶梯 + 散文/结构化切换（P1 + 芯片，混合视图）
const W = 1080, H = 280;

export const M111: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const [len, setLen] = useState(400);
  const [mode, setMode] = useState<'nl' | 'sp'>('nl');

  useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    clearScene(ctx, W, H);
    const rung = Math.min(5, Math.max(0, Math.round((len - 400) / 340)));
    const rows = Array.from({ length: 3 + rung * 2 }, (_, i) => ({ boxed: mode === 'sp', filled: mode === 'sp' && (i < rung) }));
    drawOrderSheet(ctx, 30, 40, 140, 150, rows);
    drawPainter(ctx, 240, 190, -0.9);
    drawSceneLabel(ctx, `提示词 ${len} 词`, 30, 28);
    const ox = 330, oy = 150, pw = 700, ph = 100;
    ctx.strokeStyle = C.border; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + pw, oy); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - ph + 20); ctx.stroke();
    drawSceneLabel(ctx, 'GSB vs 自己最短提示', ox, oy + 26, true);
    const names = ['Qwen-Image', 'Hunyuan 3.0', 'BAGEL', 'Emu3', 'FLUX.1'];
    names.forEach((nm, i) => {
      ctx.strokeStyle = mode === 'nl' ? C.red : C.border;
      ctx.lineWidth = mode === 'nl' ? 2 : 1;
      ctx.globalAlpha = mode === 'nl' ? 1 : 0.35;
      ctx.beginPath();
      for (let k = 0; k <= 5; k++) {
        const x = ox + (k / 5) * pw;
        const y = oy - (mode === 'nl' ? Math.max(-ph + 24, 12 - k * 7 - i * 1.5) : 6);
        k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = C.muted; ctx.font = '11px "Microsoft YaHei", sans-serif';
      ctx.fillText(nm, ox + pw - 70, oy - ph + 14 + i * 12);
    });
    ctx.strokeStyle = C.green; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let k = 0; k <= 5; k++) {
      const x = ox + (k / 5) * pw;
      const y = oy - (mode === 'sp' ? k * 12 : 2);
      k === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    const mx = ox + (rung / 5) * pw;
    ctx.strokeStyle = C.orange; ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(mx, oy + 6); ctx.lineTo(mx, oy - ph + 16); ctx.stroke();
    ctx.setLineDash([]);
    drawLegend(ctx, [
      { color: C.red, text: '散文 NL' },
      { color: C.green, text: '结构化 SP' },
    ], ox + pw - 100, oy - ph + 30);
  }, [len, mode]);

  const fb = len === 400
    ? { text: '起点：各模型与自己的短提示打平。', cls: 'fb-blue' }
    : mode === 'nl'
      ? { text: `长度 ${len}：所有开放权重模型都低于自己的短提示基线（GSB < 0）`, cls: 'fb-red' }
      : { text: '同样长度：结构化提示持续上升——新增的是信息，不是字数', cls: 'fb-green' };

  return (
    <div className="widget">
      <canvas ref={ref} style={{ width: '100%', maxWidth: W }} />
      <div className="ctrl-row">
        <label>提示词长度
          <input type="range" min={400} max={2100} step={340} value={len}
            onChange={(e) => setLen(Number(e.target.value))} />
        </label>
        <button className={mode === 'nl' ? 'chip chip-on' : 'chip'} onClick={() => setMode('nl')}>散文 NL</button>
        <button className={mode === 'sp' ? 'chip chip-on' : 'chip'} onClick={() => setMode('sp')}>结构化 SP</button>
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};
