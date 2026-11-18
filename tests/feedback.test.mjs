import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('formulário mantém divulgação opcional e campos limitados',async()=>{const html=await readFile(new URL('../src/feedback.html',import.meta.url),'utf8');assert.match(html,/name="consent"/);assert.doesNotMatch(html,/name="consent"[^>]*(checked|required)/);assert.match(html,/maxlength="2000"/);assert.match(html,/id="success" hidden/);const js=await readFile(new URL('../src/feedback.mjs',import.meta.url),'utf8');assert.match(js,/result.received!==true/);assert.match(js,/request_id:requestId/);});
