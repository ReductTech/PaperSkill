import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STOPS = [
  { t: 200, face: 'face-2', sign: 'sign-2', flower: 'flower-2', psnr: 29.61, qalign: 3.475, tone: 'is-paper' },
  { t: 400, face: 'face-3', sign: 'sign-3', flower: 'flower-3', psnr: 29.245, qalign: 3.5635, tone: 'is-good' },
  { t: 500, face: 'face-4', sign: 'sign-4', flower: 'flower-4', psnr: 28.387, qalign: 3.7491, tone: 'is-paper' },
  { t: 600, face: 'face-5', sign: 'sign-5', flower: 'flower-5', psnr: 28.473, qalign: 3.7372, tone: 'is-bad' },
];
const COPY = [
  '保真优先：结构最接近输入，细节保守。',
  '语义开始参与：纹样仍受控，真实感上升。',
  '论文主档位：真实感最高，仍要检查局部伪影。',
  '补全过头：出现 LQ 没有的“合理”内容或污渍状纹理；这是风险，不是更强。',
];

export function TadsrLimit(_: WidgetProps) {
  const [i, setI] = useState(2);
  const p = STOPS[i];
  const danger = i === 3;

  return (
    <div className="studio-page tadsr-limit">
      <div className="studio-frame tadsr-limit-scene">
        <div className="tadsr-limit-main"><img src={`./images/${p.face}.png`} alt={`t_s=${p.t} 的人脸修复结果`} /></div>
        <div className="tadsr-limit-thumbs">
          <figure><img src={`./images/${p.sign}.png`} alt={`t_s=${p.t} 的图案修复结果`} /><figcaption>图案：阴影 → 污渍状纹理</figcaption><em className={danger ? 'is-on' : ''} /></figure>
          <figure><img src={`./images/${p.flower}.png`} alt={`t_s=${p.t} 的花卉修复结果`} /><figcaption>花卉：大档位冒出黄色花蕊</figcaption><em className={i >= 2 ? 'is-on' : ''} /></figure>
        </div>
        <p className="studio-caption" style={{ position: 'absolute', left: 36, bottom: 34, right: 30 }}>图为论文 Fig.8 的定性裁剪；红圈是检查员标记，不是模型输出。</p>
      </div>
      <div className="tadsr-limit-side">
        <div className="tadsr-limit-read">
          <div><span>PSNR ↑</span><b>{p.psnr.toFixed(3)}</b></div>
          <div><span>QALIGN ↑</span><b>{p.qalign.toFixed(4)}</b></div>
        </div>
        <label className="studio-slider">
          <span>补全档位 tₛ</span><b>{p.t}</b>
          <input type="range" min={0} max={3} step={1} value={i} aria-label="补全档位"
            onChange={e => setI(Number(e.target.value))} />
        </label>
        <div className="studio-row">
          {STOPS.map((s, k) => <button key={s.t} className={`studio-btn ${k === i ? 'is-orange' : ''}`} onClick={() => setI(k)}>{s.t}</button>)}
        </div>
        <p className={`studio-feedback ${p.tone}`}>{COPY[i]}</p>
        <div className="studio-row">
          <button className="studio-btn is-ghost tadsr-limit-return" onClick={() => setI(2)}>回到论文主档位 500</button>
        </div>
        <p className="studio-caption">Table 3：QALIGN 从 500 的 3.7491 回落到 600 的 3.7372；论文未报告幻觉率。</p>
      </div>
    </div>
  );
}
