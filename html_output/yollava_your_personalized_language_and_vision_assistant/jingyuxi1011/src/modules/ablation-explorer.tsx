import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function AblationExplorerWidget(props: WidgetProps){return <YoLLaVAWidgets view='ablation-explorer' chapterId={props.chapterId}/>;}
