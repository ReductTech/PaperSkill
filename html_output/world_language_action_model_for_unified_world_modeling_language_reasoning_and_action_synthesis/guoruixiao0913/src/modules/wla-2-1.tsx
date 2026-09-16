import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import {
  clearScene,
  drawTable,
  drawAimLine,
  drawSceneLabel,
  GUIDE,
  FIELD,
  TEXT,
  EMPHASIS,
  BORDER,
} from './billiardsKit';

// §2 模块 2.1（1080×280）— 输入槽位检查器。
// 唯一主导操作：点击五个输入槽或两个输出槽中的一个（Canvas 热点或等价的 DOM 按钮），
// 同一时刻只有一个槽被选中；高亮迁移、详情区与反馈句同帧更新，其余图元不动。

const W = 1080;
const H = 280;
const BAND_TOP = 70;
const BAND_BOTTOM = 210;

const INPUT_KEYS = ['ot', 'oth', 'qt', 'l', 'M'] as const;
const OUTPUT_KEYS = ['St', 'a'] as const;
type SlotKey = (typeof INPUT_KEYS)[number] | (typeof OUTPUT_KEYS)[number];

const INPUT_BOX = { x: 40, w: 220, h: 32, gap: 9, top: 42 };
const OUTPUT_BOX = { x: 800, w: 240, h: 52, gap: 24, top: 76 };
const TRUNK = { x: 360, y: 95, w: 340, h: 90 };

interface SlotInfo {
  name: string;
  sym: string;
  source: string;
  output: boolean;
}

const SLOTS: Record<SlotKey, SlotInfo> = {
  ot: { name: '当前帧', sym: 'o_t', source: 'page 3, §3.1 式 (3.1)', output: false },
  oth: { name: '历史帧', sym: 'o_{t−h}', source: 'page 3, §3.1 式 (3.1)', output: false },
  qt: { name: '本体状态', sym: 'q_t', source: 'page 3, §3.1 式 (3.1)', output: false },
  l: { name: '指令', sym: 'ℓ', source: 'page 3, §3.1 式 (3.1)', output: false },
  M: { name: '记忆', sym: 'M', source: 'page 3, §3.1 式 (3.1) 之后的记忆更新', output: false },
  St: { name: '子任务窗口', sym: 'S_t', source: 'page 3, §3.1 式 (3.1)', output: true },
  a: { name: '动作块', sym: 'a_{t:t+n}', source: 'page 5, §4.1（动作块 8 / 32）', output: true },
};

const FEEDBACK: Record<SlotKey, { text: string; cls: string }> = {
  ot: { text: '当前帧 o_t：机器人现在看到的那一张图。', cls: '' },
  oth: { text: '历史帧 o_{t−h}：上一小段的画面，给动作提供趋势。', cls: '' },
  qt: { text: '本体状态 q_t：关节或末端位姿，动作生成必须和它对齐。', cls: '' },
  l: { text: '指令 ℓ：用户说的那句话，会被切成连续子任务。', cls: '' },
  M: {
    text: '记忆 M：把已经预测过的子任务追加成历史，长任务靠它记住做到哪一步（式 3.1）。',
    cls: '',
  },
  St: {
    text: '子任务窗口 S_t：覆盖未来这一小段动作的连续子任务，是文本意图的落地形式。',
    cls: 'good',
  },
  a: {
    text: '动作块 a_{t:t+n}：一次预测 n 步动作，LIBERO 上 n = 8，其他任务 n = 32。',
    cls: 'good',
  },
};

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function inputRect(i: number): Rect {
  return {
    x: INPUT_BOX.x,
    y: INPUT_BOX.top + i * (INPUT_BOX.h + INPUT_BOX.gap),
    w: INPUT_BOX.w,
    h: INPUT_BOX.h,
  };
}

function outputRect(i: number): Rect {
  return {
    x: OUTPUT_BOX.x,
    y: OUTPUT_BOX.top + i * (OUTPUT_BOX.h + OUTPUT_BOX.gap),
    w: OUTPUT_BOX.w,
    h: OUTPUT_BOX.h,
  };
}

/** 每个槽在 Canvas 上的位置（与 DOM 按钮一一对应）。 */
const RECTS: { key: SlotKey; rect: Rect }[] = [
  ...INPUT_KEYS.map((key, i) => ({ key, rect: inputRect(i) })),
  ...OUTPUT_KEYS.map((key, i) => ({ key, rect: outputRect(i) })),
];

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** 选中态：2 px 橙色双描边（外圈加粗 + 内圈细线）。 */
function strokeSelected(ctx: CanvasRenderingContext2D, r: Rect): void {
  ctx.save();
  ctx.strokeStyle = EMPHASIS;
  ctx.lineWidth = 2;
  roundRectPath(ctx, r.x, r.y, r.w, r.h, 8);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  roundRectPath(ctx, r.x + 4, r.y + 4, r.w - 8, r.h - 8, 6);
  ctx.stroke();
  ctx.restore();
}

export const Wla21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ selectedSlot: SlotKey }>({ selectedSlot: 'ot' });
  const rafRef = useRef<number | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotKey>('ot');
  const [feedback, setFeedback] = useState(FEEDBACK.ot);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = () => {
      const selected = stateRef.current.selectedSlot;

      clearScene(ctx, W, H);
      // 台面只作背景带，不画球。
      drawTable(ctx, W, H, { pockets: [], bandTop: BAND_TOP, bandBottom: BAND_BOTTOM });

      // 连接线：五个输入汇入主干，主干分出两个输出。
      ctx.save();
      RECTS.filter((item) => !SLOTS[item.key].output).forEach((item) => {
        const r = item.rect;
        drawAimLine(ctx, r.x + r.w, r.y + r.h / 2, TRUNK.x, TRUNK.y + TRUNK.h / 2, {
          color: BORDER,
          width: 1.5,
        });
      });
      RECTS.filter((item) => SLOTS[item.key].output).forEach((item) => {
        const r = item.rect;
        drawAimLine(ctx, TRUNK.x + TRUNK.w, TRUNK.y + TRUNK.h / 2, r.x, r.y + r.h / 2, {
          color: BORDER,
          width: 1.5,
        });
      });
      ctx.restore();

      // 输入方块与输出方块。文字只由 DOM 按钮与详情区承担。
      RECTS.forEach((item) => {
        const r = item.rect;
        ctx.save();
        ctx.fillStyle = FIELD;
        roundRectPath(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.fill();
        ctx.strokeStyle = BORDER;
        ctx.lineWidth = 1.5;
        roundRectPath(ctx, r.x, r.y, r.w, r.h, 8);
        ctx.stroke();
        ctx.restore();
      });

      // 主干：蓝色圆角矩形。
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = GUIDE;
      roundRectPath(ctx, TRUNK.x, TRUNK.y, TRUNK.w, TRUNK.h, 12);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = GUIDE;
      ctx.lineWidth = 2;
      roundRectPath(ctx, TRUNK.x, TRUNK.y, TRUNK.w, TRUNK.h, 12);
      ctx.stroke();
      ctx.restore();

      // 选中槽的高亮描边。
      const active = RECTS.find((item) => item.key === selected);
      if (active) strokeSelected(ctx, active.rect);

      drawSceneLabel(ctx, '主干', TRUNK.x + TRUNK.w / 2, TRUNK.y + TRUNK.h / 2, {
        align: 'center',
        color: TEXT,
      });
    };

    const tick = () => {
      render();
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

  const select = (key: SlotKey) => {
    stateRef.current = { selectedSlot: key };
    setSelectedSlot(key);
    setFeedback(FEEDBACK[key]);
  };

  const onCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return;
    // 位图已按 dpr 放大，因此逻辑宽度 W 等于 canvas.width / dpr。
    const scale = W / rect.width;
    const x = clamp((e.clientX - rect.left) * scale, 0, W);
    const y = clamp((e.clientY - rect.top) * scale, 0, H);
    const hit = RECTS.find(
      (item) =>
        x >= item.rect.x && x <= item.rect.x + item.rect.w && y >= item.rect.y && y <= item.rect.y + item.rect.h
    );
    if (hit) select(hit.key);
  };

  const info = SLOTS[selectedSlot];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        style={{ cursor: 'pointer' }}
        onPointerDown={onCanvasPointerDown}
      />
      <div className="chip-row">
        {(Object.keys(SLOTS) as SlotKey[]).map((key) => (
          <button
            key={key}
            type="button"
            className={key === selectedSlot ? 'chip selected' : 'chip'}
            aria-pressed={key === selectedSlot}
            onClick={() => select(key)}
          >
            {SLOTS[key].name}
          </button>
        ))}
      </div>
      <div className="step-desc">
        {info.sym} · {info.name} · 出处：{info.source}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Wla21;
