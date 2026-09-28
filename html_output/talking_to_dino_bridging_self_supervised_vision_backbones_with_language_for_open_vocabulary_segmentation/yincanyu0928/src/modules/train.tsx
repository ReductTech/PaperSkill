import React from 'react';
import { Train } from './labs';
export function WidgetTrain(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Train /></div>;}
