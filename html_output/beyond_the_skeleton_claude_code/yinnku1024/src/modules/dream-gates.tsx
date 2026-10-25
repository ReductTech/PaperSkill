import React, { useState } from 'react';
import { Dept, Feedback, HW, Switch } from './kit';

/* 睡眠科：Dream 的三重门控，按成本从低到高依次检查。
   三个条件全满足才启动；中途打断，文件锁回滚，不留半成品。 */
export function DreamGates() {
  const [hours, setHours] = useState(6);
  const [sessions, setSessions] = useState(3);
  const [lock, setLock] = useState(false);
  const [interrupt, setInterrupt] = useState(false);

  const checks = [hours >= 24, sessions >= 5, lock];
  const open = checks.every(Boolean);
  const passed = checks.filter(Boolean).length;

  return (
    <div className="hw" style={{ gridTemplateColumns: 'minmax(0, 1.28fr) minmax(0, 1fr)' }}>
      <div className="hw-card hw-card--plain hw-col" style={{ gap: 8 }}>
        <div className="hw-spread">
          <p className="hw-h">入睡条件</p>
          <Dept>睡眠科</Dept>
        </div>
        <p className="hw-t hw-muted">三重门控，按成本从低到高检查。</p>

        <div className="hw-form-row">
          <span className="hw-t">距上次 dream</span>
          <div>
            <input className="hw-range" type="range" min="0" max="48" step="1" value={hours}
              aria-label="距上次 dream 的小时数" onChange={e => setHours(Number(e.target.value))} />
          </div>
          <span className="hw-chip" data-tone={checks[0] ? 'green' : 'teal'}>{hours}h / 24h</span>
        </div>

        <div className="hw-form-row">
          <span className="hw-t">已进行会话</span>
          <div>
            <input className="hw-range" type="range" min="0" max="10" step="1" value={sessions}
              aria-label="已进行会话数" onChange={e => setSessions(Number(e.target.value))} />
          </div>
          <span className="hw-chip" data-tone={checks[1] ? 'green' : 'teal'}>{sessions} / 5</span>
        </div>

        <div className="hw-form-row">
          <span className="hw-t">文件锁</span>
          <Switch checked={lock} onChange={setLock}>拿到整理锁</Switch>
          <span className="hw-chip" data-tone={checks[2] ? 'green' : 'teal'}>{checks[2] ? '可用' : '被占用'}</span>
        </div>

        <div className="hw-band" style={{ marginTop: 'auto', background: open ? HW.green : HW.teal }}>
          <span>{open ? '门控全开：后台子 agent 启动' : `${passed} / 3 通过，继续等`}</span>
        </div>
      </div>

      <div className="hw-col">
        <div className="hw-card" style={{ borderTop: `4px solid ${open ? HW.green : HW.lineStrong}` }}>
          <p className="hw-t hw-muted">启动后它会做什么</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            <span className="hw-chip" data-tone="teal">ls</span>
            <span className="hw-chip" data-tone="teal">grep</span>
            <span className="hw-chip" data-tone="teal">cat</span>
            <span className="hw-chip" data-tone="blue">写 memory</span>
          </div>
          <p className="hw-t hw-t--tight" style={{ marginTop: 8 }}>
            只读 bash：能看日志，不能改代码。footer 里只有一个不显眼的进度条。
          </p>
        </div>

        <Switch checked={interrupt} onChange={setInterrupt}>中途打断</Switch>

        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={!open ? 'neutral' : interrupt ? 'bad' : 'good'}>
            {!open
              ? '门控没满足：不动手，也不占资源。'
              : interrupt
                ? '打断后文件锁回滚，不留下半成品；下次从完整状态重来。'
                : '静默整理：把“反思”从实时对话里剥离出去。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
