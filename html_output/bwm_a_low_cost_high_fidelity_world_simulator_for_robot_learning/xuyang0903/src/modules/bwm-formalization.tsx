import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

const C = {
  ink: '#243128', muted: '#647068', line: '#cbd6c6', field: '#f5f8f0', white: '#ffffff',
  blue: '#27446e', blueSoft: '#dce8f4', green: '#228d5c', greenSoft: '#dff3e9',
  orange: '#d97706', orangeSoft: '#fff0d6', purple: '#7553a6', purpleSoft: '#eee8f7', red: '#c43f52',
};

const card: React.CSSProperties = { border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, padding: 16 };

function Prop({ shift = 0, ghost = false, size = 34, bottom = 27, identity = 'A' }: { shift?: number; ghost?: boolean; size?: number; bottom?: number; identity?: string }) {
  return (
    <div style={{ position: 'absolute', left: `calc(50% + ${shift}px)`, bottom, width: size, height: size, transform: 'translateX(-50%) rotate(3deg)', borderRadius: Math.max(5, size * .18), border: `2px solid ${ghost ? C.muted : C.ink}`, background: ghost ? C.blueSoft : C.green, opacity: ghost ? .55 : 1, color: C.white, display: 'grid', placeItems: 'center', fontWeight: 900, fontSize: Math.max(10, size * .34), transition: 'left 700ms cubic-bezier(.2,.8,.2,1), background 400ms ease', zIndex: 2 }}>{identity}</div>
  );
}

function ActionDemo() {
  const [action, setAction] = useState<-1 | 0 | 1>(1);
  const [executed, setExecuted] = useState(false);
  const labels = { [-1]: '向左推', [0]: '保持', [1]: '向右推' } as const;
  const target = executed ? action * 46 : 0;
  const outcomes = [
    { id: 'video', title: '通用视频模型', note: '画面会变化，但不由该动作精确控制', color: C.red, shift: executed ? 22 : 0, identity: 'A', actionOk: false, stateOk: true },
    { id: 'drift', title: '只响应动作的模型', note: '位置跟随动作，但物体身份发生漂移', color: C.orange, shift: target, identity: executed ? 'B' : 'A', actionOk: true, stateOk: false },
    { id: 'bwm', title: 'BWM 条件预测', note: '动作方向一致，并保持物体与片场身份', color: C.green, shift: target, identity: 'A', actionOk: true, stateOk: true },
  ];
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...card, background: C.field }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div><small style={{ color: C.orange, fontWeight: 800 }}>候选动作块 aₜ₊₁:ₜ₊K</small><h4 style={{ margin: '4px 0 0', color: C.ink }}>{labels[action]}</h4></div>
          <div style={{ display: 'flex', gap: 8 }}>{([-1, 0, 1] as const).map((value) => <button key={value} type="button" onClick={() => { setAction(value); setExecuted(false); }} aria-pressed={action === value} style={{ border: `1px solid ${action === value ? C.orange : C.line}`, background: action === value ? C.orangeSoft : C.white, color: action === value ? C.orange : C.ink, borderRadius: 9, padding: '8px 13px', fontWeight: 750, cursor: 'pointer' }}>{labels[value]}</button>)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '9px 11px', borderRadius: 10, background: C.blueSoft, color: C.blue }}>
          <b style={{ whiteSpace: 'nowrap' }}>共同起点 x₀</b><span style={{ height: 3, flex: 1, background: C.blue, opacity: .35 }} /><span style={{ fontSize: 12 }}>同一个物体 A、同一片场、同一动作块</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(180px,1fr))', gap: 10, marginTop: 12, overflowX: 'auto' }}>
          {outcomes.map((item) => <div key={item.id} style={{ ...card, minWidth: 180, padding: 11, borderColor: executed ? item.color : C.line, transition: 'border-color 300ms ease' }}>
            <b style={{ color: executed ? item.color : C.ink, fontSize: 13 }}>{item.title}</b>
            <div style={{ height: 108, position: 'relative', marginTop: 8, borderRadius: 9, overflow: 'hidden', background: executed && item.id === 'bwm' ? C.greenSoft : C.white, border: `1px dashed ${C.line}` }}>
              <span style={{ position: 'absolute', left: 9, top: 7, color: C.muted, fontSize: 10 }}>{executed ? '未来观察' : '等待执行'}</span>
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 24, height: 3, background: C.muted, opacity: .7 }} />
              <Prop shift={item.shift} size={32} bottom={26} identity={item.identity} />
              {executed && action !== 0 && item.id !== 'video' && <span style={{ position: 'absolute', left: '50%', bottom: 62, transform: `translateX(${action > 0 ? '13px' : '-40px'})`, color: C.orange, fontWeight: 900 }}>{action > 0 ? '→' : '←'}</span>}
              {executed && item.id === 'video' && <span style={{ position: 'absolute', right: 10, top: 8, color: C.red, fontSize: 10, fontWeight: 800 }}>与指令脱钩</span>}
            </div>
            <p style={{ minHeight: 38, margin: '8px 0', color: C.muted, fontSize: 11, lineHeight: 1.5 }}>{item.note}</p>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}><span style={{ borderRadius: 999, padding: '3px 7px', background: item.actionOk ? C.greenSoft : '#f9e1e5', color: item.actionOk ? C.green : C.red, fontSize: 10, fontWeight: 800 }}>{item.actionOk ? '✓' : '×'} 动作响应</span><span style={{ borderRadius: 999, padding: '3px 7px', background: item.stateOk ? C.greenSoft : '#f9e1e5', color: item.stateOk ? C.green : C.red, fontSize: 10, fontWeight: 800 }}>{item.stateOk ? '✓' : '×'} 状态保持</span></div>
          </div>)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,.5fr) 1fr', gap: 14 }}>
        <button type="button" onClick={() => { setExecuted(false); requestAnimationFrame(() => setExecuted(true)); }} style={{ border: 0, borderRadius: 12, background: C.green, color: C.white, fontWeight: 800, padding: 14, cursor: 'pointer' }}>{executed ? '重新执行动作' : '执行动作'}</button>
        <div style={{ ...card, padding: 12, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ color: executed ? C.green : C.muted, fontWeight: 800 }}>{executed ? '✓ BWM 同时通过两道门槛' : '○ 等待三路同步结果'}</span>
          <span style={{ color: C.muted, fontSize: 12 }}>{executed ? '对照项分别暴露“动作脱钩”和“身份漂移”。' : '改变动作方向后再执行，观察谁会随指令反转。'}</span>
        </div>
      </div>
      <small style={{ color: C.muted }}>示意：位置变化用于解释条件分布的机制，不是论文报告的轨迹或误差测量。真实 BWM 输出是未来观察块，而不是这个二维道具动画。</small>
    </div>
  );
}

type SymbolId = 'x0' | 'history' | 'action' | 'k';

const symbols: Record<SymbolId, { label: string; name: string; desc: string; color: string; soft: string }> = {
  x0: { label: 'x₀', name: '初始环境观察', desc: '在 rollout 中保持固定，提供场景身份、背景与初始布局的长期锚点。', color: C.blue, soft: C.blueSoft },
  history: { label: 'hₜ', name: '动态视觉历史', desc: '由最近 H 个真实或已生成观察组成，告诉模型近期状态如何变化；论文报告 H=8。', color: C.purple, soft: C.purpleSoft },
  action: { label: 'aₜ₊₁:ₜ₊K', name: '未来动作块', desc: '与待预测观察使用相同时间索引的绝对 EEF 位姿指令，指定要模拟的状态转移。', color: C.orange, soft: C.orangeSoft },
  k: { label: 'K', name: '未来块长度', desc: '一次生成的未来观察数量；论文报告配置 K=72，预测结果随后可回填动态历史。', color: C.green, soft: C.greenSoft },
};

function MiniFrames({ count, active, color }: { count: number; active: boolean; color: string }) {
  return <div style={{ display: 'flex', gap: 5 }}>{Array.from({ length: count }, (_, i) => <span key={i} style={{ width: 28, height: 34, borderRadius: 5, border: `1px solid ${active ? color : C.line}`, background: active ? `${color}20` : C.white, display: 'grid', placeItems: 'center', color: active ? color : C.muted, fontSize: 10, fontWeight: 800 }}>{i + 1}</span>)}</div>;
}

function Formalization() {
  const [selected, setSelected] = useState<SymbolId>('x0');
  const active = symbols[selected];
  const formula = useMemo(() => [
    { id: 'futureOpen', text: 'pθ(xₜ₊₁:ₜ₊', clickable: false },
    { id: 'k', text: 'K', clickable: true },
    { id: 'bar', text: ' | ', clickable: false },
    { id: 'x0', text: 'x₀', clickable: true },
    { id: 'comma1', text: ', ', clickable: false },
    { id: 'history', text: 'hₜ', clickable: true },
    { id: 'comma2', text: ', ', clickable: false },
    { id: 'action', text: 'aₜ₊₁:ₜ₊', clickable: true },
    { id: 'kAction', text: 'K', clickable: true },
    { id: 'end', text: ')', clickable: false },
  ], []);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ ...card, textAlign: 'center', background: C.field }}>
        <div aria-label="BWM 条件分布" style={{ color: C.ink, fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,31px)', lineHeight: 1.8 }}>
          {formula.map((part) => {
            const symbolId = part.id === 'kAction' ? 'k' : part.id as SymbolId;
            return part.clickable ? <button key={part.id} type="button" onClick={() => setSelected(symbolId)} style={{ border: `1px solid ${selected === symbolId ? symbols[symbolId].color : C.line}`, borderRadius: 7, padding: '2px 6px', background: selected === symbolId ? symbols[symbolId].soft : C.white, color: symbols[symbolId].color, font: 'inherit', cursor: 'pointer' }}>{part.text}</button> : <span key={part.id}>{part.text}</span>;
          })}
        </div>
        <small style={{ color: C.muted }}>点击彩色符号，追踪它在片场条件中的位置。</small>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(140px,1fr))', gap: 10, overflowX: 'auto' }}>
        <button type="button" onClick={() => setSelected('x0')} style={{ ...card, minWidth: 140, textAlign: 'left', borderColor: selected === 'x0' ? C.blue : C.line, background: selected === 'x0' ? C.blueSoft : C.white, cursor: 'pointer' }}><small style={{ color: C.blue, fontWeight: 800 }}>参考照 x₀</small><div style={{ height: 54, position: 'relative', marginTop: 10, borderRadius: 7, background: C.field, overflow: 'hidden' }}><div style={{ position: 'absolute', left: 9, right: 9, bottom: 8, height: 2, background: C.muted }} /><Prop shift={0} ghost size={23} bottom={10} /></div></button>
        <button type="button" onClick={() => setSelected('history')} style={{ ...card, minWidth: 140, textAlign: 'left', borderColor: selected === 'history' ? C.purple : C.line, background: selected === 'history' ? C.purpleSoft : C.white, cursor: 'pointer' }}><small style={{ color: C.purple, fontWeight: 800 }}>近期样片 hₜ</small><div style={{ marginTop: 16 }}><MiniFrames count={4} active={selected === 'history'} color={C.purple} /></div></button>
        <button type="button" onClick={() => setSelected('action')} style={{ ...card, minWidth: 140, textAlign: 'left', borderColor: selected === 'action' ? C.orange : C.line, background: selected === 'action' ? C.orangeSoft : C.white, cursor: 'pointer' }}><small style={{ color: C.orange, fontWeight: 800 }}>动作场记 a</small><div style={{ marginTop: 18, color: C.orange, fontWeight: 900, letterSpacing: 3 }}>→ → → →</div></button>
        <button type="button" onClick={() => setSelected('k')} style={{ ...card, minWidth: 140, textAlign: 'left', borderColor: selected === 'k' ? C.green : C.line, background: selected === 'k' ? C.greenSoft : C.white, cursor: 'pointer' }}><small style={{ color: C.green, fontWeight: 800 }}>未来片段 K</small><div style={{ marginTop: 16 }}><MiniFrames count={4} active={selected === 'k'} color={C.green} /></div></button>
      </div>
      <div style={{ ...card, borderColor: active.color, background: active.soft, display: 'grid', gridTemplateColumns: '130px 1fr', gap: 14 }}>
        <div><strong style={{ color: active.color, fontSize: 20 }}>{active.label}</strong><div style={{ color: C.ink, fontWeight: 800, marginTop: 5 }}>{active.name}</div></div>
        <p style={{ margin: 0, color: C.ink, lineHeight: 1.7 }}>{active.desc}</p>
      </div>
      <div style={{ ...card, padding: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}><b style={{ color: C.ink, marginRight: 4 }}>论文报告配置</b>{['dₐ=14', 'H=8', 'K=72', 'P=3', 'G=4'].map((value) => <span key={value} style={{ borderRadius: 999, padding: '5px 9px', background: C.field, color: C.ink, border: `1px solid ${C.line}`, fontWeight: 750 }}>{value}</span>)}<small style={{ color: C.muted }}>这是 WorldArena 提交模型的报告配置，不是所有部署的普适常数。</small></div>
    </div>
  );
}

export const BwmFormalization: React.FC<WidgetProps> = ({ moduleId }) => moduleId === '3.1' ? <ActionDemo /> : <Formalization />;

export default BwmFormalization;
