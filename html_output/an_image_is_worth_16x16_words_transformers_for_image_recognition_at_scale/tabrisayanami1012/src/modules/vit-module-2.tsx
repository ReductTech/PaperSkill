import React, { useRef, useState } from 'react';
import { arrow, clearScene, drawLabel, Feedback, palette, roundRect, useDrawing } from './vit-kit';

const IMAGE_SIZE = 224;
const IMAGE_X = 70;
const IMAGE_Y = 28;

export function getPatchDimensions(patchSize: 14 | 16 | 32, selectedPatch = 0) {
  if (![14, 16, 32].includes(patchSize)) throw new RangeError('本例仅支持14、16、32像素图块');
  const grid = IMAGE_SIZE / patchSize;
  const count = grid * grid;
  if (!Number.isInteger(selectedPatch) || selectedPatch < 0 || selectedPatch >= count) throw new RangeError('图块索引越界');
  const row = Math.floor(selectedPatch / grid);
  const col = selectedPatch % grid;
  const x0 = col * patchSize;
  const y0 = row * patchSize;
  return { grid, count, sequence: count + 1, flatDim: patchSize * patchSize * 3, row, col, x0, y0, x1: x0 + patchSize - 1, y1: y0 + patchSize - 1 };
}

function collage(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = palette.light;
  ctx.fillRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
  ctx.fillStyle = palette.green;
  ctx.fillRect(0, 184, IMAGE_SIZE, 40);
  ctx.fillStyle = palette.orange;
  ctx.beginPath();
  ctx.moveTo(31, 107);
  ctx.lineTo(112, 35);
  ctx.lineTo(193, 107);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = palette.support;
  ctx.fillRect(57, 107, 110, 84);
  ctx.fillStyle = palette.bg;
  ctx.fillRect(72, 126, 24, 24);
  ctx.fillRect(128, 126, 24, 24);
  ctx.fillStyle = palette.blue;
  ctx.fillRect(101, 148, 24, 43);
}

// Pixel colors are only used for visible source-crop stripes, never as learned features.
function sampleColor(x: number, y: number) {
  if (x >= 101 && x < 125 && y >= 148 && y < 191) return palette.blue;
  if (((x >= 72 && x < 96) || (x >= 128 && x < 152)) && y >= 126 && y < 150) return palette.bg;
  if (x >= 57 && x < 167 && y >= 107 && y < 191) return palette.support;
  if (y >= 35 && y < 107 && Math.abs(x - 112) <= (y - 35) * 81 / 72) return palette.orange;
  return y >= 184 ? palette.green : palette.light;
}

export const Widget2: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [patchSize, setPatchSize] = useState<14 | 16 | 32>(16);
  const [selectedPatch, setSelectedPatch] = useState(0);
  const { grid, count, sequence, flatDim, x0, y0, x1, y1 } = getPatchDimensions(patchSize, selectedPatch);

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    ctx.save();
    ctx.translate(IMAGE_X, IMAGE_Y);
    collage(ctx);
    ctx.strokeStyle = 'rgba(33,50,74,0.34)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    for (let i = 0; i <= grid; i += 1) {
      ctx.moveTo(i * patchSize, 0);
      ctx.lineTo(i * patchSize, IMAGE_SIZE);
      ctx.moveTo(0, i * patchSize);
      ctx.lineTo(IMAGE_SIZE, i * patchSize);
    }
    ctx.stroke();
    ctx.lineWidth = 3;
    ctx.strokeStyle = palette.orange;
    ctx.strokeRect(x0 + 1.5, y0 + 1.5, patchSize - 3, patchSize - 3);
    ctx.restore();

    arrow(ctx, 313, 140, 348, 140, palette.blue);
    ctx.save();
    ctx.beginPath();
    ctx.rect(365, 99, 82, 82);
    ctx.clip();
    ctx.translate(365, 99);
    ctx.scale(82 / patchSize, 82 / patchSize);
    ctx.translate(-x0, -y0);
    collage(ctx);
    ctx.restore();
    ctx.strokeStyle = palette.orange;
    ctx.lineWidth = 3;
    ctx.strokeRect(365, 99, 82, 82);
    arrow(ctx, 459, 140, 484, 140, palette.blue);

    roundRect(ctx, 493, 99, 162, 82, 8, '#ffffff', palette.border);
    for (let i = 0; i < 16; i += 1) {
      const px = x0 + Math.floor(i / 4) * Math.max(1, Math.floor(patchSize / 4));
      const py = y0 + (i % 4) * Math.max(1, Math.floor(patchSize / 4));
      ctx.fillStyle = sampleColor(px, py);
      ctx.fillRect(499 + i * 9.5, 106, 7, 68);
    }
    drawLabel(ctx, '展平', 534, 75, palette.text);
    arrow(ctx, 662, 140, 762, 140, palette.blue);
    roundRect(ctx, 692, 117, 42, 46, 4, '#ffffff', palette.blue);
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        roundRect(ctx, 699 + c * 9, 126 + r * 9, 6, 6, 1, palette.blue);
      }
    }
    drawLabel(ctx, '投影', 690, 75, palette.text);

    roundRect(ctx, 772, 99, 236, 82, 8, '#ffffff', palette.border);
    for (let i = 0; i < 12; i += 1) {
      // Uniform placeholders show D stays fixed. They are not projected model values.
      roundRect(ctx, 781 + i * 18.5, 108, 13, 64, 3, i % 2 ? palette.blue : palette.light);
    }
    ctx.fillStyle = palette.text;
    ctx.font = '600 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(String(flatDim), 574, 214);
    ctx.fillText('768', 891, 214);
  });

  const choosePatchSize = (value: 14 | 16 | 32) => {
    setPatchSize(value);
    setSelectedPatch(0);
  };

  const pickPatch = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = (event.clientX - rect.left) * 1080 / rect.width;
    const y = (event.clientY - rect.top) * 280 / rect.height;
    if (x < IMAGE_X || x >= IMAGE_X + IMAGE_SIZE || y < IMAGE_Y || y >= IMAGE_Y + IMAGE_SIZE) return;
    const pickedCol = Math.floor((x - IMAGE_X) / patchSize);
    const pickedRow = Math.floor((y - IMAGE_Y) / patchSize);
    setSelectedPatch(pickedRow * grid + pickedCol);
  };

  return (
    <div data-mode="hybrid" data-patterns="P5 P4" onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <div className="ctrl" role="group" aria-label="图块边长 P">
        <span>图块边长 P</span>
        {([14, 16, 32] as const).map((value) => (
          <button key={value} type="button" className={`chip${patchSize === value ? ' selected' : ''}`} aria-pressed={patchSize === value} onClick={() => choosePatchSize(value)}>{value}×{value}</button>
        ))}
      </div>
      <canvas ref={canvasRef} width={1080} height={280} onClick={pickPatch} aria-label={`224像素图像切块、展平与共享线性投影示意。当前P=${patchSize}，第${selectedPatch + 1}块，展平${flatDim}维，投影后768维。可点选图块，也可使用下方上下一块按钮。`} style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }} />
      <div className="step-ctrl">
        <button type="button" className="chip" disabled={selectedPatch === 0} onClick={() => setSelectedPatch((value) => Math.max(0, value - 1))}>上一块</button>
        <span className="step-label">第 <b>{selectedPatch + 1}</b> / {count} 块</span>
        <button type="button" className="chip" disabled={selectedPatch === count - 1} onClick={() => setSelectedPatch((value) => Math.min(count - 1, value + 1))}>下一块</button>
      </div>
      <div className="ctrl" aria-label="本次切块的尺寸账单">
        <span>图块 N：<strong>{count}</strong></span>
        <span>加 CLS 后 S：<strong>{sequence}</strong></span>
        <span>展平维数：<strong>{flatDim}</strong></span>
        <span>投影维数 D：<strong>768</strong></span>
      </div>
      <Feedback>当前第 {selectedPatch + 1}/{count} 块：原图 x={x0}–{x1}、y={y0}–{y1}（坐标从 0 开始）。{patchSize}×{patchSize}×3＝{flatDim} 个像素数值展平后，用所有图块共享的 E 投影成 768 维向量。共 {count} 个图块；另加 1 个分类标记后，序列共有 {sequence} 个标记。</Feedback>
    </div>
  );
};
