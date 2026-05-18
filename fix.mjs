import {readFileSync,writeFileSync} from 'fs';
let c=readFileSync('src/斗傩大陆1/正则/[美化]开局面板.txt','utf8');
c=c.replace(/^﻿/,'').replace(/^```html\n/,'').replace(/\n```\s*$/,'');
writeFileSync('src/斗傩大陆1/正则/[美化]开局面板.txt',c,'utf8');
const l=c.split('\n');
console.log('lines:',l.length,'first:',l[0].slice(0,30),'last:',l[l.length-1].slice(0,30));
