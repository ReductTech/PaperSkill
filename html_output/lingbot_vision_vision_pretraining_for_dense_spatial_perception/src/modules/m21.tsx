import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch2 Module — Signature ①：随机掩码 vs 边界掩码
const W = 460;
const H = 220;
const COLS = 10;
const ROWS = 5;
const CW = 44;
const CH = 40;
const OX = 14;
const OY = 14;

// 房子/狗轮廓经过的格子（边界 token）
const boundaryCells = new Set<string>();
for (let c = 2; c <= 6; c++) {
  boundaryCells.add(`${c},1`);
  boundaryCells.add(`${c},3`);
}
for (let r = 1; r <= 3; r++) {
  boundaryCells.add(`2,${r}`);
  boundaryCells.add(`6,${r}`);
}
boundaryCells.add('3,0');
boundaryCells.add('4,0');
boundaryCells.add('5,0');

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'random' | 'boundary'>('random');
  const [feedback, setFeedback] = useState({
    text: '点击选择掩码策略：随机掩码大多遮住平坦格，邻居就能猜出（太简单）；边界掩码专挑跨结构格（才值得学）。',
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
    const render = (m: 'random' | 'boundary') => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 底图（狗/房子色块）
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

      // 边界 token 高亮（橙色底，始终可见作对照）
      for (const key of boundaryCells) {
        const [cc, rr] = key.split(',').map(Number);
        ctx.fillStyle = '#d97706';
        ctx.globalAlpha = 0.3;
        ctx.fillRect(OX + cc * CW, OY + rr * CH, CW, CH);
        ctx.globalAlpha = 1;
      }

      // 掩码集
      let masked = new Set<string>();
      if (m === 'random') {
        // 随机遮平坦格（避开边界）
        const flat = ['7,1', '8,2', '1,3', '9,0', '0,2', '3,4'];
        const keep = new Set<string>();
        flat.forEach((k) => {
          if (!boundaryCells.has(k)) keep.add(k);
        });
        masked = keep;
      } else {
        masked = boundaryCells;
      }

      // 画掩码
      for (const key of masked) {
        const [cc, rr] = key.split(',').map(Number);
        ctx.fillStyle = m === 'random' ? '#27446e' : '#c43f52';
        ctx.globalAlpha = 0.75;
        ctx.fillRect(OX + cc * CW + 2, OY + rr * CH + 2, CW - 4, CH - 4);
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('?', OX + cc * CW + 15, OY + rr * CH + 26);
      }

      // 结论标注
      ctx.fillStyle = m === 'random' ? '#27446e' : '#c43f52';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(
        m === 'random' ? 'Easy：邻居已揭示答案' : 'Hard：此格含结构转折，必须真重建',
        OX,
        OY + ROWS * CH + 18
      );

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
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

  const stateRef = useRef<'random' | 'boundary'>('random');
  stateRef.current = mode;

  const setModeState = (m: 'random' | 'boundary') => {
    stateRef.current = m;
    setMode(m);
    setFeedback(
      m === 'random'
        ? { text: '随机掩码：盖住的都是平坦格，邻居一猜就中——模型没学到真正的结构。', cls: 'bad' }
        : { text: '边界掩码：专遮跨结构的边界 token，学生必须凭上下文重建几何——这才是该学的地方。', cls: 'good' }
    );
  };

  return (
    <div className="split-60-40">
      <div className="split-left">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      </div>
      <div className="split-right">
        <button className={`chip ${mode === 'random' ? 'active' : ''}`} onClick={() => setModeState('random')}>
          Random Mask
        </button>
        <button className={`chip ${mode === 'boundary' ? 'active' : ''}`} onClick={() => setModeState('boundary')}>
          Boundary Mask
        </button>
        <div className="mini-card">
          <div className="mini-eq">B = {`{ i : 边界穿过 patch(i) }`}</div>
          <div className="mini-note">Teacher 预测哪些格踩中边界</div>
        </div>
        <div className="mini-card eq-highlight">
          <div className="mini-eq">M⁺ = M ∪ B</div>
          <div className="mini-note">边界 token 强制并入掩码集</div>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
      </div>
    </div>
  );
};

export default M21;
