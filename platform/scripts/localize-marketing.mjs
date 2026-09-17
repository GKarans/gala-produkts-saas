import fs from 'node:fs';
import {parse} from 'acorn';
const file=new URL('../public/marketing.js',import.meta.url);
let source=fs.readFileSync(file,'utf8');
const edits=[];
function walk(node,parent){
 if(node.type==='TemplateLiteral'&&parent?.type!=='TaggedTemplateExpression')edits.push({start:node.start,end:node.start,value:'html'});
 if(node.type==='Literal'&&typeof node.value==='string'&&/<[a-z][\s\S]*>/i.test(node.value)&&parent?.type!=='ArrayExpression')edits.push({start:node.start,end:node.end,value:`html([${JSON.stringify(node.value)}])`});
 for(const [key,value] of Object.entries(node)){
  if(key==='start'||key==='end')continue;
  if(Array.isArray(value)){for(const child of value)if(child?.type)walk(child,node);}
  else if(value?.type)walk(value,node);
 }
}
walk(parse(source,{ecmaVersion:'latest',sourceType:'module'}));
for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.value+source.slice(edit.end);
source=source.replace('import {t,language,locale,languageSelect}', 'import {html,t,language,locale,languageSelect}');
fs.writeFileSync(file,source);
