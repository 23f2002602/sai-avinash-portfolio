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
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width:600,height:680,deviceScaleFactor:1,mobile:false});
  await send('Emulation.setDefaultBackgroundColorOverride', {color:{r:0,g:0,b:0,a:0}});
  await send('Page.navigate', {url:base+'/mini-avinash.svg'}); await sleep(400);
  assert.equal(await evaluate("document.querySelector('.mini-me').dataset.pose"),'wave');
  const png=await send('Page.captureScreenshot',{format:'png'});
  await writeFile('public/mini-avinash.png',Buffer.from(png.data,'base64'));
  await send('Emulation.setDefaultBackgroundColorOverride');
  await send('Emulation.setDeviceMetricsOverride', {width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate', {url:base}); await sleep(1500);
  assert.equal(await evaluate("document.querySelector('main img').getAttribute('src')"),'/avinash-portrait.jpg');
  for(const [scene,pose] of [[1,'hold'],[2,'open'],[3,'sip'],[4,'enjoy'],[5,'wave']]) {
    await scrollScene(scene); await sleep(500);
    assert.equal(await evaluate("document.querySelector('.coke-story-art .mini-me').dataset.pose"),pose);
    assert.equal(await evaluate("document.querySelector('.coke-story-art .mini-me').getBoundingClientRect().bottom < innerHeight - 30"),true,'full mini-me fits the film frame');
    if(scene===1||scene===3) await screenshot('avinash-mini-'+pose+'.png');
  }
  for(const [stage,pose] of [[1,'grind'],[5,'coffee']]) {
    await evaluate("document.querySelectorAll('.brew-steps button')["+stage+"].click()"); await sleep(300);
    assert.equal(await evaluate("document.querySelector('.coffee-process-art .mini-me').dataset.pose"),pose);
    await screenshot('avinash-mini-'+pose+'.png');
  }
  await send('Emulation.setDeviceMetricsOverride', {width:390,height:844,deviceScaleFactor:1,mobile:true});
  await sleep(250);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  await screenshot('avinash-mini-mobile.png');
  await send('Emulation.setEmulatedMedia', {features:[{name:'prefers-reduced-motion',value:'reduce'}]}); await sleep(200);
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.coffee-process-art .mini-eyes')).animationName"),'none');
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.coffee-process-art .mini-me-body')).animationName"),'none');
  assert.deepEqual(browserErrors,[]);
  console.log('PASS: seven mini-me poses, opening portrait, mobile, reduced motion and SVG/PNG export.');
} finally {socket.close(); await fetch('http://127.0.0.1:9224/json/close/' + target.id);}
