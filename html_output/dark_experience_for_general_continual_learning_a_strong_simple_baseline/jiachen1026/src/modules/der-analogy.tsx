import React from 'react';
import { PhotoScene } from './der-scenes';
import type { WidgetProps } from './registry';
export function DerAnalogy({chapterId}:WidgetProps){const n=Number(chapterId.replace('chap-',''));return <PhotoScene scene={Number.isFinite(n)?n:1}/>;}
