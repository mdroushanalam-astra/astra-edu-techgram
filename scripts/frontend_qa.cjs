const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/Md Roushan/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out = path.resolve('docs/frontend/screens');fs.mkdirSync(out,{recursive:true});
const sizes=[['desktop',1440,900],['wide',1920,1080],['tablet',820,1180],['mobile',390,844]];
(async()=>{
 const b=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const p=await context.newPage();const errors=[];const issues=[];let apiCalls=0;
 p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(new URL(r.url()).pathname.startsWith('/api'))apiCalls++;});
 async function capture(name){
  await p.evaluate(()=>document.fonts.ready);
  for(const [label,width,height] of sizes){await p.setViewportSize({width,height});await p.waitForTimeout(75);await p.evaluate(async()=>Promise.all([...document.images].map(im=>im.decode().catch(()=>{}))));
   const overflow=await p.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('.main button,.main input,.main select,.journey-footer')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left < -2 || r.right > innerWidth+2)}).map(e=>e.textContent?.slice(0,70))}));
   if(overflow.scroll>width+2 || overflow.bad.length)issues.push({name,label,...overflow});
   await p.screenshot({path:path.join(out,`${name}-${label}.png`),fullPage:true});
  }
  await p.setViewportSize({width:1440,height:900});console.log('Reviewed',name);
 }
 const button=name=>p.getByRole('button',{name,exact:true});
 await p.goto('http://127.0.0.1:5174');await button('Explore the learning journey →').waitFor();await capture('01-welcome');
 await button('Explore the learning journey →').click();await capture('02-meet');
 await button('Let’s get to know you →').click();await p.getByLabel('What should I call you?').fill('Arjun');await capture('03-details');
 await button('Next →').click();await button('CGive me another explanation').count();await capture('04-questions');
 await button('Next →').click();await capture('05-summary');
 await button('Change something').click();assert.equal(await p.getByLabel('What should I call you?').inputValue(),'Arjun');await button('Next →').click();await button('Next →').click();await button('Looks good! →').click();await capture('06-home');
 await p.getByRole('navigation').getByRole('button',{name:'Learning Map'}).click();await button('See the bigger picture').click();await capture('07-plan');
 await button('Next 7 days').click();await p.getByRole('heading',{name:'Connect the ideas'}).waitFor();await button('Start today’s step →').click();await capture('08-confirm');
 await button('Start 40-min session →').click();await p.locator('.answer-grid').waitFor();await capture('09-session');
 await p.getByRole('button',{name:/Pen$/}).click();const canvas=p.locator('canvas');const r=await canvas.boundingBox();await p.mouse.move(r.x+30,r.y+30);await p.mouse.down();await p.mouse.move(r.x+80,r.y+80,{steps:5});await p.mouse.up();await p.getByRole('button',{name:/Undo$/}).click();await p.getByRole('button',{name:/Clear$/}).click();await p.getByRole('button',{name:/Pen$/}).click();
 await p.locator('.answer-grid button').nth(0).click();await button('Continue →').click();
 await p.locator('.answer-grid button').nth(0).click();await p.getByText('Let’s revisit this',{exact:true}).waitFor();await button('Continue →').click();
 await p.locator('.answer-grid button').nth(2).click();await button('Continue →').click();
 await button('End session').click();await p.getByText('You answered 3 questions and got 2 correct.',{exact:false}).waitFor();await capture('11-complete');
 await button('See what you achieved →').click();await capture('12-debrief');
 await p.locator('.options button').nth(1).click();await button('Choose what comes next →').click();await capture('13-next');
 await button('Sounds good →').click();await capture('14-artifacts');
 await button('View notes ↗').click();await p.getByRole('dialog').waitFor();await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.closest('dialog')!==null),true);await p.keyboard.press('Escape');await p.getByRole('dialog').waitFor({state:'hidden'});
 const download=p.waitForEvent('download');await button('Download .txt ↓').click();const d=await download;assert.equal(d.suggestedFilename(),'astra-session-notes.txt');
 await button('Back to your room →').click();await capture('15-return');
 for(const [screen,label] of [['map','Learning Map'],['growth','Growth'],['library','Library'],['agency','Agency'],['settings','Settings']]){await p.getByRole('navigation').getByRole('button',{name:label}).click();await capture(screen);}
 await button('Save preferences').click();await p.getByRole('status').waitFor();await p.reload();await button('Explore the learning journey →').waitFor();await button('Explore the learning journey →').click();await button('Let’s get to know you →').click();assert.equal(await p.getByLabel('What should I call you?').inputValue(),'Arjun');
 assert.equal(apiCalls,0,'Preview made an API request');assert.deepEqual(errors,[],'Browser errors');
 fs.writeFileSync('docs/frontend/preview-qa.json',JSON.stringify({viewports:sizes,errors,issues,apiCalls,journey:'Onboarding edits, 3 answers, pen/undo/clear, completion, reflection, next step, notes dialog, download, return and sidebar checked'},null,2));
 await b.close();assert.deepEqual(issues,[],'Viewport overflow');console.log('Full preview journey passed across 4 viewports');
})().catch(e=>{console.error(e);process.exit(1)});

