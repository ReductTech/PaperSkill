import React from 'react';
import { Nce } from './labs';
export function WidgetNce(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Nce /></div>;}
