import React from 'react';
import { Classify } from './labs';
export function WidgetClassify(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Classify /></div>;}
