import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { useCanvas } from './useCanvas';
import { C, clearScene, grid, text, rrect, arrow, SIGMAS } from './kit';

const W = 680;
const H = 300;

type Stage = {
  title: string;
  sub: string;
  rows: [string, string, string][]; // [label, value, cls]
  fb: { t: string; c: string };
};

const STAGES: Stage[] = [
  {
    title: '① 平滑',
    sub: '零和迁移：激活→权重',
    rows: [
      ['激活峰值', '12 → 2.4（示意）', 'good'],
      ['权重峰值', '2.4 → 12（零和）', 'bad'],
      ['层输出', '不变 X̃W̃ = XW', 'blue'],
    ],
    fb: { t: '平滑用 diag(D) 做零和迁移：激活变干净，代价是权重侧被放大出离群列——为下一步低秩分支创造目标。', c: '' },
  },
  {
    title: '② SVD 分解',
    sub: '残差变平坦',
    rows: [
      ['残差最大奇异值', `σ₁ → σᵣ₊₁（示意谱 ${SIGMAS[0]}→${SIGMAS[5]}）`, 'good'],
      ['低秩分支', '16-bit 精确保留', 'blue'],
      ['残差分支', '交给 4-bit', ''],
    ],
    fb: { t: 'SVD 找最优低秩近似（Eckart–Young）：前 r 个大方向被 16-bit 撑住，剩下的残差已经是「好量化」的平坦分布。', c: 'good' },
  },
  {
    title: '③ 残差 GPTQ',
    sub: '二阶补偿量化',
    rows: [
      ['量化方式', 'RTN → GPTQ', 'blue'],
      ['补偿依据', '二阶（Hessian）信息', 'good'],
      ['常见误读', '「SVDQuant = SVD + RTN」✗', 'bad'],
    ],
    fb: { t: '关键细节：残差不是最近舍入（RTN），而是 GPTQ 逐列量化 + 二阶补偿，把每列误差摊到未量化列上——这是最容易被遗漏的实现细节。', c: 'good' },
  },
  {
    title: '④ 迭代更新',
    sub: '逐层搜索 α',
    rows: [
      ['搜索变量', '平滑强度 α（逐层）', 'blue'],
      ['选择标准', '层输出 MSE 最小', 'good'],
      ['回环', 'α 不理想 → 回到 ①', ''],
    ],
    fb: { t: '整条流水线按候选 α 循环执行，最终每层留下输出 MSE 最小的配置——这就是第五章那条 U 形曲线的实际搜索方式。', c: 'good' },
  },
];

const ST_X = [34, 196, 358, 520];
const ST_W = 126;
const ST_Y = 110;
const ST_H = 66;

export const Ch7Gptq: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const s = STAGES[step];

  const ref = useCanvas(W, H, (ctx) => {
    clearScene(ctx, W, H);
    grid(ctx, 10, 14, W - 20, H - 28, 28);

    // 站点间箭头
    for (let i = 0; i < 3; i++) {
      const done = i < step;
      arrow(ctx, ST_X[i] + ST_W + 4, ST_Y + ST_H / 2, ST_X[i + 1] - 4, ST_Y + ST_H / 2, done ? C.green : C.axis, done ? 2.5 : 2);
    }

    // 迭代回环
    ctx.strokeStyle = step === 3 ? C.orange : C.axis;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(ST_X[3] + ST_W / 2, ST_Y - 12);
    ctx.lineTo(ST_X[3] + ST_W / 2, 54);
    ctx.lineTo(ST_X[0] + ST_W / 2, 54);
    ctx.lineTo(ST_X[0] + ST_W / 2, ST_Y - 12);
    ctx.stroke();
    ctx.setLineDash([]);
    arrow(ctx, ST_X[0] + ST_W / 2, 56, ST_X[0] + ST_W / 2, ST_Y - 12, step === 3 ? C.orange : C.axis, 2);
    text(ctx, 'α 不理想 → 回到 ①（逐层搜索）', W / 2, 44, step === 3 ? C.orange : C.muted, 12.5, 'center');

    // 站点
    STAGES.forEach((st, i) => {
      const x = ST_X[i];
      const state = i < step ? 'done' : i === step ? 'current' : 'todo';
      const fill = state === 'done' ? 'rgba(34,141,92,0.10)' : state === 'current' ? 'rgba(224,122,46,0.10)' : C.white;
      const stroke = state === 'done' ? C.green : state === 'current' ? C.orange : C.muted;
      rrect(ctx, x, ST_Y, ST_W, ST_H, fill, stroke, state === 'current' ? 2.5 : 1.5, 10);
      text(ctx, st.title, x + ST_W / 2, ST_Y + 26, C.ink, 14.5, 'center');
      text(ctx, st.sub, x + ST_W / 2, ST_Y + 48, C.muted, 10.5, 'center');
      if (state === 'done') text(ctx, '✓', x + ST_W - 14, ST_Y + 16, C.green, 14, 'center');
    });

    // 底部：当前阶段的关键变换
    text(ctx, `阶段 ${step + 1} / 4 · ${s.title} — ${s.sub}`, W / 2, 236, C.ink, 13.5, 'center');
    text(ctx, '离线量化流程（每层执行一次）', 24, 30, C.muted, 12);
  });

  return (
    <div>
      <div className="svq-lab">
        <canvas ref={ref} width={W} height={H} />
        <div className="svq-side">
          <h6>{s.title} · 阶段读数（示意）</h6>
          {s.rows.map(([label, value, cls]) => (
            <div className="svq-readout" key={label}>
              <span>{label}</span>
              <b className={cls}>{value}</b>
            </div>
          ))}
          <h6>流水线状态</h6>
          <div className="svq-readout">
            <span>当前阶段</span>
            <b className="blue">{step + 1} / {STAGES.length}</b>
          </div>
          <div className="svq-readout">
            <span>已完成</span>
            <b className="good">{step} 项</b>
          </div>
        </div>
      </div>
      <div className="step-ctrl">
        <button className="tiny ghost" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
          上一步
        </button>
        <span className="step-label">
          <b>{step + 1}</b> / {STAGES.length}
        </span>
        <button className="tiny" onClick={() => setStep(Math.min(STAGES.length - 1, step + 1))} disabled={step === STAGES.length - 1}>
          下一步
        </button>
      </div>
      <div className={`feedback ${s.fb.c}`}>{s.fb.t}</div>
      <p className="concept-note">
        <b>整条流水线只服务一个目标：</b>把离群值从「难量化的主分支」转移到「16-bit 低秩分支」，让 4-bit 只面对平坦残差。
        读数中的峰值数字为示意排布，流程结构为论文离线量化流程。
      </p>
    </div>
  );
};

export default Ch7Gptq;
