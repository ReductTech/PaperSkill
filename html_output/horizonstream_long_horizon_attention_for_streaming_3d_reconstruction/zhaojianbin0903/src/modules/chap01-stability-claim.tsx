import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

const W = 760;
const H = 250;
type Criterion = 'availability' | 'stability';
type Horizon = 'short' | 'long';

function drawCamera(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x - 12, y - 8, 24, 16);
  ctx.fillRect(x - 7, y - 12, 9, 4);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + 3, y, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

export const Chap01StabilityClaim: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [criterion, setCriterion] = useState<Criterion>('availability');
  const [horizon, setHorizon] = useState<Horizon>('short');
  const [showQuestion, setShowQuestion] = useState(true);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    ctx.fillStyle = '#f7f8fa';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(94,105,120,0.12)';
    for (let x = 20; x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 20; y < H; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#17202b';
    ctx.font = '700 16px "Segoe UI", sans-serif';
    ctx.fillText(
      criterion === 'availability' ? '判据 A：系统是否仍在产生输出' : '判据 B：估计轨迹是否仍贴近参考几何',
      28,
      32
    );

    if (criterion === 'availability') {
      const count = horizon === 'short' ? 7 : 16;
      const cellW = horizon === 'short' ? 76 : 36;
      for (let index = 0; index < count; index += 1) {
        const x = 30 + index * (cellW + 5);
        ctx.fillStyle = index === count - 1 ? '#1455d9' : '#e1e6ec';
        ctx.fillRect(x, 76, cellW, 58);
        ctx.fillStyle = index === count - 1 ? '#ffffff' : '#5e6978';
        ctx.font = '11px "Segoe UI", sans-serif';
        ctx.fillText(index === count - 1 ? '当前输出' : `帧 ${index + 1}`, x + 7, 108);
      }
      drawCamera(ctx, horizon === 'short' ? 620 : 681, 181, '#1455d9');
      ctx.strokeStyle = '#1455d9';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(55, 181);
      ctx.lineTo(horizon === 'short' ? 600 : 661, 181);
      ctx.stroke();
      ctx.fillStyle = '#1455d9';
      ctx.font = '700 14px "Segoe UI", sans-serif';
      ctx.fillText('输出仍在继续', 55, 212);
      ctx.fillStyle = '#5e6978';
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText('但这张图没有测量它离参考轨迹多远。', 180, 212);
    } else {
      ctx.strokeStyle = '#9ca9ba';
      ctx.lineWidth = 2;
      ctx.setLineDash([7, 6]);
      ctx.beginPath();
      ctx.moveTo(40, 184);
      ctx.bezierCurveTo(210, 55, 455, 206, 716, 78);
      ctx.stroke();
      ctx.setLineDash([]);

      const deviation = horizon === 'short' ? 5 : 48;
      ctx.strokeStyle = horizon === 'short' ? '#16875b' : '#c43d37';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, 184);
      ctx.bezierCurveTo(210, 58, 455, 206 + deviation * 0.45, 716, 78 + deviation);
      ctx.stroke();
      drawCamera(ctx, horizon === 'short' ? 435 : 700, horizon === 'short' ? 158 : 120, horizon === 'short' ? '#16875b' : '#c43d37');

      ctx.fillStyle = 'rgba(196,61,55,0.12)';
      ctx.beginPath();
      ctx.moveTo(470, 162);
      ctx.bezierCurveTo(560, 155, 645, 104, 716, 78);
      ctx.lineTo(716, 78 + deviation);
      ctx.bezierCurveTo(645, 133, 560, 185, 470, 174);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#5e6978';
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('虚线：参考几何', 48, 222);
      ctx.fillStyle = horizon === 'short' ? '#16875b' : '#c43d37';
      ctx.fillText(horizon === 'short' ? '短时段：偏差尚小' : '长时段：偏差带明显扩大', 224, 222);
    }

    if (showQuestion) {
      ctx.fillStyle = 'rgba(255,255,255,0.94)';
      ctx.fillRect(500, 13, 230, 38);
      ctx.strokeStyle = '#c66a16';
      ctx.strokeRect(500, 13, 230, 38);
      ctx.fillStyle = '#c66a16';
      ctx.font = '700 12px "Segoe UI", sans-serif';
      ctx.fillText(criterion === 'availability' ? '仅凭“有输出”，能判定稳定吗？' : '误差会不会随时域继续增长？', 514, 36);
    }
    canvas.classList.add('is-ready');
  }, [criterion, horizon, showQuestion]);

  const isUnsupportedConclusion = criterion === 'availability' && showQuestion;
  const feedback = criterion === 'availability'
    ? isUnsupportedConclusion
      ? '仍有输出，但稳定性尚未判定。容量判据不能替代几何误差判据。'
      : '仍有输出，只说明系统没有停止；要判断稳定，必须切换到几何判据。'
    : horizon === 'short'
      ? '短序列误差较小仍不够：需要检查误差是否随时域增长。'
      : '长时域下应直接比较轨迹误差及其增长，而不是只看输出是否存在。';

  return (
    <div>
      <div className="chip-row" role="group" aria-label="选择判断标准">
        <button
          type="button"
          className={`chip ${criterion === 'availability' ? 'selected' : ''}`}
          aria-pressed={criterion === 'availability'}
          onClick={() => setCriterion('availability')}
        >
          能继续输出
        </button>
        <button
          type="button"
          className={`chip ${criterion === 'stability' ? 'selected' : ''}`}
          aria-pressed={criterion === 'stability'}
          onClick={() => setCriterion('stability')}
        >
          几何仍稳定
        </button>
      </div>
      <canvas
        id={`cv-${chapterId}-${moduleId}`}
        ref={canvasRef}
        width={W}
        height={H}
        role="img"
        aria-label="输出可用性与长时几何稳定性的概念对比图"
      />
      <div className="ctrl">
        <span style={{ color: '#5e6978', fontWeight: 700 }}>观察时域</span>
        <button
          type="button"
          className={`chip ${horizon === 'short' ? 'selected' : ''}`}
          aria-pressed={horizon === 'short'}
          onClick={() => setHorizon('short')}
        >
          短序列
        </button>
        <button
          type="button"
          className={`chip ${horizon === 'long' ? 'selected' : ''}`}
          aria-pressed={horizon === 'long'}
          onClick={() => setHorizon('long')}
        >
          长序列
        </button>
        <label style={{ marginLeft: 'auto' }}>
          <input
            type="checkbox"
            checked={showQuestion}
            onChange={(event) => setShowQuestion(event.target.checked)}
          />
          显示判据追问
        </label>
      </div>
      <div className={`feedback ${isUnsupportedConclusion ? 'bad' : criterion === 'stability' ? 'good' : ''}`} aria-live="polite">
        {feedback}
      </div>
      <div style={{ marginTop: 8, color: '#758195', fontSize: 13 }}>机制示意，不是模型输出或论文实测轨迹。</div>
    </div>
  );
};

export default Chap01StabilityClaim;
