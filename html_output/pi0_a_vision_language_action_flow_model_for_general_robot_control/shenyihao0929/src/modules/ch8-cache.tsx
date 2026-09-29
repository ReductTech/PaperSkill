import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import {
  C,
  drawSceneBg,
  drawSceneLabel,
  drawLegend,
  drawValueChip,
  drawVerdict,
} from './potteryKit';
import type { WidgetProps } from './registry';

// Ch.8 module 8.2 (P2 step-through): prefix KV cache over three inference
// cycles. The observation prefix (order card + images) is computed once in
// cycle 1 and grey-locked afterwards; the action-token suffix is recomputed
// every cycle (purple pulse); the timing panel shrinks accordingly (relative
// marks, schematic only).
const W = 1080;
const H = 280;
const STATES = 4; // 0 idle, 1-3 cycles, 4 done

const FEEDBACK: Array<{ text: string; cls: string }> = [
  { text: '按『下一步』看第一轮推理：这一次要把观测前缀和动作后缀全部算出来。', cls: '' },
  { text: '第 1 轮：订单与图像的键值首次计算——这笔账只付一次，之后全部复用。', cls: '' },
  { text: '第 2 轮：前缀灰锁不动，只有紫色动作后缀在重算——计算量肉眼可见地缩水。', cls: '' },
  { text: '第 3 轮：依旧只算后缀。观测没变，前缀就永远免费。', cls: '' },
  { text: '观测不变的那部分永远只算一次——这是 π0 能把推理塞进 0.5 秒的另一半功臣。', cls: 'good' },
];

const TOKEN_XS: number[] = [];
for (let i = 0; i < 8; i++) TOKEN_XS.push(96 + i * 66);

function drawImageBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  locked: boolean,
  pulse: number
) {
  ctx.save();
  ctx.fillStyle = locked ? '#e6e3dc' : C.white;
  ctx.strokeStyle = locked ? C.muted : C.blue;
  ctx.lineWidth = 2;
  if (locked) {
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.9;
  } else {
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(pulse);
  }
  ctx.beginPath();
  ctx.roundRect(x, 56, 72, 52, 4);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  // mountain glyph
  ctx.strokeStyle = locked ? C.muted : C.blue;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + 8, 98);
  ctx.lineTo(x + 28, 74);
  ctx.lineTo(x + 44, 98);
  ctx.moveTo(x + 48, 86);
  ctx.lineTo(x + 64, 98);
  ctx.stroke();
  ctx.fillStyle = locked ? C.muted : C.blue;
  ctx.beginPath();
  ctx.arc(x + 58, 66, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawOrderBlock(ctx: CanvasRenderingContext2D, locked: boolean, pulse: number) {
  ctx.save();
  ctx.fillStyle = locked ? '#e6e3dc' : C.white;
  ctx.strokeStyle = locked ? C.muted : C.blue;
  ctx.lineWidth = 2;
  if (locked) {
    ctx.setLineDash([4, 3]);
    ctx.globalAlpha = 0.9;
  } else {
    ctx.globalAlpha = 0.7 + 0.3 * Math.sin(pulse);
  }
  ctx.beginPath();
  ctx.roundRect(96, 56, 80, 52, 4);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.strokeStyle = locked ? C.muted : C.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 72);
  ctx.lineTo(164, 72);
  ctx.moveTo(108, 84);
  ctx.lineTo(150, 84);
  ctx.moveTo(108, 96);
  ctx.lineTo(158, 96);
  ctx.stroke();
  ctx.restore();
}

function drawLock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = C.deep;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, 9, Math.PI, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = C.deep;
  ctx.beginPath();
  ctx.roundRect(x - 14, y, 28, 21, 4);
  ctx.fill();
  ctx.fillStyle = C.white;
  ctx.beginPath();
  ctx.arc(x, y + 10, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawTimingPanel(ctx: CanvasRenderingContext2D, state: number) {
  ctx.save();
  ctx.fillStyle = C.white;
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(760, 44, 300, 150, 6);
  ctx.fill();
  ctx.stroke();
  const rows = [76, 116, 156];
  rows.forEach((ry, i) => {
    // cycle number + empty track
    ctx.fillStyle = C.muted;
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(i + 1), 780, ry);
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(792, ry - 6, 218, 12, 6);
    ctx.stroke();
    if (state >= i + 1) {
      const w = i === 0 ? 218 : 88;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.roundRect(792, ry - 6, w, 12, 6);
      ctx.fill();
      drawValueChip(ctx, 792 + w + 16, ry, i === 0 ? '1.0' : '0.4', C.orange);
    }
  });
  ctx.restore();
}

export const Ch8Cache: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf = 0;

    const render = (ms: number) => {
      const s = stateRef.current;
      ctx.clearRect(0, 0, W, H);
      drawSceneBg(ctx, W, H, { ground: false });
      ctx.strokeStyle = C.ground;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(24, 248);
      ctx.lineTo(1056, 248);
      ctx.stroke();

      // prefix row: bright in cycle 1, grey-locked afterwards
      const locked = s >= 2;
      const pulse = s === 1 ? ms / 160 : 0;
      drawOrderBlock(ctx, locked, pulse);
      drawImageBlock(ctx, 188, locked, pulse);
      drawImageBlock(ctx, 270, locked, pulse + 1.1);
      if (s === 1) {
        // computing spinner at the end of the prefix row
        ctx.save();
        const a = (ms / 150) % (Math.PI * 2);
        ctx.strokeStyle = C.orange;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(374, 82, 10, a, a + Math.PI * 1.3);
        ctx.stroke();
        ctx.restore();
      } else if (locked) {
        drawLock(ctx, 374, 82);
      }

      // suffix row: recomputed every cycle
      TOKEN_XS.forEach((x, i) => {
        const active = s >= 1;
        const a = active ? 0.18 + 0.13 * Math.sin(ms / 170 + i * 0.7) : 0.12;
        ctx.save();
        ctx.globalAlpha = a + 0.1;
        ctx.fillStyle = C.purple;
        ctx.beginPath();
        ctx.roundRect(x, 156, 58, 44, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = active ? C.purple : C.border;
        ctx.lineWidth = active ? 2 : 1.5;
        ctx.beginPath();
        ctx.roundRect(x, 156, 58, 44, 4);
        ctx.stroke();
        ctx.fillStyle = active ? C.purple : C.muted;
        for (let d = 0; d < 3; d++) {
          ctx.beginPath();
          ctx.arc(x + 17 + d * 12, 178, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      // attention connectors between the two token rows
      ctx.save();
      ctx.strokeStyle = C.purple;
      ctx.globalAlpha = 0.32;
      ctx.lineWidth = 1.75;
      ctx.lineCap = 'round';
      for (const ax of [160, 320, 480]) {
        ctx.beginPath();
        ctx.moveTo(ax, 116);
        ctx.lineTo(ax, 148);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(ax - 3.5, 121);
        ctx.lineTo(ax, 116);
        ctx.lineTo(ax + 3.5, 121);
        ctx.moveTo(ax - 3.5, 143);
        ctx.lineTo(ax, 148);
        ctx.lineTo(ax + 3.5, 143);
        ctx.stroke();
      }
      ctx.restore();

      drawTimingPanel(ctx, s);

      drawSceneLabel(ctx, '前缀', 48, 84, { color: C.text });
      drawSceneLabel(ctx, '后缀', 48, 178, { color: C.text });
      drawLegend(
        ctx,
        [['锁定', C.muted], ['重算', C.purple], ['计算量', C.orange]],
        36,
        264
      );

      if (s >= 1) {
        drawValueChip(ctx, 70, 30, String(Math.min(s, 3)), C.purple);
      }
      if (s === STATES) {
        drawValueChip(ctx, 130, 30, '0.5s', C.green);
        drawVerdict(ctx, 910, 226, true, { r: 15, pulse: ms / 420 });
      }

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(render);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const start = () => {
      if (!raf) raf = requestAnimationFrame(render);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const goto = (v: number) => {
    const nv = clamp(v, 0, STATES);
    stateRef.current = nv;
    setState(nv);
  };

  const stepLabel = state <= 3 ? `${state}/3` : '完成';

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <span className="step-label">
          轮次 <b>{stepLabel}</b>
        </span>
        <button className="tiny ghost" disabled={state === 0} onClick={() => goto(state - 1)}>
          上一轮
        </button>
        <button className="tiny" disabled={state === STATES} onClick={() => goto(state + 1)}>
          下一轮
        </button>
      </div>
      <div className={`feedback ${FEEDBACK[state].cls}`}>{FEEDBACK[state].text}</div>
    </div>
  );
};

export default Ch8Cache;
