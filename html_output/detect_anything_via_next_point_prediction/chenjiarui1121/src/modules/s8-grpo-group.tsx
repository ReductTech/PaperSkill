import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';
import { SymbolHint } from '../components/SymbolHint';
import { AllBirds, BoxRect, C, EGRETS, LakeScene, boxReward, rng, type Box, type LabeledBox } from './rex-kit';

// GRPO, Eq. (1): sample G=8 complete answers for one image, score each with the Box-IoU reward,
// normalize within the group. The policy update below is a toy (5 behavior probabilities instead of θ).
type Behavior = 'good' | 'offset' | 'dup' | 'miss' | 'large';
const BEH: { id: Behavior; name: string; color: string }[] = [
  { id: 'good', name: '准确', color: C.green }, { id: 'offset', name: '偏移', color: C.orange },
  { id: 'dup', name: '重复', color: C.red }, { id: 'miss', name: '漏检', color: C.purple }, { id: 'large', name: '大框', color: '#9a6b3c' },
];
const INIT: Record<Behavior, number> = { good: .3, offset: .25, dup: .25, miss: .1, large: .1 };
const GT: LabeledBox[] = EGRETS.slice(2).map(e => ({ box: e.box, label: 'egret' }));
const G = 8;

function makeAnswer(b: Behavior, r: () => number): LabeledBox[] {
  const j = (s: number) => (r() - .5) * 2 * s;
  const near = (box: Box, s: number): Box => [box[0] + j(s), box[1] + j(s), box[2] + j(s), box[3] + j(s)];
  const shift = (box: Box): Box => { const dx = (r() > .5 ? 1 : -1) * (14 + r() * 12), dy = (r() > .5 ? 1 : -1) * (12 + r() * 10); return [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy]; };
  const L = (box: Box): LabeledBox => ({ box, label: 'egret' });
  if (b === 'good') return GT.map(g => L(near(g.box, 4)));
  if (b === 'offset') return GT.map(g => L(shift(g.box)));
  if (b === 'dup') { const base = GT.map(g => L(near(g.box, 4))); const t = GT[Math.floor(r() * 3)].box; return [...base, L(near(t, 7)), L(near(t, 9))]; }
  if (b === 'miss') { const skip = Math.floor(r() * 3); return GT.filter((_, i) => i !== skip).map(g => L(near(g.box, 4))); }
  return [L([420 + j(6), 218 + j(6), 878 + j(6), 392 + j(6)])];
}
function sample(policy: Record<Behavior, number>, seed: number) {
  const r = rng(seed);
  return Array.from({ length: G }, () => {
    let u = r(), pick: Behavior = 'good';
    for (const b of BEH) { if ((u -= policy[b.id]) <= 0) { pick = b.id; break; } }
    const boxes = makeAnswer(pick, r);
    return { behavior: pick, boxes, reward: boxReward(boxes, GT) };
  });
}

export function S8GrpoGroup(_: WidgetProps) {
  const [policy, setPolicy] = useState(INIT);
  const [seed, setSeed] = useState(7);
  const [iter, setIter] = useState(0);
  const [sel, setSel] = useState(0);
  const group = useMemo(() => sample(policy, seed), [policy, seed]);
  const rs = group.map(g => g.reward.f1);
  const mean = rs.reduce((s, v) => s + v, 0) / G;
  const std = Math.sqrt(rs.reduce((s, v) => s + (v - mean) ** 2, 0) / G);
  const adv = rs.map(v => std > 1e-6 ? (v - mean) / std : 0);
  const cur = group[sel];
  const update = () => {
    const next = { ...policy };
    for (const b of BEH) {
      const idx = group.map((g, i) => g.behavior === b.id ? i : -1).filter(i => i >= 0);
      if (idx.length) next[b.id] *= Math.exp(.8 * idx.reduce((s, i) => s + adv[i], 0) / idx.length);
    }
    const z = Object.values(next).reduce((s, v) => s + v, 0);
    for (const b of BEH) next[b.id] /= z;
    setPolicy(next); setSeed(seed * 31 + 11); setIter(iter + 1); setSel(0);
  };
  const worst = group.reduce((a, g, i) => adv[i] < adv[a] ? i : a, 0);
  const feedback = std <= 1e-6 ? '这一组 8 个回答奖励完全相同，优势全为 0：这道题本轮不提供学习信号。'
    : `平均奖励 ${mean.toFixed(2)}。“${BEH.find(b => b.id === group[worst].behavior)!.name}”类回答低于平均（A=${adv[worst].toFixed(2)}），会被压低；高于平均的回答会被加强。`;
  return <div className="rx-page rx-s8">
    <div className="rx-s8-left">
      <svg viewBox="392 182 516 226" width="860" height="380" role="img" aria-label={`第 ${sel + 1} 个回答，奖励 ${cur.reward.f1.toFixed(2)}`}>
        <LakeScene view={[392, 182, 516, 226]}><AllBirds view={[392, 182, 516, 226]} /></LakeScene>
        {GT.map((g, i) => <BoxRect key={'g' + i} box={g.box} color={C.green} width={2.5} dashed />)}
        {cur.boxes.map((b, i) => <BoxRect key={i} box={b.box} color={BEH.find(x => x.id === cur.behavior)!.color} width={4} />)}
      </svg>
      <p className="rx-text">回答 #{sel + 1}（{BEH.find(b => b.id === cur.behavior)!.name}）：召回 {cur.reward.recall.toFixed(2)} · 精确 {cur.reward.precision.toFixed(2)} → 奖励 r = <b>{cur.reward.f1.toFixed(2)}</b>（下一页详解）</p>
      <p className="rx-text rx-muted">真实训练改的是模型参数，还会限制它别离第一步的模型太远。这里只用 5 种写法的概率来演示改动的方向。</p>
    </div>
    <div className="rx-s8-right">
      <div className="rx-formula rx-h">
        <SymbolHint meaning="A_i：第 i 个回答的优势，表示它比同组平均好多少（以组内标准差为单位）。">A<sub>i</sub></SymbolHint> = (
        <SymbolHint meaning="r_i：第 i 个回答的奖励，由几何奖励函数计算。">r<sub>i</sub></SymbolHint> − mean(r)) / std(r)
      </div>
      <p className="rx-text rx-muted">第 {iter} 轮 · mean {mean.toFixed(2)} · std {std.toFixed(2)}</p>
      <div className="rx-advbars" role="group" aria-label="8 个回答的优势，点击查看">
        {group.map((g, i) => {
          const h = Math.min(1, Math.abs(adv[i]) / 2.2) * 100;
          return <button key={i} className={`rx-advbar ${i === sel ? 'is-on' : ''}`} style={{ borderTopColor: BEH.find(b => b.id === g.behavior)!.color }} onClick={() => setSel(i)} aria-label={`回答 ${i + 1}，奖励 ${g.reward.f1.toFixed(2)}，优势 ${adv[i].toFixed(2)}`}>
            <span className="rx-advbar-up">{adv[i] > 0 && <i style={{ height: `${h}%`, background: C.green }} />}</span>
            <span className="rx-advbar-down">{adv[i] < 0 && <i style={{ height: `${h}%`, background: C.red }} />}</span>
            <span className="rx-advbar-r">{g.reward.f1.toFixed(2)}</span>
          </button>;
        })}
      </div>
      <div className="rx-policy" aria-label="五种行为的采样概率">
        {BEH.map(b => <span key={b.id} style={{ flex: policy[b.id], background: b.color }} />)}
      </div>
      <p className="rx-text rx-policy-legend">{BEH.map(b => `${b.name} ${Math.round(policy[b.id] * 100)}%`).join(' · ')}</p>
      <div className="rx-row">
        <button className="rx-btn" onClick={() => { setSeed(seed + 101); setSel(0); }}>再采样一组</button>
        <button className="rx-btn rx-btn-main" onClick={update}>按优势更新一步</button>
        <button className="rx-btn" onClick={() => { setPolicy(INIT); setSeed(7); setIter(0); setSel(0); }}>重来</button>
      </div>
      <p className="rx-text" aria-live="polite">{feedback}</p>
    </div>
  </div>;
}
