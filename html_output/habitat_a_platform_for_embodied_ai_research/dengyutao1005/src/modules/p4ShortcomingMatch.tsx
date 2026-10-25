import React, { useState } from 'react';
import type { WidgetProps } from './registry';

// 旧模拟器五大不足 ↔ 后果（§2）。点击左侧不足，再点右侧后果完成配对。
const PAIRS = [
  { k: '任务-平台-数据集紧耦合', v: '多任务/多数据集实验不切实际' },
  { k: '硬编码 agent 配置', v: '无法做参数与传感器消融' },
  { k: '渲染与仿真性能差(10–100fps)', v: '训练瓶颈，大规模学习不可行' },
  { k: '环境状态控制受限', v: '难以程序化修改场景测鲁棒性' },
  { k: '难独立复现', v: '不同平台工作难以公平比较' },
];

export const P4ShortcomingMatch: React.FC<WidgetProps> = () => {
  const [selK, setSelK] = useState<string | null>(null);
  const [pairs, setPairs] = useState<Record<string, string>>({});
  const [wrong, setWrong] = useState(false);
  const done = Object.keys(pairs).length === PAIRS.length;

  const pickV = (v: string) => {
    if (done) return;
    if (!selK) return;
    if (PAIRS.find((p) => p.k === selK)?.v === v) {
      setPairs({ ...pairs, [selK]: v });
      setSelK(null);
      setWrong(false);
    } else {
      setWrong(true);
      setTimeout(() => setWrong(false), 600);
    }
  };

  return (
    <div className="mod-match">
      <div className="match-cols">
        <div className="match-col">
          <h5>五大不足</h5>
          {PAIRS.map((p) => (
            <button
              key={p.k}
              className={`match-k ${pairs[p.k] ? 'matched' : ''} ${selK === p.k ? 'sel' : ''}`}
              onClick={() => setSelK(pairs[p.k] ? null : p.k)}
            >
              {pairs[p.k] ? '✓ ' : ''}{p.k}
            </button>
          ))}
        </div>
        <div className="match-col">
          <h5>造成的后果</h5>
          {PAIRS.map((p) => {
            const by = Object.entries(pairs).find(([, v]) => v === p.v)?.[0];
            return (
              <button key={p.v} className={`match-v ${by ? 'matched' : ''}`} onClick={() => pickV(p.v)}>
                {by ? `${by} ⇄ ` : ''}{p.v}
              </button>
            );
          })}
        </div>
      </div>
      <div className={`feedback ${done ? 'good' : wrong ? 'bad' : ''}`}>
        {done
          ? '全部配对成功：这五点不足正是 Habitat 设计需求（§3）的由来。'
          : wrong
          ? '配对不匹配，请重试。'
          : '先点一个“不足”，再点对应的“后果”。'}
      </div>
    </div>
  );
};

export default P4ShortcomingMatch;
