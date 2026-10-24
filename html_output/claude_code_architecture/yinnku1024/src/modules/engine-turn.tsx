import React, { useState } from 'react';
import { Feedback, RW, Switch } from './kit';

const CAPS = [
  { id: 'stream', name: '流式返回', good: '边生成边渲染', bad: '要等整段响应' },
  { id: 'think', name: '思考预算', good: '为 thinking 分配预算', bad: '没有思考段' },
  { id: 'tools', name: '工具循环', good: '调用 → 回灌 → 再请求', bad: '第一次回答就结束' },
  { id: 'retry', name: '重试退避', good: '瞬时错误自动重试', bad: '一次抖动就终止' },
  { id: 'cost', name: 'token 计费', good: '每轮记账，/cost 可查', bad: '/cost 没有数据' },
  { id: 'context', name: '上下文管理', good: '压缩与裁剪历史', bad: '长会话迟早溢出' },
];

/* 46K 行的引擎不是因为代码啰嗦，而是因为六件回合级的事必须由同一个循环持有。 */
export function EngineTurn() {
  const [off, setOff] = useState<string[]>([]);
  const toggle = (id: string, enabled: boolean) => setOff(current => enabled ? current.filter(item => item !== id) : [...current, id]);
  const disabled = CAPS.filter(cap => off.includes(cap.id));
  const toolOff = off.includes('tools');
  const retryOff = off.includes('retry');

  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.22fr) minmax(0, 1fr)' }}>
      <div className="rw-card rw-card--plain" style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: 10 }}>
        <div className="rw-spread">
          <p className="rw-h">一个回合里发生的事</p>
          <span className="rw-chip" data-tone="steel">QueryEngine ≈ 46K 行</span>
        </div>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {CAPS.map(cap => {
            const isOff = off.includes(cap.id);
            return (
              <div key={cap.id} style={{
                display: 'grid', gridTemplateColumns: '190px minmax(0, 1fr) auto',
                alignItems: 'center', gap: 12, padding: '8px 14px', borderRadius: 6,
                border: `1px solid ${isOff ? RW.line : RW.lineStrong}`,
                background: isOff ? '#f2f4f7' : '#ffffff',
              }}>
                <span className="rw-t" style={{ fontWeight: 700, color: isOff ? RW.muted : RW.ink }}>{cap.name}</span>
                <span className="rw-t rw-t--tight" style={{ color: isOff ? RW.muted : RW.ink }}>
                  {isOff ? cap.bad : cap.good}
                </span>
                <span className="rw-chip" data-tone={isOff ? 'red' : 'green'}>{isOff ? '关闭' : '运行'}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rw-col">
        <p className="rw-t rw-muted">把六件事逐个关掉，看这一回合退化成什么</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {CAPS.map(cap => (
            <Switch key={cap.id} checked={!off.includes(cap.id)}
              onChange={enabled => toggle(cap.id, enabled)}>{cap.name}</Switch>
          ))}
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={disabled.length === 0 ? 'good' : toolOff ? 'bad' : 'neutral'}>
            {disabled.length === 0
              ? '六件事都发生在同一个循环里：流式、工具、预算、重试、计费、上下文。'
              : toolOff
                ? '工具循环关掉后，它只是一个会聊天的终端：没有能力回到代码里。'
                : `关闭 ${disabled.length} 项后，回合仍能跑完，但${retryOff ? '网络一抖就断' : '状态会越来越不可控'}。`}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
