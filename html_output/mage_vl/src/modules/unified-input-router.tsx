import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { MVL, clearPitchScene, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

const MODES = {
  image: { label: '图像', text: '单张图像形成一组视觉 token，再沿共享主路径生成文本。' },
  video: { label: '离线视频', text: '离线视频形成带时间坐标的视觉 token，主干仍是 Mage-ViT → MLP → 语言模型。' },
  stream: { label: '连续流', text: '连续流按段增量进入同一主干，并额外调用感知记忆与认知门控；细节在第 7 章展开。' },
} as const;
type Mode = keyof typeof MODES;

const NODES = [
  { x: 210, width: 118, label: 'Mage-ViT' },
  { x: 354, width: 100, label: '两层 MLP' },
  { x: 480, width: 164, label: 'Qwen3-4B' },
];

function drawPacket(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius = 6) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,.92)';
  ctx.lineWidth = 2;
  ctx.stroke();
}

export const UnifiedInputRouter: React.FC<WidgetProps> = () => {
  const [mode, setMode] = useState<Mode>('image');
  const ref = useCanvasSurface(700, 310, (ctx, seconds) => {
    clearPitchScene(ctx, 700, 310);
    const accent = mode === 'stream' ? MVL.purple : mode === 'video' ? MVL.orange : MVL.blue;
    const progress = (seconds % 3.2) / 3.2;

    ctx.fillStyle = accent;
    roundRect(ctx, 28, 95, 136, 96, 8);
    ctx.fill();
    ctx.fillStyle = MVL.white;
    ctx.font = '700 15px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.fillText(MODES[mode].label, 96, 148);

    NODES.forEach((node, index) => {
      ctx.fillStyle = MVL.white;
      roundRect(ctx, node.x, 110, node.width, 64, 8);
      ctx.fill();
      ctx.strokeStyle = MVL.green;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = MVL.ink;
      ctx.font = '700 13px "Segoe UI"';
      ctx.fillText(node.label, node.x + node.width / 2, 147);

      ctx.strokeStyle = MVL.green;
      ctx.lineWidth = 2;
      const fromX = index === 0 ? 164 : NODES[index - 1].x + NODES[index - 1].width;
      ctx.beginPath();
      ctx.moveTo(fromX, 142);
      ctx.lineTo(node.x, 142);
      ctx.stroke();
    });

    const packetCount = mode === 'image' ? 1 : mode === 'video' ? 3 : 4;
    for (let index = 0; index < packetCount; index += 1) {
      const phase = (progress + index / packetCount) % 1;
      drawPacket(ctx, 164 + phase * 480, 142, accent, mode === 'image' ? 7 : 5);
    }

    if (mode === 'stream') {
      const boxY = 210;
      const boxH = 54;
      const centerY = boxY + boxH / 2;
      const nodeW = 94;
      const nodeH = 34;
      const memoryX = 218;
      const gateX = 352;

      ctx.fillStyle = 'rgba(124,58,237,.07)';
      roundRect(ctx, 210, boxY, 244, boxH, 8);
      ctx.fill();

      [
        { x: memoryX, label: '感知记忆' },
        { x: gateX, label: '认知门控' },
      ].forEach((node) => {
        ctx.fillStyle = MVL.white;
        roundRect(ctx, node.x, centerY - nodeH / 2, nodeW, nodeH, 7);
        ctx.fill();
        ctx.strokeStyle = MVL.purple;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = MVL.ink;
        ctx.font = '700 12px "Segoe UI"';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, node.x + nodeW / 2, centerY + 4);
      });

      const fromX = memoryX + nodeW;
      const toX = gateX;
      ctx.strokeStyle = MVL.purple;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fromX + 2, centerY);
      ctx.lineTo(toX - 2, centerY);
      ctx.stroke();
      drawPacket(ctx, fromX + 4 + progress * (toX - fromX - 8), centerY, MVL.purple, 5);

      ctx.textAlign = 'left';
    }

    ctx.textAlign = 'left';
    drawSceneLabel(ctx, '共享主路径不移动', 440, 54, MVL.green);
  }, [mode], true);

  return (
    <div className="mvl-widget">
      <div className="chip-row" role="radiogroup" aria-label="输入模式">
        {(Object.keys(MODES) as Mode[]).map((item) => (
          <button
            role="radio"
            aria-checked={mode === item}
            key={item}
            className={`chip ${mode === item ? 'selected' : ''}`}
            onClick={() => setMode(item)}
          >
            {MODES[item].label}
          </button>
        ))}
      </div>
      <canvas ref={ref} width={700} height={310} role="img" aria-label={`${MODES[mode].label}沿共享模型路径流动`}>
        图像、离线视频和连续流沿统一模型路径处理；连续流额外经过感知记忆与认知门控。
      </canvas>
      <div className="mvl-route" aria-label="当前处理路径">
        <span>{MODES[mode].label}</span><b>→</b><span>Mage-ViT</span><b>→</b><span>两层 MLP</span><b>→</b><span>Qwen3-4B-Instruct-2507</span>
      </div>
      <div className="feedback good" aria-live="polite">{MODES[mode].text}</div>
    </div>
  );
};
