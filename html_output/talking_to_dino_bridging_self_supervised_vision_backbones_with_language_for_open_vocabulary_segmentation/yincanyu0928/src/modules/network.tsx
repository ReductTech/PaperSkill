import React from 'react';
import { Network } from './labs';
export function WidgetNetwork(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Network /></div>;}
