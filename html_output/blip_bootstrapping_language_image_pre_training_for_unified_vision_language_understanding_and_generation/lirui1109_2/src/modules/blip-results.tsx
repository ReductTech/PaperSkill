import { useState } from 'react';
import { Feedback, Photo } from './blip-kit';

export function BlipResults() {
  const [task, setTask] = useState<'retrieval' | 'vqa'>('retrieval');
  const groups = task === 'retrieval' ? [
    { label: '图找文字 TR', values: [77.6, 80.6] },
    { label: '文字找图 IR', values: [60.7, 63.1] },
  ] : [{ label: 'VQA 分数', values: [76.04, 77.62] }];
  const names = ['ALBEF · 14M', 'BLIP · 14M'];
  return <div className="blip-page" style={{ width: '100%', height: '100%', position: 'relative', color: '#21324a', fontSize: 'var(--ppt-body-text)' }}>
    <div style={{ display: 'flex', gap: 20 }}>
      {(['retrieval', 'vqa'] as const).map(key => <button key={key} className="blip-control" onClick={() => setTask(key)} aria-pressed={task === key} style={{ padding: '15px 30px', fontSize: 'var(--ppt-body-heading)', fontWeight: 700, background: key === task ? '#eaf0f5' : '#faf8f2', border: `2px solid ${key === task ? '#27446e' : '#d7deea'}`, borderRadius: '16px 16px 4px 4px' }}>{key === 'retrieval' ? '相册检索' : '看图问答'}</button>)}
    </div>
    <section style={{ position: 'absolute', top: 100, left: 0, width: 1030 }}>
      <h3 style={{ margin: '0 0 18px', fontSize: 'var(--ppt-body-heading)', lineHeight: 1.2 }}>{task === 'retrieval' ? 'COCO 5K 测试集 · R@1（%）↑' : 'VQA2.0 test-std · 分数 ↑'}</h3>
      <div style={{ height: 320, position: 'relative' }}>
        {groups.map((group, groupIndex) => <div key={group.label} style={{ position: 'absolute', top: groupIndex * 152, left: 0, width: '100%', lineHeight: 1.2 }}>
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{group.label}</div>
          {group.values.map((value, index) => <div key={names[index]} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 8 }}>
            <span style={{ width: 210, flex: 'none' }}>{names[index]}</span>
            <div style={{ width: 620, height: 32, background: '#eef0ee', borderLeft: '2px solid #68778f' }}><div style={{ width: `${value}%`, height: '100%', borderRadius: '0 6px 6px 0', background: index ? '#228d5c' : '#68778f' }} /></div>
            <strong style={{ width: 100, color: index ? '#228d5c' : '#21324a' }}>{task === 'retrieval' ? value.toFixed(1) : value.toFixed(2)}</strong>
          </div>)}
          {groupIndex === groups.length - 1 && <div style={{ marginLeft: 228, width: 620, display: 'flex', justifyContent: 'space-between', color: '#68778f' }}><span>0</span><span>50</span><span>100</span></div>}
        </div>)}
      </div>
      <p style={{ margin: 0, lineHeight: 1.35 }}>{task === 'retrieval' ? '均经检索微调；平均 R@1 提高 2.7 个百分点。' : '均经问答微调；评测时排序 3,128 个候选答案。'}</p>
    </section>
    <aside style={{ position: 'absolute', top: 92, left: 1090, width: 366 }}>
      <Photo kind={task === 'retrieval' ? 'travel' : 'umbrella'} width={340} height={140} />
      <p style={{ margin: '20px 0 0', lineHeight: 1.4 }}>图像描述 · BLIP 14M<br /><strong style={{ color: '#228d5c', fontSize: 'var(--ppt-body-emphasis)', lineHeight: 1.2 }}>129.7</strong> CIDEr</p>
      <p style={{ margin: '20px 0 0', lineHeight: 1.4 }}>COCO Karpathy 测试集；<br />CIDEr 越高越好。</p>
    </aside>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}><Feedback tone="green">同一框架支持不同任务；迁移时仍需各自的任务结构、微调和评测协议。</Feedback></div>
  </div>;
}
