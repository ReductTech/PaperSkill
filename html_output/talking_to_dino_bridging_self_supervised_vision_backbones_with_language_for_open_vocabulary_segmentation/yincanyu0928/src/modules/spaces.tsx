import React from 'react';
import { Spaces } from './labs';
export function WidgetSpaces(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Spaces /></div>;}
