import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { drawLabSurface } from './match-story';
import { LabPlayback } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import { MVL, drawSceneLabel, roundRect, useCanvasSurface } from './football-analogy';

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const lerp = (from: number, to: number, progress: number) => from + (to - from) * progress;

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 7 * Math.cos(angle - Math.PI / 6), toY - 7 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 7 * Math.cos(angle + Math.PI / 6), toY - 7 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawEncoder(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  roundRect(ctx, x, y, 210, 38, 7);
  ctx.fillStyle = `${color}14`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = '800 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Expensive Vision Encoder', x + 105, y + 24);
  ctx.textAlign = 'left';
}

export const MatchedBudgetExplorer: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(10800);
  const [n, setN] = useState(8);
  const [showWhy, setShowWhy] = useState(false);
  const raw = 8 * n;
  const reveal = clamp01(autoplay.progress / .32);
  const pack = clamp01((autoplay.progress - .34) / .42);
  const balance = clamp01((autoplay.progress - .74) / .2);

  const ref = useCanvasSurface(820, 510, (ctx) => {
    drawLabSurface(ctx, 820, 510);

    drawSceneLabel(ctx, `同一段视频 · ${raw} 个 source frames`, 28, 28, MVL.blue);
    ctx.strokeStyle = MVL.line;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(54, 64);
    ctx.lineTo(766, 64);
    ctx.stroke();
    const timelineSlots = 64;
    const revealedSlots = Math.max(1, Math.floor(timelineSlots * reveal));
    for (let index = 0; index < timelineSlots; index += 1) {
      const x = 54 + index * (712 / (timelineSlots - 1));
      ctx.fillStyle = index < revealedSlots ? '#91a2ba' : MVL.line;
      ctx.beginPath();
      ctx.arc(x, 64, index % 8 === 0 ? 3.2 : 2.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('时间开始', 40, 84);
    ctx.textAlign = 'right';
    ctx.fillText('时间结束', 780, 84);
    ctx.textAlign = 'left';

    const panels = [
      { x: 24, color: MVL.red, title: `Frame-${n}：完整看 ${n} 个时间点` },
      { x: 420, color: MVL.green, title: `tc-${n}：稀疏看 ${raw} 个时间点` },
    ];
    panels.forEach((panel) => {
      roundRect(ctx, panel.x, 100, 376, 276, 10);
      ctx.fillStyle = 'rgba(255,255,255,.88)';
      ctx.fill();
      ctx.strokeStyle = `${panel.color}55`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = panel.color;
      ctx.font = '900 14px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(panel.title, panel.x + 18, 126);
    });

    // Frame-N: choose N sparse time locations and encode complete RGB frames.
    const leftStart = 48;
    const routeWidth = 328;
    ctx.strokeStyle = MVL.line;
    ctx.beginPath(); ctx.moveTo(leftStart, 152); ctx.lineTo(leftStart + routeWidth, 152); ctx.stroke();
    const visibleFrameCount = Math.min(n, 16);
    for (let index = 0; index < visibleFrameCount; index += 1) {
      const x = leftStart + index * (routeWidth / Math.max(1, visibleFrameCount - 1));
      ctx.fillStyle = index / visibleFrameCount <= reveal ? MVL.red : MVL.line;
      ctx.beginPath(); ctx.arc(x, 152, 4.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${n} 个均匀采样位置`, 48, 174);
    drawArrow(ctx, 212, 180, 212, 202, MVL.red);

    const visibleFullFrames = Math.min(n, 8);
    for (let index = 0; index < visibleFullFrames; index += 1) {
      const x = 48 + index * 39;
      roundRect(ctx, x, 208, 30, 42, 3);
      ctx.fillStyle = 'rgba(196,63,82,.12)';
      ctx.fill();
      ctx.strokeStyle = MVL.red;
      ctx.setLineDash([4, 3]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(196,63,82,.24)';
      ctx.beginPath(); ctx.moveTo(x + 15, 211); ctx.lineTo(x + 15, 247); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 3, 229); ctx.lineTo(x + 27, 229); ctx.stroke();
    }
    ctx.fillStyle = MVL.ink;
    ctx.font = '800 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${n} 张完整 RGB 帧`, 48, 270);
    drawArrow(ctx, 212, 277, 212, 293, MVL.red);
    drawEncoder(ctx, 107, 297, MVL.red);
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('时间覆盖较稀 · 每个采样帧完整编码', 212, 358);
    ctx.textAlign = 'left';

    // tc-N: inspect denser source positions, select patch cells, then pack them into N canvases.
    const rightStart = 444;
    ctx.strokeStyle = MVL.line;
    ctx.beginPath(); ctx.moveTo(rightStart, 152); ctx.lineTo(rightStart + routeWidth, 152); ctx.stroke();
    for (let index = 0; index < 32; index += 1) {
      const x = rightStart + index * (routeWidth / 31);
      ctx.fillStyle = index / 32 <= reveal ? MVL.green : MVL.line;
      ctx.beginPath(); ctx.arc(x, 152, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = MVL.muted;
    ctx.fillText(`${raw} 个密集 source positions`, 444, 174);

    const patchSources: Array<{ x: number; y: number; targetX: number; targetY: number }> = [];
    for (let row = 0; row < 4; row += 1) {
      const y = 190 + row * 18;
      ctx.fillStyle = MVL.muted;
      ctx.font = '700 10px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(`t${row + 1}`, 444, y + 9);
      for (let column = 0; column < 12; column += 1) {
        const x = 466 + column * 14;
        const selected = column === (row * 3 + 2) % 12 || column === (row * 3 + 3) % 12;
        ctx.fillStyle = selected ? 'rgba(34,141,92,.18)' : '#e4e9f0';
        ctx.fillRect(x, y, 10, 10);
        if (selected) {
          ctx.strokeStyle = MVL.green;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, 10, 10);
          const targetIndex = patchSources.length;
          patchSources.push({
            x: x + 5,
            y: y + 5,
            targetX: 459 + (targetIndex % 8) * 39,
            targetY: 277,
          });
        }
      }
    }
    ctx.fillStyle = MVL.green;
    ctx.font = '800 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('Codec 信号选择重要 patch', 634, 210);
    drawArrow(ctx, 678, 219, 678, 250, MVL.green);

    const canvasCount = Math.min(n, 8);
    for (let index = 0; index < canvasCount; index += 1) {
      const x = 444 + index * 39;
      roundRect(ctx, x, 262, 30, 30, 3);
      ctx.fillStyle = 'rgba(34,141,92,.10)';
      ctx.fill();
      ctx.strokeStyle = MVL.green;
      ctx.lineWidth = 1.3;
      ctx.stroke();
    }
    patchSources.forEach((patch, index) => {
      const stagger = clamp01(pack * 1.4 - index * .045);
      const x = lerp(patch.x, patch.targetX, stagger);
      const y = lerp(patch.y, patch.targetY, stagger);
      ctx.fillStyle = MVL.green;
      ctx.fillRect(x - 3, y - 3, 6, 6);
    });
    ctx.fillStyle = MVL.ink;
    ctx.font = '800 12.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(`重要 patch 打包为 ${n} 个 codec canvases`, 444, 310);
    drawArrow(ctx, 608, 315, 608, 322, MVL.green);
    drawEncoder(ctx, 503, 322, MVL.green);
    ctx.fillStyle = MVL.muted;
    ctx.font = '700 11.5px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('时间覆盖更密 · 每个时间点只为重要区域付 token', 608, 370);

    // The core comparison: equal nominal workload at the expensive visual stage.
    ctx.fillStyle = MVL.ink;
    ctx.font = '900 14px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('送进 Vision Encoder 的名义视觉预算', 410, 407);
    ctx.fillStyle = '#e8edf4';
    roundRect(ctx, 80, 428, 250, 22, 5); ctx.fill();
    roundRect(ctx, 490, 428, 250, 22, 5); ctx.fill();
    ctx.save();
    ctx.globalAlpha = .25 + balance * .75;
    ctx.fillStyle = MVL.red; roundRect(ctx, 80, 428, 250, 22, 5); ctx.fill();
    ctx.fillStyle = MVL.green; roundRect(ctx, 490, 428, 250, 22, 5); ctx.fill();
    ctx.restore();
    ctx.fillStyle = MVL.blue;
    ctx.font = '900 20px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('≈', 410, 445);
    ctx.fillStyle = MVL.muted;
    ctx.font = '800 12px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText(`${n} full-frame units`, 205, 470);
    ctx.fillText(`${n} codec-canvas units`, 615, 470);
    ctx.fillStyle = MVL.blue;
    ctx.font = '900 13px "Segoe UI", "Microsoft YaHei", sans-serif';
    ctx.fillText('Nominal Visual Budget ≈ Same', 410, 494);
    ctx.textAlign = 'left';
  }, [n, reveal, pack, balance]);

  const chooseN = (value: number) => {
    autoplay.pause();
    autoplay.setProgress(1);
    setN(value);
  };

  return (
    <div className="mvl-widget mvl-lab mvl-budget-lab" ref={autoplay.hostRef}>
      <div className="mvl-split-controls">
        <div className="chip-row" role="radiogroup" aria-label="名义视觉容量 N">
          {[8, 16, 32].map((value) => (
            <button
              role="radio"
              aria-checked={n === value}
              key={value}
              className={`chip ${n === value ? 'selected' : ''}`}
              onClick={() => chooseN(value)}
            >N={value}</button>
          ))}
        </div>
        <button className="tiny ghost" aria-expanded={showWhy} onClick={() => setShowWhy((value) => !value)}>
          {showWhy ? '收起说明' : '为什么公平？'}
        </button>
      </div>

      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas"
          width={820}
          height={510}
          role="img"
          aria-label={`同一段视频中，Frame-${n} 均匀采样 ${n} 张完整 RGB 帧；tc-${n} 从 ${raw} 个 source frames 中选择重要 patch 并打包为 ${n} 个 codec canvases。两者送入 Vision Encoder 的名义视觉预算相近。`}
        >Frame-N 完整编码少量时间点；tc-N 稀疏编码更多时间点；两者对齐送入 Vision Encoder 的名义视觉预算。</canvas>
      </div>

      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label="同预算分配过程"
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />

      <div className="mvl-protocol-table" role="table" aria-label="matched-budget 数量对照">
        <div role="row"><b role="rowheader">Frame-{n}</b><span>{n} 个均匀采样时间点</span><span>{n} 张完整 RGB 帧</span></div>
        <div role="row"><b role="rowheader">tc-{n}</b><span>{raw} 个 source frames</span><span>{n} 个 codec canvases</span></div>
      </div>

      {showWhy && (
        <div className="mvl-budget-explainer" aria-live="polite">
          <strong>公平比较控制的是昂贵视觉编码阶段。</strong>
          <div>
            <p><b>Frame-{n}</b><span>{n} 张采样帧 → 全部 dense patches → Vision Encoder</span></p>
            <p><b>tc-{n}</b><span>{raw} 个 source frames → Codec 低成本筛选 → {n} 个 canvases → Vision Encoder</span></p>
          </div>
          <p>tc-{n} 前端接触更多 source frames，但并没有让 ViT 对它们全部做 dense encoding。</p>
        </div>
      )}

      <div className="mvl-budget-checks">
        <div><b>① 公平性</b><span>先控制 nominal visual budget。</span></div>
        <div><b>② 真实性</b><span>再到 §10 实测准确率与 wall-clock。</span></div>
      </div>

      <div className="feedback good" aria-live="polite">
        Frame-{n} 是“少看时间点，但每次看完整”；tc-{n} 是“多看时间点，但每次只看变化”。
      </div>
    </div>
  );
};
