import React, { useState } from 'react';
import { Feedback, RW, Switch } from './kit';

const FIELDS = [
  { id: 'messages', name: 'messages', desc: '会话消息' },
  { id: 'tokens', name: 'tokens', desc: '本回合用量' },
  { id: 'permission', name: 'permissionMode', desc: '权限模式' },
  { id: 'fps', name: 'fps', desc: '渲染帧率' },
];

const CONSUMERS = [
  { name: 'MessageList', deps: ['messages'] },
  { name: 'CostBar', deps: ['tokens'] },
  { name: 'PermissionPrompt', deps: ['permission'] },
  { name: 'StatusBar', deps: ['fps'] },
];

/* AppState 是一个全局可变对象；关键不在“全局”，而在“谁订阅了什么”。
   全局广播让四个消费者都重渲染，选择器订阅只唤醒相关的那一个。 */
export function StateGraph() {
  const [broadcast, setBroadcast] = useState(true);
  const [active, setActive] = useState('messages');
  const field = FIELDS.find(item => item.id === active)!;

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1fr) 380px' }}>
      <div className="rw-col">
        <div className="rw-card rw-card--plain">
          <p className="rw-t rw-muted">AppState（全局可变）</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {FIELDS.map(item => (
              <button key={item.id} type="button" className="rw-btn"
                aria-pressed={active === item.id} onClick={() => setActive(item.id)}
                style={{ fontSize: 30, padding: '6px 14px' }}>
                <span className="rw-mono" style={{ fontSize: 30 }}>{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: '1 1 auto' }}>
          {CONSUMERS.map(consumer => {
            const hit = broadcast || consumer.deps.includes(active);
            return (
              <div key={consumer.name} className="rw-card" style={{
                borderLeftColor: hit ? RW.orange : RW.line,
                background: hit ? '#fdf2ea' : RW.panel,
                display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
              }}>
                <p className="rw-t" style={{ fontWeight: 700 }}>{consumer.name}</p>
                <p className="rw-mono rw-t--tight rw-muted" style={{ fontSize: 26 }}>
                  订阅 {consumer.deps.join(', ')}
                </p>
                <p className="rw-t rw-t--tight" style={{ color: hit ? '#a34a17' : RW.muted }}>
                  {hit ? '本次重渲染' : '不动'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rw-col">
        <Switch checked={broadcast} onChange={setBroadcast}>全局广播（不用选择器）</Switch>
        <div className="rw-card rw-card--plain">
          <p className="rw-fig" style={{ color: broadcast ? RW.red : RW.green }}>
            {broadcast ? CONSUMERS.length : CONSUMERS.filter(c => c.deps.includes(active)).length}
          </p>
          <p className="rw-t rw-muted">改一个字段时重渲染的组件数</p>
        </div>
        <div className="rw-card rw-card--soft">
          <p className="rw-t rw-t--tight">
            文档还列了 selectors（派生状态）与 <span className="rw-code">onChangeAppState</span>（变更观察者）：
            前者算，后者做副作用。
          </p>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={broadcast ? 'bad' : 'good'}>
            {broadcast
              ? `改 ${field.desc}，四个消费者全重渲染：终端 UI 的帧预算很快见底。`
              : `只有 ${CONSUMERS.filter(c => c.deps.includes(active)).length} 个组件被唤醒：其余三个不受影响。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
