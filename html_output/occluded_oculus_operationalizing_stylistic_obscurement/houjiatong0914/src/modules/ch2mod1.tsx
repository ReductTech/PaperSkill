import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const FEATURES = [
  { id: 'function', label: '功能词频率', desc: '论文开篇列出的第一类特征：the / of / and 这类高频功能词的出现频率，是最稳定的风格信号。' },
  { id: 'ngram', label: '字符级与词级 n-gram', desc: '连续字符片段与连续词序列的统计，捕捉拼写与用词的细粒度习惯；论文同时提到这两级 n-gram。' },
  { id: 'pos', label: '词性分布', desc: '名词、动词、连词等词性分布，反映句法节奏。' },
  { id: 'richness', label: '词汇丰富度', desc: '词汇多样性与重复率，反映作者用词的广度。' },
];

const CELLS = [
  { x: 70, y: 60, w: 230, h: 70 },
  { x: 320, y: 60, w: 230, h: 70 },
  { x: 570, y: 60, w: 230, h: 70 },
  { x: 820, y: 60, w: 180, h: 70 },
];

export const Ch2Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const st = useRef({ feature: 'function' });
  const raf = useRef<number | null>(null);
  const [feature, setFeature] = useState('function');
  const [fb, setFb] = useState({ text: '点击画布上的编号区域或下方按钮，查看识别器提取的四类特征。', cls: '' });

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (s: { feature: string }) => {
      clearScene(ctx, W, H);
      drawPaperSheet(ctx, 40, 150, W - 80, 100);
      ctx.font = '22px "PingFang SC", sans-serif';
      for (let i = 0; i < CELLS.length; i++) {
        const c = CELLS[i];
        const active = FEATURES[i].id === s.feature;
        ctx.fillStyle = active ? 'rgba(39,68,110,0.14)' : 'rgba(255,255,255,0.75)';
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeStyle = active ? COLORS.blue : COLORS.line;
        ctx.lineWidth = active ? 5 : 2;
        ctx.strokeRect(c.x, c.y, c.w, c.h);
        ctx.fillStyle = active ? COLORS.blue : COLORS.muted;
        ctx.font = '30px "PingFang SC", sans-serif';
        ctx.fillText(String(i + 1), c.x + 14, c.y + 46);
      }
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

  const select = (id: string) => {
    st.current.feature = id;
    setFeature(id);
    const f = FEATURES.find((x) => x.id === id);
    setFb({ text: f ? f.desc : '', cls: '' });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    const hit = CELLS.findIndex((c) => x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h);
    if (hit >= 0) select(FEATURES[hit].id);
  };

  return (
    <div>
      <canvas ref={ref} width={W} height={H} onClick={onCanvasClick} style={{ cursor: 'pointer' }} />
      <div className="ctrl chips">
        {FEATURES.map((f, i) => (
          <button key={f.id} className={'chip' + (feature === f.id ? ' selected' : '')} onClick={() => select(f.id)}>
            {i + 1}. {f.label}
          </button>
        ))}
      </div>
      <div className="feedback">{fb.text}</div>
    </div>
  );
};

export default Ch2Mod1;
