import React from 'react';
import { Warp } from './labs';
export function WidgetWarp(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Warp /></div>;}
