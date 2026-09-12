import React, { useEffect, useRef, useState } from 'react';
import { setupCanvas, observeCanvas } from '../lib/canvasKit';

// 第 8 章模块：一次前向背后的两套系统（P5 可点击热点 + P2 步进）。
// 主体：一条固定的滚动数据流（四个阶段）。动词：被逐步推进。
// 目标：看清每个阶段「吃什么、吐什么」，以及 e_B 在哪一步被算出来 / 被用掉。
// 交互：点击画布上的任一阶段切过去，或用下方的上一步/下一步推进。
//     选中阶段的输入/输出/是否用到 e_B 会同步刷新，画布高亮该阶段。
// 语义色：蓝 = 训练系统；紫 = 推理系统；绿 = 用到 e_B 的地方；红 = 危险（未参与）。
const W = 1080;
const H = 280;

type StageId = 'prompt' | 'infer' | 'train' | 'update';

const STAGES: {
  id: StageId;
  title: string;
  short: string;
  x: number;
  w: number;
  color: string;
  accent: string;
  input: string;
  output: string;
  usesEss: boolean;
  desc: string;
  formula?: string;
}[] = [
  {
    id: 'prompt',
    title: 'Prompt 批次',
    short: '一批采样请求',
    x: 26,
    w: 148,
    color: '#27446e',
    accent: '#27446e',
    input: '用户任务 / 题库题目',
    output: '一批待生成的 prompt',
    usesEss: false,
    desc: '训练循环的起点。这里还没有任何策略数据，e_B 无从谈起——它必须等 rollout 采出来才能算。',
  },
  {
    id: 'infer',
    title: '推理系统（生成）',
    short: '按温度采样 K 个回答',
    x: 206,
    w: 200,
    color: '#7c3aed',
    accent: '#7c3aed',
    input: '一批 prompt + 当前策略 π_θ',
    output: 'K 个回答构成的 rollout 数据',
    usesEss: false,
    desc: '推理系统只负责「生成」，它不做任何加权或裁剪。注意：温度、采样配置会直接影响接下来 ρ 分布有多宽——这是 e_B 变化的源头。',
  },
  {
    id: 'train',
    title: '训练系统（算 e_B）',
    short: '算优势、算 ρ、算 e_B',
    x: 438,
    w: 220,
    color: '#228d5c',
    accent: '#228d5c',
    input: '这一批 rollout 数据',
    output: '组相对优势 Aₜ、重要性采样比 ρₜ、这一批的 e_B',
    usesEss: true,
    desc: '整条流水线上唯一额外计算 e_B 的地方。它只对已有的 ρ 做一次聚合统计，不引入任何额外前向，所以代价极低。',
    formula: 'eᴮ = ( Σ ρₜ )² / ( |B| · Σ ρₜ² )',
  },
  {
    id: 'update',
    title: '更新规则（用 e_B）',
    short: '上限与正则都由 e_B 定',
    x: 690,
    w: 200,
    color: '#228d5c',
    accent: '#228d5c',
    input: 'Aₜ、ρₜ、e_B',
    output: '一次参数更新，得到新策略 π_θ',
    usesEss: true,
    desc: 'e_B 在这里被用掉两次：一次决定梯度权重上限 min{ρₜ, eᴮ}，一次决定 KL 正则系数 (1 − eᴮ)。这就是 P3O 与 PPO 的全部差别。',
    formula: 'min{ ρₜ , eᴮ } ,  (1 − eᴮ) · KL',
  },
];

export function MForwardForward() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [active, setActive] = useState<StageId>('prompt');
  const activeRef = useRef(active);
  const tRef = useRef(0);
  activeRef.current = active;

  const idx = STAGES.findIndex((s) => s.id === active);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = setupCanvas(canvas, W, H);
    if (!ctx) return;

    let raf = 0;
    let running = false;

    const box = (
      x: number,
      y: number,
      w: number,
      h: number,
      s: (typeof STAGES)[number],
      isActive: boolean,
      pulse: number
    ) => {
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, w, h, 12) : ctx.rect(x, y, w, h);
      ctx.fillStyle = isActive ? 'rgba(255,255,255,1)' : '#f6f8f4';
      ctx.fill();
      ctx.strokeStyle = isActive ? s.color : '#d7deea';
      ctx.lineWidth = isActive ? 3 : 1.6;
      ctx.stroke();

      // 左强调条
      ctx.beginPath();
      ctx.rect(x, y, 5, h);
      ctx.fillStyle = s.color;
      ctx.fill();

      // 选中脉冲光晕
      if (isActive) {
        ctx.save();
        ctx.globalAlpha = 0.16 + pulse * 0.14;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 15) : ctx.rect(x - 4, y - 4, w + 8, h + 8);
        ctx.stroke();
        ctx.restore();
      }

      ctx.textAlign = 'left';
      ctx.fillStyle = isActive ? '#21324a' : '#68778f';
      ctx.font = `${isActive ? 700 : 600} 13px system-ui, sans-serif`;
      ctx.fillText(s.title, x + 16, y + 28);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      s.short.split('\n').forEach((l, i) => ctx.fillText(l, x + 16, y + 50 + i * 15));

      // 用到 e_B 的阶段挂一个小绿标
      if (s.usesEss) {
        const bx = x + w - 42;
        const by = y + 12;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(bx, by, 32, 17, 8) : ctx.rect(bx, by, 32, 17);
        ctx.fillStyle = isActive ? '#228d5c' : 'rgba(34,141,92,0.16)';
        ctx.fill();
        ctx.fillStyle = isActive ? '#fff' : '#228d5c';
        ctx.font = '700 10px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('e_B', bx + 16, by + 12.5);
      }
    };

    const render = () => {
      tRef.current += 1;
      const t = tRef.current;
      ctx.clearRect(0, 0, W, H);

      const yMid = 148;
      const pulse = (Math.sin(t * 0.07) + 1) / 2;

      STAGES.forEach((s, i) => {
        const isActive = activeRef.current === s.id;
        box(s.x, yMid - 40, s.w, 80, s, isActive, pulse);

        // 连接箭头
        if (i < STAGES.length - 1) {
          const x1 = s.x + s.w;
          const x2 = STAGES[i + 1].x;
          const passed = i < idx;
          ctx.beginPath();
          ctx.moveTo(x1 + 6, yMid);
          ctx.lineTo(x2 - 10, yMid);
          ctx.strokeStyle = passed ? '#228d5c' : '#d7deea';
          ctx.lineWidth = 2.2;
          ctx.stroke();

          // 箭头头
          ctx.beginPath();
          ctx.moveTo(x2 - 10, yMid);
          ctx.lineTo(x2 - 18, yMid - 5);
          ctx.lineTo(x2 - 18, yMid + 5);
          ctx.closePath();
          ctx.fillStyle = passed ? '#228d5c' : '#d7deea';
          ctx.fill();

          // 数据包沿箭头移动
          if (isActive || passed) {
            const px = x1 + 6 + (x2 - 10 - (x1 + 6)) * pulse;
            ctx.beginPath();
            ctx.arc(px, yMid, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = passed ? '#228d5c' : s.color;
            ctx.globalAlpha = 0.9;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      });

      // 末尾：新策略
      const last = STAGES[STAGES.length - 1];
      const nx = last.x + last.w + 22;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(nx, yMid - 34, 100, 68, 12) : ctx.rect(nx, yMid - 34, 100, 68);
      ctx.fillStyle = '#f4f7fb';
      ctx.fill();
      ctx.strokeStyle = '#d7deea';
      ctx.lineWidth = 1.6;
      ctx.stroke();
      ctx.fillStyle = '#27446e';
      ctx.font = '700 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('新策略 π_θ', nx + 50, yMid - 4);
      ctx.fillStyle = '#68778f';
      ctx.font = '500 10px system-ui, sans-serif';
      ctx.fillText('回到推理', nx + 50, yMid + 14);

      ctx.beginPath();
      ctx.moveTo(last.x + last.w + 6, yMid);
      ctx.lineTo(nx - 6, yMid);
      ctx.strokeStyle = idx === STAGES.length - 1 ? '#228d5c' : '#d7deea';
      ctx.lineWidth = 2.2;
      ctx.stroke();

      // 回环虚线
      ctx.save();
      ctx.setLineDash([7, 7]);
      ctx.beginPath();
      ctx.moveTo(nx + 50, yMid + 34);
      ctx.lineTo(nx + 50, 244);
      ctx.lineTo(100, 244);
      ctx.lineTo(100, yMid + 40);
      ctx.strokeStyle = '#b8c9a7';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#76906a';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('下一轮：新数据会让 e_B 重新算一遍', 470, 264);

      // 顶部提示
      ctx.fillStyle = '#68778f';
      ctx.font = '500 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('点击任意阶段查看它的输入与输出 · 绿色 e_B 标记表示该阶段用到 e_B', 26, 32);

      // 阶段序号
      STAGES.forEach((s, i) => {
        ctx.beginPath();
        ctx.arc(s.x + s.w - 16, yMid + 30, 11, 0, Math.PI * 2);
        ctx.fillStyle = i <= idx ? s.color : '#e6ecdf';
        ctx.fill();
        ctx.fillStyle = i <= idx ? '#fff' : '#68778f';
        ctx.font = '700 11px ui-monospace, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), s.x + s.w - 16, yMid + 34);
      });
    };

    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      canvas.classList.add('is-ready');
      raf = requestAnimationFrame(tick);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    // 点击拾取：把 CSS 坐标换算回画布坐标
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const yMid = 148;
      STAGES.forEach((s) => {
        if (mx >= s.x && mx <= s.x + s.w && my >= yMid - 40 && my <= yMid + 40) {
          setActive(s.id);
        }
      });
    };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const yMid = 148;
      const hit = STAGES.some(
        (s) => mx >= s.x && mx <= s.x + s.w && my >= yMid - 40 && my <= yMid + 40
      );
      canvas.style.cursor = hit ? 'pointer' : 'default';
    };

    canvas.addEventListener('click', onClick);
    canvas.addEventListener('mousemove', onMove);

    const unobserve = observeCanvas(canvas, start, stop);
    render();
    return () => {
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
      unobserve();
      stop();
    };
  }, []);

  const s = STAGES[idx];

  return (
    <div className="module-body">
      <canvas ref={ref} id="cv-forward-forward" width={W} height={H} />

      <div className="chip-row">
        {STAGES.map((st, i) => (
          <button
            key={st.id}
            className={`chip ${active === st.id ? 'selected' : ''}`}
            onClick={() => setActive(st.id)}
          >
            {i + 1}. {st.title}
          </button>
        ))}
      </div>

      <div className="step-ctrl">
        <button className="step-btn" onClick={() => setActive(STAGES[Math.max(0, idx - 1)].id)} disabled={idx === 0}>
          ← 上一步
        </button>
        <span className="step-label">
          <b>{idx + 1}</b> / {STAGES.length} · {s.title}
        </span>
        <button
          className="step-btn"
          onClick={() => setActive(STAGES[Math.min(STAGES.length - 1, idx + 1)].id)}
          disabled={idx === STAGES.length - 1}
        >
          下一步 →
        </button>
      </div>

      <div className="compare-row">
        <div className="compare-col">
          <div className="compare-label" style={{ color: 'var(--ink-2)' }}>
            这一阶段吃什么
          </div>
          <div className="io-panel">{s.input}</div>
        </div>
        <div className="compare-col">
          <div className="compare-label" style={{ color: s.usesEss ? 'var(--green)' : 'var(--ink-2)' }}>
            吐什么 {s.usesEss ? '· 用到 e_B' : ''}
          </div>
          <div className={`io-panel ${s.usesEss ? 'is-ess' : ''}`}>{s.output}</div>
        </div>
      </div>

      {s.formula ? (
        <div className="algo-formula" style={{ textAlign: 'center', margin: '10px 0' }}>
          {s.formula}
        </div>
      ) : null}

      <div className={`feedback ${s.usesEss ? 'good' : ''}`}>
        <b>{s.title}：</b>
        {s.desc}
      </div>
    </div>
  );
}
