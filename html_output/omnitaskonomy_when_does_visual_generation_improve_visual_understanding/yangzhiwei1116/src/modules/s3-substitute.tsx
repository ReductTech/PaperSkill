import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  bg: '#f5f8f0', wood: '#92400e', woodSoft: '#f3e6d2', envL: '#b8c9a7', envD: '#76906a',
  blue: '#27446e', green: '#228d5c', red: '#c43f52', orange: '#f07e47', purple: '#7c3aed',
  ink: '#21324a', muted: '#68778f', line: '#d7deea',
};

type TaskId = 'jigsaw' | 'zoomin';
const TASKS: { id: TaskId; label: string; equiv: number; pretty: string }[] = [
  { id: 'jigsaw', label: 'Jigsaw（打乱图像块）', equiv: 3, pretty: 'Jigsaw' },
  { id: 'zoomin', label: 'Zoom-In（打乱缩放视图）', equiv: 1, pretty: 'Zoom-In' },
];
const BUDGETS = [1, 3, 10, 30];

const widthOf = (thousands: number) => 116 + 198 * Math.log10(thousands);

export function S3Substitute(_props: WidgetProps) {
  const [taskId, setTaskId] = useState<TaskId>('jigsaw');
  const [budget, setBudget] = useState(3);
  const task = TASKS.find((item) => item.id === taskId)!;
  const matched = budget === task.equiv;
  const tone = matched ? C.green : C.blue;

  const feedback = matched
    ? `论文报告：100k I2I + ${budget}k I2T 达到只用 10k I2T 的可比水平。`
    : budget < task.equiv
      ? `讲解更少：论文报告四个 I2T 预算（1k/3k/10k/30k）全都提升；${task.pretty} 的对标点是 ${task.equiv}k。`
      : '讲解更多：论文仍报告提升，但替代意义变小——预算越小，I2I 带来的增益越大。';

  return (
    <div style={{ display: 'flex', gap: 30, width: 1472, height: 622 }}>
      <div style={{ width: 800, background: C.bg, border: `2px solid ${C.line}`, borderRadius: 18 }}>
        <svg viewBox="0 0 800 560" width="800" height="560" role="img"
          aria-label={`${task.pretty} 任务下，100k 生成样本加 ${budget}k 讲解样本，与只用 10k 讲解样本的比较`}>
          <text x="32" y="46" fontSize="28" fill={C.ink}>备料：100k 生成样本（I2I）</text>
          <g>
            {Array.from({ length: 14 }).map((_, index) => (
              <rect key={index} x={34 + index * 15} y={86 - (index % 3) * 3} width="12" height={64 + (index % 3) * 3} rx="3"
                fill={C.woodSoft} stroke={C.wood} strokeWidth="1.6" />
            ))}
            <rect x="250" y="86" width="290" height="64" rx="12" fill={C.blue} opacity=".08" stroke={C.blue} strokeWidth="2" />
            <text x="266" y="126" fontSize="26" fill={C.blue}>做这批活不额外花讲解数据</text>
          </g>
          <text x="32" y="204" fontSize="28" fill={C.ink}>讲解样本（I2T）要多少？</text>

          <g>
            <text x="32" y="266" fontSize="24" fill={C.muted}>只用 I2T</text>
            <rect x="170" y="242" width={widthOf(10)} height="34" rx="8" fill={C.green} opacity=".22" stroke={C.green} strokeWidth="2" />
            <text x={170 + widthOf(10) + 12} y="266" fontSize="24" fill={C.green}>10k</text>
            <text x="32" y="336" fontSize="24" fill={C.muted}>I2I → I2T</text>
            <rect x="170" y="312" width={widthOf(budget)} height="34" rx="8" fill={tone} opacity=".22" stroke={tone} strokeWidth="2" />
            <text x={170 + widthOf(budget) + 12} y="336" fontSize="24" fill={tone}>{budget}k</text>
            <line x1="170" y1="360" x2="700" y2="360" stroke={C.line} strokeWidth="2" />
            {[1, 3, 10, 30].map((value) => (
              <g key={value}>
                <line x1={170 + widthOf(value)} y1="360" x2={170 + widthOf(value)} y2="370" stroke={C.muted} strokeWidth="2" />
                <text x={170 + widthOf(value)} y="390" fontSize="20" fill={C.muted} textAnchor="middle">{value}k</text>
              </g>
            ))}
            <text x="170" y="420" fontSize="22" fill={C.muted}>讲解样本量（对数刻度，条长仅便于阅读）</text>
          </g>

          <g>
            <rect x="32" y="446" width="736" height="86" rx="14" fill={matched ? 'rgba(34,141,92,.10)' : 'rgba(39,68,110,.07)'}
              stroke={matched ? C.green : C.blue} strokeWidth="2" />
            <text x="52" y="480" fontSize="26" fill={C.ink}>
              {matched ? `${task.pretty}：讲解只需 ${budget}k，达到 10k 的可比水平` : `${task.pretty}：当前讲解预算 ${budget}k，对标点是 ${task.equiv}k`}
            </text>
            <text x="52" y="512" fontSize="22" fill={C.muted}>“可比”指性能相当，不是严格相等；I2I 预算固定 100k，3 个种子平均。</text>
          </g>
        </svg>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 26, color: C.muted }}>选择任务</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {TASKS.map((item) => (
            <button key={item.id} type="button" onClick={() => { setTaskId(item.id); setBudget(item.equiv); }}
              style={{
                textAlign: 'left', padding: '14px 18px', borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 26, color: C.ink, background: item.id === taskId ? 'rgba(240,126,71,.10)' : '#fff',
                border: `2px solid ${item.id === taskId ? C.orange : C.line}`,
              }}>{item.label}</button>
          ))}
        </div>
        <div style={{ fontSize: 26, color: C.muted, marginTop: 6 }}>选择 I2T 讲解预算</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {BUDGETS.map((value) => (
            <button key={value} type="button" onClick={() => setBudget(value)}
              style={{
                flex: 1, padding: '12px 0', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 26,
                color: C.ink, background: value === budget ? 'rgba(39,68,110,.10)' : '#fff',
                border: `2px solid ${value === budget ? C.blue : C.line}`,
              }}>{value}k</button>
          ))}
        </div>
        <div style={{ padding: '18px 22px', borderRadius: 16, background: '#fff', border: `2px solid ${tone}`, fontSize: 26, lineHeight: 1.5, color: C.ink }}>
          {feedback}
          <div style={{ fontSize: 21, color: C.muted, marginTop: 6 }}>
            {budget < 10
              ? `相比只用 10k 讲解，这条路径只用了 ${budget}k 讲解 + 100k 生成。`
              : `讲解预算已不少于对标点，替代收益不再是这张图的重点。`}
          </div>
        </div>
        <div style={{ padding: '16px 20px', borderRadius: 16, background: '#fff', border: `2px solid ${C.line}`, fontSize: 22, lineHeight: 1.5, color: C.muted, flex: 1 }}>
          四个预算（1k / 3k / 10k / 30k）论文都报告了提升；讲解预算越紧，I2I 带来的增益越大。30k 一档仍提升，但“替代”的意义变小。
        </div>
      </div>
    </div>
  );
}
