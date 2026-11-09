import { useState } from 'react';
import { Choice, Feedback, Kitchen } from './palm-kit';

export function PalmRepair() {
  const [moved, setMoved] = useState(false);
  const [fresh, setFresh] = useState(true);
  const retry = moved && fresh;
  const stale = moved && !fresh;
  return <div className="pk-body pk-split pk-repair">
    <div className="pk-card pk-stack">
      <Kitchen opening={1} sponge={moved ? 1 : 2} arm={retry ? 515 : 565} camera={fresh} spill />
      <div className="pk-options">
        <Choice active={moved} onClick={() => setMoved(!moved)}>{moved ? '恢复原状' : '把海绵放回抽屉'}</Choice>
        <Choice active={fresh} onClick={() => setFresh(!fresh)}>{fresh ? '改用旧观测' : '读取新观测'}</Choice>
      </div>
      <Feedback tone={stale ? 'red' : 'green'}>
        {retry ? '夹具已空，下一步改为重新取海绵。' : stale ? '旧画面显示仍抓着海绵，计划会误以为能直接放下。' : '夹具仍抓着海绵，下一步放到台面。'}
      </Feedback>
    </div>
    <div className="pk-card pk-stack pk-case">
      <h2>真机案例 · 米饼被放回</h2>
      <ol className="pk-case-steps" aria-label="论文图 5 所示的三个关键时刻">
        <li><strong>取出</strong><span>机器人从抽屉拿出米饼。</span></li>
        <li><strong>干扰</strong><span>人把米饼放回抽屉。</span></li>
        <li><strong>恢复</strong><span>机器人再次取出米饼并交付。</span></li>
      </ol>
      <p>论文图 5 记录了一次受扰后的继续执行。能否恢复取决于新观测和机器人已有的低层技能。</p>
    </div>
  </div>;
}
