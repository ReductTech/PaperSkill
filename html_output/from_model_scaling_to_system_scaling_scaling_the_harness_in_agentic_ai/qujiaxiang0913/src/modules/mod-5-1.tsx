import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { clearScene, drawLogbook, drawBars, drawSceneLabel, C } from './lighthouseKit';
import type { WidgetProps } from './registry';

// §5 Module 5.1 — 切换三种失效模式（P4 模式芯片）。
// 左侧航海日志按模式加红色横线 / 橙色范围括号 / 紫色外框；右侧记忆四子轴评分。

const W = 1080;
const H = 300;

interface Mode {
  label: string;
  key: 'good' | 'drift' | 'over' | 'poll';
  vals: [number, number, number, number];
}
const MODES: Mode[] = [
  { label: '完好', key: 'good', vals: [0.9, 0.85, 0.8, 0.85] },
  { label: '漂移 drift', key: 'drift', vals: [0.85, 0.15, 0.8, 0.5] },
  { label: '过度泛化', key: 'over', vals: [0.2, 0.8, 0.8, 0.6] },
  { label: '污染 pollution', key: 'poll', vals: [0.55, 0.7, 0.8, 0.1] },
];

const LOG_X = 40;
const LOG_Y = 30;
const LOG_W = 360;
const LOG_H = 240;

export const Mod51: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState(0);
  const [feedback, setFeedback] = useState({ text: '点选一种状态，看同一条记录如何变质。', cls: '' });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { mode: number }) => {
      clearScene(ctx, W, H);
      const m = MODES[s.mode];
      const badRow = m.key === 'drift' ? 1 : -1;
      drawLogbook(ctx, LOG_X, LOG_Y, LOG_W, LOG_H, 3, badRow);

      // 过度泛化：在变质行左侧加橙色范围括号
      if (m.key === 'over') {
        const gap = LOG_H / (3 + 1);
        const ry = LOG_Y + gap * (1 + 1);
        ctx.strokeStyle = C.mark;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(LOG_X + 8, ry - 16);
        ctx.lineTo(LOG_X + 1, ry - 16);
        ctx.lineTo(LOG_X + 1, ry + 16);
        ctx.lineTo(LOG_X + 8, ry + 16);
        ctx.stroke();
      }
      // 污染：整本日志加紫色外框
      if (m.key === 'poll') {
        ctx.strokeStyle = C.aux;
        ctx.lineWidth = 4;
        ctx.strokeRect(LOG_X - 6, LOG_Y - 6, LOG_W + 12, LOG_H + 12);
      }

      drawBars(ctx, 470, 60, 560, [
        { label: '精确性 precision', value: m.vals[0], color: C.beam },
        { label: '耐久性 durability', value: m.vals[1], color: C.hit },
        { label: '可取回性 retrievability', value: m.vals[2], color: C.mark },
        { label: '可验证性 verifiability', value: m.vals[3], color: C.aux },
      ]);

      drawSceneLabel(ctx, LOG_X, 18, '航海日志');
      drawSceneLabel(ctx, 470, 48, '记忆四轴');
    };

    const tick = () => {
      render({ mode: modeRef.current });
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

  const select = (idx: number) => {
    modeRef.current = idx;
    setMode(idx);
    const m = MODES[idx];
    if (m.key === 'good') {
      setFeedback({ text: '四个子轴都健康，这条记录可以直接用。', cls: 'good' });
    } else if (m.key === 'drift') {
      setFeedback({ text: '目标已经变了，文字却没变——过时却自信。', cls: 'bad' });
    } else if (m.key === 'over') {
      setFeedback({ text: '把一次经验说成了普遍规律，精确性塌陷。', cls: 'bad' });
    } else {
      setFeedback({ text: '内容被掺入不可信来源，可验证性塌陷。', cls: 'bad' });
    }
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {MODES.map((m, i) => (
          <button key={m.key} className="chip" aria-pressed={mode === i} onClick={() => select(i)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Mod51;
