import React from 'react';
import { Ablation } from './labs';
export function WidgetAblation(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Ablation /></div>;}
