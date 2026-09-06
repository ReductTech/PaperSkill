import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 论文 Table 1/2（Qwen3-8B，同 KV 预算）
const TABLE = [
  { method: 'Full Attention', aime24: 57.1, aime25: 40.8, math500: 69.6, note: '完整注意力，不剪枝，作为参考上界（Table 1/2）。' },
  { method: 'SnapKV', aime24: 34.6, aime25: 20.0, math500: 49.2, note: '基于最近窗口注意力的压缩基线（Table 1/2）。' },
  { method: 'R-KV', aime24: 25.4, aime25: 17.5, math500: 46.4, note: '最近的压缩基线，观察窗口更小（Table 1/2）。' },
  { method: 'TriAttention', aime24: 42.1, aime25: 32.9, math500: 56.0, tri: true, note: '同预算下最好：AIME25 32.9%，比 R-KV 高 15.4 点，接近 Full（Table 1/2）。' },
];

const ANALYSIS = [
  ['同预算对比', 'AIME25 上 TriAttention 32.9%，接近不剪枝的 Full Attention（40.8%），远高于 SnapKV（20.0%）与 R-KV（17.5%）；MATH500 56.0 也明显好于两个基线。'],
  ['说明什么', '"只留未来会被关注的 Key" 的策略有效：同预算下接近完整注意力，远胜只靠最近查询观察窗口的基线。'],
  ['效率收益', '匹配 Full Attention 精度时，TriAttention 吞吐提升 2.5 倍、KV 内存省约 10.7 倍（Table 4 / Figure 1）。'],
  ['边界与局限', '需要专用推理内核加速；论文评估尚未覆盖编码与智能体任务；按头预算留作未来工作。'],
];

// 8.4：实验结果分析 —— 论文真实成绩表 + 解读。
export const M101: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#eef3fb' }}>
              <th style={{ padding: '8px 10px', border: '1px solid #d7deea', textAlign: 'left' }}>方法（Qwen3-8B，同预算）</th>
              <th style={{ padding: '8px 10px', border: '1px solid #d7deea' }}>AIME24</th>
              <th style={{ padding: '8px 10px', border: '1px solid #d7deea' }}>AIME25</th>
              <th style={{ padding: '8px 10px', border: '1px solid #d7deea' }}>MATH500</th>
            </tr>
          </thead>
          <tbody>
            {TABLE.map((r, i) => (
              <tr key={r.method} onClick={() => setSel(sel === i ? null : i)}
                style={{ cursor: 'pointer', background: r.tri ? '#eefaf1' : i % 2 ? '#fafbfc' : '#fff' }}>
                <td style={{ padding: '8px 10px', border: '1px solid #d7deea', fontWeight: r.tri ? 700 : 400, color: r.tri ? '#1e6b3c' : '#21324a' }}>{r.method}{r.tri ? ' ⭐' : ''}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #d7deea', textAlign: 'center' }}>{r.aime24}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #d7deea', textAlign: 'center' }}>{r.aime25}</td>
                <td style={{ padding: '8px 10px', border: '1px solid #d7deea', textAlign: 'center' }}>{r.math500}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sel !== null ? (
        <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: '#eef3fb', fontSize: 13, color: '#21324a' }}>{TABLE[sel].note}</div>
      ) : null}

      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ANALYSIS.map(([t, d]) => (
          <div key={t} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid #d7deea', background: '#fff' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#21324a' }}>{t}</div>
            <div style={{ fontSize: 13, color: '#4a5568', marginTop: 4, lineHeight: 1.6 }}>{d}</div>
          </div>
        ))}
      </div>

      <div className="feedback guide">
        数据来自论文 Table 1/2（Qwen3-8B，同 KV 预算）；其他模型（DS-Llama、DS-Qwen、GPT-OSS）结论一致。点击表格行查看说明。
      </div>
    </div>
  );
};

export default M101;