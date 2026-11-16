import React, { useState } from 'react';
import { C, Mic, PageFrame } from './studioKit';
import './studio.css';

const STAGES = [
  {
    key: 'stage1',
    title: '阶段Ⅰ · 保隙训练',
    body: '用 LoRA 微调骨干，同时训练分类头（旧类权重随数据更新）：每个 epoch 量一次 neg，Δ 过 α 就停，后续任务沿用这个轮数。',
  },
  {
    key: 'stage2',
    title: '阶段Ⅱ · 建视觉分类器',
    body: '冻结骨干与旧类权重；新类用类原型初始化 W_v，只用图像特征训练 3 个 epoch。',
  },
  {
    key: 'stage3',
    title: '推理 · 两路合分',
    body: 'pre(x) = f_clip(x,t) + β·softmax(W_vᵀx)，β=4；两路分数相加后取最大。',
  },
  {
    key: 'stage4',
    title: '开销 · 只有一点点',
    body: '0.54M 可学习参数，无回放缓存；额外计算只在首任务每 epoch 多一次前向（不含反向）。',
  },
];

/** p8：两阶段 + 推理的管线（按 Fig.4 的模块顺序重绘成“台面上的两台机器”）。 */
export function MgPipeline() {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage];

  const box = (x: number, y: number, w: number, h: number, label: string, sub: string, on: boolean, color = C.blue) => (
    <g opacity={on ? 1 : 0.42}>
      <rect x={x} y={y} width={w} height={h} rx={12} fill={on ? '#fbfcf9' : '#f1f3f7'} stroke={on ? color : C.line} strokeWidth={on ? 3 : 2} />
      <text x={x + w / 2} y={y + h / 2 - 4} textAnchor="middle" fontSize={21} fill={on ? C.ink : C.muted} fontWeight={600}>{label}</text>
      <text x={x + w / 2} y={y + h / 2 + 26} textAnchor="middle" fontSize={17} fill={C.muted}>{sub}</text>
    </g>
  );

  return (
    <PageFrame
      scene={
        <svg viewBox="0 0 900 560" role="img" aria-label={`流程第 ${stage + 1} 步：${s.title}`}>
          <rect x="0" y="0" width="900" height="560" fill={C.bg} />
          <rect x="0" y="470" width="900" height="90" fill={C.wood} opacity="0.14" />
          <path d="M0 470 H900" stroke={C.wood} strokeWidth="3" opacity="0.5" />

          {box(50, 60, 210, 92, '图像编码器', stage === 0 ? '训练 LoRA(K/V, r=8)' : '冻结，仍参与前向', true, C.blue)}
          {box(50, 190, 210, 92, '文本编码器', '冻结', true, C.blue)}
          {box(50, 330, 210, 92, '旧类权重', stage >= 1 ? '冻结（仍参与推理）' : '随训练更新', true, C.blue)}

          {box(360, 60, 210, 92, '视觉分类器 W_v', stage >= 1 ? '新类可用' : '未建立', stage >= 1, C.green)}
          {box(360, 190, 210, 92, '文本分类器', '类名相似度', true, C.blue)}
          {box(360, 330, 210, 92, '合分', stage >= 2 ? 'f + β·softmax' : '尚未启用', stage >= 2, C.orange)}

          <path d="M260 106 H360" stroke={C.line} strokeWidth={4} markerEnd="" strokeDasharray={stage >= 1 ? '0' : '8 6'} />
          <path d="M260 236 H360" stroke={C.line} strokeWidth={4} />
          <path d="M570 106 Q640 106 640 236 T570 376" fill="none" stroke={stage >= 2 ? C.orange : C.line} strokeWidth={4} strokeDasharray={stage >= 2 ? '0' : '8 6'} />
          <path d="M570 236 H640" stroke={stage >= 2 ? C.orange : C.line} strokeWidth={4} strokeDasharray={stage >= 2 ? '0' : '8 6'} />

          <g>
            <text x={660} y={300} fontSize={22} fill={C.ink}>pre(x)</text>
            <text x={660} y={334} fontSize={19} fill={C.muted}>{stage >= 2 ? '两路相加后取最大' : '仅文本分类器（尚无补偿）'}</text>
            <text x={660} y={386} fontSize={25} fontWeight={700} fill={stage >= 2 ? C.green : C.red}>
              {stage >= 2 ? '新类可判对' : '新类被压住'}
            </text>
          </g>

          <Mic x={250} y={430} s={0.5} color={C.green} hang={false} active={stage >= 1} />
          <text x={390} y={452} fontSize={19} fill={C.muted}>阶段Ⅰ 的额外开销：每 epoch 一次前向，量 neg</text>
          {stage === 3 ? (
            <g>
              <rect x={600} y={60} width={250} height={120} rx={12} fill="#eaf5ee" stroke={C.green} strokeWidth={2} />
              <text x={725} y={104} textAnchor="middle" fontSize={22} fill={C.green} fontWeight={700}>0.54M</text>
              <text x={725} y={140} textAnchor="middle" fontSize={18} fill={C.muted}>可学习参数，无回放缓存</text>
            </g>
          ) : null}

          <text x={24} y={530} fontSize={21} fill={C.muted}>切换步骤：看清每个阶段冻住了谁、训练了谁</text>
        </svg>
      }
      side={
        <>
          <div className="studio-row">
            {STAGES.map((item, i) => (
              <button key={item.key} className={`studio-btn ${stage === i ? 'is-on' : ''}`} onClick={() => setStage(i)} aria-pressed={stage === i}>
                {i + 1}
              </button>
            ))}
          </div>
          <div className="studio-panel">
            <h4>{s.title}</h4>
            <p style={{ margin: 0 }}>{s.body}</p>
          </div>
          <div className="studio-kv">
            <span>骨干</span><b>{stage === 0 ? '训练 LoRA' : '全冻结'}</b>
            <span>旧类权重</span><b>{stage >= 1 ? '冻结' : '更新（分类头）'}</b>
            <span>推理</span><b>{stage >= 2 ? '文本 + β·视觉' : '仅文本'}</b>
          </div>
          <div className="studio-src">
            Fig.4 的两阶段与推理合分；§4.2 保持、§4.3 补偿、Eq.(5) 合分、§5.4 参数量。
            图中线缆与配色为教程重绘，模块顺序依 Fig.4。
          </div>
        </>
      }
    />
  );
}
