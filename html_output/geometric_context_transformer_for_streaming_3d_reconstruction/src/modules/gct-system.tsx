import React, { useState } from 'react';
import { CanvasViewport } from '../components/CanvasViewport';
import type { WidgetProps } from './registry';
import {
  COLORS,
  WIDTH,
  arrow,
  canvasStyle,
  clear,
  label,
  roundedRect,
  useStaticCanvas,
} from './gct-kit';
import {
  ROPE_CANVAS_HEIGHT,
  ROPE_LEFT_VECTOR,
  ROPE_QUERY,
  ROPE_READOUT,
  ROPE_TIME_CENTERS,
  ROPE_TIMES as MODEL_ROPE_TIMES,
  TRAINING_CANVAS_HEIGHT,
  TRAINING_LAYOUT,
  clampTrainingProgress,
  clampRopeTimeIndex,
  isRopeDragTarget,
  isTrainingDragTarget,
  ropeDiagramLayoutAt,
  ropeIndexAtX,
  ropeLayoutAt,
  ropeOffsetFromCurrent,
  ropeTimeAt,
  trainingProgressAtX,
  trainingTrajectoryPoint,
  trainingViewsFromProgress,
  trainingWindowLayoutAt,
  trainingWindowProgresses,
} from './gct-system-model';

const PIPELINE = [
  { short: 'DINO / ViT', detail: '用 DINOv2 初始化的 ViT 把当前图像编码为 M 个 image token，并附加 6 个上下文 token。' },
  { short: 'Frame Attn', detail: 'Frame Attention 只在单帧内部精炼特征，不负责跨帧记忆。' },
  { short: 'GCA', detail: 'GCA 读取 Anchor full、最近 k 帧 full 与旧帧 6-token Memory，完成结构化跨帧推理。' },
  { short: '双输出头', detail: 'Camera head 从 camera token 预测位姿；Depth head 从 image token 预测稠密深度。' },
  { short: '缓存更新', detail: 'KV 缓存在 GCA token 流上更新；它是推理系统支路，不是接在输出头后的网络层。' },
] as const;

export const GctPipeline: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const draw = React.useCallback(
    (ctx: CanvasRenderingContext2D) => {
      clear(ctx, WIDTH, 300);
      const xs = [66, 184, 302, 430, 559];
      for (let index = 0; index < PIPELINE.length; index += 1) {
        const active = index <= stage;
        const current = index === stage;
        const fill = active ? (index === 2 ? '#f5f3ff' : COLORS.pale) : COLORS.white;
        const stroke = current ? COLORS.orange : active ? (index === 2 ? COLORS.purple : COLORS.blue) : COLORS.border;
        roundedRect(ctx, xs[index] - 48, 116, 96, 50, fill, stroke, 10);
        label(ctx, PIPELINE[index].short, xs[index] - 38, 146, active ? (index === 2 ? COLORS.purple : COLORS.blue) : COLORS.muted, 11, 800);
        if (index < PIPELINE.length - 1) arrow(ctx, xs[index] + 49, 141, xs[index + 1] - 52, 141, index < stage ? COLORS.green : COLORS.border, 2.5);
      }
      roundedRect(ctx, 230, 25, 145, 48, COLORS.white, stage === 2 ? COLORS.purple : COLORS.border);
      label(ctx, '三类几何上下文', 248, 47, COLORS.purple, 12, 800);
      label(ctx, 'A full · W full · 6T', 248, 64, COLORS.muted, 10, 700);
      arrow(ctx, 302, 74, 302, 113, stage >= 2 ? COLORS.purple : COLORS.border);

      arrow(ctx, 430, 168, 400, 222, stage >= 3 ? COLORS.green : COLORS.border);
      arrow(ctx, 430, 168, 486, 222, stage >= 3 ? COLORS.green : COLORS.border);
      roundedRect(ctx, 340, 224, 114, 38, COLORS.white, stage >= 3 ? COLORS.green : COLORS.border);
      roundedRect(ctx, 466, 224, 118, 38, COLORS.white, stage >= 3 ? COLORS.green : COLORS.border);
      label(ctx, '位姿 P̂ₜ', 367, 248, COLORS.green, 12, 800);
      label(ctx, '深度 D̂ₜ', 492, 248, COLORS.green, 12, 800);

      roundedRect(ctx, 497, 23, 118, 54, COLORS.white, stage === 4 ? COLORS.orange : COLORS.border);
      label(ctx, 'Paged KV', 521, 47, stage === 4 ? COLORS.orange : COLORS.muted, 12, 850);
      label(ctx, 'GCA 状态支路', 515, 66, COLORS.muted, 10, 650);
      arrow(ctx, 349, 114, 520, 78, stage === 4 ? COLORS.orange : COLORS.border);
      label(ctx, `步骤 ${stage + 1} / 5`, 24, 286, COLORS.orange, 13, 850);
    },
    [stage],
  );
  const ref = useStaticCanvas(draw, 300);
  return (
    <div>
      <CanvasViewport label="GCT 架构流程图，可横向滚动查看" mobileMinWidth={600}>
        <canvas ref={ref} width={WIDTH} height={300} style={canvasStyle()} role="img" aria-label={`GCT 架构第 ${stage + 1} 步：${PIPELINE[stage].short}`} />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="选择 GCT 架构步骤">
        {PIPELINE.map((item, index) => (
          <button key={item.short} type="button" className={`chip ${stage === index ? 'selected' : ''}`} aria-pressed={stage === index} onClick={() => setStage(index)}>
            {index + 1}. {item.short}
          </button>
        ))}
      </div>
      <div className="feedback good" role="status" aria-live="polite">{PIPELINE[stage].detail}</div>
    </div>
  );
};

function drawDot(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, color: string) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

function eventCanvasX(event: React.PointerEvent<HTMLCanvasElement>) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return ((event.clientX - bounds.left) / bounds.width) * WIDTH;
}

type CanvasPointerMode = {
  pointerId: number;
  mode: 'control' | 'pan';
  startClientX: number;
  startScrollLeft: number;
  viewport: HTMLElement | null;
};

function eventCanvasY(event: React.PointerEvent<HTMLCanvasElement>, height: number) {
  const bounds = event.currentTarget.getBoundingClientRect();
  return ((event.clientY - bounds.top) / bounds.height) * height;
}

function drawBidirectional(ctx: CanvasRenderingContext2D, from: [number, number], to: [number, number]) {
  ctx.strokeStyle = COLORS.green;
  ctx.fillStyle = COLORS.green;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
  ctx.stroke();
  [
    [from, to],
    [to, from],
  ].forEach(([start, end]) => {
    const angle = Math.atan2(end[1] - start[1], end[0] - start[0]);
    ctx.beginPath();
    ctx.moveTo(end[0], end[1]);
    ctx.lineTo(end[0] - 6 * Math.cos(angle - Math.PI / 6), end[1] - 6 * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(end[0] - 6 * Math.cos(angle + Math.PI / 6), end[1] - 6 * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  });
}

function drawSmallCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.fillRect(-7, -5, 14, 10);
  ctx.beginPath();
  ctx.moveTo(7, -4);
  ctx.lineTo(13, -8);
  ctx.lineTo(13, 8);
  ctx.lineTo(7, 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPairMatrix(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const cell = 13;
  const frameLabels = ['1', '2', '3', '4'];
  label(ctx, '全部 i≠j 有向帧对', x, y, COLORS.green, 10, 850);
  label(ctx, 'j', x + 26, y + 13, COLORS.muted, 8, 800);
  label(ctx, 'i', x + 7, y + 30, COLORS.muted, 8, 800);
  frameLabels.forEach((frame, index) => {
    label(ctx, frame, x + 31 + index * cell, y + 13, COLORS.muted, 8, 750);
    label(ctx, frame, x + 19, y + 30 + index * cell, COLORS.muted, 8, 750);
  });
  frameLabels.forEach((_, row) => {
    frameLabels.forEach((__, column) => {
      const diagonal = row === column;
      roundedRect(
        ctx,
        x + 29 + column * cell,
        y + 18 + row * cell,
        11,
        11,
        diagonal ? '#eef2f6' : '#e9f7f0',
        diagonal ? COLORS.border : COLORS.green,
        2,
      );
    });
  });
}

function drawTrainingCanvas(ctx: CanvasRenderingContext2D, progress: number) {
  const views = trainingViewsFromProgress(progress);
  const windowProgresses = trainingWindowProgresses(progress);
  const windowPoints = windowProgresses.map(trainingTrajectoryPoint);
  const windowGeometry = trainingWindowLayoutAt(progress);
  const trajectoryCard = TRAINING_LAYOUT.trajectoryCard;
  const fixedNote = TRAINING_LAYOUT.fixedNote;
  const supervisionRegion = TRAINING_LAYOUT.supervisionRegion;
  const matrixRegion = TRAINING_LAYOUT.matrixRegion;
  const footerRegion = TRAINING_LAYOUT.footerRegion;
  clear(ctx, WIDTH, TRAINING_CANVAS_HEIGHT);
  label(ctx, 'Progressive Training：课程跨度与移动局部窗口', 24, 27, COLORS.text, 14, 900);
  label(ctx, `${views} views`, 537, 27, COLORS.orange, 13, 900);

  roundedRect(ctx, trajectoryCard.left, trajectoryCard.top, trajectoryCard.right - trajectoryCard.left, trajectoryCard.bottom - trajectoryCard.top, COLORS.white, COLORS.border, 10);
  label(ctx, 'Base：2–24 views', 41, 69, COLORS.blue, 11, 850);
  ctx.fillStyle = COLORS.pale;
  ctx.fillRect(42, 81, 112, 16);
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 81, 112, 16);
  label(ctx, '建立几何基础', 42, 108, COLORS.blue, 9, 750);
  label(ctx, '24', 145, 108, COLORS.blue, 10, 800);
  label(ctx, 'Streaming camera trajectory', 171, 69, COLORS.green, 11, 850);

  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([7, 6]);
  ctx.beginPath();
  for (let p = progress; p <= 100; p += 2) {
    const [x, y] = trainingTrajectoryPoint(p);
    if (p === progress) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  label(ctx, 'future', 559, 106, COLORS.muted, 9, 700);

  for (let p = 0; p <= progress; p += 2) {
    const [x1, y1] = trainingTrajectoryPoint(p);
    const [x2, y2] = trainingTrajectoryPoint(Math.min(progress, p + 2));
    ctx.globalAlpha = p < progress - 21 ? 0.2 : 1;
    ctx.strokeStyle = COLORS.green;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const { left, top, right, bottom } = windowGeometry.window;
  roundedRect(ctx, left, top, right - left, bottom - top, '#e9f7f0', COLORS.green, 9);
  label(ctx, '最近窗口：4 个代表帧', left + 8, 135, COLORS.green, 9, 850);
  ctx.strokeStyle = '#b9dfca';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + 7, TRAINING_LAYOUT.windowDividerY);
  ctx.lineTo(right - 7, TRAINING_LAYOUT.windowDividerY);
  ctx.stroke();
  windowPoints.forEach((point, index) => drawSmallCamera(ctx, point[0], point[1], index === 3 ? COLORS.orange : COLORS.green));
  label(ctx, 'current', windowGeometry.currentLabel.left, windowGeometry.currentLabel.bottom - 2, COLORS.orange, 9, 850);
  label(ctx, '窗口外轨迹淡化；未来路径为中性虚线', fixedNote.left, fixedNote.bottom - 2, COLORS.muted, 10, 700);

  roundedRect(ctx, 24, 248, 592, 122, COLORS.white, COLORS.border, 10);
  label(ctx, '相对位姿监督 · 代表帧对', supervisionRegion.left, supervisionRegion.top + 1, COLORS.text, 11, 850);
  drawSmallCamera(ctx, supervisionRegion.left + 53, supervisionRegion.top + 49, COLORS.green);
  drawSmallCamera(ctx, supervisionRegion.left + 123, supervisionRegion.top + 49, COLORS.orange);
  drawBidirectional(ctx, [supervisionRegion.left + 66, supervisionRegion.top + 49], [supervisionRegion.left + 110, supervisionRegion.top + 49]);
  ctx.strokeStyle = COLORS.purple;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(supervisionRegion.left + 88, supervisionRegion.top + 48, 28, Math.PI * 1.12, Math.PI * 1.85);
  ctx.stroke();
  arrow(ctx, supervisionRegion.left + 71, supervisionRegion.top + 28, supervisionRegion.left + 85, supervisionRegion.top + 22, COLORS.purple, 2);
  label(ctx, 'rotation geodesic', supervisionRegion.left + 1, supervisionRegion.top + 78, COLORS.purple, 10, 800);
  arrow(ctx, supervisionRegion.left + 151, supervisionRegion.top + 73, supervisionRegion.left + 212, supervisionRegion.top + 73, COLORS.orange, 2);
  label(ctx, 'translation L1', supervisionRegion.left + 153, supervisionRegion.top + 91, COLORS.orange, 10, 800);
  label(ctx, '4 台相机只是代表帧', matrixRegion.left, matrixRegion.top + 2, COLORS.text, 10, 850);
  drawPairMatrix(ctx, matrixRegion.left, matrixRegion.top + 21);
  label(ctx, '论文监督全部 i≠j', matrixRegion.left + 92, matrixRegion.top + 36, COLORS.green, 10, 800);
  label(ctx, '训练 k∈[16,64]', matrixRegion.left + 92, matrixRegion.top + 55, COLORS.text, 10, 800);
  label(ctx, '320 views: context parallel', matrixRegion.left + 92, matrixRegion.top + 73, COLORS.muted, 9, 750);
  label(ctx, 'GPU 显存预算限制', matrixRegion.left + 92, matrixRegion.top + 90, COLORS.muted, 9, 750);
  label(ctx, '拖动橙色相机：仅改变课程跨度和窗口位置，不改变 loss 定义。', footerRegion.left, footerRegion.top + 12, COLORS.muted, 10, 700);
}

export const TrainingSupport: React.FC<WidgetProps> = () => {
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerRef = React.useRef<CanvasPointerMode | null>(null);
  const views = trainingViewsFromProgress(trainingProgress);
  const draw = React.useCallback((ctx: CanvasRenderingContext2D) => drawTrainingCanvas(ctx, trainingProgress), [trainingProgress]);
  const ref = useStaticCanvas(draw, TRAINING_CANVAS_HEIGHT);
  const canvasId = 'training-support-demo';
  const feedbackId = 'training-support-feedback';
  const sliderId = 'training-progress';
  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => setTrainingProgress(trainingProgressAtX(eventCanvasX(event)));
  return (
    <div>
      <CanvasViewport label="渐进训练与局部相对位姿监督，可横向滚动查看" mobileMinWidth={640}>
        <canvas
          id={canvasId}
          ref={ref}
          width={WIDTH}
          height={TRAINING_CANVAS_HEIGHT}
          style={{ ...canvasStyle(), cursor: dragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
          role="slider"
          tabIndex={0}
          aria-label={`Streaming 训练进度 ${trainingProgress}%，课程长度 ${views} views；当前窗口显示四个代表相机。`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={trainingProgress}
          aria-valuetext={`${trainingProgress}% · ${views} views`}
          aria-controls={sliderId}
          aria-describedby={feedbackId}
          onPointerDown={(event) => { const x = eventCanvasX(event); const control = isTrainingDragTarget(x, eventCanvasY(event, TRAINING_CANVAS_HEIGHT)); const viewport = event.currentTarget.closest('.canvas-viewport') as HTMLElement | null; pointerRef.current = { pointerId: event.pointerId, mode: control ? 'control' : 'pan', startClientX: event.clientX, startScrollLeft: viewport?.scrollLeft ?? 0, viewport }; event.currentTarget.setPointerCapture(event.pointerId); setDragging(control); if (control) setTrainingProgress(trainingProgressAtX(x)); }}
          onPointerMove={(event) => { const pointer = pointerRef.current; if (!pointer || pointer.pointerId !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return; if (pointer.mode === 'control') updateFromPointer(event); else if (pointer.viewport) pointer.viewport.scrollLeft = pointer.startScrollLeft - (event.clientX - pointer.startClientX); }}
          onPointerUp={(event) => { if (pointerRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); pointerRef.current = null; setDragging(false); }}
          onPointerCancel={(event) => { if (pointerRef.current?.pointerId === event.pointerId) pointerRef.current = null; setDragging(false); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); setTrainingProgress((value) => clampTrainingProgress(value - 1)); }
            if (event.key === 'ArrowRight') { event.preventDefault(); setTrainingProgress((value) => clampTrainingProgress(value + 1)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setTrainingProgress((value) => clampTrainingProgress(value + 1)); }
            if (event.key === 'ArrowDown') { event.preventDefault(); setTrainingProgress((value) => clampTrainingProgress(value - 1)); }
            if (event.key === 'Home') { event.preventDefault(); setTrainingProgress(0); }
            if (event.key === 'End') { event.preventDefault(); setTrainingProgress(100); }
          }}
        />
      </CanvasViewport>
      <div className="ctrl">
        <label htmlFor={sliderId}>Streaming 训练进度 <span className="val">{trainingProgress}% · {views} views</span></label>
        <input id={sliderId} type="range" min="0" max="100" step="1" value={trainingProgress} aria-controls={canvasId} aria-describedby={feedbackId} onInput={(event) => setTrainingProgress(clampTrainingProgress(Number(event.currentTarget.value)))} />
      </div>
      <div id={feedbackId} className="feedback good" role="status" aria-live="polite">
        <b>当前课程：{views} views。</b>Base 用 2–24 views 建立几何基础；Streaming 从 24 线性扩展至 320，后者受 context parallel 下 GPU 显存预算限制。
        <span className="evidence-note">窗口中绘制的 4 台相机只是代表帧；论文实际对窗口内所有 i≠j 使用相对位姿监督，训练 k∈[16,64]。进度不会改变 rotation geodesic + translation L1 的 loss 定义，只改变跨度和窗口位置。</span>
      </div>
    </div>
  );
};

function drawContentVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(ROPE_LEFT_VECTOR.endX, ROPE_LEFT_VECTOR.endY);
  ctx.stroke();
  ctx.restore();
}

function drawRopeCanvas(ctx: CanvasRenderingContext2D, timeIndex: number) {
  const selected = clampRopeTimeIndex(timeIndex);
  const selectedTime = ropeTimeAt(selected);
  const selectedX = ROPE_TIME_CENTERS[selected];
  const selectedToken = ropeLayoutAt(selected).selectedToken;
  const query = ROPE_QUERY;
  const diagram = ropeDiagramLayoutAt(selected);
  const readout = ROPE_READOUT;
  clear(ctx, WIDTH, ROPE_CANVAS_HEIGHT);
  label(ctx, 'Video RoPE：相同内容 token 的相对时间相位', 24, 27, COLORS.text, 14, 900);
  label(ctx, `选中 ${selectedTime}`, 545, 27, COLORS.orange, 11, 900);
  roundedRect(ctx, 24, 43, 592, 64, COLORS.white, COLORS.border, 9);
  label(ctx, '拖动橙色 token', 41, 73, COLORS.muted, 10, 750);
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(150, 79); ctx.lineTo(530, 79); ctx.stroke();
  MODEL_ROPE_TIMES.forEach((time, index) => {
    const x = ROPE_TIME_CENTERS[index];
    drawDot(ctx, x, 79, 4, index === 4 ? COLORS.purple : COLORS.border);
    label(ctx, time, x - 10, 99, index === selected ? COLORS.orange : COLORS.muted, 10, index === selected ? 900 : 700);
  });
  roundedRect(ctx, selectedToken.drawRect.left, selectedToken.drawRect.top, selectedToken.drawRect.right - selectedToken.drawRect.left, selectedToken.drawRect.bottom - selectedToken.drawRect.top, '#fff2df', COLORS.orange, 5);
  label(ctx, 'x', selectedX - 3, 79, COLORS.orange, 11, 900);
  roundedRect(ctx, query.badge.left, query.badge.top, query.badge.right - query.badge.left, query.badge.bottom - query.badge.top, '#fbfaff', COLORS.purple, 6);
  label(ctx, '固定查询帧', query.titleX, query.labelBaseline, COLORS.purple, 10, 850);
  label(ctx, 'query=t', query.detailX, query.labelBaseline, COLORS.purple, 9, 800);
  arrow(ctx, query.arrow.startX, query.arrow.y, query.arrow.endX, query.arrow.y, COLORS.purple, 1.5);

  roundedRect(ctx, 24, 120, 276, 205, COLORS.white, COLORS.border, 10);
  label(ctx, '没有时间位置', 42, 146, COLORS.text, 12, 850);
  label(ctx, '同内容向量 x 重合', 42, 166, COLORS.muted, 10, 700);
  const overlapX = ROPE_LEFT_VECTOR.originX;
  const overlapY = ROPE_LEFT_VECTOR.originY;
  MODEL_ROPE_TIMES.forEach((_, index) => {
    if (index === selected) return;
    drawContentVector(ctx, overlapX, overlapY, COLORS.blue, 0.22);
  });
  drawContentVector(ctx, overlapX, overlapY, COLORS.orange, 1);
  drawDot(ctx, ROPE_LEFT_VECTOR.endX, ROPE_LEFT_VECTOR.endY, ROPE_LEFT_VECTOR.markerRadius, COLORS.orange);
  label(ctx, 'x', ROPE_LEFT_VECTOR.labelX, ROPE_LEFT_VECTOR.labelBaseline, COLORS.orange, 12, 900);
  label(ctx, '无法从内容本身区分时刻', 42, 300, COLORS.red, 10, 750);

  roundedRect(ctx, 312, 120, 304, 205, '#fbfaff', COLORS.purple, 10);
  label(ctx, '加入 RoPE：x → Rτx 的二维投影', 330, 146, COLORS.purple, 12, 850);
  label(ctx, '二维角度仅机制示意；真实 RoPE 多维、多频', 330, 166, COLORS.muted, 10, 700);
  ctx.strokeStyle = COLORS.border; ctx.lineWidth = diagram.axes.lineWidth;
  ctx.beginPath();
  ctx.moveTo(diagram.axes.left, diagram.center.y);
  ctx.lineTo(diagram.axes.right, diagram.center.y);
  ctx.moveTo(diagram.center.x, diagram.axes.top);
  ctx.lineTo(diagram.center.x, diagram.axes.bottom);
  ctx.stroke();
  diagram.vectors.forEach((vector, index) => {
    ctx.globalAlpha = index === selected ? 1 : 0.25;
    ctx.strokeStyle = index === selected ? COLORS.orange : COLORS.purple;
    ctx.lineWidth = vector.lineWidth;
    ctx.beginPath(); ctx.moveTo(diagram.center.x, diagram.center.y); ctx.lineTo(vector.endX, vector.endY); ctx.stroke();
    drawDot(ctx, vector.endX, vector.endY, vector.markerRadius, index === selected ? COLORS.orange : COLORS.purple);
  });
  ctx.globalAlpha = 1;
  ctx.strokeStyle = COLORS.orange; ctx.lineWidth = diagram.arc.lineWidth;
  ctx.beginPath(); ctx.arc(diagram.center.x, diagram.center.y, diagram.arc.radius, diagram.arc.startAngle, diagram.arc.endAngle); ctx.stroke();
  roundedRect(ctx, readout.card.left, readout.card.top, readout.card.right - readout.card.left, readout.card.bottom - readout.card.top, COLORS.white, COLORS.orange, 7);
  label(ctx, '相对时间读数', readout.labelX, readout.titleBaseline, COLORS.text, 10, 850);
  label(ctx, `Δt = ${ropeOffsetFromCurrent(selected)}`, readout.labelX, readout.offsetBaseline, COLORS.orange, 10, 850);
  label(ctx, `Rτx · ${selectedTime}`, readout.labelX, readout.valueBaseline, COLORS.purple, 10, 800);
  label(ctx, '不画性能曲线：这里只解释位置编码机制。', 24, 344, COLORS.muted, 10, 700);
}

export const VideoRopeDemo: React.FC<WidgetProps> = () => {
  const [timeIndex, setTimeIndex] = useState(0);
  const [dragging, setDragging] = useState(false);
  const pointerRef = React.useRef<CanvasPointerMode | null>(null);
  const time = ropeTimeAt(timeIndex);
  const draw = React.useCallback((ctx: CanvasRenderingContext2D) => drawRopeCanvas(ctx, timeIndex), [timeIndex]);
  const ref = useStaticCanvas(draw, ROPE_CANVAS_HEIGHT);
  const canvasId = 'video-rope-demo';
  const feedbackId = 'video-rope-feedback';
  const sliderId = 'video-rope-time';
  const updateFromPointer = (event: React.PointerEvent<HTMLCanvasElement>) => setTimeIndex(ropeIndexAtX(eventCanvasX(event)));
  return (
    <div>
      <CanvasViewport label="Video RoPE 时间位置演示，可横向滚动查看" mobileMinWidth={640}>
        <canvas
          id={canvasId}
          ref={ref}
          width={WIDTH}
          height={ROPE_CANVAS_HEIGHT}
          style={{ ...canvasStyle(), cursor: dragging ? 'grabbing' : 'grab', touchAction: 'pan-y' }}
          role="slider"
          tabIndex={0}
          aria-label={`当前选择 ${time}；同内容 token 的相对时间相位为 ${ropeOffsetFromCurrent(timeIndex)}。`}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={timeIndex}
          aria-valuetext={`${time}，Δt = ${ropeOffsetFromCurrent(timeIndex)}`}
          aria-controls={sliderId}
          aria-describedby={feedbackId}
          onPointerDown={(event) => { const x = eventCanvasX(event); const control = isRopeDragTarget(x, eventCanvasY(event, ROPE_CANVAS_HEIGHT)); const viewport = event.currentTarget.closest('.canvas-viewport') as HTMLElement | null; pointerRef.current = { pointerId: event.pointerId, mode: control ? 'control' : 'pan', startClientX: event.clientX, startScrollLeft: viewport?.scrollLeft ?? 0, viewport }; event.currentTarget.setPointerCapture(event.pointerId); setDragging(control); if (control) setTimeIndex(ropeIndexAtX(x)); }}
          onPointerMove={(event) => { const pointer = pointerRef.current; if (!pointer || pointer.pointerId !== event.pointerId || !event.currentTarget.hasPointerCapture(event.pointerId)) return; if (pointer.mode === 'control') updateFromPointer(event); else if (pointer.viewport) pointer.viewport.scrollLeft = pointer.startScrollLeft - (event.clientX - pointer.startClientX); }}
          onPointerUp={(event) => { if (pointerRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); pointerRef.current = null; setDragging(false); }}
          onPointerCancel={(event) => { if (pointerRef.current?.pointerId === event.pointerId) pointerRef.current = null; setDragging(false); }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft') { event.preventDefault(); setTimeIndex((value) => clampRopeTimeIndex(value - 1)); }
            if (event.key === 'ArrowRight') { event.preventDefault(); setTimeIndex((value) => clampRopeTimeIndex(value + 1)); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setTimeIndex((value) => clampRopeTimeIndex(value + 1)); }
            if (event.key === 'ArrowDown') { event.preventDefault(); setTimeIndex((value) => clampRopeTimeIndex(value - 1)); }
            if (event.key === 'Home') { event.preventDefault(); setTimeIndex(0); }
            if (event.key === 'End') { event.preventDefault(); setTimeIndex(4); }
          }}
        />
      </CanvasViewport>
      <div className="ctrl">
        <label htmlFor={sliderId}>时间位置 <span className="val">{time}</span></label>
        <input id={sliderId} type="range" min="0" max="4" step="1" value={timeIndex} aria-controls={canvasId} aria-describedby={feedbackId} onInput={(event) => setTimeIndex(clampRopeTimeIndex(Number(event.currentTarget.value)))} />
      </div>
      <div id={feedbackId} className="feedback" role="status" aria-live="polite">
        <b>{time}：Δt = {ropeOffsetFromCurrent(timeIndex)}。</b>RoPE 为相同内容 token 注入可区分的相对时间相位；二维投影只用于解释旋转机制，真实实现使用多维、多频。
        <span className="evidence-note">Table 6 的 ATE 7.46→5.98 是独立静态证据，不等于场景匹配、回环检测或轨迹优化。</span>
      </div>
    </div>
  );
};

const PHYSICAL_ORDER = [2, 0, 3, 1] as const;

function drawPagedCache(ctx: CanvasRenderingContext2D, pageCount: number) {
  clear(ctx, WIDTH, 315);
  label(ctx, '写入下一页，观察页式分配与槽位回收', 24, 28, COLORS.text, 14, 900);
  label(ctx, 'Paged KV · 运行时缓存', 452, 28, COLORS.orange, 11, 800);

  roundedRect(ctx, 24, 48, 386, 226, COLORS.white, COLORS.border, 10);
  label(ctx, '逻辑页追加', 40, 72, COLORS.orange, 11, 850);
  const firstLive = Math.max(1, pageCount - 3);
  const livePages = Array.from({ length: pageCount - firstLive + 1 }, (_, index) => firstLive + index);
  livePages.forEach((logicalPage, index) => {
    const x = 40 + index * 82;
    const newest = logicalPage === pageCount;
    roundedRect(ctx, x, 88, 66, 34, newest ? '#fff2df' : '#f8fafc', newest ? COLORS.orange : COLORS.border, 7);
    label(ctx, `L${logicalPage}`, x + 24, 110, newest ? COLORS.orange : COLORS.muted, 10, 850);
  });
  if (pageCount > 4) {
    label(ctx, `L${firstLive - 1} 已释放，槽位可复用`, 40, 143, COLORS.purple, 10, 750);
  } else {
    label(ctx, `${4 - pageCount} 个演示槽仍为空`, 40, 143, COLORS.muted, 10, 700);
  }

  label(ctx, '物理页槽 · 非连续映射', 40, 170, COLORS.orange, 11, 850);
  const slotContents = Array.from({ length: 4 }, () => null as number | null);
  livePages.forEach((logicalPage) => {
    const slotIndex = PHYSICAL_ORDER[(logicalPage - 1) % PHYSICAL_ORDER.length];
    slotContents[slotIndex] = logicalPage;
  });
  slotContents.forEach((logicalPage, slotIndex) => {
    const x = 40 + slotIndex * 86;
    const newest = logicalPage === pageCount;
    roundedRect(ctx, x, 188, 70, 50, newest ? '#fff2df' : '#f8fafc', newest ? COLORS.orange : COLORS.border, 8);
    label(ctx, `P${slotIndex}`, x + 9, 209, COLORS.muted, 9, 750);
    label(ctx, logicalPage === null ? '空' : `L${logicalPage}`, x + 37, 220, newest ? COLORS.orange : COLORS.text, 11, 850);
  });
  label(ctx, '页表记录 L→P；追加时不必整体搬移连续 KV。', 52, 260, COLORS.muted, 10, 700);

  roundedRect(ctx, 426, 48, 190, 226, '#fffaf3', COLORS.orange, 10);
  label(ctx, 'FlashInfer 读取页表执行', 443, 76, COLORS.orange, 11, 850);
  label(ctx, '论文报告 ≈20 FPS', 443, 111, COLORS.orange, 16, 900);
  label(ctx, '518×378', 443, 140, COLORS.text, 11, 800);
  label(ctx, '≤1,000 帧 · k=64', 443, 162, COLORS.text, 11, 800);
  label(ctx, 'bfloat16 · FlashInfer', 443, 184, COLORS.text, 11, 800);
  ctx.strokeStyle = COLORS.border;
  ctx.beginPath();
  ctx.moveTo(443, 198);
  ctx.lineTo(599, 198);
  ctx.stroke();
  label(ctx, '连续 PyTorch ≈10.5 FPS', 443, 222, COLORS.muted, 10, 750);
  label(ctx, '差异不只来自分页', 443, 247, COLORS.red, 10, 800);
  label(ctx, '图中 4 槽仅为机制示意，并非论文固定容量。', 24, 306, COLORS.muted, 10, 700);
}

export const PagedKvDemo: React.FC<WidgetProps> = () => {
  const [pageCount, setPageCount] = useState(3);
  const draw = React.useCallback((ctx: CanvasRenderingContext2D) => drawPagedCache(ctx, pageCount), [pageCount]);
  const ref = useStaticCanvas(draw, 315);
  const canvasId = 'paged-kv-demo';
  const feedbackId = 'paged-kv-feedback';
  return (
    <div>
      <CanvasViewport label="Paged KV 页式缓存演示，可横向滚动查看" mobileMinWidth={640}>
        <canvas
          id={canvasId}
          ref={ref}
          width={WIDTH}
          height={315}
          style={canvasStyle()}
          role="img"
          aria-label={`已写入 ${pageCount} 个逻辑页；当前保留 L${Math.max(1, pageCount - 3)} 至 L${pageCount}，页表映射到四个演示物理槽。`}
          aria-describedby={feedbackId}
        />
      </CanvasViewport>
      <div className="ctrl" role="group" aria-label="控制 Paged KV 页写入">
        <button
          type="button"
          className="chip selected"
          disabled={pageCount >= 8}
          aria-controls={canvasId}
          onClick={() => setPageCount((value) => Math.min(8, value + 1))}
        >
          {pageCount >= 8 ? '演示已到 L8' : '写入下一页'}
        </button>
        <button
          type="button"
          className="chip"
          disabled={pageCount === 3}
          aria-controls={canvasId}
          onClick={() => setPageCount(3)}
        >
          重置
        </button>
      </div>
      <div id={feedbackId} className="feedback" role="status" aria-live="polite">
        <b>当前状态：</b>
        {pageCount <= 4
          ? `逻辑页 L${pageCount} 获得空闲物理槽，无需整体搬移此前 KV。`
          : `逻辑页 L${pageCount} 复用已释放槽位；真实淘汰由 token 生命周期与缓存管理决定，并非固定四页或固定 FIFO。`}
        <span className="evidence-note">约 20 FPS 与约 10.5 FPS 是不同实现组合的对照，不能把全部提升单独归因于分页。</span>
      </div>
    </div>
  );
};
