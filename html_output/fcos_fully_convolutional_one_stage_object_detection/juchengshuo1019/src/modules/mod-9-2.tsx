// mod-9-2 (P4): overlapping boards — choose the minimal-area box vs arbitrary.
import React, { useRef, useState, useEffect } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import { palette, clearScene, drawBoard, drawNail } from './carpentry-kit';

const W = 1080, H = 280;

function drawOverlap(canvas: HTMLCanvasElement, rule: 'min' | 'any'): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  clearScene(ctx, W, H);
  // big board and small board overlapping
  const big = { x: 180, y: 50, w: 420, h: 180 };
  const small = { x: 380, y: 90, w: 220, h: 120 };
  drawBoard(ctx, big.x, big.y, big.w, big.h);
  drawBoard(ctx, small.x, small.y, small.w, small.h);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '14px sans-serif';
  ctx.fillText('大框（狗）', big.x + 12, big.y + 28);
  ctx.fillText('小框（猫）', small.x + 12, small.y + 28);
  // nail in overlap
  const nx = 470, ny = 150;
  drawNail(ctx, nx, ny, palette.nail, 9);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('重叠区的钉位', nx + 18, ny - 12);
  // highlight chosen box
  const chosen = rule === 'min' ? small : big;
  ctx.strokeStyle = rule === 'min' ? palette.good : palette.bad;
  ctx.lineWidth = 5;
  ctx.strokeRect(chosen.x, chosen.y, chosen.w, chosen.h);
  // note panel
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = palette.techBorder;
  ctx.lineWidth = 2;
  ctx.fillRect(700, 60, 320, 130);
  ctx.strokeRect(700, 60, 320, 130);
  ctx.fillStyle = palette.ink;
  ctx.font = '15px sans-serif';
  ctx.fillText('分层后残余歧义', 720, 95);
  ctx.font = 'bold 24px sans-serif';
  ctx.fillStyle = rule === 'min' ? palette.good : palette.bad;
  ctx.fillText('约 3.8%', 720, 135);
  ctx.fillStyle = palette.inkMuted;
  ctx.font = '13px sans-serif';
  ctx.fillText('不同类别重叠的处理（论文表 2）', 720, 162);
  if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
}

export const Mod92: React.FC<{ chapterId: string; moduleId: string }> = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [rule, setRule] = useState<'min' | 'any'>('min');

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    setupCanvas(canvas, W, H);
    drawOverlap(canvas, 'min');
    const disconnect = observeCanvas(canvas, () => drawOverlap(canvas, rule), () => {});
    return () => disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = ref.current;
    if (canvas) drawOverlap(canvas, rule);
  }, [rule]);

  return (
    <div>
      <canvas ref={ref} aria-label="重叠区选框规则" />
      <div className="controls" role="group" aria-label="选框规则">
        <button type="button" className={`chip${rule === 'min' ? ' active' : ''}`} onClick={() => setRule('min')}>
          选面积最小
        </button>
        <button type="button" className={`chip${rule === 'any' ? ' active' : ''}`} onClick={() => setRule('any')}>
          随便选一个
        </button>
      </div>
      <div className={`feedback ${rule === 'min' ? 'good' : 'bad'}`}>
        {rule === 'min'
          ? '选面积最小的框：分层后只剩约 3.8% 的这类歧义，影响很小。'
          : '随便选：可能把狗的类别安到猫的框上——是个错误。'}
      </div>
    </div>
  );
};
