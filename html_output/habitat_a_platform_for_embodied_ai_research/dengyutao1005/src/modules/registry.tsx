import React from 'react';
import { DeliveryAnalogy } from './deliveryAnalogy';
import { HeroOld } from './heroOld';
import { HeroNew } from './heroNew';
import { P2RealVsSim } from './p2RealVsSim';
import { P4ShortcomingMatch } from './p4ShortcomingMatch';
import { P5SoftwareStack } from './p5SoftwareStack';
import { P9UberShader } from './p9UberShader';
import { Table1Chart } from './table1Chart';
import { P3AssembleEpisode } from './p3AssembleEpisode';
import { P12TaskCards } from './p12TaskCards';
import { P1SensorNav } from './p1SensorNav';
import { P2SensorToggle } from './p2SensorToggle';
import { P1SplSlider } from './p1splSlider';
import { P14SplParam } from './p14splParam';
import { P10Timeline } from './p10Timeline';
import { Fig3Curves } from './fig3Curves';
import { Fig5Heatmap } from './fig5Heatmap';
import { P2GeneralizeToggle } from './p2GeneralizeToggle';
import { P6ConclusionVote } from './p6ConclusionVote';
import { Table2Chart } from './table2Chart';

export interface WidgetProps {
  chapterId: string;
  moduleId: string;
}

export const widgetRegistry: Record<string, React.FC<WidgetProps>> = {};

// 统一生活主题（送货员）类比动画 + Hero 两侧
widgetRegistry['delivery-analogy'] = DeliveryAnalogy;
widgetRegistry['hero-old'] = HeroOld;
widgetRegistry['hero-new'] = HeroNew;
// 第 1–10 章交互模块（P 模式）
widgetRegistry['p2-realVsSim'] = P2RealVsSim;
widgetRegistry['p4-shortcomingMatch'] = P4ShortcomingMatch;
widgetRegistry['p5-softwareStack'] = P5SoftwareStack;
widgetRegistry['p9-uberShader'] = P9UberShader;
widgetRegistry['table1Chart'] = Table1Chart;
widgetRegistry['p3-assembleEpisode'] = P3AssembleEpisode;
widgetRegistry['p12-taskCards'] = P12TaskCards;
widgetRegistry['p1-sensorNav'] = P1SensorNav;
widgetRegistry['p2-sensorToggle'] = P2SensorToggle;
widgetRegistry['p1-splSlider'] = P1SplSlider;
widgetRegistry['p14-splParam'] = P14SplParam;
widgetRegistry['p10-timeline'] = P10Timeline;
widgetRegistry['fig3Curves'] = Fig3Curves;
widgetRegistry['fig5Heatmap'] = Fig5Heatmap;
widgetRegistry['p2-generalizeToggle'] = P2GeneralizeToggle;
widgetRegistry['p6-conclusionVote'] = P6ConclusionVote;
widgetRegistry['table2Chart'] = Table2Chart;
