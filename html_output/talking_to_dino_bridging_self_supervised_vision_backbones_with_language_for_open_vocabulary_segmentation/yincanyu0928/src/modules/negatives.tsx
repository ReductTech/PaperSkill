import React from 'react';
import { Negatives } from './labs';
export function WidgetNegatives(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Negatives /></div>;}
