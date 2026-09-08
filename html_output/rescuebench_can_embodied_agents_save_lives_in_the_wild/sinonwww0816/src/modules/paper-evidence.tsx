import type { WidgetProps } from './registry';
import { assetPath } from '../lib/assetPath';

export function PaperEvidence(_: WidgetProps) {
  const figureSrc = assetPath('/images/rescuebench-figure-1.png');
  return (
    <figure className="paper-evidence">
      <div className="paper-evidence-copy">
        <span>论文证据 · 图 1（Figure 1）</span>
        <p>论文将 RescueBench 概括为四个顺序依赖阶段，并指出这种组合会暴露既有基准中难以观察的级联失败。</p>
      </div>
      <a href={figureSrc} target="_blank" rel="noreferrer" aria-label="打开 RescueBench 论文 Figure 1 原图">
        <img src={figureSrc} alt="RescueBench Figure 1：四阶段搜索救援流程与五级渐进难度" loading="lazy" />
        <span>查看原图 ↗</span>
      </a>
      <figcaption>来源：RescueBench 论文图 1（Figure 1）。</figcaption>
    </figure>
  );
}
