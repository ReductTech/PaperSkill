import React from 'react';
import { Paint } from './labs';
export function WidgetPaint(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Paint /></div>;}
