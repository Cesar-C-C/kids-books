import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {embeddedIdentity,verifyFilm} from '../tools/qa_native_film.mjs';
test('embedded bytes and quote boundaries are exact',()=>{
  const raw=Buffer.from('exact raw payload');
  const expected={bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')};
  for(const quote of ['"',"'"])assert.deepEqual(embeddedIdentity(quote+'data:video/mp4;base64,'+raw.toString('base64')+quote,'video/mp4'),expected);
});
test('base64 chunk boundary preserves decoded SHA',()=>{
  const raw=Buffer.alloc(100000,17);
  assert.deepEqual(embeddedIdentity('"data:audio/mp4;base64,'+raw.toString('base64')+'"','audio/mp4'),{bytes:raw.length,sha256:createHash('sha256').update(raw).digest('hex')});
});
test('missing MIME, invalid bytes and missing termination fail',()=>{
  assert.throws(()=>embeddedIdentity('"data:image/jpeg;base64,YQ=="','video/mp4'));
  assert.throws(()=>embeddedIdentity('"data:video/mp4;base64,a!"','video/mp4'));
  assert.throws(()=>embeddedIdentity('data:video/mp4;base64,YQ==','video/mp4'));
});
test('missing real film package is never N/A or PASS',async()=>{
  await assert.rejects(verifyFilm(new URL('../',import.meta.url).pathname+'missing-fixture-root'));
});
