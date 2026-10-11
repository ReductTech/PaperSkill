import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function SummaryCheckWidget(props: WidgetProps){return <YoLLaVAWidgets view='summary-check' chapterId={props.chapterId}/>;}
