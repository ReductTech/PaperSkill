import React, { useState } from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import type { WidgetProps } from './registry';
import {
  COLORS,
  WIDTH,
  camera,
  canvasStyle,
  clear,
  route,
  label,
  token,
  roundedRect,
  useStaticCanvas,
} from './gct-kit';

type StreamStrategy = 'causal' | 'window' | 'gca';

const DEMO_ANCHOR_FRAMES = 3;
const DEMO_WINDOW_FRAMES = 16;

const STREAM_ROWS: Array<{
  key: StreamStrategy;
  label: string;
  subtitle: string;
  color: string;
}> = [
  {
    key: 'causal',
    label: 'Full Causal',
    subtitle: '因果全历史',
    color: COLORS.blue,
  },
  {
    key: 'window',
    label: 'Sliding Window',
    subtitle: '纯滑窗',
    color: COLORS.orange,
  },
  {
    key: 'gca',
    label: 'GCA',
    subtitle: '选择性保留',
    color: COLORS.green,
  },
];

function drawReferenceLink(
  ctx: CanvasRenderingContext2D,
  startX: number,
  endX: number,
  y: number,
  connected: boolean,
  color: string,
) {
  ctx.save();
  ctx.strokeStyle = connected ? color : COLORS.red;
  ctx.lineWidth = connected ? 2.5 : 2;
  const middle = (startX + endX) / 2;
  ctx.beginPath();
  if (connected) {
    ctx.moveTo(startX, y);
    ctx.lineTo(endX, y);
  } else {
    ctx.moveTo(startX, y);
    ctx.lineTo(middle - 9, y);
    ctx.moveTo(middle + 9, y);
    ctx.lineTo(endX, y);
  }
  ctx.stroke();

  ctx.fillStyle = connected ? color : COLORS.red;
  ctx.beginPath();
  ctx.arc(startX, y, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(endX, y, 3.5, 0, Math.PI * 2);
  ctx.fill();

  if (!connected) {
    ctx.beginPath();
    ctx.moveTo(middle - 6, y - 6);
    ctx.lineTo(middle + 6, y + 6);
    ctx.moveTo(middle + 6, y - 6);
    ctx.lineTo(middle - 6, y + 6);
    ctx.stroke();
  }
  ctx.restore();
}

function drawHistory(
  ctx: CanvasRenderingContext2D,
  strategy: StreamStrategy,
  frame: number,
  x: number,
  y: number,
  width: number,
) {
  const windowStart = Math.max(1, frame - DEMO_WINDOW_FRAMES + 1);
  const cellWidth = width / frame;

  for (let index = 1; index <= frame; index += 1) {
    const cellX = x + (index - 1) * cellWidth;
    const visibleInWindow = index >= windowStart;
    const isAnchor = index <= DEMO_ANCHOR_FRAMES;
    const isWindow = visibleInWindow;
    const isMemory = strategy === 'gca' && !isAnchor && !isWindow;
    const isHidden = strategy === 'window' && !visibleInWindow;
    const isFull = strategy === 'causal' || (strategy === 'window' && visibleInWindow) ||
      (strategy === 'gca' && (isAnchor || isWindow));

    ctx.fillStyle = isHidden ? '#e7ebf0' : COLORS.white;
    ctx.fillRect(cellX, y, Math.max(1, cellWidth - 0.7), 16);

    if (isFull) {
      ctx.fillStyle =
        strategy === 'gca' && isAnchor
          ? COLORS.purple
          : strategy === 'window'
            ? COLORS.blue
            : strategy === 'gca'
              ? COLORS.blue
              : COLORS.blue;
      ctx.fillRect(cellX, y, Math.max(1, cellWidth - 0.7), 16);
    } else if (isMemory) {
      ctx.fillStyle = COLORS.orange;
      ctx.fillRect(cellX, y + 5, Math.max(1, cellWidth - 0.7), 6);
    }
  }

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 0.5, y - 0.5, width + 1, 17);
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + width, y - 4);
  ctx.lineTo(x + width, y + 20);
  ctx.stroke();
}

function drawFutureCell(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#e7ebf0';
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.fillRect(x, y, 20, 16);
  ctx.strokeRect(x + 0.5, y + 0.5, 19, 15);
  label(ctx, '×', x + 6, y + 13, COLORS.red, 12, 850);
}

export const StreamingTradeoff: React.FC<WidgetProps> = () => {
  const [frame, setFrame] = useState(36);
  const windowStart = Math.max(1, frame - DEMO_WINDOW_FRAMES + 1);
  const windowReferenceConnected = frame <= DEMO_WINDOW_FRAMES;
  const gcaMemoryFrames = Math.max(0, frame - DEMO_ANCHOR_FRAMES - DEMO_WINDOW_FRAMES);
  const gcaHeavyFrames = frame - gcaMemoryFrames;

  const draw = React.useCallback(
    (ctx: CanvasRenderingContext2D) => {
      clear(ctx, WIDTH, 390);
      label(ctx, `当前查询：F${frame}`, 20, 27, COLORS.text, 14, 850);
      label(ctx, '三种在线策略都只读取当前与过去，不读未来', 148, 27, COLORS.red, 10, 750);
      label(ctx, '机制示例：n=3，k=16', 491, 43, COLORS.muted, 9, 650);

      STREAM_ROWS.forEach((row, rowIndex) => {
        const y = 51 + rowIndex * 96;
        const connected = row.key !== 'window' || windowReferenceConnected;
        const referenceColor = row.key === 'gca' ? COLORS.green : connected ? COLORS.blue : COLORS.red;

        roundedRect(ctx, 18, y, 604, 88, COLORS.white, row.key === 'gca' ? COLORS.green : COLORS.border, 9);
        label(ctx, row.label, 31, y + 28, row.color, 13, 850);
        label(ctx, row.subtitle, 31, y + 49, COLORS.muted, 10, 650);

        const historyX = 143;
        const historyWidth = 270;
        label(ctx, 'F1', historyX, y + 17, COLORS.muted, 9, 650);
        ctx.textAlign = 'right';
        label(ctx, `F${frame}`, historyX + historyWidth, y + 17, COLORS.orange, 9, 750);
        ctx.textAlign = 'left';
        drawHistory(ctx, row.key, frame, historyX, y + 25, historyWidth);
        drawFutureCell(ctx, historyX + historyWidth + 9, y + 25);
        label(ctx, '未来', historyX + historyWidth + 7, y + 17, COLORS.red, 8, 700);
        drawReferenceLink(ctx, historyX + 2, historyX + historyWidth - 2, y + 67, connected, referenceColor);

        if (row.key === 'causal') {
          label(ctx, `可见：F1–F${frame} 全历史`, 456, y + 18, COLORS.text, 9, 700);
          label(ctx, `重历史：${frame} 个完整帧`, 456, y + 37, COLORS.orange, 9, 750);
          label(ctx, '远帧：保持连接', 456, y + 56, COLORS.blue, 9, 750);
          label(ctx, '未来：不可见', 456, y + 75, COLORS.red, 9, 750);
        } else if (row.key === 'window') {
          label(ctx, `可见：F${windowStart}–F${frame}（最近 k）`, 456, y + 18, COLORS.text, 9, 700);
          label(
            ctx,
            `重历史：${Math.min(frame, DEMO_WINDOW_FRAMES)} 个完整帧`,
            456,
            y + 37,
            COLORS.blue,
            9,
            750,
          );
          label(
            ctx,
            windowReferenceConnected ? '远帧：仍在窗口内' : '远帧：已被截断',
            456,
            y + 56,
            windowReferenceConnected ? COLORS.blue : COLORS.red,
            9,
            750,
          );
          label(ctx, '未来：不可见', 456, y + 75, COLORS.red, 9, 750);
        } else {
          label(
            ctx,
            gcaMemoryFrames > 0
              ? '可见：Anchor + 6-token + Window'
              : '可见：Anchor + Window',
            456,
            y + 18,
            COLORS.text,
            8.5,
            700,
          );
          label(
            ctx,
            `中间旧帧：${gcaMemoryFrames}×6-token`,
            456,
            y + 37,
            gcaMemoryFrames > 0 ? COLORS.orange : COLORS.muted,
            9,
            750,
          );
          label(ctx, '远帧：Anchor 保持连接', 456, y + 56, COLORS.green, 9, 750);
          label(ctx, '未来：不可见', 456, y + 75, COLORS.red, 9, 750);
        }
      });

      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(24, 367, 14, 10);
      label(ctx, '完整历史可见', 44, 376, COLORS.muted, 9, 650);
      ctx.fillStyle = COLORS.orange;
      ctx.fillRect(190, 370, 15, 4);
      label(ctx, '中间旧帧仅以 6-token 可见', 212, 376, COLORS.muted, 9, 650);
      ctx.fillStyle = '#e7ebf0';
      ctx.fillRect(472, 367, 14, 10);
      label(ctx, '不可见', 492, 376, COLORS.muted, 9, 650);
    },
    [frame, gcaHeavyFrames, gcaMemoryFrames, windowReferenceConnected, windowStart],
  );

  const ref = useStaticCanvas(draw, 390);
  const observation = windowReferenceConnected
    ? `观察：T=${frame} 尚未超过示例窗口 k=16，纯滑窗里的 F1 仍可见。`
    : gcaMemoryFrames > 0
      ? `观察：T=${frame} 时，纯滑窗已与 F1 断开；GCA 把 ${gcaMemoryFrames} 个中间旧帧画成每帧 6-token 窄条。`
      : `观察：T=${frame} 时，纯滑窗已与 F1 断开；GCA 仍由 Anchor 与 Window 覆盖全部已有帧。`;
  const feedback = `${observation} 机制：当前查询 F${frame} 都不读未来；Full Causal 看见全部因果历史，Window 只看最近 k 帧，GCA 看见 Anchor、以 6-token 保留的中间旧帧和最近 Window。离线 Global 可读取未来，因此不列入三种在线策略。边界：这里只比较“看得见哪些历史”与重历史增长，不绘制 ATE，也不表示三种策略的精度排序。`;

  return (
    <div>
      <CanvasViewport label="三种流式注意力的历史可见范围，可横向滚动查看" mobileMinWidth={640}>
        <canvas
          ref={ref}
          width={WIDTH}
          height={390}
          style={canvasStyle()}
          role="img"
          aria-label={`查询第 ${frame} 帧，三种策略都不读取未来。Full Causal 可见 F1 到 F${frame} 的因果全历史；Sliding Window 仅可见 F${windowStart} 到 F${frame} 的最近 k 帧，远帧${windowReferenceConnected ? '仍在窗口内' : '已不可见'}；GCA 可见 Anchor、${gcaMemoryFrames} 个每帧 6-token 的中间旧帧与最近 Window。此图只表示历史可见规则，不表示 ATE 或精度排序。`}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="推进流式序列">
        <label htmlFor="stream-frame">
          流式序列推进到第 T 帧 <span className="val">{frame} / 100</span>
        </label>
        <input
          id="stream-frame"
          type="range"
          min={1}
          max={100}
          value={frame}
          aria-valuetext={`第 ${frame} 帧`}
          onInput={(event) => setFrame(Number(event.currentTarget.value))}
        />
      </div>
      <div className="feedback" role="status" aria-live="polite">
        {feedback}
      </div>
    </div>
  );
};

type MaskMode = 'global' | 'causal' | 'window' | 'gca';

const MASK_INFO: Record<MaskMode, { label: string; note: string }> = {
  global: { label: 'Global（可访问历史/未来）', note: '可看完整序列，信息最多，但对流式场景不具备可部署性。' },
  causal: { label: 'Causal', note: '当前帧只能读取过去帧（和自己），状态更安全可控，远端线索会随时间衰减可见。' },
  window: { label: 'Window', note: '只保留最近 k 帧，局部重叠强但会逐步丢失远期参考。' },
  gca: { label: 'GCA', note: '保留 Anchor full，Window full，以及 6-token Memory 轨迹线索，兼顾可约束性与长期稳定。' },
};

export const AttentionPatterns: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<MaskMode>('gca');
  const draw = React.useCallback(
    (ctx: CanvasRenderingContext2D) => {
      clear(ctx, WIDTH, 300);
      const n = 12;
      const cell = 17;
      const ox = 52;
      const oy = 54;
      label(ctx, '查询序列帧', 45, 29, COLORS.text, 12, 800);
      ctx.save();
      ctx.translate(20, 235);
      ctx.rotate(-Math.PI / 2);
      label(ctx, '可见历史帧', 0, 0, COLORS.text, 12, 800);
      ctx.restore();

      for (let row = 0; row < n; row += 1) {
        for (let col = 0; col < n; col += 1) {
          let visible = false;
          if (mode === 'global') visible = true;
          if (mode === 'causal') visible = col <= row;
          if (mode === 'window') visible = col <= row && col >= row - 3;
          if (mode === 'gca') visible = col <= row && (col < 2 || col >= row - 3);
          ctx.fillStyle = visible
            ? mode === 'gca' && col < 2
              ? COLORS.purple
              : COLORS.blue
            : COLORS.white;
          ctx.strokeStyle = COLORS.border;
          ctx.fillRect(ox + col * cell, oy + row * cell, cell - 2, cell - 2);
          ctx.strokeRect(ox + col * cell, oy + row * cell, cell - 2, cell - 2);
        }
      }

      roundedRect(ctx, 315, 52, 287, 185, COLORS.white);
      label(ctx, MASK_INFO[mode].label, 337, 82, mode === 'gca' ? COLORS.green : COLORS.blue, 18, 850);
      const lines =
        mode === 'global'
          ? ['因果 + 当前 + 所有历史', '覆盖全面，可作为上限参考', '但不可直接用于纯流式在线']
          : mode === 'causal'
            ? ['只能看过去帧', '状态可控，不能使用未来信息', '远端几何参照会逐步减弱']
            : mode === 'window'
              ? ['看近 k 帧', '局部重叠好，长程参照不足', '远端漂移更易累积']
              : ['Anchor: 全帧 full', 'Window: 最近 k 帧 full', 'Memory: 历史帧保留 6-token'];
      lines.forEach((line, index) => {
        label(
          ctx,
          `· ${line}`,
          338,
          116 + index * 31,
          index === lines.length - 1 ? COLORS.orange : COLORS.text,
          13,
          700,
        );
      });
      if (mode === 'gca') {
        label(ctx, '说明：Anchor/Window 为 full，Memory 使用 6-token', 337, 220, COLORS.muted, 11, 650);
      }
      camera(ctx, 590, 58, mode === 'window' ? COLORS.red : COLORS.blue);
      for (let i = 0; i < 5; i += 1) {
        token(ctx, 540 + i * 12, 246, COLORS.orange, '', 9);
      }
    },
    [mode],
  );

  const ref = useStaticCanvas(draw, 300);
  return (
    <div>
      <CanvasViewport label="注意力 Mask 对比，切换查看可视范围模式" mobileMinWidth={600}>
        <canvas
          ref={ref}
          width={WIDTH}
          height={300}
          style={canvasStyle()}
          role="img"
          aria-label={`${MASK_INFO[mode].label} 注意力 Mask 交互视图`}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择注意力模式">
        {(Object.keys(MASK_INFO) as MaskMode[]).map((item) => (
          <button
            key={item}
            type="button"
            className={`chip ${mode === item ? 'selected' : ''}`}
            aria-pressed={mode === item}
            onClick={() => setMode(item)}
          >
            {MASK_INFO[item].label}
          </button>
        ))}
      </div>
      <div className={`feedback ${mode === 'gca' ? 'good' : mode === 'global' ? 'bad' : ''}`} role="status" aria-live="polite">
        {MASK_INFO[mode].note}
      </div>
    </div>
  );
};
