import React from 'react';
import { Background } from './labs';
export function WidgetBackground(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Background /></div>;}
