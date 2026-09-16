import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// §8 Module 8.1 — 四段流水线与五库分工：点击阶段，看职责、承担它的库与产出。
const W = 1080;
const H = 280;
const BG = '#f5f8f0';
const LIGHT = '#b8c9a7';
const DARK = '#76906a';
const BLUE = '#27446e';
const GREEN = '#228d5c';
const BORDER = '#d7deea';

const STAGES = [
  {
    label: '缺失模拟',
    lib: 'PyGrinder',
    detail: '先用 PyGrinder 把洞造出来，这样才有真值可评。',
    output: '带 NaN 的输入 + 真值',
  },
  {
    label: '预处理',
    lib: 'BenchPOTS + TSDB',
    detail: '下载、标准化、切分，并掩掉一部分真值留作评估。',
    output: 'train / val / test 字典',
  },
  {
    label: '模型训练',
    lib: 'PyPOTS',
    detail: '用同一套 fit / predict 跑不同模型与任务。',
    output: '模型 checkpoint',
  },
  {
    label: '评估',
    lib: 'PyPOTS 指标函数',
    detail: '指标助手按任务提供统一口径，图与日志一起产出。',
    output: '指标 + 图 + 日志',
  },
];

export const Ch8Mod1: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(0);
  const [feedback, setFeedback] = useState({
    text: '缺失模拟：先用 PyGrinder 把洞造出来，这样才有真值可评。库：PyGrinder。本条流水线的四段顺序出自论文；五个库的分工来自各库官方仓库（生态事实）。',
    cls: '',
  });

  const pick = (i: number) => {
    stateRef.current.stage = i;
    setStage(i);
    setFeedback({
      text: `${STAGES[i].detail}库：${STAGES[i].lib}。本条流水线的四段顺序出自论文；五个库的分工来自各库官方仓库（生态事实）。`,
      cls: i === 3 ? 'good' : '',
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let ctx: CanvasRenderingContext2D;
    try {
      ctx = setupCanvas(canvas, W, H);
    } catch {
      return;
    }

    const render = (s: { stage: number }) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIGHT;
      ctx.fillRect(0, 244, W, 22);
      ctx.strokeStyle = DARK;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 244);
      ctx.lineTo(W, 244);
      ctx.stroke();

      // ---- node row ----
      const n = STAGES.length;
      const gap = 240;
      const startX = 56;
      const nodeW = 176;
      const nodeY = 62;
      const nodeH = 56;

      // connector first (back-to-front: inactive then active)
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      for (let i = 0; i < n - 1; i++) {
        const x1 = startX + i * gap + nodeW;
        const x2 = startX + (i + 1) * gap;
        ctx.beginPath();
        ctx.moveTo(x1, nodeY + nodeH / 2);
        ctx.lineTo(x2, nodeY + nodeH / 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      ctx.strokeStyle = GREEN;
      ctx.lineWidth = 3;
      for (let i = 0; i < s.stage; i++) {
        const x1 = startX + i * gap + nodeW;
        const x2 = startX + (i + 1) * gap;
        ctx.beginPath();
        ctx.moveTo(x1, nodeY + nodeH / 2);
        ctx.lineTo(x2, nodeY + nodeH / 2);
        ctx.stroke();
      }

      STAGES.forEach((st, i) => {
        const x = startX + i * gap;
        const active = i === s.stage;
        ctx.fillStyle = active ? BLUE : '#ffffff';
        ctx.fillRect(x, nodeY, nodeW, nodeH);
        ctx.strokeStyle = active ? BLUE : BORDER;
        ctx.lineWidth = active ? 3 : 1;
        ctx.strokeRect(x, nodeY, nodeW, nodeH);
        ctx.fillStyle = active ? '#ffffff' : '#21324a';
        ctx.font = 'bold 15px "Segoe UI", sans-serif';
        ctx.fillText(st.label, x + 14, nodeY + 26);
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(st.lib, x + 14, nodeY + 46);
      });

      // ---- life cue row (left half only, so it never collides with the detail inset) ----
      const cueY = 190;
      const cueItems = ['粉层有洞', '整平粉层', '注水萃取', '两杯齐平'];
      const cueGap = 140;
      cueItems.forEach((c, i) => {
        const x = 56 + i * cueGap;
        const active = i === s.stage;
        ctx.fillStyle = active ? '#6f4a2f' : 'rgba(111,74,47,0.35)';
        ctx.beginPath();
        ctx.ellipse(x + 40, cueY, 30, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        if (active) {
          ctx.strokeStyle = GREEN;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(x + 40, cueY, 35, 19, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = active ? '#21324a' : '#68778f';
        ctx.font = '12px "Segoe UI", sans-serif';
        ctx.fillText(c, x + 12, cueY + 34);
      });

      // ---- detail inset ----
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(660, 162, 380, 74);
      ctx.strokeStyle = BORDER;
      ctx.lineWidth = 1;
      ctx.strokeRect(660, 162, 380, 74);
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 14px "Segoe UI", sans-serif';
      ctx.fillText(STAGES[s.stage].lib, 678, 188);
      ctx.font = '13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#68778f';
      ctx.fillText(STAGES[s.stage].output, 678, 214);

      // in-canvas labels (max 2)
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillText('流水线', 56, 44);
      ctx.fillText('产出', 678, 148);
    };

    const tick = () => {
      render(stateRef.current);
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

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="chip-row">
        {STAGES.map((st, i) => (
          <button
            key={st.label}
            type="button"
            className={`chip ${stage === i ? 'selected' : ''}`}
            onClick={() => pick(i)}
          >
            {st.label}
          </button>
        ))}
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default Ch8Mod1;
