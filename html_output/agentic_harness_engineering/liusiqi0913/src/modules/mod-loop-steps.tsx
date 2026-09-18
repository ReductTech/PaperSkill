import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §6 module — 六步走完一轮迭代 (1080x280, P2 step-through)
// 横向六节点路线（已完成段绿、当前节点蓝脉动），下方 inset 显示该阶段产物。

const W = 1080;
const H = 280;

const C = {
  bg: '#f5f8f0',
  ground: '#b8c9a7',
  deep: '#76906a',
  text: '#21324a',
  muted: '#68778f',
  red: '#c43f52',
  green: '#228d5c',
  blue: '#27446e',
  orange: '#f07e47',
  border: '#d7deea',
};

interface Stage {
  label: string;
  sym: string;
  desc: string;
}

const STAGES: Stage[] = [
  { label: '试运行 k 次', sym: 'Tₜ', desc: '轨迹集 T_t：89 个任务、每任务 k 次试运行的原始记录' },
  { label: '清洗轨迹', sym: 'Tₜ′', desc: '去噪轨迹：剔掉环境噪声与无效记录，保留可分析的任务过程' },
  { label: '归因+回滚', sym: 'Vₜ', desc: '裁决 V_t：上一轮变更清单逐条对账，没兑现的编辑按文件粒度回滚' },
  { label: '分层蒸馏', sym: 'Rₜ', desc: '报告 R_t：Agent Debugger 把本轮轨迹蒸馏成三层证据（~10M → ~10K）' },
  { label: '编辑+清单', sym: 'Hₜ·Cₜ', desc: '新工作区 H_t 与新清单 C_t：改组件文件，写下新的可证伪预测' },
  { label: '提交打标签', sym: 'git tag', desc: '一次逻辑编辑 = 一次 commit；最佳工作区 H_best 按 pass@1 随时更新' },
];

function feedbackFor(step: number): { text: string; cls: string; warn?: boolean } {
  if (step === 2)
    return {
      text: '先清算上一轮的变更清单：预测未兑现的编辑按文件粒度回滚——然后才开始本轮分析',
      cls: '',
      warn: true,
    };
  if (step === 4) return { text: '读证据、选组件、改文件、写下新的可证伪预测', cls: '' };
  if (step === 5) return { text: '一轮结束，工作区带新预测进入下一轮评估', cls: 'good' };
  if (step === 0) return { text: '每个任务跑 k 次试运行，收集原始轨迹 T_t', cls: '' };
  if (step === 1) return { text: '先洗干净数据：噪声轨迹不进证据语料', cls: '' };
  return { text: '裁决已入证据语料——旧清单从说辞变成契约', cls: '' };
}

const NODE = { w: 128, h: 50, y: 56 };
function nodeX(i: number) {
  return 92 + i * 180;
}

export const ModLoopSteps: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef({ step: 0 });
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState(feedbackFor(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }
    let startTs = 0;

    const render = (now: number) => {
      if (!startTs) startTs = now;
      const s = stateRef.current;
      const pulse = (Math.sin(now / 280) + 1) / 2;

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);

      const cy = NODE.y + NODE.h / 2;

      // route arrows
      for (let i = 0; i < 5; i++) {
        const x1 = nodeX(i) + NODE.w / 2;
        const x2 = nodeX(i + 1) - NODE.w / 2;
        const done = i < s.step;
        ctx.strokeStyle = done ? C.green : C.border;
        ctx.lineWidth = done ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(x1 + 4, cy);
        ctx.lineTo(x2 - 8, cy);
        ctx.stroke();
        // arrowhead
        ctx.fillStyle = done ? C.green : C.border;
        ctx.beginPath();
        ctx.moveTo(x2 - 8, cy - 6);
        ctx.lineTo(x2 - 8, cy + 6);
        ctx.lineTo(x2, cy);
        ctx.closePath();
        ctx.fill();
      }

      // nodes
      for (let i = 0; i < 6; i++) {
        const x = nodeX(i) - NODE.w / 2;
        const y = NODE.y;
        const isCur = i === s.step;
        const isDone = i < s.step;
        if (isCur) {
          ctx.save();
          ctx.globalAlpha = 0.35 + pulse * 0.4;
          ctx.strokeStyle = C.blue;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(x - 6, y - 6, NODE.w + 12, NODE.h + 12, 12);
          ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath();
        ctx.roundRect(x, y, NODE.w, NODE.h, 9);
        if (isCur) {
          ctx.fillStyle = C.blue;
          ctx.fill();
          ctx.lineWidth = 3;
          ctx.strokeStyle = C.blue;
          ctx.stroke();
        } else if (isDone) {
          ctx.fillStyle = '#e4f2ea';
          ctx.fill();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = C.green;
          ctx.stroke();
        } else {
          ctx.fillStyle = '#eef1f6';
          ctx.fill();
          ctx.lineWidth = 2;
          ctx.strokeStyle = C.border;
          ctx.stroke();
        }
        // index + label
        ctx.textAlign = 'center';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillStyle = isCur ? '#cfe0f5' : C.muted;
        ctx.fillText(String(i + 1), nodeX(i), y + 16);
        ctx.font = 'bold 13px "Segoe UI", sans-serif';
        ctx.fillStyle = isCur ? '#ffffff' : isDone ? C.green : C.text;
        ctx.fillText(STAGES[i].label, nodeX(i), y + 36);
        ctx.textAlign = 'left';
      }

      // inset: stage artifact
      const ix = 60;
      const iy = 142;
      const iw = 960;
      const ih = 108;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ix, iy, iw, ih);
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.border;
      ctx.strokeRect(ix, iy, iw, ih);

      const st = STAGES[s.step];
      // artifact symbol chip
      ctx.beginPath();
      ctx.roundRect(ix + 22, iy + 22, 110, 64, 10);
      ctx.fillStyle = 'rgba(39,68,110,0.08)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = C.blue;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillStyle = C.blue;
      ctx.font = 'bold 26px "Segoe UI", sans-serif';
      ctx.fillText(st.sym, ix + 22 + 55, iy + 22 + 42);
      ctx.textAlign = 'left';
      // description
      ctx.fillStyle = C.text;
      ctx.font = '15px "Segoe UI", sans-serif';
      ctx.fillText(st.desc, ix + 160, iy + 48);
      ctx.fillStyle = C.muted;
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillText(`阶段 ${s.step + 1} / 6`, ix + 160, iy + 76);
    };

    const tick = (now: number) => {
      render(now);
      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
      rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
  }, []);

  const go = (next: number) => {
    const v = Math.min(5, Math.max(0, next));
    stateRef.current.step = v;
    setStep(v);
    setFeedback(feedbackFor(v));
  };

  const warnStyle: React.CSSProperties | undefined = feedback.warn
    ? { color: C.orange, borderLeftColor: C.orange, background: '#fdeee3', fontStyle: 'normal' }
    : undefined;

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="step-ctrl">
        <button type="button" className="tiny ghost" disabled={step === 0} onClick={() => go(step - 1)}>
          上一步
        </button>
        <span className="step-label">
          阶段 <b>{step + 1}</b> / 6
        </span>
        <button type="button" className="tiny" disabled={step === 5} onClick={() => go(step + 1)}>
          下一步
        </button>
        <button type="button" className="tiny ghost" onClick={() => go(0)}>
          重置
        </button>
        {step === 5 && <span className="step-label">一轮完成，点「重置」回到第 1 步</span>}
      </div>
      <div className={`feedback ${feedback.cls}`} style={warnStyle}>
        {feedback.text}
      </div>
    </div>
  );
};

export default ModLoopSteps;
