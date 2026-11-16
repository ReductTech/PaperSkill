import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const ROWS = [
  { name: 'FRCNN-R50 @448', mAP: 26.3, APS: 4.6, color: '#68778f' },
  { name: 'Griffon-13B @448', mAP: 24.8, APS: 5.9, color: '#228d5c' },
];

export function GriffonCoco(_props: WidgetProps) {
  const [glow, setGlow] = useState(0);
  useEffect(() => {
    setGlow(0.1);
  }, []);
  useEffect(() => {
    if (glow <= 0 || glow >= 1) return;
    const id = window.requestAnimationFrame(() => setGlow((v) => Math.min(1, v + 0.05)));
    return () => window.cancelAnimationFrame(id);
  }, [glow]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 24, height: '100%', color: '#21324a' }}>
      <div style={{ background: '#f5f8f0', borderRadius: 16, border: '1px solid #d7deea', padding: 24, position: 'relative' }}>
        <div style={{ fontSize: 28, color: '#68778f', marginBottom: 12 }}>MSCOCO val2017 · 曝光表 · higher is better</div>
        <svg viewBox="0 0 700 420" width="100%" height="88%">
          <text x="80" y="40" fontSize="24" fill="#21324a">mAP</text>
          <text x="400" y="40" fontSize="24" fill="#21324a">APS（小目标）</text>
          {ROWS.map((r, i) => {
            const y = 80 + i * 140;
            const scale = 0.6 + 0.4 * glow;
            return (
              <g key={r.name}>
                <text x="40" y={y} fontSize="22" fill={r.color}>{r.name}</text>
                <rect x="40" y={y + 16} width={r.mAP * 10 * scale} height="36" rx="6" fill={r.color} />
                <text x={50 + r.mAP * 10 * scale} y={y + 42} fontSize="22" fill="#21324a">{r.mAP}</text>
                <rect x="400" y={y + 16} width={r.APS * 28 * scale} height="36" rx="6" fill={r.color} opacity="0.85" />
                <text x={410 + r.APS * 28 * scale} y={y + 42} fontSize="22" fill="#21324a">{r.APS}</text>
              </g>
            );
          })}
        </svg>
        <div style={{
          position: 'absolute', right: 20, bottom: 24,
          opacity: glow, transform: `rotate(-8deg) scale(${0.85 + 0.15 * glow})`,
          border: '3px solid #228d5c', color: '#228d5c', borderRadius: 10,
          padding: '6px 12px', fontSize: 22, fontWeight: 800, background: '#e7f6ee',
        }}>
          小目标 APS 更高
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>第一次把 LVLM 真正拉进检测赛道</div>
        <p style={{ fontSize: 28, margin: 0, color: '#68778f', lineHeight: 1.45 }}>
          论文指出：按既有通用 LVLM 设计逐类询问时，Qwen-VL / Ferret 的 mAP 与 APS 约接近 0；Griffon 可一次检测多类多目标。
        </p>
        <div style={{ fontSize: 28, padding: 16, borderRadius: 12, background: '#e7f6ee', color: '#228d5c', lineHeight: 1.4 }}>
          Griffon mAP 24.8 接近同分辨率 Faster R-CNN 的 26.3，且 APS 5.9 &gt; 4.6。
        </div>
        <div style={{ fontSize: 26, color: '#68778f' }}>协议：MSCOCO val2017；单位 mAP / APS；方向：越高越好。</div>
      </div>
    </div>
  );
}
