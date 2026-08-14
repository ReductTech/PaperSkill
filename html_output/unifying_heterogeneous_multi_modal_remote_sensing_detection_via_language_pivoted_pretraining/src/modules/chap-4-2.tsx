import React from 'react';
import type { WidgetProps } from './registry';

// Chap4Mod2 — Formula card with clickable symbols (P5-style on plain HTML).
// This is a non-Canvas math/technical module; symbols are styled as
// clickable .fe-formula-sym and the explanation box reuses Formula.tsx's CSS.

const symbols: Array<{ sym: string; desc: string }> = [
  { sym: 'L<sub>align</sub>', desc: 'CSIA 的语言建模损失，只在响应 token 上计算。' },
  { sym: 'Φ', desc: '冻结的预训练 LLM（Qwen2，来自 InternVL-2.5 1B）。' },
  { sym: 'E<sub>M</sub>', desc: 'RGB / SAR / IR 共享的视觉编码器（ViT-Large，24 层）。' },
  { sym: 'x', desc: '任意一种模态的输入图像。' },
  { sym: 'q', desc: '与图像配对的<b>自然语言指令</b>。' },
  { sym: 'r', desc: '与图像配对的<b>响应文本</b>。' },
];

export const Chap4Mod2: React.FC<WidgetProps> = () => {
  return (
    <div className="formula-explain">
      <p className="fe-hint">点击公式中的符号查看含义</p>
      <div className="fe-lead">
        CSIA 用<b>条件语言建模损失</b>把视觉特征映射到 LLM 的语义空间——每个符号都来自论文 §3.1。
      </div>
      <div className="fe-formula">
        L<sub>align</sub> = - ∑<sub>j=1..|r|</sub> log P<sub>Φ</sub>( r<sub>j</sub> | q, r<sub>&lt;j</sub>, E<sub>M</sub>(x) )
      </div>
      <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none' }}>
        {symbols.map((s) => (
          <li
            key={s.sym}
            className="sym fe-formula-sym"
            data-sym={s.sym}
            style={{ display: 'inline-block', margin: '4px 6px', padding: '4px 8px', border: '1px solid #d7deea', borderRadius: 6 }}
          >
            {s.sym}
          </li>
        ))}
      </ul>
      <p className="fe-explain-desc" style={{ marginTop: 10 }}>
        上面列出的每个符号都可以点击查看含义。<b>核心</b>：视觉特征 x 通过"对响应 r 的预测能力"参与训练，不强制与文本 token 距离相等。
      </p>
    </div>
  );
};

export default Chap4Mod2;
