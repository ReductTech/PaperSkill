import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const OPTIONS = [100, 300, 600] as const;
const COPY = {
  100: '老师与 LoRA 几乎重合，差线主要落在细纹理。',
  300: '老师多画了结构，学徒仍旧平滑；差线含全局语义。',
  600: '老师自己也只能看见粗结构，差线又粗又不可靠。',
};
const LEVEL = { 100: 34, 300: 68, 600: 88 };

export function TadsrResidual(_: WidgetProps) {
  const [tv, setTv] = useState<100 | 300 | 600>(300);
  const tone = tv === 600 ? 'is-warn' : tv === 300 ? 'is-paper' : 'is-good';

  return (
    <div className="studio-page tadsr-residual">
      <div className="studio-card tadsr-residual-fig">
        <img src="./images/fig4_vsd.png" alt="论文 Fig.4：VSD 均值/标准差曲线，以及 tv=100/300/600 时老师、LoRA 与梯度的输出" />
      </div>
      <div className="tadsr-residual-side">
        <p className="studio-text">两张描摹纸相减：<SymbolHint meaning="冻结老师预测的 latent 图像。">ẑ<sub>ψ</sub></SymbolHint> − <SymbolHint meaning="LoRA 模型预测的 latent 图像。">ẑ<sub>φ</sub></SymbolHint> 给出细节方向；实际梯度只回到学生参数。</p>
        <div className="tadsr-residual-picks">
          {OPTIONS.map(v => <button key={v} className={`studio-btn ${v === tv ? 'is-orange' : ''}`} onClick={() => setTv(v)}>tᵥ={v}</button>)}
        </div>
        <div className="studio-card" style={{ padding: '14px 16px', display: 'grid', gap: 10 }}>
          <div className="tadsr-residual-meter">
            <span>残差强度</span>
            <div className="studio-meter"><span style={{ width: `${LEVEL[tv]}%`, background: tv === 600 ? '#c43f52' : tv === 100 ? '#228d5c' : '#7c3aed' }} /></div>
            <b style={{ color: '#27446e', fontSize: 25 }}>{tv === 100 ? '细' : tv === 300 ? '中' : '粗'}</b>
          </div>
          <p className="studio-muted">图 4(a) 的均值/标准差曲线呈上升趋势；正文未给逐点数值，所以这里只显示定性强度，不显示编造的小数。</p>
        </div>
        <p className={`studio-feedback ${tone}`}>{COPY[tv]}</p>
        <p className="studio-caption">Fig.4 红框为原图标注。</p>
      </div>
    </div>
  );
}
