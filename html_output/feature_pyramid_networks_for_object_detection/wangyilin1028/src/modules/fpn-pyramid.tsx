import React, { useState } from 'react';
import { C, Person, Range, Feedback } from './FpnKit';
import { SymbolHint } from '../components/SymbolHint';

export function FpnPyramid() {
  const [level, setLevel] = useState(3);
  const [height, setHeight] = useState(96);
  const [onlyP2, setOnlyP2] = useState(false);
  const stride = 2 ** level;
  return <div className="fpn-scene">
    <div className="fpn-row" style={{ height: 390, gap: 30 }}>
      <div style={{ width: 1060, height: 390, position: 'relative' }}>
        <div style={{ position: 'absolute', top: 8, left: 35, width: 130, textAlign: 'center', fontSize: 28, lineHeight: 1.4 }}>骨干 C</div>
        <div style={{ position: 'absolute', top: 8, left: 403, width: 130, textAlign: 'center', fontSize: 28, lineHeight: 1.4 }}>融合 M</div>
        <div style={{ position: 'absolute', top: 8, left: 777, width: 130, textAlign: 'center', fontSize: 28, lineHeight: 1.4 }}>输出 P</div>
        <svg viewBox="0 0 1060 390" width="1060" height="390" role="img" aria-label={`选择P${level}，步长${stride}，目标约占${(height / stride).toFixed(1)}格；中间量M向下传递，P单独输出。`}>
          {[5, 4, 3, 2].map((l, i) => {
            const y = 80 + i * 82;
            const selected = l === level;
            const size = 38 + (5 - l) * 9;
            const enabled = !onlyP2 || l === 2;
            return <g key={l}>
              <rect x={68 - (size - 38) / 2} y={y - 23} width={size} height={size} fill="#dbe6ec" stroke={C.blue} strokeWidth="2" />
              <text x="156" y={y + 7}>C{l}</text>
              <path d={`M228 ${y}H401`} fill="none" stroke={selected ? C.orange : C.line} strokeWidth={selected ? 6 : 3} />
              <text x="312" y={y - 11} textAnchor="middle">1×1</text>
              <rect x="416" y={y - 25} width="104" height="51" rx="12" fill={selected ? '#e5f3eb' : '#f4f7f6'} stroke={selected ? C.green : C.line} strokeWidth={selected ? 3 : 2} />
              <text x="468" y={y + 9} textAnchor="middle">M{l}</text>
              {l > 2 && <g><path d={`M468 ${y + 27}V${y + 56}`} fill="none" stroke={C.green} strokeWidth="4" /><path d={`M459 ${y + 47}L468 ${y + 58}L477 ${y + 47}`} fill="none" stroke={C.green} strokeWidth="3" /><text x="541" y={y + 48}>2× 上采样</text></g>}
              <path d={`M520 ${y}H762`} fill="none" stroke={selected ? C.orange : C.line} strokeWidth={selected ? 6 : 3} />
              <text x="664" y={y - 12} textAnchor="middle">3×3</text>
              <rect x="780" y={y - 26} width="125" height="53" rx="12" fill={enabled ? selected ? C.green : '#edf7f1' : '#f3f4f5'} stroke={enabled ? C.green : C.line} strokeWidth="2" />
              <text x="842" y={y + 9} textAnchor="middle" style={{ fill: enabled && selected ? '#fff' : enabled ? C.green : C.muted }}>P{l}</text>
              <text x="927" y={y + 8} style={{ fill: enabled ? C.blue : C.muted }}>步长 {2 ** l}</text>
            </g>;
          })}
        </svg>
        {[5, 4, 3, 2].map((l, i) => <button key={l} type="button" aria-label={`选择P${l}观察，步长${2 ** l}`} aria-pressed={level === l} onClick={() => setLevel(l)} style={{ position: 'absolute', left: 780, top: 54 + i * 82, width: 125, height: 53, border: 'none', borderRadius: 12, background: 'transparent', cursor: 'pointer' }} />)}
      </div>
      <div className="fpn-col" style={{ width: 382, gap: 18 }}>
        <svg width="382" height="225" viewBox="0 0 382 225" role="img" aria-label={`教学行人高度${height}像素`}><rect width="382" height="225" rx="18" fill={C.sky} /><path d="M0 190H382" stroke={C.line} strokeWidth="3" /><Person x={185} y={199} height={height * .65} /><path d={`M255 199V${199 - height * .65}`} stroke={C.orange} strokeWidth="4" /><text x="284" y="120" textAnchor="middle">{height}px</text></svg>
        <Range label="行人高度 / 像素" value={height} min={32} max={256} step={8} onChange={setHeight} />
        <label style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer' }}><input aria-label="只保留P2预测层" type="checkbox" checked={onlyP2} onChange={e => setOnlyP2(e.target.checked)} style={{ width: 28, height: 28, accentColor: C.blue }} />只保留 P2 预测</label>
      </div>
    </div>
    <div className="fpn-row" style={{ justifyContent: 'space-between', alignItems: 'center', height: 60 }}><p>向下传递的是 <SymbolHint meaning="M_l：用于继续向更精细层上采样的中间融合特征。">Mₗ</SymbolHint>；<SymbolHint meaning="P_l：中间特征M_l经过该层3×3卷积得到的最终金字塔输出。">Pₗ</SymbolHint> 经 3×3 卷积后分别用于预测。</p><strong className="fpn-value">P{level}：约 {(height / stride).toFixed(1)} 格</strong></div>
    <Feedback tone={onlyP2 ? 'orange' : 'green'}>{onlyP2 ? '只在P2预测会丢掉多层预测结构；图中格数只是几何覆盖，不代表检测精度。论文用消融比较这一取舍。' : `目标高度相同，在不同步长上覆盖的位置数不同。FPN保留多个输出层；当前查看P${level}，并非将目标预先唯一分配到这里。`}</Feedback>
  </div>;
}
