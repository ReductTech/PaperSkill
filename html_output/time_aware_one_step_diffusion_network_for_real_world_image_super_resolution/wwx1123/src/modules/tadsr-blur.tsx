import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

export function TadsrBlur(_: WidgetProps) {
  const [ts, setTs] = useState(500);
  const [blur, setBlur] = useState(true);
  const k = 5 + 4 * Math.floor(ts / 200);
  const sigma = k / 4;
  const radius = blur ? Math.max(0, (k - 5) * 1.15) : 0;
  const cells = Array.from({ length: 49 }, (_, i) => {
    const r = Math.floor(i / 7) - 3;
    const c = (i % 7) - 3;
    const w = blur ? Math.exp(-(r * r + c * c) / (2 * (k / 5.2) ** 2)) : (r === 0 && c === 0 ? 1 : 0);
    return w;
  });
  const max = Math.max(...cells);
  const feedback = !blur
    ? '普通 MSE：高频也被逐像素拉开，和生成指导互相打架。'
    : k <= 9 ? '轻模糊：只压掉最尖的噪声，保真仍强。'
      : k <= 13 ? '论文主档位附近：低频结构受监督，高频交给 TAVSD。'
        : '重模糊：像素监督更保守，细节更依赖生成先验。';

  return (
    <div className="studio-page tadsr-blur">
      <div className="studio-frame tadsr-blur-scene">
        <div className="tadsr-blur-photo">
          <img src="./images/face-4.png" alt="待修复的人脸照片" style={{ filter: `blur(${radius}px)`, transition: 'filter .18s ease' }} />
        </div>
        <div className="tadsr-blur-kernel" aria-label={`高斯核示意，k=${k}`}>
          {cells.map((w, i) => <span key={i} style={{ background: w < .01 ? '#f1f4f8' : `rgba(124,58,237,${.12 + .78 * w / max})` }} />)}
        </div>
        <div className="tadsr-blur-freq">
          <div className="studio-row" style={{ justifyContent: 'space-between' }}><span className="studio-caption">低频结构：受 MSE 监督</span><span className="studio-caption">高频细节：交给 TAVSD</span></div>
          <div className="studio-meter"><span style={{ width: blur ? '78%' : '36%', background: '#228d5c' }} /></div>
          <div className="studio-meter"><span style={{ width: blur ? '22%' : '64%', background: blur ? '#d7deea' : '#c43f52' }} /></div>
        </div>
      </div>
      <div className="tadsr-blur-side">
        <div className="studio-row" style={{ justifyContent: 'flex-end' }}>
          <button className={`studio-btn ${blur ? 'is-on' : ''}`} onClick={() => setBlur(true)}>模糊 MSE</button>
          <button className={`studio-btn ${!blur ? 'is-on' : ''}`} onClick={() => setBlur(false)}>普通 MSE</button>
        </div>
        <p className="studio-eq"><SymbolHint meaning="随档位变大的高斯核尺寸。">k<sub>ts</sub></SymbolHint> = 5 + 4⌊<SymbolHint meaning="学生端时间步/补全档位。">t<sub>s</sub></SymbolHint> / 200⌋ = <b style={{ color: '#c26022' }}>{k}</b></p>
        <p className="studio-text">预测照片与 HQ 都先经 <SymbolHint meaning="尺寸由 ts 决定的高斯模糊核。">G<sub>ts</sub></SymbolHint> 模糊，再算 MSE；σ≈{sigma.toFixed(1)}（仅用于示意）。</p>
        <label className="studio-slider">
          <span>学生档位 tₛ</span><b>{ts}</b>
          <input type="range" min={0} max={999} step={10} value={ts} aria-label="学生档位"
            onChange={e => setTs(Number(e.target.value))} />
        </label>
        <div className="studio-row">
          {[200, 400, 500, 600].map(v => <button key={v} className={`studio-btn ${Math.abs(ts - v) < 5 ? 'is-orange' : ''}`} onClick={() => setTs(v)}>{v}</button>)}
        </div>
        <p className={`studio-feedback ${blur ? 'is-good' : 'is-warn'}`}>{feedback}</p>
        <p className="studio-caption">Table 4：去掉模糊 MSE 会提高 PSNR/SSIM、降低 MUSIQ/QALIGN。CSS 模糊为示意。</p>
      </div>
    </div>
  );
}
