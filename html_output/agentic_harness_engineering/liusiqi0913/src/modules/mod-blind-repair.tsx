import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §1 module: 无观测编辑 vs 证据引导编辑。
// 七个组件文件卡片中暗藏 3 处故障；无观测模式下故障不可见（命中靠猜），
// 证据引导模式下证据报告标出故障组件（每次编辑必中）。右侧命中率统计。

const W = 1080;
const H = 280;

const COL = {
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  bg: '#f4f6f8',
  panel: '#ffffff',
  text: '#21324a',
  muted: '#68778f',
  steel: '#475569',
  border: '#d7deea',
};

type Mode = 'blind' | 'guided';

const NAMES = ['系统提示词', '工具描述', '工具实现', '中间件', '技能', '子智能体', '长期记忆'];
const FAULT_IDX = [1, 3, 5];
const FAULTS = new Set(FAULT_IDX);
const FAULT_NOTES: Record<number, string> = {
  1: '工具描述 · 连续 3 次调用参数解析失败',
  3: '中间件 · 重试钩子未触发',
  5: '子智能体 · 返回结果丢失上下文',
};

const CARD = { x0: 20, y: 18, w: 92, h: 92, gap: 8 };
const PANEL = { x: 20, y: 122, w: 692, h: 78 };

function cardX(i: number) {
  return CARD.x0 + i * (CARD.w + CARD.gap);
}

interface LastEvent {
  idx: number;
  hit: boolean;
  at: number;
}

export const ModBlindRepair: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    mode: 'blind' as Mode,
    attempts: 0,
    hits: 0,
    selected: null as number | null,
    last: null as LastEvent | null,
  });
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>('blind');
  const [feedback, setFeedback] = useState({
    text: '7 个组件文件中藏着 3 处故障。选一种编辑方式，然后点「编辑一次」。',
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

    const drawFileIcon = (x: number, y: number, stroke: string) => {
      const w = 30;
      const h = 38;
      const f = 8;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w - f, y);
      ctx.lineTo(x + w, y + f);
      ctx.lineTo(x + w, y + h);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = COL.panel;
      ctx.fill();
      ctx.strokeStyle = stroke;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + w - f, y);
      ctx.lineTo(x + w - f, y + f);
      ctx.lineTo(x + w, y + f);
      ctx.stroke();
      ctx.strokeStyle = COL.border;
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 3; r++) {
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 16 + r * 7);
        ctx.lineTo(x + w - 6, y + 16 + r * 7);
        ctx.stroke();
      }
    };

    const render = (now: number) => {
      const s = stateRef.current;
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);

      const age = s.last ? now - s.last.at : Infinity;

      // ---- 七张组件卡片 ----
      NAMES.forEach((name, i) => {
        const x = cardX(i);
        const isSel = s.selected === i;
        let border = COL.border;
        let lw = 2;
        let fill = COL.panel;
        if (s.last && s.last.idx === i) {
          if (s.last.hit) {
            border = COL.green;
            lw = 3;
            fill = 'rgba(34,141,92,0.10)';
          } else if (age < 900) {
            const blink = Math.floor(age / 150) % 2 === 0;
            border = blink ? COL.red : COL.border;
            lw = blink ? 3 : 2;
            fill = blink ? 'rgba(196,63,82,0.10)' : COL.panel;
          }
        } else if (isSel) {
          border = COL.steel;
          lw = 3;
        }
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, CARD.y, CARD.w, CARD.h, 8);
        ctx.fill();
        ctx.strokeStyle = border;
        ctx.lineWidth = lw;
        ctx.stroke();

        drawFileIcon(x + (CARD.w - 30) / 2, CARD.y + 10, COL.steel);

        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.text;
        ctx.textAlign = 'center';
        ctx.fillText(name, x + CARD.w / 2, CARD.y + CARD.h - 12);
        ctx.textAlign = 'left';

        // 证据引导模式：故障红点标记
        if (s.mode === 'guided' && FAULTS.has(i)) {
          ctx.beginPath();
          ctx.arc(x + CARD.w - 12, CARD.y + 12, 6, 0, Math.PI * 2);
          ctx.fillStyle = COL.red;
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
        // 选中提示
        if (isSel && !(s.last && s.last.idx === i)) {
          ctx.font = '10px "Segoe UI", sans-serif';
          ctx.fillStyle = COL.steel;
          ctx.textAlign = 'center';
          ctx.fillText('编辑目标', x + CARD.w / 2, CARD.y - 5);
          ctx.textAlign = 'left';
        }
      });

      // ---- 证据区 ----
      if (s.mode === 'guided') {
        ctx.fillStyle = COL.panel;
        ctx.beginPath();
        ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 8);
        ctx.fill();
        ctx.strokeStyle = COL.red;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.red;
        ctx.fillText('证据报告', PANEL.x + 14, PANEL.y + 20);
        ctx.font = '12px "Segoe UI", sans-serif';
        FAULT_IDX.forEach((fi, r) => {
          const ry = PANEL.y + 38 + r * 14;
          ctx.beginPath();
          ctx.arc(PANEL.x + 20, ry - 4, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = COL.red;
          ctx.fill();
          ctx.fillStyle = COL.text;
          ctx.fillText(FAULT_NOTES[fi], PANEL.x + 32, ry);
        });
      } else {
        ctx.strokeStyle = COL.border;
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.roundRect(PANEL.x, PANEL.y, PANEL.w, PANEL.h, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = COL.muted;
        ctx.textAlign = 'center';
        ctx.fillText('无观测模式：没有失败证据，故障位置未知——点击卡片选一个目标，或随机编辑', PANEL.x + PANEL.w / 2, PANEL.y + PANEL.h / 2 + 5);
        ctx.textAlign = 'left';
      }

      // ---- 右侧命中率统计 ----
      const bx = 800;
      const bw = 70;
      const baseY = 216;
      const maxH = 150;
      const rate = s.attempts > 0 ? s.hits / s.attempts : 0;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillStyle = COL.text;
      ctx.fillText('命中率', bx - 6, 36);
      ctx.strokeStyle = COL.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - 24, baseY);
      ctx.lineTo(bx + bw + 190, baseY);
      ctx.stroke();
      const bh = clamp(rate, 0, 1) * maxH;
      ctx.fillStyle = s.attempts === 0 ? COL.border : rate >= 0.99 ? COL.green : COL.blue;
      ctx.fillRect(bx, baseY - bh, bw, bh);
      ctx.font = 'bold 18px "Segoe UI", sans-serif';
      ctx.fillStyle = s.attempts === 0 ? COL.muted : rate >= 0.99 ? COL.green : COL.text;
      ctx.fillText(Math.round(rate * 100) + '%', bx + 8, baseY - bh - 10);
      ctx.font = '14px "Segoe UI", sans-serif';
      ctx.fillStyle = COL.muted;
      ctx.fillText(`尝试 ${s.attempts}`, bx + 100, baseY - 70);
      ctx.fillText(`命中 ${s.hits}`, bx + 100, baseY - 44);

      // 图例（3 项）
      const ly = 258;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.beginPath();
      ctx.arc(800, ly - 4, 5, 0, Math.PI * 2);
      ctx.fillStyle = COL.red;
      ctx.fill();
      ctx.fillStyle = COL.muted;
      ctx.fillText('故障标记', 810, ly);
      ctx.strokeStyle = COL.green;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(880, ly - 9, 10, 10);
      ctx.fillText('命中', 896, ly);
      ctx.strokeStyle = COL.red;
      ctx.strokeRect(948, ly - 9, 10, 10);
      ctx.fillText('未命中', 964, ly);
    };

    const tick = (now: number) => {
      render(now);
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

  const switchMode = (m: Mode) => {
    stateRef.current.mode = m;
    stateRef.current.last = null;
    setMode(m);
    setFeedback(
      m === 'guided'
        ? { text: '先看证据报告定位故障组件，再动手编辑——这就是可观测性的作用', cls: 'good' }
        : { text: '故障标记已隐藏。点击一张卡片选定编辑目标，或直接随机编辑。', cls: '' }
    );
  };

  const edit = () => {
    const s = stateRef.current;
    let idx: number;
    if (s.mode === 'guided') {
      idx = FAULT_IDX[s.attempts % FAULT_IDX.length];
    } else if (s.selected !== null) {
      idx = s.selected;
    } else {
      idx = Math.floor(Math.random() * NAMES.length);
    }
    const hit = FAULTS.has(idx);
    s.attempts += 1;
    if (hit) s.hits += 1;
    s.last = { idx, hit, at: performance.now() };
    if (s.mode === 'guided') {
      setFeedback({ text: '先看证据报告定位故障组件，再动手编辑——这就是可观测性的作用', cls: 'good' });
    } else if (hit) {
      setFeedback({ text: '蒙对了一次，但无法稳定复现', cls: '' });
    } else {
      setFeedback({ text: '没有失败证据时，每次编辑都是猜测', cls: 'bad' });
    }
  };

  const reset = () => {
    stateRef.current.attempts = 0;
    stateRef.current.hits = 0;
    stateRef.current.last = null;
    stateRef.current.selected = null;
    setFeedback({ text: '统计已归零。换一种模式再试几次，比较命中率。', cls: '' });
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    if (y < CARD.y || y > CARD.y + CARD.h) return;
    for (let i = 0; i < NAMES.length; i++) {
      if (x >= cardX(i) && x <= cardX(i) + CARD.w) {
        stateRef.current.selected = i;
        stateRef.current.last = null;
        if (stateRef.current.mode === 'blind') {
          setFeedback({ text: `已选定「${NAMES[i]}」作为编辑目标。点「编辑一次」看结果。`, cls: '' });
        }
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onClick={onCanvasClick}
      />
      <div className="ctrl">
        <div className="chip-row" style={{ marginBottom: 0 }}>
          <button
            type="button"
            className={`chip${mode === 'blind' ? ' selected' : ''}`}
            onClick={() => switchMode('blind')}
          >
            无观测编辑
          </button>
          <button
            type="button"
            className={`chip${mode === 'guided' ? ' selected' : ''}`}
            onClick={() => switchMode('guided')}
          >
            证据引导编辑
          </button>
        </div>
        <button type="button" onClick={edit}>
          编辑一次
        </button>
        <button type="button" onClick={reset}>
          重置
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default ModBlindRepair;
