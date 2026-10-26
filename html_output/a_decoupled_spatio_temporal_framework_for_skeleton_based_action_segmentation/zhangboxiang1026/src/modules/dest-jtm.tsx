// Refinement 2026-10-22. §3.3, Eq. 4 and Table 8(b); synthetic traces explain parameter organization only.
import React, { useRef, useState } from 'react';
import type { WidgetProps } from './registry';
import { C, scene, usePaperCanvas } from './dest-analogy';
const data = { tcn: { jwtm: 57.1, jtm: 59.1 }, transformer: { jwtm: 58.0, jtm: 59.7 } } as const;
export const DestJtm: React.FC<WidgetProps> = () => {
  const [backbone, setBackbone] = useState<'tcn' | 'transformer'>('tcn');
  const [mode, setMode] = useState<'jwtm' | 'jtm'>('jwtm');
  const ref = useRef<HTMLCanvasElement | null>(null);
  const pair = data[backbone];
  usePaperCanvas(ref, 720, 230, { mode }, (ctx, s) => {
    scene(ctx, 720, 230);
    ctx.fillStyle = C.ink; ctx.font = 'bold 17px system-ui'; ctx.fillText('关节轨迹', 80, 31); ctx.fillText('时间权重', 482, 31);
    for (let joint = 0; joint < 3; joint++) {
      const y = 63 + joint * 59; const col = [C.blue, C.green, C.purple][joint];
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath();
      for (let t = 0; t < 75; t++) {
        const x = 52 + t * 3.9; const signal = joint === 0 ? Math.sin(t / 10) * 15 : joint === 1 ? Math.sin(t / 28) * 5 : Math.sin(t / 15 + .7) * 10;
        if (t === 0) ctx.moveTo(x, y + signal); else ctx.lineTo(x, y + signal);
      } ctx.stroke();
      ctx.strokeStyle = C.line; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(370, y); ctx.lineTo(447, y); ctx.stroke();
      const weightColor = s.mode === 'jwtm' ? C.blue : col;
      const heights = s.mode === 'jwtm' ? [13, 30, 13] : [[10, 20, 32], [17, 30, 17], [28, 16, 10]][joint];
      heights.forEach((h, i) => { ctx.fillStyle = weightColor; ctx.beginPath(); ctx.roundRect(478 + i * 45, y + 18 - h, 31, h, 5); ctx.fill(); });
      if (s.mode === 'jwtm') { ctx.setLineDash([3, 4]); ctx.strokeStyle = C.blue; ctx.strokeRect(466, y - 24, 158, 51); ctx.setLineDash([]); }
    }
  }, false);
  return <div className="dest-refined">
    <div className="ctrl"><button className={'chip' + (mode === 'jwtm' ? ' active' : '')} aria-pressed={mode === 'jwtm'} onClick={() => setMode('jwtm')}>共享 JWTM</button><button className={'chip' + (mode === 'jtm' ? ' active' : '')} aria-pressed={mode === 'jtm'} onClick={() => setMode('jtm')}>逐关节 JTM</button></div>
    <canvas ref={ref} width={720} height={230} aria-label={mode === 'jwtm' ? '三条不同的合成关节轨迹，共用一组时间权重。' : '三条合成关节轨迹分别拥有独立时间权重，随后合成时间特征。'} />
    <div className="dest-weight-legend">{['关节 1', '关节 2', '关节 3'].map((name, i) => <span key={name}><i style={{ background: [C.blue, C.green, C.purple][i] }} />{name}：{mode === 'jwtm' ? '同一组 θ' : `独立 θ${i + 1}`}</span>)}</div>
    <div className="dest-network-output">{mode === 'jwtm' ? '共享参数 → 所有关节采用相同时间建模规则' : '独立参数 → 各自时间建模 → 汇总为时间表示'}</div>
    <div className="feedback" aria-live="polite">{mode === 'jwtm' ? '同一动作里，各关节的轨迹不同。如果时间权重共享，模型必须用同一套参数处理这些差别。' : 'JTM 为每个关节分配独立可训练的时间权重，再汇总各关节贡献。独立不等于忽略关节关系：前面的空间建模仍提供空间信息。'}</div>
    <p className="module-note">轨迹和权重柱仅为参数共享关系的教学示意；不表示实测速度或训练得到的权重。真实证据看下面的 Table 8。</p>
    <div className="ctrl"><span>查看时间骨干</span><button className={'chip' + (backbone === 'tcn' ? ' active' : '')} aria-pressed={backbone === 'tcn'} onClick={() => setBackbone('tcn')}>TCN</button><button className={'chip' + (backbone === 'transformer' ? ' active' : '')} aria-pressed={backbone === 'transformer'} onClick={() => setBackbone('transformer')}>线性 Transformer</button></div>
    <div className="dest-evidence-card"><span>Table 8(b) · MCFS-130 split #1</span><strong>F1@50：{pair[mode].toFixed(1)}</strong><p>共享 JWTM {pair.jwtm.toFixed(1)} → 逐关节 JTM {pair.jtm.toFixed(1)}，增加 {(pair.jtm - pair.jwtm).toFixed(1)} 个百分点。这是单折受控比较，不是五折主表。</p></div>
    <table className="paper"><caption>两种骨干下的单折消融 · F1@50，越高越好</caption><thead><tr><th>时间骨干</th><th>共享 JWTM</th><th>逐关节 JTM</th></tr></thead><tbody><tr><td>TCN</td><td>57.1</td><td>59.1</td></tr><tr><td>线性 Transformer</td><td>58.0</td><td>59.7</td></tr></tbody></table>
  </div>;
};
