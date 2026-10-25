import React from 'react';

/**
 * 视口高度（隐藏面板时 innerHeight 可能为 0，退回 800）。
 * 只在变化超过 120px 时更新：手机地址栏收放不会让舞台在滚动中忽高忽低。
 */
let cachedVH = 0;
export const viewH = () => {
  const ih = typeof window !== 'undefined' ? window.innerHeight : 0;
  if (ih > 200 && (cachedVH === 0 || Math.abs(ih - cachedVH) > 120)) cachedVH = ih;
  return cachedVH || 800;
};

/**
 * 舞台高度：按宽度给出理想值，再用视口高度封顶，保证舞台和右侧（或下方）控件能同屏。
 * 桌面（左右排列）：舞台 ≤ 视口 − 170（留出模块标题与边距）；900px 以下（上下排列）：舞台 ≤ 视口 × 0.5。
 */
export function fitStageH(w: number, ideal: number, min: number, narrow?: boolean) {
  const vh = viewH();
  // 是否上下排列看的是视口宽度（与 .ss 的 900px 断点一致），不是舞台自身的宽度
  const stacked = narrow ?? (typeof window !== 'undefined' && window.innerWidth > 0 ? window.innerWidth <= 900 : w < 600);
  const cap = stacked ? vh * 0.5 : vh - 170;
  return Math.round(Math.max(min, Math.min(ideal, cap)));
}

/**
 * 同屏布局：桌面端动画在左（随滚动吸附），控件与即时解释在右；
 * 900px 以下改为上下排列，控件紧跟舞台，不需要来回滚动。
 */
export function StageSplit({ stage, side, top, className }: { stage: React.ReactNode; side: React.ReactNode; top?: React.ReactNode; className?: string }) {
  return (
    <div className={`ss ${className ?? ''}`}>
      <div className="ss-stage">
        {top}
        {stage}
      </div>
      <div className="ss-side">{side}</div>
    </div>
  );
}
