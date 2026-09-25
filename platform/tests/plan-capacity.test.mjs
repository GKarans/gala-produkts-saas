import test from 'node:test';
import assert from 'node:assert/strict';
import {PLANS} from '../shared/plans.js';
test('approved prices and full photo-pair capacity stay consistent',()=>{
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].price),[1500,3000,7000]);
 assert.deepEqual(['single','gathering','studio'].map(id=>PLANS[id].photos),[500,500,1000]);
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].bytes/1024**2),[30,200,200,400]);
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].retentionDays),[7,14,14,30]);
 assert.deepEqual(['trial','single','gathering','studio'].map(id=>PLANS[id].shareDays),[4,7,7,14]);
 for(const plan of Object.values(PLANS)){
  assert(plan.bytes>0&&plan.photos>0);
  assert(plan.shareDays<=plan.retentionDays);
 }
});
