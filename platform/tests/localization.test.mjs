import test from 'node:test';
import assert from 'node:assert/strict';
import {html,t} from '../public/i18n.js';

test('Latvian source templates preserve interpolated customer content',()=>{
 const previous=globalThis.localStorage;
 globalThis.localStorage={getItem:()=> 'lv'};
 try{
  assert.equal(t('Create your first event'),'Izveidot pirmo pasākumu');
  assert.equal(t('Designed for private gatherings.'),'Radīts privātiem pasākumiem.');
  assert.match(t('Depending on applicable law, you may request access, correction, erasure, restriction or portability, object to certain processing, withdraw consent where relied upon and complain to your supervisory authority. Guests should first contact their organizer about event photos; the operator must also provide a working privacy contact. Requests may require proportionate identity verification. No fee or response-time promise overrides applicable law.'),/^Atbilstoši piemērojamajiem/);
  assert.equal(t('Google sign-in activates in staging after the provider is connected.'),'Google pieslēgšanās aktivizēsies testa vidē pēc pakalpojuma pieslēgšanas.');
  const customerTitle='Your people.';
  assert.equal(html`<h1>${customerTitle}</h1><p>Your people.</p>`, '<h1>Your people.</h1><p>Tavi cilvēki.</p>');
  assert.equal(html`<button aria-label="Next photo">Next photo</button>`, '<button aria-label="Nākamais foto">Nākamais foto</button>');
 }finally{globalThis.localStorage=previous;}
});

test('English source templates stay unchanged',()=>{
 const previous=globalThis.localStorage;
 globalThis.localStorage={getItem:()=> 'en'};
 try{assert.equal(html`<p>Your people.</p>`, '<p>Your people.</p>');}
 finally{globalThis.localStorage=previous;}
});
