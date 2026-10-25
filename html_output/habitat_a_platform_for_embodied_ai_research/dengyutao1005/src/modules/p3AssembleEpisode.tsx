import React, { useState } from 'react';
import type { WidgetProps } from './registry';

const TARGET = ['Task', 'Episode', 'Environment'];
const DESC: Record<string, string> = {
  Task: '定义任务、观测、动作空间、终止条件与成功度量（§3）',
  Episode: '一次任务实例：起点、朝向、场景、目标、可选最短路径（§3）',
  Environment: '封装与模拟器协作的一切信息，供运行具身任务（§3）',
};

export const P3AssembleEpisode: React.FC<WidgetProps> = () => {
  const [order, setOrder] = useState<string[]>(['Episode', 'Environment', 'Task']);
  const done = TARGET.every((x, i) => order[i] === x);
  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= order.length) return;
    const a = [...order];
    [a[i], a[j]] = [a[j], a[i]];
    setOrder(a);
  };
  return (
    <div className="mod-order">
      <p className="mod-hint">用 ↑/↓ 把三个抽象排成正确的组装顺序：</p>
      {order.map((x, i) => (
        <div key={x} className={`order-row ${done ? 'done' : ''}`}>
          <span className="order-idx">{i + 1}</span>
          <span className="order-name">{x}</span>
          <span className="order-desc">{DESC[x]}</span>
          <span className="order-ctl">
            <button disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button disabled={i === order.length - 1} onClick={() => move(i, 1)}>↓</button>
          </span>
        </div>
      ))}
      <div className={`feedback ${done ? 'good' : ''}`}>
        {done
          ? '正确：Task 定义任务 → Episode 描述一次实例 → Environment 提供运行环境（§3 Habitat-API）。'
          : '提示：先定义“任务”，再描述“一个实例”，最后才谈“运行环境”。'}
      </div>
    </div>
  );
};

export default P3AssembleEpisode;
