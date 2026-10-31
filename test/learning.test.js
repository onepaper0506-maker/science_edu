import test from 'node:test';
import assert from 'node:assert/strict';
import {organs, allQuestions, summaryItems, recordAnswer, organResult, gradeSummary} from '../src/content.js';
import {anatomy,processDiagram} from '../src/graphics.js';

test('all ten organs have distinct, reachable lessons and valid assessment links',()=>{
 assert.equal(organs.length,10);
 assert.equal(new Set(organs.map(o=>o.id)).size,10);
 assert.equal(new Set(allQuestions.map(q=>q.id)).size,allQuestions.length);
 for(const o of organs){
  assert.ok(anatomy(o.id).includes(`data-organ="${o.id}"`));
  assert.equal(o.questions.length,2);
  assert.equal(new Set(o.lessons.map(l=>l.id)).size,o.lessons.length);
  for(const q of o.questions){assert.ok(o.lessons.some(l=>l.id===q.review));assert.ok(q.answer>=0&&q.answer<q.choices.length);}
  for(const l of o.lessons){const svg=processDiagram(l);assert.ok(svg.includes('role="img"'));assert.ok(!svg.includes('undefined'));assert.ok(!svg.includes('과정을 선택해 보세요'));}
 }
});
test('a corrected retry preserves the first response and advances only the latest score',()=>{
 const o=organs[0],q=o.questions[0],wrong=(q.answer+1)%q.choices.length;
 let answers=recordAnswer({},q.id,wrong);
 assert.deepEqual(organResult(o,answers),{total:2,answered:1,firstCorrect:0,latestCorrect:0});
 answers=recordAnswer(answers,q.id,q.answer);
 assert.deepEqual(answers[q.id],{first:wrong,latest:q.answer,attempts:2});
 assert.deepEqual(organResult(o,answers),{total:2,answered:1,firstCorrect:0,latestCorrect:1});
 assert.equal(recordAnswer(answers,q.id,-1),answers);
 assert.equal(recordAnswer(answers,'unknown',0),answers);
});
test('unanswered items are not marked as answered and all valid answers score correctly',()=>{
 assert.deepEqual(organResult(organs[0],{}),{total:2,answered:0,firstCorrect:0,latestCorrect:0});
 const answers=allQuestions.reduce((a,q)=>recordAnswer(a,q.id,q.answer),{});
 for(const o of organs){const r=organResult(o,answers);assert.equal(r.answered,2);assert.equal(r.latestCorrect,2);}
});
test('summary accepts correct concepts and rejects blanks and incorrect connections',()=>{
 for(const i of summaryItems){assert.ok(i.options.includes(i.answer));assert.ok(organs.some(o=>o.id===i.organ));}
 assert.equal(gradeSummary({}).filter(g=>g.correct).length,0);
 const valid=Object.fromEntries(summaryItems.map(i=>[i.id,i.answer]));
 assert.equal(gradeSummary(valid).filter(g=>g.correct).length,10);
 valid.fat='포도당과 엿당';
 assert.equal(gradeSummary(valid).filter(g=>g.correct).length,9);
});
