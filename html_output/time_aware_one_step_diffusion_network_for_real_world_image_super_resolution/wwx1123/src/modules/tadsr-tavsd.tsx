import React, { useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function TadsrTavsd(_: WidgetProps) {
  const [ts, setTs] = useState(500);
  const [lambda, setLambda] = useState(0.5);
  const [gamma, setGamma] = useState(0);
  const rawTv = lambda * ts + gamma;
  const tv = Math.round(clamp(rawTv, 0, 999));
  const clipped = rawTv > 999;
  const studentAngle = -120 + (ts / 999) * 240;
  const teacherAngle = -120 + (tv / 999) * 240;
  const band = tv < 200 ? 0 : tv <= 500 ? 1 : 2;
  const bandText = ['纹理细节', '结构 + 语义', '只剩粗结构'][band];
  const bars = [0.22, 0.38, 0.56, 0.76, 1].map((v, k) => Math.max(12, (tv / 999) * 92 * v + (k + 1) * 4));
  const feedback = clipped
    ? '映射超过 999：实际会被截断，老师看到的是极高噪声，指导很粗。'
    : tv < 200
      ? `tᵥ=${tv}：老师主要补纹理，保真倾向强。`
      : tv <= 500
        ? `tᵥ=${tv}：老师开始补结构，语义参与增加。`
        : `tᵥ=${tv}：老师看到的多是噪声，别把“更敢补”当成“更清晰”。`;

  return (
    <div className="studio-page tadsr-tavsd">
      <div className="studio-frame tadsr-tavsd-scene">
        <div className="tadsr-tavsd-dial left"><div className="studio-brass"><div className="studio-needle" style={{ transform: `rotate(${studentAngle}deg)` }} /><div style={{ position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center', fontSize: 28, fontWeight: 850, color: '#5d3e20' }}>{ts}</div></div></div>
        <div className="tadsr-tavsd-dial right"><div className="studio-brass"><div className="studio-needle" style={{ transform: `rotate(${teacherAngle}deg)` }} /><div style={{ position: 'absolute', left: 0, right: 0, top: '46%', textAlign: 'center', fontSize: 28, fontWeight: 850, color: '#5d3e20' }}>{tv}</div></div></div>
        <div className="tadsr-tavsd-link"><span>tᵥ = λtₛ + γ</span></div>
        <div className="tadsr-tavsd-labels"><div><b>学生 tₛ</b><small>补全档位</small></div><div style={{ textAlign: 'right' }}><b>老师 tᵥ</b><small>{bandText}</small></div></div>
        <div className="tadsr-tavsd-noise" aria-label="扩散噪声强度示意">
          {bars.map((h, k) => <span key={k} style={{ height: `${h}%`, background: k < 2 ? '#27446e' : k < 4 ? '#7c3aed' : '#c43f52' }} />)}
        </div>
      </div>
      <div className="tadsr-tavsd-side">
        <p className="studio-heading">TAVSD：把学生档位映射给老师</p>
        <p className="studio-eq"><SymbolHint meaning="老师端时间步，由学生档位映射而来。">tᵥ</SymbolHint> = <SymbolHint meaning="映射斜率超参数，默认 0.5。">λ</SymbolHint><SymbolHint meaning="学生端时间步。">tₛ</SymbolHint> + <SymbolHint meaning="映射偏置超参数，默认 0。">γ</SymbolHint></p>
        <div className="tadsr-tavsd-controls">
          <label className="studio-slider"><span>学生档位 tₛ</span><b>{ts}</b><input type="range" min={0} max={999} step={10} value={ts} onChange={e => setTs(Number(e.target.value))} /></label>
          <label className="studio-slider"><span>λ</span><b>{lambda.toFixed(2)}</b><input type="range" min={0.25} max={0.75} step={0.05} value={lambda} onChange={e => setLambda(Number(e.target.value))} /></label>
          <label className="studio-slider"><span>γ</span><b>{gamma}</b><input type="range" min={0} max={100} step={10} value={gamma} onChange={e => setGamma(Number(e.target.value))} /></label>
        </div>
        <div className="studio-row" style={{ gap: 8 }}>
          <button className="studio-btn" onClick={() => { setTs(200); setLambda(.5); setGamma(0); }}>纹理档</button>
          <button className="studio-btn is-orange" onClick={() => { setTs(600); setLambda(.5); setGamma(0); }}>语义档</button>
          <button className="studio-btn" onClick={() => { setTs(500); setLambda(.5); setGamma(0); }}>论文默认</button>
        </div>
        <p className={`studio-feedback ${band === 2 || clipped ? 'is-warn' : band === 1 ? 'is-paper' : 'is-good'}`}>{feedback}</p>
        <p className="studio-caption">Table 5：增大 λ/γ 会把 tᵥ 推大，参考指标降。</p>
      </div>
    </div>
  );
}
