const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Md Roushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const domain = process.env.QA_DOMAIN || 'geography';
const checkReference=process.env.QA_REFERENCE==='true';
const checkUnits=process.env.QA_UNITS==='true';
const prefix = checkUnits ? 'units' : checkReference ? 'reference' : domain === 'polity' ? 'polity' : 'upgrade';
const base = process.env.QA_URL || 'http://127.0.0.1:5175';
const sizes = [['desktop',1440,900],['wide',1920,1080],['tablet',820,1180],['mobile',390,844]];
(async () => {
  const browser = await chromium.launch({headless:true, executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const context = await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await context.addInitScript(() => {
    window.__speechTexts=[];
    Object.defineProperty(window,'speechSynthesis',{value:{cancel(){},pause(){},resume(){},speak(u){window.__speechTexts.push(u.text);queueMicrotask(()=>u.onend?.());}}});
  });
  const page = await context.newPage(), errors=[], issues=[], requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(r.url().includes('/learning/')&&r.method()==='POST')requests.push({url:r.url(),body:JSON.parse(r.postData())});});
  const button=name=>page.getByRole('button',{name,exact:true});
  const email=`upgrade-${Date.now()}@example.test`, password='Upgrade-qa-password-2026';
  async function login() {
    await button('Sign in').click(); await page.getByLabel('Email',{exact:true}).fill(email);
    await page.getByLabel('Password',{exact:true}).fill(password); await button('Sign in →').click();
    await page.locator('.plan-card').waitFor();
  }
  async function capture(name) {
    for (const [label,width,height] of sizes) {
      await page.setViewportSize({width,height}); await page.evaluate(()=>document.fonts.ready);
      const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.main button,.main input,.main select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -2||r.right>innerWidth+2)}).map(e=>e.textContent?.slice(0,60))}));
      if(overflow.scroll>width+2||overflow.bad.length)issues.push({name,label,...overflow});
      await page.screenshot({path:`docs/frontend/screens/${prefix}-${name}-${label}.png`,fullPage:true});
    }
    await page.setViewportSize({width:1440,height:900});
  }
  await page.goto(base); const servedBuild = await page.locator('script[src*="/assets/"]').count() ? 'production' : 'development'; await button('Create new account').click();
  await page.getByLabel('Your name',{exact:true}).fill('Mira');await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);await button('Create account →').click();
  await button('Let’s get to know you →').click();if(domain==='polity')await page.getByLabel('What’s your main goal?').selectOption('UPSC Polity');await button('Next →').click();await button('Next →').click();await button('Looks good! →').click();
  await button('Start session →').click();await button('Start 40-min session →').click();await page.locator('.answer-grid').waitFor();
  assert.equal(await button('Give me a hint').isDisabled(),true);if(checkUnits)assert.match(await page.locator('.lesson-objective').innerText(),/new situation without hints/);
  let drop=true;
  await page.route('**/api/learning/*/answer',async route=>{if(drop){drop=false;await route.fetch();await route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({detail:'QA: reply lost after commit'})});}else await route.continue();});
  await page.locator('.answer-grid button').nth(0).click();await button('Retry safely').waitFor();await button('Retry safely').click();await button('Continue →').waitFor();
  const answers=requests.filter(r=>r.url.endsWith('/answer')); assert.equal(answers.at(-1).body.command_id,answers.at(-2).body.command_id);
  await button('Continue →').click();
  // Follow real issued teaching steps; no assumption that every step is a quiz.
  for(let n=0;n<40;n++) {
    if(await button('I’m ready, continue →').count() && await page.locator('.lesson-copy > p').count()) break;
    if(await page.locator('.answer-grid').count()) {await page.locator('.answer-grid button').nth(0).click();await button('Continue →').click();}
    else if(await button('Continue to summary →').count()) await button('Continue to summary →').click();
    else throw new Error('No executable teaching step');
  }
  await page.locator('.lesson-copy').waitFor();await capture('teaching');
  await button('Read aloud').click();assert.ok((await page.evaluate(()=>window.__speechTexts)).length>0);
  if(await page.locator('.diagram-explorer').count()) await page.locator('.diagram-explorer summary').click();
  await button('Pause lesson').click();await button('Resume lesson →').waitFor();await capture('paused');
  // New browser context proves account recovery without any prior localStorage.
  const fresh=await browser.newContext({viewport:{width:1440,height:900}});const returned=await fresh.newPage();
  await returned.goto(base);await returned.getByRole('button',{name:'Sign in',exact:true}).click();
  await returned.getByLabel('Email',{exact:true}).fill(email);await returned.getByLabel('Password',{exact:true}).fill(password);
  await returned.getByRole('button',{name:'Sign in →',exact:true}).click();await returned.locator('.plan-card').waitFor();
  await returned.getByRole('button',{name:'Start session →',exact:true}).click();await returned.getByRole('button',{name:'Start 40-min session →',exact:true}).click();
  await returned.getByRole('button',{name:'Resume lesson →',exact:true}).waitFor();await fresh.close();
  // The other login/start changed revision: this UI must recover the real conflict.
  await button('Resume lesson →').click();await button('Reload latest progress').waitFor();await button('Reload latest progress').click();await page.locator('.error-toast').waitFor({state:'hidden'});
  await button('Resume lesson →').click();await page.locator('main[aria-busy=false]').waitFor();await page.locator('.lesson-copy').waitFor();
  let referencePanel=false, broadSearchRendered=false;
  if(checkReference) {
    for(let step=0;step<60 && !await page.locator('.lesson-reference').count();step++) {
      if(await page.locator('.answer-grid').count()) { await page.locator('.answer-grid button').nth(0).click();await button('Continue →').click(); }
      else {
        const label=await button('Continue to summary →').count()?'Continue to summary →':'I’m ready, continue →';
        const response=page.waitForResponse(r=>r.url().endsWith('/action')&&r.status()===200);await button(label).click();await response;
      }
      await page.waitForTimeout(250);
    }
    await page.locator('.lesson-reference').waitFor();await page.locator('.lesson-reference summary').click();
    assert.match(await page.locator('.lesson-reference').innerText(),/lines/);referencePanel=true;if(checkUnits)await page.locator('.unit-diagram').waitFor();await capture('reference');
  }
  let naturalSteps = 0;
  if(process.env.QA_COMPLETE === 'true') {
    for(;naturalSteps<180;naturalSteps++) {
      if(await button('Continue to summary →').count()) {
        const response=page.waitForResponse(r=>r.url().endsWith('/action')&&r.status()===200);await button('Continue to summary →').click();await response;await page.waitForTimeout(250);continue;
      }
      if(await button('See session summary →').count()) { await button('See session summary →').click(); break; }
      if(await button('See what you achieved →').count()) break;
      if(await page.locator('.answer-grid').count()) {
        await page.locator('.answer-grid button').nth(naturalSteps%4).click();await button('Continue →').waitFor();await button('Continue →').click();
      } else if(await button('I’m ready, continue →').count()) {
        const response=page.waitForResponse(r=>r.url().includes('/learning/')&&r.url().endsWith('/action')&&r.status()===200);
        await button('I’m ready, continue →').click();await response;
      } else throw new Error('No teaching step before natural completion: '+await page.locator('main').innerText());
      await page.waitForTimeout(250);
    }
    assert.ok(naturalSteps<180,'Teacher must finish its composed session');
  } else await button('End session').click();
  await button('See what you achieved →').waitFor();await button('See what you achieved →').click();
  await button('Choose what comes next →').click();await button('Sounds good →').click();await button('View notes ↗').click();await page.getByRole('dialog').waitFor();await page.keyboard.press('Escape');
  await page.getByRole('navigation').getByRole('button',{name:'Library',exact:true}).click();await page.getByLabel('Your topic or question').fill(domain==='polity'?'rights constitution':'sediment deposition');await button('Find lesson sources').click();await page.locator('.knowledge-card').first().waitFor();
  if(checkReference) {
    await page.getByLabel('Your topic or question').fill('monsoon circulation');
    const response=page.waitForResponse(r=>r.url().includes('/knowledge?')&&r.status()===200);await button('Find lesson sources').click();await response;
    await page.getByRole('heading',{name:'7.7 Monsoon system',exact:true}).waitFor();
    assert.match(await page.locator('.knowledge-search').innerText(),/An authored unit is available|This topic may not yet have an assessed lesson/);broadSearchRendered=true;
  }
  await capture('library');
  let unitSelectionPersisted=false;
  if(checkUnits) {
    await page.getByRole('button',{name:'Choose for next session →',exact:true}).first().click();
    assert.equal(await page.getByLabel('Geography teaching unit').inputValue(),'monsoon');
    const startResponse=page.waitForResponse(r=>r.url().endsWith('/start')&&r.status()===200);
    await button('Start 40-min session →').click();const nextView=await (await startResponse).json();
    assert.equal(nextView.lesson.concept_id,'gu_coordinates');
    assert.match(nextView.plan.personalisationApplied.join(' '),/Monsoon/);
    await page.locator('.answer-grid').waitFor();await page.locator('.answer-grid button').nth(0).click();await button('Continue →').click();await page.locator('.coordinate-grid').waitFor();await capture('coordinates');await button('End session').click();await button('See what you achieved →').waitFor();
    unitSelectionPersisted=true;
  }
  await page.getByRole('navigation').getByRole('button',{name:'Settings',exact:true}).click();await page.getByLabel('Occasional light humor').check();await button('Save preferences').click();await page.getByRole('status').filter({hasText:'Your learning preferences are saved to your account.'}).waitFor();await capture('settings');
  await page.locator('main').getByRole('button',{name:'Sign out',exact:true}).click();await login();
  await page.getByRole('navigation').getByRole('button',{name:'Settings',exact:true}).click();assert.equal(await page.getByLabel('Occasional light humor').isChecked(),true);if(checkUnits)assert.equal(await page.getByLabel('Geography teaching unit').inputValue(),'monsoon');
  await page.getByRole('navigation').getByRole('button',{name:'Artifacts',exact:true}).click();await button('View notes ↗').first().waitFor();
  assert.deepEqual(errors,[]);assert.deepEqual(issues,[]);
  fs.writeFileSync('docs/frontend/'+prefix+'-qa.json',JSON.stringify({domain,servedBuild,unitProtocol:checkUnits,unitSelectionPersisted,referencePanel,broadSearchRendered,naturalCompletion:process.env.QA_COMPLETE==='true',naturalSteps,viewports:sizes,errors,issues,serverPreferences:true,serverNotes:true,sourceSearch:true,pauseResumeCrossBrowser:true,actualRevisionConflictRecovery:true,retrySameUUID:true,speechControlDispatch:true,speechProviderQuality:'not evaluated; browser capability varies',liveWebSearch:false},null,2));
  await browser.close();console.log('Connected upgrade journey passed across four viewports.');
})().catch(e=>{console.error(e);process.exit(1)});
