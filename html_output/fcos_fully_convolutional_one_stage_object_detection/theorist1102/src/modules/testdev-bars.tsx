const ROWS = [
  { name: 'YOLOv2', value: 21.6, color: '#27446e' },
  { name: 'SSD513', value: 31.2, color: '#27446e' },
  { name: 'Faster R-CNN', value: 36.2, color: '#27446e' },
  { name: 'RetinaNet', value: 39.1, color: '#c43f52' },
  { name: 'CornerNet', value: 40.5, color: '#27446e' },
  { name: 'FCOS R101', value: 41.5, color: '#228d5c' },
  { name: 'FCOS X101', value: 43.2, color: '#228d5c' },
  { name: 'FCOS 改进', value: 44.7, color: '#f07e47' },
];

export function TestdevBars(_props: { chapterId: string; moduleId: string }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
      {ROWS.map((row) => (
        <div key={row.name} style={{ display: 'grid', gridTemplateColumns: '250px 1fr 90px', gap: 12, alignItems: 'center' }}>
          <div style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>{row.name}</div>
          <div style={{ height: 22, background: '#d7deea', borderRadius: 8 }}>
            <div style={{ width: `${(row.value / 50) * 100}%`, height: 22, background: row.color, borderRadius: 8 }} />
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.35, color: '#21324a' }}>{row.value.toFixed(1)}</div>
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 28, lineHeight: 1.35, color: '#68778f' }}><span>0</span><span>test-dev AP，轴到 50</span></div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <svg width="72" height="88" viewBox="0 0 72 88" aria-hidden="true">
          <rect x="6" y="6" width="60" height="76" fill="none" stroke="#92400e" strokeWidth="6" />
          <rect x="14" y="14" width="44" height="60" fill="#fffdf8" />
          <ellipse cx="36" cy="36" rx="10" ry="5" fill="#228d5c" />
          <path d="M 29 40 Q 36 56 43 40" fill="#27446e" />
        </svg>
        <div style={{ fontSize: 28, lineHeight: 1.3, color: '#21324a' }}>表 5 · test-dev，单模型单尺度。同骨干比较是 FCOS 41.5 对 RetinaNet 39.1（都是 ResNet-101-FPN）。其余行骨干/日程不同。44.7 还叠了表 3 的后续改进。</div>
      </div>
    </div>
  );
}
