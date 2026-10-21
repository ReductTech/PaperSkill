import React, { useMemo, useState } from 'react';

type Props = { chapterId: string; moduleId: string };
type Source = { key: string; label: string; color: string; note: string };
const sources: Source[] = [
  { key: 'original', label: '原始人工', color: '#4267ac', note: '原有 (X,Y) 视频—文字对' },
  { key: 'recaption', label: '重描述', color: '#43a989', note: 'Narrator 在已标注片段上重新生成文字' },
  { key: 'pseudo', label: '伪描述', color: '#d9903d', note: 'Narrator 为未标注间隔补充文字' },
  { key: 'rephrase', label: '改写', color: '#9369c6', note: 'Rephraser 改写已有 narration' },
];
const panel: React.CSSProperties = { padding: '1rem', border: '1px solid #dce4ec', borderRadius: 16, background: '#fbfdff' };
const row: React.CSSProperties = { display: 'flex', gap: '.6rem', flexWrap: 'wrap', alignItems: 'center' };
const btn = (active: boolean): React.CSSProperties => ({ border: '1px solid ' + (active ? '#4267ac' : '#cbd6e3'), background: active ? '#e9f1ff' : '#fff', color: '#213c60', padding: '.5rem .75rem', borderRadius: 10, cursor: 'pointer', fontWeight: active ? 700 : 500 });
const note: React.CSSProperties = { marginTop: '.8rem', padding: '.65rem .8rem', borderLeft: '4px solid #43a989', background: '#edf8f4', borderRadius: 8, lineHeight: 1.6 };
const badge: React.CSSProperties = { fontSize: '.78rem', color: '#52677c', background: '#eff3f8', padding: '.25rem .5rem', borderRadius: 8 };

function Mixer() {
  const [weights, setWeights] = useState<Record<string, number>>({ original: 5, recaption: 3, pseudo: 2, rephrase: 2 });
  const total = sources.reduce((sum, source) => sum + weights[source.key], 0);
  const maxSource = sources.reduce((a, b) => weights[a.key] >= weights[b.key] ? a : b);
  return <div style={panel}>
    <div style={row}><strong>组装一批训练配对</strong><span style={badge}>教学示意：滑杆权重不是论文采样比例</span></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '.75rem', marginTop: '.8rem' }}>
      {sources.map(source => <label key={source.key} style={{ padding: '.65rem', border: '1px solid #e3eaf1', borderRadius: 10, background: '#fff' }}>
        <span style={{ color: source.color, fontWeight: 700 }}>{source.label}</span>
        <span style={{ float: 'right', fontVariantNumeric: 'tabular-nums' }}>{weights[source.key]}</span>
        <input aria-label={source.label + '示意权重'} type="range" min="0" max="10" value={weights[source.key]} onChange={e => setWeights(w => ({ ...w, [source.key]: Number(e.target.value) }))} style={{ width: '100%', accentColor: source.color }} />
      </label>)}
    </div>
    <div aria-label="示意批次构成" style={{ display: 'flex', width: '100%', height: 34, borderRadius: 10, overflow: 'hidden', marginTop: '.8rem', background: '#e8edf4' }}>
      {total > 0 && sources.map(source => <div key={source.key} title={source.label + '：' + Math.round(weights[source.key] / total * 100) + '%'} style={{ width: weights[source.key] / total * 100 + '%', background: source.color, transition: 'width .2s' }} />)}
    </div>
    <div style={{ ...row, marginTop: '.6rem' }}>{sources.map(source => <span key={source.key} style={{ fontSize: '.85rem' }}><span style={{ color: source.color }}>●</span> {source.label} {total ? Math.round(weights[source.key] / total * 100) : 0}%</span>)}</div>
    <div role="status" style={note}>{total ? <>当前示意批次最侧重<strong>{maxSource.label}</strong>。四类卡片都指向同一个训练目标：把对应的视频与文字拉近；调整比例不代表论文实测性能预测。</> : '批次为空，至少开启一类配对才能训练。'}</div>
  </div>;
}

const matrices: Record<string, { title: string; captions: string[]; values: number[][]; explanation: string }> = {
  original: { title: '原始人工描述', captions: ['拿起杯子', '推开抽屉', '切开面包'], values: [[.84,.22,.18],[.19,.81,.27],[.14,.31,.87]], explanation: '原始人工 narration 为正对角提供人类写下的对应关系。' },
  recaption: { title: 'Narrator 重描述', captions: ['举起水杯', '拉开抽屉', '将面包切片'], values: [[.79,.23,.21],[.25,.77,.28],[.22,.29,.82]], explanation: '同一已标注片段获得新的描述方式，仍与该视频构成正配对。' },
  pseudo: { title: 'Narrator 伪描述', captions: ['放下盘子', '关上柜门', '拿出毛巾'], values: [[.76,.20,.25],[.24,.74,.18],[.15,.26,.78]], explanation: '原先缺乏文字的片段现在获得候选叙述，质量筛选后加入训练。' },
  rephrase: { title: 'Rephraser 改写', captions: ['取起一只杯子', '把抽屉打开', '把面包分成片'], values: [[.82,.24,.20],[.21,.78,.25],[.17,.27,.83]], explanation: '文字表达改变，视频仍是原配对中的同一个片段。' },
};
function Contrastive() {
  const [source, setSource] = useState('original');
  const [cell, setCell] = useState<[number, number]>([0,0]);
  const data = matrices[source];
  return <div style={panel}>
    <div style={row}><strong>选择训练配对来源</strong><span style={badge}>矩阵数值为教学示意，不是论文结果</span></div>
    <div style={{ ...row, margin: '.65rem 0' }}>{sources.map(s => <button type="button" key={s.key} style={btn(source === s.key)} onClick={() => { setSource(s.key); setCell([0,0]); }}>{s.label}</button>)}</div>
    <p style={{ margin: '.35rem 0' }}>{data.title}：{data.explanation}</p>
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'separate', borderSpacing: 4, minWidth: 380, width: '100%', textAlign: 'center' }}>
        <thead><tr><th style={{ textAlign: 'left' }}>视频 ↓ / 文本 →</th>{data.captions.map((caption,i) => <th key={i} style={{ fontSize: '.8rem' }}>{caption}</th>)}</tr></thead>
        <tbody>{data.values.map((line,i) => <tr key={i}><th style={{ textAlign: 'left', fontSize: '.85rem' }}>片段 {i+1}</th>{line.map((value,j) => <td key={j}><button type="button" aria-label={'片段'+(i+1)+'和文本'+(j+1)+'的配对'} onClick={() => setCell([i,j])} style={{ width: '100%', minHeight: 42, borderRadius: 8, cursor: 'pointer', border: cell[0] === i && cell[1] === j ? '2px solid #182b47' : '1px solid #d8e0e9', background: i === j ? '#dff3e9' : '#f5f0eb', color: '#22384d', fontWeight: i === j ? 700 : 400 }}>{value.toFixed(2)}</button></td>)}</tr>)}</tbody>
      </table>
    </div>
    <div role="status" style={note}>片段 {cell[0]+1} ×「{data.captions[cell[1]]}」是<strong>{cell[0] === cell[1] ? '正配对：同一视频对应文字' : '批内负配对：文字属于另一视频'}</strong>。对比目标是让匹配的对角线相对更高（第3页 Eq.1）。</div>
  </div>;
}

function OfflineCache() {
  const [cached, setCached] = useState(true);
  const stages = cached ? ['Narrator / Rephraser 批量生成', '保存生成配对', '读取缓存批次', '双编码器对比训练'] : ['取训练批次', '逐步调用生成模型', '等待文字返回', '双编码器对比训练'];
  return <div style={panel}>
    <div style={row}><strong>把生成安排在训练之前还是训练之中？</strong><span style={badge}>流程示意，无耗时预测</span></div>
    <div style={{ ...row, marginTop: '.7rem' }}><button type="button" style={btn(cached)} onClick={() => setCached(true)}>预先缓存（论文实现）</button><button type="button" style={btn(!cached)} onClick={() => setCached(false)}>每步在线生成（对照设想）</button></div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '.6rem', marginTop: '.9rem' }}>
      {stages.map((stage,i) => <div key={stage} style={{ padding: '.7rem', minHeight: 65, borderRadius: 10, border: '1px solid #d7e0ec', background: cached && i === 2 ? '#dff3e9' : i === 1 && !cached ? '#fff2df' : '#f4f7fb' }}><small style={{ color: '#60748c' }}>步骤 {i+1}</small><br /><strong>{stage}</strong></div>)}
    </div>
    <div role="status" style={note}>{cached ? '生成配对在训练开始前准备好；训练循环读缓存。论文第5页 §4.3 采用这一安排。' : '这条路线仅用于对比流程：如果每个训练步都生成文字，就会把生成阶段插进训练循环。论文没有报告此设想的速度或精度。'}</div>
  </div>;
}

function FrameSampler() {
  const [count, setCount] = useState<4 | 16>(4);
  const sampled = useMemo(() => count === 4 ? [1,5,9,13] : Array.from({length:16},(_,i)=>i), [count]);
  return <div style={panel}>
    <div style={row}><strong>同一段视频，取多少帧？</strong><span style={badge}>论文第5页 Experiments 的设置</span></div>
    <div style={{ ...row, margin: '.7rem 0' }}><button type="button" style={btn(count===4)} onClick={() => setCount(4)}>预训练 · 4 帧</button><button type="button" style={btn(count===16)} onClick={() => setCount(16)}>微调 · 16 帧</button></div>
    <div aria-label={count + '帧采样示意'} style={{ display: 'grid', gridTemplateColumns: 'repeat(8,minmax(0,1fr))', gap: 5 }}>
      {Array.from({length:16},(_,i) => <div key={i} style={{ aspectRatio: '1.45', display: 'grid', placeItems: 'center', borderRadius: 6, border: '1px solid #cbd7e5', background: sampled.includes(i) ? '#cde9df' : '#eef2f7', color: sampled.includes(i) ? '#205c4a' : '#96a5b5', fontSize: '.75rem', fontWeight: 700 }}>{String(i+1).padStart(2,'0')}</div>)}
    </div>
    <div role="status" style={note}>当前选中 {sampled.length} / 16 个示意帧。{count===4 ? '论文预训练设置是 4 帧，以较少采样帧学习大规模视频—文本对应。' : '论文微调设置是 16 帧，让下游阶段看到更密的时序采样。'}此条带仅说明采样数量，不复刻实际视频帧。</div>
  </div>;
}

export const Ch7Lab: React.FC<Props> = ({ moduleId }) => {
  if (moduleId === '7.1') return <Mixer />;
  if (moduleId === '7.2') return <Contrastive />;
  if (moduleId === '7.3') return <OfflineCache />;
  if (moduleId === '7.4') return <FrameSampler />;
  return null;
};
