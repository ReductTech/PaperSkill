import { useState } from 'react';
import { Feedback, useTween } from './blip-kit';

const med = [
  { name: '全部共享', parameters: 224, cider: 125.9, explanation: '双向理解与因果生成共用 SA，论文中的效果较弱。' },
  { name: '仅 SA 分开', parameters: 252, cider: 127.8, explanation: 'CA、FFN 和词嵌入共用，SA 分别服务理解与生成。' },
  { name: '完全不共享', parameters: 361, cider: 127.4, explanation: '参数更多，在这组实验中未超过“仅 SA 分开”。' },
];
const capfilt = [
  { name: '两模块共享', rejected: 8, cider: 103.5, explanation: '拒绝较少，但下游较弱；作者将其归因为确认偏差。' },
  { name: '分别微调', rejected: 25, cider: 105.1, explanation: 'Captioner 和 Filter 各自微调，独立检查有助于发现噪声。' },
];

export function BlipSharing() {
  const [context, setContext] = useState<'med' | 'capfilt'>('med');
  const [strategy, setStrategy] = useState(1);
  const options = context === 'med' ? med : capfilt;
  const current = options[strategy];
  const separate = context === 'med' ? strategy !== 0 : strategy === 1;
  const spread = useTween(separate ? 1 : 0, 500);
  const chooseContext = (next: 'med' | 'capfilt') => { setContext(next); setStrategy(1); };
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', fontSize: 'var(--ppt-body-text)', color: '#21324a' }}>
    <div style={{ display: 'flex', gap: 22, height: 68 }}>
      {(['med', 'capfilt'] as const).map(key => <button key={key} className="blip-control" aria-pressed={context === key} onClick={() => chooseContext(key)} style={{ flex: 1, fontSize: 'var(--ppt-body-heading)', fontWeight: 700, border: `2px solid ${context === key ? '#27446e' : '#d7deea'}`, background: context === key ? '#eaf0f5' : '#faf8f2', borderRadius: 14 }}>{key === 'med' ? 'MED：同一模型内部' : 'CapFilt：两个微调模块'}</button>)}
    </div>
    <div style={{ display: 'flex', gap: 16, marginTop: 20 }}>
      {options.map((option, index) => <button className="blip-control" key={option.name} onClick={() => setStrategy(index)} aria-pressed={strategy === index} style={{ padding: '12px 26px', fontSize: 'var(--ppt-body-text)', border: `2px solid ${strategy === index ? '#228d5c' : '#d7deea'}`, background: strategy === index ? '#eaf4ed' : '#fff', borderRadius: 10 }}>{option.name}</button>)}
    </div>
    <div style={{ position: 'absolute', top: 185, left: 0, width: 800, height: 300, background: '#f4efe4', borderRadius: 22 }}>
      {[0, 1].map(index => <div key={index} style={{ position: 'absolute', top: 30, left: 68 + index * (325 + spread * 40), width: 310, height: 235, background: '#fffef9', boxShadow: '0 8px 16px #21324a12', border: '2px solid #d6ccba', borderRadius: 8, transform: `rotate(${(index ? 1 : -1) * (2 + spread * 3)}deg)` }}>
        <strong style={{ display: 'block', margin: '22px 24px', fontSize: 'var(--ppt-body-heading)' }}>{context === 'med' ? index ? '写说明' : '读说明' : index ? '校对者' : '写作者'}</strong>
        <div style={{ margin: '14px 24px', padding: '8px 10px', borderRadius: 9, background: separate ? index ? '#f8e6df' : '#e8eef5' : '#e8eef5', color: '#27446e' }}>{context === 'med' ? separate ? index ? '因果 SA' : '双向 SA' : '共用 SA' : separate ? '各自微调' : '共享参数'}</div>
        <div style={{ margin: '14px 24px', padding: '8px 10px', borderRadius: 9, background: context === 'med' && strategy !== 2 ? '#eaf4ed' : '#eef0ef' }}>{context === 'med' ? strategy !== 2 ? '共用 CA、FFN' : '各自 CA、FFN' : index ? 'ITC + ITM' : 'LM'}</div>
      </div>)}
    </div>
    <aside style={{ position: 'absolute', top: 184, left: 866, width: 594 }}>
      <h3 style={{ fontSize: 'var(--ppt-body-heading)', lineHeight: 1.2, margin: '0 0 12px' }}>{current.name}</h3>
      <div style={{ display: 'flex', gap: 38, marginBottom: 14, lineHeight: 1.35 }}>
        <div><span>{context === 'med' ? '参数量' : 'Filter 拒绝比例'}</span><strong style={{ display: 'block', fontSize: 'var(--ppt-body-emphasis)', lineHeight: 1.3, color: '#27446e', marginTop: 8 }}>{context === 'med' ? `${med[strategy].parameters}M` : `${capfilt[strategy].rejected}%`}</strong></div>
        <div><span>{context === 'med' ? 'COCO CIDEr ↑' : 'NoCaps CIDEr ↑'}</span><strong style={{ display: 'block', fontSize: 'var(--ppt-body-emphasis)', lineHeight: 1.3, color: strategy === 1 ? '#228d5c' : '#27446e', marginTop: 8 }}>{current.cider.toFixed(1)}</strong></div>
      </div>
      <p style={{ margin: '0 0 12px', lineHeight: 1.35 }}>{current.explanation}</p>
      <p style={{ margin: 0, lineHeight: 1.35, color: '#68778f' }}>{context === 'med' ? '14M 原始图文预训练；COCO 微调测试。' : '14M 图像；NoCaps 零样本图像描述。拒绝比例不等于人工真噪声率。'}</p>
    </aside>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Feedback tone={strategy === 1 ? 'green' : 'blue'}>{context === 'med' ? '预训练：共用能共用的层，把双向与因果 SA 分开。' : 'CapFilt：共同初始化，不等于微调后继续共享参数。'}</Feedback></div>
  </div>;
}
