import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet, drawBar } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const MIN_WORDS = 200;
const MAX_WORDS = 12000;
const TICK_WORDS = 10000; // Savoy threshold cited by the paper (Appendix 0.A)

export const Ch1Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ words: 2000 });
  const raf = useRef<number | null>(null);
  const [words, setWords] = useState(2000);
  const [fb, setFb] = useState({ text: '拖动滑块，观察文本量与归属确定性的关系。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { words: number }) => {
      clearScene(ctx, W, H);
      drawPaperSheet(ctx, 60, 40, 520, 200);

      const rows = 2 + Math.round(14 * ((s.words - MIN_WORDS) / (MAX_WORDS - MIN_WORDS)));
      ctx.strokeStyle = COLORS.ink;
      ctx.lineWidth = 3;
      for (let i = 0; i < rows; i++) {
        const y = 66 + i * 12;
        ctx.beginPath();
        ctx.moveTo(96, y);
        ctx.bezierCurveTo(240, y - 5, 380, y + 5, 548, y - 2);
        ctx.stroke();
      }

      const conf = s.words >= TICK_WORDS ? 0.95 : 0.15 + 0.6 * (s.words / TICK_WORDS);
      const color = s.words >= TICK_WORDS ? COLORS.red : COLORS.blue;
      drawBar(ctx, 700, 130, 300, 30, conf, color);

      const tickX = 700 + 300 * (TICK_WORDS / MAX_WORDS);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = COLORS.orange;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tickX, 116);
      ctx.lineTo(tickX, 174);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = COLORS.orange;
      ctx.font = '16px "PingFang SC", sans-serif';
      ctx.fillText('10,000', tickX - 24, 192);
      ctx.fillStyle = COLORS.ink;
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.fillText((conf * 100).toFixed(0) + '%', 700, 118);
    };

    const tick = () => {
      render(st.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = clamp(Number(e.target.value), MIN_WORDS, MAX_WORDS);
    st.current.words = v;
    setWords(v);
    setFb(
      v >= TICK_WORDS
        ? { text: '已越过论文引用的约 10,000 词阈值：如此规模的文本足以支撑高置信度的作者归属。', cls: 'bad' }
        : { text: '文本偏短：可用于比对的风格证据不足，归属结论仍不稳定。', cls: '' }
    );
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl">
        <label>可用文本量 <span className="val">{words} 词</span></label>
        <input type="range" min={MIN_WORDS} max={MAX_WORDS} step={100} value={words} onChange={onChange} />
      </div>
      <div className={'feedback ' + fb.cls}>{fb.text}</div>
    </div>
  );
};

export default Ch1Mod1;
