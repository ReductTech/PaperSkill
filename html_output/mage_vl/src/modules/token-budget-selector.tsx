import React, { useEffect, useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, RANKED_PATCHES, drawLabSurface } from './match-story';
import { LabPlayback, StageRail } from './lab-controls';
import { useAutoplayOnce } from './use-autoplay-once';
import {
  MVL,
  drawCommentator,
  drawHeatCells,
  drawPitch,
  drawSceneLabel,
  roundRect,
  useCanvasSurface,
} from './football-analogy';

const BUDGETS = [1024, 2048, 4096, 8192] as const;
const TOTAL = 64 * 16 * 16;
const representative = MATCH_BEATS[5];

function budgetFromPlayback(progress: number) {
  if (progress <= .72) return 1024 + (8192 - 1024) * (progress / .72);
  return 8192 + (4096 - 8192) * ((progress - .72) / .28);
}

export const TokenBudgetSelector: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(5600);
  const [budget, setBudget] = useState(1024);

  useEffect(() => {
    setBudget(Math.round(budgetFromPlayback(autoplay.progress) / 256) * 256);
  }, [autoplay.progress]);

  const ratio = budget / TOTAL;
  const selectedCount = Math.max(1, Math.round(RANKED_PATCHES.length * ratio));
  const selectedKeys = useMemo(
    () => new Set(RANKED_PATCHES.slice(0, selectedCount).map(({ column, row }) => `${column}:${row}`)),
    [selectedCount],
  );
  const nearestBudget = BUDGETS.reduce((best, value) => Math.abs(value - budget) < Math.abs(best - budget) ? value : best, BUDGETS[0]);
  const activeIndex = BUDGETS.indexOf(nearestBudget);

  const ref = useCanvasSurface(820, 420, (ctx) => {
    drawLabSurface(ctx, 820, 420);
    const pitch = { x: 26, y: 66, width: 540, height: 304 };
    drawSceneLabel(ctx, '当前画面局部 · 按 Importance S 排序', 28, 35, MVL.green);
    drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, true);
    drawHeatCells(ctx, representative.importance, pitch, '34,141,92', .42);
    drawCommentator(ctx, pitch.x + representative.runner.x * pitch.width, pitch.y + representative.runner.y * pitch.height, 'scan', .72);
    ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pitch.x + representative.ball.x * pitch.width, pitch.y + representative.ball.y * pitch.height, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    const cellWidth = pitch.width / 16;
    const cellHeight = pitch.height / 16;
    RANKED_PATCHES.forEach(({ column, row }) => {
      if (!selectedKeys.has(`${column}:${row}`)) return;
      ctx.fillStyle = 'rgba(34,141,92,.24)';
      ctx.fillRect(pitch.x + column * cellWidth, pitch.y + row * cellHeight, cellWidth, cellHeight);
      ctx.strokeStyle = 'rgba(34,141,92,.72)'; ctx.lineWidth = 1;
      ctx.strokeRect(pitch.x + column * cellWidth, pitch.y + row * cellHeight, cellWidth, cellHeight);
    });

    ctx.fillStyle = MVL.white; roundRect(ctx, 590, 66, 204, 304, 10); ctx.fill();
    ctx.strokeStyle = MVL.line; ctx.stroke();
    ctx.fillStyle = MVL.ink; ctx.font = '800 13px "Segoe UI"'; ctx.fillText('整段视频预算', 610, 94);
    ctx.fillStyle = MVL.muted; ctx.font = '12px "Segoe UI"';
    ctx.fillText('64 帧 × 16×16 token', 610, 117);
    ctx.fillText(`dense 总数 ${TOTAL.toLocaleString()}`, 610, 139);

    const meter = { x: 625, y: 170, width: 42, height: 150 };
    ctx.fillStyle = '#e8edf5'; roundRect(ctx, meter.x, meter.y, meter.width, meter.height, 7); ctx.fill();
    const selectedHeight = meter.height * ratio;
    ctx.fillStyle = budget === 4096 ? MVL.green : MVL.orange;
    roundRect(ctx, meter.x, meter.y + meter.height - selectedHeight, meter.width, selectedHeight, 7); ctx.fill();
    ctx.fillStyle = MVL.ink; ctx.font = '800 19px "Segoe UI"';
    ctx.fillText(budget.toLocaleString(), 686, 218);
    ctx.fillStyle = MVL.muted; ctx.font = '11px "Segoe UI"';
    ctx.fillText('送入视觉编码器', 686, 240);
    ctx.fillText(`保留 ${(ratio * 100).toFixed(2)}%`, 686, 264);
    ctx.fillText(`移除 ${(100 - ratio * 100).toFixed(2)}%`, 686, 285);
    drawSceneLabel(ctx, budget === 4096 ? '论文示例预算' : '调整预算', 650, 343, budget === 4096 ? MVL.green : MVL.orange);
  }, [budget, ratio, selectedKeys]);

  const chooseBudget = (value: number) => {
    autoplay.pause();
    setBudget(value);
  };

  return (
    <div className="mvl-widget mvl-lab" ref={autoplay.hostRef}>
      <StageRail
        labels={BUDGETS.map((value) => `B=${value.toLocaleString()}`)}
        active={activeIndex}
        onSelect={(index) => chooseBudget(BUDGETS[index])}
      />
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas"
          width={820}
          height={420}
          role="img"
          aria-label={`视觉 token 预算 ${budget.toLocaleString()}，占 dense token 的 ${(ratio * 100).toFixed(2)}%，高 Importance S patch 优先保留`}
        >调整预算后，patch 按 Importance S 从高到低进入 Top-k。</canvas>
      </div>
      <div className="mvl-budget-scrubber">
        <label htmlFor="mvl-budget-range"><span>视觉 token 预算 B</span><b>{budget.toLocaleString()}</b></label>
        <input
          id="mvl-budget-range"
          type="range"
          min="1024"
          max="8192"
          step="256"
          value={budget}
          onChange={(event) => chooseBudget(Number(event.target.value))}
        />
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label="预算变化过程"
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-lab-narration ${budget === 4096 ? 'good' : ''}`} aria-live="polite">
        <b>Top-k 保留率 {(ratio * 100).toFixed(2)}%</b>
        <span>绿色单元按 Importance S 依次进入预算；右侧数字对应整段视频的真实 token 预算。</span>
      </div>
    </div>
  );
};
