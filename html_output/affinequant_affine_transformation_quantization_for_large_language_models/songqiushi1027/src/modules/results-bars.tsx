import type { WidgetProps } from './registry';

function Group({ title, unit, better, items }: {
  title: string; unit: string; better: string;
  items: { name: string; value: number; tone: 'green' | 'red'; max: number }[];
}) {
  return (
    <div className="aq-panel grow">
      <div className="aq-heading">{title}</div>
      <div className="aq-body muted">{better}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
        {items.map((it) => (
          <div key={it.name} style={{ display: 'grid', gridTemplateColumns: '200px minmax(0,1fr) auto', gap: 14, alignItems: 'center' }}>
            <span className="aq-body">{it.name}</span>
            <div style={{ height: 30, borderRadius: 999, background: '#eef2f7', overflow: 'hidden' }}>
              <div style={{ width: `${(it.value / it.max) * 100}%`, height: '100%', background: it.tone === 'green' ? '#228d5c' : '#c43f52', borderRadius: 999 }} />
            </div>
            <b className="aq-emphasis" style={{ color: it.tone === 'green' ? '#228d5c' : '#c43f52', whiteSpace: 'nowrap' }}>{it.value}<span style={{ fontSize: 'var(--ppt-body-text)' }}>{unit}</span></b>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsBars(_props: WidgetProps) {
  return (
    <div className="aq-layout aq-two">
      <Group title="LLaMA2-7B w4a4 · C4 困惑度" unit="" better="PPL 越低越好" items={[
        { name: 'OmniQuant', value: 18.02, tone: 'red', max: 20 },
        { name: 'AffineQuant', value: 15.76, tone: 'green', max: 20 },
      ]} />
      <Group title="LLaMA-30B w4a4 · zero-shot 准确率" unit="%" better="准确率越高越好" items={[
        { name: 'OmniQuant', value: 55.63, tone: 'red', max: 100 },
        { name: 'AffineQuant', value: 58.61, tone: 'green', max: 100 },
      ]} />
      <div className="aq-panel" style={{ gridColumn: '1 / -1', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <p className="aq-body">另：OPT-125M <b>w3a16g128</b> PPL 下降 <b>5.10</b>；低比特与小模型收益最大。</p>
        <p className="aq-note">数据来自论文（文献卡片），与 OmniQuant <b>同协议</b>对比。</p>
      </div>
    </div>
  );
}