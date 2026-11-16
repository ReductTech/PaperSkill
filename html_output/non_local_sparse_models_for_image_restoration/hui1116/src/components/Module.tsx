import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { Figure } from './Figure';

const evidenceLabels = { demo: '教学演示', paper: '论文结果', extension: '教学扩展' };

export function Module({ module, chapterId, paperSource }: { module: ModuleDef; chapterId: string; paperSource?: string }) {
  const Widget = widgetRegistry[module.componentId];
  const figure = module.figure;
  const figureSource = paperSource && figure?.page ? paperSource + '#page=' + figure.page : paperSource;
  return (
    <div className="module">
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4>{module.title}</h4>
        {module.evidence ? <span className="module-evidence">{evidenceLabels[module.evidence]}</span> : null}
      </div>
      <div className="module-body">
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            此互动模块暂时无法加载。
          </div>
        )}
        {figure ? (
          <details className="module-figure">
            <summary>查看论文原图</summary>
            <Figure src={figure.src} alt={figure.alt} caption={figure.caption} source={figureSource} />
          </details>
        ) : null}
      </div>
    </div>
  );
}
