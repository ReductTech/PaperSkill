import React from 'react';
import { Cost } from './labs';
export function WidgetCost(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Cost /></div>;}
