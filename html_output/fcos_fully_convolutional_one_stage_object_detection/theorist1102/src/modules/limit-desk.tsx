import { useState } from 'react';

const MODES = ['nms', 'range', 'center'] as const;

export function LimitDesk(_props: { chapterId: string; moduleId: string }) {
  const [mode, setMode] = useState<(typeof MODES)[number]>('nms');
  const copy = {
    nms: '关掉 NMS 后，两张几乎一样的装裱会同时留下。论文把 NMS 称为唯一后处理，锚框取消了，这一步还在。',
    range: 'P3 到 P7 的距离界限仍是人手设定的 0、64、128、256、512 和无穷。无锚框不等于没有任何尺度超参数。',
    center: '表 4：没有中心度是 33.5 AP，拿回归向量现算还是 33.5，单独的分支才到 37.1。边缘的手指不能靠事后公式补上。',
  }[mode];
  const tone = mode === 'nms' ? '#c43f52' : mode === 'range' ? '#f07e47' : '#27446e';
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '900px 532px', gap: 40 }}>
      <svg viewBox="0 0 900 622" width="900" height="622" role="img" aria-label="装裱仍然会遇到的三种限制">
        <rect width="900" height="622" rx="18" fill="#f3ead7" />
        {mode === 'nms' && <>
          <rect x="180" y="150" width="360" height="300" fill="#fffdf8" stroke="#c43f52" strokeWidth="8" />
          <rect x="240" y="190" width="360" height="300" fill="#fffdf8" stroke="#c43f52" strokeWidth="8" opacity="0.95" />
          <ellipse cx="390" cy="300" rx="26" ry="12" fill="#228d5c" />
          <path d="M 372 310 Q 390 360 408 310" fill="#27446e" />
        </>}
        {mode === 'range' && ['0', '64', '128', '256', '512', '∞'].map((mark, i) => (
          <g key={mark}>
            <rect x={70 + i * 130} y="220" width="110" height="150" rx="12" fill="#fffdf8" stroke="#92400e" strokeWidth="6" />
            <text x={125 + i * 130} y="310" textAnchor="middle" fill="#21324a" fontSize="28">{mark}</text>
          </g>
        ))}
        {mode === 'center' && <>
          <rect x="160" y="80" width="560" height="460" fill="#fffdf8" stroke="#92400e" strokeWidth="8" />
          <circle cx="440" cy="310" r="16" fill="#228d5c" />
          <circle cx="190" cy="120" r="16" fill="#c43f52" />
          <text x="470" y="320" fill="#21324a" fontSize="28">中心</text>
          <text x="220" y="130" fill="#21324a" fontSize="28">边缘</text>
        </>}
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 12 }}>
        {([
          ['nms', '去掉 NMS'],
          ['range', '距离界限还在'],
          ['center', '中心度要单学'],
        ] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setMode(id)} aria-pressed={mode === id}
            style={{ fontSize: 28, lineHeight: 1.3, textAlign: 'left', padding: '10px 16px', borderRadius: 12, cursor: 'pointer', border: `2px solid ${mode === id ? '#27446e' : '#d7deea'}`, background: mode === id ? '#27446e' : '#fff', color: mode === id ? '#fff' : '#21324a' }}>
            {label}
          </button>
        ))}
        <div style={{ fontSize: 28, lineHeight: 1.35, color: tone }}>{copy}</div>
      </div>
    </div>
  );
}
