import React from 'react';
import { Affinity } from './labs';
export function WidgetAffinity(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Affinity /></div>;}
