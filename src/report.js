import { organs, allQuestions, summaryItems, gradeSummary } from './content.js';

export const writtenQuestions = [
  {id:'surface',title:'씹기와 소화',prompt:'음식을 꼭꼭 씹으면 소화에 유리한 까닭을 소화액과 닿는 표면적과 관련지어 설명하세요.'},
  {id:'saliva-evidence',title:'침 실험의 증거',prompt:'녹말 용액에 증류수 또는 침 희석액을 넣어 같은 조건에서 반응시켰습니다. 침이 든 시험관에서 녹말 검출 반응이 나타나지 않고 당 검출 반응이 나타났다면, 침의 어떤 작용을 추론할 수 있나요? 관찰 결과를 근거로 설명하세요.'},
  {id:'protein-path',title:'단백질의 소화',prompt:'달걀 속 단백질이 아미노산으로 소화되기까지, 위와 작은창자에서 작용하는 소화효소와 변화를 설명하세요.'},
  {id:'bile-enzyme',title:'쓸개즙과 소화효소',prompt:'쓸개즙이 만들어지고 저장되며 작용하는 장소를 쓰고, 쓸개즙과 라이페이스가 지방에 작용하는 방식의 차이를 설명하세요.'},
  {id:'villi',title:'소화와 흡수',prompt:'소화와 흡수의 차이를 쓰고, 작은창자의 주름과 융털이 영양소 흡수에 유리한 까닭을 설명하세요.'},
  {id:'rice-glucose',title:'새로운 상황에 적용',prompt:'주먹밥의 녹말과 포도당 사탕의 포도당이 작은창자에서 흡수되기까지의 과정을 비교하세요.'}
];
export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function normalizeReportFields(raw = {}) {
  const text = (value, max) => typeof value === 'string' ? value.slice(0,max) : '';
  return {
    student:{className:text(raw.student?.className,60),number:text(raw.student?.number,20),name:text(raw.student?.name,60)},
    written:Object.fromEntries(writtenQuestions.map(q=>[q.id,text(raw.written?.[q.id],4000)]))
  };
}
const response = (q, answer) => Number.isInteger(answer) && q.choices[answer] !== undefined ? `${String.fromCharCode(65+answer)}. ${q.choices[answer]}` : '미응답';
export function reportHTML(saved, dateLabel) {
  const {student,written}=normalizeReportFields(saved);
  const esc=escapeHTML;
  const answered=allQuestions.filter(q=>saved.answers[q.id]);
  const firstCorrect=answered.filter(q=>saved.answers[q.id].first===q.answer).length;
  const latestCorrect=answered.filter(q=>saved.answers[q.id].latest===q.answer).length;
  const writtenCount=writtenQuestions.filter(q=>written[q.id].trim()).length;
  return `<article class="student-report" id="student-report" aria-label="교사 제출용 학습 보고서">
    <div class="report-title"><span>한입의 여행 · 소화와 흡수</span><h2>소화 탐험 학습 보고서</h2><p>작성 일시: ${esc(dateLabel)} (한국 시간)</p></div>
    <dl class="report-identity"><div><dt>학년·반</dt><dd>${esc(student.className)||'미기입'}</dd></div><div><dt>번호</dt><dd>${esc(student.number)||'미기입'}</dd></div><div><dt>이름</dt><dd>${esc(student.name)||'미기입'}</dd></div></dl>
    <p class="report-overview">선택형 ${answered.length}/${allQuestions.length}개 응답 · 첫 응답 ${firstCorrect}개 정답 · 최근 응답 ${latestCorrect}개 정답 · 주관식 ${writtenCount}/${writtenQuestions.length}개 작성</p>
    <p class="report-disclosure">선택형은 제출한 첫 응답과 최근 응답을 구분합니다. 미응답은 오답과 별도입니다. 해설을 보며 학습하고 재도전한 기록이며, 주관식은 교사가 평가합니다.</p>
    <section class="report-part"><h3>1. 관찰한 소화 과정</h3><table><thead><tr><th scope="col">기관</th><th scope="col">열어 본 과정</th></tr></thead><tbody>${organs.map(o=>`<tr><th scope="row">${o.name}</th><td>${o.lessons.filter(l=>saved.visited.includes(`${o.id}/${l.id}`)).map(l=>l.title).join(' · ')||'아직 열어 보지 않음'}</td></tr>`).join('')}</tbody></table></section>
    <section class="report-part"><h3>2. 선택형 응답 상세</h3><p>학생이 선택한 보기의 내용과 정답을 함께 기록합니다.</p>${organs.map(o=>`<section class="report-organ"><h4>${o.name}</h4>${o.questions.map((q,i)=>{const a=saved.answers[q.id];return `<div class="report-question"><h5>${i+1}. ${q.prompt}</h5><dl><div><dt>첫 응답</dt><dd>${esc(response(q,a?.first))}${a?` <b>(${a.first===q.answer?'정답':'오답'})</b>`:''}</dd></div><div><dt>최근 응답</dt><dd>${esc(response(q,a?.latest))}${a?` <b>(${a.latest===q.answer?'정답':'오답'})</b>`:''}</dd></div><div><dt>정답</dt><dd>${esc(response(q,q.answer))}</dd></div></dl><p class="report-explanation">${q.explanation}</p><p class="attempt-count">제출 횟수: ${a?.attempts||0}회</p></div>`;}).join('')}</section>`).join('')}</section>
    <section class="report-part"><h3>3. 주관식 답변</h3><p>자동 채점하지 않습니다. 학생이 쓴 답변 전체를 기록합니다.</p>${writtenQuestions.map((q,i)=>`<section class="report-written"><h4>${i+1}. ${q.title}</h4><p>${q.prompt}</p><div class="written-response">${esc(written[q.id].trim())||'미작성'}</div><div class="teacher-space"><strong>교사 평가</strong><span>점수: __________</span><p>의견: __________________________________________________________</p></div></section>`).join('')}</section>
    <section class="report-part"><h3>4. 나만의 정리표</h3><p>${saved.summarySubmitted?'제출한 정리표의 채점 결과입니다.':'아직 제출하지 않은 작성 중 답변입니다. 아래 내용은 채점하지 않습니다.'}</p><table class="report-summary"><thead><tr><th scope="col">항목</th><th scope="col">학생의 답</th><th scope="col">정답</th><th scope="col">결과</th></tr></thead><tbody>${gradeSummary(saved.summary).map(s=>`<tr><th scope="row">${s.label}</th><td>${esc(s.selected)||'미응답'}</td><td>${s.answer}</td><td>${!saved.summarySubmitted?'미제출':!s.selected?'미응답':s.correct?'정답':'오답'}</td></tr>`).join('')}</tbody></table></section>
    <section class="report-part teacher-final"><h3>교사 종합 평가</h3><p>개념의 정확성 · 관찰 근거의 활용 · 설명의 연결성을 바탕으로 평가하세요.</p><div>평가 의견: __________________________________________________________</div><div>____________________________________________________________________</div><div>평가일: ____________________　교사: ____________________</div></section>
  </article>`;
}
