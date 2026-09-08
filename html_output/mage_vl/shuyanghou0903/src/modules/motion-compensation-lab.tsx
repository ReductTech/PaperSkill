import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';
import { drawLabSurface } from './match-story';
import { LabPlayback } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import { MVL, drawPitch, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

const FIELD = { x: 324, y: 68, width: 466, height: 242, divisions: 16 } as const;
const REFERENCE = { column: 3, row: 8 };
const TRUTH = { column: 11, row: 7 };
const INITIAL = { column: 6, row: 5 };

function cellCenter(column: number, row: number) {
  return {
    x: FIELD.x + (column + .5) * (FIELD.width / FIELD.divisions),
    y: FIELD.y + (row + .5) * (FIELD.height / FIELD.divisions),
  };
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string, dashed = false) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 2.5;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath(); ctx.moveTo(fromX, fromY); ctx.lineTo(toX, toY); ctx.stroke(); ctx.setLineDash([]);
  ctx.beginPath(); ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 9 * Math.cos(angle - Math.PI / 6), toY - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 9 * Math.cos(angle + Math.PI / 6), toY - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath(); ctx.fill(); ctx.restore();
}

const easeOut = (value: number) => 1 - Math.pow(1 - value, 4);

export const MotionCompensationLab: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(3600);
  const [position, setPosition] = useState(INITIAL);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const eased = easeOut(autoplay.progress);
    setPosition({
      column: INITIAL.column + (TRUTH.column - INITIAL.column) * eased,
      row: INITIAL.row + (TRUTH.row - INITIAL.row) * eased,
    });
  }, [autoplay.progress]);

  const prediction = cellCenter(position.column, position.row);
  const truth = cellCenter(TRUTH.column, TRUTH.row);
  const reference = cellCenter(REFERENCE.column, REFERENCE.row);
  const gridError = Math.hypot(position.column - TRUTH.column, position.row - TRUTH.row);
  const residual = gridError < .35 ? '接近 0' : gridError <= 2 ? '低' : gridError <= 5 ? '中' : '高';

  const ref = useCanvasSurface(820, 390, (ctx) => {
    drawLabSurface(ctx, 820, 390);
    drawSceneLabel(ctx, '参考帧：预测来源', 42, 34, MVL.blue);
    drawSceneLabel(ctx, '当前 P 帧：移动参考块完成预测', 350, 34, MVL.blue);
    drawPitch(ctx, 24, 68, 250, 242, true);
    drawPitch(ctx, FIELD.x, FIELD.y, FIELD.width, FIELD.height, true);

    const leftCellWidth = 250 / 16;
    const leftCellHeight = 242 / 16;
    const leftBall = {
      x: 24 + (REFERENCE.column + .5) * leftCellWidth,
      y: 68 + (REFERENCE.row + .5) * leftCellHeight,
    };
    ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(leftBall.x, leftBall.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.globalAlpha = .3;
    ctx.beginPath(); ctx.arc(reference.x, reference.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.globalAlpha = 1;
    drawSceneLabel(ctx, '参考坐标', reference.x - 24, reference.y - 28, MVL.blue);

    const cellWidth = FIELD.width / 16;
    const cellHeight = FIELD.height / 16;
    const column = Math.max(0, Math.min(15, position.column));
    const row = Math.max(0, Math.min(15, position.row));
    const predictionX = FIELD.x + column * cellWidth;
    const predictionY = FIELD.y + row * cellHeight;
    ctx.fillStyle = dragging ? 'rgba(39,68,110,.72)' : 'rgba(39,68,110,.54)';
    ctx.fillRect(predictionX, predictionY, cellWidth, cellHeight);
    ctx.strokeStyle = MVL.blue; ctx.lineWidth = 2.5; ctx.strokeRect(predictionX, predictionY, cellWidth, cellHeight);

    const errorAlpha = Math.min(.7, .12 + gridError * .08);
    ctx.fillStyle = `rgba(217,119,6,${errorAlpha})`;
    ctx.fillRect(FIELD.x + TRUTH.column * cellWidth, FIELD.y + TRUTH.row * cellHeight, cellWidth, cellHeight);
    ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink;
    ctx.beginPath(); ctx.arc(truth.x, truth.y, 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    drawArrow(ctx, reference.x, reference.y, prediction.x, prediction.y, MVL.blue);
    if (gridError > .35) drawArrow(ctx, prediction.x, prediction.y, truth.x, truth.y, MVL.orange, true);

    ctx.fillStyle = MVL.blue; roundRect(ctx, 326, 330, 220, 38, 7); ctx.fill();
    ctx.fillStyle = MVL.white; ctx.font = '700 11.5px "Segoe UI"'; ctx.textAlign = 'center';
    ctx.fillText('Motion：参考坐标 → 预测坐标', 436, 354);
    ctx.fillStyle = gridError < .35 ? MVL.green : MVL.orange; roundRect(ctx, 560, 330, 230, 38, 7); ctx.fill();
    ctx.fillStyle = MVL.white; ctx.fillText(`Residual：当前 − 预测 · ${residual}`, 675, 354); ctx.textAlign = 'left';
  }, [position.column, position.row, residual, dragging]);

  const positionFromPointer = (clientX: number, clientY: number) => {
    const canvas = ref.current;
    if (!canvas) return position;
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    const y = (clientY - rect.top) * (canvas.height / rect.height);
    return {
      column: Math.max(0, Math.min(15, Math.floor((x - FIELD.x) / (FIELD.width / 16)))),
      row: Math.max(0, Math.min(15, Math.floor((y - FIELD.y) / (FIELD.height / 16)))),
    };
  };

  const interruptAndSet = (next: typeof INITIAL) => {
    autoplay.pause();
    setPosition(next);
  };

  return (
    <div className="mvl-widget mvl-lab" ref={autoplay.hostRef}>
      <div className="mvl-canvas-instruction">蓝色块是从参考帧搬来的预测内容，白色圆点是当前真实位置。拖动蓝色块完成运动补偿。</div>
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas mvl-direct-canvas mvl-drag-canvas"
          width={820}
          height={390}
          role="application"
          tabIndex={0}
          aria-label={`运动补偿实验：预测块位于第 ${Math.round(position.column)} 列、第 ${Math.round(position.row)} 行，当前残差${residual}`}
          onPointerDown={(event) => {
            const next = positionFromPointer(event.clientX, event.clientY);
            if (Math.abs(next.column - position.column) > 1 || Math.abs(next.row - position.row) > 1) return;
            autoplay.pause(); setDragging(true); event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => { if (dragging) setPosition(positionFromPointer(event.clientX, event.clientY)); }}
          onPointerUp={(event) => {
            setDragging(false);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => setDragging(false)}
          onKeyDown={(event) => {
            const offsets: Record<string, [number, number]> = {
              ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
            };
            const offset = offsets[event.key]; if (!offset) return; event.preventDefault(); autoplay.pause();
            setPosition((current) => ({
              column: Math.max(0, Math.min(15, Math.round(current.column) + offset[0])),
              row: Math.max(0, Math.min(15, Math.round(current.row) + offset[1])),
            }));
          }}
        >拖动预测块改变运动向量；预测与真实画面的差异对应残差。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label="自动对齐过程"
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-lab-narration ${gridError < .35 ? 'good' : ''}`} aria-live="polite">
        <b>当前残差：{residual}</b>
        <span>{gridError < .35 ? '预测块与当前真实块重合，运动补偿已经解释这次位移。' : '蓝色 Motion 决定参考块被搬到哪里；橙色 Residual 保留搬运后仍未解释的差异。'}</span>
      </div>
      <div className="mvl-inline-actions">
        <button className="tiny" onClick={autoplay.replay}>演示对齐</button>
        <button className="tiny ghost" onClick={() => { autoplay.setProgress(0); interruptAndSet(INITIAL); }}>重置预测</button>
      </div>
    </div>
  );
};
