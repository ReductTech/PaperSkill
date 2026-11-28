import React, { useState } from 'react';
import type { WidgetProps } from './registry';

type Target = 'tool' | 'skill' | 'code';

const TRACES: { text: string; answer: Target; why: string }[] = [
  { text: '请求写成了另一张源图', answer: 'skill', why: '请求构造属于技能里的指令：要规定源图顺序怎么绑定。' },
  { text: '该想象的时候跳过了生成', answer: 'skill', why: '是否加载技能、要不要生成，是阶段一的技能判断。' },
  { text: '生成了视频，却没读出碰撞', answer: 'code', why: '解读与验证的执行逻辑没把可见事件写进历史，要改执行代码。' },
  { text: '工具把两张源图的顺序调换了', answer: 'tool', why: '接口层把顺序弄反了，改指令没用，得改工具接口。' },
];

const TARGETS: { key: Target; label: string }[] = [
  { key: 'tool', label: '工具接口' },
  { key: 'skill', label: '技能与阶段指令' },
  { key: 'code', label: '执行代码' },
];

export function S7Coevolve(_props: WidgetProps) {
  const [trace, setTrace] = useState(0);
  const [target, setTarget] = useState<Target | null>(null);
  const [patched, setPatched] = useState<Record<number, boolean>>({});
  const correct = target === TRACES[trace].answer;
  const rate = 42 + Object.values(patched).filter(Boolean).length * 9;
  const apply = (key: Target) => {
    setTarget(key);
    if (key === TRACES[trace].answer) {
      setPatched(prev => ({ ...prev, [trace]: true }));
    }
  };
  const feedback = target === null
    ? '先读轨迹，再决定改哪一层。'
    : correct ? `改对了：${TRACES[trace].why}` : `改错层了：${TRACES[trace].why}`;
  return (
    <div className="ps-page s7-page">
      <div className="ps-traces">
        <div className="ps-panel-head">执行轨迹 · 失败样本</div>
        {TRACES.map((item, index) => (
          <button key={item.text} className={`ps-trace ${trace === index ? 'is-on' : ''}`} onClick={() => { setTrace(index); setTarget(null); }}>
            <span className="ps-trace-text">{item.text}</span>
            {patched[index] ? <span className="ps-trace-ok">已修</span> : <span className="ps-trace-bad">复现</span>}
          </button>
        ))}
        <div className="ps-hint">轨迹只说明「哪里错了」，不说明该改哪一层。</div>
      </div>
      <div className="ps-patch">
        <div className="ps-panel-head">修订对象 Δ</div>
        <div className="ps-targets">
          {TARGETS.map(item => (
            <button key={item.key} className={`ps-target ${target === item.key ? (correct ? 'is-good' : 'is-bad') : ''}`}
              onClick={() => apply(item.key)}>{item.label}</button>
          ))}
        </div>
        <div className="ps-rate">
          <span>本阶段通过率</span>
          <strong>{rate}%</strong>
          <small>教学示意，非论文测量</small>
        </div>
        <div className={`ps-feedback ${target === null ? 'is-neutral' : correct ? 'is-success' : 'is-fail'}`} aria-live="polite">{feedback}</div>
        <div className="ps-hint">同一层改对了，下一轮同一类问题才不再复现。</div>
      </div>
    </div>
  );
}
