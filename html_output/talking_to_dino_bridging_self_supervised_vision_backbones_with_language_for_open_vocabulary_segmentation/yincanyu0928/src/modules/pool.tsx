import React from 'react';
import { Pool } from './labs';
export function WidgetPool(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Pool /></div>;}
