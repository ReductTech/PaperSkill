import React from 'react';
import { Cleanheads } from './labs';
export function WidgetCleanheads(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Cleanheads /></div>;}
