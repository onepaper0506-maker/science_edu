"""Run with the app served on 127.0.0.1:8000; requires Playwright and Chromium."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import pymupdf

OUT=Path('/tmp/digestion-report-validation')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':1000})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('http://127.0.0.1:8000/')
    page.locator('.detail-tabs [data-tab="quiz"]').click()
    page.locator('input[name="mouth-1"][value="0"]').check()
    page.locator('form[data-question="mouth-1"] button[type="submit"]').click()
    page.locator('[data-retry="mouth-1"]').click()
    page.locator('input[name="mouth-1"][value="1"]').check()
    page.locator('form[data-question="mouth-1"] button[type="submit"]').click()
    page.locator('.nav-btn[data-view="report"]').click()
    page.locator('#student-className').fill('2학년 3반')
    page.locator('#student-number').fill('12')
    page.locator('#student-name').fill('테스트 학생')
    long_answer='표면적이 넓어져 소화액과 닿는 면적이 증가합니다.\n'*65+'END-OF-WRITTEN-ANSWER'
    page.locator('#written-surface').fill(long_answer)
    page.locator('#written-saliva-evidence').fill('<img src=x onerror=alert(1)>\n침이 녹말을 당으로 분해했다고 추론합니다.')
    page.locator('#written-rice-glucose').fill('녹말은 소화가 필요하고 포도당은 더 분해하지 않고 흡수됩니다.')
    assert page.locator('#student-report img').count()==0
    assert 'END-OF-WRITTEN-ANSWER' in page.locator('#student-report').inner_text()
    assert '첫 응답 0개 정답 · 최근 응답 1개 정답' in page.locator('#student-report').inner_text()
    assert page.locator('.report-question').count()==20
    assert page.locator('.report-written').count()==6
    page.reload()
    page.locator('.nav-btn[data-view="report"]').click()
    assert page.locator('#student-name').input_value()=='테스트 학생'
    assert page.locator('#written-surface').input_value()==long_answer
    page.evaluate('window.print=()=>{window.reportPrinted=(window.reportPrinted||0)+1;}')
    page.locator('[data-action="print"]').first.click()
    page.wait_for_function('window.reportPrinted===1')
    page.emulate_media(media='print')
    assert not page.locator('.report-editor').is_visible()
    assert page.locator('#student-report').is_visible()
    page.pdf(path=str(OUT/'student-report.pdf'),format='A4',print_background=True,prefer_css_page_size=True)
    doc=pymupdf.open(OUT/'student-report.pdf')
    text='\n'.join(p.get_text() for p in doc)
    assert 'END-OF-WRITTEN-ANSWER' in text
    assert '테스트 학생' in text
    assert '교사 종합 평가' in text
    assert '침의 아밀레이스가 녹말 일부를 엿당으로 분해하기 때문' in text
    assert '주관식 답변' in text
    assert 3<len(doc)<20
    print(f'PASS PDF: {len(doc)} A4 pages; Korean identity, actual answers, long response tail and teacher feedback included')
    page.emulate_media(media='screen')
    page.screenshot(path=str(OUT/'report-desktop.png'),full_page=True)
    page.set_viewport_size({'width':390,'height':844})
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.locator('.nav-btn[data-view="results"]').click()
    page.get_by_role('button',name='보고서 작성 / PDF 내보내기 ↗').click()
    assert page.locator('#written-surface').input_value()==long_answer
    assert not errors,errors
    print('PASS report entry, escaped text, autosave/reload, export button, mobile layout; no JavaScript errors')
    browser.close()
