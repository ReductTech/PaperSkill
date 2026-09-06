import React from 'react';
import type { WidgetProps } from './registry';

const experiments = [
  { task: '精密插接包装', values: [{ model: 'HY', value: 85 }, { model: 'π0', value: 80 }, { model: 'π0.5', value: 85 }] },
  { task: '餐具堆叠', values: [{ model: 'HY', value: 80 }, { model: 'π0', value: 60 }, { model: 'π0.5', value: 85 }] },
  { task: '杯子悬挂', values: [{ model: 'HY', value: 75 }, { model: 'π0', value: 45 }, { model: 'π0.5', value: 50 }] },
];

export const ExperimentSummaryStatic: React.FC<WidgetProps> = () => (
  <div className="experiment-summary">
    <div className="experiment-protocol"><b>真实机器人评测</b><span>随机初始物体位姿</span><span>每模型 × 每任务 20 次</span></div>
    <div className="experiment-legend"><span className="hy">HY-Embodied</span><span className="pi0">π0</span><span className="pi05">π0.5</span></div>
    <div className="experiment-grid">
      {experiments.map(item => <section key={item.task} className="experiment-task">
        <h5>{item.task}</h5>
        {item.values.map(result => <div key={result.model} className={`experiment-bar ${result.model === 'HY' ? 'hy' : result.model === 'π0' ? 'pi0' : 'pi05'}`}>
          <span>{result.model}</span><i><em style={{ width: `${result.value}%` }} /></i><b>{result.value}%</b>
        </div>)}
      </section>)}
    </div>
    <div className="experiment-two-lines">
      <p>在三项真实机器人任务中，HY-Embodied 的成功率分别为 <b>85%、80% 和 75%</b>，每个模型、每项任务测试 20 次。</p>
      <p>它在包装任务并列最佳、杯子悬挂任务领先，但餐具堆叠低于 π0.5，因此不能概括为所有任务都领先。</p>
    </div>
  </div>
);

export default ExperimentSummaryStatic;
