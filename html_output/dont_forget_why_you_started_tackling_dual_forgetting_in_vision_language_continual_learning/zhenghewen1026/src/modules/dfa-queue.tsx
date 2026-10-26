import { SvgText } from './dfa-kit';
import React, { useState } from 'react';
import { S, Film } from './dfa-kit';
import './dfa.css';
import './middle.css';

export function DfaQueue() {
  const [round, setRound] = useState(4);
  const ids = [round - 3, round - 2, round - 1, round];
  return <div className="dfa-page dm-queue">
    <div className="dm-queue-drawer">
      <svg viewBox="0 0 1472 320" role="img" aria-label={`容量128对特征的历史队列，当前保留任务${ids.join('、')}`}>
        <rect x="110" y="75" width="1250" height="210" rx="24" fill="#d8c4a6"/>
        <rect x="128" y="93" width="1214" height="172" rx="17" fill="#fbfaf6"/>
        <SvgText x="148" y="47" fontSize="28" fill="#68778f">最早进入</SvgText><SvgText x="1190" y="47" fontSize="28" fill="#228d5c">最新进入</SvgText>
        {ids.map((id, index) => <g key={id} className={index === 3 && round > 4 ? 'dm-film-in' : ''} transform={`translate(${160 + index * 292} 116)`}>
          <Film x={0} y={0} w={260} label={`任务 ${id}`} color={index === 3 ? '#228d5c' : '#27446e'}/>
          <SvgText x="130" y="145" textAnchor="middle" fill="#21324a" fontSize="28">32 对特征</SvgText>
        </g>)}
        {round > 4 && <g className="dm-queue-outcome"><SvgText x="20" y="308" fontSize="28" fill="#c43f52">移出任务 {round - 4}</SvgText><SvgText x="1220" y="308" fontSize="28" fill="#228d5c">加入任务 {round}</SvgText></g>}
      </svg>
    </div>
    <div className="dm-queue-bottom">
      <div className="dm-queue-principle">
        <h3>保留历史参照，容量保持固定</h3>
        <div className="dm-queue-equation"><S meaning="4：此教学示例中的四组历史记录。">4</S> × <S meaning="32：每次任务结束选入的图文特征对数。">32</S> = <S meaning="128：论文默认的历史队列容量。">128</S> 对特征</div>
        <p>保存图像与文本的特征表示。历史负样本同时参与对齐阶段和类别学习阶段的对比目标。</p>
      </div>
      <button className="dm-film-button" type="button" onClick={() => setRound(v => v === 10 ? 4 : v + 1)} aria-label={round === 10 ? '回到四槽示例' : `加入任务${round + 1}的32对特征`}>
        <span>{round === 10 ? '回到四槽示例' : '加入下一任务'}</span><strong>{round === 10 ? '任务 1—4' : '+ 32 对特征'}</strong>
      </button>
    </div>
    <p className="dm-feedback" data-testid="queue-feedback" aria-live="polite">{round === 4 ? '教学示例从已填满的四槽开始。' : `任务 ${round} 加入，最早的任务 ${round - 4} 移出。`}当前保留任务 {ids.join('、')}，总数始终为 128。</p>
  </div>;
}
