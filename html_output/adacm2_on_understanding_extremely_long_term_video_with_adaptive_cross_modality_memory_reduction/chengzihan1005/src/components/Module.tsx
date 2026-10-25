import React, { useEffect, useRef } from 'react';
import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

const paperFigureCaptions: Record<string, string> = {
  './images/fig1-motivation.png': '论文 Figure 1：单模态压缩与跨模态注意力对比。',
  './images/fig2-egovideo.png': '论文 Figure 2：Ego4D 长视频问答案例。',
  './images/fig3-sparsity.png': '论文 Figure 3(a)(b)：跨模态注意力与得分分布。',
  './images/fig3-c-distance.png': '论文 Figure 3(c)：不同层的帧间相似度。',
  './images/fig4-architecture.png': '论文 Figure 4：AdaCM² 方法架构。',
  './images/fig5-reduction.png': '论文 Figure 5：视频缓存压缩过程。',
  './images/fig6-memory.png': '论文 Figure 6：显存实测；其他任务分数来自论文表格。',
  './images/fig7-random-eviction.png': '论文 Figure 7：与随机淘汰策略的对比。',
  './images/fig8-ablation.png': '论文 Figure 8：α、β 的消融结果。',
};

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.querySelectorAll('canvas:not([aria-label])').forEach(canvas => {
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${module.title}：教学示意，操作控件及文字说明见画布下方`);
    });
  }, [module.id, module.title]);
  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
      </div>
      <div className="module-body" ref={bodyRef}>
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        <Figure src={module.figure} alt={module.title} caption={module.figure ? paperFigureCaptions[module.figure] : undefined} />
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
      </div>
    </div>
  );
}
