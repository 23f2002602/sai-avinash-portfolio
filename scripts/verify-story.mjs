import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { tsImport } from 'tsx/esm/api';

export const poses = ['wave', 'hold', 'open', 'sip', 'enjoy', 'grind', 'coffee'];
export const allowPendingAssets = process.env.STORY_ALLOW_PENDING_ASSETS === '1';
export const coffeeStages = ['beans', 'grind', 'brew', 'milk', 'stir', 'enjoy'];
const theme = tsImport('../lib/themed-assets.ts', import.meta.url);
export const viewports = [
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
  { name: 'tablet', width: 834, height: 1112, mobile: true },
  { name: 'mobile', width: 390, height: 844, mobile: true },
  { name: 'small-phone', width: 320, height: 568, mobile: true },
  { name: 'short-landscape', width: 844, height: 390, mobile: true },
  { name: 'height-boundary', width: 1024, height: 600, mobile: false },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// Shared CDP harness: importing does not run the suite. All captures stay in tmp.
export async function withBrowser(run) {
  const base = process.env.STORY_TEST_URL || 'http://localhost:3210';
  const endpoint = 'http://127.0.0.1:9224';
  const response = await fetch(endpoint + '/json/new?about:blank', { method: 'PUT', signal: AbortSignal.timeout(10000) });
  assert.ok(response.ok, 'CDP available on 127.0.0.1:9224');
  const target = await response.json();
  const socket = new WebSocket(target.webSocketDebuggerUrl);
  const pending = new Map();
  const errors = [];
  let id = 0, directory;
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP connection timed out')), 10000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, { once: true });
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP connection failed')); }, { once: true });
    });
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
      if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push(message.params.args.map(arg => arg.description ?? arg.value ?? '').join(' '));
      const task = pending.get(message.id);
      if (!task) return;
      pending.delete(message.id); clearTimeout(task.timer);
      if (message.error) task.reject(new Error(message.error.message)); else task.resolve(message.result);
    });
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const key = ++id;
      const timer = setTimeout(() => { pending.delete(key); reject(new Error('CDP timed out: ' + method)); }, 20000);
      pending.set(key, { resolve, reject, timer });
      socket.send(JSON.stringify({ id: key, method, params }));
    });
    const evaluate = async expression => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    const poll = async (expression, label, timeout = 6000) => {
      const end = Date.now() + timeout;
      while (Date.now() < end) { if (await evaluate('Boolean(' + expression + ')')) return; await sleep(80); }
      throw new Error('Timed out waiting for ' + label);
    };
    const viewport = async ({ width, height, mobile }) => {
      // Cancel the preceding chapter's smooth seek before resizing its geometry.
      await evaluate('window.scrollTo({top:scrollY,left:0,behavior:"instant"})');
      await send('Emulation.setDeviceMetricsOverride', { width, height, mobile, deviceScaleFactor: 1 });
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
      await evaluate('document.fonts.ready.then(()=>true)');
      await evaluate('window.scrollTo({top:0, behavior:"instant"})');
      const deadline=Date.now()+8000;
      let previous,stable=0,last;
      while (Date.now()<deadline) {
        await sleep(100);
        last=await evaluate(`(() => {
          const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'),header=document.querySelector('.site-header');
          return {width:innerWidth,height:innerHeight,x:scrollX,y:scrollY,documentHeight:document.documentElement.scrollHeight,rootTop:root.getBoundingClientRect().top,rootHeight:root.offsetHeight,stageHeight:stage.offsetHeight,headerHeight:header.getBoundingClientRect().height};
        })()`);
        const atOrigin=Math.abs(last.x)<1 && Math.abs(last.y)<1;
        const unchanged=previous && Object.keys(last).every(key=>Math.abs(last[key]-previous[key])<1);
        stable=last.width===width && last.height===height && atOrigin && unchanged ? stable+1 : 0;
        if (stable>=5) {
          await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
          return;
        }
        // Resize/scroll anchoring can restore a previous position asynchronously.
        if (!atOrigin) await evaluate('window.scrollTo({top:0,left:0,behavior:"instant"})');
        previous=last;
      }
      throw new Error('Viewport and scroll reset did not settle: '+JSON.stringify(last));
    };
    const media = async reduced => {
      await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
      await sleep(150);
    };
    const key = async (key, code, virtualKey, text) => {
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: virtualKey, ...(text ? { text } : {}) });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: virtualKey });
    };
    const screenshot = async name => {
      directory ||= await mkdtemp(join(tmpdir(), 'avinash-verification-'));
      assert.match(name, /^[a-z0-9-]+$/i);
      const capture = await send('Page.captureScreenshot', { format: 'png' });
      const path = join(directory, name + '.png');
      await writeFile(path, Buffer.from(capture.data, 'base64'));
      console.log('Screenshot: ' + path);
    };
    await send('Page.enable'); await send('Runtime.enable'); await send('Page.bringToFront');
    await media(false);
    await send('Emulation.setDeviceMetricsOverride', { width:1440, height:1000, mobile:false, deviceScaleFactor:1 });
    const navigation = await send('Page.navigate', { url: base });
    assert.ok(!navigation.errorText, 'Navigation failed: ' + navigation.errorText);
    await poll("document.readyState === 'complete' && document.querySelector('[data-photo-hero]') && document.querySelectorAll('[data-story] [data-story-layer]').length === 5", 'approved photo hero and five story layers', 30000);
    await poll("document.querySelector('.motion-experience')?.dataset.motion === 'full'", 'hydrated motion controls');
    await sleep(800);
    await poll("document.querySelectorAll('.coffee-art-layer').length === 6 && document.querySelectorAll('.brew-heading [data-coffee-layer]').length === 6", 'six persistent coffee artwork and narration layers');
    await evaluate(`(() => {
      window.__verificationLayers = [...document.querySelectorAll('[data-story] [data-story-layer]')];
      window.__verificationCoffeeLayers = [...document.querySelectorAll('.coffee-act [data-coffee-layer]')];
      window.__verificationCoffeeMarkers = [...document.querySelectorAll('[data-coffee-step]')];
      return true;
    })()`);
    try {
      await run({ base, send, evaluate, poll, viewport, media, key, screenshot });
    } catch (error) {
      await screenshot('failure').catch(() => {});
      if (errors.length) console.error('Browser errors:', errors);
      throw error;
    }
    await sleep(200);
    assert.deepEqual(errors, [], 'no runtime exceptions or console errors');
  } finally {
    for (const task of pending.values()) { clearTimeout(task.timer); task.reject(new Error('CDP session closed')); }
    socket.close();
    await fetch(endpoint + '/json/close/' + target.id, { signal: AbortSignal.timeout(5000) }).catch(() => {});
  }
}

export async function verifyAssets(browser) {
  if (allowPendingAssets) console.log('PENDING ASSETS: six /theme-3d props and eleven /interests-3d masters may be absent; seven character masters remain required (STORY_ALLOW_PENDING_ASSETS=1).');
  const results = await browser.evaluate('Promise.all(' + JSON.stringify(poses) + `.map(async pose => {
    const response = await fetch('/avinash-3d/' + pose + '.webp');
    if (!response.ok) return {pose, status:response.status};
    const blob = await response.blob(), bitmap = await createImageBitmap(blob);
    const result = {pose,status:response.status,type:blob.type,width:bitmap.width,height:bitmap.height};
    bitmap.close(); return result;
  }))`);
  const missing = results.filter(result=>result.status!==200);
  assert.deepEqual(missing, [], 'all seven pose files fetch successfully');
  for (const result of results) {
    assert.equal(result.status, 200, result.pose + ' asset fetch');
    assert.equal(result.type.split(';')[0], 'image/webp', result.pose + ' content type');
    assert.deepEqual([result.width,result.height], [1536,2048], result.pose + ' master dimensions');
  }
  const { musicAssets, coffeeAssets, interestAssets, themedAssetsReady, interestAssetsReady } = await theme;
  const props = [...Object.values(musicAssets), ...Object.values(coffeeAssets).filter(asset => asset.src.startsWith('/theme-3d/'))];
  assert.equal(new Set(props.map(asset => asset.src)).size, 6, 'six distinct themed props in the typed map');
  const interests = Object.values(interestAssets);
  assert.equal(new Set(interests.map(asset => asset.src)).size, 11, 'eleven distinct 4K interest masters in the typed map');
  if (!allowPendingAssets) {
    assert.equal(themedAssetsReady, true, 'strict mode requires generated and approved themed props');
    assert.equal(interestAssetsReady, true, 'strict mode requires generated and approved 4K interest masters');
    await browser.evaluate("document.querySelectorAll('.curiosity-dial img').forEach(img=>img.loading='eager')");
    await browser.poll("document.querySelectorAll('[data-artwork-pending]').length===0",'strict mode rejects pending artwork placeholders after dial decoding');
    const allGenerated = [...props, ...interests];
    const propsResult = await browser.evaluate('Promise.all(' + JSON.stringify(allGenerated) + `.map(async asset => {
      const response = await fetch(asset.src);
      if (!response.ok) return {src:asset.src,status:response.status};
      const blob=await response.blob(),bitmap=await createImageBitmap(blob);
      const result={src:asset.src,status:response.status,type:blob.type,width:bitmap.width,height:bitmap.height};
      bitmap.close(); return result;
    }))`);
    for (const [index, result] of propsResult.entries()) {
      assert.equal(result.status, 200, result.src + ' prop fetch');
      assert.equal(result.type.split(';')[0], 'image/webp', result.src + ' prop content type');
      assert.deepEqual([result.width, result.height], [allGenerated[index].width, allGenerated[index].height], result.src + ' mapped master dimensions');
    }
    for (const asset of Object.values(musicAssets)) {
      await browser.evaluate(`document.querySelector('img[src="${asset.src}"]')?.scrollIntoView({behavior:'instant',block:'center'})`);
      await browser.poll(`(() => { const img=document.querySelector('img[src="${asset.src}"]'); return img?.complete && img.naturalWidth>0 && !img.hidden && getComputedStyle(img).display!=='none' && getComputedStyle(img).visibility!=='hidden' && Number(getComputedStyle(img).opacity)>.95; })()`, asset.src + ' renders');
    }
  }
  await browser.poll("document.querySelector('[data-photo-hero] img')?.complete && document.querySelector('[data-photo-hero] img').naturalWidth > 0", 'hero photo loads');
  assert.equal(await browser.evaluate("!!(document.querySelector('[data-photo-hero]').compareDocumentPosition(document.querySelector('[data-story]')) & Node.DOCUMENT_POSITION_FOLLOWING)"), true, 'photo precedes story');
}

export async function verifyPersistentLayers(browser) {
  assert.equal(await browser.evaluate("window.__verificationLayers.length === 5 && window.__verificationLayers.every((layer,i) => layer === document.querySelectorAll('[data-story] [data-story-layer]')[i] && ['true','false'].includes(layer.dataset.active))"), true, 'five layer nodes persist with explicit active states');
  assert.equal(await browser.evaluate("window.__verificationLayers.every(layer=>layer.getAttribute('aria-hidden')===String(layer.dataset.active!=='true') && layer.inert===(layer.dataset.active!=='true'))"),true,'active state matches aria-hidden and inert');
}

export async function verifyCoffeeMarkers(browser) {
  const state = await browser.evaluate(`(() => {
    const markers=[...document.querySelectorAll('[data-coffee-step]')],content=document.querySelector('.coffee-content');
    return {
      values:markers.map(marker=>marker.dataset.coffeeStep),
      persistent:markers.length===window.__verificationCoffeeMarkers.length && markers.every((marker,i)=>marker===window.__verificationCoffeeMarkers[i] && marker.isConnected),
      inContent:markers.every(marker=>content.contains(marker)),
      targets:markers.map((marker,index)=> index===0 ? marker.matches('#work') : index===1 ? !marker.matches('.project-card') && marker.contains(document.querySelector('.project-filter')) && marker.contains(document.querySelector('.projects-grid')) : index===2 ? marker.matches('#leadership') : index===3 ? marker.matches('.skills-block') : index===4 ? marker!==document.querySelector('#reels') && marker.contains(document.querySelector('#reels')) : marker.matches('#contact')),
      cardMarkers:document.querySelectorAll('.project-card[data-coffee-step],.project-card [data-coffee-step]').length
    };
  })()`);
  assert.deepEqual(state.values, ['0','1','2','3','4','5'], 'exactly six unique coffee markers in chapter order');
  assert.ok(state.persistent && state.inContent, 'original marker nodes persist inside coffee content');
  assert.deepEqual(state.targets, Array(6).fill(true), 'markers belong to work, gallery wrapper, leadership, skills, reels wrapper, contact');
  assert.equal(state.cardMarkers, 0, 'filterable cards own no coffee markers');
}

export async function verifyCoffeeLayers(browser) {
  const state=await browser.evaluate(`(() => {
    const groups=['.coffee-art-stack','.brew-heading','.brew-note'].map(selector=>[...document.querySelector(selector).querySelectorAll('[data-coffee-layer]')]);
    const selected=Number(document.querySelector('.coffee-act').dataset.brewStage);
    const layers=[...document.querySelectorAll('.coffee-act [data-coffee-layer]')];
    return {
      persistent:layers.length===18 && layers.every((layer,i)=>layer===window.__verificationCoffeeLayers[i]),
      groups:groups.map(group=>group.map(layer=>({index:Number(layer.dataset.coffeeLayer),active:layer.dataset.active,inert:layer.inert,hidden:layer.getAttribute('aria-hidden'),inline:layer.style.getPropertyValue('--coffee-layer-opacity'),rendered:Number(getComputedStyle(layer).opacity)}))),
      selected,artCount:document.querySelectorAll('.coffee-art-layer').length,
      live:document.querySelector('.coffee-act [role=status]')?.textContent.trim(),
      nav:[...document.querySelectorAll('.brew-steps button')].map(button=>button.getAttribute('aria-current'))
    };
  })()`);
  assert.ok(state.persistent, 'eighteen artwork, heading and note nodes persist');
  assert.equal(state.artCount, 6, 'six persistent coffee art layers');
  assert.match(state.live, new RegExp('Coffee stage '+(state.selected+1)+' of 6: '+coffeeStages[state.selected]+'$', 'i'), 'live narration follows dominant stage');
  assert.equal(state.nav.filter(value=>value==='step').length, 1, 'one current coffee control');
  assert.equal(state.nav[state.selected], 'step', 'coffee navigation follows dominant stage');
  for (const [groupIndex, group] of state.groups.entries()) {
    assert.deepEqual(group.map(layer=>layer.index), [0,1,2,3,4,5], 'six ordered layers per coffee stack');
    for (const layer of group) {
      assert.equal(layer.active, String(layer.index===state.selected), 'dominant coffee layer active flag');
      assert.equal(layer.inert, layer.index!==state.selected, 'inactive coffee layers inert');
      if (groupIndex>0) assert.equal(layer.hidden, String(layer.index!==state.selected), 'inactive narration hidden from assistive technology');
      assert.ok(layer.inline.trim()!=='' && Number.isFinite(Number(layer.inline)) && Number(layer.inline)>=0 && Number(layer.inline)<=1, 'valid coffee opacity');
      assert.ok(Math.abs(layer.rendered-Number(layer.inline))<.025, 'coffee rendered opacity follows inline opacity');
      assert.ok(Math.abs(Number(layer.inline)-Number(state.groups[0][layer.index].inline))<.001, 'artwork and narration crossfade together');
    }
    assert.ok(Math.abs(group.reduce((sum,layer)=>sum+Number(layer.inline),0)-1)<.025, 'each coffee stack has total opacity one');
  }
}

export async function verifyCoffeeArt(browser, index) {
  const { coffeeAssets }=await theme;
  const stage=coffeeStages[index],asset=coffeeAssets[stage];
  const pending=allowPendingAssets && asset.src.startsWith('/theme-3d/');
  if (!pending) await browser.poll(`(() => { const img=document.querySelectorAll('.coffee-art-layer')[${index}]?.querySelector('img.coffee-process-art'); return img?.complete && img.naturalWidth>0; })()`, stage+' coffee raster loads');
  const state=await browser.evaluate(`(() => {
    const layer=document.querySelectorAll('.coffee-art-layer')[${index}],frame=layer.querySelector('[data-coffee-art]'),img=layer.querySelector('img.coffee-process-art');
    return {stage:frame?.dataset.coffeeArt,mini:layer.querySelectorAll('.mini-me').length,pending:layer.querySelector('[data-artwork-pending]')?.dataset.artworkPending,image:img ? {path:new URL(img.currentSrc||img.src,location.href).pathname,width:Number(img.getAttribute('width')),height:Number(img.getAttribute('height')),naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,alt:img.getAttribute('alt'),hidden:img.getAttribute('aria-hidden'),draggable:img.draggable} : null};
  })()`);
  assert.equal(state.stage, stage, 'coffee artwork stage hook');
  assert.equal(state.mini, 0, 'coffee uses raster art without mini-me SVG hooks');
  if (pending && !state.image) { assert.equal(state.pending, stage, stage+' has an explicit pending artwork placeholder'); return; }
  assert.ok(state.image, stage+' uses an img.coffee-process-art raster');
  assert.equal(state.image.path, asset.src, stage+' typed asset path');
  assert.deepEqual([state.image.width,state.image.height], [asset.width,asset.height], stage+' reserved raster dimensions');
  assert.equal(state.image.alt, '', 'decorative coffee raster has empty alt');
  assert.equal(state.image.hidden, 'true', 'coffee raster is decorative');
  assert.equal(state.image.draggable, false, 'coffee raster cannot be dragged');
  if (!pending) assert.deepEqual([state.image.naturalWidth,state.image.naturalHeight], [asset.width,asset.height], stage+' decoded dimensions');
}

export async function seekStory(browser, index, keyboard = false, instant = false) {
  await browser.evaluate("document.querySelectorAll('.story-timeline button')[" + index + "]." + (keyboard ? 'focus' : 'click') + '()');
  if (keyboard) await browser.key('Enter', 'Enter', 13, '\r');
  await browser.poll("document.querySelector('[data-story-stage]').dataset.scene === '" + (index+1) + "' && document.querySelectorAll('.story-timeline button')[" + index + "].getAttribute('aria-current') === 'step'", 'story scene ' + (index+1), instant ? 800 : 6000);
  if (!instant) await sleep(150);
  await waitForScroll(browser,instant);
  await browser.poll(`(() => { const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'),layer=root.querySelectorAll('[data-story-layer]')[${index}],header=document.querySelector('.site-header').getBoundingClientRect().bottom; return innerHeight<=599 ? Math.abs(layer.getBoundingClientRect().top-header)<3 : Math.abs(stage.getBoundingClientRect().top-(parseFloat(getComputedStyle(stage).top)||0))<3; })()`, 'requested story panel is in viewport');
  assert.equal(await browser.evaluate("document.querySelector('[data-story-stage]').dataset.scene"), String(index+1), 'settled scene');
  await verifyPersistentLayers(browser);
}

export async function seekCoffee(browser, index, keyboard = false, instant = false) {
  await browser.evaluate("document.querySelectorAll('.brew-steps button')[" + index + "]." + (keyboard ? 'focus' : 'click') + '()');
  if (keyboard) await browser.key('Enter', 'Enter', 13, '\r');
  await browser.poll("document.querySelectorAll('.brew-steps button')[" + index + "].getAttribute('aria-current') === 'step' && document.querySelectorAll('.coffee-art-layer[data-active=true]').length === 1", 'coffee stage ' + (index+1), instant ? 800 : 6000);
  if (!instant) await sleep(150);
  await waitForScroll(browser,instant);
  assert.equal(await browser.evaluate("document.querySelectorAll('.brew-steps button')[" + index + "].getAttribute('aria-current')"), 'step', 'settled coffee stage');
  await verifyCoffeeMarkers(browser);
  await verifyCoffeeLayers(browser);
  const offset=await browser.evaluate(`(() => {
    const root=document.querySelector('.coffee-act'),marker=document.querySelector('[data-coffee-step="${index}"]'),header=document.querySelector('.site-header'),nav=document.querySelector('.brew-steps');
    const headerBottom=['sticky','fixed'].includes(getComputedStyle(header).position) ? Math.max(0,header.getBoundingClientRect().bottom) : 0;
    const navHeight=getComputedStyle(nav).position==='sticky' ? nav.getBoundingClientRect().height : 0;
    const line=headerBottom+navHeight+16,markerTop=marker.getBoundingClientRect().top;
    const maximum=document.documentElement.scrollHeight-innerHeight;
    return {headerBottom,navHeight,line,markerTop,stored:parseFloat(getComputedStyle(root).getPropertyValue('--coffee-seek-offset')),margin:parseFloat(getComputedStyle(marker).scrollMarginTop),clamped:Math.abs(scrollY-maximum)<2 && markerTop>line};
  })()`);
  assert.ok(Math.abs(offset.stored-offset.line)<2, 'coffee seek offset includes sticky header, sticky step bar and 16px clearance');
  assert.ok(Math.abs(offset.margin-offset.line)<2, 'coffee markers share navigation scroll margin');
  assert.ok(offset.clamped || (offset.markerTop <= offset.line+1 && offset.markerTop >= offset.line-18), 'coffee target lands just past the measured activation line unless constrained by document end: '+JSON.stringify(offset));
}

async function waitForScroll(browser,instant) {
  let previous=await browser.evaluate('scrollY'),stable=0;
  const deadline=Date.now()+(instant ? 800 : 6000);
  while (Date.now()<deadline) {
    await sleep(100);
    const current=await browser.evaluate('scrollY');
    stable=Math.abs(current-previous)<1 ? stable+1 : 0;
    if (stable>=3) return;
    previous=current;
  }
  throw new Error('Timeline scroll did not settle');
}

export async function verifyLayout(browser, label) {
  const issues = await browser.evaluate(`(() => {
    const issues = [], visible = el => { const r=el.getBoundingClientRect(),s=getComputedStyle(el); return r.width>0 && r.height>0 && r.bottom>0 && r.top<innerHeight && s.display!=='none' && s.visibility!=='hidden' && Number(s.opacity)>.01; };
    // Compare only the intersection visible inside the viewport.
    const overlap = (a,b) => Math.max(a.left,b.left,0)<Math.min(a.right,b.right,innerWidth)-1 && Math.max(a.top,b.top,0)<Math.min(a.bottom,b.bottom,innerHeight)-1;
    if (Math.max(document.documentElement.scrollWidth,document.body.scrollWidth)>innerWidth+1) issues.push('horizontal overflow');
    const captions=[...document.querySelectorAll('[data-story-layer] [data-story-caption], [data-story-layer] .story-caption')].filter(el=>visible(el) && (innerHeight<=599 ? el.closest('[data-story-layer]') === document.querySelectorAll('[data-story-layer]')[Number(document.querySelector('[data-story-stage]').dataset.scene)-1] : el.closest('[data-story-layer]').dataset.active==='true'));
    if (!document.querySelector('[data-story-layer] [data-story-caption], [data-story-layer] .story-caption')) issues.push('missing story captions');
    const controls=[...document.querySelectorAll('[data-story-controls],.story-timeline,.story-topline,.story-ripple,.site-header')].filter(visible);
    for (const caption of captions) for (const control of controls) if (overlap(caption.getBoundingClientRect(),control.getBoundingClientRect())) issues.push('caption overlaps '+control.className);
    for (const selector of ['.story-timeline button','.brew-steps button','.project-filter button','.coffee-art-button','.curiosity-item','.site-header button, .site-header a']) {
      const buttons=[...document.querySelectorAll(selector)].filter(visible);
      for (let i=0;i<buttons.length;i++) {
        const r=buttons[i].getBoundingClientRect();
        if (r.left < -1 || r.right > innerWidth+1) issues.push(selector+' outside viewport');
        for (let j=i+1;j<buttons.length;j++) if (overlap(r,buttons[j].getBoundingClientRect())) issues.push(selector+' controls overlap');
      }
    }
    const rail=document.querySelector('.coffee-rail'),coffeeNav=document.querySelector('.brew-steps');
    if (innerWidth<=760 && coffeeNav) {
      const sticky=getComputedStyle(coffeeNav).position==='sticky' ? coffeeNav : rail;
      if (!sticky || getComputedStyle(sticky).position!=='sticky') issues.push('mobile coffee nav not sticky');
      if (sticky && sticky.getBoundingClientRect().height>=innerHeight*.5) issues.push('mobile coffee nav not compact');
    }
    const nav=document.querySelector('.brew-steps');
    for (const selector of ['.brew-heading [data-active=true]','.brew-note [data-active=true]']) {
      const narration=document.querySelector(selector);
      if (!narration) issues.push('missing coffee narration '+selector);
      if (narration && visible(narration)) for (const control of [nav,document.querySelector('.coffee-art-button'),document.querySelector('.site-header')].filter(el=>el && visible(el))) {
        if (overlap(narration.getBoundingClientRect(),control.getBoundingClientRect())) issues.push(selector+' overlaps '+control.className);
      }
    }
    for (const el of [rail,document.querySelector('.coffee-act'),document.querySelector('.coffee-content')].filter(Boolean)) {
      if (['auto','scroll'].includes(getComputedStyle(el).overflowY) && el.scrollHeight>el.clientHeight+2) issues.push('nested coffee scroller');
    }
    return issues;
  })()`);
  assert.deepEqual(issues, [], label);
}

async function verifyCrossfades(browser) {
  await seekStory(browser,0);
  const geometry=await browser.evaluate("(() => { const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'); return {height:root.offsetHeight,viewport:innerHeight,position:getComputedStyle(stage).position}; })()");
  assert.ok(Math.abs(geometry.height-geometry.viewport*5)<=5, 'desktop story is 500svh');
  assert.equal(geometry.position,'sticky','desktop sticky stage');
  const samples=Array.from({length:126},(_,i)=>i/125);
  for (const [direction,values] of [['forward',samples],['reverse',[...samples].reverse()]]) {
    console.log('Checking '+direction+' crossfades');
    let blends=0;
    for (const progress of values) {
      await browser.evaluate("(() => { const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'),top=parseFloat(getComputedStyle(stage).top)||0; window.scrollTo({top:scrollY+root.getBoundingClientRect().top-top+(root.offsetHeight-stage.offsetHeight)*" + progress + ",behavior:'instant'}); })()");
      await sleep(150);
      await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
      await browser.poll(`(() => {
        const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'),top=parseFloat(getComputedStyle(stage).top)||0;
        const progress=Math.max(0,Math.min(1,(top-root.getBoundingClientRect().top)/(root.offsetHeight-stage.offsetHeight)));
        const position=Math.min(4.999,progress*5),current=Math.floor(position),fraction=position-current;
        const raw=current<4 ? Math.max(0,(fraction-.8)/.2) : 0,blend=raw*raw*(3-2*raw),selected=Math.min(4,current+(blend>.5 ? 1 : 0));
        const layers=[...root.querySelectorAll('[data-story-layer]')];
        return Number(stage.dataset.scene)===selected+1 && layers.every((layer,i)=>layer.dataset.active===String(i===selected) && Math.abs(Number(layer.style.getPropertyValue('--layer-opacity'))-(i===current ? 1-blend : i===current+1 ? blend : 0))<.025);
      })()`, direction+' settled crossfade at '+progress,2000);
      const state=await browser.evaluate("(() => { const root=document.querySelector('[data-story]'),stage=document.querySelector('[data-story-stage]'),stickyTop=parseFloat(getComputedStyle(stage).top)||0; return {scene:Number(stage.dataset.scene),top:stage.getBoundingClientRect().top,stickyTop,progress:Math.max(0,Math.min(1,(stickyTop-root.getBoundingClientRect().top)/(root.offsetHeight-stage.offsetHeight))),layers:[...document.querySelectorAll('[data-story-layer]')].map(el=>({inline:el.style.getPropertyValue('--layer-opacity'),rendered:Number(getComputedStyle(el).opacity),active:el.dataset.active}))}; })()");
      const position=Math.min(4.999,state.progress*5),current=Math.floor(position),fraction=position-current;
      const raw=current<4 ? Math.max(0,(fraction-.8)/.2) : 0;
      const blend=raw*raw*(3-2*raw);
      const expected=Math.min(4,current+(blend>.5 ? 1 : 0))+1;
      assert.equal(state.scene,expected,direction+' dominant crossfade selects scene at '+progress);
      assert.ok(Math.abs(state.top-state.stickyTop)<2,direction+' stage stays pinned at '+progress+': '+state.top+' vs '+state.stickyTop);
      const opacity=state.layers.map(item=>Number(item.inline));
      assert.ok(state.layers.every(item=>item.inline.trim()!=='') && opacity.every(value=>Number.isFinite(value)&&value>=0&&value<=1),'valid inline layer opacities');
      assert.ok(Math.abs(opacity.reduce((a,b)=>a+b,0)-1)<.025,direction+' opacity sum at '+progress+': '+opacity);
      assert.ok(state.layers.every((item,i)=>Math.abs(item.rendered-opacity[i])<.06),'rendered opacity follows inline CSS');
      assert.equal(state.layers.filter(item=>item.active==='true').length,1,'one active sticky layer');
      assert.equal(state.layers[state.scene-1].active,'true','active flag matches scene');
      if (opacity.filter(value=>value>.02&&value<.98).length>=2) blends++;
      if (fraction<=.8 || current===4) assert.equal(opacity.filter(value=>value>.001).length,1,'story holds one layer until the final 20%');
    }
    assert.ok(blends>0,direction+' scroll shows intermediate crossfades');
    await verifyPersistentLayers(browser);
  }
}

async function verifyCoffeeCrossfades(browser, still=false) {
  await seekCoffee(browser,0,false,still);
  const samples=[];
  for (let index=0;index<5;index++) for (const fraction of [0,.4,.79,.8,.84,.9,.96,.995]) samples.push({index,fraction});
  samples.push({index:5,fraction:0});
  for (const [direction,values] of [['forward',samples],['reverse',[...samples].reverse()]]) {
    console.log('Checking coffee '+direction+' crossfades'+(still ? ' with motion off' : ''));
    let blends=0;
    for (const {index,fraction} of values) {
      await browser.evaluate(`(() => {
        const markers=[...document.querySelectorAll('[data-coffee-step]')],root=document.querySelector('.coffee-act');
        const line=parseFloat(getComputedStyle(root).getPropertyValue('--coffee-seek-offset'));
        const start=markers[${index}].getBoundingClientRect().top+scrollY,end=markers[${index+1}]?.getBoundingClientRect().top+scrollY;
        window.scrollTo({top:start-line+(Number.isFinite(end) ? end-start : 0)*${fraction},behavior:'instant'});
      })()`);
      await browser.poll(`(() => {
        const root=document.querySelector('.coffee-act'),content=document.querySelector('.coffee-content'),markers=[...document.querySelectorAll('[data-coffee-step]')];
        const line=parseFloat(getComputedStyle(root).getPropertyValue('--coffee-seek-offset'));
        let interval=0;markers.forEach((marker,i)=>{if(marker.getBoundingClientRect().top<=line)interval=i;});
        const start=markers[interval].getBoundingClientRect().top,end=markers[interval+1]?.getBoundingClientRect().top ?? content.getBoundingClientRect().bottom;
        const progress=Math.max(0,Math.min(1,(line-start)/Math.max(1,end-start)));
        const blend=interval<5 ? Math.max(0,Math.min(1,(progress-.8)/.2)) : 0,selected=interval+Number(blend>.5),visual=${still} ? Number(blend>.5) : blend;
        return Number(root.dataset.brewStage)===selected && [...root.querySelectorAll('[data-coffee-layer]')].every(layer=>{
          const i=Number(layer.dataset.coffeeLayer),expected=i===interval ? 1-visual : i===interval+1 ? visual : 0;
          return layer.dataset.active===String(i===selected) && Math.abs(Number(layer.style.getPropertyValue('--coffee-layer-opacity'))-expected)<.015;
        });
      })()`, direction+' coffee blend '+index+'/'+fraction,2000);
      await verifyCoffeeLayers(browser);
      const opacity=await browser.evaluate("[...document.querySelectorAll('.coffee-art-layer')].map(layer=>Number(layer.style.getPropertyValue('--coffee-layer-opacity')))");
      const intermediate=opacity.filter(value=>value>.02 && value<.98).length;
      if (intermediate>=2) blends++;
      if (still) assert.ok(opacity.every(value=>value===0 || value===1),'motion off uses immediate coffee layer changes');
      else if (fraction<.79 || index===5) assert.equal(intermediate,0,'coffee holds layers before the final 20%');
    }
    if (!still) assert.ok(blends>=5,direction+' shows all five coffee transitions in the final 20%');
    await verifyCoffeeMarkers(browser);
  }
}

async function verifyInterests(browser) {
  const { interestAssetsReady }=await theme;
  const count=await browser.evaluate("document.querySelectorAll('.curiosity-item').length");
  assert.equal(count,11,'all eleven interest buttons');
  if (!interestAssetsReady) {
    assert.equal(await browser.evaluate("document.querySelectorAll('.curiosity-item svg.interest-object').length"),11,'all eleven vector fallbacks remain visible until the complete 4K set is approved');
    assert.equal(await browser.evaluate("document.querySelectorAll('.curiosity-item img.interest-object-raster').length"),0,'no incomplete raster set is mixed into the orbit');
  } else {
    assert.equal(await browser.evaluate("document.querySelectorAll('.curiosity-item img.interest-object-raster').length"),11,'all eleven approved 4K interest masters render');
    await browser.evaluate("document.querySelector('#curiosity').scrollIntoView({behavior:'instant',block:'start'});document.querySelectorAll('.curiosity-item img.interest-object-raster').forEach(img=>img.loading='eager')");
    await browser.poll("[...document.querySelectorAll('.curiosity-item img.interest-object-raster')].every(img=>img.complete&&img.naturalWidth===3840&&img.naturalHeight===2160)",'all 4K interest masters decode at 3840x2160');
  }
  assert.equal(await browser.evaluate("document.querySelectorAll('#curiosity img[src*=runner], #curiosity img[src*=running], #curiosity img[src*=avinash-run]').length"),0,'curiosity has no runner photo');
  assert.equal(await browser.evaluate("!!document.querySelector('.curiosity-dial')"),true,'curiosity has a 3D tuning dial frame');
  if (!allowPendingAssets) assert.equal(await browser.evaluate("new URL(document.querySelector('.curiosity-dial img').src,location.href).pathname"),'/theme-3d/tuning-dial.webp','curiosity uses mapped tuning dial');
  else assert.equal(await browser.evaluate("!!document.querySelector('.curiosity-dial img[src=\"/theme-3d/tuning-dial.webp\"]') || /pending/i.test(document.querySelector('.curiosity-dial').textContent)"),true,'pending dial reserves its frame and reports pending artwork');
  for (let index=0;index<count;index++) {
    await browser.evaluate("document.querySelectorAll('.curiosity-item')["+index+"].click()");
    await browser.poll("document.querySelector('#interest-detail h3')?.textContent === document.querySelector('.curiosity-item[aria-pressed=true] .curiosity-label')?.textContent",'interest detail updates');
    assert.equal(await browser.evaluate("document.querySelectorAll('.curiosity-item[aria-pressed=true]').length"),1,'one selected interest');
  }
  await browser.evaluate("document.querySelector('.curiosity-item').scrollIntoView({behavior:'instant',block:'center'});document.querySelector('.curiosity-item').focus()");
  await browser.key('Enter','Enter',13,'\r');
  await browser.poll("document.querySelector('.curiosity-item').getAttribute('aria-pressed') === 'true'",'keyboard interest selection');
  assert.equal(await browser.evaluate("document.querySelectorAll('.project-filter button').length"),4,'four project filters');
  const filters=[['All work',['InternAssess','PlaceMe','Team185 — Odoo Hackathon','Crop Advisory']],['AI',['InternAssess','Crop Advisory']],['Full stack',['PlaceMe']],['Web apps',['Team185 — Odoo Hackathon']]];
  for (const [index,[label,titles]] of filters.entries()) {
    await browser.evaluate(`document.querySelectorAll('.project-filter button')[${index}].focus()`);
    await browser.key(index%2 ? ' ' : 'Enter', index%2 ? 'Space' : 'Enter', index%2 ? 32 : 13, index%2 ? ' ' : '\r');
    await browser.poll(`document.querySelectorAll('.project-card').length === ${titles.length} && document.querySelectorAll('.project-filter button')[${index}].getAttribute('aria-pressed') === 'true'`,label+' keyboard filter');
    await browser.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
    assert.deepEqual(await browser.evaluate("[...document.querySelectorAll('.project-card h3')].map(el=>el.textContent)"),titles,label+' project titles');
    assert.equal(await browser.evaluate("document.querySelectorAll('.project-filter button[aria-pressed=true]').length"),1,'one selected filter');
    assert.equal(await browser.evaluate("document.querySelector('.projects-grid ~ [role=status]').textContent.trim()"),titles.length+' projects shown','filter live count');
    await verifyCoffeeMarkers(browser); await verifyCoffeeLayers(browser);
    if (index>=2) {
      await browser.evaluate("document.querySelector('.project-explore').focus();window.__verificationDialogTrigger=document.activeElement;true");
      await browser.key('Enter','Enter',13,'\r');
      await browser.poll("document.querySelector('.project-dialog').open",'project dialog');
      assert.equal(await browser.evaluate("document.querySelector('#project-dialog-title').textContent"),titles[0]);
      assert.equal(await browser.evaluate("document.querySelector('.project-dialog').contains(document.activeElement)"),true,'dialog receives keyboard focus');
      if (index===3) {
        const detail=await browser.evaluate("document.querySelector('.dialog-description').textContent");
        for (const phrase of ['Team185','Odoo Hackathon','second-hand marketplace','rupee prices','running total','local storage','simulated authentication']) assert.ok(detail.includes(phrase),'Team185 details: '+phrase);
        assert.doesNotMatch(detail,/Gyaan/i,'no retired project details');
      }
      await browser.key('Escape','Escape',27);
      await browser.poll("!document.querySelector('.project-dialog').open && document.activeElement===window.__verificationDialogTrigger",'dialog closes and restores exact trigger focus');
    }
    if (index===1 || index===3) for (const stage of [1,2,4,5,0]) await seekCoffee(browser,stage,true);
  }
  await browser.evaluate("document.querySelectorAll('.project-filter button')[0].click()");
  await browser.poll("document.querySelectorAll('.project-card').length===4",'restore four projects');
  await verifyCoffeeMarkers(browser);
}

async function verifyMotionOff(browser,reduced) {
  if (reduced) await browser.media(true);
  else { await browser.evaluate("document.querySelector('.motion-switch').focus()"); await browser.key('Enter','Enter',13,'\r'); }
  await browser.poll("document.querySelector('.motion-experience').dataset.motion === 'still'",'motion off');
  assert.equal(await browser.evaluate("document.querySelector('.coffee-act').dataset.coffeeMotion"),'still','coffee follows motion preference');
  assert.equal(await browser.evaluate("document.querySelector('.coffee-art-button').disabled"),true,'motion off disables artwork replay');
  await seekStory(browser,4,true,reduced); await seekStory(browser,0,true,reduced);
  await seekCoffee(browser,5,true,reduced); await seekCoffee(browser,1,true,reduced);
  if (reduced) await verifyCoffeeCrossfades(browser,true);
  const running=await browser.evaluate("document.querySelector('.motion-experience').getAnimations({subtree:true}).filter(animation=>animation.playState==='running' && animation.effect?.getTiming().iterations===Infinity).map(animation=>animation.animationName || 'infinite animation')");
  assert.deepEqual(running,[],'motion off stops continuous animation');
  if (reduced) assert.equal(await browser.evaluate("document.querySelector('.motion-switch').disabled"),true,'OS reduced motion disables toggle');
  else { await browser.evaluate("document.querySelector('.motion-switch').click()"); await browser.poll("document.querySelector('.motion-experience').dataset.motion === 'full'",'motion restored'); }
}

export async function verifyLiveMotionTransitions(browser) {
  await browser.viewport(viewports[0]);
  await seekCoffee(browser,1);
  await browser.evaluate(`(() => {
    const markers=[...document.querySelectorAll('[data-coffee-step]')];
    const line=parseFloat(getComputedStyle(document.querySelector('.coffee-act')).getPropertyValue('--coffee-seek-offset'));
    const start=markers[1].getBoundingClientRect().top+scrollY,end=markers[2].getBoundingClientRect().top+scrollY;
    window.scrollTo({top:start-line+(end-start)*.87,behavior:'instant'});
  })()`);
  await browser.poll("[...document.querySelectorAll('.coffee-art-layer')].filter(layer=>{const opacity=Number(layer.style.getPropertyValue('--coffee-layer-opacity'));return opacity>.02 && opacity<.98}).length===2",'coffee transition in progress');
  const position=await browser.evaluate('scrollY');
  await browser.evaluate("document.querySelector('.motion-switch').click()");
  await browser.poll("document.querySelector('.coffee-act').dataset.coffeeMotion==='still' && [...document.querySelectorAll('.coffee-art-layer')].every(layer=>[0,1].includes(Number(layer.style.getPropertyValue('--coffee-layer-opacity'))))",'motion disabled mid-blend');
  await verifyCoffeeLayers(browser);
  assert.ok(Math.abs(await browser.evaluate('scrollY')-position)<2,'motion toggle does not jump scroll position');
  await browser.evaluate("document.querySelector('.motion-switch').click()");
  await browser.poll("document.querySelector('.coffee-act').dataset.coffeeMotion==='full' && [...document.querySelectorAll('.coffee-art-layer')].filter(layer=>{const opacity=Number(layer.style.getPropertyValue('--coffee-layer-opacity'));return opacity>.02 && opacity<.98}).length===2",'mid-blend resumes at same progress');
  await verifyCoffeeLayers(browser);
  await browser.evaluate("[5,0,4,2].forEach(index=>document.querySelectorAll('.brew-steps button')[index].click())");
  await browser.poll("document.querySelector('.coffee-act').dataset.brewStage==='2'",'rapid coffee clicks settle on final request');
  await waitForScroll(browser,false);
  await verifyCoffeeLayers(browser);
  await browser.viewport(viewports[2]);
  await seekCoffee(browser,0);
  const point=await browser.evaluate("(() => {const r=document.querySelectorAll('.brew-steps button')[1].getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
  await browser.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});
  await browser.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await browser.poll("document.querySelector('.coffee-act').dataset.brewStage==='1'",'touch activates coffee navigation');
  await waitForScroll(browser,false);
  await verifyCoffeeLayers(browser);
  await verifyLayout(browser,'touch coffee navigation');
  await browser.evaluate("document.querySelector('.coffee-presentation').scrollIntoView({behavior:'instant',block:'start'})");
  await browser.poll("document.querySelector('.coffee-act').dataset.headingObscured==='true'",'mobile narration hides before sliding under sticky selector');
  await verifyLayout(browser,'mobile coffee heading under selector');
}

export async function verifyStory(browser) {
  await verifyAssets(browser);
  assert.equal(await browser.evaluate("document.querySelectorAll('.story-timeline button').length"),5,'five story controls');
  assert.equal(await browser.evaluate("document.querySelectorAll('.brew-steps button').length"),6,'six coffee stages');
  await verifyCoffeeMarkers(browser); await verifyCoffeeLayers(browser);
  await verifyCrossfades(browser);
  await verifyCoffeeCrossfades(browser);
  for (const viewport of viewports) {
    console.log('Checking '+viewport.name+' ('+viewport.width+'x'+viewport.height+')');
    await browser.viewport(viewport);
    if (viewport.height<=599) {
      assert.equal(await browser.evaluate("getComputedStyle(document.querySelector('[data-story-stage]')).position !== 'sticky'"),true,'short viewport releases sticky stage');
      const stack=await browser.evaluate("[...document.querySelectorAll('[data-story-layer]')].map(el=>({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,position:getComputedStyle(el).position,opacity:Number(getComputedStyle(el).opacity)}))");
      assert.ok(stack.every((layer,i)=>layer.opacity>.99 && !['absolute','fixed'].includes(layer.position) && (i===0 || layer.top>=stack[i-1].bottom-2)),'five normal stacked panels on short viewport');
    }
    for (const index of [0,1,2,3,4,3,2,1,0]) { await seekStory(browser,index); await verifyLayout(browser,viewport.name+' story '+(index+1)); }
    await browser.screenshot('story-'+viewport.name);
    for (const index of [0,1,2,3,4,5,4,3,2,1,0]) { await seekCoffee(browser,index); await verifyCoffeeArt(browser,index); await verifyLayout(browser,viewport.name+' coffee '+(index+1)); }
    await browser.screenshot('coffee-'+viewport.name);
    await verifyInterests(browser);
    await verifyLayout(browser,viewport.name+' interests');
  }
  await browser.viewport(viewports[0]);
  await verifyLiveMotionTransitions(browser);
  await browser.viewport(viewports[0]);
  await verifyMotionOff(browser,false); await verifyMotionOff(browser,true);
  console.log('PASS: photo hero, persistent story/coffee layers, forward/reverse final-20% crossfades, six unique stable markers, responsive navigation offsets, eleven interests, four project filters, Team185 details and reduced-motion keyboard navigation. Seven character masters validated. ' + (allowPendingAssets ? 'Six /theme-3d props and eleven 4K /interests-3d masters remain pending.' : 'Six themed props and eleven 4K interest masters validated.'));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await withBrowser(verifyStory);
