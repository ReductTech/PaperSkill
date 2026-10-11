import React from 'react';
import { YoLLaVAWidgets } from './yollava-kit';
import type { WidgetProps } from './registry';
export function ConversationSwitchWidget(props: WidgetProps){return <YoLLaVAWidgets view='conversation-switch' chapterId={props.chapterId}/>;}
