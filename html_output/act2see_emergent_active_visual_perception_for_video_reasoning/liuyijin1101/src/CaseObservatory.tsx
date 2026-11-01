import { useState } from 'react';
import './styles/cases.css';

type CaseKey = 'celery' | 'ball' | 'coffee';

const cases = {
  celery: {
    tab: 'A · 检索真实帧',
    question: '加入芹菜后，锅里正在烹饪哪些食材？',
    tool: 'retrieve',
    query: 'celery added to the pot',
    image: './cases/retrieve-celery.png',
    imageAlt: 'Figure 4 检索返回的原视频帧局部：锅中有切碎的食材，芹菜正被加入',
    leftLabel: '原视频情境 · 教学示意',
    rightLabel: '检索返回 · 原视频真实帧',
    observation: '模型检索“芹菜加入锅中”的时刻，再根据返回帧辨认食材。图中答案列出油、红洋葱、胡萝卜、大蒜和芹菜。',
  },
  ball: {
    tab: 'B · 生成反事实',
    question: '如果黄色书消失，球的运动可能怎样变化？',
    tool: 'generate',
    query: 'ball motion when the yellow book disappears',
    image: './cases/generate-ball.png',
    imageAlt: 'Figure 4 生成返回的假设画面局部：桌面、斜板、球与杯子',
    leftLabel: '原视频物体关系 · 教学示意',
    rightLabel: '生成返回 · 假设画面',
    observation: '模型请求“黄色书消失”条件下的球运动画面，并据此给出“运动不会停止”的回答。右侧是合成假设，并非原视频已经发生的事。',
  },
  coffee: {
    tab: 'C · 生成画面失配',
    question: '如果提前倒入咖啡豆，之后还能成功煮咖啡吗？',
    tool: 'generate',
    query: 'unground coffee beans are poured directly into coffee machine',
    image: './cases/generate-coffee.png',
    imageAlt: 'Figure 4 生成返回的画面局部：咖啡豆被倒向杯子，而不是咖啡机',
    leftLabel: '请求所指 · 倒入咖啡机',
    rightLabel: '实际生成 · 倒入杯子',
    observation: '请求指向咖啡机，生成画面却把咖啡豆倒进杯子。这里暴露的是生成内容与请求语义不一致。',
  },
} as const;

function Scene({ kind }: { kind: CaseKey }) {
  if (kind === 'celery') return <svg viewBox="0 0 440 250" role="img" aria-label="教学重绘：芹菜被加入盛有切碎食材的锅中">
    <rect width="440" height="250" fill="#e9eef1"/><rect y="177" width="440" height="73" fill="#b4bec3"/>
    <ellipse cx="220" cy="157" rx="153" ry="60" fill="#4c5961"/><ellipse cx="220" cy="143" rx="142" ry="49" fill="#a9b9b9"/><ellipse cx="220" cy="142" rx="132" ry="43" fill="#6f3d27"/>
    <g fill="#e58238"><rect x="125" y="126" width="19" height="13" rx="3" transform="rotate(-17 125 126)"/><rect x="183" y="152" width="18" height="12" rx="3"/><rect x="231" y="120" width="18" height="12" rx="3"/><rect x="294" y="144" width="20" height="12" rx="3"/><rect x="256" y="160" width="16" height="11" rx="3"/></g>
    <g fill="#d6c0a4"><circle cx="158" cy="152" r="6"/><circle cx="210" cy="126" r="5"/><circle cx="282" cy="126" r="5"/></g>
    <path d="M340 22q-14 37-38 68" fill="none" stroke="#5d9f60" strokeWidth="9" strokeLinecap="round"/><path d="M351 28q-23 38-56 66" fill="none" stroke="#78b46a" strokeWidth="8" strokeLinecap="round"/><path d="M329 19q-3 28-26 60" fill="none" stroke="#9dc477" strokeWidth="7" strokeLinecap="round"/>
    <path d="M301 81l-12 30" stroke="#5d9f60" strokeWidth="6" strokeLinecap="round"/><path d="M315 79l-8 34" stroke="#78b46a" strokeWidth="5" strokeLinecap="round"/>
  </svg>;
  if (kind === 'ball') return <svg viewBox="0 0 440 250" role="img" aria-label="教学重绘：原场景涉及桌面、黄色书和球；黄色书消失是尚未发生的假设">
    <rect width="440" height="250" fill="#e8eff2"/><rect x="22" y="110" width="396" height="110" rx="8" fill="#b68a60"/><path d="M22 142h396" stroke="#8d6548" strokeWidth="5"/>
    <path d="M79 104l224-36 60 31-222 38z" fill="#f1d475" stroke="#a57629" strokeWidth="3"/><path d="M141 137v18l222-38V99z" fill="#d3a942" stroke="#a57629" strokeWidth="3"/>
    <circle cx="114" cy="82" r="22" fill="#f4f5f6" stroke="#8496a4" strokeWidth="4"/><path d="M97 70q17 15 31 3M105 99q2-19 23-28" fill="none" stroke="#aab9c2" strokeWidth="3"/>
    <path d="M143 74q24-12 50-9" fill="none" stroke="#567a9a" strokeWidth="3" strokeDasharray="6 6"/>
  </svg>;
  return <svg viewBox="0 0 440 250" role="img" aria-label="教学重绘的预期操作：咖啡豆倒入咖啡机，旁边的杯子不接豆子">
    <rect width="440" height="250" fill="#e8e2dc"/><rect y="194" width="440" height="56" fill="#b58d68"/>
    <rect x="224" y="68" width="120" height="125" rx="14" fill="#252e32"/><rect x="239" y="82" width="89" height="35" rx="5" fill="#3f4f53"/><ellipse cx="284" cy="68" rx="53" ry="14" fill="#151d20"/><ellipse cx="284" cy="68" rx="38" ry="8" fill="#647277"/>
    <path d="M81 38l93 22-18 65-91-25z" fill="#f7eee0" stroke="#9a8270" strokeWidth="4"/><path d="M154 119q47 24 105-15" fill="none" stroke="#795035" strokeWidth="7" strokeDasharray="3 12" strokeLinecap="round"/><path d="M248 104l18 1-10 15" fill="none" stroke="#795035" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M379 156h38l-4 38h-30z" fill="#f5f5ef" stroke="#a7aaa8" strokeWidth="3"/>
  </svg>;
}

export function CaseObservatory() {
  const [active, setActive] = useState<CaseKey>('celery');
  const item = cases[active];
  return <div className="case-observatory">
    <div className="case-picker" role="group" aria-label="切换论文真实案例">
      {(Object.keys(cases) as CaseKey[]).map(key => <button key={key} type="button" className={key === active ? 'is-active' : ''} aria-pressed={key === active} onClick={() => setActive(key)}>{cases[key].tab}</button>)}
    </div>
    <div className="case-question"><span>论文问题</span><strong>{item.question}</strong></div>
    <div className="case-views" key={active}>
      <figure className="case-view"><div className="case-view-head">{item.leftLabel}</div><Scene kind={active}/><figcaption>{active === 'coffee' ? '左侧依照请求重绘预期操作。' : '依据案例物体与动作重绘；Figure 4 未单列初始输入帧。'}</figcaption></figure>
      <figure className={`case-view case-view--${item.tool}`}><div className="case-view-head">{item.rightLabel}</div><img src={item.image} alt={item.imageAlt}/><figcaption>论文 Figure 4 中的返回画面局部</figcaption></figure>
    </div>
    <div className="case-readout" aria-live="polite">
      <div className="case-request"><span>模型工具请求</span><code>&lt;{item.tool}&gt; {item.query} &lt;/{item.tool}&gt;</code></div>
      <div className="case-observation"><span>核心观察</span><p>{item.observation}</p></div>
    </div>
  </div>;
}
