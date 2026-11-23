import React, { useState } from 'react';
import { Feedback, PhotoButton } from './photo-kit';

export function Ch5Boundary() {
  const [margin, setMargin] = useState(0);
  const [overlap, setOverlap] = useState(25);
  const [action, setAction] = useState<'none' | 'retake' | 'exclude'>('none');
  const safeCapture = margin >= 24 && overlap > 50;
  return <div className="photo-page photo-split is-wide">
    <div className="photo-scene photo-desk" style={{ padding: 24 }}>
      <div style={{ height: '100%', borderRadius: 20, background: '#fffdf7', border: '3px solid #d7deea', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: margin, borderRadius: 14, background: '#e7f1ed', border: '1px solid #b8c9a7' }}>
          <div style={{ position: 'absolute', inset: 22, background: 'linear-gradient(155deg,#c78ba8,#a983b1)', borderRadius: 120, clipPath: 'polygon(0 40%,45% 5%,100% 45%,90% 100%,12% 92%)' }} />
          <div style={{ position: 'absolute', right: 18, top: 18, padding: '8px 13px', borderRadius: 10, background: '#fffdf7', color: safeCapture ? '#176c45' : '#9c512a', fontSize: 'var(--ppt-body-text)', fontWeight: 800 }}>
            边缘留白 {margin}px
          </div>
          {Array.from({ length: 8 }).map((_, i) => <span key={i} style={{ position: 'absolute', width: 12, height: 12, borderRadius: 99, background: '#572d48', left: 82 + (i * 83) % 480, top: 85 + (i * 59) % 250 }} />)}
        </div>
        {(margin < 24 || overlap <= 50) && <div style={{ position: 'absolute', right: 18, bottom: 18, width: 150, height: 80, border: '4px solid #c43f52', background: '#c43f5220', borderRadius: 10, display: 'grid', placeItems: 'center', color: '#a23043', fontSize: 'var(--ppt-body-text)', fontWeight: 800 }}>边界伪影</div>}
      </div>
    </div>
    <aside className="photo-panel">
      <span className="photo-kicker">停止与修复</span>
      <div style={{ marginTop: 14 }}>
        <div className="photo-range-label"><span>组织距画面边缘</span><b>{margin}px</b></div>
        <input className="photo-range" type="range" min="0" max="60" step="4" value={margin}
          aria-label="组织距画面边缘像素" onChange={event => setMargin(Number(event.target.value))} />
      </div>
      <div>
        <div className="photo-range-label"><span>相邻帧重叠</span><b>{overlap}%</b></div>
        <input className="photo-range" type="range" min="20" max="60" step="5" value={overlap}
          aria-label="相邻帧重叠百分比" onChange={event => setOverlap(Number(event.target.value))} />
      </div>
      <div className="photo-chip-row" style={{ marginTop: 10 }}>
        <PhotoButton selected={action === 'retake'} onClick={() => { setAction('retake'); setMargin(36); setOverlap(55); }}>重新扫片</PhotoButton>
        <PhotoButton selected={action === 'exclude'} onClick={() => setAction('exclude')}>裁掉不确定区</PhotoButton>
      </div>
      <p>增加留白和重叠改善采集边缘，但论文明确报告模型仍有组织边界和方形伪影。</p>
      <Feedback tone={safeCapture ? 'green' : action === 'exclude' ? 'orange' : 'red'}>
        {action === 'exclude'
          ? '已裁去不确定区；这会减少可用面积，应记录原因。'
          : safeCapture
            ? '重扫后保留了组织边缘；模型边界伪影仍需复核。'
            : margin === 0
              ? '组织贴边且有方形伪影：不能用整张切片作为可靠证据。'
              : '增加边缘留白和重叠后，采集缺口改善；论文报告的模型边界伪影仍需谨慎。'}
      </Feedback>
    </aside>
  </div>;
}
