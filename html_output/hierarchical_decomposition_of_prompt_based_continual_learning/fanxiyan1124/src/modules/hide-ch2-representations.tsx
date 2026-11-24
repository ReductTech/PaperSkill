import React, { useState } from 'react';
import {
  HideBadge,
  HideBar,
  HideMetric,
  HideNote,
  HidePanel,
  HideScene,
  HideSegment,
} from './hide-kit';

type Pretrain = 'sup' | 'ibot';

const cka: Record<Pretrain, number> = { sup: 0.743, ibot: 0.928 };

export function HideCh2Representations() {
  const [pretrain, setPretrain] = useState<Pretrain>('sup');
  const value = cka[pretrain];
  const rewriteRoom = (1 - value) * 100;

  return (
    <HideScene chapter="暗房架 02 · 双状态表征" cue="同一底片的两种职责" tone="green">
      <div className="hide-grid hide-ch2-layout">
        <HidePanel
          title="核心数据：CKA 相似度"
          meta={`${pretrain === 'sup' ? 'Sup-21K' : 'iBOT-21K'}`}
          tone="green"
        >
          <HideSegment
            value={pretrain}
            onChange={setPretrain}
            label="切换预训练范式"
            options={[
              { value: 'sup', label: 'Sup-21K' },
              { value: 'ibot', label: 'iBOT-21K' },
            ]}
          />
          <div className="hide-metric-pair">
            <HideMetric label="CKA" value={value.toFixed(3)} tone={pretrain === 'sup' ? 'blue' : 'orange'} />
            <HideMetric label="1−CKA (表征改写空间)" value={`${rewriteRoom.toFixed(1)}%`} tone="orange" />
          </div>
          <HideBar 
            label="未受提示 ↔ 受提示" 
            value={value * 100} 
            tone={pretrain === 'sup' ? 'blue' : 'red'} 
            note={value > 0.9 ? '高度相似' : '差异明显'} 
          />

          <HideNote title="CKA 的含义" tone="purple">
            CKA 衡量未受提示表征与受提示表征的相似度
            <br /><br />
            <strong>Sup-21K (0.743)：</strong>提示能改写表征，任务知识被写入
            <br />
            <strong>iBOT-21K (0.928)：</strong>提示难以改写表征，任务知识写入困难
          </HideNote>
        </HidePanel>

        <div className="hide-side-stack">
          <HidePanel title="为什么要两种表征？" meta="职责分离" tone="blue">
            <HideNote title="未受提示表征" tone="blue">
              <strong>职责：任务身份推断 (TII)</strong>
              <br />保留预训练泛化分布
              <br />在已见任务间推断任务编号
            </HideNote>

            <HideNote title="受提示表征" tone="green">
              <strong>职责：任务内分类 (WTP)</strong>
              <br />经过任务提示的紧凑簇
              <br />在该任务的类别范围内预测
            </HideNote>

            <HideNote title="两种表征的协同" tone="purple">
              不是简单的新旧替换，而是分工合作：
              <br />• TII 用未受提示表征选任务
              <br />• WTP 用受提示表征分类别
              <br />• TAP 直接在全部受提示类上预测
            </HideNote>
          </HidePanel>
        </div>
      </div>
    </HideScene>
  );
}
