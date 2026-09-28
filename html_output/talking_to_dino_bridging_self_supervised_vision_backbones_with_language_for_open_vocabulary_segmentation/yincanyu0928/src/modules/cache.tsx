import React from 'react';
import { Cache } from './labs';
export function WidgetCache(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Cache /></div>;}
