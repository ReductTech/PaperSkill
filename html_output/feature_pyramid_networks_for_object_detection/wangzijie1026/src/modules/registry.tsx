import React from 'react';
import { ChapterAnalogy } from './ChapterAnalogies';
import { recoveredWidgets } from './recovered';

export interface WidgetProps { chapterId: string; moduleId: string }
export const paperUrl = 'https://openaccess.thecvf.com/content_cvpr_2017/papers/Lin_Feature_Pyramid_Networks_CVPR_2017_paper.pdf';

const wrap = (id: string): React.ComponentType<WidgetProps> => {
  const Component = recoveredWidgets[id];
  return props => <div className="fpn-widget"><Component {...props}/></div>;
};
export const widgetRegistry: Record<string, React.ComponentType<WidgetProps>> = {};
widgetRegistry['fp-ablation'] = wrap('fp-ablation');
widgetRegistry['fp-anchors'] = wrap('fp-anchors');
widgetRegistry['fp-arch'] = wrap('fp-arch');
widgetRegistry['fp-assign'] = wrap('fp-assign');
widgetRegistry['fp-coco'] = wrap('fp-coco');
widgetRegistry['fp-cover'] = wrap('fp-cover');
widgetRegistry['fp-detect'] = wrap('fp-detect');
widgetRegistry['fp-kit'] = wrap('fp-kit');
widgetRegistry['fp-limits'] = wrap('fp-limits');
widgetRegistry['fp-lineage'] = wrap('fp-lineage');
widgetRegistry['fp-merge'] = wrap('fp-merge');
widgetRegistry['fp-schemes'] = wrap('fp-schemes');
widgetRegistry['fp-seg'] = wrap('fp-seg');
widgetRegistry['hero-old'] = props => { const C = recoveredWidgets['fp-cover']; return <div className="fpn-widget guide-cover-widget"><C {...props} moduleId="old"/></div>; };
widgetRegistry['hero-new'] = props => { const C = recoveredWidgets['fp-cover']; return <div className="fpn-widget guide-cover-widget"><C {...props} moduleId="new"/></div>; };
widgetRegistry['fp-analogy-1'] = () => <ChapterAnalogy index={0}/>;
widgetRegistry['fp-analogy-2'] = () => <ChapterAnalogy index={1}/>;
widgetRegistry['fp-analogy-3'] = () => <ChapterAnalogy index={2}/>;
widgetRegistry['fp-analogy-4'] = () => <ChapterAnalogy index={3}/>;
widgetRegistry['fp-analogy-5'] = () => <ChapterAnalogy index={4}/>;
widgetRegistry['fp-analogy-6'] = () => <ChapterAnalogy index={5}/>;
