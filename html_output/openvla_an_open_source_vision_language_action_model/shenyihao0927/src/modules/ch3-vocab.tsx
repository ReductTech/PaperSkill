import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import { C, drawCheckMark, drawSceneLabel, drawLegend } from './flatKit';
import type { WidgetProps } from './registry';

// 模块 3.1（P4 chips）：词表改造器——切换三款词表方案看名额账本。
// PaLI-X：整数自带专属词直接映射；PaLM-E：征用低频词；Llama 2：名额 100 < 256，
// 覆写 256 个最低频词（低频格逐格涂紫）。
const W = 1080;
const H = 280;

type Mode = 'palix' | 'palme' | 'llama';

const CHIPS: { id: Mode; label: string }[] = [
  { id: 'palix', label: 'RT-2·PaLI-X' },
  { id: 'palme', label: 'RT-2·PaLM-E' },
  { id: 'llama', label: 'OpenVLA·Llama 2' },
];

const FEEDBACK: Record<Mode, { text: string; cls: string }> = {
  palix: { text: 'PaLI-X：整数词现成，直接映射。', cls: '' },
  palme: { text: 'PaLM-E：征用最低频词——OpenVLA 沿用同一招。', cls: '' },
  llama: {
    text: 'Llama 只留 100 个特殊词名额——照旧覆写 256 个最低频词；训练仍是最普通的<b>下一词预测</b>，只对动作词算损失。',
    cls: 'good',
  },
};

// vocabulary band segments (x ranges, top half)
const SEG = { int: [60, 150], low: [150, 360], common: [360, 1020] };
// 256-cell grid (bottom half): 32 cols x 8 rows
const GRID = { x: 430, y: 104, cols: 32, rows: 8, cell: 17 };

export const Ch3Vocab: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ mode: Mode; start: number }>({ mode: 'llama', start: 0 });
  const [mode, setMode] = useState<Mode>('llama');
  const [feedback, setFeedback] = useState(FEEDBACK.llama);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const s = stateRef.current;
      const el = ms - s.start;
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---- top 50%: vocabulary band ----
      const drawSeg = (x1: number, x2: number, fill: string, stroke: string) => {
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.rect(x1, 44, x2 - x1, 36);
        ctx.fill();
        ctx.stroke();
      };
      drawSeg(SEG.common[0], SEG.common[1], '#e6eaf2', C.border);
      drawSeg(SEG.low[0], SEG.low[1], '#e9ddfb', C.purple);
      drawSeg(SEG.int[0], SEG.int[1], C.blue, C.blue);
      drawSceneLabel(ctx, '整数区', 60, 30, { color: C.blue });
      drawSceneLabel(ctx, '低频区', 150, 30, { color: C.purple });
      drawSceneLabel(ctx, '普通词区', 360, 30, { color: C.muted });
      // active-segment highlight per mode
      if (s.mode === 'palix') {
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 3;
        ctx.strokeRect(SEG.int[0] - 2, 42, SEG.int[1] - SEG.int[0] + 4, 40);
        ctx.restore();
        drawCheckMark(ctx, (SEG.int[0] + SEG.int[1]) / 2, 62, 10);
      } else {
        const hl =
          s.mode === 'llama'
            ? { c: C.purple, a: 0.45 + 0.55 * Math.abs(Math.sin(ms / 500)) }
            : { c: C.orange, a: 1 };
        ctx.save();
        ctx.globalAlpha = hl.a;
        ctx.strokeStyle = hl.c;
        ctx.lineWidth = 3;
        ctx.strokeRect(SEG.low[0] - 2, 42, SEG.low[1] - SEG.low[0] + 4, 40);
        ctx.restore();
      }

      // ---- bottom 50%: quota ledger card ----
      const accent = s.mode === 'palix' ? C.green : s.mode === 'palme' ? C.blue : C.orange;
      ctx.save();
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(60, 96, 340, 164, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(60, 96, 5, 164, 3);
      ctx.fill();
      ctx.restore();
      drawSceneLabel(ctx, '名额账本', 84, 120);

      // grid progress (llama sweeps after a short warning beat, palme is quick)
      let lit = 256;
      if (s.mode === 'llama') {
        lit = Math.floor(clamp((el - 400) / 1300, 0, 1) * 256);
      } else if (s.mode === 'palme') {
        lit = Math.floor(clamp(el / 350, 0, 1) * 256);
      }

      if (s.mode === 'palix') {
        ctx.save();
        ctx.fillStyle = C.green;
        ctx.font = 'bold 17px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('整数自带专属词', 84, 160);
        ctx.restore();
        drawCheckMark(ctx, 250, 160, 10);
        drawSceneLabel(ctx, '0…255 直接映射', 84, 196, { color: C.muted });
      } else if (s.mode === 'palme') {
        ctx.save();
        ctx.fillStyle = C.blue;
        ctx.font = 'bold 17px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('征用低频词', 84, 160);
        ctx.restore();
        drawSceneLabel(ctx, 'RT-2 同款做法', 84, 196, { color: C.muted });
      } else {
        ctx.save();
        ctx.fillStyle = C.orange;
        ctx.font = 'bold 18px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('名额 100 < 需求 256', 84, 160);
        ctx.restore();
        drawSceneLabel(ctx, '覆写 256 个最低频词', 84, 196, { color: C.purple });
        drawSceneLabel(ctx, `${lit}/256`, 84, 232, { color: C.purple });
      }

      // ---- bottom right: 256-cell grid ----
      for (let r = 0; r < GRID.rows; r++) {
        for (let c2 = 0; c2 < GRID.cols; c2++) {
          const idx = r * GRID.cols + c2;
          ctx.fillStyle =
            s.mode === 'palix' ? '#5a79a8' : idx < lit ? C.purple : '#dfe4ee';
          ctx.beginPath();
          ctx.roundRect(
            GRID.x + c2 * GRID.cell,
            GRID.y + r * GRID.cell,
            GRID.cell - 1,
            GRID.cell - 1,
            2
          );
          ctx.fill();
        }
      }
      if (s.mode === 'palix') {
        ctx.save();
        ctx.strokeStyle = C.green;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(GRID.x - 6, GRID.y - 6, GRID.cols * GRID.cell + 10, GRID.rows * GRID.cell + 10, 8);
        ctx.stroke();
        ctx.restore();
      }
      if (s.mode === 'palix') {
        drawLegend(ctx, [['整数专属词', C.blue]], GRID.x, 262);
      } else {
        drawLegend(
          ctx,
          [
            ['未用低频词', '#9aa7bd'],
            ['动作口令', C.purple],
          ],
          GRID.x,
          262
        );
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (m: Mode) => {
    stateRef.current = { mode: m, start: performance.now() };
    setMode(m);
    setFeedback(FEEDBACK[m]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <div className="chip-row">
          {CHIPS.map((c) => (
            <button
              key={c.id}
              className={`chip ${mode === c.id ? 'selected' : ''}`}
              onClick={() => pick(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
      <div
        className={`feedback ${feedback.cls}`}
        dangerouslySetInnerHTML={{ __html: feedback.text }}
      />
    </div>
  );
};

export default Ch3Vocab;
