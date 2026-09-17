export const COVERS=[
 {id:'garden-gathering',name:'Garden gathering'},
 {id:'wedding-toast',name:'Wedding toast'},
 {id:'party',name:'Party'},
 {id:'coastal-celebration',name:'Coastal celebration'},
 {id:'city-rooftop',name:'City rooftop'}
].map(c=>({...c,url:`/assets/${c.id}.webp`}));
