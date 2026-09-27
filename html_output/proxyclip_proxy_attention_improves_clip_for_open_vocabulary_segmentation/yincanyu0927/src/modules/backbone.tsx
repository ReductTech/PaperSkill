import React from 'react';
import { Backbone } from './labs';
export function WidgetBackbone(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Backbone /></div>;}
