import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function FailureExplorerWidget(props: WidgetProps){return <YoLLaVAWidgets view='failure-explorer' chapterId={props.chapterId}/>;}
