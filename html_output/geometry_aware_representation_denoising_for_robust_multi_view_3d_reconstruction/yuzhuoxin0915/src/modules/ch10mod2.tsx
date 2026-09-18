import React from 'react';
import type { WidgetProps } from './registry';

// 第 10 章 Module 10.2：点云重建定性对比（静态展示）
export const Ch10Mod2: React.FC<WidgetProps> = () => {
  return (
    <div>
      <div className="feedback">
        左列 Input Views 为退化多视角输入，右列为 8 种方法重建的 3D 点云结果。
        GARD（Ours）在结构完整性、细节保留和噪声抑制上均明显优于基线方法。
      </div>
    </div>
  );
};

export default Ch10Mod2;
