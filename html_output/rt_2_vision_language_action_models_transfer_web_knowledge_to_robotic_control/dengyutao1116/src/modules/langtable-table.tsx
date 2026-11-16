import React from 'react';
import type { WidgetProps } from './registry';
import { Svg, T, PAL, Card, Arrow, Pill, MiniRobot } from './kit';

// Table 1 of the paper, reproduced verbatim. This page is evidence-only:
// one checkpoint, one protocol, no new interaction needed.
export const LangtableTable: React.FC<WidgetProps> = () => {
  return (
    <div>
      <table className="paper" style={{ width: '100%', maxWidth: 880, margin: '0 auto' }}>
        <thead>
          <tr>
            <th>Model</th>
            <th>Language-Table 成功率（%）</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>BC-Zero [41]</td>
            <td>72 ± 3</td>
            <td>行为克隆基线</td>
          </tr>
          <tr>
            <td>RT-1 [1]</td>
            <td>74 ± 13</td>
            <td>同环境预训练策略</td>
          </tr>
          <tr>
            <td>LAVA [79]</td>
            <td>77 ± 4</td>
            <td>语言表任务基线</td>
          </tr>
          <tr style={{ background: '#eaf5ef', fontWeight: 600 }}>
            <td>RT-2-PaLI-3B（本文）</td>
            <td>90 ± 10</td>
            <td>同一个 3B checkpoint，约 5 Hz</td>
          </tr>
        </tbody>
      </table>
      <Svg w={1080} h={150} label="同一 checkpoint 在仿真与真机上的迁移">
        <MiniRobot x={150} y={62} s={0.55} arm="grasp" />
        <T x={150} y={124} size={11} anchor="middle" color={PAL.muted}>仿真 Language-Table</T>
        <Arrow x1={210} y1={72} x2={330} y2={72} color={PAL.muted} />
        <Pill x={342} y={48} w={230} h={26} label="同一个 3B checkpoint" color={PAL.blue} size={12} />
        <T x={342} y={90} size={11} color={PAL.muted}>不重新训练，只换环境</T>
        <Arrow x1={580} y1={72} x2={700} y2={72} color={PAL.green} />
        <MiniRobot x={760} y={62} s={0.55} arm="reach" />
        <T x={760} y={124} size={11} anchor="middle" color={PAL.muted}>真实厨房：新推动行为</T>
        <Card x={856} y={40} w={206} h={76} active color={PAL.green}>
          <T x={870} y={64} size={11} color={PAL.muted}>仿真 90% → 真机定性成功</T>
          <T x={870} y={84} size={10} color={PAL.muted}>图 5：推番茄酱、推蓝方块</T>
          <T x={870} y={102} size={10} color={PAL.muted}>动作未在机器人数据中出现过</T>
        </Card>
      </Svg>
      <p className="rt2-note">
        表 1 与图 5 用的是<strong>同一个 RT-2-PaLI-3B checkpoint</strong>：先在仿真里与基线同频（约 5 Hz）比较，再把同一权重搬到真机看新行为。
        这条证据只说明“小模型也能迁移”，不能替代 55B 在真实厨房的 6k 次评估。
      </p>
    </div>
  );
};

export default LangtableTable;
