import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COLORS, clearScene, drawPaperSheet } from './paper-kit';
import type { WidgetProps } from './registry';

const W = 1080;
const H = 280;

const LEVEL_WORD = ['低', '中', '高'];

const MODES = [
  {
    id: 't', label: '翻译', levels: [1, 1, 2],
    note: '翻译会明显压低可读性并连带损伤语义，同时换来一定的安全度。',
    reason: '论文：Translation and Obfuscation noticeably diminish a text\u2019s Sensibility, which correspondingly ushers in expected detriments to Soundness.',
  },
  {
    id: 'o', label: '混淆', levels: [1, 1, 2],
    note: '混淆与翻译同样伤及可读与语义，安全度提升也相近。',
    reason: '论文把翻译与混淆并列，指出二者都在牺牲语义与可读的前提下提升安全度。',
  },
  {
    id: 'i', label: '模仿', levels: [3, 3, 2],
    note: '模仿靠大模型重写，把翻译与混淆弄崩的可读性补回来，但单独使用时不足以造成误判。',
    reason: '论文：Imitation, by its reliance on an LLM, tends to address those shortcomings.',
  },
  {
    id: 'in', label: '注入', levels: [3, 3, 3],
    note: '正常渲染下，注入对语义与可读几乎没有影响，同时把安全度抬到最高。',
    reason: '论文：Injection has nearly zero impact on Soundness and Sensibility, and it imparts a similar positive increase in Safety.',
  },
];

const ROWS = [
  { y: 74, label: '语义完整度' },
  { y: 140, label: '可读性' },
  { y: 206, label: '安全度' },
];

export const Ch5Mod1: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef<number | null>(null);
  const [mode, setMode] = useState('in');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try { ctx = setupCanvas(canvas, W, H); } catch { return; }

    const render = (id: string) => {
      clearScene(ctx, W, H);
      const m = MODES.find((x) => x.id === id) || MODES[3];
      drawPaperSheet(ctx, 40, 30, W - 80, 220);
      for (let r = 0; r < ROWS.length; r++) {
        const row = ROWS[r];
        const filled = m.levels[r];
        for (let k = 0; k < 3; k++) {
          const x = 320 + k * 220;
          const on = k < filled;
          ctx.fillStyle = on
            ? r === 2
              ? filled === 3 ? COLORS.green : COLORS.orange
              : COLORS.blue
            : '#edf1ea';
          ctx.fillRect(x, row.y, 190, 34);
          ctx.strokeStyle = COLORS.line;
          ctx.lineWidth = 2;
          ctx.strokeRect(x, row.y, 190, 34);
        }
        ctx.fillStyle = COLORS.ink;
        ctx.font = '24px "PingFang SC", sans-serif';
        ctx.fillText(String(r + 1), 70, row.y + 26);
      }
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

  const current = MODES.find((m) => m.id === mode) || MODES[3];

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
        <div style={{ fontWeight: 700, marginBottom: 8 }}>三项指标的定性档位</div>
        <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.8 }}>
          {ROWS.map((row, i) => (
            <li key={row.label}>{row.label}：{LEVEL_WORD[current.levels[i] - 1]}</li>
          ))}
        </ul>
        <div style={{ marginTop: 8, color: 'var(--paper-ink-muted)' }}>
          论文以定性方式描述这三项指标，未给出可复现的数值评分；这里只呈现档位，不臆造百分比。
        </div>
      </div>
      <div className="feedback">{current.note}{current.reason}</div>
    </div>
  );
};

export default Ch5Mod1;
