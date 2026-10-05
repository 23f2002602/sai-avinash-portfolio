import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.STORY_TEST_URL || 'http://localhost:3210';
const target = await fetch(`http://127.0.0.1:9224/json/new?${encodeURIComponent(base)}`, { method: 'PUT' }).then(r => r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }));
let id = 0;
const pending = new Map();
const browserErrors = [];
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
  if (!message.id) return;
  const task = pending.get(message.id);
  pending.delete(message.id);
  if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
});
const send = (method, params = {}) => new Promise((resolve, reject) => { const key = ++id; pending.set(key, { resolve, reject }); socket.send(JSON.stringify({ id: key, method, params })); });
const evaluate = async expression => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
  return result.result.value;
};
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const active = () => evaluate("document.querySelector('.story-timeline [aria-current]').getAttribute('aria-label')");
const screenshot = async name => {
  const data = await send('Page.captureScreenshot', { format: 'png' });
  const path = join(tmpdir(), name);
  await writeFile(path, Buffer.from(data.data, 'base64'));
  console.log(path);
};
const scrollScene = async (index, fraction = .15) => {
  await evaluate("(() => { const root = document.querySelector('.avinash-film'), stage = document.querySelector('.story-stage'); window.scrollTo({top: scrollY + root.getBoundingClientRect().top - parseFloat(getComputedStyle(stage).top) + (root.offsetHeight - stage.offsetHeight) * (" + index + " + " + fraction + ") / 6, behavior:'instant'}); })()");
  await sleep(250);
};
try {
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Page.bringToFront');
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: base });
  for (let attempt = 0; attempt < 80; attempt++) {
    if (await evaluate("document.querySelector('.motion-experience')?.dataset.motion === 'full'")) break;
    await sleep(200);
  }
  await sleep(1200);
  assert.match(await active(), /Scene 1:/);
  assert.equal(await evaluate("document.querySelector('main img').getAttribute('src')"), '/avinash-portrait.jpg');
  assert.equal(await evaluate("document.querySelector('main img').complete && document.querySelector('main img').naturalWidth > 0"), true);
  assert.equal(await evaluate("Math.abs(document.querySelector('.story-stage').getBoundingClientRect().bottom - innerHeight) < 2"), true, 'stage fills first viewport');
  const firstCanvas = await evaluate("document.querySelector('.scene-particles').toDataURL()");
  await sleep(200);
  assert.notEqual(await evaluate("document.querySelector('.scene-particles').toDataURL()"), firstCanvas, 'particles animate');
  await screenshot('avinash-story-desktop.png');
  await scrollScene(1);
  assert.match(await active(), /Scene 2:/, 'scroll advances story');
  assert.equal(await evaluate("Math.abs(document.querySelector('.story-stage').getBoundingClientRect().top - 76) < 2"), true, 'stage stays pinned');
  await sleep(1000);
  await screenshot('avinash-story-illustration.png');
  const art = await evaluate("document.querySelector('.story-art').getBoundingClientRect().toJSON()");
  await send('Input.dispatchMouseEvent', { type:'mouseMoved', x:art.x + art.width * .8, y:art.y + art.height * .4 });
  await sleep(150);
  assert.notEqual(await evaluate("document.querySelector('.story-art').style.getPropertyValue('--scene-x')"), '', 'pointer affects artwork');
  await evaluate("document.querySelector('.story-ripple').click();document.querySelector('.motion-switch').click()");
  await sleep(250);
  assert.equal(await evaluate("document.querySelector('.motion-experience').dataset.motion"), 'still');
  const frozen = await evaluate("document.querySelector('.scene-particles').toDataURL()");
  await sleep(250);
  assert.equal(await evaluate("document.querySelector('.scene-particles').toDataURL()"), frozen, 'motion toggle freezes particles');
  await scrollScene(3);
  assert.match(await active(), /Scene 4:/, 'motion off retains navigation');
  await evaluate("document.querySelector('.motion-switch').click()");
  await scrollScene(0);
  assert.match(await active(), /Scene 1:/, 'reverse scrolling restores portrait');
  await evaluate("document.querySelector('.story-topline a').click()");
  await sleep(1800);
  assert.equal(await evaluate("document.querySelector('#about').getBoundingClientRect().top < innerHeight / 2"), true, 'skip exits film');
  await evaluate("document.querySelector('#curiosity').scrollIntoView({behavior:'instant'})");
  await sleep(700);
  assert.match(await evaluate("document.querySelector('#curiosity-title').textContent"), /polymath/);
  await screenshot('avinash-curiosity-intro.png');
  await evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant'})");
  for (let index = 0; index < 11; index++) {
    await evaluate("document.querySelectorAll('.curiosity-item')[" + index + "].click()");
    await sleep(70);
    assert.equal(await evaluate("document.querySelector('#interest-detail h3').textContent"), await evaluate("document.querySelector('.curiosity-item[aria-pressed=true] .curiosity-label').textContent"), 'interest selection updates detail');
  }
  assert.match(await evaluate("document.querySelector('#interest-detail .micro').textContent"), /Next to explore/);
  await evaluate("document.querySelectorAll('.curiosity-item')[4].click()");
  await screenshot('avinash-curiosity-objects.png');
  await evaluate("document.querySelector('#work').scrollIntoView({behavior:'instant'});document.querySelectorAll('.project-filter button')[1].click()");
  await sleep(200);
  assert.equal(await evaluate("document.querySelectorAll('.project-card').length"), 3);
  await evaluate("document.querySelectorAll('.project-filter button')[2].click()");
  await sleep(200);
  assert.equal(await evaluate("document.querySelectorAll('.project-card').length"), 1);
  await evaluate("document.querySelector('.project-explore').click()");
  await sleep(500);
  assert.equal(await evaluate("document.querySelector('.project-dialog').open"), true);
  assert.equal(await evaluate("document.querySelector('#project-dialog-title').textContent"), 'PlaceMe');
  await screenshot('avinash-project-dialog.png');
  await send('Input.dispatchKeyEvent', { type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 });
  await send('Input.dispatchKeyEvent', { type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27 });
  await sleep(150);
  assert.equal(await evaluate("document.querySelector('.project-dialog').open"), false);
  assert.equal(await evaluate("document.activeElement.classList.contains('project-explore')"), true);
  await evaluate("document.querySelectorAll('.project-filter button')[0].click();document.querySelector('.project-filter').scrollIntoView({behavior:'instant'})");
  await sleep(1200);
  await screenshot('avinash-project-gallery.png');
  assert.match(await evaluate("document.querySelector('.drink-handoff').textContent"), /coffee addict/);
  assert.equal(await evaluate("document.querySelector('#in-motion, .running-scrub, .running-frames')"), null, 'no separate running section or player');
  assert.deepEqual(await evaluate("[...document.querySelectorAll('#curiosity .curiosity-runner img')].map(el=>el.dataset.source)"), ['shared image (1).jpg','shared image.jpg','shared image (3).jpg'], 'prop preserves supplied order');
  assert.equal(await evaluate("document.querySelector('.curiosity-runner').getAttribute('aria-hidden')"), 'true');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.curiosity-runner')).pointerEvents"), 'none');
  assert.equal(await evaluate("document.querySelectorAll('.curiosity-runner :is(a,button,input,[tabindex])').length"), 0);
  const seekRunner = async progress => {
    await evaluate("(() => { const el = document.querySelector('.curiosity-universe'); window.scrollTo({top: scrollY + el.getBoundingClientRect().top - innerHeight * .8 + " + progress + " * (innerHeight * .8 + el.offsetHeight * .65), behavior:'instant'}); })()");
    await sleep(250);
  };
  let previousPosition;
  for (const [index, progress] of [.15, .5, .85].entries()) {
    await seekRunner(progress);
    assert.equal(await evaluate("document.querySelector('.curiosity-runner').dataset.pose"), String(index + 1), 'scroll advances pose');
    const position = await evaluate("document.querySelector('.curiosity-runner').style.getPropertyValue('--runner-x')");
    assert.notEqual(position, previousPosition, 'runner moves along the thread');
    previousPosition = position;
    assert.equal(await evaluate("[...document.querySelectorAll('.curiosity-runner img')].every(img => img.complete && img.naturalWidth > 0)"), true, 'cutouts load');
  }
  await seekRunner(.15);
  assert.equal(await evaluate("document.querySelector('.curiosity-runner').dataset.pose"), '1', 'reverse scroll restores first pose');
  await evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant'})");
  await screenshot('avinash-running-desktop.png');
  await evaluate("document.querySelector('.curiosity-item').focus()");
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  assert.equal(await evaluate("document.querySelector('#interest-detail h3').textContent"), 'Tech', 'interest keyboard access preserved');
  await evaluate("window.scrollTo({top:0,behavior:'instant'})");
  await send('Emulation.setDeviceMetricsOverride', { width:390,height:844,deviceScaleFactor:1,mobile:true });
  await sleep(400);
  await screenshot('avinash-story-mobile.png');
  await evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant'});document.querySelectorAll('.curiosity-item')[9].click()");
  await sleep(200);
  assert.equal(await evaluate("document.querySelector('#interest-detail h3').textContent"), 'Finance');
  await screenshot('avinash-curiosity-mobile.png');
  await evaluate("document.querySelector('.curiosity-runner').scrollIntoView({behavior:'instant',block:'center'})");
  await sleep(250);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'integrated prop fits mobile');
  assert.equal(await evaluate("(() => { const r=document.querySelector('.curiosity-runner').getBoundingClientRect(); return [...document.querySelectorAll('.curiosity-item')].every(el => { const b=el.getBoundingClientRect(); return r.right <= b.left || r.left >= b.right || r.bottom <= b.top || r.top >= b.bottom; }); })()"), true, 'mobile prop clears all interest buttons');
  await screenshot('avinash-running-mobile.png');
  for (let index = 0; index < 6; index++) {
    await evaluate("document.querySelectorAll('.story-timeline button')[" + index + "].click()");
    await sleep(250);
    assert.match(await active(), new RegExp('Scene ' + (index + 1) + ':'));
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'mobile scene fits horizontally');
    assert.equal(await evaluate("document.querySelector('.story-caption').getBoundingClientRect().bottom < document.querySelector('.story-bottom').getBoundingClientRect().top"), true, 'scene ' + (index + 1) + ' caption clears navigation');
  }
  await scrollScene(2);
  await sleep(1100);
  await screenshot('avinash-story-mobile-scene.png');
  await send('Emulation.setTouchEmulationEnabled', { enabled:true });
  const startY = await evaluate('scrollY');
  await send('Input.dispatchTouchEvent', { type:'touchStart',touchPoints:[{x:200,y:350}] });
  await send('Input.dispatchTouchEvent', { type:'touchMove',touchPoints:[{x:200,y:220}] });
  await sleep(60);
  await send('Input.dispatchTouchEvent', { type:'touchMove',touchPoints:[{x:200,y:130}] });
  await send('Input.dispatchTouchEvent', { type:'touchEnd',touchPoints:[] });
  await sleep(350);
  assert.equal(await evaluate('scrollY') > startY, true, 'vertical touch gesture scrolls through film');
  await scrollScene(5,.99);
  await evaluate("window.scrollBy({top:innerHeight,behavior:'instant'})");
  await sleep(250);
  assert.equal(await evaluate("document.querySelector('#curiosity').getBoundingClientRect().top < innerHeight"), true, 'film releases into interests');
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
  await scrollScene(0);
  await sleep(250);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.story-emphasis')).animationName"), 'none');
  await evaluate("document.querySelectorAll('.story-timeline button')[1].focus()");
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await sleep(250);
  assert.match(await active(), /Scene 2:/, 'keyboard changes scene with reduced motion');
  assert.equal(await evaluate("document.querySelector('.motion-switch').disabled"), true);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.interest-object')).animationName"), 'none', 'reduced motion stops floating objects');
  const stillRunner = await evaluate("document.querySelector('.curiosity-runner').style.cssText");
  await evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant'})");
  await sleep(250);
  assert.equal(await evaluate("document.querySelector('.curiosity-runner').style.cssText"), stillRunner, 'reduced motion freezes runner position');
  assert.equal(await evaluate("document.querySelector('.curiosity-runner').dataset.pose"), '1', 'reduced motion freezes pose');
  await send('Emulation.setDeviceMetricsOverride', {width:320,height:568,deviceScaleFactor:1,mobile:true});
  for (let index = 0; index < 6; index++) {
    await scrollScene(index);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'small phone fits horizontally');
    assert.equal(await evaluate("document.querySelector('.story-caption').getBoundingClientRect().bottom < document.querySelector('.story-bottom').getBoundingClientRect().top"), true, 'small phone caption clears controls');
    assert.equal(await evaluate("document.querySelector('.story-narration').getBoundingClientRect().top > document.querySelector('.story-topline').getBoundingClientRect().bottom"), true, 'small phone heading clears top links');
  }
  // A fixed sequence, never a user-selectable global theme.
  assert.equal(await evaluate("document.querySelector('.drink-switch')"), null);
  assert.equal(await evaluate("document.querySelector('.coke-act').compareDocumentPosition(document.querySelector('.coffee-act')) & Node.DOCUMENT_POSITION_FOLLOWING"), 4);
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'no-preference'}] });
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  for (let index=0; index<6; index++) {
    await scrollScene(index);
    await sleep(800);
    assert.equal(await evaluate("document.querySelector('.story-stage').dataset.cokeStep"), String(index));
    if (index>0) assert.equal(await evaluate("document.querySelector('.coke-story-art') !== null"), true);
    await screenshot('avinash-coke-process-' + index + '.png');
  }
  await evaluate("document.querySelector('#coffee').scrollIntoView({behavior:'instant'})");
  await screenshot('avinash-drink-handoff.png');
  for (let index=0; index<6; index++) {
    await evaluate("document.querySelectorAll('.brew-steps button')["+index+"].click()");
    await sleep(600);
    assert.equal(await evaluate("document.querySelector('.coffee-act').dataset.brewStage"), String(index), 'coffee stages follow chapter markers');
    assert.equal(await evaluate("document.querySelectorAll('.brew-steps button')["+index+"].getAttribute('aria-current')"), 'step');
    const art = await evaluate("document.querySelector('.coffee-process-art').getBoundingClientRect().toJSON()");
    assert.ok(art.height > 100 && art.width > 100, 'process artwork is visible');
    await screenshot('avinash-coffee-process-' + index + '.png');
  }
  await evaluate("document.querySelectorAll('.brew-steps button')[0].focus()");
  await send('Input.dispatchKeyEvent', {type:'keyDown',key:'Enter',code:'Enter',text:'\r',windowsVirtualKeyCode:13});
  await send('Input.dispatchKeyEvent', {type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
  await sleep(200);
  assert.equal(await evaluate("document.querySelector('.coffee-act').dataset.brewStage"), '0', 'keyboard and reverse navigation work');
  for (const width of [390,320]) {
    await send('Emulation.setDeviceMetricsOverride', {width,height:844,deviceScaleFactor:1,mobile:true});
    assert.equal(await evaluate("(() => { const motion=document.querySelector('.motion-switch').getBoundingClientRect(), explore=document.querySelector('.mobile-explore').getBoundingClientRect(); return motion.right <= explore.left && explore.right <= innerWidth; })()"), true, 'mobile header controls stay separate');
    for (let index=0; index<6; index++) {
      await evaluate("document.querySelectorAll('.brew-steps button')["+index+"].click()");
      await sleep(200);
      assert.equal(await evaluate("document.querySelector('.coffee-act').dataset.brewStage"), String(index), 'mobile coffee stage');
      assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true, 'coffee fits mobile');
      assert.equal(await evaluate("document.querySelector('.coffee-rail').getBoundingClientRect().bottom < innerHeight * .55"), true, 'mobile leaves space to read');
    }
    await screenshot('avinash-coffee-process-mobile-' + width + '.png');
  }
  await send('Emulation.setEmulatedMedia', { features:[{name:'prefers-reduced-motion',value:'reduce'}] });
  await sleep(200);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.finished-steam path')).animationName"), 'none', 'reduced motion freezes steam');
  await evaluate("document.querySelectorAll('.brew-steps button')[1].click()");
  await sleep(200);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.grinder-handle')).animationName"), 'none', 'reduced motion freezes grinder');
  assert.equal(await evaluate("document.querySelector('.coffee-art-button').disabled"), true);
  assert.deepEqual(browserErrors, [], 'no browser exceptions');
  console.log('PASS: first portrait, six Coke moments, six coffee stages, integrated runner, interests, project controls, keyboard, mobile, reverse scrolling and reduced motion.');
} finally {
  socket.close();
  await fetch('http://127.0.0.1:9224/json/close/' + target.id);
}
