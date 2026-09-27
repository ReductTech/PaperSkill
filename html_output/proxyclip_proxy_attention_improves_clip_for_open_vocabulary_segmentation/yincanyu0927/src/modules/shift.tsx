import React from 'react';
import { Shift } from './labs';
export function WidgetShift(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Shift /></div>;}
