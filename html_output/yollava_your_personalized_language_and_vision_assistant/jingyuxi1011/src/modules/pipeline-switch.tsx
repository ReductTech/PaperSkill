import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function PipelineSwitchWidget(props: WidgetProps){return <YoLLaVAWidgets view='pipeline-switch' chapterId={props.chapterId}/>;}
