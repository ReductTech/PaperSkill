import { useState } from 'react';
import { Stage, colors } from './paper-canvas';

// Broad bands have flat interiors. The finer bands on the right emphasize texture loss.
const clean = [54, 54, 54, 54, 210, 210, 210, 210, 54, 210, 54, 210];
const noise = [14, -9, 10, -13, 12, -8, -11, 8, -10, 13, -7, 10];
const noisy = clean.map((value, index) => value + noise[index]);
const averaged = noisy.map((value, index) => (
  (noisy[Math.max(0, index - 1)] + value + noisy[Math.min(noisy.length - 1, index + 1)]) / 3
));
const flatInteriors = [1, 2, 5, 6];

function flatError(values: number[]) {
  return (flatInteriors.reduce((sum, index) => sum + Math.abs(values[index] - clean[index]), 0) /
    flatInteriors.length).toFixed(1);
}

function edgeContrast(values: number[]) {
  return Math.abs(values[4] - values[3]).toFixed(0);
}

function drawProfile(ctx: CanvasRenderingContext2D, x: number, values: number[]) {
  const first = x + 12;
  const step = 258 / values.length;
  ctx.beginPath();
  values.forEach((value, index) => {
    const px = first + (index + 0.5) * step;
    const py = 193 - (value / 255) * 58;
    if (index === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

function drawTilePanel(
  ctx: CanvasRenderingContext2D,
  x: number,
  title: string,
  values: number[],
  color: string,
) {
  const y = 28;
  ctx.fillStyle = colors.light;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 4, 282, 184, 12);
  ctx.fill();
  ctx.fillStyle = colors.paper;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x, y, 282, 184, 12);
  ctx.fill();
  ctx.stroke();

  const bandWidth = 258 / values.length;
  values.forEach((value, index) => {
    const gray = Math.round(82 + 160 * value / 255);
    ctx.fillStyle = 'rgb(' + gray + ',' + (gray + 5) + ',' + (gray + 1) + ')';
    ctx.fillRect(x + 12 + index * bandWidth, y + 26, bandWidth, 72);
  });
  ctx.strokeStyle = colors.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 12, y + 107, 258, 60);
  ctx.strokeStyle = colors.muted;
  ctx.setLineDash([3, 4]);
  drawProfile(ctx, x, clean);
  ctx.setLineDash([]);
  ctx.strokeStyle = color;
  ctx.lineJoin = 'round';
  ctx.lineWidth = 2.25;
  drawProfile(ctx, x, values);
  ctx.textAlign = 'left';
  ctx.font = '600 14px system-ui, sans-serif';
  ctx.fillStyle = colors.ink;
  ctx.fillText(title, x + 13, y + 18);
}

export function RawMotivation() {
  const [smoothed, setSmoothed] = useState(false);
  const feedback = smoothed
    ? `宽纹内部的平均绝对误差从 ${flatError(noisy)} 降到 ${flatError(averaged)}，第一处明暗交界的灰度差从 ${edgeContrast(noisy)} 降到 ${edgeContrast(averaged)}。看右侧窄纹，明暗也更难分清了。`
    : '两边从同一份含噪读数开始。每幅图里，宽纹内部原本应当平坦，右侧的窄纹原本明暗交替。';

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    drawTilePanel(ctx, 24, '原始读数', noisy, colors.blue);
    drawTilePanel(ctx, 334, '处理预览', smoothed ? averaged : noisy, smoothed ? colors.red : colors.blue);
  }

  return (
    <Stage label="原始读数与邻域平均处理后的同一块纹理" draw={draw} feedback={feedback} tone={smoothed ? 'bad' : 'neutral'}>
      <button className="tiny" type="button" onClick={() => setSmoothed((previous) => !previous)}>
        {smoothed ? '恢复观测' : '应用局部平均'}
      </button>
    </Stage>
  );
}
