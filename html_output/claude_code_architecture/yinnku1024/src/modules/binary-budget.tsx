import React, { useState } from 'react';
import { Feedback, Meter, RW, Switch } from './kit';

const STEPS = ['安装运行时', '解析依赖', '转译 TSX', '启动入口'];

/* 同一批启动步骤，换一个运行时只是换了它们发生的位置：
   Node 把前四步全放在用户机器，Bun 把前三步挪进发布流水线。 */
export function BinaryBudget() {
  const [bun, setBun] = useState(true);
  const onUser = bun ? 1 : 4;
  const onPipeline = 4 - onUser;
  return (
    <div className="rw" style={{ gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1fr)' }}>
      <div className="rw-card rw-card--plain" style={{ display: 'grid', gridTemplateRows: 'auto 1fr 1fr', gap: 10 }}>
        <Switch checked={bun} onChange={setBun}>{bun ? 'Bun 单二进制' : 'Node + 依赖树'}</Switch>
        <div>
          <p className="rw-t rw-muted">在用户机器上发生</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {STEPS.slice(0, onUser).map(step => (
              <span key={step} className="rw-chip" data-tone="orange">{step}</span>
            ))}
          </div>
        </div>
        <div>
          <p className="rw-t rw-muted">在发布流水线里发生</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
            {STEPS.slice(onUser).map(step => (
              <span key={step} className="rw-chip" data-tone="blue">{step}</span>
            ))}
            {onPipeline === 0 && <span className="rw-chip" data-tone="steel">无</span>}
          </div>
        </div>
      </div>

      <div className="rw-col">
        <div className="rw-card rw-card--plain">
          <p className="rw-fig" style={{ color: bun ? RW.green : RW.red }}>{onUser}</p>
          <p className="rw-t rw-muted">用户机器上要完成的启动步骤</p>
          <Meter label="启动责任前移" value={(4 - onUser) * 33} max={100} tone={bun ? 'green' : 'red'}
            readout={`${onPipeline} / 4 在流水线`} />
        </div>
        <div className="rw-card rw-card--soft">
          <p className="rw-t rw-t--tight">
            Bun 直接吃 TSX，不需要单独的转译步骤；ESM 用 <span className="rw-code">.js</span> 后缀，是它的约定。
          </p>
        </div>
        <div style={{ marginTop: 'auto' }}>
          <Feedback tone={bun ? 'good' : 'bad'}>
            {bun
              ? '单二进制把装配提前到发布阶段：用户拿到的是一个文件，失败也提前暴露。'
              : '四步都在用户机器上：任何一步出错，都是用户先看到。'}
          </Feedback>
        </div>
      </div>
    </div>
  );
}
