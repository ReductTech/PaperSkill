import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawBar } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;
const AXIS_MAX = 4.8;

const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

// Verbatim from Table 3 (full text supplied): DI and LI distance tables.
const DI = [4.0035, 4.2322, 4.3458, 4.2379, 4.2508, 4.3243, 4.3895, 4.4665];
const LI = [2.4142, 2.6702, 2.7640, 2.5559, 2.6304, 2.7586, 2.6929, 2.8363];

const MODES = [
  {
    id: 'li', label: '零宽字符 LI', color: COLORS.blue, filled: false,
    tool: 'pyUnicodeSteganography',
    what: '在字母之间插入零宽 Unicode 字符（例如 U+200F）。原文字符全部保留，只是词内多了看不见的字符。',
    data: LI,
    note: 'Liminal Injection：字面完全没变，只在字母之间藏入零宽字符，改动最轻。',
  },
  {
    id: 'di', label: '同形字 DI', color: COLORS.green, filled: true,
    tool: 'SilverSpeak',
    what: '把可替换的字母换成不同书写系统的形近字（例如拉丁 o U+006F 换成西里尔 о U+043E）。',
    data: DI,
    note: 'Doppelgänger Injection：因为默认 100% 替换，原文字符所剩无几，所以距离最大、效果最强。',
  },
  {
    id: 'si', label: '拼写差异 SI', color: COLORS.red, filled: false,
    tool: 'eng',
    what: '把美式拼写换成英式拼写（例如 emphasize → emphasise），制造“拼错”的效果。',
    data: null,
    note: 'Surrealist Injection：diff 显示它只改动了极少数词，论文因此没有把它纳入注入内部的最终比较。',
  },
];

const CELLS = 6;

export const Ch9Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [mode, setMode] = useState('di');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (id: string) => {
      clearScene(ctx, W, H);
      const m = MODES.find((x) => x.id === id) || MODES[1];
      const startX = 90;
      const cellW = 70;

      for (let i = 0; i < CELLS; i++) {
        const x = startX + i * cellW;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, 70, cellW - 10, 60);
        ctx.strokeStyle = COLORS.line;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 70, cellW - 10, 60);
        const letter = ['h', 'e', 'l', 'l', 'o', '!'][i];
        ctx.fillStyle = m.filled && i < 5 ? COLORS.green : COLORS.ink;
        ctx.font = '34px monospace';
        ctx.fillText(letter, x + 16, 112);
        if (m.id === 'li' && i < CELLS - 1) {
          ctx.fillStyle = COLORS.purple;
          ctx.beginPath();
          ctx.arc(x + cellW - 5, 60, 5, 0, Math.PI * 2);
          ctx.fill();
        }
        if (m.id === 'si' && i === 1) {
          ctx.strokeStyle = COLORS.orange;
          ctx.lineWidth = 4;
          ctx.strokeRect(x - 3, 63, cellW - 4, 74);
        }
      }

      const values = m.data;
      const shown = values ? avg(values) : 0;
      drawBar(ctx, 620, 88, 380, 30, shown / AXIS_MAX, m.color);
      ctx.fillStyle = COLORS.ink;
      ctx.font = '22px "PingFang SC", sans-serif';
      ctx.fillText(values ? shown.toFixed(2) : '—', 620, 80);
    };

    const tick = () => {
      render(mode);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf.current = requestAnimationFrame(tick);
    };
    const stop = () => { if (raf.current) cancelAnimationFrame(raf.current); raf.current = null; };
    const start = () => { if (!raf.current) raf.current = requestAnimationFrame(tick); };
    const off = observeCanvas(canvas, start, stop);
    return () => { stop(); off(); };
  }, [mode]);

  const current = MODES.find((m) => m.id === mode) || MODES[1];
  const data = current.data;

  return (
    <div>
      <canvas ref={ref} width={W} height={H} />
      <div className="ctrl chips">
        {MODES.map((m) => (
          <button key={m.id} className={'chip' + (mode === m.id ? ' selected' : '')} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="detail-panel" style={{ marginTop: 12 }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{current.label}（{current.tool}）</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>{current.what}</li>
          {data ? (
            <>
              <li>全文实验距离：{Math.min(...data).toFixed(4)} – {Math.max(...data).toFixed(4)}，平均 {avg(data).toFixed(2)}。</li>
              <li>8 列数值：{data.map((v) => v.toFixed(4)).join(' / ')}</li>
            </>
          ) : (
            <li>论文未给出 SI 的距离表：diff 显示改动过少，已排除出这一轮比较。</li>
          )}
        </ul>
      </div>
      <div className={'feedback ' + (current.id === 'di' ? 'good' : current.id === 'si' ? 'bad' : '')}>{current.note}</div>
    </div>
  );
};

export default Ch9Mod1;
