import React, { useEffect, useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, clearStage, drawSceneLabel, startObservedLoop } from './stage-analogy';

const cells = [
  { name: '左上', h: .17, w: .17 }, { name: '上中', h: .17, w: .50 }, { name: '右上', h: .17, w: .83 },
  { name: '左中', h: .50, w: .17 }, { name: '中心', h: .50, w: .50 }, { name: '右中', h: .50, w: .83 },
  { name: '左下', h: .83, w: .17 }, { name: '下中', h: .83, w: .50 }, { name: '右下', h: .83, w: .83 },
];
const sourceCell = 2;

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, active = false) {
  ctx.fillStyle = active ? 'rgba(34,141,92,.045)' : C.white;
  ctx.strokeStyle = active ? C.green : C.line; ctx.lineWidth = active ? 2 : 1.4;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke();
}

function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = C.blue) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 8 * Math.cos(angle - .5), y2 - 8 * Math.sin(angle - .5));
  ctx.lineTo(x2 - 8 * Math.cos(angle + .5), y2 - 8 * Math.sin(angle + .5)); ctx.closePath(); ctx.fill();
}

function drawCan(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, muted = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.rotate(-.12);
  ctx.globalAlpha = muted ? .25 : 1;
  ctx.fillStyle = muted ? C.muted : '#d52b35'; ctx.strokeStyle = muted ? C.muted : '#8d1d25'; ctx.lineWidth = 1.7;
  ctx.beginPath(); ctx.roundRect(-19, -10, 38, 20, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#dfe4ea'; ctx.beginPath(); ctx.ellipse(-18, 0, 4.5, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.58)'; ctx.fillRect(-8, -7, 4, 14);
  ctx.restore();
}

function drawPerson(ctx: CanvasRenderingContext2D, baseX: number, baseY: number, scale = 1, ghost = false, withCan = false) {
  ctx.save(); ctx.translate(baseX, baseY); ctx.scale(scale, scale);
  ctx.globalAlpha = ghost ? .18 : 1; ctx.strokeStyle = ghost ? C.blue : C.ink; ctx.fillStyle = ghost ? C.blue : '#27446e'; ctx.lineWidth = 8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(0, -174, 24, 0, Math.PI * 2); ctx.fill();
  if (!ghost) { ctx.fillStyle = '#d7a27b'; ctx.beginPath(); ctx.moveTo(20, -181); ctx.lineTo(34, -174); ctx.lineTo(20, -168); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = ghost ? C.blue : '#76906a'; ctx.beginPath(); ctx.roundRect(-23, -145, 48, 82, 13); ctx.fill();
  ctx.strokeStyle = ghost ? C.blue : '#27446e';
  ctx.beginPath(); ctx.moveTo(-10, -64); ctx.lineTo(-16, 0); ctx.moveTo(13, -64); ctx.lineTo(22, 0); ctx.stroke();
  ctx.strokeStyle = ghost ? C.blue : '#d7a27b'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(15, -132); ctx.lineTo(42, -108); ctx.lineTo(38, -157); ctx.lineTo(30, -171); ctx.stroke();
  if (withCan) drawCan(ctx, 52, -171, .78, false);
  ctx.restore();
}

function drawGrid(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.strokeStyle = 'rgba(39,68,110,.20)'; ctx.lineWidth = 1;
  for (let i = 1; i < 3; i += 1) {
    ctx.beginPath(); ctx.moveTo(x + w * i / 3, y); ctx.lineTo(x + w * i / 3, y + h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h * i / 3); ctx.lineTo(x + w, y + h * i / 3); ctx.stroke();
  }
}

export const AddressRouting: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef(4);
  const [selected, setSelected] = useState(4);

  const choose = (index: number) => { selectedRef.current = index; setSelected(index); };

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return startObservedLoop(canvas, 760, 410, ctx => {
      const index = selectedRef.current;
      const target = cells[index];
      clearStage(ctx, 760, 410);
      panel(ctx, 16, 48, 232, 296);
      panel(ctx, 266, 48, 210, 296);
      panel(ctx, 494, 48, 250, 296, true);
      drawSceneLabel(ctx, '① 参考画面', 132, 29, C.ink, 'center');
      drawSceneLabel(ctx, '② 手动改写 context token 的 PE', 371, 29, C.orange, 'center');
      drawSceneLabel(ctx, '③ 生成结果的空间倾向', 619, 29, C.green, 'center');

      ctx.fillStyle = '#eff2eb'; ctx.fillRect(28, 62, 208, 220);
      drawPerson(ctx, 107, 277, .83, false, true);
      ctx.strokeStyle = C.orange; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
      ctx.strokeRect(137, 113, 49, 31); ctx.setLineDash([]);
      drawSceneLabel(ctx, '参考内容：红色易拉罐', 132, 306, C.orange, 'center');
      drawSceneLabel(ctx, '源位置编码：右上', 132, 329, C.muted, 'center');

      ctx.fillStyle = 'rgba(217,119,6,.08)'; ctx.strokeStyle = C.orange;
      ctx.beginPath(); ctx.roundRect(284, 76, 174, 92, 9); ctx.fill(); ctx.stroke();
      drawCan(ctx, 322, 120, 1.1);
      drawSceneLabel(ctx, 'context token  y', 379, 105, C.ink, 'center');
      drawSceneLabel(ctx, '内容：红罐、银色罐口', 379, 128, C.orange, 'center');
      drawSceneLabel(ctx, '内容向量保持不变', 371, 153, C.green, 'center');
      arrow(ctx, 371, 176, 371, 205, C.orange);
      ctx.fillStyle = C.white; ctx.strokeStyle = C.orange;
      ctx.beginPath(); ctx.roundRect(284, 209, 174, 88, 9); ctx.fill(); ctx.stroke();
      drawSceneLabel(ctx, '只替换位置编码', 371, 231, C.orange, 'center');
      drawSceneLabel(ctx, `右上 → ${target.name}`, 371, 256, C.ink, 'center');
      drawSceneLabel(ctx, `PEᵧ=(t, ${target.h.toFixed(2)}, ${target.w.toFixed(2)})`, 371, 280, C.blue, 'center');
      drawSceneLabel(ctx, '不是搬运参考像素', 371, 326, C.muted, 'center');

      const gridX = 506; const gridY = 62; const gridW = 226; const gridH = 220;
      ctx.fillStyle = '#eff2eb'; ctx.fillRect(gridX, gridY, gridW, gridH); drawGrid(ctx, gridX, gridY, gridW, gridH);
      drawPerson(ctx, 619, 279, .75, true, false);
      const source = cells[sourceCell];
      const sourceX = gridX + source.w * gridW; const sourceY = gridY + source.h * gridH;
      if (index !== sourceCell) {
        ctx.strokeStyle = C.muted; ctx.lineWidth = 1.7; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.arc(sourceX, sourceY, 18, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        drawCan(ctx, sourceX, sourceY, .66, true);
        drawSceneLabel(ctx, '旧地址', sourceX, sourceY - 24, C.muted, 'center');
      }
      const targetX = gridX + target.w * gridW; const targetY = gridY + target.h * gridH;
      ctx.strokeStyle = C.green; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(targetX, targetY, 25, 0, Math.PI * 2); ctx.stroke();
      drawCan(ctx, targetX, targetY, .92);
      drawSceneLabel(ctx, `新地址：${target.name}`, targetX, targetY - 31, C.green, 'center');
      drawSceneLabel(ctx, '目标 latent 更偏向在此检索红罐内容', 619, 306, C.green, 'center');
      drawSceneLabel(ctx, '生成结果倾向在指定区域出现对应内容', 619, 329, C.ink, 'center');

      ctx.fillStyle = 'rgba(39,68,110,.06)'; ctx.beginPath(); ctx.roundRect(96, 363, 568, 35, 8); ctx.fill();
      drawSceneLabel(ctx, '论文的验证结论：预训练视频 DiT 已具有“位置对齐的注意力偏置”。', 380, 386, C.blue, 'center');
    });
  }, []);

  const target = cells[selected];
  return (
    <div>
      <div className="method-canvas-scroll">
        <canvas ref={ref} width={760} height={410} aria-label="手动改写可乐罐context token位置编码并观察位置对齐注意力" />
      </div>
      <div className="canvas-pan-hint">← 左右滑动画布，查看参考内容、位置编码和生成结果 →</div>
      <div className="ctrl">
        <span>把同一个红罐 context token 指定到：</span>
        {cells.map((cell, index) => (
          <button type="button" key={cell.name} className={`chip ${selected === index ? 'selected' : ''}`} onClick={() => choose(index)}>{cell.name}</button>
        ))}
      </div>
      <div className="feedback good">
        已将位置编码从“右上”改为“{target.name}”：红罐内容向量没有改变，但生成视频的目标 latent 会更倾向在 PE 指定的区域检索并呈现这部分参考内容。
      </div>
      <div className="feedback">
        教学边界：这是对论文 Method §3.1 位置重分配实验逻辑的简化交互复现，表示“生成倾向”而非浏览器实时推理结果；完整自动投影过程已经在本节上方展开，完整QKV与深度/时间消歧留到第四章。
      </div>
    </div>
  );
};

export default AddressRouting;
