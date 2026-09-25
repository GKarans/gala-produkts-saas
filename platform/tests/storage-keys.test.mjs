import test from 'node:test';
import assert from 'node:assert/strict';
import {eventFolder,organizerFolder,organizerLabel,photographerFolder,photoObjectName,shortStorageId} from '../shared/storage-keys.js';

test('R2 keys use readable names, six-character IDs and the capture timestamp',()=>{
 const accountId='12345678-1234-4234-8234-123456abcdef',eventId='aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeabcdef',photoId='abcdef12-3456-4789-abcd-ef0123456789';
 assert.equal(organizerLabel('Guntars Kārns',{account_type:'business',company_name:'SIA Lumiq'}),'SIA Lumiq');
 assert.equal(organizerFolder(organizerLabel('Guntars Kārns',{}),accountId),'guntars-karns-abcdef');
 assert.match(organizerFolder('SIA Lumiq',accountId),/^sia-lumiq-[0-9a-f]{6}$/);
 assert.match(eventFolder('Balle',eventId),/^balle-[0-9a-f]{6}$/);
 assert.equal(photographerFolder('Guntars',photoId),'guntars-456789');
 assert.notEqual(photographerFolder('Same name',photoId),photographerFolder('Same name','12345678-1234-4234-8234-123456abcdef'));
 assert.equal(shortStorageId(photoId),'456789');
 assert.equal(photoObjectName('Guntars Kārns',new Date('2026-09-24T10:15:30.000Z'),photoId),'guntars-karns-20260924T101530Z-456789.webp');
 assert.throws(()=>shortStorageId('not-an-id'),/Invalid storage identifier/);
});
