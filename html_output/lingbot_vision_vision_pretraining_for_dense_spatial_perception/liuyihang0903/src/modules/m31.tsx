import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';
import type { WidgetProps } from './registry';

// Ch4 Module 1：完整算法流程 —— 12 步闭环技术示意图（分步高亮，辅助讲解）
// 以讲解逻辑为主体：每一步标注它处在闭环的哪个环节，配一句"为什么"。
const W = 560;
const H = 230;

// 12 步闭环（与 完整.md / 流程.md 对齐）
const STEPS = [
  { key: '输入', title: '输入 RGB 图像', desc: '一张彩色图进入系统，是整条链路的起点。', color: '#27446e' },
  { key: '增强', title: '生成多视角 (view)', desc: '裁剪/颜色/翻转增强出 global 与 local 视角；边界目标只在 global view 上生成。', color: '#27446e' },
  { key: 'Teacher', title: 'Teacher 预测边界场', desc: 'EMA 教师（θ̄）对 global view 输出稠密边界场：每个位置预测 (d, θ, φ₁, φ₂)。', color: '#27446e' },
  { key: '分类化', title: '分类化 → 连续几何量', desc: '把 K-bin 概率分布还原成连续量（期望 / circular mean），得到 noisy a_pred(p)。', color: '#7c3aed' },
  { key: '投票', title: '角点 + 投票解码', desc: '每个位置提议 chord，端点吸附最近角点，对角点对投票 → 候选线段。', color: '#d97706' },
  { key: '验证', title: 'a-contrario 验证', desc: 'NFA ≤ 1 才保留，剔除"乱画也能凑出来"的假线 → validated segments。', color: '#c43f52' },
  { key: '重渲染', title: 're-render 干净标签', desc: '纯几何重算支持区内 (d, θ, φ₁, φ₂)，编码为 K-bin soft 目标——不经过网络。', color: '#228d5c' },
  { key: '掩码', title: '边界强制掩码', desc: '验证线段穿过的 patch 组成 B，M⁺ = M ∪ B，学生必须重建被遮边界。', color: '#d97706' },
  { key: '学生', title: 'Student 掩码重建', desc: '学生（θ）看带 M⁺ 掩码的图，凭上下文补出被遮的语义与几何。', color: '#7c3aed' },
  { key: '监督', title: '三路监督', desc: 'CLS → L_DINO、掩码 patch → L_iBOT、边界 → L_bnd，一次反向传播。', color: '#228d5c' },
  { key: '更新', title: '反向传播更新 Student', desc: '梯度只更新 Student（backbone + 各 head），Teacher 全部 stop-gradient。', color: '#7c3aed' },
  { key: 'EMA', title: 'EMA 更新 Teacher', desc: 'θ̄ ← λθ̄ + (1−λ)θ，教师更准 → 下一轮目标更好，形成自举闭环。', color: '#27446e' },
];

// 网格布局：4 行 × 3 列，节点之间画箭头形成闭环
const COLS = 3;
const NODE_W = 168;
const NODE_H = 40;
const OX = 10;
const OY = 16;
const GX = 18;
const GY = 10;

function nodePos(i: number) {
  const r = Math.floor(i / COLS);
  const c = i % COLS;
  return { x: OX + c * (NODE_W + GX), y: OY + r * (NODE_H + GY) };
}

export const M31: React.FC<WidgetProps> = ({ chapterId, moduleId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const [step, setStep] = useState(0);
  const [feedback, setFeedback] = useState({
    text: STEPS[0].desc + ' 点击「下一步」，沿闭环走完一次完整的参数更新。',
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
    const render = (s: number) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f5f8f0';
      ctx.fillRect(0, 0, W, H);

      // 1) 画节点之间的箭头（按顺序连接，最后一个回到第一个，形成闭环）
      for (let i = 0; i < STEPS.length; i++) {
        const from = nodePos(i);
        const to = nodePos((i + 1) % STEPS.length);
        const fx = from.x + NODE_W;
        const fy = from.y + NODE_H / 2;
        const tx = to.x;
        const ty = to.y + NODE_H / 2;
        ctx.strokeStyle = '#9fb0c8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        if (from.y === to.y) {
          ctx.moveTo(fx, fy);
          ctx.lineTo(tx, ty);
        } else {
          const midX = (fx + tx) / 2;
          ctx.moveTo(fx, fy);
          ctx.lineTo(midX, fy);
          ctx.lineTo(midX, ty);
          ctx.lineTo(tx, ty);
        }
        ctx.stroke();
        const ang = Math.atan2(ty - fy, tx - fx);
        ctx.fillStyle = '#9fb0c8';
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - 7 * Math.cos(ang - 0.4), ty - 7 * Math.sin(ang - 0.4));
        ctx.lineTo(tx - 7 * Math.cos(ang + 0.4), ty - 7 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      }

      // 2) 画节点
      STEPS.forEach((st, i) => {
        const p = nodePos(i);
        const active = i === s;
        const done = i < s;
        ctx.fillStyle = active ? st.color : done ? '#eef3ea' : '#ffffff';
        ctx.strokeStyle = active ? st.color : done ? st.color : '#9fb0c8';
        ctx.lineWidth = active ? 3 : 1.4;
        ctx.fillRect(p.x, p.y, NODE_W, NODE_H);
        ctx.strokeRect(p.x + 0.5, p.y + 0.5, NODE_W - 1, NODE_H - 1);
        ctx.fillStyle = active || done ? '#21324a' : '#68778f';
        ctx.font = 'bold 12px "Segoe UI", sans-serif';
        ctx.fillText(`${i + 1}. ${st.key}`, p.x + 8, p.y + 16);
        ctx.font = '10px "Segoe UI", sans-serif';
        ctx.fillText(st.title.slice(0, 20), p.x + 8, p.y + 32);
      });

      // 3) 底部标题
      ctx.fillStyle = '#21324a';
      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillText(`步骤 ${s + 1} / ${STEPS.length}`, 30, H - 8);

      if (!canvas.classList.contains('is-ready')) canvas.classList.add('is-ready');
    };
    const tick = () => {
      render(stateRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    const start = () => {
      if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
    const disconnect = observeCanvas(canvas, start, stop);
    return () => {
      stop();
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stateRef = useRef(0);
  stateRef.current = step;

  const go = (s: number) => {
    stateRef.current = s;
    setStep(s);
    setFeedback({ text: STEPS[s].desc, cls: s === STEPS.length - 1 ? 'good' : '' });
  };

  return (
    <div>
      <canvas id={`cv-${chapterId}-${moduleId}`} ref={canvasRef} width={W} height={H} />
      <div className="ctrl">
        <button className="btn" onClick={() => go(Math.max(0, step - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="val">
          {step + 1} / {STEPS.length}
        </span>
        <button
          className="btn"
          onClick={() => go(step >= STEPS.length - 1 ? 0 : step + 1)}
          disabled={step >= STEPS.length - 1}
        >
          {step >= STEPS.length - 1 ? '重新开始' : '下一步'}
        </button>
      </div>
      <div className={`feedback ${feedback.cls}`}>{feedback.text}</div>
    </div>
  );
};

export default M31;
