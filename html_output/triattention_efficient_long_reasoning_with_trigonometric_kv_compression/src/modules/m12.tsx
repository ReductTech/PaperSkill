import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const STAGES = [
  { id: 'short', label: '短文本', full: 28, smart: 28, msg: '短文本：不压缩也放得下。' },
  { id: 'mid', label: '中文本', full: 72, smart: 44, msg: '中文本：不压缩快满了，压缩后还留得住。' },
  { id: 'long', label: '长推理', full: 118, smart: 56, msg: '长推理：不压缩直接 OOM；压缩后只留重要 K/V，稳稳放下。' },
];

export const M12: React.FC<WidgetProps> = () => {
  const [stage, setStage] = useState(0);
  const s = STAGES[stage];
  const bar = (pct: number, color: string, overflow: boolean) => (
    <div style={{ height: 16, background: '#eef1f5', borderRadius: 8, overflow: 'hidden', position: 'relative' }}>
      <div style={{ height: '100%', width: Math.min(pct, 100) + '%', background: color, transition: 'width .3s' }} />
      {overflow ? <span style={{ position: 'absolute', right: 6, top: 0, fontSize: 12, color: '#c43f52' }}>放不下 ✗</span> : null}
    </div>
  );
  return (
    <div>
      <div style={{ fontSize: 13, color: '#68778f', marginBottom: 4 }}>不压缩：所有 K/V 都保留</div>
      {bar(s.full, s.full > 100 ? '#c43f52' : '#27446e', s.full > 100)}
      <div style={{ fontSize: 13, color: '#68778f', margin: '12px 0 4px' }}>压缩后：只留未来还会被关注的 K/V</div>
      {bar(s.smart, '#228d5c', false)}
      <div style={{ marginTop: 8, fontSize: 13, color: '#21324a' }}>显存占用：不压缩 {Math.min(s.full, 100)}% · 压缩 {s.smart}%</div>
      <div className="ctrl">
        {STAGES.map((st, i) => (
          <button key={st.id} className="chip" style={stage === i ? { borderColor: '#27446e', background: '#27446e', color: '#fff' } : undefined} onClick={() => setStage(i)}>{st.label}</button>
        ))}
      </div>
      <div className={`feedback ${s.full > 100 ? 'bad' : 'good'}`}>{s.msg}</div>
    </div>
  );
};

export default M12;