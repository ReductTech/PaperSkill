import React, { useState } from 'react';
import type { WidgetProps } from './registry';

export const HeroOld: React.FC<WidgetProps> = () => {
  const [closed, setClosed] = useState(false);
  return (
    <div className="hero-memory hero-memory-old">
      <div className="hero-note-stack" aria-hidden="true">
        <span>文献</span><span>实验</span><span>评审</span>
      </div>
      <p>{closed ? '会话已结束：片段彼此失联' : '会话进行中：信息只在临时上下文里'}</p>
      <button onClick={() => setClosed(!closed)} aria-label="切换一次性会话状态">
        {closed ? '重新打开会话' : '结束会话'}
      </button>
    </div>
  );
};
