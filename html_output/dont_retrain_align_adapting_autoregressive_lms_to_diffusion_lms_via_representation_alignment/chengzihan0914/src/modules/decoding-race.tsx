import { useState } from 'react';
import type { WidgetProps } from './registry';

const TOKENS = ['同', '一', '张', '语义', '地图', '。'];
const DLM_STATES = [
  ['?', '?', '?', '?', '?', '?'], ['?', '一', '?', '?', '地图', '?'], ['同', '一', '?', '语义', '地图', '?'],
  ['同', '?', '张', '语义', '地图', '。'], ['同', '一', '张', '语义', '?', '。'], ['同', '一', '张', '语义', '地图', '。'], ['同', '一', '张', '语义', '地图', '。'],
];
const CONF = [18, 36, 52, 63, 78, 92, 96];

export const DecodingRace: React.FC<WidgetProps> = () => {
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState(3);
  const max = 6;
  return <div>
    <div className="ra-token-race">
      <section><div className="race-head"><b>AR · 左到右</b><span>固定单向路径</span></div><div className="ra-tokens">{TOKENS.map((token, index) => <button type="button" key={index} className={`${index < step ? 'on ar' : ''} ${focus === index ? 'focus' : ''}`} onClick={() => setFocus(index)}>{index < step ? token : '?'}</button>)}</div><div className="ra-confidence" aria-label="AR 教学置信度示意">{TOKENS.map((_, index) => <i key={index} style={{ height: `${index < step ? 82 : 12}%` }} />)}</div></section>
      <section><div className="race-head"><b>DLM · 全局迭代</b><span>可重遮蔽低置信位置</span></div><div className="ra-tokens">{DLM_STATES[step].map((token, index) => { const remasked = step > 0 && DLM_STATES[step - 1][index] !== '?' && token === '?'; return <button type="button" key={index} className={`${token !== '?' ? 'on dlm' : ''} ${remasked ? 'remasked' : ''} ${focus === index ? 'focus' : ''}`} onClick={() => setFocus(index)}>{token}</button>; })}</div><div className="ra-confidence dlm" aria-label="DLM 教学置信度示意">{TOKENS.map((_, index) => <i key={index} style={{ height: `${Math.min(98, CONF[step] + ((index * 13) % 20) - 8)}%` }} />)}</div></section>
    </div>
    <div className="race-visibility"><b>选中位置 {focus + 1}：</b><span className="ar-note">AR 可读取截至当前位置的 {focus + 1} 个词元（左侧 {focus} 个 + 当前）</span><span className="dlm-note">DLM 可读取全部 {TOKENS.length} 个位置</span></div>
    <div className="chip-row"><button type="button" className="tiny ghost" onClick={() => setStep(0)}>重置</button><button type="button" className="tiny" disabled={step === max} onClick={() => setStep((value) => Math.min(max, value + 1))}>{step === max ? '已完成' : `下一轮 ${step}/${max}`}</button></div>
    <div className={`feedback ${step === max ? 'good' : ''}`}>{step === 0 ? '两种方法从同一未完成序列出发。点击任意位置还能比较它的可见上下文。' : step === max ? '生成完成：输出相同，但信息流和更新顺序不同。' : '蓝色序列固定向右扩展；绿色序列并行更新，橙色虚线位置表示一次教学性的“重新遮蔽”。置信度并非论文报告的逐词概率。'}</div>
  </div>;
};
