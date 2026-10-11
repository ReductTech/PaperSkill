import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function AlbumAnalogyWidget(props: WidgetProps){return <YoLLaVAWidgets view='album-analogy' chapterId={props.chapterId}/>;}
