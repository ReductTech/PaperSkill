import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §7 Module 7.2 — 四步可复现检查：逐步点亮，每一步对应生态里已有的机制。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const BORDER = '#d7deea';

const ITEMS = [
  '统一随机种子',
  '产物持久化',
  '重载一致性',
  '记录缺失机制',
];

const COPY = [
  '一个种子管全栈：set_random_seed 一次性给 Python、NumPy 与 PyTorch 播种，把种子连同结果一起记录。',
  '产物落盘：指标、预测数组与实验日志一起保存，图表随时可重建。',
  '重载一致：把 checkpoint 载入一个全新的模型实例，复现出同样的输出——这才说明保存是有效的。',
  '记录缺失机制与缺失率：自然缺失与人工评估缺失都要写清楚，这是最容易被漏掉的一步。',
];

export const Ch7Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ check: 0 });
  const rafRef = useRef<number | null>(null);
  const [check, setCheck] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '四项检查都还没做：这样的结果别人无法重跑。还剩 4 项未核对。',
    cls: '',
  });

  const go = (next: number) => {
    const c = Math.max(0, Math.min(4, next));
    stateRef.current.check = c;
    setCheck(c);
    if (c === 0)
      setFeedback({
        text: '四项检查都还没做：这样的结果别人无法重跑。还剩 4 项未核对。',
        cls: '',
      });
    else {
      const remaining = 4 - c;
      const suffix = remaining > 0 ? `还剩 ${remaining} 项未核对。` : '四项检查全部完成。';
      setFeedback({
        text: `${COPY[c - 1]}${suffix}`,
        cls: c >= 3 ? 'good' : '',
      });
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { check: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 244, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 244);
      ctx.lineTo(W, 244);
      ctx.stroke();

      // left: four checklist rows
      const lx = 60;
      ITEMS.forEach((item, i) => {
        const y = 50 + i * 46;
        const done = s.check > i;
        const current = s.check === i + 1;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(lx, y, 560, 36);
        ctx.strokeStyle = done ? GREEN : BORDER;
        ctx.lineWidth = done || current ? 2 : 1;
        ctx.strokeRect(lx, y, 560, 36);
        if (done) {
          ctx.fillStyle = GREEN;
          ctx.fillRect(lx, y, 6, 36);
        }
        ctx.fillStyle = done ? GREEN : '#21324a';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(item, lx + 20, y + 24);
        // checkbox
        ctx.strokeStyle = done ? GREEN : BORDER;
        ctx.lineWidth = 2;
        ctx.strokeRect(lx + 520, y + 9, 18, 18);
        if (done) {
          ctx.beginPath();
          ctx.moveTo(lx + 524, y + 18);
          ctx.lineTo(lx + 529, y + 23);
          ctx.lineTo(lx + 535, y + 12);
          ctx.stroke();
        }
      });

      // right: four progress rings
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(680, 50, 340, 180);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(680, 50, 340, 180);
      for (let i = 0; i < 4; i++) {
        const cx = 740 + (i % 2) * 150;
        const cy = 110 + Math.floor(i / 2) * 80;
        const done = s.check > i;
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(cx, cy, 24, 0, Math.PI * 2);
        ctx.stroke();
        if (done) {
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(cx, cy, 24, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2);
          ctx.stroke();
        }
        if (s.check === i + 1) {
          ctx.strokeStyle = BLUE;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, cy, 31, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('检查项', 60, 34);
      ctx.fillText('进度', 700, 34);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button className="tiny" type="button" onClick={() => go(check - 1)} disabled={check === 0}>
          上一步
        </button>
        <span className="step-label">
          第 <b>{check}</b> / 4 项
        </span>
        <button className="tiny" type="button" onClick={() => go(check + 1)} disabled={check === 4}>
          {check === 4 ? '已完成' : '下一步'}
        </button>
        <button className="tiny" type="button" onClick={() => go(0)}>
          重来
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch7Mod2;
