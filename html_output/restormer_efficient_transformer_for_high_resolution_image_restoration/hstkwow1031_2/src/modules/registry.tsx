import React from 'react';
import {RestCover,Complexity,LocalContext,ChannelAttention,AttentionScale,GatedFeedforward} from './foundations';
import {Multiscale,ResidualRestore,ProgressiveTraining,GlobalBoundary} from './architecture';
import {MotionResults,TaskResults,Ablations,QualityCost} from './evidence';
export interface WidgetProps {chapterId:string;moduleId:string;}
export const widgetRegistry:Record<string,React.FC<WidgetProps>>={
'rest-cover':RestCover,'rest-complexity':Complexity,'rest-local':LocalContext,'rest-channel':ChannelAttention,'rest-alpha':AttentionScale,'rest-gdfn':GatedFeedforward,
'rest-scale':Multiscale,'rest-residual':ResidualRestore,'rest-training':ProgressiveTraining,'rest-boundary':GlobalBoundary,
'rest-motion':MotionResults,'rest-tasks':TaskResults,'rest-ablations':Ablations,'rest-tradeoff':QualityCost,
};
