import React, { useState } from 'react';

const GREEN = '#228d5c';
const BLUE = '#27446e';
const ORANGE = '#f07e47';
const INK = '#21324a';
const MUTED = '#68778f';
const LINE = '#d7deea';

export function MerAlpha() {
  const [s, setS] = useState(5);
  const lossW = s;
  const alignW = (s * (s - 1)) / 2;
  const maxW = Math.max(lossW, alignW, 1);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', gap: 28, alignItems: 'center' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ fontSize: 34, color: INK, fontWeight: 700 }}>把固定记忆拆成更长序列，放大对齐项</div>
        <label style={{ fontSize: 26, color: INK }}>有效批次数 s = {s}
          <input type="range" min={1} max={12} value={s} onChange={e => setS(Number(e.target.value))} style={{ width: '100%', marginTop: 8 }} />
        </label>
        <div style={{ fontSize: 28, color: MUTED, lineHeight: 1.5 }}>
          Reptile 目标里，普通损失项权重正比于 <b style={{ color: BLUE }}>s</b>，而对齐正则项（梯度点积和）权重正比于 <b style={{ color: GREEN }}>s(s−1)/2</b>。
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ fontSize: 24, color: BLUE }}>普通损失权重 ∝ s = {lossW}</div>
            <div style={{ height: 26, background: '#eef2f7', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(lossW / maxW) * 100}%`, background: BLUE }} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 24, color: GREEN }}>对齐正则权重 ∝ s(s−1)/2 = {alignW}</div>
            <div style={{ height: 26, background: '#eef2f7', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(alignW / maxW) * 100}%`, background: GREEN }} />
            </div>
          </div>
        </div>
        <div style={{ fontSize: 26, color: INK, background: '#fff', border: '1px solid #d7deea', borderRadius: 12, padding: 14 }}>
          对齐项 / 损失项 ≈ <b style={{ color: GREEN, fontFamily: 'Consolas, monospace' }}>{(alignW / lossW).toFixed(1)}×</b>。s 越大，对齐（防遗忘、促迁移）占的比重越高——所以把记忆拆成逐个样本的长序列，比按批次处理效果更好。
        </div>
      </div>
      <div style={{ width: 340, background: '#fff', border: '1px solid #d7deea', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 30, fontWeight: 700, color: INK }}>两个可调系数</div>
        <div style={{ fontSize: 26, color: MUTED, lineHeight: 1.5 }}>
          <b style={{ color: BLUE }}>β</b>：批内元学习率。实验中 β &lt; 1，降低高阶项扰动。<br /><br />
          <b style={{ color: ORANGE }}>γ</b>：批间元学习率。实验中 γ = 1，使 MER 等价于一次大 Reptile。
        </div>
        <div style={{ fontSize: 24, color: MUTED, borderTop: `1px solid ${LINE}`, paddingTop: 12 }}>
          来源：论文 Sec 3.2 与 App. I。
        </div>
      </div>
    </div>
  );
}
