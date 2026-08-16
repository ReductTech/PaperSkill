import React, { useEffect, useRef, useState } from 'react';
import { clamp, observeCanvas, setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { clearDesk, drawProofFrame, drawSceneLabel } from './poster-kit';

const W = 800;
const H = 360;
const BETA = 0.05;
const LAMBDA_WIN = 0.35;
const LAMBDA_LOSE = 0.15;
const REF_WIN = 0.32;
const REF_LOSE = 0.5;
const REF_DIFF = REF_WIN - REF_LOSE;
const C = {
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#d97706',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', line: '#d7deea', paper: '#fff',
};

function sigmoid(value: number) {
  return 1 / (1 + Math.exp(-value));
}

function objectiveFor(winError: number, loseError: number) {
  const diff = winError - loseError;
  const dpo = -Math.log(sigmoid(-BETA * (diff - REF_DIFF)));
  const anchor = LAMBDA_WIN * winError + LAMBDA_LOSE * loseError;
  return { diff, dpo, anchor, total: dpo + anchor };
}

const BASE = objectiveFor(REF_WIN, REF_LOSE);

function signed(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(3)}`;
}

function feedbackFor(winError: number, loseError: number, anchorsEnabled: boolean) {
  const current = objectiveFor(winError, loseError);
  const winImproved = winError < REF_WIN - 0.025;
  const loseDamaged = loseError > REF_LOSE + 0.025;

  if (!anchorsEnabled && loseDamaged && !winImproved) {
    return {
      cls: 'bad',
      text: `只抬高负样本误差也让 L_DPO 下降 ${Math.abs(current.dpo - BASE.dpo).toFixed(3)}；优化目标因此会奖励这条“破坏负样本”的投机路径。`,
    };
  }
  if (anchorsEnabled && loseDamaged && current.total > BASE.total) {
    return {
      cls: 'good',
      text: `虽然 L_DPO 下降，但锚定惩罚增加得更多，使 L_total 比基线高 ${Math.abs(current.total - BASE.total).toFixed(3)}；优化器不再从无限抬高负样本误差中获益。`,
    };
  }
  if (anchorsEnabled && winImproved && current.total < BASE.total) {
    return {
      cls: 'good',
      text: `降低胜样本误差同时降低 L_DPO 和锚定惩罚，L_total 比基线低 ${Math.abs(current.total - BASE.total).toFixed(3)}；这是锚定损失保留的健康优化方向。`,
    };
  }
  if (!anchorsEnabled && winImproved) {
    return {
      cls: '',
      text: '降低胜样本误差也能改善 L_DPO；请再加入 Anchor Losses，对比它为何偏向这条健康路径并抑制破坏负样本。',
    };
  }
  return {
    cls: '',
    text: anchorsEnabled
      ? '当前接近冻结参考基线。分别降低胜样本误差或抬高负样本误差，比较 L_total 的方向。'
      : '当前接近冻结参考基线。先抬高负样本误差，观察 L_DPO 为什么会变小。',
  };
}

function drawBar(
  ctx: CanvasRenderingContext2D,
  label: string,
  value: number,
  reference: number,
  y: number,
  color: string,
) {
  const x = 48;
  const width = 290;
  ctx.fillStyle = C.ink;
  ctx.font = '600 12px "Segoe UI", sans-serif';
  ctx.fillText(label, x, y - 10);
  ctx.fillStyle = '#eef3fb';
  ctx.fillRect(x, y, width, 18);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * value, 18);
  ctx.strokeStyle = C.purple;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + width * reference, y - 4);
  ctx.lineTo(x + width * reference, y + 22);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = '700 12px "Segoe UI", sans-serif';
  ctx.fillText(value.toFixed(2), x + width + 10, y + 14);
  ctx.fillStyle = C.muted;
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.fillText('紫线＝冻结参考', x + 198, y + 34);
}

export const Ch6DpoWidget: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [winError, setWinError] = useState(REF_WIN);
  const [loseError, setLoseError] = useState(REF_LOSE);
  const [anchorsEnabled, setAnchorsEnabled] = useState(false);
  const objective = objectiveFor(winError, loseError);
  const feedback = feedbackFor(winError, loseError, anchorsEnabled);
  const total = anchorsEnabled ? objective.total : objective.dpo;
  const baseTotal = anchorsEnabled ? BASE.total : BASE.dpo;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    canvas.style.width = '100%';
    canvas.style.height = 'auto';

    const draw = () => {
      clearDesk(ctx, W, H);
      ctx.fillStyle = C.paper;
      ctx.strokeStyle = C.line;
      ctx.lineWidth = 1;
      ctx.fillRect(18, 18, 764, 324);
      ctx.strokeRect(18.5, 18.5, 763, 323);
      drawSceneLabel(ctx, '教学代入值 · 损失越低越接近优化方向', 34, 42, C.blue);

      ctx.fillStyle = C.blue;
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('两条都能改善 DPO，但含义不同', 48, 72);
      drawBar(ctx, '健康路径：降低胜样本误差 ℓ_win', winError, REF_WIN, 102, C.blue);
      drawBar(ctx, '投机路径：抬高负样本误差 ℓ_lose', loseError, REF_LOSE, 184, C.orange);
      ctx.fillStyle = winError < REF_WIN ? C.green : C.muted;
      ctx.font = '600 11px "Segoe UI", sans-serif';
      ctx.fillText(winError < REF_WIN ? '胜样本重建真正改善' : '尝试向左拖动胜样本', 48, 160);
      ctx.fillStyle = loseError > REF_LOSE ? C.red : C.muted;
      ctx.fillText(loseError > REF_LOSE ? '负样本被刻意破坏' : '尝试向右拖动负样本', 48, 242);

      const panelX = 410;
      const panelW = 342;
      ctx.fillStyle = '#f8fbff';
      ctx.strokeStyle = C.line;
      ctx.fillRect(panelX, 58, panelW, 116);
      ctx.strokeRect(panelX + 0.5, 58.5, panelW - 1, 115);
      ctx.fillStyle = C.blue;
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('① DPO 单项', panelX + 18, 82);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`Diff_policy = ${winError.toFixed(2)} − ${loseError.toFixed(2)} = ${objective.diff.toFixed(2)}`, panelX + 18, 108);
      ctx.fillText(`L_DPO = ${objective.dpo.toFixed(3)}   Δ基线 ${signed(objective.dpo - BASE.dpo)}`, panelX + 18, 134);
      ctx.fillStyle = objective.dpo < BASE.dpo ? C.green : C.muted;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      ctx.fillText(objective.dpo < BASE.dpo ? '↓ DPO 认为目标正在变好' : '当前与冻结参考基线接近', panelX + 18, 158);

      ctx.fillStyle = anchorsEnabled ? '#f1fbf5' : '#f7f8fb';
      ctx.strokeStyle = anchorsEnabled ? C.green : C.line;
      ctx.lineWidth = anchorsEnabled ? 2 : 1;
      ctx.fillRect(panelX, 188, panelW, 130);
      ctx.strokeRect(panelX + 0.5, 188.5, panelW - 1, 129);
      ctx.fillStyle = anchorsEnabled ? C.green : C.muted;
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText(anchorsEnabled ? '② DPO + Anchor Losses' : '② Anchor Losses 尚未计入', panelX + 18, 214);
      ctx.fillStyle = C.ink;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText(`P_anchor = .35×${winError.toFixed(2)} + .15×${loseError.toFixed(2)} = ${objective.anchor.toFixed(3)}`, panelX + 18, 242);
      ctx.fillText(`L_total = ${total.toFixed(3)}   Δ对应基线 ${signed(total - baseTotal)}`, panelX + 18, 268);
      ctx.fillStyle = anchorsEnabled && total > BASE.total ? C.red : anchorsEnabled && total < BASE.total ? C.green : C.muted;
      ctx.font = '700 11px "Segoe UI", sans-serif';
      const conclusion = !anchorsEnabled
        ? '未计入锚定惩罚，L_total 等于 L_DPO'
        : loseError > REF_LOSE && total > BASE.total
        ? '↑ 破坏负样本会抬高总损失，投机被推回'
        : winError < REF_WIN && total < BASE.total
        ? '↓ 改善胜样本会降低总损失，健康路径保留'
        : '分别拖动两个误差，比较总目标的方向';
      ctx.fillText(conclusion, panelX + 18, 296);
      if (anchorsEnabled) drawProofFrame(ctx, panelX - 5, 183, panelW + 10, 140, C.green);

      ctx.fillStyle = C.muted;
      ctx.font = '10px "Segoe UI", sans-serif';
      ctx.fillText('β=.05、λ_win=.35、λ_lose=.15 为论文设置；误差与损失值为公式教学代入。', 38, 331);
      canvas.classList.add('is-ready');
    };

    draw();
    return observeCanvas(canvas, draw, () => {});
  }, [winError, loseError, anchorsEnabled, total, baseTotal, objective]);

  const updateError = (value: string) => clamp(Number(value) / 100, 0.05, 0.95);

  return (
    <div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        aria-label={`DPO 双路径教学图：胜样本误差 ${winError.toFixed(2)}，负样本误差 ${loseError.toFixed(2)}，当前目标${anchorsEnabled ? '包含' : '不包含'}锚定损失`}
      />
      <div className="ctrl dpo-controls">
        <div className="dpo-control-row">
          <label htmlFor={`win-${chapterId}-${moduleId}`}>
            胜样本误差 <span className="val">{winError.toFixed(2)}</span>
          </label>
          <input
            id={`win-${chapterId}-${moduleId}`}
            type="range"
            min={5}
            max={95}
            value={Math.round(winError * 100)}
            onChange={(event) => setWinError(updateError(event.target.value))}
            aria-describedby={`fb-${chapterId}-${moduleId}`}
          />
        </div>
        <div className="dpo-control-row">
          <label htmlFor={`lose-${chapterId}-${moduleId}`}>
            负样本误差 <span className="val">{loseError.toFixed(2)}</span>
          </label>
          <input
            id={`lose-${chapterId}-${moduleId}`}
            type="range"
            min={5}
            max={95}
            value={Math.round(loseError * 100)}
            onChange={(event) => setLoseError(updateError(event.target.value))}
            aria-describedby={`fb-${chapterId}-${moduleId}`}
          />
        </div>
        <div className="dpo-control-row dpo-objective-row">
          <span className="ctrl-label">优化目标</span>
          <div className="dpo-objective-actions">
            <button
              type="button"
              className={`tiny ${anchorsEnabled ? 'ghost' : ''}`}
              aria-pressed={!anchorsEnabled}
              onClick={() => setAnchorsEnabled(false)}
            >
              仅 L_DPO
            </button>
            <button
              type="button"
              className={`tiny ${anchorsEnabled ? '' : 'ghost'}`}
              aria-pressed={anchorsEnabled}
              onClick={() => setAnchorsEnabled(true)}
            >
              L_DPO + Anchor Losses
            </button>
          </div>
        </div>
      </div>
      <div className="metrics">
        <div className="metric"><div className="l">Diff_policy</div><div className="v" style={{ fontSize: 18 }}>{objective.diff.toFixed(2)}</div></div>
        <div className="metric"><div className="l">L_DPO</div><div className="v" style={{ fontSize: 18 }}>{objective.dpo.toFixed(3)}</div></div>
        <div className="metric"><div className="l">锚定惩罚</div><div className="v" style={{ fontSize: 18 }}>{anchorsEnabled ? objective.anchor.toFixed(3) : '未计入'}</div></div>
        <div className="metric"><div className="l">当前优化目标</div><div className="v" style={{ fontSize: 18 }}>{total.toFixed(3)}</div></div>
      </div>
      <div id={`fb-${chapterId}-${moduleId}`} className={`feedback ${feedback.cls}`} aria-live="polite">
        {feedback.text}
      </div>
    </div>
  );
};

export default Ch6DpoWidget;
