import React, { useState } from 'react';
import { Feedback } from './photo-kit';

const models = [
  { id: 1, ssim: .361, ssimSd: .033, psnr: 11.078, psnrSd: 1.079 },
  { id: 2, ssim: .363, ssimSd: .034, psnr: 11.144, psnrSd: 1.546 },
  { id: 3, ssim: .362, ssimSd: .039, psnr: 11.090, psnrSd: 1.445 },
  { id: 4, ssim: .376, ssimSd: .044, psnr: 11.619, psnrSd: 1.604 },
  { id: 5, ssim: .317, ssimSd: .054, psnr: 10.733, psnrSd: 1.221 },
  { id: 6, ssim: .319, ssimSd: .064, psnr: 10.587, psnrSd: 1.431 },
  { id: 7, ssim: .424, ssimSd: .041, psnr: 11.167, psnrSd: 1.450 },
];

export function Ch4Metrics() {
  const [selected, setSelected] = useState(5);
  const active = models.find(model => model.id === selected)!;
  return <div className="photo-page" style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 16 }}>
    <div className="photo-scene" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, padding: 22 }}>
      <div className="photo-panel" style={{ padding: 18 }}>
        <span className="photo-kicker">SSIM · 越高越好</span>
        <div className="photo-stack" style={{ marginTop: 14 }}>
          {models.map(model => <div key={model.id} className="photo-metric" style={{ gridTemplateColumns: '44px minmax(0,1fr) 230px', color: model.id === 7 ? '#a65b2b' : undefined }}>
            <span>#{model.id}</span>
            <div className="photo-metric-track"><i style={{ width: `${(model.ssim / .5) * 100}%`, background: model.id === 7 ? '#f07e47' : model.id === selected ? '#228d5c' : '#527d9e' }} /></div>
            <strong>{model.ssim.toFixed(3)} ± {model.ssimSd.toFixed(3)}</strong>
          </div>)}
        </div>
      </div>
      <div className="photo-panel" style={{ padding: 18 }}>
        <span className="photo-kicker">PSNR / dB · 越高越好</span>
        <div className="photo-stack" style={{ marginTop: 14 }}>
          {models.map(model => <div key={model.id} className="photo-metric" style={{ gridTemplateColumns: '44px minmax(0,1fr) 230px', color: model.id === 4 ? '#a65b2b' : undefined }}>
            <span>#{model.id}</span>
            <div className="photo-metric-track"><i style={{ width: `${((model.psnr - 9) / 4) * 100}%`, background: model.id === 4 ? '#f07e47' : model.id === selected ? '#228d5c' : '#527d9e' }} /></div>
            <strong>{model.psnr.toFixed(3)} ± {model.psnrSd.toFixed(3)}</strong>
          </div>)}
        </div>
      </div>
    </div>
    <div className="photo-panel" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 18 }}>
      <div>
        <div className="photo-chip-row" style={{ marginBottom: 12 }}>
          {models.map(model => <button key={model.id} type="button" className={`photo-button ${selected === model.id ? 'is-selected' : ''}`}
            aria-pressed={selected === model.id} onClick={() => setSelected(model.id)}>#{model.id}</button>)}
        </div>
        <div className="photo-legend"><span><b className="photo-orange">#7</b> 最高 SSIM</span><span><b className="photo-orange">#4</b> 最高 PSNR</span><span><b className="photo-green">#5</b> 最终视觉选择</span></div>
      </div>
      <Feedback tone={selected === 5 ? 'green' : 'blue'}>
        {selected === 5
          ? '#5 的 SSIM/PSNR 不是最高，但作者依据视觉质量选择它；指标排名不等于诊断有效性。'
          : selected === 4
            ? '#4 的 PSNR 在表中最高，同时 SSIM 为 0.376；这不自动等于最佳组织细节。'
            : selected === 7
              ? '#7 的 SSIM 在表中最高，但论文仍选择视觉更合适的 #5。'
              : `#${selected}：SSIM ${active.ssim.toFixed(3)}，PSNR ${active.psnr.toFixed(3)} dB；数值来自固定测试表。`}
      </Feedback>
    </div>
  </div>;
}
