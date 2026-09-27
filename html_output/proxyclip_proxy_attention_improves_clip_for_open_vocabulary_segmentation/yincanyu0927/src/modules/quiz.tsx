import React from 'react';
import { Quiz } from './labs';
export function WidgetQuiz(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Quiz /></div>;}
