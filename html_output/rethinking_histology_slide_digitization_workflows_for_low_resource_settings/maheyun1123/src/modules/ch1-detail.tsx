import React, { useState } from 'react';
import { Feedback, PhotoButton } from './photo-kit';

export function Ch1Detail() {
  const [zoom, setZoom] = useState<10 | 40>(10);
  const high = zoom === 40;
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene" style={{ background: '#edf4ee', padding: 22 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 18, background: '#fffdf7', border: '1px solid #d7deea', position: 'relative', overflow: 'hidden' }}>
        <svg viewBox="0 0 900 520" style={{ width: '100%', height: '100%', display: 'block' }} role="img"
          aria-label={high ? '40 倍示意视野，放大后可见更小的结构线索' : '10 倍示意视野，保留较大组织结构'}>
          <rect width="900" height="520" fill="#f8edf3" />
          <path d="M35 420 C112 260 235 182 350 286 C470 396 575 144 720 190 C804 218 844 300 870 402 L870 520 H35Z" fill="#d89bb1" />
          <path d="M62 389 C170 330 220 305 314 347 M470 345 C585 300 690 280 803 340 M420 220 C486 196 540 210 589 256" fill="none" stroke="#fff2f6" strokeWidth="8" />
          {Array.from({ length: high ? 34 : 14 }).map((_, index) => <g key={index} transform={`translate(${80 + (index * 81) % 740} ${160 + (index * 61) % 300}) scale(${high ? 2.1 : .8})`}>
            <circle r="12" fill={high ? '#5e2141' : '#6e576a'} opacity={high ? .95 : .3} />
            <circle cx="4" cy="-2" r="4" fill="#f6eaf0" opacity=".7" />
          </g>)}
          <circle cx={high ? 460 : 430} cy="260" r={high ? 215 : 165} fill="none" stroke="#27446e" strokeWidth="6" opacity=".85" />
          <path d={`M${high ? 675 : 595} 75 L${high ? 675 : 595} 45 L${high ? 705 : 625} 45`} fill="none" stroke="#27446e" strokeWidth="6" />
        </svg>
        <span className="photo-badge" style={{ position: 'absolute', left: 20, top: 18 }}>{zoom}× 示意视野</span>
        <span className="photo-small-label" style={{ position: 'absolute', right: 20, bottom: 16 }}>显微结构为教学示意</span>
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">观察尺度</span>
      <div className="photo-chip-row" style={{ marginTop: 14 }}>
        <PhotoButton selected={zoom === 10} onClick={() => setZoom(10)}>10× 视野</PhotoButton>
        <PhotoButton selected={zoom === 40} onClick={() => setZoom(40)}>40× 细节</PhotoButton>
      </div>
      <div className="photo-compare" style={{ marginTop: 22 }}>
        <div className="photo-stat"><strong>空间覆盖</strong><span>10× 更宽，便于看整体组织关系</span></div>
        <div className="photo-stat"><strong>细节可见性</strong><span>40× 级视图更容易观察微小线索</span></div>
      </div>
      <p>论文指出，较大的肉芽肿可在 10× 观察；更小的 LD 小体通常需要 40× 级细节，数量少时容易被漏掉。</p>
      <Feedback tone={high ? 'green' : 'red'}>{high
        ? '达到论文讨论的细节尺度：可放大共享微小结构线索。'
        : '10× 保留大范围上下文，但更小的 LD 小体可能难以辨认。'}</Feedback>
    </aside>
  </div>;
}
