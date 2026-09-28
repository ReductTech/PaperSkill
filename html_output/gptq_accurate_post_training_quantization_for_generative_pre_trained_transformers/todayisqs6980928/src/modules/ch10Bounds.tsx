import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 增量贡献（要素⑤：相比已有研究多知道了什么）
const CONTRIBUTIONS = [
  { icon: '①', title: '首次 175B 精确二阶 PTQ', desc: '4.2h 完成量化，较 ZeroQuant-LKD 快约 100×。' },
  { icon: '②', title: '压缩率翻倍', desc: '相同精度下相对 RTN/LLM.int8() 翻倍，4bit 困惑度仅上升 0.03。' },
  { icon: '③', title: '单卡 3bit 推理', desc: '3bit 仅 63GB，单张 A100 运行 175B，加速 3.24×/4.53×。' },
];

// 边界与局限（论文 §6 + Table 7）
const BOUNDS = [
  { id: '2bit', title: '极端 2bit 仍有损失', desc: '2-bit（g128）困惑度 9.58，比 FP16 高 1.24，只能靠更细分组缓解。', cls: 'bad' },
  { id: 'calib', title: '依赖校准数据集', desc: '虽仅 128 个 C4 片段，但仍是「有校准」的 PTQ，换域需重新校准。', cls: '' },
  { id: 'hessian', title: 'Hessian 有显存开销', desc: '每层要算 d×d 的 H=2XXᵀ 并做 Cholesky，需逐块加载省显存。', cls: '' },
  { id: 'bw', title: '加速来自内存带宽', desc: '速度提升来自减少权重搬运，非计算量下降；主流硬件不支持 FP16×INT4。', cls: '' },
  { id: 'act', title: '未量化激活', desc: '只量化权重、激活仍 FP16；激活 outlier 未解决。', cls: '' },
];

// 第十章：增量贡献 + 边界。贡献卡片 + 边界切换 + 后续工作结论。
export const Ch10Bounds: React.FC<WidgetProps> = () => {
  const [sel, setSel] = useState('2bit');
  const cur = BOUNDS.find((b) => b.id === sel)!;

  return (
    <div className="ch10-page" data-testid="ch10-bounds">
      <div className="ch10-contributions" aria-label="相对已有工作的增量贡献">
        {CONTRIBUTIONS.map((c) => (
          <div key={c.icon} className="ch10-contribution">
            <strong><b>{c.icon}</b>{c.title}</strong>
            <span>{c.desc}</span>
          </div>
        ))}
      </div>

      <div className="bounds-panel">
        <div className="chip-row">
          {BOUNDS.map((b) => (
            <button key={b.id} className={`chip ${sel === b.id ? 'selected' : ''}`} onClick={() => setSel(b.id)}>
              {b.title}
            </button>
          ))}
        </div>
        <div className={`bounds-card ${cur.cls}`}>
          <strong>{cur.title}</strong>
          <p>{cur.desc}</p>
        </div>
      </div>

      <p className="ch10-conclusion">
        <strong>后续工作：</strong>激活 outlier 与更极端低比特的问题，由后续旋转（SpinQuant / QuaRot）与低秩（SVDQuant）方法继续推进。
      </p>
    </div>
  );
};

export default Ch10Bounds;
