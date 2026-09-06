import React, { useMemo, useState } from 'react';
import type { WidgetProps } from './registry';

type Part = 'rim' | 'body' | 'handle';
const parts: Record<Part, { label: string; action: string; confidence: string; good: boolean }> = {
  rim: { label: '杯口', action: '倾倒 / 插入', confidence: '中', good: false },
  body: { label: '杯身', action: '包覆支撑', confidence: '中', good: false },
  handle: { label: '杯柄', action: '稳定抓取', confidence: '高', good: true },
};

export const AffordanceExplorer: React.FC<WidgetProps> = () => {
  const [part, setPart] = useState<Part>('body');
  const item = parts[part];
  return <div className="affordance-demo">
    <div className="affordance-stage">
      <svg viewBox="0 0 520 260" role="img" aria-label={`红色马克杯可供性检查：当前选择${item.label}`}>
        <rect x="0" y="0" width="520" height="260" rx="18" fill="#f7f3ea" />
        <path d="M180 75 h135 v120 q0 30 -30 30 h-75 q-30 0 -30-30z" fill="#b83843" stroke={part === 'body' ? '#d97706' : '#7c2630'} strokeWidth={part === 'body' ? 8 : 3} />
        <ellipse cx="247" cy="76" rx="67" ry="13" fill="#74242b" stroke={part === 'rim' ? '#d97706' : '#7c2630'} strokeWidth={part === 'rim' ? 8 : 3} />
        <path d="M313 112 q78 0 64 70 q-9 42 -62 29" fill="none" stroke={part === 'handle' ? '#228d5c' : '#7c2630'} strokeWidth={part === 'handle' ? 13 : 8} strokeLinecap="round" />
        {part === 'handle' ? <><circle cx="356" cy="157" r="10" fill="#d97706" stroke="#fff" strokeWidth="4" /><path d="M420 122 l-46 28" stroke="#27446e" strokeWidth="5" strokeLinecap="round" /></> : null}
        <text x="35" y="45" fill="#21324a" fontSize="18" fontWeight="800">这是什么？ → 能对它做什么？</text>
      </svg>
      <div className="affordance-readout"><span>区域</span><b>{item.label}</b><span>可供性</span><b>{item.action}</b><span>置信度</span><b>{item.confidence}</b></div>
    </div>
    <div className="chip-row" role="group" aria-label="选择马克杯区域">{(Object.keys(parts) as Part[]).map(key => <button className={`chip ${part === key ? 'selected' : ''}`} key={key} onClick={() => setPart(key)}>{parts[key].label}</button>)}</div>
    <div className={`feedback ${item.good ? 'good' : 'bad'}`} aria-live="polite">{item.good ? '稳定抓取：杯柄外侧既避开杯口，也给夹爪留下明确接触几何。' : `${item.label}有其他用途，但对当前“安全移动装有水的杯子”任务不是首选抓取区域。`}</div>
  </div>;
};

type Route = 'direct' | 'upper' | 'lower';
const routes: Record<Route, { label: string; d: string; safe: boolean; endpoint: number; path: number }> = {
  direct: { label: '直线路径', d: 'M70 195 C210 170 315 150 465 118', safe: false, endpoint: .96, path: .31 },
  upper: { label: '上方绕行', d: 'M70 195 C165 58 330 55 465 118', safe: true, endpoint: .94, path: .82 },
  lower: { label: '下方绕行', d: 'M70 195 C190 245 365 238 465 118', safe: true, endpoint: .88, path: .68 },
};

export const TrajectorySandbox: React.FC<WidgetProps> = () => {
  const [route, setRoute] = useState<Route>('direct');
  const r = routes[route];
  const reward = useMemo(() => Math.round((r.endpoint * .35 + r.path * .35 + (r.safe ? 1 : 0) * .3) * 100) / 100, [r]);
  return <div className="trajectory-demo">
    <svg className="trajectory-stage" viewBox="0 0 540 280" role="img" aria-label={`${r.label}，${r.safe ? '安全' : '发生碰撞'}，教学奖励 ${reward}`}>
      <rect width="540" height="280" rx="18" fill="#f7f3ea" />
      <rect x="418" y="52" width="90" height="108" rx="8" fill="#d8d8d2" stroke="#68778f" strokeWidth="3" />
      <line x1="432" y1="92" x2="494" y2="92" stroke="#68778f" strokeWidth="5" />
      <text x="426" y="38" fill="#21324a" fontSize="15" fontWeight="700">洗碗机上层</text>
      <circle cx="66" cy="198" r="30" fill="#27446e" /><text x="43" y="204" fill="white" fontSize="14" fontWeight="800">夹爪</text>
      <path d="M282 115 h50 v70 q0 12 -12 12 h-26 q-12 0 -12-12z" fill="#b83843" /><path d="M332 135 q35 0 28 35" fill="none" stroke="#7c2630" strokeWidth="8" />
      <path d="M215 134 l9 74 q16 12 32 0 l9-74z" fill="rgba(169,199,207,.55)" stroke={r.safe ? '#7599a4' : '#c43f52'} strokeWidth={r.safe ? 3 : 7} />
      <path d={r.d} fill="none" stroke={r.safe ? '#228d5c' : '#c43f52'} strokeWidth="8" strokeLinecap="round" strokeDasharray={r.safe ? '0' : '12 9'} />
      {!r.safe ? <text x="195" y="122" fill="#c43f52" fontSize="18" fontWeight="900">COLLISION</text> : null}
    </svg>
    <div className="chip-row" role="group" aria-label="选择候选轨迹">{(Object.keys(routes) as Route[]).map(key => <button className={`chip ${route === key ? 'selected' : ''}`} key={key} onClick={() => setRoute(key)}>{routes[key].label}</button>)}</div>
    <div className="reward-bars"><label>终点一致性 <progress max="1" value={r.endpoint} /> {r.endpoint.toFixed(2)}</label><label>路径相似度 <progress max="1" value={r.path} /> {r.path.toFixed(2)}</label><label>碰撞安全 <progress max="1" value={r.safe ? 1 : 0} /> {r.safe ? '1.00' : '0.00'}</label></div>
    <div className={`feedback ${r.safe ? 'good' : 'bad'}`} aria-live="polite">轨迹奖励= {reward.toFixed(2)}。{r.safe ? '安全路径不仅到达红杯，还要在途中绕开玻璃杯。' : '终点接近红杯，不代表轨迹可执行；路径中途穿过障碍，在物理世界中就是失败。'}</div>
    <p className="trajectory-rule"><b>直白地说：</b>最后碰到红杯不等于成功；中途撞倒玻璃杯，终点再正确也算失败。</p>
  </div>;
};

type Output = 'grounding' | 'regression' | 'trajectory' | 'text';
const rewards: Record<Output, { label: string; output: string; metric: string; why: string }> = {
  grounding: { label: '定位', output: '框 / 点 / 形状', metric: 'IoU / 归一化点距 / Chamfer', why: '几何输出需要几何相似度。' },
  regression: { label: '回归', output: '深度数值', metric: '相对误差奖励', why: '连续值应用平滑误差，而不是只判全对或全错。' },
  trajectory: { label: '轨迹', output: '有序路径', metric: 'DTW / Fréchet + 终点一致性', why: '路径的形状、顺序与终点都携带信息。' },
  text: { label: '文本推理', output: '开放式回答', metric: '规则优先，必要时 LLM Judge', why: '只有规则无法可靠解析时，才使用裁判兜底。' },
};

export const RewardSelector: React.FC<WidgetProps> = () => {
  const [output, setOutput] = useState<Output>('trajectory');
  const r = rewards[output];
  return <div className="reward-selector">
    <div className="chip-row" role="group" aria-label="选择输出结构">{(Object.keys(rewards) as Output[]).map(key => <button key={key} className={`chip ${output === key ? 'selected' : ''}`} onClick={() => setOutput(key)}>{rewards[key].label}</button>)}</div>
    <div className="reward-mapping"><div><span>模型输出</span><strong>{r.output}</strong></div><div className="mapping-arrow">→</div><div><span>匹配奖励</span><strong>{r.metric}</strong></div></div>
    <div className="feedback good" aria-live="polite"><b>Reward structure should match output structure.</b> {r.why}</div>
  </div>;
};

export default TrajectorySandbox;
