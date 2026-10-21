import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function ResultsCardsWidget(props: WidgetProps){return <YoLLaVAWidgets view='results-cards' chapterId={props.chapterId}/>;}
