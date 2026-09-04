import React, { useEffect, useState } from 'react';
import type { WidgetProps } from './registry';

const miniStages = ['TRACE', 'ROUTER', 'DISTILL', 'WRITER', 'PRODUCT'];

export const PipelineMachineAnalogy: React.FC<WidgetProps> = () => {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(0);

  useEffect(() => {
    const auto = window.setTimeout(() => setOpen(true), 1800);
    return () => window.clearTimeout(auto);
  }, []);

  useEffect(() => {
    if (!open) { setRevealed(0); return undefined; }
    const timers = miniStages.map((_, index) => window.setTimeout(() => setRevealed(index + 1), 180 + index * 180));
    return () => timers.forEach(timer => window.clearTimeout(timer));
  }, [open]);

  return <div className={`pipeline-machine-mini${open ? ' is-open' : ''}`} aria-label="p、c、D 进入锁住的 COLLEAGUE 机器，打开后展开五个模块并生成 S">
    <div className="mini-inputs"><span>p</span><span>c</span><span>D</span></div>
    <i className="mini-arrow">↓</i>
    <div className="mini-machine">
      <div className="machine-shell"><b>COLLEAGUE</b><strong>???</strong></div>
      <div className="machine-inside">{miniStages.map((stage, index) => <span key={stage} className={revealed > index ? 'visible' : ''}>{stage}</span>)}</div>
    </div>
    <i className="mini-arrow">↓</i>
    <b className="mini-output">S=(A,M,L)</b>
    <button type="button" onClick={() => setOpen(value => !value)}>{open ? 'CLOSE' : 'OPEN THE PIPELINE'}</button>
  </div>;
};

export default PipelineMachineAnalogy;
