import { useState } from 'react';
import type { WidgetProps } from './registry';
import { C, Chip, Feedback, Frame, Plot } from './pvKit';

const traits = ['开放性 O', '尽责性 C', '外向性 E', '宜人性 A', '神经质 N'];
const colors = [C.blue, '#496482', '#698198', '#8aa0b4', '#a5b5c4'];
type Turn = { m: number; current: number[]; before: number[]; after: number[]; lambda: number; skip: boolean };
const turns: Turn[] = [{ m: 0, current: [3, 3, 3, 3, 3], before: [3, 3, 3, 3, 3], after: [3, 3, 3, 3, 3], lambda: 0.5, skip: false }];
for (let m = 1; m <= 60; m++) {
  const phase = Math.floor((m - 1) / 15);
  const presets = [[4, 4, 2, 4, 2], [5, 3, 2, 4, 3], [4, 5, 3, 3, 2], [3, 4, 4, 4, 2]];
  const current = [12, 36, 60].includes(m) ? [3, 3, 3, 3, 3] : presets[phase].map((v, i) => Math.max(1, Math.min(5, v + ((m + i * 2) % 7 === 0 ? -1 : 0))));
  const before = [...turns[m - 1].after];
  const lambda = 0.7 - 0.2 * Math.cos(Math.PI * Math.min(m, 50) / 50);
  const skip = current.every(v => v === 3);
  const after = skip ? [...before] : before.map((v, i) => lambda * v + (1 - lambda) * current[i]);
  turns.push({ m, current, before, after, lambda, skip });
}

export function PersonaTimeline({ chapterId, moduleId }: WidgetProps) {
  const [m, setM] = useState(0);
  const turn = turns[m];
  return <Frame id="persona-timeline" evidence="依据 Supplementary A.1 / Fig.18 的 PEM 公式计算；0–60 轮输入与初始值全部为合成教学设定。">
    <p data-context={`${chapterId}/${moduleId}`}><strong>教学初始化：</strong>p₀=(3, 3, 3, 3, 3)。这不是论文披露的通用初始化，也不是实际用户人格。</p>
    <div className="pv-controls"><label htmlFor={`${moduleId}-round`}><strong>交互轮次 m：{m}</strong><span className="pv-muted">固定序列，不重新随机</span></label><input id={`${moduleId}-round`} aria-label="交互轮次 m" type="range" min="0" max="60" step="1" value={m} onChange={e => setM(Number(e.target.value))} /></div>
    <div className="pv-controls"><Chip active={m === 0} onClick={() => setM(0)}>回到初始值</Chip><Chip active={m === 12} onClick={() => setM(12)}>查看第 12 轮：全中性</Chip><Chip active={m === 50} onClick={() => setM(50)}>查看第 50 轮</Chip></div>
    <div className="pv-split"><div><h5>{m === 0 ? '初始状态，尚未更新' : `第 ${m} 轮 · ${turn.skip ? '跳过更新' : '执行平滑更新'}`}</h5><div className="pv-line"><span>λₘ（旧状态权重）</span><b>{m === 0 ? '尚未应用' : turn.lambda.toFixed(4)}</b></div><div className="pv-line"><span>1−λₘ（本轮权重）</span><b>{m === 0 ? '尚未应用' : (1 - turn.lambda).toFixed(4)}</b></div><p className="pv-muted">λₘ = 0.7 − 0.2 cos(π min(m,50)/50)</p><p className="pv-muted">pₘ = λₘ pₘ₋₁ + (1−λₘ) p′ₘ</p><p>全 3 向量沿用旧状态。中间计算不舍入，下面只舍入显示值。</p></div><div><h5>五维长期状态轨迹</h5><div className="pv-line"><span>纵轴：1–5</span><span>横轴：0–60 轮</span></div><Plot label={`五维合成人格轨迹，当前选中第${m}轮，纵轴1到5，横轴0到60`} viewBox="0 0 600 250"><line x1="14" y1="18" x2="14" y2="228" stroke={C.line} /><line x1="14" y1="228" x2="588" y2="228" stroke={C.line} />{[1, 2, 3, 4, 5].map(v => <line key={v} x1="14" x2="588" y1={228 - (v - 1) / 4 * 210} y2={228 - (v - 1) / 4 * 210} stroke={C.line} strokeDasharray="3 5" />)}{traits.map((name, i) => <polyline key={name} fill="none" stroke={colors[i]} strokeWidth="3" strokeDasharray={[undefined, "8 3", "3 3", "10 3 2 3", "2 4"][i]} points={turns.map(t => `${14 + t.m / 60 * 574},${228 - (t.after[i] - 1) / 4 * 210}`).join(' ')} />)}<line x1={14 + m / 60 * 574} x2={14 + m / 60 * 574} y1="10" y2="232" stroke={C.ink} strokeDasharray="5 4" />{traits.map((name, i) => <circle key={name} cx={14 + m / 60 * 574} cy={228 - (turn.after[i] - 1) / 4 * 210} r="5" fill={colors[i]} stroke="#fff" strokeWidth="2" />)}</Plot><div className="pv-controls" style={{ fontSize: 13 }}>{traits.map((name, i) => <span key={name} style={{ color: colors[i] }}>● {name}</span>)}</div></div></div>
    <div className="pv-table-wrap"><table className="pv-table"><caption style={{ textAlign: 'left', marginBottom: 8 }}>数值对照：长期浮点状态与本轮整数估计</caption><thead><tr><th scope="col">维度</th><th scope="col">更新前</th><th scope="col">本轮 p′</th><th scope="col">更新后</th></tr></thead><tbody>{traits.map((name, i) => <tr key={name}><th scope="row" style={{ color: colors[i] }}>{name}</th><td>{turn.before[i].toFixed(2)}</td><td>{m === 0 ? '—' : turn.current[i]}</td><td>{turn.after[i].toFixed(2)}</td></tr>)}</tbody></table></div>
    <Feedback>{m === 0 ? '当前仅展示说明用初始值。拖动轮次查看同一条预设序列，变化不代表真实人格被准确识别。' : turn.skip ? `第 ${m} 轮是全中性 (3,3,3,3,3)，跳过 PEM 更新：更新前后长期状态相同，而不是把旧画像重置为 3。` : `本轮旧状态权重为 ${(turn.lambda * 100).toFixed(1)}%，本轮估计权重为 ${((1 - turn.lambda) * 100).toFixed(1)}%。λ 越大，长期画像越依赖旧状态；平滑模型估计不等于验证真实人格。`}</Feedback>
    <div className="pv-note"><strong>人格状态与偏好历史分开看：</strong>PEM 更新 P；Core / Procedural 保留最新可变资料，Semantic / Episodic 追加，原始 History 保留。这里没有把某个偏好直接转换成人格维度。</div>
  </Frame>;
}
