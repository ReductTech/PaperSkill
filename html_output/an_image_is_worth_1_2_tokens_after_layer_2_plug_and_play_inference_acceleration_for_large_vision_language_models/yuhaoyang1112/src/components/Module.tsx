import type { ModuleDef } from '../types';
import { widgetRegistry } from '../modules/registry';
import { EVIDENCE } from '../modules/glossary';
import { Figure } from './Figure';

// The two pruning labs provide their own notes on the simulated data.
const moduleSources: Record<string, string[]> = {
  '1.1': ['sec2', 'fig3', 'sec42f'],
  '2.1': ['fig2', 'eq1'],
  '3.1': ['fig3', 'eq34'],
  '3.2': ['fig4', 'sfig7'],
  '4.1': ['fig4', 'sec34', 'tab7'],
  '6.1': ['eq5', 'sfig8'],
  '6.2': ['fig6', 'tab5'],
  '7.1': ['tab7', 'sec43'],
  '8.1': ['tab6', 'eq5'],
  '8.2': ['tab2', 'tab3', 'tab5', 'tab6'],
  '9.1': ['tab4', 'readme'],
  '9.2': ['tab1', 'fig1'],
  '10.1': ['sec2', 'sec41'],
  '10.2': ['tab1', 'tab2', 'tab5', 'tab6'],
};

// One framed interactive module. The Canvas/controls/feedback are owned by the widget
// referenced via `componentId` (registered in src/modules/registry.tsx). A missing id
// degrades to a visible notice instead of crashing.
export function Module({ module, chapterId }: { module: ModuleDef; chapterId: string }) {
  const Widget = widgetRegistry[module.componentId];
  const sources = moduleSources[module.id];
  return (
    <section className="module" id={`module-${module.id.replace('.', '-')}`} data-widget={module.componentId}
      aria-labelledby={'lab-title-' + module.id}>
      <div className="module-head">
        <span className="num">{module.id}</span>
        <h4 id={'lab-title-' + module.id}>{module.title}</h4>
      </div>
      <div className="module-body">
        <p className="module-desc" dangerouslySetInnerHTML={{ __html: module.desc }} />
        <Figure src={module.figure} alt={module.title} />
        {Widget ? (
          <Widget chapterId={chapterId} moduleId={module.id} />
        ) : (
          <div className="feedback bad">
            组件未实现：{module.componentId}（请在 src/modules/registry.tsx 注册）
          </div>
        )}
        {sources && (
          <details className="v9-notes">
            <summary>出处与口径</summary>
            <div className="v9-notes-body">
              {sources.map((key) => {
                const ref = EVIDENCE[key];
                return (
                  <p key={key}>
                    <a href={ref.href} target="_blank" rel="noopener noreferrer">{ref.label}</a>　{ref.what}
                  </p>
                );
              })}
            </div>
          </details>
        )}
      </div>
    </section>
  );
}
