import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import {
  clearScene,
  drawBoard,
  drawPlane,
  drawSceneLabel,
  drawLegend,
  seeded,
  WOOD_DARK,
  GUIDE,
  EMPH,
  MUTED,
  LINE,
} from './woodKit';
import type { WidgetProps } from './registry';

// 模块 2.1 观测视野：左侧生活场景与右侧技术 inset 由同一组状态驱动。
const W = 1080;
const H = 280;

// 左区：生活场景（工作台 + 木板 + 木纹 + 三帧采样标记）
const BOARD_X = 36;
const BOARD_W = 464;
const BOARD_Y = 172;
const BOARD_H = 62;
const MARK_W = 60;
const MARK_H = 44;
const MARK_Y = 112;
// 帧位置按「当前位置在最左、历史向右排开」摆放，与刨子从右向左走刀一致
const FRAME_XS = [0.2, 0.4, 0.6, 0.8].map((v) => BOARD_X + v * BOARD_W);
const HOTSPOTS: (0 | 1 | 2)[] = [0, 1, 2];

// 右区：技术 inset（每个被纳入的帧一行，最后一行是拼接后的 Ot）
const INSET_X = 548;
const INSET_Y = 16;
const INSET_W = 516;
const INSET_H = 214;
const STRIP_X = 590;
const CELL_W = 16;
const CELL_GAP = 2;
const DIMS = 22;
const STRIP_W = DIMS * (CELL_W + CELL_GAP);
const ROW_Y = 56;
const ROW_H = 30;
const OT_ROW_Y = 186;

const FONT = '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';

const FEEDBACK: Record<number, { text: string; cls: string }> = {
  1: { text: '单帧看不出末端在往哪走，方向信息缺失。', cls: '' },
  2: { text: '两帧就能判断运动方向，这是多数任务的推荐值。', cls: 'good' },
  4: { text: '更多历史更稳，但图像输入下视野过长反而会掉点。', cls: '' },
};

/** 每帧经编码器得到的 22 维特征：长度固定，随选中状态改变亮度。 */
const FEATURES: number[][] = [0, 1, 2, 3].map((frame) => {
  const rnd = seeded(frame * 977 + 13);
  rnd();
  rnd();
  const row: number[] = [];
  for (let d = 0; d < DIMS; d++) row.push(rnd());
  return row;
});

function featureVal(frame: number, dim: number): number {
  return FEATURES[frame][dim];
}

export const M41: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ to: 1 | 2 | 4; selectedT: 0 | 1 | 2 }>({ to: 2, selectedT: 0 });
  const [to, setTo] = useState<1 | 2 | 4>(2);
  const [sel, setSel] = useState<0 | 1 | 2>(0);
  const [feedback, setFeedback] = useState(FEEDBACK[2]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { to: 1 | 2 | 4; selectedT: 0 | 1 | 2 }) => {
      clearScene(ctx, W, H);

      // ---- 左区：生活场景 ----
      drawBoard(ctx, BOARD_X, BOARD_Y, BOARD_W, BOARD_H, null);

      ctx.strokeStyle = WOOD_DARK;
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const gy = BOARD_Y + 12 + g * 14;
        ctx.beginPath();
        let first = true;
        for (let x = BOARD_X + 6; x <= BOARD_X + BOARD_W - 6; x += 6) {
          const y = gy + Math.sin((x - BOARD_X) / 38 + g * 1.2) * 2.2;
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      }

      // 三帧采样标记：纳入的用实线框，未纳入的用虚线框，选中的是橙色
      for (let i = 0; i < 4; i++) {
        if (i === 3 && s.to < 4) continue;
        const cx = FRAME_XS[i];
        const included = i < s.to;
        const selected = i === s.selectedT;
        const bx = cx - MARK_W / 2;

        ctx.save();
        ctx.setLineDash(included ? [] : [5, 4]);
        ctx.lineWidth = selected ? 3 : 1.5;
        ctx.strokeStyle = selected ? EMPH : included ? GUIDE : LINE;
        if (selected) {
          ctx.fillStyle = 'rgba(240,126,71,0.1)';
          ctx.fillRect(bx, MARK_Y, MARK_W, MARK_H);
        }
        ctx.strokeRect(bx + 0.75, MARK_Y + 0.75, MARK_W - 1.5, MARK_H - 1.5);
        ctx.restore();

        ctx.fillStyle = selected ? EMPH : included ? MUTED : LINE;
        ctx.font = '12px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText(i === 0 ? 't' : 't-' + i, bx + 6, MARK_Y + 15);
        drawPlane(ctx, cx, MARK_Y + MARK_H - 6, { length: 34, ghost: !included });

        // 与板面采样位置的连线
        ctx.save();
        ctx.setLineDash(included ? [] : [4, 4]);
        ctx.strokeStyle = included ? GUIDE : LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, MARK_Y + MARK_H);
        ctx.lineTo(cx, BOARD_Y);
        ctx.stroke();
        ctx.restore();
        ctx.fillStyle = included ? GUIDE : LINE;
        ctx.fillRect(cx - 2, BOARD_Y - 3, 4, 6);
      }

      drawSceneLabel(ctx, '木纹方向', 20, 30);
      drawLegend(
        ctx,
        [
          { color: GUIDE, text: '已纳入' },
          { color: EMPH, text: '当前选中' },
          { color: LINE, text: '未纳入' },
        ],
        270,
        30
      );

      // ---- 右区：技术 inset ----
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(INSET_X, INSET_Y, INSET_W, INSET_H);
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(INSET_X + 0.75, INSET_Y + 0.75, INSET_W - 1.5, INSET_H - 1.5);
      drawSceneLabel(ctx, '特征拼接', INSET_X + 14, INSET_Y + 26);

      for (let i = 0; i < s.to; i++) {
        const rowY = ROW_Y + i * ROW_H;
        const selected = i === s.selectedT;
        if (selected) {
          ctx.fillStyle = 'rgba(240,126,71,0.1)';
          ctx.fillRect(INSET_X + 2, rowY, INSET_W - 4, ROW_H - 2);
          ctx.fillStyle = EMPH;
          ctx.fillRect(INSET_X + 2, rowY, 3, ROW_H - 2);
        }
        ctx.fillStyle = selected ? EMPH : MUTED;
        ctx.font = '13px ' + FONT;
        ctx.textAlign = 'left';
        ctx.fillText(i === 0 ? 't' : 't-' + i, INSET_X + 12, rowY + 19);

        ctx.globalAlpha = selected ? 1 : 0.6;
        ctx.fillStyle = GUIDE;
        for (let d = 0; d < DIMS; d++) {
          const bh = 6 + featureVal(i, d) * 14;
          ctx.fillRect(STRIP_X + d * (CELL_W + CELL_GAP), rowY + 15 - bh / 2, CELL_W, bh);
        }
        ctx.globalAlpha = 1;

        ctx.strokeStyle = LINE;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(INSET_X + 8, rowY + ROW_H - 1);
        ctx.lineTo(INSET_X + INSET_W - 8, rowY + ROW_H - 1);
        ctx.stroke();
      }

      // 拼接后的 Ot 条带：To 越大越长
      const otW = (STRIP_W * s.to) / 4;
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 1;
      ctx.strokeRect(STRIP_X + 0.5, OT_ROW_Y + 4.5, STRIP_W - 1, 17);
      ctx.fillStyle = GUIDE;
      ctx.fillRect(STRIP_X, OT_ROW_Y + 4, otW, 18);
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1;
      for (let k = 1; k < s.to; k++) {
        const sx = STRIP_X + (otW * k) / s.to;
        ctx.beginPath();
        ctx.moveTo(sx, OT_ROW_Y + 4);
        ctx.lineTo(sx, OT_ROW_Y + 22);
        ctx.stroke();
      }
      ctx.fillStyle = GUIDE;
      ctx.font = '13px ' + FONT;
      ctx.textAlign = 'left';
      ctx.fillText('Ot', INSET_X + 12, OT_ROW_Y + 18);
    };

    const tick = () => {
      render(stateRef.current);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const selectFrame = (i: 0 | 1 | 2) => {
    stateRef.current.selectedT = i;
    setSel(i);
  };

  const changeTo = (v: 1 | 2 | 4) => {
    stateRef.current.to = v;
    setTo(v);
    setFeedback(FEEDBACK[v]);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const px = (e.clientX - rect.left) * (W / rect.width);
    const py = (e.clientY - rect.top) * (H / rect.height);
    for (let k = 0; k < HOTSPOTS.length; k++) {
      const i = HOTSPOTS[k];
      const bx = FRAME_XS[i] - MARK_W / 2;
      if (px >= bx && px <= bx + MARK_W && py >= MARK_Y && py <= MARK_Y + MARK_H) {
        selectFrame(i);
        return;
      }
    }
  };

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
      />
      <div className="chip-row">
        <button
          className={'chip' + (sel === 0 ? ' selected' : '')}
          onClick={() => selectFrame(0)}
        >
          帧 t
        </button>
        <button
          className={'chip' + (sel === 1 ? ' selected' : '')}
          onClick={() => selectFrame(1)}
        >
          帧 t-1
        </button>
        <button
          className={'chip' + (sel === 2 ? ' selected' : '')}
          onClick={() => selectFrame(2)}
        >
          帧 t-2
        </button>
      </div>
      <div className="chip-row">
        <button className={'chip' + (to === 1 ? ' selected' : '')} onClick={() => changeTo(1)}>
          To = 1
        </button>
        <button className={'chip' + (to === 2 ? ' selected' : '')} onClick={() => changeTo(2)}>
          To = 2
        </button>
        <button className={'chip' + (to === 4 ? ' selected' : '')} onClick={() => changeTo(4)}>
          To = 4
        </button>
      </div>
      <div className={'feedback ' + feedback.cls}>{feedback.text}</div>
    </div>
  );
};

export default M41;
