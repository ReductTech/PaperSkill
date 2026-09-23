import React from 'react'
export interface WidgetProps{chapterId:string;moduleId:string}
const W:React.FC<WidgetProps>=()=>null
export const widgetRegistry:Record<string,React.FC<WidgetProps>>={}
widgetRegistry['stack-lab']=W
widgetRegistry['claim-card']=W
widgetRegistry['tokenizer-lab']=W
widgetRegistry['raster-lab']=W
widgetRegistry['video-lab']=W
widgetRegistry['architecture-lab']=W
widgetRegistry['decode-lab']=W
widgetRegistry['evidence-lab']=W
widgetRegistry['alignment-lab']=W
widgetRegistry['limits-lab']=W
widgetRegistry['quiz-lab']=W
