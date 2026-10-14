import {robotStory} from './robotStory';
import type {TutorialChapter} from '../types';

// The workshop controls and robot visualization share the saved chapter state.
export const tutorial:TutorialChapter[]=[
 {kind:'chapter',id:'act-0',story:robotStory[0],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-1',story:robotStory[1],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-2',story:robotStory[2],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-3',story:robotStory[3],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-4',story:robotStory[4],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-5',story:robotStory[5],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-6',story:robotStory[6],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-7',story:robotStory[7],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-8',story:robotStory[8],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
 {kind:'chapter',id:'act-9',story:robotStory[9],modules:[{kind:'module',componentId:'workshop',interaction:'direct'},{kind:'module',componentId:'robot',interaction:'synchronized'}]},
];
