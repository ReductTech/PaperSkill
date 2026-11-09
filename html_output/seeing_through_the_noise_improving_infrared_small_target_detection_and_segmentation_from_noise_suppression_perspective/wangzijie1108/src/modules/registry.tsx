import React from 'react';
import { ChapterAnalogy } from './ChapterAnalogies';
import { recoveredWidgets } from './recovered';

export interface WidgetProps { chapterId: string; moduleId: string }
export const paperUrl = 'https://openaccess.thecvf.com/content/CVPR2026/papers/Yuan_Seeing_Through_the_Noise_Improving_Infrared_Small_Target_Detection_and_CVPR_2026_paper.pdf';
const wrap = (id: string): React.ComponentType<WidgetProps> => {
  const Component = recoveredWidgets[id];
  return props => <div className="nsfpn-widget"><Component {...props}/></div>;
};
export const widgetRegistry: Record<string, React.ComponentType<WidgetProps>> = {};
widgetRegistry['ns-problem'] = wrap('ns-problem');
widgetRegistry['ns-dwt'] = wrap('ns-dwt');
widgetRegistry['ns-guide'] = wrap('ns-guide');
widgetRegistry['ns-gate'] = wrap('ns-gate');
widgetRegistry['ns-spiral'] = wrap('ns-spiral');
widgetRegistry['ns-attn'] = wrap('ns-attn');
widgetRegistry['ns-ablation'] = wrap('ns-ablation');
widgetRegistry['ns-hp'] = wrap('ns-hp');
widgetRegistry['ns-fpns'] = wrap('ns-fpns');
widgetRegistry['ns-sota'] = wrap('ns-sota');
widgetRegistry['ns-lineage'] = wrap('ns-lineage');
widgetRegistry['ns-check'] = wrap('ns-check');
widgetRegistry['ns-cover'] = wrap('ns-cover');
widgetRegistry['hero-old'] = props => { const C = recoveredWidgets['ns-cover']; return <div className="nsfpn-widget guide-cover-widget"><C {...props} moduleId="old"/></div>; };
widgetRegistry['hero-new'] = props => { const C = recoveredWidgets['ns-cover']; return <div className="nsfpn-widget guide-cover-widget"><C {...props} moduleId="new"/></div>; };
widgetRegistry['ns-analogy-1'] = () => <ChapterAnalogy index={0}/>;
widgetRegistry['ns-analogy-2'] = () => <ChapterAnalogy index={1}/>;
widgetRegistry['ns-analogy-3'] = () => <ChapterAnalogy index={2}/>;
widgetRegistry['ns-analogy-4'] = () => <ChapterAnalogy index={3}/>;
widgetRegistry['ns-analogy-5'] = () => <ChapterAnalogy index={4}/>;
widgetRegistry['ns-analogy-6'] = () => <ChapterAnalogy index={5}/>;
