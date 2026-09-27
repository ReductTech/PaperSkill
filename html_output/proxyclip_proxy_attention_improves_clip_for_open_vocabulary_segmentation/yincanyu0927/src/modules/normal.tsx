import React from 'react';
import { Normal } from './labs';
export function WidgetNormal(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Normal /></div>;}
