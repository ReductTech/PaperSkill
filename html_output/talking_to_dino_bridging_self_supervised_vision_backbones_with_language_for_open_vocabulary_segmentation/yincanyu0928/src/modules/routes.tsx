import React from 'react';
import { Routes } from './labs';
export function WidgetRoutes(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Routes /></div>;}
