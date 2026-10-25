import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, lerp } from '../lib/canvasKit';
import { clearScene, AUX, DARK, EMPH, GUIDE, LINE, MUTED, OK } from './musicKit';
import type { WidgetProps } from './registry';

// m21 — VLM 骨干 + 动作专家（P5 可点击热点）。
// 四个节点：图像/语言输入 → VLM 骨干 → 动作专家 → 动作块输出；点击节点或下方按钮查看详情。

const W = 1080;
const H = 280;

const NX = 60;
const NY = 74;
const NW = 210;
const NH = 112;
const GAP = 40;

const NODE_COLORS: string[] = [AUX, GUIDE, EMPH, OK];

interface NodeInfo {
  name: string;
  detail: string;
}

const NODES: NodeInfo[] = [
  {
    name: '图像 / 语言输入',
    detail: '相机图像与语言指令一起送进模型——这是“读谱”的原料：先看清画面，才能谈动作。',
  },
  {
    name: 'VLM 骨干',
    detail: '开源的 PaliGemma（3B）视觉语言模型，是 π0 的理解层，负责读懂图像与语言指令。',
  },
  {
    name: '动作专家',
    detail: '300M 参数的动作专家，是 π0 的执行层，用 flow matching 产生连续动作。它与 3B 骨干合起来共 3.3B 参数。',
  },
  {
    name: '动作块输出',
    detail: '一次输出一个动作块（horizon H = 50），控制频率最高 50 Hz，供机器人高频执行。',
  },
];

const boxX = (i: number): number => NX + i * (NW + GAP);

const helperRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
};

export const M21: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const selRef = useRef<number>(0);
  const hitRef = useRef<{ x: number; y: number; w: number; h: number }[]>([]);
  const [sel, setSel] = useState<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    hitRef.current = NODES.map((_, i) => ({ x: boxX(i), y: NY, w: NW, h: NH }));

    const t0 = performance.now();

    const render = (elapsed: number): void => {
      const cur = selRef.current;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed / 380);

      clearScene(ctx, W, H);

      // 节点之间的箭头（先画，让节点压在上面）
      ctx.save();
      ctx.strokeStyle = LINE;
      ctx.lineWidth = 2;
      const ay = NY + NH / 2;
      for (let i = 0; i < NODES.length - 1; i++) {
        const x1 = boxX(i) + NW + 6;
        const x2 = boxX(i + 1) - 4;
        ctx.beginPath();
        ctx.moveTo(x1, ay);
        ctx.lineTo(x2, ay);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x2 - 8, ay - 6);
        ctx.lineTo(x2, ay);
        ctx.lineTo(x2 - 8, ay + 6);
        ctx.stroke();
      }
      ctx.restore();

      // 贯穿整条流水线的流动光点
      const flow = (elapsed % 2400) / 2400;
      const fx = lerp(boxX(0) + NW / 2, boxX(NODES.length - 1) + NW / 2, flow);
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.35 * pulse;
      ctx.fillStyle = GUIDE;
      ctx.beginPath();
      ctx.arc(fx, NY - 22, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      for (let i = 0; i < NODES.length; i++) {
        const x = boxX(i);
        const isSel = i === cur;
        ctx.save();
        helperRoundRect(ctx, x, NY, NW, NH, 10);
        ctx.fillStyle = isSel ? 'rgba(39,68,110,0.10)' : '#ffffff';
        ctx.fill();
        ctx.strokeStyle = isSel ? GUIDE : LINE;
        ctx.lineWidth = isSel ? 3 : 1.5;
        ctx.stroke();

        helperRoundRect(ctx, x + 14, NY + 14, NW - 28, 6, 3);
        ctx.fillStyle = NODE_COLORS[i];
        ctx.fill();

        ctx.fillStyle = isSel ? GUIDE : MUTED;
        ctx.font = '600 40px "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), x + NW / 2, NY + NH / 2 + 24);
        ctx.restore();
      }

      // 选中节点的底部指示条
      ctx.save();
      ctx.fillStyle = DARK;
      ctx.fillRect(boxX(cur) + 24, NY + NH - 12, NW - 48, 3);
      ctx.restore();
    };

    const tick = (): void => {
      render(performance.now() - t0);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = (): void => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = (): void => {
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const select = (i: number): void => {
    selRef.current = i;
    setSel(i);
  };

  const onCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = ((e.clientX - rect.left) * W) / rect.width;
    const y = ((e.clientY - rect.top) * H) / rect.height;
    const boxes = hitRef.current;
    for (let i = 0; i < boxes.length; i++) {
      const b = boxes[i];
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        select(i);
        return;
      }
    }
  };

  const cur = NODES[sel];

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        onClick={onCanvasClick}
        style={{ cursor: 'pointer' }}
      />
      <div className="chip-row">
        {NODES.map((n, i) => (
          <button
            key={n.name}
            className={'chip' + (sel === i ? ' selected' : '')}
            onClick={() => select(i)}
          >
            {n.name}
          </button>
        ))}
      </div>
      <div className={'feedback ' + ''}>
        <b>{cur.name}</b>：{cur.detail}
      </div>
    </div>
  );
};

export default M21;
