import React from 'react';
import { Pipeline } from './labs';
export function WidgetPipeline(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Pipeline /></div>;}
