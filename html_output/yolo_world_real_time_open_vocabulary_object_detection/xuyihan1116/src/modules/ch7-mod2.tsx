import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import {
  COLORS,
  clearScene,
  drawDesks,
  drawKid,
  drawLabel,
  drawLegend,
  drawMeter,
  drawName,
  drawRoster,
  useCanvas,
} from '../lib/classKit';

// 同一张链，两种跑法：
// 训练 —— 每张 mosaic 现组一份在线词表，每张图都要再过一遍编码器（琥珀在线回路）。
// 部署 —— 用户提示只编码一次，词表折进权重（绿色 ①），每图那条回路全部切断。

const W = 1080;
const H = 280;

type Mode = 'train' | 'deploy';
type S = { mode: Mode };

const IMG_X = [56, 176, 296, 416];
const IMG_Y = 156;
const IMG_W = 104;
const IMG_H = 48;
const BUS_Y = 228;

const FB: Record<Mode, { text: string; cls: string }> = {
  train: {
    text: '训练：每张 mosaic 现组一份在线词表，最多 80 个名词。',
    cls: '',
  },
  deploy: {
    text: '部署：用户提示编码成离线词表，重参数化进权重，之后每张图直接跑。',
    cls: 'good',
  },
};

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function arrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width: number
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a - 0.42), y2 - 9 * Math.sin(a - 0.42));
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 9 * Math.cos(a + 0.42), y2 - 9 * Math.sin(a + 0.42));
  ctx.stroke();
  ctx.restore();
}

function curve(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  cx: number,
  cy: number,
  x2: number,
  y2: number,
  color: string,
  width: number,
  dashed: boolean,
  head: boolean
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([7, 5]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.stroke();
  if (head) {
    const a = Math.atan2(y2 - cy, x2 - cx);
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(a - 0.45), y2 - 9 * Math.sin(a - 0.45));
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - 9 * Math.cos(a + 0.45), y2 - 9 * Math.sin(a + 0.45));
    ctx.stroke();
  }
  ctx.restore();
}

export const Ch7Mod2: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const [mode, setMode] = useState<Mode>('train');
  const [fb, setFb] = useState(FB.train);
  const stateRef = useRef<S>({ mode: 'train' });

  const { ref } = useCanvas<S>(
    (ctx, time, s) => {
      clearScene(ctx, W, H);
      const train = s.mode === 'train';

      // 流程图与右侧说明的分隔
      ctx.save();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(650, 36);
      ctx.lineTo(650, 244);
      ctx.stroke();
      ctx.restore();

      // 词表来源：训练时是一小把临时名字，部署时是一本扣好的离线册子
      drawRoster(ctx, 48, 40, 148, 54, { lines: 2, locked: !train });

      // 编码器
      ctx.save();
      roundRect(ctx, 230, 40, 200, 54, 12);
      ctx.fillStyle = COLORS.board2;
      ctx.fill();
      ctx.strokeStyle = train ? COLORS.book : COLORS.fast;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, '编码器', 330, 74, { size: 15, color: COLORS.chalk, align: 'center' });

      // 检测器
      ctx.save();
      roundRect(ctx, 470, 40, 148, 54, 12);
      ctx.fillStyle = COLORS.board2;
      ctx.fill();
      ctx.strokeStyle = COLORS.axis;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      drawLabel(ctx, '检测器', 544, 74, { size: 15, color: COLORS.chalk, align: 'center' });

      // 词表 → 编码器 → 检测器
      arrow(ctx, 196, 67, 230, 67, train ? COLORS.book : COLORS.fast, 3);
      arrow(ctx, 430, 67, 470, 67, train ? COLORS.book : COLORS.fast, 3);

      // 部署：编码只在最前面发生一次
      if (!train) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(238, 48, 11, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.fast;
        ctx.fill();
        ctx.restore();
        drawLabel(ctx, '1', 238, 53, { size: 13, color: COLORS.chalk, align: 'center' });
      }

      // 四张图（一份 mosaic 的四个样本）
      IMG_X.forEach((x) => {
        drawDesks(ctx, x, IMG_Y, IMG_W, IMG_H, { rows: 1, cols: 2 });
        drawKid(ctx, x + 26, IMG_Y + 22, 0.8);
        drawKid(ctx, x + 78, IMG_Y + 22, 0.8);
      });

      // 图 → 检测器的一根总线
      ctx.save();
      ctx.strokeStyle = COLORS.chalkDim;
      ctx.lineWidth = 2;
      ctx.beginPath();
      IMG_X.forEach((x) => {
        ctx.moveTo(x + 52, IMG_Y + IMG_H);
        ctx.lineTo(x + 52, BUS_Y);
      });
      ctx.moveTo(IMG_X[0] + 52, BUS_Y);
      ctx.lineTo(540, BUS_Y);
      ctx.moveTo(540, BUS_Y);
      ctx.lineTo(540, 110);
      ctx.stroke();
      ctx.restore();
      arrow(ctx, 540, 110, 540, 98, COLORS.chalkDim, 2);

      // 训练：每张图都要过一遍编码器；部署：这条回路整段切断
      const targets = [272, 312, 352, 392];
      IMG_X.forEach((x, i) => {
        if (train) {
          curve(ctx, x + 52, IMG_Y, x + 52, 120, targets[i], 98, COLORS.book, 2.5, true, true);
        } else {
          ctx.save();
          ctx.strokeStyle = COLORS.book;
          ctx.lineWidth = 2.5;
          ctx.setLineDash([7, 5]);
          ctx.beginPath();
          ctx.moveTo(x + 52, IMG_Y);
          ctx.lineTo(x + 52, IMG_Y - 14);
          ctx.stroke();
          ctx.restore();
          ctx.save();
          ctx.strokeStyle = COLORS.fast;
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x + 46, IMG_Y - 16);
          ctx.lineTo(x + 58, IMG_Y - 8);
          ctx.stroke();
          ctx.restore();
        }
      });

      // 右：两种跑法的差别
      if (train) {
        drawName(ctx, 690, 58, { text: '小明', width: 62, active: true });
        drawName(ctx, 762, 58, { text: '小红', width: 62, active: true });
        drawName(ctx, 690, 92, { text: '小刚', width: 62, active: true });
        drawName(ctx, 762, 92, { text: '小美', width: 62, active: true });
      } else {
        drawRoster(ctx, 690, 56, 148, 60, { lines: 3, locked: true });
      }

      drawMeter(ctx, 690, 168, 240, 18, train ? 0.95 : 0.05, {
        direction: 'down',
        label: '每图编码',
      });
      drawLabel(ctx, train ? '1' : '0', 952, 186, {
        size: 20,
        color: train ? COLORS.bad : COLORS.fast,
      });

      drawLegend(ctx, 690, 252, [
        { color: COLORS.book, text: '在线词表' },
        { color: COLORS.fast, text: '离线一次' },
      ]);
    },
    W,
    H,
    stateRef
  );

  const pick = (next: Mode) => {
    stateRef.current.mode = next;
    setMode(next);
    setFb(FB[next]);
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={ref} width={W} height={H} />
      <div className="ctrl" role="group" aria-label="选择跑法">
        <label>跑法</label>
        {(['train', 'deploy'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            className={`chip ${mode === m ? 'selected' : ''}`}
            aria-pressed={mode === m}
            onClick={() => pick(m)}
          >
            {m === 'train' ? '训练' : '部署'}
          </button>
        ))}
      </div>
      <div className="hotspot-info">
        {mode === 'train' ? (
          <>
            训练时词表来自当前这张 4 图拼的 mosaic：图里的名词当正样本，再采样随机负样本，最多
            <b> 80 个</b>。因为词表随图变，<b>每张图都要重新编码一次文本</b>。
          </>
        ) : (
          <>
            部署时词表来自用户写的提示：先编码成离线词表，再<b>重参数化进层权重</b>。之后
            <b>每张图都不用再编码文本</b>，所以才能实时。
          </>
        )}
        <br />
        论文依据：§3.2 在线词表与离线词表、§3.3 重参数化（E5、E6、E20）。
      </div>
      <div className={`feedback ${fb.cls}`}>{fb.text}</div>
    </div>
  );
};

export default Ch7Mod2;
