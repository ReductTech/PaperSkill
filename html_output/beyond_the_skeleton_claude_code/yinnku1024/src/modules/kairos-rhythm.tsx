import React, { useState } from 'react';
import { Dept, Feedback, HW } from './kit';

type Strategy = 'chatty' | 'boundary' | 'silent';

const STRATEGIES: { id: Strategy; name: string; desc: string }[] = [
  { id: 'chatty', name: '每步都汇报', desc: '每个动作发一条' },
  { id: 'boundary', name: '只在阶段边界', desc: 'ack → 工作 → 结果' },
  { id: 'silent', name: '憋到最后', desc: '只在结束时说' },
];

const MESSAGES: Record<Strategy, { at: number; kind: 'ack' | 'check' | 'result'; text: string }[]> = {
  chatty: [
    { at: 0, kind: 'ack', text: '收到' },
    { at: 1, kind: 'check', text: '我先读一下入口文件' },
    { at: 2, kind: 'check', text: '找到两个调用点' },
    { at: 3, kind: 'check', text: '开始改第一个' },
    { at: 5, kind: 'check', text: '第一个改完了' },
    { at: 7, kind: 'result', text: '两个都改完，测试通过' },
  ],
  boundary: [
    { at: 0, kind: 'ack', text: '收到' },
    { at: 3, kind: 'check', text: '决定先改调用点，不动公共接口' },
    { at: 7, kind: 'result', text: '改完并跑了测试' },
  ],
  silent: [
    { at: 7, kind: 'result', text: '都改完了' },
  ],
};

/* 值班室：主动性不是“能做事”，而是“知道什么时候该说话”。
   tick 心跳 + Sleep + normal/proactive 的区分，解决的是沟通节奏。 */
export function KairosRhythm() {
  const [strategy, setStrategy] = useState<Strategy>('boundary');
  const messages = MESSAGES[strategy];
  const noise = strategy === 'chatty' ? 5 : strategy === 'boundary' ? 2 : 0;
  const complete = strategy === 'chatty' ? 5 : strategy === 'boundary' ? 4 : 2;

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 10 }}>
        <div className="hw-spread">
          <p className="hw-h">一个后台任务的 40 分钟</p>
          <Dept>值班室</Dept>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 6 }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ height: 10, borderRadius: 4, background: messages.some(m => m.at === i) ? HW.blue : '#dfe9e3' }} />
              <span className="hw-t hw-muted" style={{ fontSize: 24 }}>{i * 5}m</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start', minHeight: 0 }}>
          {messages.map((message, index) => (
            <div key={index} style={{
              display: 'grid', gridTemplateColumns: '70px minmax(0, 1fr) auto', gap: 10, alignItems: 'center',
              padding: '8px 14px', borderRadius: 8,
              background: message.kind === 'result' ? '#e9f2ed' : message.kind === 'ack' ? '#eef3f9' : '#fbfdfc',
              border: `1px solid ${HW.line}`,
            }}>
              <span className="hw-t hw-muted">{message.at * 5}m</span>
              <span className="hw-t">{message.text}</span>
              <span className="hw-chip" data-tone={message.kind === 'result' ? 'green' : message.kind === 'ack' ? 'blue' : 'teal'}>
                {message.kind === 'result' ? 'proactive' : message.kind === 'ack' ? 'normal' : 'checkpoint'}
              </span>
            </div>
          ))}
          {messages.length === 1 && (
            <p className="hw-t hw-muted">中间 35 分钟没有任何反馈：用户不知道它在不在干活。</p>
          )}
        </div>
      </div>

      <div className="hw-col">
        {STRATEGIES.map(item => (
          <button key={item.id} type="button" className="hw-btn hw-btn--block"
            aria-pressed={strategy === item.id} onClick={() => setStrategy(item.id)}>
            <span>{item.name}</span>
            <span className="hw-t hw-muted" style={{ fontSize: 26 }}>{item.desc}</span>
          </button>
        ))}
        <div className="hw-card hw-card--mint" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, textAlign: 'center' }}>
          <div>
            <p className="hw-fig" style={{ color: noise >= 4 ? HW.red : HW.green }}>{noise}</p>
            <p className="hw-t hw-muted">打扰次数</p>
          </div>
          <div>
            <p className="hw-fig" style={{ color: HW.blue }}>{complete}</p>
            <p className="hw-t hw-muted">信息完整度</p>
          </div>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={strategy === 'boundary' ? 'good' : strategy === 'chatty' ? 'bad' : 'neutral'}>
            {strategy === 'chatty'
              ? '每个动作都汇报：用户被通知淹没，真正的结论反而看不见。'
              : strategy === 'boundary'
                ? '先确认、再干活、阶段边界说一声、结束给结果：像带一个靠谱的远程同事。'
                : '憋到最后才说：没有打扰，但中途遇到阻塞也没人知道。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
