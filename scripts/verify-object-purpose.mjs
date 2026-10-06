import assert from 'node:assert/strict';
import { withBrowser, viewports, seekCoffee, verifyLayout } from './verify-story.mjs';

await withBrowser(async browser => {
  await browser.viewport(viewports[0]);
  await browser.evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant',block:'center'})");
  await browser.poll("document.querySelector('#curiosity').dataset.motionActive==='true'", 'visible active interests');
  await browser.evaluate("document.querySelectorAll('.curiosity-item img').forEach(img=>img.loading='eager')");
  await browser.poll("[...document.querySelectorAll('.curiosity-item img')].every(img=>img.complete&&img.naturalWidth>0)", 'all interest artwork decoded');
  const selectedMotion = "document.querySelector('.curiosity-item[aria-pressed=true] .curiosity-object-wrap').getAnimations({subtree:true}).filter(a=>a.playState==='running' && a.effect.getTiming().iterations===Infinity).length";
  for (let index = 0; index < 11; index++) {
    await browser.evaluate(`document.querySelectorAll('.curiosity-item')[${index}].click()`);
    await browser.poll(`document.querySelectorAll('.curiosity-item')[${index}].getAttribute('aria-pressed')==='true'`, 'interest selected');
    assert.ok(await browser.evaluate(selectedMotion) > 0, 'selected tool shows its action');
    assert.equal(await browser.evaluate("[...document.querySelectorAll('.curiosity-item[aria-pressed=false] .curiosity-object-wrap')].some(el=>el.getAnimations({subtree:true}).some(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity))"), false, 'unselected tools float gently but do not perform selected actions');
    const target = await browser.evaluate("document.querySelector('#interest-detail a').getAttribute('href')");
    assert.ok(await browser.evaluate(`!!document.querySelector(${JSON.stringify(target)})`), 'interest links to an existing section');
  }
  await browser.evaluate("document.querySelector('[aria-label=\"Tune to next interest\"]').click()");
  await browser.poll("document.querySelector('.curiosity-item').getAttribute('aria-pressed')==='true'", 'dial wraps to first interest');
  await verifyLayout(browser, 'purposeful orbit');
  await browser.evaluate("document.querySelectorAll('#curiosity img').forEach(img=>img.loading='eager');Promise.all([...document.querySelectorAll('#curiosity img')].map(img=>img.decode().catch(()=>{})))");
  await new Promise(resolve => setTimeout(resolve, 700));
  await browser.screenshot('purposeful-orbit');
  await browser.evaluate("document.querySelector('#about figure').scrollIntoView({behavior:'instant',block:'center'})");
  await browser.poll("document.querySelector('[data-prop-motion]').dataset.propMotion==='true'", 'visible music prop');
  await browser.evaluate("document.querySelector('[data-prop-motion] button').click()");
  await browser.poll("document.querySelector('[data-prop-motion]').dataset.focus==='true'", 'headphones toggle focus');
  assert.ok(await browser.evaluate("document.querySelector('[data-prop-motion]').getAnimations({subtree:true}).some(a=>a.playState==='running')"), 'headphones respond');
  await verifyLayout(browser, 'focus headphones');
  await browser.screenshot('focus-headphones');
  assert.equal(await browser.evaluate("document.querySelector('#curiosity').dataset.motionActive"), 'false', 'interest actions pause offscreen');
  for (let index = 0; index < 6; index++) {
    await seekCoffee(browser, index);
    await browser.poll("document.querySelector('.coffee-act').dataset.visible==='true'", 'visible coffee artwork');
    assert.ok(await browser.evaluate("document.querySelector('.coffee-art-layer[data-active=true]').getAnimations({subtree:true}).some(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity)"), 'each coffee stage has an action');
    await browser.evaluate("document.querySelector('.coffee-art-button').click()");
    await verifyLayout(browser, `coffee action ${index}`);
    await browser.screenshot(`coffee-action-${index}`);
  }
  await browser.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await browser.poll("document.querySelector('.coffee-act').dataset.coffeeMotion==='still'", 'system reduced motion stops actions');
  await browser.media(false);
  await browser.poll("document.querySelector('.coffee-act').dataset.coffeeMotion==='full'", 'motion returns after system preference');
  await browser.evaluate("document.querySelector('.motion-switch').click()");
  await browser.poll("document.querySelector('.motion-experience').dataset.motion==='still'", 'motion disabled');
  assert.equal(await browser.evaluate("document.querySelector('.coffee-art-stack').getAnimations({subtree:true}).some(a=>a.playState==='running'&&a.effect.getTiming().iterations===Infinity)"), false, 'coffee actions stop');
  await browser.evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant',block:'center'})");
  assert.equal(await browser.evaluate(selectedMotion), 0, 'interest actions stop');
  await browser.media(true);
  for (const viewport of viewports.slice(1)) {
    await browser.viewport(viewport);
    await browser.evaluate("document.querySelector('#interest-detail').scrollIntoView({behavior:'instant',block:'center'})");
    await browser.evaluate("document.querySelector('[aria-label=\"Tune to next interest\"]').focus()");
    await browser.key('Enter', 'Enter', 13, '\r');
    await verifyLayout(browser, `${viewport.name} dial controls`);
    await browser.screenshot(`dial-${viewport.name}`);
  }
  console.log('PASS: eleven purposeful interest tools, dial navigation and chapter links, interactive visual-only headphones, six stage-specific coffee actions, and responsive/reduced-motion controls.');
});
