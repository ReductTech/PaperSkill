import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch1 Module：DINO 学整图语义，iBOT 学局部语义（60/40：左动画 / 右定义）
const W = 460;
const H = 220;
const COLS = 10;
const ROWS = 5;
const CW = 44;
const CH = 40;
const OX = 14;
const OY = 14;

export const M11: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'dino' | 'ibot'>('dino');
  const [feedback, setFeedback] = useState({
    text: 'DINO 用一个 CLS 记号总结整图语义；iBOT 遮掉若干 patch，让学生凭上下文恢复。',
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
    const t0 = performance.now();
    const render = (m: 'dino' | 'ibot', t: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 狗/房子的色块（跨格子）
      for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
          const inBody = c >= 2 && c <= 6 && r >= 1 && r <= 3;
          ctx.fillStyle = inBody ? '#d97706' : c >= 2 && c <= 6 && r === 0 ? '#27446e' : (c + r) % 2 === 0 ? '#ffffff' : '#f2f6ee';
          ctx.fillRect(OX + c * CW, OY + r * CH, CW, CH);
          ctx.strokeStyle = '#d7deea';
          ctx.lineWidth = 1;
          ctx.strokeRect(OX + c * CW + 0.5, OY + r * CH + 0.5, CW, CH);
        }
      }

      if (m === 'dino') {
        // CLS 高亮：整图语义（金色边框闪烁）
        const flash = 0.4 + 0.6 * Math.abs(Math.sin((t - t0) / 400));
        ctx.strokeStyle = `rgba(39,68,110,${flash})`;
        ctx.lineWidth = 4;
        ctx.strokeRect(OX + 2 * CW, OY + 0 * CH, 5 * CW, 4 * CH);
        // CLS 标签
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('CLS', OX + 5 * CW + 12, OY + 1 * CH);
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('↓ 整图语义', OX + 5 * CW + 8, OY + 2 * CH);
        ctx.fillText('“这是狗”', OX + 5 * CW + 14, OY + 3 * CH);
      } else {
        // iBOT：随机几个 patch 变黑，学生补回
        const masked = new Set(['3,2', '5,1', '4,3', '6,2', '2,2']);
        const seg = ((t - t0) / 2600) % 1;
        for (const key of masked) {
          const [cc, rr] = key.split(',').map(Number);
          const filled = seg > 0.5;
          if (!filled) {
            ctx.fillStyle = '#21324a';
            ctx.fillRect(OX + cc * CW, OY + rr * CH, CW, CH);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText('?', OX + cc * CW + 15, OY + rr * CH + 26);
          } else {
            ctx.fillStyle = '#d97706';
            ctx.fillRect(OX + cc * CW, OY + rr * CH, CW, CH);
            ctx.strokeStyle = '#228d5c';
            ctx.lineWidth = 2;
            ctx.strokeRect(OX + cc * CW, OY + rr * CH, CW, CH);
          }
        }
        ctx.fillStyle = '#21324a';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('masked patch', OX + 5 * CW + 8, OY + 1 * CH);
        ctx.fillStyle = '#68778f';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText('↓ 上下文重建', OX + 5 * CW + 8, OY + 2 * CH);
      }

      ctx.fillStyle = '#68778f';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('点击右侧模式，观察 CLS vs masked patch', OX, OY + ROWS * CH + 16);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current, performance.now());
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef<'dino' | 'ibot'>('dino');
  stateRef.current = mode;

  const setModeState = (m: 'dino' | 'ibot') => {
    stateRef.current = m;
    setMode(m);
    setFeedback(
      m === 'dino'
        ? { text: 'DINO：CLS 汇总整张图的语义——“这是什么”。', cls: '' }
        : { text: 'iBOT：随机遮 patch，学生从上下文恢复局部表示——“这里局部是什么”。', cls: '' }
    );
  };

  return (
    <div className="split-60-40">
      <div className="split-left">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
      <div className="split-right">
        <button className={`chip ${mode === 'dino' ? 'active' : ''}`} onClick={() => setModeState('dino')}>
          DINO · 整图语义
        </button>
        <button className={`chip ${mode === 'ibot' ? 'active' : ''}`} onClick={() => setModeState('ibot')}>
          iBOT · 局部语义
        </button>
        <div className="mini-card">
          <div className="mini-eq">CLS → 整图语义</div>
          <div className="mini-note">用一个记号总结整图「这是什么」</div>
        </div>
        <div className="mini-card">
          <div className="mini-eq">掩码 patch → 局部语义</div>
          <div className="mini-note">遮格让学生凭上下文恢复「局部是什么」</div>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
    </div>
  );
};

export default M11;
