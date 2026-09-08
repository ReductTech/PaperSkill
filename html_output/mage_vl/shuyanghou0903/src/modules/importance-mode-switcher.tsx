import React from 'react';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, drawLabSurface, type SignalCell } from './match-story';
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

type ModeId = 'RGB' | 'motion' | 'residual' | 'S';

const MODES: Array<{ id: ModeId; label: string; text: string; color: string; rgb: string }> = [
  { id: 'RGB', label: 'RGB', color: MVL.muted, rgb: '92,102,122', text: 'RGB 只给出画面内容，还没有回答哪里在时间上更难预测。' },
  { id: 'motion', label: 'HEVC 运动', color: MVL.blue, rgb: '39,68,110', text: 'Motion Magnitude 描述编码块的预测位移强度，不提供目标类别。' },
  { id: 'residual', label: 'HEVC 残差', color: MVL.orange, rgb: '217,119,6', text: 'Residual Energy 标出运动补偿后仍未解释的局部差异。' },
  { id: 'S', label: 'HEVC 重要性 S', color: MVL.green, rgb: '34,141,92', text: 'HEVC 路线根据编码代价形成 Importance S，并在同一网格上为 patch 排序。' },
];

const representative = MATCH_BEATS[4];
const maps: Record<ModeId, SignalCell[]> = {
  RGB: [], motion: representative.motion, residual: representative.residual,
  S: representative.importance,
};

function drawPipelineNode(ctx: CanvasRenderingContext2D, x: number, y: number, label: string, active: boolean, color: string) {
  ctx.save();
  roundRect(ctx, x, y, 190, 44, 8);
  ctx.fillStyle = active ? `${color}18` : MVL.white;
  ctx.fill();
  ctx.strokeStyle = active ? color : MVL.line;
  ctx.lineWidth = active ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = active ? color : MVL.muted;
  ctx.font = `${active ? 800 : 650} 12px "Segoe UI"`;
  ctx.textAlign = 'center'; ctx.fillText(label, x + 95, y + 27); ctx.restore();
}

export const ImportanceModeSwitcher: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(6500);
  const scaled = autoplay.progress * (MODES.length - 1);
  const fromIndex = Math.min(MODES.length - 1, Math.floor(scaled));
  const toIndex = Math.min(MODES.length - 1, fromIndex + 1);
  const mix = scaled - fromIndex;
  const activeIndex = mix > .55 ? toIndex : fromIndex;
  const active = MODES[activeIndex];
  const route = active.id === 'RGB' ? 'baseline' : 'traditional';

  const ref = useCanvasSurface(820, 420, (ctx) => {
    drawLabSurface(ctx, 820, 420);
    const pitch = { x: 26, y: 64, width: 520, height: 300 };
    drawSceneLabel(ctx, '同一时刻 · 同一 16×16 spatial token 网格', 28, 34, MVL.blue);
    drawPitch(ctx, pitch.x, pitch.y, pitch.width, pitch.height, true);
    drawCommentator(ctx, pitch.x + representative.runner.x * pitch.width, pitch.y + representative.runner.y * pitch.height, 'scan', .7);
    ctx.fillStyle = MVL.white; ctx.strokeStyle = MVL.ink; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(pitch.x + representative.ball.x * pitch.width, pitch.y + representative.ball.y * pitch.height, 8, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();

    const from = MODES[fromIndex];
    const to = MODES[toIndex];
    if (maps[from.id].length) drawHeatCells(ctx, maps[from.id], pitch, from.rgb, 1 - mix);
    if (maps[to.id].length && toIndex !== fromIndex) drawHeatCells(ctx, maps[to.id], pitch, to.rgb, mix);

    if (active.id === 'motion') {
      const y = pitch.y + representative.ball.y * pitch.height;
      const x = pitch.x + representative.ball.x * pitch.width;
      ctx.strokeStyle = MVL.blue; ctx.lineWidth = 2.5; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(x - 62, y); ctx.lineTo(x - 10, y); ctx.stroke(); ctx.setLineDash([]);
    }

    drawSceneLabel(ctx, active.label, 410, 395, active.color);
    ctx.fillStyle = MVL.muted; ctx.font = '700 11px "Segoe UI"';
    ctx.fillText('信号强度', 574, 34);
    [3, 2, 1].forEach((level, index) => {
      ctx.fillStyle = `rgba(${active.rgb},${level === 3 ? .66 : level === 2 ? .4 : .18})`;
      ctx.fillRect(660 + index * 46, 22, 24, 16);
      ctx.fillStyle = MVL.muted; ctx.font = '10px "Segoe UI"';
      ctx.fillText(['高', '中', '低'][index], 687 + index * 46, 34);
    });

    ctx.fillStyle = 'rgba(255,255,255,.9)'; roundRect(ctx, 568, 64, 226, 300, 10); ctx.fill();
    ctx.strokeStyle = MVL.line; ctx.stroke();
    ctx.fillStyle = MVL.ink; ctx.font = '800 13px "Segoe UI"'; ctx.fillText('HEVC → Importance S', 586, 91);
    drawPipelineNode(ctx, 586, 122, 'Motion / Residual', route === 'traditional' && active.id !== 'S', MVL.blue);
    drawPipelineNode(ctx, 586, 204, 'Coding Cost', active.id === 'S', MVL.orange);
    drawPipelineNode(ctx, 586, 286, 'Importance S', active.id === 'S', MVL.green);
    ctx.strokeStyle = MVL.line; ctx.lineWidth = 1.5;
    [[166, 204], [248, 286]].forEach(([fromY, toY]) => {
      ctx.beginPath(); ctx.moveTo(681, fromY); ctx.lineTo(681, toY); ctx.stroke();
    });
  }, [fromIndex, toIndex, mix, activeIndex, route]);

  return (
    <div className="mvl-widget mvl-lab" ref={autoplay.hostRef}>
      <div className="mvl-codec-routes" aria-label="HEVC 重要性路线">
        <div className={route === 'traditional' ? 'active traditional' : 'traditional'}>
          <span>从变化信号到 patch 排序</span><strong>Motion / Residual → Coding Cost → Importance S</strong>
        </div>
      </div>
      <StageRail
        labels={MODES.map((mode) => mode.label)}
        active={activeIndex}
        onSelect={(index) => autoplay.setProgress(index / (MODES.length - 1))}
      />
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas"
          width={820}
          height={420}
          role="img"
          aria-label={`${active.label}：同一空间网格上的信号强度与 Importance S 路线`}
        >同一画面在 RGB、HEVC 运动、HEVC 残差与 HEVC 重要性 S 下的连续对比。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label={`信号流水线 · ${active.label}`}
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className="mvl-lab-narration" aria-live="polite"><b>{active.label}</b><span>{active.text}</span></div>
    </div>
  );
};
