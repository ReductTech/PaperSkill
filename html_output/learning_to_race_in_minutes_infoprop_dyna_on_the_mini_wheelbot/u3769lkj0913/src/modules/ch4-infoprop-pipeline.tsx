import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas, clamp, easeOutCubic } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { EvidencePanel, type EvidenceQuote } from './evidencePanel';

// Module 7.1: the Infoprop rollout as a branching decision, step by step:
// 多个模型一起预测 -> 模型意见（一致=>可信 / 分歧=>不确定）-> 把预测看成带噪观测 ->
// Infoprop 得到更可信的状态分布 -> 衡量当前信息损失 -> 累计 -> 超过阈值 => 截断 rollout。
// Mechanism from prior work [8] (ICLR 2025); this paper demonstrates it on the robot.
const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0', track: '#b8c9a7', edge: '#76906a', line: '#92400e',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47',
  purple: '#7c3aed', ink: '#21324a', muted: '#68778f', border: '#d7deea',
};

const EVIDENCE: EvidenceQuote[] = [
  {
    en: 'We propose Infoprop, a model-based rollout mechanism that separates aleatoric from epistemic model uncertainty and reduces the influence of the latter on the data distribution. Further, Infoprop keeps track of accumulated model errors along a model rollout and provides termination criteria to limit data corruption.',
    zh: 'Infoprop <b>分离偶然与认知不确定性</b>、<b>跟踪沿 rollout 的模型误差累积</b>，并给出<b>终止准则</b>以限制数据污染。',
    locator: '先前工作 [8] Abstract',
    highlights: ['separates aleatoric from epistemic', 'accumulated model errors', 'termination criteria'],
  },
  {
    en: 'The improved predictive distribution and capability to estimate accumulated error of Infoprop allows for substantially longer rollouts up to 100 steps. The Infoprop termination criteria reliably stop distorted rollouts, resulting in consistent rollouts over long horizons.',
    zh: '更好的预测分布 + 累积误差估计，使 rollout 可长达 <b>100 步</b>；终止准则可靠截断失真 rollout，<b>长时域保持数据一致</b>。',
    locator: '先前工作 [8] §6.2',
    highlights: ['up to 100 steps', 'reliably stop distorted rollouts', 'consistent rollouts over long horizons'],
  },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// --- step-by-step rollout data (qualitative, mechanism-faithful) ---
const STEPS = 5;
const SPREAD = [2.2, 2.8, 6.5, 10, 13];
const AGREE = [true, true, false, false, false];
const ENTROPY = [0.1, 0.14, 0.3, 0.55, 0.62];
const CUM = [0.1, 0.24, 0.54, 1.09, 1.71];
const LAMBDA2 = 1.5;
const TRUNC_AT = 4;

const NODES = [
  '多个模型一起预测',
  '模型意见（一致 / 分歧）',
  '把预测看成带噪观测',
  'Infoprop 得到更可信分布',
  '衡量当前信息损失并累计',
  '超过阈值 → 截断 rollout',
];

const STEP_LOG = [
  '第 1 步：多个模型意见一致（差距很小）→ 预测可信；信息损失 0.10，累计 0.10。',
  '第 2 步：意见仍然一致 → 可信；信息损失 0.14，累计 0.24。',
  '第 3 步：意见分歧 → 把预测看成带噪观测，Infoprop 得到更可信的状态分布；信息损失 0.30，累计 0.54。',
  '第 4 步：分歧更大 → 融合后仍有可观损失；信息损失 0.55，累计 1.09（逼近阈值 1.5）。',
  '第 5 步：累计 1.71 > λ₂ = 1.5 → 超过阈值，截断这条 rollout：模型不再可信；截断前 4 步的数据仍可用。',
];

export const Ch4InfopropPipeline: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<{ cursor: number; animT0: number; stopped: boolean }>({
    cursor: 0,
    animT0: -1,
    stopped: false,
  });
  const [cursor, setCursor] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [feedback, setFeedback] = useState({
    text: '点击「预测下一步」：多个模型一起预测，然后看模型意见是否一致。',
    cls: '',
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let raf: number | null = null;

    const render = (time: number) => {
      const s = stateRef.current;
      const cur = s.cursor - 1;
      const phase = cur < 0 ? 0 : clamp((time - s.animT0) / 0.9, 0, 1);
      const donePhase = cur >= 0 && phase >= 1;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      // ---------- left panel: models predict + branch + fusion ----------
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 16, 14, 390, 252, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('当前这一步', 36, 42);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('多个模型一起预测', 36, 64);

      if (cur < 0) {
        ctx.fillStyle = C.muted;
        ctx.font = '14px "Segoe UI", sans-serif';
        ctx.fillText('等待第一次预测……', 36, 150);
      } else {
        const spread = SPREAD[cur] * easeOutCubic(phase);
        const cx = 96;
        const cy = 142;
        // model opinions (purple dots spreading out)
        ctx.fillStyle = C.purple;
        for (const k of [-1.5, -0.5, 0.5, 1.5]) {
          ctx.beginPath();
          ctx.arc(cx, cy + k * spread * 1.15, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // mean of opinions
        ctx.strokeStyle = C.blue;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 16, cy);
        ctx.lineTo(cx + 16, cy);
        ctx.stroke();
        ctx.fillStyle = C.blue;
        ctx.beginPath();
        ctx.arc(cx, cy, 3.6, 0, Math.PI * 2);
        ctx.fill();

        // branch badge (no overlap with the dots column)
        if (!donePhase) {
          ctx.fillStyle = C.muted;
          ctx.font = '13px "Segoe UI", sans-serif';
          ctx.fillText('预测展开中……', 160, 96);
        } else if (AGREE[cur]) {
          ctx.fillStyle = C.green;
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
          ctx.fillText('模型意见一致 → 可信', 160, 96);
          ctx.strokeStyle = C.green;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(160, 106);
          ctx.lineTo(167, 113);
          ctx.lineTo(184, 94);
          ctx.stroke();
        } else {
          ctx.fillStyle = C.red;
          ctx.font = 'bold 14px "Segoe UI", sans-serif';
          ctx.fillText('模型意见分歧 → 不确定', 160, 96);
          // arrow into the fused (more trustworthy) distribution
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(146, cy);
          ctx.lineTo(200, cy);
          ctx.stroke();
          ctx.fillStyle = C.blue;
          ctx.beginPath();
          ctx.moveTo(200, cy);
          ctx.lineTo(190, cy - 6);
          ctx.lineTo(190, cy + 6);
          ctx.closePath();
          ctx.fill();
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(242, cy, 20, spread * 0.9 + 6, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = C.blue;
          ctx.font = '12px "Segoe UI", sans-serif';
          ctx.fillText('Infoprop 融合 → 更可信', 160, 196);
        }

        // spread bar
        ctx.fillStyle = '#eef2f7';
        rr(ctx, 36, 222, 190, 10, 5);
        ctx.fill();
        const spreadRatio = clamp(SPREAD[cur] / 16, 0, 1);
        ctx.fillStyle = AGREE[cur] ? C.green : C.red;
        rr(ctx, 36, 222, Math.max(6, 190 * spreadRatio), 10, 5);
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText('意见差距', 234, 231);

        // information loss of this step
        ctx.fillStyle = donePhase ? (AGREE[cur] ? C.green : C.orange) : C.muted;
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillText('当前信息损失 ' + ENTROPY[cur].toFixed(2), 36, 254);
      }

      // ---------- center: decision flow (user's chain wording) ----------
      const fx = 432;
      const fw = 252;
      NODES.forEach((label, i) => {
        const ny = 30 + i * 36;
        let stroke: string = C.border;
        let textColor: string = C.muted;
        let bold = false;
        if (cur >= 0 && donePhase) {
          const disagreed = !AGREE[cur];
          const relevant = i <= 1 || (i >= 2 && i <= 3 && disagreed) || i >= 4;
          if (relevant) {
            stroke = C.blue;
            textColor = C.blue;
            bold = true;
          }
          if (i === 1) {
            stroke = AGREE[cur] ? C.green : C.red;
            textColor = AGREE[cur] ? C.green : C.red;
          }
          if (i === 5 && s.stopped) {
            stroke = C.red;
            textColor = C.red;
          }
        }
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = stroke;
        ctx.lineWidth = bold ? 2.5 : 1.5;
        rr(ctx, fx, ny, fw, 27, 7);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = textColor;
        ctx.font = (bold ? 'bold ' : '') + '12.5px "Segoe UI", sans-serif';
        ctx.fillText(label, fx + 12, ny + 18);
        if (i < NODES.length - 1) {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(fx + fw / 2, ny + 27);
          ctx.lineTo(fx + fw / 2, ny + 36);
          ctx.stroke();
        }
      });
      // loop-back arrow: continue when under threshold
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(fx - 12, 219);
      ctx.lineTo(fx - 12, 44);
      ctx.lineTo(fx, 44);
      ctx.stroke();

      // ---------- right: information loss accumulation ----------
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      rr(ctx, 708, 14, 356, 252, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = C.ink;
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText('信息损失与累计', 728, 42);

      const base = 224;
      const bx0 = 776;
      const dx = 56;
      const hScale = 86;
      const cScale = 52;
      for (let i = 0; i < STEPS; i++) {
        const bx = bx0 + i * dx;
        if (i <= cur) {
          const h = ENTROPY[i] * hScale;
          const isTrunc = s.stopped && i === TRUNC_AT;
          ctx.fillStyle = isTrunc ? 'rgba(196,63,82,0.85)' : AGREE[i] ? 'rgba(34,141,92,0.75)' : C.orange;
          rr(ctx, bx - 11, base - h, 22, h, 4);
          ctx.fill();
        } else {
          ctx.fillStyle = '#eef2f7';
          rr(ctx, bx - 11, base - 8, 22, 8, 4);
          ctx.fill();
        }
      }
      // threshold
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 1.8;
      ctx.setLineDash([7, 5]);
      const ly = base - LAMBDA2 * cScale;
      ctx.beginPath();
      ctx.moveTo(744, ly);
      ctx.lineTo(1036, ly);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = '12px "Segoe UI", sans-serif';
      ctx.fillText('阈值 λ₂', 726, ly - 5);
      // accumulated curve
      ctx.strokeStyle = C.red;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      for (let i = 0; i <= cur; i++) {
        const px = bx0 + i * dx;
        const py = base - CUM[i] * cScale;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.fillStyle = C.red;
      for (let i = 0; i <= cur; i++) {
        ctx.beginPath();
        ctx.arc(bx0 + i * dx, base - CUM[i] * cScale, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      // truncation mark
      if (s.stopped) {
        const tx = bx0 + TRUNC_AT * dx;
        const ty = base - CUM[TRUNC_AT] * cScale;
        ctx.strokeStyle = C.red;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx - 7, ty - 24);
        ctx.lineTo(tx + 7, ty - 10);
        ctx.moveTo(tx + 7, ty - 24);
        ctx.lineTo(tx - 7, ty - 10);
        ctx.stroke();
        ctx.fillStyle = C.red;
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText('截断', tx - 15, ty - 32);
      }
      // legend
      const legend: Array<[string, string]> = [
        ['一致', C.green],
        ['分歧（融合后）', C.orange],
        ['截断步', C.red],
      ];
      let lx = 728;
      legend.forEach(([label, color]) => {
        ctx.fillStyle = color;
        ctx.fillRect(lx, 246, 10, 10);
        ctx.fillStyle = C.muted;
        ctx.font = '11.5px "Segoe UI", sans-serif';
        ctx.fillText(label, lx + 14, 255);
        lx += 14 + ctx.measureText(label).width + 16;
      });
    };

    const tick = (now: number) => {
      render(now / 1000);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === null) raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (raf !== null) cancelAnimationFrame(raf);
      raf = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = () => {
    const s = stateRef.current;
    if (s.stopped || s.cursor >= STEPS) return;
    const idx = s.cursor;
    s.cursor += 1;
    s.animT0 = performance.now() / 1000;
    const isLast = idx === TRUNC_AT;
    if (isLast) s.stopped = true;
    setCursor(s.cursor);
    setStopped(s.stopped);
    setFeedback({ text: STEP_LOG[idx], cls: isLast ? 'bad' : idx >= 2 ? '' : 'good' });
  };

  const reset = () => {
    stateRef.current = { cursor: 0, animT0: -1, stopped: false };
    setCursor(0);
    setStopped(false);
    setFeedback({
      text: '重置完成：再点「预测下一步」，从意见一致走到分歧、融合与截断。',
      cls: '',
    });
  };

  const logItems = STEP_LOG.slice(0, cursor).map((text, i) => ({
    text,
    cls: i >= 4 ? 'bad' : i >= 2 ? 'info' : 'good',
  }));

  return (
    <div className="module-split">
      <div className="module-split-main">
        <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
        <div className="step-ctrl">
          <button onClick={go} disabled={stopped || cursor >= STEPS}>
            预测下一步
          </button>
          <span className="feedback" style={{ marginTop: 0, minHeight: 0 }}>
            第 {cursor} / {STEPS} 步 rollout
          </span>
          <button onClick={reset} disabled={cursor === 0}>
            重置
          </button>
        </div>
        <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
        {logItems.length > 0 ? (
          <div className="step-log">
            {logItems.map((item, i) => (
              <div key={i} className={`step-log-item ${item.cls}`}>
                {item.text}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      <EvidencePanel quotes={EVIDENCE} />
    </div>
  );
};

export default Ch4InfopropPipeline;
