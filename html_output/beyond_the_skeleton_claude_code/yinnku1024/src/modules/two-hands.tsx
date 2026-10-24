import React from 'react';
import { Dept, HW } from './kit';

const PAIRS = [
  { teach: '“请认真检查代码”', incentive: '“Your job is to try to break it.”', effect: '把“认真”变成“破坏”的身份' },
  { teach: '“搜索文件时要全面”', incentive: '“You excel at navigating codebases.”', effect: '先给能力，再划边界' },
  { teach: '“空闲时不要浪费资源”', incentive: '“Do whatever seems most useful, or call Sleep.”', effect: '有用就做，没用就睡' },
  { teach: '“不要过度工程”', incentive: '“Three similar lines beat a premature abstraction.”', effect: '把结论直接给，不讲道理' },
];

/* 两只手：Context not Control 管信息，Don't Teach, Incentivize 管动机。 */
export function TwoHands() {
  return (
    <div className="hw" style={{ gridTemplateRows: 'minmax(0, 1fr) auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 0.92fr) minmax(0, 1.08fr)', gap: 16, minHeight: 0 }}>
        <div className="hw-card" style={{ borderTop: `4px solid ${HW.blue}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="hw-spread">
            <p className="hw-h" style={{ color: HW.blue }}>Context, not Control</p>
            <Dept>左手</Dept>
          </div>
          <p className="hw-t hw-t--tight">给框架和原则，不给步骤。</p>
          <ul style={{ display: 'grid', gap: 8, listStyle: 'none', marginTop: 4 }}>
            <li className="hw-slot"><span className="hw-t">Explore：一份能力描述 + 一份禁令清单，然后放手。</span></li>
            <li className="hw-slot"><span className="hw-t">Verification：一套识别自我合理化的框架，而不是一串步骤。</span></li>
            <li className="hw-slot"><span className="hw-t">“Complete the task fully — don’t gold-plate, but don’t leave it half-done.”</span></li>
          </ul>
          <p className="hw-t hw-muted" style={{ marginTop: 'auto' }}>
            Control 得到服从，但系统有单点瓶颈；Context 得到创造，代价是提示词工程更贵。
          </p>
        </div>

        <div className="hw-card" style={{ borderTop: `4px solid ${HW.orange}`, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div className="hw-spread">
            <p className="hw-h" style={{ color: '#a34a17' }}>Don’t Teach, Incentivize</p>
            <Dept>右手</Dept>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr 0.9fr', gap: 6 }}>
            <span className="hw-t hw-muted" style={{ fontSize: 26 }}>说教</span>
            <span className="hw-t hw-muted" style={{ fontSize: 26 }}>激励</span>
            <span className="hw-t hw-muted" style={{ fontSize: 26 }}>换来的</span>
            {PAIRS.map(pair => (
              <React.Fragment key={pair.teach}>
                <span className="hw-t hw-t--tight" style={{ fontSize: 26, color: HW.muted }}>{pair.teach}</span>
                <span className="hw-t hw-t--tight" style={{ fontSize: 26 }}>{pair.incentive}</span>
                <span className="hw-t hw-t--tight" style={{ fontSize: 26, color: HW.muted }}>{pair.effect}</span>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="hw-band">
        <span>一个管你<strong>看到什么</strong>，一个管你<strong>想做什么</strong>；缺一条，Agent 都不会真正自驱。</span>
      </div>
    </div>
  );
}
