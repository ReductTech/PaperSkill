import React from 'react';
import type { WidgetProps } from './registry';
import { MATCH_BEATS, drawLabSurface } from './match-story';
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

const REFERENCE = MATCH_BEATS[0];
const CURRENT = MATCH_BEATS[3];
const PANELS = [
  { x: 24, label: '① 已解码参考帧' },
  { x: 292, label: '② 当前 P 帧' },
  { x: 560, label: '③ 预测与残差' },
] as const;
const PANEL_WIDTH = 236;
const PITCH_Y = 72;
const PITCH_HEIGHT = 166;

const STAGES = [
  {
    label: '输入两帧',
    title: '先拿到当前块和参考帧',
    text: '当前 P 帧不直接保存整张新画面；编码器先尝试用已经解码的参考帧预测它。',
  },
  {
    label: '寻找预测来源',
    title: '在参考帧中寻找相似块',
    text: '编码器比较局部块内容，选出最能预测当前块的参考位置。它匹配的是像素内容，不是在识别足球。',
  },
  {
    label: '得到 Motion',
    title: '参考位置到预测位置的位移，就是 Motion Vector',
    text: 'Motion Vector 记录块级预测位移；运动补偿按照这个位移，把参考内容搬到当前帧坐标。',
  },
  {
    label: '得到 Residual',
    title: '当前真实块减去运动补偿预测，得到 Residual',
    text: 'Residual 只保留预测没有解释掉的差异；预测越贴近真实画面，残差通常越小。',
  },
  {
    label: 'Mage-VL 复用信号',
    title: 'Mage-VL 直接复用 HEVC 已经算好的侧信息',
    text: 'HEVC 为压缩已经估计了运动强度与残差能量；Mage-VL 读取 |MV| 和 E_res 形成 patch importance S，不再额外做一遍运动检测。',
  },
] as const;

function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number, alpha = 1, color = MVL.ink) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = MVL.white;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawArrow(ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number, color: string) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 9 * Math.cos(angle - Math.PI / 6), toY - 9 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - 9 * Math.cos(angle + Math.PI / 6), toY - 9 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPatchCell(
  ctx: CanvasRenderingContext2D,
  panelX: number,
  column: number,
  row: number,
  color: string,
  alpha: number,
  width = 2,
) {
  const cellWidth = PANEL_WIDTH / 16;
  const cellHeight = PITCH_HEIGHT / 16;
  ctx.save();
  ctx.fillStyle = `${color}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  ctx.fillRect(panelX + column * cellWidth, PITCH_Y + row * cellHeight, cellWidth, cellHeight);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.strokeRect(panelX + column * cellWidth, PITCH_Y + row * cellHeight, cellWidth, cellHeight);
  ctx.restore();
}

function drawFlowNode(ctx: CanvasRenderingContext2D, x: number, label: string, active: boolean, color: string) {
  roundRect(ctx, x, 302, 174, 42, 7);
  ctx.fillStyle = active ? `${color}18` : MVL.white;
  ctx.fill();
  ctx.strokeStyle = active ? color : MVL.line;
  ctx.lineWidth = active ? 2 : 1;
  ctx.stroke();
  ctx.fillStyle = active ? color : MVL.muted;
  ctx.font = `${active ? 800 : 700} 12px "Segoe UI", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(label, x + 87, 328);
  ctx.textAlign = 'left';
}

export const CodecSignalInspector: React.FC<WidgetProps> = () => {
  const autoplay = useAutoplayOnce(11500);
  const stage = Math.min(STAGES.length - 1, Math.floor(autoplay.progress * STAGES.length));
  const currentStage = STAGES[stage];

  const ref = useCanvasSurface(820, 380, (ctx) => {
    drawLabSurface(ctx, 820, 380);
    drawSceneLabel(ctx, '同一局部块的预测过程', 24, 28, MVL.blue);
    const sourceLabel = stage < 3 ? 'Motion 来源' : stage === 3 ? 'Residual 来源' : 'Mage-VL 复用信号';
    const sourceColor = stage < 3 ? MVL.blue : stage === 3 ? MVL.orange : MVL.green;
    drawSceneLabel(ctx, sourceLabel, stage === 4 ? 658 : 694, 28, sourceColor);

    PANELS.forEach(({ x, label }, index) => {
      const panelLabel = index === 2 && stage === 4 ? '⑤ Mage-VL 读取侧信息' : label;
      drawSceneLabel(ctx, panelLabel, x + 8, 57, index === 2 && stage === 3 ? MVL.orange : index === 2 && stage === 4 ? MVL.green : MVL.blue);
      if (index === 2 && stage === 4) {
        roundRect(ctx, x, PITCH_Y, PANEL_WIDTH, PITCH_HEIGHT, 8);
        ctx.fillStyle = 'rgba(255,255,255,.92)';
        ctx.fill();
        ctx.strokeStyle = MVL.line;
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }
      drawPitch(ctx, x, PITCH_Y, PANEL_WIDTH, PITCH_HEIGHT, true);
    });

    const refPoint = {
      x: PANELS[0].x + REFERENCE.ball.x * PANEL_WIDTH,
      y: PITCH_Y + REFERENCE.ball.y * PITCH_HEIGHT,
    };
    const currentPoint = {
      x: PANELS[1].x + CURRENT.ball.x * PANEL_WIDTH,
      y: PITCH_Y + CURRENT.ball.y * PITCH_HEIGHT,
    };
    const currentColumn = Math.floor(CURRENT.ball.x * 16);
    const currentRow = Math.floor(CURRENT.ball.y * 16);
    const referenceColumn = Math.floor(REFERENCE.ball.x * 16);
    const referenceRow = Math.floor(REFERENCE.ball.y * 16);
    const predictedColumn = Math.max(0, currentColumn - 1);
    const predictedRow = currentRow;

    drawCommentator(ctx, PANELS[0].x + REFERENCE.runner.x * PANEL_WIDTH, PITCH_Y + REFERENCE.runner.y * PITCH_HEIGHT, 'scan', .54);
    drawCommentator(ctx, PANELS[1].x + CURRENT.runner.x * PANEL_WIDTH, PITCH_Y + CURRENT.runner.y * PITCH_HEIGHT, 'scan', .54);
    if (stage < 4) drawCommentator(ctx, PANELS[2].x + CURRENT.runner.x * PANEL_WIDTH, PITCH_Y + CURRENT.runner.y * PITCH_HEIGHT, 'scan', .54);
    drawBall(ctx, refPoint.x, refPoint.y);
    drawBall(ctx, currentPoint.x, currentPoint.y, 1, MVL.green);

    // Stage 1: show that motion estimation searches candidate blocks in the reference frame.
    if (stage >= 1) {
      [[referenceColumn - 1, referenceRow], [referenceColumn, referenceRow - 1], [referenceColumn + 1, referenceRow]].forEach(([column, row]) => {
        drawPatchCell(ctx, PANELS[0].x, column, row, MVL.blue, .08, 1);
      });
      drawPatchCell(ctx, PANELS[0].x, referenceColumn, referenceRow, MVL.blue, .25, 2.4);
      drawPatchCell(ctx, PANELS[1].x, currentColumn, currentRow, MVL.green, .20, 2.2);
      drawSceneLabel(ctx, '匹配到的参考块', PANELS[0].x + 88, 254, MVL.blue);
      drawSceneLabel(ctx, '待预测的当前块', PANELS[1].x + 86, 254, MVL.green);
    }

    // Stage 2: express the selected reference-to-current displacement in one shared coordinate system.
    const motionFrom = {
      x: PANELS[1].x + (referenceColumn + .5) * (PANEL_WIDTH / 16),
      y: PITCH_Y + (referenceRow + .5) * (PITCH_HEIGHT / 16),
    };
    const motionTo = {
      x: PANELS[1].x + (predictedColumn + .5) * (PANEL_WIDTH / 16),
      y: PITCH_Y + (predictedRow + .5) * (PITCH_HEIGHT / 16),
    };
    if (stage >= 2 && stage < 4) {
      drawPatchCell(ctx, PANELS[1].x, referenceColumn, referenceRow, MVL.blue, .08, 1.4);
      drawPatchCell(ctx, PANELS[1].x, predictedColumn, predictedRow, MVL.blue, .28, 2.3);
      drawArrow(ctx, motionFrom.x, motionFrom.y, motionTo.x, motionTo.y, MVL.blue);
      drawSceneLabel(ctx, 'Motion Vector', Math.min(PANELS[1].x + 142, motionFrom.x + 24), PITCH_Y + 28, MVL.blue);
    }

    // The third panel contains the motion-compensated prediction and its difference from the truth.
    const predictedPoint = {
      x: PANELS[2].x + (predictedColumn + .5) * (PANEL_WIDTH / 16),
      y: PITCH_Y + (predictedRow + .5) * (PITCH_HEIGHT / 16),
    };
    const truthPoint = {
      x: PANELS[2].x + (currentColumn + .5) * (PANEL_WIDTH / 16),
      y: PITCH_Y + (currentRow + .5) * (PITCH_HEIGHT / 16),
    };
    if (stage >= 2 && stage < 4) {
      drawPatchCell(ctx, PANELS[2].x, predictedColumn, predictedRow, MVL.blue, .24, 2.1);
      drawBall(ctx, predictedPoint.x, predictedPoint.y, .72, MVL.blue);
    }
    if (stage === 3) {
      drawHeatCells(ctx, CURRENT.residual, { x: PANELS[2].x, y: PITCH_Y, width: PANEL_WIDTH, height: PITCH_HEIGHT }, '217,119,6');
      drawPatchCell(ctx, PANELS[2].x, currentColumn, currentRow, MVL.orange, .22, 2.2);
      drawBall(ctx, truthPoint.x, truthPoint.y, 1, MVL.orange);
      ctx.fillStyle = MVL.orange;
      ctx.font = '800 13px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('R = I_current − Î_pred', PANELS[2].x + 50, 272);
    } else if (stage < 4) {
      ctx.fillStyle = MVL.muted;
      ctx.font = '700 12px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText(stage >= 2 ? '把参考内容搬到预测位置' : '等待运动补偿预测', PANELS[2].x + 48, 272);
    }

    if (stage === 4) {
      const signalBoxes = [
        { x: 578, label: '|MV|', sub: '运动强度', color: MVL.blue },
        { x: 688, label: 'E_res', sub: '残差能量', color: MVL.orange },
      ];
      signalBoxes.forEach((box) => {
        roundRect(ctx, box.x, 96, 90, 50, 7);
        ctx.fillStyle = `${box.color}16`;
        ctx.fill();
        ctx.strokeStyle = box.color;
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.fillStyle = box.color;
        ctx.font = '800 14px "Cascadia Code", Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(box.label, box.x + 45, 117);
        ctx.fillStyle = MVL.muted;
        ctx.font = '700 10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
        ctx.fillText(box.sub, box.x + 45, 136);
      });
      roundRect(ctx, 625, 182, 108, 46, 7);
      ctx.fillStyle = 'rgba(34,141,92,.14)';
      ctx.fill();
      ctx.strokeStyle = MVL.green;
      ctx.lineWidth = 2;
      ctx.stroke();
      drawArrow(ctx, 623, 148, 654, 182, MVL.blue);
      drawArrow(ctx, 733, 148, 704, 182, MVL.orange);
      ctx.fillStyle = MVL.green;
      ctx.font = '900 15px "Cascadia Code", Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('S', 679, 201);
      ctx.font = '700 10.5px "Segoe UI", "Microsoft YaHei", sans-serif';
      ctx.fillText('Importance S', 679, 218);
      ctx.textAlign = 'left';
      drawSceneLabel(ctx, '复用 HEVC 侧信息，不重复检测运动', 574, 262, MVL.green);
    }

    drawFlowNode(ctx, 24, '参考帧中找到预测来源', stage === 0 || stage === 1, MVL.blue);
    drawFlowNode(ctx, 222, '位置之差 → Motion Vector', stage === 2, MVL.blue);
    drawFlowNode(ctx, 420, '当前块 − 预测块 → Residual', stage === 3, MVL.orange);
    drawFlowNode(ctx, 618, '|MV|、E_res → Importance S', stage === 4, MVL.green);
    drawArrow(ctx, 198, 323, 214, 323, MVL.line);
    drawArrow(ctx, 396, 323, 412, 323, MVL.line);
    drawArrow(ctx, 594, 323, 610, 323, MVL.line);
  }, [stage]);

  return (
    <div className="mvl-widget mvl-lab" ref={autoplay.hostRef}>
      <StageRail
        labels={STAGES.map((item) => item.label)}
        active={stage}
        onSelect={(index) => {
          autoplay.pause();
          autoplay.setProgress(index / STAGES.length + .01);
        }}
      />
      <div className="mvl-lab-canvas-wrap">
        <canvas
          ref={ref}
          className="mvl-lab-canvas"
          width={820}
          height={380}
          role="img"
          aria-label={`${currentStage.title}。${currentStage.text}`}
        >当前 P 帧块在参考帧中寻找预测来源；位置差形成 Motion Vector，当前真实块减去运动补偿预测形成 Residual；Mage-VL 复用 HEVC 已产生的 codec side information，得到 patch importance S。</canvas>
      </div>
      <LabPlayback
        progress={autoplay.progress}
        playing={autoplay.playing}
        label={`Codec 推导过程 · ${currentStage.label}`}
        onToggle={autoplay.toggle}
        onReplay={autoplay.replay}
        onScrub={autoplay.setProgress}
      />
      <div className={`mvl-lab-narration ${stage === 3 ? 'warn' : stage === 4 ? 'good' : ''}`} aria-live="polite">
        <b>{currentStage.title}</b><span>{currentStage.text}</span>
      </div>
    </div>
  );
};
