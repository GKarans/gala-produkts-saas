import test from 'node:test';
import assert from 'node:assert/strict';
import {PLANS} from '../shared/plans.js';
test('approved prices and full photo-pair capacity stay consistent',()=>{
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].price),[1500,2500,5900]);
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].photos),[500,500,1000]);
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].retentionDays),[30,30,60]);
 for(const plan of Object.values(PLANS)){
  assert.equal(plan.bytes,plan.photos*7*1024**2);
  assert(plan.shareDays<=plan.retentionDays);
 }
});
