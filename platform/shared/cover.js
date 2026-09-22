import {normalizeFont} from './fonts.js';
const clamp=(value,min,max,fallback)=>{const n=Number(value);return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback;};
export function normalizeCover(value={}){
 return{positionX:clamp(value.positionX,0,100,50),position:clamp(value.position,0,100,50),zoom:Math.round(clamp(value.zoom,1,3,1)*100)/100,align:['left','center','right'].includes(value.align)?value.align:'center',font:normalizeFont(value.font),buttonTheme:['white','forest','rose','custom'].includes(value.buttonTheme)?value.buttonTheme:'white',buttonColor:/^#[0-9a-f]{6}$/i.test(value.buttonColor||'')?value.buttonColor.toLowerCase():'#153e32'};
}
export function coverGeometry(width,height,imageWidth,imageHeight,value={}){
 const pose=normalizeCover(value),scale=Math.max(width/imageWidth,height/imageHeight)*pose.zoom;
 const w=imageWidth*scale,h=imageHeight*scale;
 return{width:w,height:h,left:(width-w)*pose.positionX/100,top:(height-h)*pose.position/100,overflowX:w-width,overflowY:h-height};
}
export function moveCover(value,geometry,dx,dy){
 return normalizeCover({...value,positionX:geometry.overflowX>.1?value.positionX-dx/geometry.overflowX*100:value.positionX,position:geometry.overflowY>.1?value.position-dy/geometry.overflowY*100:value.position});
}
export function buttonInk(color){const rgb=color.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);const light=.2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];return (light+.05)/.05>=1.05/(light+.05)?'#000000':'#ffffff';}
