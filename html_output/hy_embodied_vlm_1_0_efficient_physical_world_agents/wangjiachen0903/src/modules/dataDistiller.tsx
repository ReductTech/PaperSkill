import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';
import { C, label } from './hyKit';

const W = 560;
const H = 270;

const STAGES = [
  {
    id: 'pretrain', name: '预训练', color: C.blue, x: 100,
    role: '建立广泛视觉接地与通用具身理解',
    input: '完全继承 Hy-Embodied-0.5 预训练混合，不额外改动',
    items: '检测 · 深度 · 分割 · 指向 · 计数 · 空间对应 · 几何 · 可供性 · 轨迹 · 规划 · 通用视觉语言理解',
    output: '产出 θ_pt',
  },
  {
    id: 'sft', name: 'SFT', color: C.orange, x: 280,
    role: '继承 + 新增七类能力导向数据与少量思维链，覆盖全部三个能力层',
    input: '继承上一代高质量 SFT + 七类新增数据 + 少量思维链',
    items: '深度推理 · 任务条件接地/可供性 · 社会交互 · 物体/机器人轨迹 · 因果推理 · 失败感知推理 · VLN',
    output: '产出 θ_sft',
  },
  {
    id: 'rl', name: 'RL', color: C.green, x: 460,
    role: '优先使用可结构化验证的任务；开放式任务由 LLM 裁判兜底',
    input: '多帧空间度量 · 指向/框/可供性 · 2D/3D 轨迹 · 过程排序 · 导航方向 · 开放式推理',
    items: '吸收 Embodied-R1.5 部分数据并按本分类法重组；裁判服务失败才掩码样本',
    output: '产出 θ_rl（非最终模型）',
  },
];

export const DataDistiller: React.FC<WidgetProps> = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ stage: 0 });
  const rafRef = useRef<number | null>(null);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    const render = (s: { stage: number }, t: number) => {
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, W, H);
      label(ctx, '三份配方，分阶段供给同一个模型', W / 2, 20, 13, C.ink);
      STAGES.forEach((st, i) => {
        const selected = i === s.stage;
        const x = st.x;
        // recipe beaker / card
        ctx.fillStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.55)';
        ctx.beginPath();
        ctx.roundRect(x - 66, 44, 132, 182, 12);
        ctx.fill();
        ctx.strokeStyle = selected ? st.color : C.axis;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.beginPath();
        ctx.roundRect(x - 66, 44, 132, 182, 12);
        ctx.stroke();
        // liquid at the bottom: a different mixture for each stage
        ctx.fillStyle = st.color;
        ctx.globalAlpha = 0.16;
        ctx.beginPath();
        ctx.roundRect(x - 60, 170, 120, 50, 8);
        ctx.fill();
        ctx.globalAlpha = 1;
        // drops fall into this recipe, not from another filter
        ctx.fillStyle = st.color;
        for (let d = 0; d < 3; d += 1) {
          const phase = (t * 0.55 + d / 3 + i * 0.33) % 1;
          const y = 52 + phase * 112;
          ctx.globalAlpha = selected ? 0.9 : 0.3;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        label(ctx, st.name, x, 62, 12, selected ? st.color : C.muted);
        label(ctx, st.output, x, 82, 10, selected ? C.ink : C.muted);
        // small item hints
        ctx.fillStyle = selected ? C.ink : C.muted;
        ctx.font = '9px "Segoe UI", "PingFang SC", Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const words = st.items.split(' · ');
        words.slice(0, Math.min(8, words.length)).forEach((wd, j) => {
          ctx.fillText(wd, x, 102 + j * 14);
        });
      });
      label(ctx, 'θ_rl 不是终点：RFT / 第二阶段 RL / 融合见 §5', W / 2, H - 14, 11, C.muted);
    };
    const tick = (now: number) => { render(stateRef.current, now / 1000); if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready'); rafRef.current = requestAnimationFrame(tick); };
    const stop = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };
    const start = () => { if (!rafRef.current) rafRef.current = requestAnimationFrame(tick); };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => { stop(); disconnect(); };
  }, []);

  const choose = (i: number) => { stateRef.current.stage = i; setStage(i); };
  const hit = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    STAGES.forEach((st, i) => {
      if (x > st.x - 70 && x < st.x + 70 && y > 42 && y < 230) choose(i);
    });
  };

  const sel = STAGES[stage];
  return (
    <div>
      <canvas ref={ref} width={W} height={H} style={{ cursor: 'pointer' }} onPointerDown={hit} />
      <div className="chip-row">
        {STAGES.map((st, i) => (
          <button key={st.id} className={i === stage ? 'chip selected' : 'chip'} onClick={() => choose(i)}>{st.name}</button>
        ))}
      </div>
      <div className={`feedback ${stage === 2 ? 'good' : ''}`}>
        <b>{sel.role}：</b>{sel.input}；{sel.items}。
      </div>
    </div>
  );
};

export default DataDistiller;
