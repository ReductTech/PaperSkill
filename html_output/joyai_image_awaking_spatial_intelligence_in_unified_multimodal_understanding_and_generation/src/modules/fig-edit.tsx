import React from 'react';

export function FigEdit() {
  return (
    <div className="figure-evidence">
      <div className="evidence-legend">
        <div className="legend-title">论文原图 · Figure 10</div>
        <div className="legend-items">
          <span className="legend-chip mmdit-chip">静态相机：物体变换</span>
          <span className="legend-chip plan-chip">动态相机：视角变换</span>
        </div>
        <div className="legend-note">
          两条分支把“编辑指令”落实成源图—目标图配对数据：一条要求局部对象变化而背景稳定，另一条要求相机变化而场景结构保持一致。
        </div>
      </div>
    </div>
  );
}

