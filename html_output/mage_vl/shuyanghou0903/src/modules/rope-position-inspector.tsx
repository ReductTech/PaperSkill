import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { drawLabSurface } from './match-story';
import { LabPlayback } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import { MVL, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

const PATCHES = [
  { id: 'p1', t: 3, x: 2, y: 9 }, { id: 'p2', t: 7, x: 12, y: 5 },
  { id: 'p3', t: 12, x: 9, y: 4 }, { id: 'p4', t: 18, x: 4, y: 11 },
  { id: 'p5', t: 25, x: 13, y: 8 }, { id: 'p6', t: 31, x: 7, y: 3 },
  { id: 'p7', t: 42, x: 10, y: 12 }, { id: 'p8', t: 58, x: 5, y: 7 },
];

const TIME_ORDER = [...PATCHES].sort((a, b) => a.t - b.t);
const GRID = 16;
const TIME_MAX = 64;
const CELL = 6.2;
const TIME_STEP = 2.65;
const ORIGIN_X = 250;
const ORIGIN_Y = 250;

type Point = { x: number; y: number };

function iso(x: number, y: number, t: number): Point {
  return {
    x: ORIGIN_X + (x - y) * CELL,
    y: ORIGIN_Y + (x + y) * CELL * .5 - t * TIME_STEP,
  };
}

function path(ctx: CanvasRenderingContext2D, points: Point[], fill?: string, stroke?: string, width = 1) {
  ctx.beginPath();
  points.forEach((point, index) => index ? ctx.lineTo(point.x, point.y) : ctx.moveTo(point.x, point.y));
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = width; ctx.stroke(); }
}

function line(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, width = 1, dashed = false) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  if (dashed) ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function planeCorners(t: number) {
  return [iso(0, 0, t), iso(GRID, 0, t), iso(GRID, GRID, t), iso(0, GRID, t)];
}

function tokenCardPosition(rank: number) {
  const column = rank % 2;
  const row = Math.floor(rank / 2);
  return { x: 500 + column * 142, y: 60 + row * 55, width: 132, height: 45 };
}

function easeInOut(value: number) {
  return value < .5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

export const RopePositionInspector: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(7600);
  const [id, setId] = useState('p3');
  const [mode, setMode] = useState<'correct' | 'wrong'>('correct');
  const selected = PATCHES.find((patch) => patch.id === id)!;
  const timeRank = TIME_ORDER.findIndex((patch) => patch.id === id);
  const previous = timeRank > 0 ? TIME_ORDER[timeRank - 1] : undefined;
  const wrong = mode === 'wrong';
  const accent = wrong ? MVL.orange : MVL.green;
  const transfer = easeInOut(Math.max(0, Math.min(1, (autoplay.progress - .23) / .5)));
  const phaseLabel = autoplay.progress < .23 ? '在原视频中定位' : autoplay.progress < .73 ? '将稀疏 token 打包' : '核对原始距离';

  const ref = useCanvasSurface(820, 430, (ctx) => {
    drawLabSurface(ctx, 820, 430);

    drawSceneLabel(ctx, '原始 3D 时空体（t × x × y）', 34, 28, MVL.purple);
    drawSceneLabel(ctx, wrong ? '错误：用紧凑序号替代坐标' : '稀疏 Canvas：token 仍携带原坐标', 500, 28, wrong ? MVL.orange : MVL.green);

    const base = planeCorners(0);
    const top = planeCorners(TIME_MAX);
    path(ctx, [base[0], base[1], top[1], top[0]], 'rgba(39,68,110,.025)', 'rgba(39,68,110,.13)');
    path(ctx, [base[0], base[3], top[3], top[0]], 'rgba(124,58,237,.025)', 'rgba(39,68,110,.13)');
    path(ctx, base, 'rgba(255,255,255,.78)', 'rgba(39,68,110,.28)', 1.2);
    path(ctx, top, 'rgba(124,58,237,.045)', 'rgba(124,58,237,.24)', 1.2);

    // 地面网格展示 x/y；半透明时间切片展示 t，不再把三维关系压成两张平面图。
    for (let index = 0; index <= GRID; index += 2) {
      line(ctx, iso(index, 0, 0), iso(index, GRID, 0), 'rgba(39,68,110,.10)', .7);
      line(ctx, iso(0, index, 0), iso(GRID, index, 0), 'rgba(39,68,110,.10)', .7);
    }
    if (previous) path(ctx, planeCorners(previous.t), 'rgba(39,68,110,.018)', 'rgba(39,68,110,.13)', .8);
    path(ctx, planeCorners(selected.t), 'rgba(124,58,237,.055)', 'rgba(124,58,237,.28)', 1.2);

    const axisOrigin = iso(0, 0, 0);
    const timeEnd = iso(0, 0, TIME_MAX);
    const xEnd = iso(GRID + 1.6, 0, 0);
    const yEnd = iso(0, GRID + 1.6, 0);
    line(ctx, axisOrigin, timeEnd, MVL.blue, 1.8);
    line(ctx, axisOrigin, xEnd, MVL.blue, 1.8);
    line(ctx, axisOrigin, yEnd, MVL.blue, 1.8);
    ctx.fillStyle = MVL.ink;
    ctx.font = '800 13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('t', timeEnd.x - 4, timeEnd.y - 8);
    ctx.fillText('x', xEnd.x + 5, xEnd.y + 5);
    ctx.fillText('y', yEnd.x - 11, yEnd.y + 5);

    TIME_ORDER.forEach((patch) => {
      const point = iso(patch.x + .5, patch.y + .5, patch.t);
      const isSelected = patch.id === selected.id;
      ctx.fillStyle = isSelected ? MVL.purple : 'rgba(124,58,237,.38)';
      ctx.beginPath();
      ctx.arc(point.x, point.y, isSelected ? 6 : 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (isSelected) {
        ctx.strokeStyle = 'rgba(124,58,237,.18)';
        ctx.lineWidth = 7;
        ctx.stroke();
      }
    });

    const source = iso(selected.x + .5, selected.y + .5, selected.t);
    const floor = iso(selected.x + .5, selected.y + .5, 0);
    const timeAxis = iso(0, 0, selected.t);
    const xAxis = iso(selected.x + .5, 0, 0);
    const yAxis = iso(0, selected.y + .5, 0);
    line(ctx, source, floor, 'rgba(124,58,237,.55)', 1.2, true);
    line(ctx, source, timeAxis, 'rgba(124,58,237,.45)', 1.1, true);
    line(ctx, floor, xAxis, 'rgba(39,68,110,.36)', 1, true);
    line(ctx, floor, yAxis, 'rgba(34,141,92,.45)', 1, true);

    const selectedCell = [
      iso(selected.x, selected.y, selected.t), iso(selected.x + 1, selected.y, selected.t),
      iso(selected.x + 1, selected.y + 1, selected.t), iso(selected.x, selected.y + 1, selected.t),
    ];
    path(ctx, selectedCell, 'rgba(124,58,237,.24)', MVL.purple, 2);
    drawSceneLabel(ctx, `${selected.id} · (${selected.t}, ${selected.x}, ${selected.y})`, Math.max(116, source.x - 46), Math.min(350, source.y + 18), MVL.purple);

    const selectedCard = tokenCardPosition(timeRank);
    const target = { x: selectedCard.x + 17, y: selectedCard.y + 16 };
    const control = { x: 422, y: 68 };
    const oneMinus = 1 - transfer;
    const moving = {
      x: oneMinus * oneMinus * source.x + 2 * oneMinus * transfer * control.x + transfer * transfer * target.x,
      y: oneMinus * oneMinus * source.y + 2 * oneMinus * transfer * control.y + transfer * transfer * target.y,
    };
    line(ctx, source, target, accent, 1.25, true);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(moving.x, moving.y, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = MVL.white;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('Top-k 后重新存放', 420, 195);
    ctx.fillStyle = accent;
    ctx.font = '800 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(wrong ? '只剩新序号' : '原坐标随 token 移动', 420, 212);
    ctx.textAlign = 'left';

    TIME_ORDER.forEach((patch, rank) => {
      const card = tokenCardPosition(rank);
      const isSelected = patch.id === selected.id;
      roundRect(ctx, card.x, card.y, card.width, card.height, 8);
      ctx.fillStyle = isSelected ? (wrong ? 'rgba(217,119,6,.12)' : 'rgba(34,141,92,.11)') : MVL.white;
      ctx.fill();
      ctx.strokeStyle = isSelected ? accent : MVL.line;
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.stroke();
      ctx.fillStyle = isSelected ? accent : MVL.purple;
      ctx.beginPath();
      ctx.arc(card.x + 17, card.y + 16, isSelected ? 5.5 : 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = MVL.ink;
      ctx.font = '800 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(patch.id, card.x + 29, card.y + 18);
      ctx.fillStyle = isSelected ? accent : MVL.muted;
      ctx.font = '700 10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(wrong ? `新序号 #${rank + 1}` : `(${patch.t}, ${patch.x}, ${patch.y})`, card.x + 29, card.y + 34);
    });

    const band = { x: 38, y: 374, width: 744, height: 42 };
    roundRect(ctx, band.x, band.y, band.width, band.height, 8);
    ctx.fillStyle = wrong ? 'rgba(217,119,6,.08)' : 'rgba(34,141,92,.08)';
    ctx.fill();
    ctx.fillStyle = MVL.ink;
    ctx.font = '800 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(previous ? `${previous.id} → ${selected.id}` : selected.id, band.x + 14, band.y + 17);
    if (previous) {
      const realDelta = selected.t - previous.t;
      ctx.fillStyle = wrong ? MVL.muted : MVL.green;
      ctx.fillText(`原始时间：t=${previous.t} → t=${selected.t}，Δt=${realDelta}`, band.x + 106, band.y + 17);
      ctx.fillStyle = wrong ? MVL.orange : MVL.muted;
      ctx.fillText(`打包序号：#${timeRank} → #${timeRank + 1}，Δ=1`, band.x + 420, band.y + 17);
      ctx.fillStyle = accent;
      ctx.font = '700 10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(wrong ? '错误地把真实间隔压成相邻位置' : 'Shared 3D RoPE 继续使用原始三维距离', band.x + 106, band.y + 33);
    } else {
      ctx.fillStyle = MVL.muted;
      ctx.fillText('选择 p2–p8，可比较它与前一个 token 的真实时间间隔。', band.x + 106, band.y + 24);
    }
  }, [id, mode, autoplay.progress]);

  const chooseToken = (nextId: string) => {
    autoplay.pause();
    autoplay.setProgress(1);
    setId(nextId);
  };

  const chooseMode = (nextMode: 'correct' | 'wrong') => {
    autoplay.pause();
    autoplay.setProgress(1);
    setMode(nextMode);
  };

  return (
    <div className="mvl-widget mvl-lab mvl-rope-lab" ref={autoplay.hostRef}>
      <div className="mvl-rope-toolbar">
        <div className="mvl-rope-control-group">
          <span className="mvl-control-label">坐标策略</span>
          <div className="mvl-position-mode" role="group" aria-label="位置编码对比模式">
            <button className={!wrong ? 'active' : ''} aria-pressed={!wrong} onClick={() => chooseMode('correct')}>Shared 3D RoPE：保留原坐标</button>
            <button className={wrong ? 'active wrong' : ''} aria-pressed={wrong} onClick={() => chooseMode('wrong')}>错误对照：重新编号</button>
          </div>
        </div>
        <div className="mvl-rope-control-group">
          <span className="mvl-control-label">跟踪一个 token</span>
          <div className="mvl-rope-token-row" role="group" aria-label="选择稀疏 token">
            {TIME_ORDER.map((patch) => (
              <button key={patch.id} className={patch.id === id ? 'selected' : ''} aria-pressed={patch.id === id} onClick={() => chooseToken(patch.id)}>{patch.id}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas mvl-direct-canvas mvl-rope-canvas"
          width={820}
          height={430}
          role="application"
          aria-label={`${selected.id} 位于三维原始坐标 t=${selected.t}、x=${selected.x}、y=${selected.y}；${wrong ? '错误重编号会压缩真实时间距离' : 'Shared 3D RoPE 在稀疏打包后继续保留原坐标'}`}
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const current = TIME_ORDER.findIndex((patch) => patch.id === id);
            const next = TIME_ORDER[(current + (event.key === 'ArrowRight' ? 1 : -1) + TIME_ORDER.length) % TIME_ORDER.length];
            chooseToken(next.id);
          }}
        >稀疏 token 从原始三维视频坐标进入紧凑 Canvas；Shared 3D RoPE 保留原始 (t,x,y)，重新编号会错误压缩真实时间距离。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label={`空间折叠 · ${phaseLabel}`}
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-lab-narration ${wrong ? 'warn' : 'good'}`} aria-live="polite">
        <b>{wrong ? '错误重编号会压缩真实时间距离。' : '重新打包，不重新定位。'}</b>
        <span>{wrong ? (previous ? `${previous.id} 到 ${selected.id} 的真实 Δt=${selected.t - previous.t}，不能改写成相邻序号 Δ=1。` : '按打包顺序重编号会丢失原始时间距离。') : `${selected.id} 在紧凑序列中仍携带 (${selected.t}, ${selected.x}, ${selected.y})。`}</span>
      </div>
    </div>
  );
};
