import React, { useState } from 'react';
import type { WidgetProps } from './registry';
import { Feedback } from './kit';

// Lab 10.1 — Benchmark Explorer。
// 六个基准，各显示：协议、指标、First/Final 定义、主要结果与局限。
// 数字只在同一协议内对齐——读表先读协议。

interface BarDef {
  label: string;
  value: number;
  ours?: boolean;
}

interface GroupDef {
  name: string;
  unit?: string;
  bars: BarDef[];
}

interface BenchDef {
  id: string;
  name: string;
  tier: 'Game' | 'Simulation';
  protocol: string;
  metric: string;
  firstFinal: string | null;
  groups: GroupDef[];
  limit: string;
}

const BENCHES: BenchDef[] = [
  {
    id: 'optimus',
    name: 'Optimus-67',
    tier: 'Game',
    protocol: '67 个 Minecraft 长程任务 · 7 个难度组 · 基线在同设置下复现',
    metric: 'Success Rate（± std）',
    firstFinal: null,
    groups: [
      {
        name: 'RedStone 组',
        bars: [
          { label: 'PhyAgentOS', value: 30, ours: true },
          { label: 'Optimus-3', value: 29 },
          { label: 'Optimus-2', value: 28 },
        ],
      },
      {
        name: 'Diamond 组',
        bars: [
          { label: 'PhyAgentOS', value: 19, ours: true },
          { label: '最强基线', value: 15 },
        ],
      },
    ],
    limit: 'Gold 0.06 / Armor 0.15：终局装备生产仍是前沿；RedStone 的优势归因（Verifier / Memory / 配方复用）需要更细粒度消融支撑。',
  },
  {
    id: 'stardojo',
    name: 'StarDojo',
    tier: 'Game',
    protocol: 'Lite-100 · deepseek-v4-flash（text-only）',
    metric: 'Success Rate',
    firstFinal: null,
    groups: [
      {
        name: '总体',
        bars: [
          { label: 'PhyAgentOS', value: 22.0, ours: true },
          { label: 'SPIKE（最强基线）', value: 18.0 },
        ],
      },
      {
        name: 'Crafting 能力',
        bars: [
          { label: 'PhyAgentOS', value: 50.0, ours: true },
          { label: '最强基线', value: 23.8 },
        ],
      },
    ],
    limit: 'Easy 37.5% / Medium 3.7% / Hard 0.0%——总分领先不等于困难任务被解决；Social 仅 8.0%。',
  },
  {
    id: 'dst',
    name: 'DST-Dojo',
    tier: 'Game',
    protocol: 'Don’t Starve · 秋季 Day 0 · 白天 · 10 episodes · Raw LLM vs +PhyAgentOS',
    metric: '生存',
    firstFinal: null,
    groups: [
      {
        name: '平均生存天数',
        unit: ' 天',
        bars: [
          { label: 'Raw LLM', value: 1.02 },
          { label: '+ PhyAgentOS', value: 2.1, ours: true },
        ],
      },
      {
        name: '第 3 天存活率',
        bars: [
          { label: 'Raw LLM', value: 0 },
          { label: '+ PhyAgentOS', value: 30, ours: true },
        ],
      },
    ],
    limit: '平均生存约 +106%，但死因仍是黑暗（Charlie 80%）；Health/Hunger/Sanity 均值更低是「活得更久」的副作用——不能机械地读成能力退化。',
  },
  {
    id: 'libero',
    name: 'LIBERO',
    tier: 'Simulation',
    protocol: '4 个 policy backend · Agent-assisted validation',
    metric: 'Success Rate（%）',
    firstFinal: 'First = 策略第一次原始尝试；Final = 失败后允许 verifier 触发受控恢复的结果。不改权重、不重置任务目标、不放宽成功标准。',
    groups: [
      {
        name: 'OpenVLA',
        bars: [
          { label: 'First', value: 74.5 },
          { label: 'Final', value: 75.5, ours: true },
        ],
      },
      {
        name: 'π₀',
        bars: [
          { label: 'First', value: 92.8 },
          { label: 'Final', value: 93.2, ours: true },
        ],
      },
      {
        name: 'π₀.₅',
        bars: [
          { label: 'First', value: 97.0 },
          { label: 'Final', value: 97.8, ours: true },
        ],
      },
      {
        name: 'X-VLA',
        bars: [
          { label: 'First', value: 97.3 },
          { label: 'Final', value: 98.6, ours: true },
        ],
      },
    ],
    limit: '四个后端全部提升但幅度有限（+0.4 ~ +1.3pt）：原始成功率已很高，可恢复失败样本少——天花板效应明显。',
  },
  {
    id: 'calvin',
    name: 'CALVIN ABC→D',
    tier: 'Simulation',
    protocol: '每个 episode 5 个连续子任务 · 子任务之间不 reset · 误差向后传播',
    metric: '5/5 全链完成率（%）',
    firstFinal: '同 LIBERO 的 First / Final 定义。',
    groups: [
      {
        name: 'X-VLA',
        bars: [
          { label: 'First', value: 74.3 },
          { label: 'Final', value: 75.7, ours: true },
        ],
      },
      {
        name: 'π₀',
        bars: [
          { label: 'First', value: 38.9 },
          { label: 'Final', value: 45.6, ours: true },
        ],
      },
      {
        name: 'π₀.₅',
        bars: [
          { label: 'First', value: 85.3 },
          { label: 'Final', value: 89.4, ours: true },
        ],
      },
    ],
    limit: 'π₀ +6.7pt 增益最大：长程链里「中途偏差 + 缺少及时恢复」的可挽回空间也最大。恢复付出的推理与时间成本未被讨论。',
  },
  {
    id: 'robocasa',
    name: 'RoboCasa365',
    tier: 'Simulation',
    protocol: '厨房家庭环境 · 250 episodes · 18 atomic skills + 32 composite activities · 铰链物体 / 杂乱 / 多视角',
    metric: 'Episode Success Rate（%）',
    firstFinal: '同 LIBERO 的 First / Final 定义。',
    groups: [
      {
        name: 'π₀.₅（救回 23 个）',
        bars: [
          { label: 'First', value: 17.6 },
          { label: 'Final', value: 26.8, ours: true },
        ],
      },
      {
        name: 'RLDX-1（救回 18 个）',
        bars: [
          { label: 'First', value: 35.6 },
          { label: 'Final', value: 42.8, ours: true },
        ],
      },
      {
        name: 'WorldDreamer（救回 21 个）',
        bars: [
          { label: 'First', value: 34.0 },
          { label: 'Final', value: 42.4, ours: true },
        ],
      },
    ],
    limit: '增益（+7.2 ~ +9.2pt）远大于 LIBERO：环境越复杂 → 原始失败越多 → 其中可恢复的部分越多。增益大小取决于失败结构，不能外推到简单环境。',
  },
];

export const BenchmarkLab: React.FC<WidgetProps> = () => {
  const [idx, setIdx] = useState(0);
  const b = BENCHES[idx];

  let tone: '' | 'good' | 'bad' | 'info' = 'info';
  let msg =
    b.tier === 'Game'
      ? 'Game 基准里没有 First/Final 之分——比的是完整系统与基线。注意每个基准的指标方向与单位。'
      : '仿真基准看 First / Final 两根柱子：Final − First 度量的是「验证 + 恢复挽救了多少原本失败的执行」，不是模型本身变强。';

  return (
    <div className="lab bl-lab">
      <div className="lab-controls lab-controls-top">
        <div className="lab-choice-group lab-choice-wrap">
          <span className="lab-choice-label">基准</span>
          {BENCHES.map((x, i) => (
            <button type="button" key={x.id} className={`lab-chip ${idx === i ? 'is-active' : ''}`} onClick={() => setIdx(i)}>
              {x.name}
            </button>
          ))}
        </div>
      </div>

      <div className="lab-stage" key={b.id}>
        <div className="lab-chart-head">
          <span className={`lab-chart-protocol ${b.tier === 'Game' ? 'is-game' : 'is-sim'}`}>{b.tier} Tier</span>
          <span className="lab-chart-metric">指标：{b.metric}</span>
        </div>
        <div className="lab-chart-protocol-line">协议：{b.protocol}</div>

        {b.firstFinal ? (
          <div className="bl-firstfinal">
            <b>First / Final 定义</b>
            {b.firstFinal}
          </div>
        ) : null}

        <div className="lab-chart">
          {b.groups.map((g) => {
            const max = Math.max(...g.bars.map((x) => x.value), 1);
            return (
              <div className="lab-chart-group" key={g.name}>
                <div className="lab-chart-name">{g.name}</div>
                <div className="lab-chart-bars">
                  {g.bars.map((bar) => (
                    <div className="lab-chart-bar-row" key={bar.label}>
                      <span className="bl-bar-label">{bar.label}</span>
                      <div className="lab-chart-bar">
                        <i
                          className={bar.ours ? 'is-ours' : ''}
                          style={{ width: `${Math.max(2, (bar.value / max) * 100)}%` }}
                        />
                      </div>
                      <span className={`lab-chart-val ${bar.ours ? 'is-ours' : ''}`}>
                        {bar.value.toFixed(bar.value % 1 === 0 ? 0 : 1)}
                        {g.unit ?? '%'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="lab-chart-limit">
          <span className="lab-chart-limit-label">局限</span>
          {b.limit}
        </div>
      </div>

      <Feedback tone={tone}>{msg}</Feedback>
    </div>
  );
};

export default BenchmarkLab;
