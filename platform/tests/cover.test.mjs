import test from 'node:test';
import assert from 'node:assert/strict';
import {coverGeometry,normalizeCover,moveCover,buttonInk} from '../shared/cover.js';
test('cover always fills the surface without stretching or empty borders',()=>{
 for(const [w,h]of [[390,760],[320,680],[560,900]])for(const [iw,ih]of [[1600,900],[800,1600]])for(const zoom of [1,1.5,3]){
  const pose=normalizeCover({zoom,positionX:73,position:21});const g=coverGeometry(w,h,iw,ih,pose);
  assert(g.width>=w&&g.height>=h);assert(g.left<=0&&g.top<=0);assert(g.left+g.width>=w-.01);assert(g.top+g.height>=h-.01);assert(Math.abs(g.width/g.height-iw/ih)<.0001);
 }
});
test('drag, bounds, saved focus and non-numeric settings are normalized',()=>{
 const p=normalizeCover({positionX:50,position:50,zoom:2});const g=coverGeometry(390,760,1600,900,p);
 assert(moveCover(p,g,100,50).positionX<50);assert.equal(moveCover(p,g,100000,100000).positionX,0);
 assert.deepEqual(normalizeCover({zoom:NaN,position:NaN,align:'unsafe',buttonTheme:'unsafe'}),{positionX:50,position:50,zoom:1,align:'center',font:'roboto',buttonTheme:'white',buttonColor:'#153e32'});
 assert.equal(normalizeCover({zoom:100}).zoom,3);
});
test('custom colors reject injected CSS and choose readable black or white text',()=>{
 for(const color of ['red; background:url(https://invalid.example)','var(--secret)','</style>','#xyzxyz','#fff'])assert.equal(normalizeCover({buttonColor:color}).buttonColor,'#153e32');
 assert.equal(normalizeCover({buttonColor:'#AABBCC',buttonTheme:'custom'}).buttonColor,'#aabbcc');
 assert.equal(buttonInk('#ffffff'),'#000000');assert.equal(buttonInk('#000000'),'#ffffff');
 for(let n=0;n<0xffffff;n+=123457){const color='#'+n.toString(16).padStart(6,'0'),rgb=color.slice(1).match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const l=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];const ratio=buttonInk(color)==='#000000'?(l+.05)/.05:1.05/(l+.05);assert(ratio>=4.5);}
});
