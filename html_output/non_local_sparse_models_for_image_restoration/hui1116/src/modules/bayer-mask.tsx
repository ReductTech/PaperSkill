import { useState } from 'react';
import { Stage, colors } from './paper-canvas';

const channelNames = ['R', 'G', 'B'] as const;
const channelColors = ['#b9574a', '#4c7954', '#4b73a0'] as const;
const glaze = [
  [142, 118, 86], [197, 156, 105], [184, 137, 78], [139, 118, 99],
  [178, 153, 113], [214, 186, 130], [205, 162, 99], [158, 119, 93],
  [88, 127, 126], [123, 161, 144], [142, 150, 103], [178, 146, 106],
  [75, 107, 122], [104, 151, 154], [134, 159, 130], [134, 119, 79],
] as const;
const bayerPattern = [[1, 0], [2, 1]] as const;
const activeRows = [0, 1, 4] as const;
const feedback = [
  '16 个位置展开成 48 个颜色分量。左边是模拟的完整彩色场景。',
  '第一行按绿、红、绿、红采样。每个位置只保留一种颜色的读数。',
  '整块共测得 16 个颜色值，48 个分量中还有 32 个需要估计。',
];

function fillFrame(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.fillStyle = colors.light;
  ctx.beginPath();
  ctx.roundRect(x + 2, y + 3, width, height, 10);
  ctx.fill();
  ctx.fillStyle = colors.paper;
  ctx.strokeStyle = colors.dark;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 10);
  ctx.fill();
  ctx.stroke();
}

function fillSample(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  channel: number,
  value: number,
) {
  ctx.fillStyle = colors.paper;
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 0.2 + 0.8 * value / 255;
  ctx.fillStyle = channelColors[channel];
  ctx.fillRect(x, y, size, size);
  ctx.globalAlpha = 1;
}

function drawMissing(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.strokeStyle = colors.line;
  ctx.strokeRect(x, y, size, size);
  ctx.beginPath();
  ctx.moveTo(x + 4, y + size - 4);
  ctx.lineTo(x + size - 4, y + 4);
  ctx.stroke();
}

export function BayerMask() {
  const [step, setStep] = useState(0);

  function draw(ctx: CanvasRenderingContext2D, width: number, height: number) {
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);
    fillFrame(ctx, 49, 28, 170, 168);
    fillFrame(ctx, 275, 28, 312, 168);
    const shownRows = activeRows[step];

    glaze.forEach((rgb, index) => {
      const row = Math.floor(index / 4);
      const column = index % 4;
      const x = 55 + column * 40;
      const y = 33 + row * 40;
      const bayerChannel = bayerPattern[row % 2][column % 2];
      if (row < shownRows) {
        fillSample(ctx, x, y, 38, bayerChannel, rgb[bayerChannel]);
        ctx.strokeStyle = colors.blue;
        ctx.strokeRect(x, y, 38, 38);
      } else {
        ctx.fillStyle = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')';
        ctx.fillRect(x, y, 38, 38);
      }
    });

    channelNames.forEach((_, channel) => {
      const panelX = 290 + channel * 96;
      glaze.forEach((rgb, index) => {
        const row = Math.floor(index / 4);
        const column = index % 4;
        const cellX = panelX + column * 22;
        const cellY = 68 + row * 22;
        const bayerChannel = bayerPattern[row % 2][column % 2];
        if (channel === bayerChannel) {
          if (row < shownRows) fillSample(ctx, cellX, cellY, 19, channel, rgb[channel]);
          ctx.strokeStyle = colors.blue;
          ctx.strokeRect(cellX, cellY, 19, 19);
        } else {
          drawMissing(ctx, cellX, cellY, 19);
        }
      });
    });

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.ink;
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.fillText('教学彩砖', 134, 222);
    ctx.fillText('R                    G                    B', 430, 54);
  }

  return (
    <Stage label="教学彩砖及红绿蓝通道的 Bayer 采样掩码" draw={draw} feedback={feedback[step]} tone={step === 2 ? 'good' : 'neutral'}>
      <button className="tiny" type="button" onClick={() => setStep((previous) => Math.max(0, previous - 1))} disabled={step === 0}>
        上一步
      </button>
      <span className="step-label" aria-label={'第 ' + (step + 1) + ' 步，共 3 步'}>{step + 1} / 3</span>
      <button className="tiny" type="button" onClick={() => setStep((previous) => Math.min(2, previous + 1))} disabled={step === 2}>
        下一步
      </button>
    </Stage>
  );
}
