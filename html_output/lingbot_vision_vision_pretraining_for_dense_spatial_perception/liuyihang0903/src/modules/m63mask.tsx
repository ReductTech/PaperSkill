import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch6 Module 1 —— 边界强制掩码 M⁺ = M ∪ B（随机掩码 + 边界掩码并集示意）
const W = 560;
const H = 220;
const GRID = 12; // 12x12 patch 网格
const CW = 30;
const OX = (W - GRID * CW) / 2;
const OY = 24;

// 随机掩码（淡橙）与边界掩码（紫）的 patch 集合（索引 i*GRID+j）
const RANDOM = new Set([3, 8, 15, 21, 26, 33, 41, 47, 52, 58, 63, 70, 76, 82, 88, 95, 99, 104, 111, 117, 123, 129, 136, 141]);
const BOUNDARY = new Set([60, 61, 62, 72, 73, 74, 84, 85, 86, 71, 83, 95, 107, 119, 131, 143]);

export const M63Mask: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stage, setStage] = useState<0 | 1 | 2>(0); // 0 随机 | 1 随机+边界 | 2 并集 M⁺
  const [feedback, setFeedback] = useState({
    text: '点「并入边界」看随机掩码 M 与边界 token 集 B 如何合成 M⁺ = M ∪ B。',
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
    const render = (s: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 画 patch 网格
      for (let i = 0; i < GRID; i++) {
        for (let j = 0; j < GRID; j++) {
          const idx = i * GRID + j;
          const x = OX + j * CW;
          const y = OY + i * CW;
          const isRand = RANDOM.has(idx);
          const isBnd = BOUNDARY.has(idx);
          ctx.strokeStyle = '#d7e0ea';
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, CW, CW);
          if (s === 0) {
            if (isRand) {
              ctx.fillStyle = '#d97706';
              ctx.fillRect(x + 1, y + 1, CW - 2, CW - 2);
            }
          } else if (s === 1) {
            if (isRand) {
              ctx.fillStyle = '#d97706';
              ctx.fillRect(x + 1, y + 1, CW - 2, CW - 2);
            }
            if (isBnd) {
              ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
              ctx.fillRect(x + 1, y + 1, CW - 2, CW - 2);
            }
          } else {
            if (isRand || isBnd) {
              ctx.fillStyle = isBnd ? '#7c3aed' : '#d97706';
              ctx.fillRect(x + 1, y + 1, CW - 2, CW - 2);
            }
          }
        }
      }

      // 图例
      const ly = OY + GRID * CW + 16;
      ctx.font = '12px "Segoe UI", sans-serif';
      if (s === 0) {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(OX, ly, 14, 14);
        ctx.fillStyle = '#333';
        ctx.fillText('随机掩码 M（与内容无关）', OX + 20, ly + 12);
      } else if (s === 1) {
        ctx.fillStyle = '#d97706';
        ctx.fillRect(OX, ly, 14, 14);
        ctx.fillStyle = '#333';
        ctx.fillText('M 随机', OX + 20, ly + 12);
        ctx.fillStyle = '#7c3aed';
        ctx.fillRect(OX + 100, ly, 14, 14);
        ctx.fillStyle = '#333';
        ctx.fillText('B 边界（验证线段穿过）', OX + 120, ly + 12);
      } else {
        ctx.fillStyle = '#333';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('M⁺ = M ∪ B：边界 patch 被强制遮住', OX, ly + 12);
      }
    };
    const start = () => {
      render(stage);
    };
    const stop = () => {};
    const disconnect = observeCanvas(canvas, start, stop);
    return () => disconnect();
  }, [stage]);

  return (
    <div className="widget">
      <canvas ref={canvasRef} width={W} height={H} style={{ maxWidth: '100%' }} />
      <div className="widget-controls">
        <button onClick={() => { setStage(0); setFeedback({ text: '普通 iBOT：只随机遮 patch，边界很少被遮住，结构几乎不进入学习。', cls: 'ok' }); }}>只随机</button>
        <button onClick={() => { setStage(1); setFeedback({ text: '紫色是验证线段穿过的边界 patch：结构密集、信息最密，却常被随机掩码漏掉。', cls: 'ok' }); }}>并入边界</button>
        <button onClick={() => { setStage(2); setFeedback({ text: 'M⁺ = M ∪ B：边界 patch 全部被强制遮住——模型必须凭上下文重建被藏的结构。', cls: 'ok' }); }}>看并集 M⁺</button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};
