import React from 'react';
import { Resolution } from './labs';
export function WidgetResolution(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Resolution /></div>;}
