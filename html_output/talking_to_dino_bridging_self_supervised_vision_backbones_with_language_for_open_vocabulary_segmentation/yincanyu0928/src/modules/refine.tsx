import React from 'react';
import { Refine } from './labs';
export function WidgetRefine(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Refine /></div>;}
