import React from 'react';
import { Formula } from '../components/Formula';
import type { WidgetProps } from './registry';

// §6 模块 6.1 —— 损失函数（论文式 11），直接渲染进模块卡片体内。
// 复用 Formula 组件，保留“点击公式符号查看含义”的交互；符号用纯文本基元
// （cam/dpt/xyz/λ/ℒ），以匹配 Formula.tsx 的标签外纯文本匹配规则。
const LOSS_FORMULA = {
  lead: '总损失是相机、深度、点图三项的加权和（论文式 11），λ 平衡相机项。点击下面公式中的符号查看含义：',
  unicode: 'ℒ = λ · ℒ<sub>cam</sub> + ℒ<sub>dpt</sub> + ℒ<sub>xyz</sub>　(11)',
  symbols: [
    {
      sym: 'cam',
      desc: '相机位姿损失 ℒ<sub>cam</sub>：监督相机头，论文用 <b>L1 损失</b>',
    },
    {
      sym: 'dpt',
      desc: '深度损失 ℒ<sub>dpt</sub>：监督深度头，采用<b>置信度加权 + 梯度正则</b>项',
    },
    {
      sym: 'xyz',
      desc: '点图（3D 点）损失 ℒ<sub>xyz</sub>：监督点云头，同样为<b>置信度加权 + 梯度正则</b>项',
    },
    {
      sym: 'λ',
      desc: '相机项权重：平衡 ℒ<sub>cam</sub> 与深度/点图两项的相对大小',
    },
    {
      sym: 'ℒ',
      desc: '总的多任务训练损失（式 11）：相机 + 深度 + 点图三项联合',
    },
  ],
};

export const ModLossFormula: React.FC<WidgetProps> = () => {
  return <Formula formula={LOSS_FORMULA} />;
};

export default ModLossFormula;
