import React from 'react';
import { Metric } from './labs';
export function WidgetMetric(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Metric /></div>;}
