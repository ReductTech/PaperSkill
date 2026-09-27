import React from 'react';
import { Analogy } from './labs';
export function WidgetAnalogy(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Analogy {...props}/></div>;}
