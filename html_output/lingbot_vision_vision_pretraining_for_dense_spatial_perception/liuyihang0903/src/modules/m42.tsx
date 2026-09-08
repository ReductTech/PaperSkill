import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 2 — 签名交互 ②：噪声提议 → 角点吸附 → 投票
const W = 560;
const H = 220;

const CORNERS: Array<[number, number]> = [
  [90, 60],
  [300, 44],
  [80, 170],
  [330, 172],
];

const PROPOSALS = Array.from({ length: 34 }, (_, i) => {
  const from = i % 4;
  const to = (i * 7 + 3) % 4;
  if (to === from) return null;
  const sx = CORNERS[from][0] + (Math.sin(i * 12.9898) * 24);
  const sy = CORNERS[from][1] + (Math.cos(i * 78.233) * 22);
  const tx = CORNERS[to][0] + (Math.sin(i * 4.7) * 26);
  const ty = CORNERS[to][1] + (Math.cos(i * 3.1) * 24);
  return { from, to, sx, sy, tx, ty };
}).filter((p) => p !== null);

const VOTE_MATRIX: Record<string, number> = {
  '0-1': 31,
  '2-3': 26,
  '0-2': 5,
  '1-3': 4,
  '0-3': 2,
  '1-2': 3,
};

export const M42: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [snapped, setSnapped] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '看到许多带噪声的线段提议了吗？点击「吸附到角点」，看它们如何汇聚成真正的线段。',
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
    const render = (snap: boolean) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      for (const [cx, cy] of CORNERS) {
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      CORNERS.forEach(([cx, cy], i) => ctx.fillText('C' + (i + 1), cx - 8, cy - 10));

      PROPOSALS.forEach((p) => {
        if (!p) return;
        ctx.strokeStyle = snap ? '#7c3aed' : '#b8c9a7';
        ctx.globalAlpha = snap ? 0.35 : 0.6;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (snap) {
          ctx.moveTo(CORNERS[p.from][0], CORNERS[p.from][1]);
          ctx.lineTo(CORNERS[p.to][0], CORNERS[p.to][1]);
        } else {
          ctx.moveTo(p.sx, p.sy);
          ctx.lineTo(p.tx, p.ty);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      });

      if (snap) {
        const drawVoteLine = (a: number, b: number) => {
          const votes = VOTE_MATRIX[`${a}-${b}`] || VOTE_MATRIX[`${b}-${a}`] || 0;
          if (votes <= 3) return;
          const width = 1.5 + (votes / 31) * 4;
          ctx.strokeStyle = votes > 15 ? '#228d5c' : '#27446e';
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(CORNERS[a][0], CORNERS[a][1]);
          ctx.lineTo(CORNERS[b][0], CORNERS[b][1]);
          ctx.stroke();
          const mx = (CORNERS[a][0] + CORNERS[b][0]) / 2;
          const my = (CORNERS[a][1] + CORNERS[b][1]) / 2;
          ctx.fillStyle = '#21324a';
          ctx.font = 'bold 12px "Segoe UI", sans-serif';
          ctx.fillText(votes + ' 票', mx - 16, my - 8);
        };
        drawVoteLine(0, 1);
        drawVoteLine(2, 3);
        drawVoteLine(0, 2);
        drawVoteLine(1, 3);
        drawVoteLine(1, 2);
        drawVoteLine(0, 3);
      }

      const gx = 430;
      const gy = 40;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(gx, gy, 110, 120);
      ctx.strokeStyle = '#d7deea';
      ctx.strokeRect(gx, gy, 110, 120);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText('投票矩阵', gx + 10, gy + 20);
      const pairs: Array<[number, number]> = [
        [0, 1],
        [2, 3],
        [0, 2],
        [1, 3],
      ];
      ctx.font = '12px "Segoe UI", sans-serif';
      pairs.forEach(([a, b], i) => {
        const votes = VOTE_MATRIX[`${a}-${b}`] || VOTE_MATRIX[`${b}-${a}`] || 0;
        ctx.fillStyle = '#68778f';
        ctx.fillText(`C${a + 1}–C${b + 1}`, gx + 10, gy + 44 + i * 22);
        ctx.fillStyle = votes > 15 ? '#228d5c' : '#27446e';
        ctx.fillRect(gx + 62, gy + 36 + i * 22, (votes / 31) * 40, 10);
        ctx.fillStyle = '#21324a';
        ctx.fillText(String(votes), gx + 106, gy + 44 + i * 22);
      });

      if (snap) {
        ctx.fillStyle = '#228d5c';
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('许多弱预测在同一全局线段上达成一致', 24, H - 10);
      } else {
        ctx.fillStyle = '#68778f';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillText('单看每条提议都像噪声', 24, H - 10);
      }

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

  const stateRef = useRef(false);
  stateRef.current = snapped;

  const snap = () => {
    stateRef.current = true;
    setSnapped(true);
    setFeedback({
      text: '每条提议的端点被吸附到最近角点，同一角点对的票数不断累积——C1–C2 与 C3–C4 得到最多票，成为可信线段（论文 Fig.4d）。',
      cls: 'good',
    });
  };
  const reset = () => {
    stateRef.current = false;
    setSnapped(false);
    setFeedback({ text: '回到初始：只有噪声提议。再点「吸附到角点」体验投票的力量。', cls: '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        {!snapped ? (
          <button className="btn" onClick={snap}>
            Snap to corners（吸附到角点）
          </button>
        ) : (
          <button className="btn" onClick={reset}>
            重置
          </button>
        )}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M42;
