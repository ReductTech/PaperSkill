import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

type View = 'ref' | 'flickr';

const REF = [
  { name: 'Qwen-VL', val: 89.4 },
  { name: 'Ferret-13B', val: 89.5 },
  { name: 'Shikra-13B', val: 87.8 },
  { name: 'Griffon-13B', val: 89.4 },
  { name: 'Griffon-13B*', val: 90.1 },
];

const FLICKR = [
  { name: 'ANY val', val: 83.7, note: 'Griffon' },
  { name: 'ANY test', val: 84.2, note: 'Griffon' },
  { name: 'MERGED val', val: 82.0, note: 'Griffon' },
  { name: 'MERGED test', val: 82.8, note: 'Griffon' },
  { name: 'Ferret MERGED test', val: 84.8, note: '对照' },
];

export function GriffonRec(_props: WidgetProps) {
  const [view, setView] = useState<View>('ref');
  const [stamp, setStamp] = useState(0);
  const data = view === 'ref' ? REF : FLICKR.map((d) => ({ name: d.name, val: d.val }));
  const max = Math.max(...data.map((d) => d.val));

  useEffect(() => {
    setStamp(0.08);
  }, [view]);

  useEffect(() => {
    if (stamp <= 0 || stamp >= 1) return;
    const id = window.requestAnimationFrame(() => setStamp((v) => Math.min(1, v + 0.08)));
    return () => window.cancelAnimationFrame(id);
  }, [stamp]);

  return (
    <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 16, height: '100%', color: '#21324a' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="button" onClick={() => setView('ref')} style={btn(view === 'ref')}>RefCOCO val ACC@0.5</button>
        <button type="button" onClick={() => setView('flickr')} style={btn(view === 'flickr')}>Flickr30K Entities</button>
        <span style={{ fontSize: 26, color: '#68778f' }}>成绩印章 · higher is better · 主比通用 LVLM</span>
      </div>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 14, padding: '12px 8px 0', background: '#f5f8f0', borderRadius: 16, border: '1px solid #d7deea' }}>
        {data.map((d) => {
          const h = ((d.val - 70) / (max - 70 + 0.01)) * 260 + 70;
          const highlight = d.name.includes('Griffon');
          return (
            <div key={d.name} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 26, marginBottom: 8, color: highlight ? '#228d5c' : '#21324a' }}>{d.val}</div>
              <div style={{
                height: h * (0.55 + 0.45 * stamp), borderRadius: '10px 10px 4px 4px', margin: '0 auto', width: '72%',
                background: highlight ? '#228d5c' : '#27446e', opacity: highlight ? 1 : 0.5,
                transition: 'height 0.05s linear',
              }} />
              <div style={{ fontSize: 20, marginTop: 10, lineHeight: 1.2 }}>{d.name}</div>
            </div>
          );
        })}
        <div style={{
          position: 'absolute', right: 18, top: 18,
          transform: `rotate(-12deg) scale(${0.7 + 0.3 * stamp})`,
          opacity: stamp,
          border: '4px solid #228d5c', color: '#228d5c', borderRadius: 12,
          padding: '8px 14px', fontSize: 24, fontWeight: 800, background: 'rgba(231,246,238,0.92)',
        }}>
          {view === 'ref' ? '印样评级 · REC' : '印样评级 · Phrase'}
        </div>
      </div>
      <div style={{ fontSize: 26, color: '#68778f', lineHeight: 1.4 }}>
        {view === 'ref'
          ? 'Table 1（仅 val）：Griffon-13B 为 89.4，与 Qwen-VL 并列；Griffon-13B*（仅 REC 预训练、公平设置）为 90.1。'
          : 'Table 2：Griffon ANY val/test 83.7/84.2（领先）；MERGED test 82.8，低于 Ferret 的 84.8。ANY 看实例原子性，MERGED 看合并框。'}
      </div>
    </div>
  );
}

function btn(active: boolean): React.CSSProperties {
  return {
    fontSize: 28, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
    border: `2px solid ${active ? '#27446e' : '#d7deea'}`,
    background: active ? '#27446e' : '#fff', color: active ? '#fff' : '#21324a',
  };
}
