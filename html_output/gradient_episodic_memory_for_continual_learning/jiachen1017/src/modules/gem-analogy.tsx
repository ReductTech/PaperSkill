import React from 'react';
import type { WidgetProps } from './registry';
import { Calligraphy } from './gemKit';
export const GemAnalogy:React.FC<WidgetProps>=({chapterId})=><Calligraphy action={Number(chapterId.replace('chap-',''))-1}/>;
