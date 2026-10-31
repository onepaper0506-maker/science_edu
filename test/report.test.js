import test from 'node:test';
import assert from 'node:assert/strict';
import {reportHTML,normalizeReportFields,writtenQuestions} from '../src/report.js';
import {organs,recordAnswer} from '../src/content.js';
const saved=()=>({visited:[],answers:{},summary:{},summarySubmitted:false,...normalizeReportFields()});
test('reports include first/latest answer text and correctness without counting blanks as wrong',()=>{
 const data=saved(),q=organs[0].questions[0];
 data.answers=recordAnswer(data.answers,q.id,0);
 data.answers=recordAnswer(data.answers,q.id,q.answer);
 const html=reportHTML(data,'2026. 10. 31.');
 assert.ok(html.includes(q.choices[0]));
 assert.ok(html.includes(q.choices[q.answer]));
 assert.ok(html.includes('첫 응답 0개 정답 · 최근 응답 1개 정답'));
 assert.ok(html.includes('제출 횟수: 2회'));
 assert.ok(html.includes('미응답'));
 assert.equal((html.match(/class="report-question"/g)||[]).length,20);
 assert.equal((html.match(/class="report-written"/g)||[]).length,writtenQuestions.length);
});
test('student text is rendered literally; restored fields are bounded and type checked',()=>{
 const data=saved();
 data.student.name='<img src=x onerror=alert(1)>';
 data.written.surface='<script>alert(1)</script>\n근거를 설명합니다.';
 const html=reportHTML(data,'date');
 assert.ok(!html.includes('<script>'));
 assert.ok(!html.includes('<img'));
 assert.ok(html.includes('&lt;script&gt;'));
 assert.ok(html.includes('\n근거를 설명합니다.'));
 const fields=normalizeReportFields({student:{name:45},written:{surface:'가'.repeat(5000)}});
 assert.equal(fields.student.name,'');assert.equal(fields.written.surface.length,4000);
});
test('unfinished summary is marked unsubmitted and long written answers are not truncated in report',()=>{
 const data=saved();data.summary.route='작은창자';data.written.surface='근거 '.repeat(1000)+'마지막 문장';
 const html=reportHTML(data,'date');
 assert.ok(html.includes('미제출'));
 assert.ok(html.includes('마지막 문장'));
 assert.ok(html.includes('자동 채점하지 않습니다'));
});
