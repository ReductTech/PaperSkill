import React from 'react';
import { Heads } from './labs';
export function WidgetHeads(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Heads /></div>;}
