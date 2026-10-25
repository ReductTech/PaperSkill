import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function TrainingObjectiveWidget(props: WidgetProps){return <YoLLaVAWidgets view='training-objective' chapterId={props.chapterId}/>;}
