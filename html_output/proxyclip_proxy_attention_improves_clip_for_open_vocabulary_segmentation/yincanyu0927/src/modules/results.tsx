import React from 'react';
import { Results } from './labs';
export function WidgetResults(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Results /></div>;}
