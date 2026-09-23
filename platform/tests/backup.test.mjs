import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,rename,symlink} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const script=path.resolve('platform/scripts/verify-backup.mjs');
async function fixture(){
 const root=await mkdtemp(path.join(os.tmpdir(),'lumiq-backup-'));
 const database=Buffer.from('postgres custom dump fixture'),object=Buffer.from('private photo fixture');
 await writeFile(path.join(root,'database.dump'),database);
 await mkdir(path.join(root,'objects'));
 await writeFile(path.join(root,'objects/photo.webp'),object);
 const digest=data=>createHash('sha256').update(data).digest('hex');
 await writeFile(path.join(root,'manifest.json'),JSON.stringify({database:{file:'database.dump',size:database.length,sha256:digest(database)},objects:[{key:'event/photo.webp',file:'objects/photo.webp',size:object.length,sha256:digest(object)}]}));
 return root;
}
function verify(root){return spawnSync(process.execPath,[script,root],{encoding:'utf8'});}

test('backup verifier accepts matching dump and object checksums',async()=>{
 const root=await fixture();try{const result=verify(root);assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/database dump and 1 R2 objects/);}finally{await rm(root,{recursive:true,force:true});}
});

test('backup verifier rejects altered dump, mismatched object size and escaping paths',async t=>{
 const root=await fixture();t.after(()=>rm(root,{recursive:true,force:true}));
 await writeFile(path.join(root,'database.dump'),'altered');assert.notEqual(verify(root).status,0);
 await writeFile(path.join(root,'database.dump'),'postgres custom dump fixture');
 const manifest=JSON.parse(await readFile(path.join(root,'manifest.json'),'utf8'));
 manifest.objects[0].size+=1;await writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest));assert.match(verify(root).stderr,/Size mismatch/);
 manifest.objects[0].size-=1;manifest.objects[0].file='../outside.webp';await writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest));assert.match(verify(root).stderr,/escapes its directory/);
});

test('backup verifier rejects a manifest path escaping through a directory symlink',async t=>{
 const root=await fixture(),outside=await mkdtemp(path.join(os.tmpdir(),'lumiq-backup-outside-'));
 t.after(async()=>{await rm(root,{recursive:true,force:true});await rm(outside,{recursive:true,force:true});});
 const objects=path.join(root,'objects'),externalObjects=path.join(outside,'objects');
 await rename(objects,externalObjects);
 try{await symlink(externalObjects,objects,process.platform==='win32'?'junction':'dir');}
 catch(error){if(['EPERM','EACCES','ENOTSUP','EINVAL'].includes(error.code)){t.skip(`Directory symlinks are unavailable: ${error.code}`);return;}throw error;}
 const result=verify(root);assert.notEqual(result.status,0);assert.match(result.stderr,/escapes its directory/);
});
