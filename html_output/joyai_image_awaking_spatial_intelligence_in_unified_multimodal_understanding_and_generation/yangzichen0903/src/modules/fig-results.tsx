import React from 'react';

export function FigResults() {
  return (
    <div className="figure-evidence results-evidence">
      <div className="evidence-legend">
        <div className="legend-title">论文原图 · Figure 1：整体性能雷达图</div>
        <div className="legend-note">
          三张雷达图分别对应<strong>空间理解</strong>（左）、<strong>生成/文本渲染</strong>（中）、<strong>图像编辑</strong>（右）。JoyAI-Image（青色）在多数维度上包络其他基线。
        </div>
      </div>
      <div className="results-highlights">
        <div className="highlight-item">
          <div className="hl-value">64.4</div>
          <div className="hl-label">空间理解平均分<br/>（与 Gemini-2.5-Pro 持平）</div>
        </div>
        <div className="highlight-item">
          <div className="hl-value">0.963</div>
          <div className="hl-label">长文本渲染<br/>（中/英双语一致）</div>
        </div>
        <div className="highlight-item">
          <div className="hl-value">8.29</div>
          <div className="hl-label">GEdit-EN 编辑总分<br/>（开源最佳）</div>
        </div>
      </div>
    </div>
  );
}
