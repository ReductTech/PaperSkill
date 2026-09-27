import React from 'react';
import { Vocab } from './labs';
export function WidgetVocab(props:{chapterId:string}){return <div onKeyDown={e=>{if(['INPUT','SELECT','TEXTAREA'].includes((e.target as HTMLElement).tagName))e.stopPropagation();}}><Vocab /></div>;}
