import type { WidgetProps } from './registry';
import { bench, colors, MovingCanvas, rounded, tile } from './paper-canvas';

const captions = [
  '擦拭浮尘后，瓷砖的原有纹样显露出来',
  '参照砖靠近纹样相似的瓷砖',
  '用印模补回一个纹样',
  '同一个印模移向第二块瓷砖，两块纹样的深浅不同',
  '两块补砖形成重叠范围，重叠区收到两次估计',
  '揭开遮纸，露出已观测的瓷砖纹样',
  '用同一把尺检查两块瓷砖的同一处接缝',
];

function target(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.save();
  ctx.setLineDash([4, 5]);
  ctx.strokeStyle = colors.blue;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, width, height);
  ctx.restore();
}

function stamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  rounded(ctx, x - 26, y - 7, 52, 14, 4, colors.support);
  rounded(ctx, x - 10, y - 22, 20, 17, 4, colors.support);
  rounded(ctx, x - 25, y + 4, 50, 5, 2, colors.orange);
}

function paint(ctx: CanvasRenderingContext2D, chapter: number, p: number) {
  bench(ctx, 560, 140);
  const size = 84;
  const x = 238;
  const y = 25;
  rounded(ctx, 105, 110, 350, 17, 8, colors.support);
  switch (chapter) {
    case 1:
      tile(ctx, x, y, size, 'leaf', colors.blue, .75);
      for (let i = 0; i < 15; i += 1) {
        const dirtX = x + 10 + (i * 31 % 67);
        if (dirtX < x - 5 + 97 * p) continue;
        const dirtY = y + 9 + (i * 23 % 68);
        ctx.fillStyle = '#9f7856';
        ctx.fillRect(dirtX, dirtY, 4, 3);
      }
      ctx.save();
      ctx.translate(x - 30 + 115 * p, y + 46);
      ctx.rotate(-.33);
      rounded(ctx, -38, -6, 50, 12, 5, colors.support);
      rounded(ctx, 4, -9, 25, 18, 4, colors.orange);
      ctx.restore();
      break;
    case 2:
      tile(ctx, 333, y, size, 'leaf', colors.green, .80);
      tile(ctx, 425, y + 13, 61, 'cross', colors.dark, .65);
      target(ctx, 242, y - 3, 90, 90);
      tile(ctx, 122 + 123 * p, y, size, 'leaf', colors.blue, .78);
      break;
    case 3:
      tile(ctx, x, y, size, 'leaf', colors.blue, .20 + .60 * p);
      stamp(ctx, x + size / 2, 32 + 33 * p);
      break;
    case 4:
      tile(ctx, 182, y, size, 'leaf', colors.blue, .85);
      tile(ctx, 297, y, size, 'leaf', colors.blue, .38 + .12 * p);
      stamp(ctx, 224 + 115 * p, 30 + 28 * Math.abs(2 * p - 1));
      break;
    case 5: {
      const movingX = 330 - 71 * p;
      tile(ctx, 208, y, size, 'leaf', colors.blue, .58);
      rounded(ctx, movingX, y + 10, size, size, 7, 'rgba(237, 239, 220, .8)', colors.blue);
      const overlap = 208 + size - movingX;
      if (overlap > 0) {
        rounded(ctx, movingX, y + 10, overlap, size - 10, 4, 'rgba(34, 141, 92, .34)', colors.green);
      }
      break;
    }
    case 6:
      tile(ctx, x, y, size, 'leaf', colors.blue, .78);
      rounded(ctx, 229 + 109 * p, 21, 107, 84, 5, '#e6ddbb', colors.support);
      ctx.fillStyle = colors.orange;
      ctx.fillRect(231 + 109 * p, 25, 4, 74);
      break;
    case 7:
      tile(ctx, 180, y, size, 'leaf', colors.blue, .78);
      tile(ctx, 285, y, size, 'leaf', colors.green, .62);
      rounded(ctx, 160 + 106 * p, 79, 126, 14, 4, '#e6ddbb', colors.support);
      ctx.strokeStyle = colors.support;
      for (let tick = 0; tick < 11; tick += 1) {
        const tx = 167 + tick * 10 + 106 * p;
        ctx.beginPath();
        ctx.moveTo(tx, 79);
        ctx.lineTo(tx, 84 + (tick % 2) * 3);
        ctx.stroke();
      }
      break;
  }
}

export function TileAnalogy({ chapterId }: WidgetProps) {
  const chapter = Number(chapterId.replace('chap-', '')) || 1;
  return <MovingCanvas height={140} label={captions[chapter - 1] ?? captions[0]} draw={(ctx, p) => paint(ctx, chapter, p)} />;
}
