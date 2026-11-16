import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';

const stations = [
  {
    label: '提取',
    symbol: 'f',
    dimension: 'L×1',
    description: '冻结主干把当前任务图像映射为原始特征 f；主干参数保持不变。',
  },
  {
    label: '投影',
    symbol: 'h',
    dimension: 'M×1',
    description: '固定随机板把 f 变为 h=φ(fᵀW)；W 不重新采样。',
  },
  {
    label: '累计',
    symbol: 'G / C',
    dimension: 'M×M / M×K',
    description: '把 Σhhᵀ 与 Σhyᵀ 写入账本；只有统计量在增长。',
  },
  {
    label: '选 λ',
    symbol: 'λ',
    dimension: '1',
    description: '在当前任务 80:20 划分上从 10⁻⁸ 到 10⁸ 选择岭参数。',
  },
  {
    label: '分类',
    symbol: 'Wₒ',
    dimension: 'M×K',
    description: '用 h_testᵀ(G+λI)⁻¹c_y 打分并闭式求出 Wₒ；没有 SGD。',
  },
];

export function RpCh6Phase2() {
  const [step, setStep] = useState(0);
  const current = stations[step];
  const progress = (step + 1) / stations.length;

  return (
    <div className="rp-widget rp-phase2-widget">
      <div className="rp-pipeline-lock">
        <span>主干</span>
        <b>LOCK</b>
        <span>W</span>
        <b>LOCK</b>
        <strong>Phase 2：无 SGD</strong>
      </div>
      <div
        className="rp-pipeline"
        role="group"
        aria-label="第二阶段五个账本站点"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
            event.preventDefault();
            setStep((value) => Math.max(0, Math.min(4, value + (event.key === 'ArrowRight' ? 1 : -1))));
          }
        }}
      >
        {stations.map((station, index) => (
          <React.Fragment key={station.label}>
            <button
              type="button"
              className={`rp-station ${index < step ? 'is-done' : ''} ${index === step ? 'is-current' : ''}`}
              aria-pressed={index === step}
              onClick={() => setStep(index)}
            >
              <span>{`${index + 1}. ${station.label}`}</span>
              <strong>{station.symbol}</strong>
            </button>
            {index < stations.length - 1 && <i className="rp-pipeline-link" aria-hidden="true" />}
          </React.Fragment>
        ))}
        <div className="rp-rubbing-cursor" style={{ left: `${7 + step * 21.5}%` }} aria-hidden="true">
          <span />
        </div>
      </div>
      <div className="rp-phase2-body">
        <section className="rp-panel rp-dimension-panel">
          <span className="rp-kicker">{`当前站点 · ${current.label}`}</span>
          <strong className="rp-dimension">{current.dimension}</strong>
          <div className="rp-symbol-row">
            <SymbolHint meaning="冻结主干给出的原始特征">f: L×1</SymbolHint>
            <SymbolHint meaning="固定随机投影后的特征">h: M×1</SymbolHint>
            <SymbolHint meaning="累计 Gram 矩阵">G: M×M</SymbolHint>
            <SymbolHint meaning="累计类原型账本">C: M×K</SymbolHint>
          </div>
        </section>
        <section className="rp-panel rp-accumulation-panel">
          <div className="rp-panel-heading">
            <span>累计账本进度</span>
            <strong>{`${Math.round(progress * 100)}%`}</strong>
          </div>
          <div className="rp-ledger-gauge" aria-label="账本累计进度">
            <i style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="rp-ledger-cells" aria-hidden="true">
            {Array.from({ length: 48 }, (_, index) => (
              <span
                key={index}
                className={index / 48 < progress ? 'is-filled' : ''}
                style={{ opacity: 0.35 + ((index * 17) % 10) / 18 }}
              />
            ))}
          </div>
          <div className="rp-formula-strip">
            {'G=Σhhᵀ · C=Σhyᵀ · '}
            <SymbolHint meaning="测试特征通过岭校准后的分类分数">s_y=h_testᵀ(G+λI)⁻¹c_y</SymbolHint>
          </div>
        </section>
      </div>
      <div className="rp-feedback rp-feedback-wide">
        <strong>{`${step + 1}/5 · ${current.label}`}</strong>
        <span>{current.description} 当前显示的类别编号、样本刻度和进度是符号化教学量。</span>
      </div>
    </div>
  );
}
