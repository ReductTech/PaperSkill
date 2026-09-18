import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const HeroNew: React.FC<WidgetProps> = () => {
  const [view, setView] = useState<'memory' | 'flow'>('memory');
  return (
    <div className="hero-memory hero-memory-new">
      <div className="hero-binder" aria-hidden="true"><i>长期知识</i><i>项目工件</i></div>
      <p>{view === 'memory' ? 'SciMem：可追溯、可复用的研究工件' : 'SciFlow：以工件契约衔接研究阶段'}</p>
      <button onClick={() => setView(view === 'memory' ? 'flow' : 'memory')} aria-label="切换 AutoSci 视图">
        查看 {view === 'memory' ? 'SciFlow' : 'SciMem'}
      </button>
    </div>
  );
};
