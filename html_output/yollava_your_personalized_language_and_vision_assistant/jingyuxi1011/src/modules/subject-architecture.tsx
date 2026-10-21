import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function SubjectArchitectureWidget(props: WidgetProps){return <YoLLaVAWidgets view='subject-architecture' chapterId={props.chapterId}/>;}
