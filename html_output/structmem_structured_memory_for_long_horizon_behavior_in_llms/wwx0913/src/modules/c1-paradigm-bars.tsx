import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { COL, clearScene, drawAxisBox, legend, label } from './sceneKit';
import type { WidgetProps } from './registry';

// 模块 1.2：三种记忆范式的四类任务表现。chip 切换范式，柱图与 DOM 指标区同步更新。

const W = 1080;
const H = 280;
const X0 = 40;
const PANEL_W = 1000;
const BASE = 240;
const TOP = 40;
const LO = 40;
const HI = 85;

type Paradigm = 'flat' | 'graph' | 'struct';

const DATA: Record<Paradigm, { multi: number; open: number; single: number; temp: number }> = {
  flat: { multi: 66.31, open: 46.88, single: 78.83, temp: 78.5 },
  graph: { multi: 66.67, open: 48.96, single: 80.5, temp: 76.64 },
  struct: { multi: 68.77, open: 46.88, single: 81.09, temp: 81.62 },
};

const TASKS: { key: 'multi' | 'open' | 'single' | 'temp'; name: string }[] = [
  { key: 'multi', name: '多跳' },
  { key: 'open', name: '开放域' },
  { key: 'single', name: '单跳' },
  { key: 'temp', name: '时序' },
];

const CHIPS: { id: Paradigm; title: string }[] = [
  { id: 'flat', title: '扁平记忆' },
  { id: 'graph', title: '图记忆' },
  { id: 'struct', title: 'StructMem' },
];

const yOf = (v: number): number => BASE - ((v - LO) / (HI - LO)) * (BASE - TOP);

export const C1ParadigmBars: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ paradigm: Paradigm }>({ paradigm: 'flat' });
  const [paradigm, setParadigm] = useState<Paradigm>('flat');
  const [feedback, setFeedback] = useState({
    text: '扁平记忆：单跳与开放域尚可，多跳与时序偏低，关系没有落点。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = () => {
      const cur = stateRef.current.paradigm;
      const row = DATA[cur];
      clearScene(ctx, W, H, true);
      drawAxisBox(ctx, X0, 40, PANEL_W, 200);

      const slot = PANEL_W / TASKS.length;
      const barW = 120;

      TASKS.forEach((task, i) => {
        const v = row[task.key];
        const bx = X0 + slot * i + (slot - barW) / 2;
        const by = yOf(v);
        const bh = BASE - by;
        ctx.fillStyle = 'rgba(215,222,234,0.28)';
        ctx.fillRect(bx, by, barW, bh);
        ctx.strokeStyle = COL.axis;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, barW, bh);

        if (task.key === 'temp' && cur === 'graph') {
          ctx.strokeStyle = COL.red;
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, by, barW, bh);
        } else {
          ctx.strokeStyle = COL.blue;
          ctx.lineWidth = 3;
          ctx.strokeRect(bx, by, barW, bh);
        }
      });

      label(ctx, '多跳', X0 + slot * 0.5, 34, COL.ink, 'center', 20);
      label(ctx, '时序', X0 + slot * 3.5, 34, COL.ink, 'center', 20);
      legend(
        ctx,
        [
          { c: COL.blue, t: '当前范式' },
          { c: COL.axis, t: '柱高=分数' },
          { c: COL.red, t: '时序退步' },
        ],
        X0 + 4,
        268
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const pick = (id: Paradigm) => {
    stateRef.current.paradigm = id;
    setParadigm(id);
    if (id === 'flat') {
      setFeedback({
        text: '扁平记忆：单跳与开放域尚可，多跳与时序偏低，关系没有落点。',
        cls: '',
      });
    } else if (id === 'graph') {
      setFeedback({
        text: '图记忆：单跳提升到 80.50，时序反而降到 76.64，比扁平记忆更低。',
        cls: 'bad',
      });
    } else {
      setFeedback({
        text: 'StructMem：四类任务都优于扁平记忆，时序 81.62、综合 76.82。',
        cls: 'good',
      });
    }
  };

  const row = DATA[paradigm];

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {CHIPS.map((c) => (
          <button
            key={c.id}
            className={`chip ${paradigm === c.id ? 'selected' : ''}`}
            onClick={() => pick(c.id)}
            type="button"
          >
            {c.title}
          </button>
        ))}
      </div>
      <div className="metrics">
        {TASKS.map((task) => (
          <div className="metric" key={task.key}>
            <div className="l">{task.name}</div>
            <div className="v">{row[task.key].toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default C1ParadigmBars;
