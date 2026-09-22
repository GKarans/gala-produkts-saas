export const DESIGN_FONTS=[
 {id:'roboto',label:'Roboto',family:'Roboto'},
 {id:'open-sans',label:'Open Sans',family:'Open Sans'},
 {id:'noto-sans',label:'Noto Sans',family:'Noto Sans'},
 {id:'montserrat',label:'Montserrat',family:'Montserrat'},
 {id:'poppins',label:'Poppins',family:'Poppins'},
 {id:'lato',label:'Lato',family:'Lato'},
 {id:'raleway',label:'Raleway',family:'Raleway'},
 {id:'oswald',label:'Oswald',family:'Oswald'},
 {id:'playfair-display',label:'Playfair Display',family:'Playfair Display'},
 {id:'merriweather',label:'Merriweather',family:'Merriweather'}
];

export const FONT_IDS=DESIGN_FONTS.map(font=>font.id);
export const FONT_FAMILIES=Object.fromEntries(DESIGN_FONTS.map(font=>[font.id,`'${font.family}', sans-serif`]));
export const normalizeFont=value=>FONT_IDS.includes(value)?value:value==='serif'?'playfair-display':'roboto';
