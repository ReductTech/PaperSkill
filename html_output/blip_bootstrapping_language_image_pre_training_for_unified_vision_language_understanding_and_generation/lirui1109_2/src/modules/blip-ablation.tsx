import { Photo, Feedback } from './blip-kit';

const ablations = [
  { label: '原始网页文本', value: 127.8, color: '#68778f' },
  { label: '仅过滤', value: 128.2, color: '#27446e' },
  { label: '仅生成', value: 128.9, color: '#27446e' },
  { label: '生成 + 过滤', value: 129.7, color: '#228d5c' },
];

export function BlipAblation() {
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', fontSize: 'var(--ppt-body-text)', color: '#21324a' }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1040 }}>
      <h3 style={{ fontSize: 'var(--ppt-body-heading)', margin: '0 0 26px' }}>COCO 图像描述 · CIDEr ↑</h3>
      <div role="img" aria-label="原始文本127.8，仅过滤128.2，仅生成128.9，生成加过滤129.7。柱图从零开始。" style={{ position: 'relative', height: 354 }}>
        {ablations.map((item, index) => <div key={item.label} style={{ position: 'absolute', top: index * 75, left: 0, width: 1030, height: 60, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ width: 190, flex: 'none', fontWeight: index === 3 ? 750 : 500 }}>{item.label}</span>
          <div style={{ width: 704, height: 35, background: '#eef0ee', borderLeft: '2px solid #68778f', position: 'relative' }}>
            <div style={{ width: `${item.value / 140 * 100}%`, height: '100%', background: item.color, borderRadius: '0 7px 7px 0' }} />
          </div>
          <strong style={{ width: 100, color: item.color }}>{item.value.toFixed(1)}</strong>
        </div>)}
        <div style={{ position: 'absolute', left: 206, top: 307, width: 704, display: 'flex', justifyContent: 'space-between', color: '#68778f' }}><span>0</span><span>70</span><span>140</span></div>
      </div>
      <p style={{ margin: 0, lineHeight: 1.45 }}>相同 14M 图像、ViT-B/16；COCO Karpathy 测试集。<br />柱长差异很小，精确值支持判断：组合比原始文本高 1.9。</p>
    </div>
    <aside style={{ position: 'absolute', left: 1100, top: 8, width: 360 }}>
      <Photo kind="cake" width={330} height={205} />
      <p style={{ fontSize: 'var(--ppt-body-heading)', fontWeight: 750, lineHeight: 1.3, margin: '24px 0 12px' }}>补训练，<br />不等于补信息。</p>
      <p style={{ lineHeight: 1.45, margin: 0 }}>把原始文本复制到同等样本量，CIDEr 为 <strong>127.7</strong>，未复现 CapFilt 的收益。</p>
    </aside>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Feedback tone="green">生成提供新描述，过滤减少噪声；本文设置中二者结合最好。</Feedback></div>
  </div>;
}
