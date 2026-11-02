import React from 'react';
import { ChapterAnalogy } from './ChapterAnalogies';
import { recoveredWidgets } from './recovered';

export interface WidgetProps { chapterId: string; moduleId: string }
export const paperUrl = 'https://openaccess.thecvf.com/content/WACV2021/papers/Dai_Asymmetric_Contextual_Modulation_for_Infrared_Small_Target_Detection_WACV_2021_paper.pdf';
const wrap = (id: string): React.ComponentType<WidgetProps> => {
  const Component = recoveredWidgets[id];
  return props => <div className="acm-widget"><Component {...props}/></div>;
};
export const widgetRegistry: Record<string, React.ComponentType<WidgetProps>> = {};
widgetRegistry['ac-small'] = wrap('ac-small');
widgetRegistry['ac-sirst'] = wrap('ac-sirst');
widgetRegistry['ac-down'] = wrap('ac-down');
widgetRegistry['ac-gap'] = wrap('ac-gap');
widgetRegistry['ac-pcam'] = wrap('ac-pcam');
widgetRegistry['ac-acm'] = wrap('ac-acm');
widgetRegistry['ac-hosts'] = wrap('ac-hosts');
widgetRegistry['ac-ablation'] = wrap('ac-ablation');
widgetRegistry['ac-niou'] = wrap('ac-niou');
widgetRegistry['ac-sota'] = wrap('ac-sota');
widgetRegistry['ac-fpn'] = wrap('ac-fpn');
widgetRegistry['ac-limits'] = wrap('ac-limits');
widgetRegistry['ac-cover'] = wrap('ac-cover');
widgetRegistry['hero-old'] = props => { const C = recoveredWidgets['ac-cover']; return <div className="acm-widget guide-cover-widget"><C {...props} moduleId="old"/></div>; };
widgetRegistry['hero-new'] = props => { const C = recoveredWidgets['ac-cover']; return <div className="acm-widget guide-cover-widget"><C {...props} moduleId="new"/></div>; };
widgetRegistry['ac-analogy-1'] = () => <ChapterAnalogy index={0}/>;
widgetRegistry['ac-analogy-2'] = () => <ChapterAnalogy index={1}/>;
widgetRegistry['ac-analogy-3'] = () => <ChapterAnalogy index={2}/>;
widgetRegistry['ac-analogy-4'] = () => <ChapterAnalogy index={3}/>;
widgetRegistry['ac-analogy-5'] = () => <ChapterAnalogy index={4}/>;
widgetRegistry['ac-analogy-6'] = () => <ChapterAnalogy index={5}/>;
