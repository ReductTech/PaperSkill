import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function GenericCompareWidget(props: WidgetProps){return <YoLLaVAWidgets view='generic-compare' chapterId={props.chapterId}/>;}
