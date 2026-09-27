import React from 'react';
import { Vector } from './labs';
export function WidgetVector(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Vector /></div>;}
