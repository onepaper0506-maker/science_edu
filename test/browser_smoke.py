import json,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
Path("/tmp/digestion-validation").mkdir(parents=True,exist_ok=True)
from playwright.sync_api import sync_playwright
payload=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {organs,summaryItems} from " + json.dumps((ROOT/"src/content.js").as_uri()) + "; console.log(JSON.stringify({organs,summaryItems}));"],text=True))
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1100},device_scale_factor=1)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/')
 page.evaluate('localStorage.clear()')
 page.reload()
 assert page.title()=='한입의 여행 · 소화 탐험실'
 assert page.locator('.organ-chip').count()==10
 assert page.locator('.empty-stage').is_visible()
 page.screenshot(path='/tmp/digestion-validation/desktop-start.png',full_page=True)
 # Diagram selection is genuinely keyboard operable.
 page.locator('g[data-organ="stomach"]').focus()
 page.keyboard.press('Enter')
 assert '위' in page.locator('#organ-heading').inner_text()
 page.locator('[data-lesson="pepsin"]').click()
 assert '작은 단백질 조각' in page.locator('.simulation').inner_text()
 page.get_by_role('button',name='모형 일시 정지',exact=True).click()
 assert 'paused' in page.locator('#simulation').get_attribute('class')
 page.get_by_role('button',name='모형 재생',exact=True).click()
 assert 'paused' not in page.locator('#simulation').get_attribute('class')
 page.get_by_role('button',name='↺ 다시 보기',exact=True).click()
 # Wrong then correct; preserve first answer after reload.
 page.locator('.detail-tabs [data-tab="quiz"]').click()
 page.locator('input[name="stomach-1"][value="0"]').check()
 page.locator('form[data-question="stomach-1"] button[type="submit"]').click()
 assert page.locator('#feedback-stomach-1.wrong').is_visible()
 page.locator('#feedback-stomach-1 [data-review]').click()
 assert page.locator('[data-lesson="pepsin"]').get_attribute('aria-pressed')=='true'
 page.locator('.detail-tabs [data-tab="quiz"]').click()
 page.locator('[data-retry="stomach-1"]').click()
 page.locator('input[name="stomach-1"][value="1"]').check()
 page.locator('form[data-question="stomach-1"] button[type="submit"]').click()
 assert '첫 응답 오답' in page.locator('#feedback-stomach-1').inner_text()
 print('PASS keyboard anatomy, playback and wrong→review→correct retry')
 # Exercise every process and both questions in all ten organs.
 lessons=0
 for organ in payload['organs']:
  page.locator(f'.organ-chip[data-organ="{organ["id"]}"]').click()
  assert organ['name'] in page.locator('#organ-heading').inner_text()
  for lesson in organ['lessons']:
   page.locator(f'[data-lesson="{lesson["id"]}"]').click()
   assert page.locator('.simulation svg').count()==1
   assert lesson['focus'] in page.locator('.observation-heading').inner_text()
   lessons+=1
  page.locator('.detail-tabs [data-tab="quiz"]').click()
  for q in organ['questions']:
   if page.locator(f'#feedback-{q["id"]}').count():continue
   page.locator(f'input[name="{q["id"]}"][value="{q["answer"]}"]').check()
   page.locator(f'form[data-question="{q["id"]}"] button[type="submit"]').click()
   assert page.locator(f'#feedback-{q["id"]}.right').is_visible()
 print(f'PASS all {lessons} process views and 20 questions')
 page.locator('.nav-btn[data-view="results"]').click()
 assert '17 / 17' in page.locator('.stats-grid').inner_text().replace('\n',' ')
 assert page.locator('.status-tag.done').count()==10
 data=page.evaluate("JSON.parse(localStorage.getItem('science-edu-digestion-v1'))")
 assert data['answers']['stomach-1']=={'first':0,'latest':1,'attempts':2}
 page.reload()
 page.locator('.nav-btn[data-view="results"]').click()
 assert page.locator('.status-tag.done').count()==10
 assert '19' in page.locator('.stats-grid article').nth(1).inner_text()
 # Summary blank validation, wrong feedback, then a corrected submission.
 page.locator('.nav-btn[data-view="summary"]').click()
 page.locator('#summary-form button[type="submit"]').click()
 assert page.locator('#summary-route').evaluate('(e)=>e.validity.valueMissing')
 for item in payload['summaryItems']:
  page.locator('#summary-'+item['id']).select_option(label=item['answer'])
 page.locator('#summary-fat').select_option(index=2)
 page.locator('#summary-form button[type="submit"]').click()
 assert page.locator('.summary-feedback.wrong').count()==1
 assert '9개' in page.locator('.summary-bottom').inner_text()
 page.locator('[data-action="summary-retry"]').click()
 page.locator('#summary-fat').select_option(label=payload['summaryItems'][5]['answer'])
 page.locator('#summary-form button[type="submit"]').click()
 assert page.locator('.summary-feedback.right').count()==10
 page.reload()
 page.locator('.nav-btn[data-view="summary"]').click()
 assert page.locator('.summary-feedback.right').count()==10
 print('PASS first response persistence, complete progress, summary validation, grading and reload')
 page.locator('.nav-btn[data-view="explore"]').click()
 page.locator('.organ-chip[data-organ="small"]').click()
 page.locator('[data-lesson="villi"]').click()
 page.screenshot(path='/tmp/digestion-validation/desktop-villi.png',full_page=True)
 # Mobile overflow and dialog behavior.
 page.set_viewport_size({'width':390,'height':844})
 for view in ['explore','summary','results']:
  page.locator(f'.nav-btn[data-view="{view}"]').click()
  assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'),view
 page.screenshot(path='/tmp/digestion-validation/mobile-results.png',full_page=True)
 page.locator('[data-action="help"]').click()
 assert page.locator('#help-dialog').is_visible()
 page.keyboard.press('Escape')
 assert not page.locator('#help-dialog').is_visible()
 page.locator('[data-action="reset"]').click()
 page.locator('[data-action="cancel-reset"]').click()
 assert page.locator('.status-tag.done').count()==10
 page.locator('[data-action="reset"]').click()
 page.locator('[data-action="confirm-reset"]').click()
 assert page.locator('.status-tag.done').count()==0
 assert page.evaluate("JSON.parse(localStorage.getItem('science-edu-digestion-v1')).visited.length")==0
 # Invalid stored data must not crash or inject HTML.
 page.evaluate("localStorage.setItem('science-edu-digestion-v1', JSON.stringify({visited:['not/a/lesson'],answers:{'mouth-1':{first:999,latest:999,attempts:-1}},summary:{route:'<img onerror=alert(1)>'},summarySubmitted:true}))")
 page.reload()
 assert page.locator('.progress-card strong').inner_text().startswith('0')
 page.locator('.organ-chip[data-organ="esophagus"]').click()
 page.locator('[data-lesson="move"]').click()
 page.emulate_media(reduced_motion='reduce')
 assert page.locator('.traveler').evaluate('(e)=>getComputedStyle(e).animationName')=='none'
 assert not errors,errors
 print('PASS 390px responsive layouts, dialogs, reset, malformed storage and reduced motion; no JavaScript errors')
 browser.close()
