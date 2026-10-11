import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function HeroGenericWidget(props: WidgetProps){return <YoLLaVAWidgets view='hero-generic' chapterId={props.chapterId}/>;}
