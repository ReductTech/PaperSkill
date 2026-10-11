import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function OverviewMapWidget(props: WidgetProps){return <YoLLaVAWidgets view='overview-map' chapterId={props.chapterId}/>;}
