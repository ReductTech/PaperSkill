import React from 'react';
import type { WidgetProps } from './registry';

const overviewStages = [
  ['01', 'HY-Pano 2.0', '把文本或单图扩展为 360° 世界种子'],
  ['02', 'WorldNav', '解析场景并规划五类补盲轨迹'],
  ['03', 'WorldStereo 2.0', '用关键帧、双记忆和四步采样扩展观察'],
  ['04', 'WorldMirror 2.0', '一次共享前向恢复五类三维产物'],
  ['05', '3DGS + WorldLens', '压缩显式资产并接入光照、碰撞与漫游'],
] as const;

export const HyPaperOverview: React.FC<WidgetProps> = () => {
  const quickMode = new URLSearchParams(window.location.search).get('quickread') === '1';

  return <section id="quick-overview" className="hy-paper-overview" aria-label="HY-World 2.0 全文快速概述">
    <header><span>全文最快概述</span><strong>生成补观察，重建守几何，最终交付可运行三维世界</strong></header>
    <div className="hy-overview-theses">
      <article><b>为什么做</b><p>视频生成擅长想象未见区域，却不稳定保存三维状态；多视图重建忠实恢复已见几何，却无法补齐盲区。</p></article>
      <article><b>核心办法</b><p>文本与单图先走生成链，多视图与视频可直接重建；两条路线最终都由 WorldMirror 2.0 凝结为显式资产。</p></article>
      <article><b>做成什么</b><p>输出可保存、可换视角渲染、可压缩，并能进入 WorldLens 支持重新照明、碰撞和角色漫游。</p></article>
    </div>
    <ol className="hy-overview-pipeline">
      {overviewStages.map(([order, name, role]) => <li key={name}><span>{order}</span><div><strong>{name}</strong><small>{role}</small></div></li>)}
    </ol>
    <footer><b>结果与边界</b><span>3DGS 从 6.000M 压到 1.381M；WorldMirror 在 H20 四卡、128 视图条件下为 5.60 秒；完整世界生成约 712 秒，仍是离线流程。</span></footer>
    {quickMode ? null : <a className="quick-read-entry hy-overview-entry" href="?quickread=1#quick-overview"><span>快速展示</span><strong>进入全文专家导航</strong><b>→</b></a>}
  </section>;
};

export default HyPaperOverview;
