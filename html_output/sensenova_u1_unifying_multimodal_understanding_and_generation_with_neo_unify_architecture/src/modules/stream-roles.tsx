import React, { useCallback, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStudio, drawDesk, drawLabel, drawLegend, useObservedCanvas } from './studio-kit';

const W = 960;
const H = 560;
type TokenType = 'text' | 'cleanImage' | 'noiseImage';

const roles: Record<TokenType, { short: string; input: string; stream: string; coordinate: string; purpose: string; color: string }> = {
  text: { short: '文本', input: '词 token', stream: '理解流', coordinate: '(T, 0, 0)', purpose: '提供指令、问题或文本上下文', color: C.current },
  cleanImage: { short: '干净图像', input: '干净视觉 token', stream: '理解流', coordinate: '(T, H, W)', purpose: '提供可观察的图像上下文', color: C.success },
  noiseImage: { short: '噪声图像', input: '噪声视觉 token', stream: '生成流', coordinate: '(T, H, W)', purpose: '表示当前待去噪的图像状态', color: C.aux },
};
const order: TokenType[] = ['text', 'cleanImage', 'noiseImage'];

function card(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, detail: string, color: string, active = false) {
  ctx.fillStyle = C.white;
  ctx.strokeStyle = active ? color : C.border;
  ctx.lineWidth = active ? 4 : 2;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
  drawLabel(ctx, title, x + w / 2, y + 25, active ? color : C.text, 13, 'center');
  drawLabel(ctx, detail, x + w / 2, y + 50, C.muted, 11, 'center');
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number, color: string) {
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y); ctx.lineTo(x2 - 9, y - 6); ctx.lineTo(x2 - 9, y + 6); ctx.closePath(); ctx.fill();
}

export const StreamRoles: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<TokenType>('text');
  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    clearStudio(ctx, W, H); drawDesk(ctx, W, H, 472);
    drawLabel(ctx, '第一步：先分清 token 身份，再谈它们如何交互', 32, 31, C.text, 18);
    drawLabel(ctx, '“文本 / 图像”描述内容类型；“干净 / 噪声”描述图像状态。它们不是同一组二选一概念。', 32, 57, C.muted, 12);
    order.forEach((type, index) => {
      const item = roles[type];
      card(ctx, 32, 92 + index * 92, 174, 70, item.short, item.input, item.color, selected === type);
    });
    const item = roles[selected];
    const centerY = selected === 'text' ? 127 : selected === 'cleanImage' ? 219 : 311;
    arrow(ctx, 212, 280, centerY, item.color);
    card(ctx, 284, centerY - 35, 170, 70, '所属计算流', item.stream, item.color, true);
    arrow(ctx, 460, 518, centerY, item.color);
    card(ctx, 522, centerY - 35, 160, 70, 'Native RoPE 位置', item.coordinate, item.color, true);
    arrow(ctx, 688, 740, centerY, item.color);
    card(ctx, 744, centerY - 35, 184, 70, '在序列中的作用', item.purpose, item.color, true);
    ctx.fillStyle = C.white; ctx.strokeStyle = C.contour; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(274, 368, 654, 80, 10); ctx.fill(); ctx.stroke();
    drawLabel(ctx, '主干中的两条计算流', 292, 392, C.text, 13);
    drawLabel(ctx, '理解流 = 文本 + 干净图像（干净上下文）', 292, 420, C.success, 12);
    drawLabel(ctx, '生成流 = 噪声图像（当前待去噪状态）', 610, 420, C.aux, 12);
    drawLegend(ctx, [
      { label: '文本', color: C.current }, { label: '干净图像', color: C.success }, { label: '噪声图像', color: C.aux },
    ], 204, 520, 190);
  }, [selected]);
  useObservedCanvas(canvasRef, W, H, draw);
  const item = roles[selected];
  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} tabIndex={0}
        aria-label={`统一序列 token 身份，当前选择${item.short}，属于${item.stream}，位置${item.coordinate}`}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          const x = (event.clientX - rect.left) * W / rect.width;
          const y = (event.clientY - rect.top) * H / rect.height;
          if (x < 32 || x > 206) return;
          const index = Math.floor((y - 92) / 92);
          if (index >= 0 && index < order.length && y <= 162 + index * 92) setSelected(order[index]);
        }}
        onKeyDown={(event) => {
          const index = order.indexOf(selected);
          if (event.key === 'ArrowDown') setSelected(order[Math.min(order.length - 1, index + 1)]);
          if (event.key === 'ArrowUp') setSelected(order[Math.max(0, index - 1)]);
        }}
      />
      <div className="ctrl" role="group" aria-label="选择 token 身份">
        {order.map((type) => <button key={type} type="button" aria-pressed={selected === type} onClick={() => setSelected(type)}>{roles[type].short}</button>)}
      </div>
      <div className="feedback good" aria-live="polite">当前：{item.short}先被识别为{item.input}，进入{item.stream}，位置写作 {item.coordinate}。{item.purpose}。</div>
      <p className="note">关键澄清：文本与干净图像共同构成理解侧的干净上下文；噪声图像才是生成侧需要逐步去噪的状态。文本不是“干净图像”的同义词，也不是“噪声图像”的对立状态。</p>
    </div>
  );
};

export default StreamRoles;
