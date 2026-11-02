const MINIVAL = [
  { name: 'RetinaNet C5', value: 35.9, color: '#c43f52' },
  { name: 'FCOS C5', value: 36.3, color: '#228d5c' },
  { name: 'FCOS P5+GN+NMS0.6', value: 37.1, color: '#228d5c' },
  { name: '后续改进累计', value: 38.6, color: '#f07e47' },
];

export function MinivalBars(_props: { chapterId: string; moduleId: string }) {
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '1080px 352px', gap: 40, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {MINIVAL.map((row) => (
          <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '320px 1fr 90px', gap: 12, alignItems: 'center' }}>
            <div style={{ fontSize: 26, lineHeight: 1.2, color: '#21324a' }}>{row.name}</div>
            <div style={{ height: 28, background: '#d7deea', borderRadius: 8 }}>
              <div style={{ width: `${(row.value / 50) * 100}%`, height: 28, background: row.color, borderRadius: 8 }} />
            </div>
            <div style={{ fontSize: 28, lineHeight: 1.2, color: '#21324a' }}>{row.value.toFixed(1)}</div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, color: '#68778f' }}><span>0</span><span>AP，轴到 50</span></div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>表 3 · minival，ResNet-50，AP 越高越好。同设定 C5：FCOS 36.3 对 RetinaNet 35.9（AP50 却是 54.8 对 56.0）。37.1 还需 P5、GN 与 NMS 0.6，不是只加 GN。</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <svg width="180" height="220" viewBox="0 0 180 220" aria-hidden="true">
          <rect x="18" y="16" width="144" height="188" fill="none" stroke="#92400e" strokeWidth="10" />
          <rect x="34" y="32" width="112" height="156" fill="#fffdf8" />
          <ellipse cx="90" cy="90" rx="22" ry="10" fill="#228d5c" />
          <path d="M 74 98 Q 90 140 106 98" fill="#27446e" />
        </svg>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#68778f', textAlign: 'center' }}>柱子是表 3 的原数，相框只是主题标记。</div>
      </div>
    </div>
  );
}
