import React from 'react';
import { Shape } from './labs';
export function WidgetShape(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Shape /></div>;}
