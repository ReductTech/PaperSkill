import React, { useRef, useState } from 'react';
import { clearScene, drawGuide, drawLabel, drawPaper, Feedback, palette, roundRect, useDrawing } from './vit-kit';

type Vector2 = [number, number];
type DragState = { slot: 0 | 1; pointerId: number; x: number; y: number; offsetX: number; offsetY: number };
const CURRENT_X = 405;
const SLOT_CENTERS = [488, 636] as const;
const TILE_Y = 138;
const TILE_SIZE = 90;
const clip = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const format = (value: number) => Math.abs(value) < 0.00005 ? '0.0000' : value.toFixed(4);
const vectorText = (value: Vector2) => `[${format(value[0])}, ${format(value[1])}]`;
const signedVectorText = (value: Vector2) => `[${value.map((v) => Math.abs(v) < 0.00005 ? '0.0000' : `${v > 0 ? '+' : ''}${v.toFixed(4)}`).join(', ')}]`;

/** One fixed query reads two tokens: a teaching calculation, not a full CLS layer. */
export function computePositionExample(swap: boolean, position: boolean) {
  const contents: [Vector2, Vector2] = swap ? [[0, 1], [1, 0]] : [[1, 0], [0, 1]];
  const positions: [Vector2, Vector2] = position ? [[0.5, 0], [0, 0.5]] : [[0, 0], [0, 0]];
  const vectors: [Vector2, Vector2] = contents.map((v, i) => [v[0] + positions[i][0], v[1] + positions[i][1]]) as [Vector2, Vector2];
  const scores = vectors.map((v) => v[0] / Math.sqrt(2));
  const maxScore = Math.max(...scores);
  const exponentials = scores.map((score) => Math.exp(score - maxScore));
  const denominator = exponentials.reduce((sum, value) => sum + value, 0);
  const weights = exponentials.map((value) => value / denominator) as Vector2;
  const output = [
    weights[0] * vectors[0][0] + weights[1] * vectors[1][0],
    weights[0] * vectors[0][1] + weights[1] * vectors[1][1],
  ] as Vector2;
  return { vectors, scores, weights, output };
}

function tile(ctx: CanvasRenderingContext2D, cx: number, cy: number, isRed: boolean) {
  const x = cx - TILE_SIZE / 2;
  const y = cy - TILE_SIZE / 2;
  roundRect(ctx, x + 3, y + 4, TILE_SIZE, TILE_SIZE, 6, 'rgba(33,50,74,0.13)');
  roundRect(ctx, x, y, TILE_SIZE, TILE_SIZE, 6, isRed ? palette.red : palette.blue, '#ffffff');
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  if (isRed) {
    ctx.moveTo(cx - 19, cy + 19);
    ctx.lineTo(cx + 19, cy - 19);
  } else {
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI);
  }
  ctx.stroke();
  ctx.restore();
}

export const Widget3: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [swap, setSwap] = useState(false);
  const [position, setPosition] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);
  const reference = computePositionExample(false, position);
  const current = computePositionExample(swap, position);
  const delta: Vector2 = [current.output[0] - reference.output[0], current.output[1] - reference.output[1]];

  useDrawing(canvasRef, (ctx) => {
    clearScene(ctx, 1080, 280);
    drawPaper(ctx, 45, 38, 315, 185);
    drawPaper(ctx, CURRENT_X, 38, 315, 185);
    for (const paperX of [45, CURRENT_X]) {
      for (let slot = 0; slot < 2; slot += 1) {
        const center = paperX + (slot === 0 ? 83 : 231);
        drawGuide(ctx, center - 51, TILE_Y - 51, 102, 102, position ? (slot === 0 ? palette.orange : palette.purple) : palette.border);
        if (position) {
          // Slot markers stay fixed while content moves.
          roundRect(ctx, center - 24, 202, 48, 6, 2, slot === 0 ? palette.orange : palette.purple);
        }
      }
    }
    tile(ctx, 128, TILE_Y, true);
    tile(ctx, 276, TILE_Y, false);
    for (const slot of [0, 1] as const) {
      if (drag?.slot === slot) continue;
      tile(ctx, SLOT_CENTERS[slot], TILE_Y, swap ? slot === 1 : slot === 0);
    }
    if (drag) tile(ctx, drag.x, drag.y, swap ? drag.slot === 1 : drag.slot === 0);

    // Both coordinates use the same 0–1.5 scale; reference above, current below.
    for (let dimension = 0; dimension < 2; dimension += 1) {
      const y = 83 + dimension * 82;
      roundRect(ctx, 776, y, 240, 36, 5, '#ffffff', palette.border);
      roundRect(ctx, 778, y + 4, 236 * reference.output[dimension] / 1.5, 11, 2, palette.blue);
      roundRect(ctx, 778, y + 21, 236 * current.output[dimension] / 1.5, 11, 2, palette.green);
    }
    ctx.fillStyle = palette.muted;
    ctx.font = '18px "Segoe UI", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 776, 240);
    ctx.textAlign = 'right';
    ctx.fillText('1.5', 1016, 240);
    ctx.textAlign = 'left';
    drawLabel(ctx, '原摆法', 165, 57, palette.text);
    drawLabel(ctx, '当前', 533, 57, palette.text);
  });

  const pointerPosition = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 1080 / rect.width, y: (event.clientY - rect.top) * 280 / rect.height };
  };

  const startDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!event.isPrimary || event.button !== 0 || dragRef.current) return;
    const point = pointerPosition(event);
    const slot = SLOT_CENTERS.findIndex((x) => Math.abs(point.x - x) <= TILE_SIZE / 2 && Math.abs(point.y - TILE_Y) <= TILE_SIZE / 2);
    if (slot < 0) return;
    const state: DragState = { slot: slot as 0 | 1, pointerId: event.pointerId, x: SLOT_CENTERS[slot], y: TILE_Y, offsetX: point.x - SLOT_CENTERS[slot], offsetY: point.y - TILE_Y };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    dragRef.current = state;
    setDrag(state);
  };

  const moveDrag = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const previous = dragRef.current;
    if (!previous || previous.pointerId !== event.pointerId) return;
    const point = pointerPosition(event);
    const next = { ...previous, x: clip(point.x - previous.offsetX, 450, 675), y: clip(point.y - previous.offsetY, 83, 178) };
    dragRef.current = next;
    setDrag(next);
    event.preventDefault();
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>, cancelled = false) => {
    const previous = dragRef.current;
    if (!previous || previous.pointerId !== event.pointerId) return;
    if (!cancelled) {
      const point = pointerPosition(event);
      const centerX = clip(point.x - previous.offsetX, 450, 675);
      const targetSlot = centerX < CURRENT_X + 315 / 2 ? 0 : 1;
      if (targetSlot !== previous.slot) setSwap((value) => !value);
    }
    dragRef.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const clearDrag = () => {
    const active = dragRef.current;
    if (active && canvasRef.current?.hasPointerCapture(active.pointerId)) canvasRef.current.releasePointerCapture(active.pointerId);
    dragRef.current = null;
    setDrag(null);
  };

  let feedback: string;
  if (!position && !swap) {
    feedback = `没有位置向量，当前仍是原摆法。参照与当前汇总均为 ${vectorText(current.output)}，差值 ${signedVectorText(delta)}。试着交换左右，看看只改变内容顺序会发生什么。`;
  } else if (!position) {
    feedback = `交换了红蓝内容，但没有固定位置向量：注意力权重随内容一起换位，汇总仍为 ${vectorText(current.output)}，差值 ${signedVectorText(delta)}。这个结构不能仅凭这些输入区别两种顺序。`;
  } else if (!swap) {
    feedback = `加入固定位置后，左红是 [1.5, 0]，右蓝是 [0, 1.5]。当前与参照汇总均为 ${vectorText(current.output)}，差值 ${signedVectorText(delta)}；尚未交换内容。`;
  } else {
    feedback = `位置框不动，内容交换：左蓝变为 [0.5, 1]，右红变为 [1, 0.5]。当前汇总 ${vectorText(current.output)}，相对原摆法的差值为 ${signedVectorText(delta)}。这个教学计算对顺序产生了响应，但不代表模型已经学会分类。`;
  }

  return (
    <div data-mode="hybrid" data-patterns="P6 P3" onKeyDown={(event) => { if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.stopPropagation(); }}>
      <div className="chip-row" role="group" aria-label="是否加入固定位置向量">
        <button type="button" className={`chip${!position ? ' selected' : ''}`} aria-pressed={!position} onClick={() => { clearDrag(); setPosition(false); }}>不加位置</button>
        <button type="button" className={`chip${position ? ' selected' : ''}`} aria-pressed={position} onClick={() => { clearDrag(); setPosition(true); }}>加入位置</button>
      </div>
      <canvas ref={canvasRef} width={1080} height={280} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={(event) => endDrag(event)} onPointerCancel={(event) => endDrag(event, true)} onLostPointerCapture={() => { dragRef.current = null; setDrag(null); }} aria-label={`两块内容交换与固定位置向量对汇总的影响。当前${swap ? '蓝在左、红在右' : '红在左、蓝在右'}，${position ? '加入' : '未加'}固定位置。可拖动当前纸片跨越中线，或使用交换左右按钮。`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'none', cursor: drag ? 'grabbing' : 'grab' }} />
      <div className="step-ctrl">
        <button type="button" className="chip" onClick={() => { clearDrag(); setSwap((value) => !value); }}>交换左右</button>
        <button type="button" className="chip" disabled={!swap && !drag} onClick={() => { clearDrag(); setSwap(false); }}>恢复原位</button>
      </div>
      <div className="ctrl" aria-label="固定槽位与当前内容">
        <span>左位：{swap ? '蓝纸（圆环）' : '红纸（斜线）'}；位置 {position ? '[0.5, 0]' : '[0, 0]'}</span>
        <span>右位：{swap ? '红纸（斜线）' : '蓝纸（圆环）'}；位置 {position ? '[0, 0.5]' : '[0, 0]'}</span>
      </div>
      <Feedback>{feedback}</Feedback>
      <details style={{ marginTop: 12 }}>
        <summary>查看二维教学计算与适用边界</summary>
        <p>红内容为 [1, 0]，蓝内容为 [0, 1]。固定查询 q=[1, 0]；两个键 k 和被汇总的值 v 都暂取“内容＋固定槽位位置”。匹配分数先除以 √2，再做指数归一化，得到两个相加为 1 的权重。</p>
        <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
          <table className="paper">
            <thead><tr><th scope="col">当前槽位</th><th scope="col">键和值</th><th scope="col">缩放分数</th><th scope="col">权重</th></tr></thead>
            <tbody>{([0, 1] as const).map((i) => <tr key={i}><th scope="row">{i === 0 ? '左位' : '右位'}</th><td>{vectorText(current.vectors[i])}</td><td>{format(current.scores[i])}</td><td>{format(current.weights[i])}</td></tr>)}</tbody>
          </table>
        </div>
        <p>汇总 o=w₁v₁+w₂v₂。参照 {vectorText(reference.output)}，当前 {vectorText(current.output)}。右图蓝条为参照，绿条为当前；两维共用 0–1.5 刻度。</p>
        <p>这里只有一个查询读取两个图块，没有把 CLS 自身也列为目标，不是完整 ViT 层。真实模型的键和值由不同投影得到。不加位置不代表所有图像都无法分类；固定位置也不保证任意参数都对顺序敏感。仅把“内容＋位置”直接求和，交换前后仍然相同，不能用它代替这里的加权计算。</p>
      </details>
    </div>
  );
};
