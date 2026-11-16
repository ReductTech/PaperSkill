import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import './s5-reflector.css';

type Props = { onComplete: () => void };
type EvidenceId = 'action' | 'before' | 'after' | 'approach';
const candidates: { id: EvidenceId; time: string; text: string; detail: string }[] = [
  { id: 'action', time: '32:14–32:16', text: '人物 A 松开钥匙，钥匙留在桌上。', detail: '确认了一次放置动作' },
  { id: 'before', time: '32:00–32:14', text: '连续核查片头至动作前：A 一直持钥匙，桌面没有钥匙；未见其他人放置。', detail: '补齐更早时段的观察' },
  { id: 'after', time: '32:16–32:52', text: '连续核查动作后至片尾：钥匙留在桌上，B 走近桌子；未见新的放置。', detail: '核查其余人物与后续时段' },
  { id: 'approach', time: '32:48–32:52', text: '人物 B 走近桌子。', detail: '仅是接近桌子，不能证明放置顺序' },
];
const confidence = [0.30, 0.55, 0.80];

export function S5EvidenceGap({ onComplete }: Props) {
  const [selected, setSelected] = useState<EvidenceId[]>(['action']);
  const [demo, setDemo] = useState(true);
  const [demoKey, setDemoKey] = useState(0);
  const timers = useRef<number[]>([]);
  const touched = useRef(false);
  const cancel = () => { timers.current.forEach(window.clearTimeout); timers.current = []; };
  useEffect(() => {
    if (!demo) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setDemo(false); return; }
    timers.current = [window.setTimeout(() => { if (!touched.current) setSelected(['action', 'before']); }, 1300), window.setTimeout(() => { if (!touched.current) setSelected(['action', 'before', 'after']); setDemo(false); }, 2700)];
    return cancel;
  }, [demo, demoKey]);
  const has = (id: EvidenceId) => selected.includes(id);
  const ready = has('action') && has('before') && has('after');
  const gaps = [!has('action') && '还没有直接看到放下钥匙的动作', !has('before') && '动作前的时段尚未连续核查，不能排除更早事件', !has('after') && '尚未核查其他人物与片尾时段'].filter(Boolean);
  function toggle(id: EvidenceId) {
    touched.current = true; cancel(); setDemo(false);
    setSelected(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
    onComplete();
  }
  function replay() { touched.current = false; cancel(); setSelected(['action']); setDemo(true); setDemoKey(key => key + 1); }
  const nodes = [
    { key: 'action', title: '确认放置动作', detail: has('action') ? 'A 放下钥匙' : '未见直接动作', complete: has('action') },
    { key: 'before', title: '排除更早事件', detail: has('before') ? '片头至动作前已核查' : '动作前仍有盲区', complete: has('before') },
    { key: 'after', title: '核查其他人物', detail: has('after') ? '动作后至片尾已核查' : 'B 走近不等于放置', complete: has('after') },
  ];
  return <div className="s5-gap">
    <p className="s5-lead">当前问题：<strong>谁最先把钥匙放在桌上？</strong> 一次放置动作只能确认“谁放过”，还要检查时间顺序和其他人物。</p>
    <div className="s5-gap-main">
      <div className="s5-graph" aria-label="回答当前问题所需的证据关系">
        <div className="s5-graph-question">谁最先放下钥匙？ <span>需要同时成立</span></div>
        <div className="s5-condition-chain">{nodes.map((node, index) => <div className="s5-condition-unit" key={node.key}><div className={`s5-condition ${node.complete ? 'met' : 'missing'}`}><span>{node.complete ? '✓ 已支持' : '？有缺口'}</span><strong>{node.title}</strong><small>{node.detail}</small></div>{index < 2 && <div className={`s5-link ${nodes[index].complete && nodes[index + 1].complete ? 'met' : 'missing'}`} aria-hidden="true">＋</div>}</div>)}</div>
        <div className={`s5-graph-conclusion ${ready ? 'met' : 'missing'}`}><span aria-hidden="true">{ready ? '↓' : '↘'}</span><strong>{ready ? '当前证据可支持：人物 A 最先放下钥匙' : '条件尚未连通：暂不能回答“最先”'}</strong></div>
        <p className="s5-coverage">观察覆盖：<b className={has('before') ? 'met' : ''}>片头 → 动作前</b><b className={has('action') ? 'met' : ''}>放置动作</b><b className={has('after') ? 'met' : ''}>动作后 → 片尾</b></p>
      </div>
      <aside className={`s5-verdict ${ready ? 'met' : ''}`} aria-live="polite"><span>REFLECTOR 判断</span><strong>{ready ? '证据足以回答' : '证据仍不足'}</strong><p>{ready ? '放置动作与片头至片尾的相关时段都已核查，当前问题可答为人物 A。' : `缺口：${gaps.join('；')}。`}</p><b>{ready ? '下一步：进入回答' : '下一步：围绕缺口继续观察'}</b></aside>
    </div>
    <div className="s5-evidence-bank"><div className="s5-bank-head"><strong>选择要加入累计证据的观察结果</strong><button type="button" onClick={replay}><RotateCcw size={15}/>重播判断过程</button></div><div className="s5-evidence-options">{candidates.map(item => <button type="button" key={item.id} className={has(item.id) ? item.id === 'approach' ? 'irrelevant' : 'added' : ''} aria-pressed={has(item.id)} onClick={() => toggle(item.id)}><span>{item.time} · {has(item.id) ? '已加入，点击移除' : '点击加入'}</span><strong>{item.text}</strong><small>{has(item.id) ? item.detail : ''}</small></button>)}</div></div>
  </div>;
}

export function S5StopDecision({ onComplete }: Props) {
  const [threshold, setThreshold] = useState(0.7);
  const [round, setRound] = useState(1);
  const stopIndex = confidence.findIndex(value => value >= threshold);
  const finalRound = stopIndex < 0 ? 3 : stopIndex + 1;
  const shownRound = Math.min(round, finalRound);
  const result = shownRound < finalRound ? '继续观察' : stopIndex < 0 ? '轮次上限停止' : '达到阈值停止';
  const kind = shownRound < finalRound ? 'continue' : stopIndex < 0 ? 'limit' : 'threshold';
  const x = [12, 50, 88];
  const y = (value: number) => 150 - value * 120;
  function changeThreshold(value: number) { setThreshold(value); setRound(1); onComplete(); }
  function changeRound(value: number) { setRound(value); onComplete(); }
  return <div className="s5-stop">
    <p className="s5-lead">Reflector 每轮评估累计证据，给出置信度与理由。下面用三轮固定轨迹观察停止规则；<strong>0.30、0.55、0.80 是操作练习值。</strong></p>
    <div className="s5-stop-board"><div className="s5-chart-wrap"><div className="s5-chart-head"><strong>观察轮次 → 停止路径</strong><span>阈值 {threshold.toFixed(2)} · 最多 3 轮</span></div><svg className="s5-chart" viewBox="0 0 760 225" role="img" aria-label={`三轮置信度为 0.30、0.55、0.80，停止阈值 ${threshold.toFixed(2)}，第 ${finalRound} 轮${stopIndex < 0 ? '因轮次上限停止' : '达到阈值停止'}`} preserveAspectRatio="none"><line x1="70" x2="700" y1={y(threshold)} y2={y(threshold)} className="s5-threshold-line"/><text x="72" y={y(threshold)-9} className="s5-threshold-text">停止阈值 {threshold.toFixed(2)}</text><polyline points={confidence.map((value, index) => `${70+x[index]*6.3},${y(value)}`).join(' ')} className="s5-trajectory"/>{confidence.map((value, index) => <g key={index}><circle cx={70+x[index]*6.3} cy={y(value)} r={index + 1 === finalRound ? 14 : 10} className={`s5-point ${index + 1 === finalRound ? (stopIndex < 0 ? 'limit' : 'stop') : 'plain'} ${index + 1 === shownRound ? 'current' : ''}`}/><text x={70+x[index]*6.3} y={y(value)-22} textAnchor="middle" className="s5-value">{value.toFixed(2)}</text><text x={70+x[index]*6.3} y="207" textAnchor="middle" className="s5-round-label">Round {index + 1}</text></g>)}</svg><div className="s5-path" aria-label="每轮决策">{confidence.map((value, index) => <div key={index} className={`s5-path-step ${index + 1 === shownRound ? 'current' : ''} ${index + 1 > finalRound ? 'skipped' : ''}`}><b>{index + 1 === finalRound ? stopIndex < 0 ? '上限停止' : '阈值停止' : index + 1 > finalRound ? '不再观察' : '继续'}</b><span>第 {index + 1} 轮 · {value.toFixed(2)}</span></div>)}</div></div><div className="s5-stop-controls"><label htmlFor="s5-threshold">停止阈值 <strong>{threshold.toFixed(2)}</strong></label><input id="s5-threshold" type="range" min="0.5" max="0.9" step="0.05" value={threshold} onChange={event => changeThreshold(Number(event.target.value))}/><div className="s5-scale"><span>0.50</span><span>0.90</span></div><button type="button" className="s5-reset" onClick={() => { setThreshold(0.7); setRound(1); }}>重置为 0.70</button><div className="s5-round-control" role="group" aria-label="选择观察轮次">{confidence.map((_, index) => <button type="button" key={index} disabled={index + 1 > finalRound} aria-pressed={shownRound === index + 1} onClick={() => changeRound(index + 1)}>第 {index + 1} 轮</button>)}</div><div className={`s5-current ${kind}`} aria-live="polite"><span>当前：第 {shownRound} 轮 · 置信度 {confidence[shownRound-1].toFixed(2)} · 阈值 {threshold.toFixed(2)}</span><strong>{result}</strong><p>{kind === 'continue' ? '本轮未达到阈值，反馈缺口后进入下一轮。' : kind === 'limit' ? '三轮已用尽，仍未达到阈值；进入最终回答流程，证据未必充分。' : '达到阈值，提取当前理由所支持的答案。'}</p></div></div></div>
    <p className="s5-risk"><strong>高置信度不保证证据完整，也不保证最终答案正确。</strong>若关键事件从未进入观察，模型仍可能对现有证据给出高置信判断。证据充分性判断与置信度数值相关，但不能互相替代。</p>
  </div>;
}
