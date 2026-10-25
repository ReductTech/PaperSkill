import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function HeroPersonalizedWidget(props: WidgetProps){return <YoLLaVAWidgets view='hero-personalized' chapterId={props.chapterId}/>;}
