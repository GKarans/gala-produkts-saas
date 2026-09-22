import test from 'node:test';
import assert from 'node:assert/strict';
import {billingService} from '../server/billing.mjs';

test('paid checkout is disabled without creating an order when no Stripe test config exists',async()=>{
 const before=Object.fromEntries(['PLATFORM_STRIPE_SECRET','PLATFORM_STRIPE_PRICE_SINGLE'].map(key=>[key,process.env[key]]));
 delete process.env.PLATFORM_STRIPE_SECRET;
 delete process.env.PLATFORM_STRIPE_PRICE_SINGLE;
 let databaseCalls=0;
 try{
  const billing=billingService({query:async()=>{databaseCalls++;return{rows:[]};}},{origin:'https://lumiq.cam',local:false});
  await assert.rejects(billing.checkout({id:'account-1'},{plan:'single'}),{status:503});
  assert.equal(databaseCalls,0);
 }finally{
  for(const [key,value] of Object.entries(before))if(value===undefined)delete process.env[key];else process.env[key]=value;
 }
});
