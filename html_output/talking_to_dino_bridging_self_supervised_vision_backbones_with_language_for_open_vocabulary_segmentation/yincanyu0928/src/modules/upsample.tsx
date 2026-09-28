import React from 'react';
import { Upsample } from './labs';
export function WidgetUpsample(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Upsample /></div>;}
