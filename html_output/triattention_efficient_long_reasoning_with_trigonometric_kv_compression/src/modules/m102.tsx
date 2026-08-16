import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const ITEMS = [
  { key: 'R', label: '头部浓度高，R 接近 1', why: '浓度低时中心不可靠，距离偏好分不准。' },
  { key: 'gqa', label: '模型使用 GQA 架构', why: '论文主要验证 GQA 与 MLA；方法依赖多个查询头共享 KV。' },
  { key: 'math', label: '任务以长链推理为主', why: '主评测是 AIME、MATH 500 等长链数学推理。' },
  { key: 'calib', label: '能接受一次离线校准', why: '需要先跑一小段校准文本统计 Q/K 中心等统计量。' },
  { key: 'kernel', label: '能接受专用推理内核', why: '论文指出专用内核还能进一步提速，目前是局限之一。' },
];

export const M102: React.FC<WidgetProps> = () => {
  const [yes, setYes] = useState<Record<string, boolean>>({});
  const yesCount = ITEMS.filter((it) => yes[it.key]).length;
  const verdict =
    yesCount === ITEMS.length ? '很适合：这些条件都满足，收益最大。' :
    yesCount >= 3 ? '基本适用：核心条件满足，收益可能略打折扣。' :
    '要谨慎：方法的效果依赖这些条件，建议先小范围验证。';

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ITEMS.map((it) => (
          <div key={it.key} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 10, border: '1px solid #d7deea', background: '#fff' }}>
            <span style={{ flex: 1, fontSize: 14, color: '#21324a' }}>{it.label}</span>
            <button
              className="chip"
              style={yes[it.key] ? { borderColor: '#228d5c', background: '#228d5c', color: '#fff' } : { borderColor: '#d7deea', background: '#fff', color: '#68778f' }}
              onClick={() => setYes((p) => ({ ...p, [it.key]: !p[it.key] }))}
            >
              {yes[it.key] ? '✓ 满足' : '不满足'}
            </button>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#68778f' }}>
        已满足 {yesCount}/{ITEMS.length} 项。{ITEMS.filter((it) => !yes[it.key]).slice(0, 1).map((it) => `提示：${it.why}`)}
      </div>
      <div className={`feedback ${yesCount === ITEMS.length ? 'good' : yesCount >= 3 ? 'guide' : 'bad'}`}>{verdict}</div>
    </div>
  );
};

export default M102;