import React, { useMemo, useState } from 'react';
import { SymbolHint } from '../components/SymbolHint';
import type { WidgetProps } from './registry';

export function GriffonScore(_props: WidgetProps) {
  const [pLabel, setPLabel] = useState(0.7);
  const [pLoc, setPLoc] = useState(0.6);
  const q = 0.5;
  const score = useMemo(() => Math.pow(pLabel, q) * Math.pow(pLoc, 1 - q), [pLabel, pLoc]);
  const rank = score >= 0.7 ? '高置信（示意）' : score >= 0.45 ? '中等置信（示意）' : '低置信（示意）';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>曝光信心表 · 训练无关打分</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          推理时从自回归条件概率提取标签分数与定位置信，再做几何平均（无需额外训练）。
        </p>
        <label style={{ fontSize: 28 }}>
          p(R) 标签概率 = {pLabel.toFixed(2)}
          <input type="range" min={0.05} max={1} step={0.01} value={pLabel}
            onChange={(e) => setPLabel(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <label style={{ fontSize: 28 }}>
          p_loc 定位置信 = {pLoc.toFixed(2)}
          <input type="range" min={0.05} max={1} step={0.01} value={pLoc}
            onChange={(e) => setPLoc(Number(e.target.value))} style={{ width: '100%' }} />
        </label>
        <div style={{
          fontSize: 28, padding: 16, borderRadius: 12, lineHeight: 1.4,
          background: score >= 0.7 ? '#e7f6ee' : score >= 0.45 ? '#eef2f8' : '#fde8eb',
          color: score >= 0.7 ? '#228d5c' : score >= 0.45 ? '#27446e' : '#c43f52',
        }}>
          score = {score.toFixed(3)} · {rank}
        </div>
        <div style={{ fontSize: 24, color: '#f07e47', fontWeight: 700 }}>
          排序示意阈值（0.7 / 0.45），非论文阈值
        </div>
      </div>
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d7deea', padding: 24, display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>公式（教学简化）</div>
        <div style={{ fontSize: 28, lineHeight: 1.5 }}>
          <SymbolHint meaning="最终目标置信度">{`score`}</SymbolHint>
          {' = '}
          <SymbolHint meaning="标签条件概率">{`p(R)`}</SymbolHint>
          <sup>
            <SymbolHint meaning="几何平均权重，论文取 0.5">q</SymbolHint>
          </sup>
          {' × '}
          <SymbolHint meaning="四个坐标条件概率之积形成的定位置信">{`p_loc`}</SymbolHint>
          <sup>1−q</sup>
        </div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          消融（MSCOCO，表 5）：无打分 20.9 mAP；加定位分 22.2；标签+定位 23.2（higher is better）。
        </p>
        <div style={{ height: 18, borderRadius: 999, background: '#d7deea', overflow: 'hidden' }}>
          <div style={{ width: `${score * 100}%`, height: '100%', background: '#f07e47' }} />
        </div>
        <div style={{ fontSize: 24, color: '#68778f' }}>快门指示条只跟玩具 score 走，不是检测阈值扫描。</div>
      </div>
    </div>
  );
}
