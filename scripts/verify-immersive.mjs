import assert from 'node:assert/strict';
import { withBrowser, viewports, verifyLayout } from './verify-story.mjs';

await withBrowser(async browser => {
  assert.equal(await browser.evaluate("document.querySelectorAll('nav[aria-label=\"Choose your way through the portfolio\"] a').length"), 3, 'three exploration paths');
  await browser.evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant',block:'center'})");
  await browser.poll("document.querySelector('[data-floating-active=true]')", 'visible floating objects');
  await browser.evaluate("document.querySelectorAll('#curiosity img').forEach(img=>img.loading='eager');Promise.all([...document.querySelectorAll('#curiosity img')].map(img=>img.decode().catch(()=>{})))");
  const point = await browser.evaluate("(()=>{const r=document.querySelector('.curiosity-item .curiosity-object-wrap').getBoundingClientRect();return{x:r.left+r.width*.75,y:r.top+r.height*.45}})()");
  await browser.send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...point });
  await browser.poll("document.querySelector('.curiosity-item [data-floating-active]').style.getPropertyValue('--object-x')!==''", 'pointer tilt responds');
  await browser.evaluate("document.querySelector('[aria-label=\"Tune the interest dial\"]').focus()");
  await browser.key('End', 'End', 35);
  await browser.poll("document.querySelector('.curiosity-item-10').getAttribute('aria-pressed')==='true'", 'native dial keyboard tuning');
  await verifyLayout(browser, 'immersive orbit');
  await browser.screenshot('floating-orbit');
  await browser.evaluate("document.querySelector('.project-explore').click()");
  await browser.poll("document.querySelector('.project-dialog').open", 'project walkthrough dialog');
  for (let index = 0; index < 3; index++) {
    await browser.evaluate(`document.querySelectorAll('[aria-controls=walkthrough-detail]')[${index}].click()`);
    await browser.poll(`document.querySelector('#walkthrough-detail > span').textContent==='Step ${index + 1} / 3'`, 'workflow stage updates');
  }
  await browser.screenshot('project-walkthrough');
  await browser.key('Escape', 'Escape', 27);
  await browser.poll("!document.querySelector('.project-dialog').open", 'dialog closes');
  assert.equal(await browser.evaluate("document.activeElement.classList.contains('project-explore')"), true, 'focus returns');
  await browser.evaluate("document.querySelector('.motion-switch').click()");
  await browser.poll("document.querySelector('.motion-experience').dataset.motion==='still'", 'motion disabled');
  assert.equal(await browser.evaluate("[...document.querySelectorAll('[data-floating-active]')].some(el=>el.dataset.floatingActive==='true')"), false, 'floating pauses with motion off');
  for (const viewport of viewports) {
    await browser.viewport(viewport);
    await browser.evaluate("document.querySelector('.curiosity-universe').scrollIntoView({behavior:'instant',block:'center'})");
    for (let index = 0; index < 11; index++) {
      await browser.evaluate(`document.querySelector('.curiosity-item-${index}').click()`);
      assert.equal(await browser.evaluate("(()=>{const panel=document.querySelector('.curiosity-center').getBoundingClientRect();return [...document.querySelectorAll('.curiosity-label')].every(el=>{const r=el.getBoundingClientRect();return r.right<=panel.left||r.left>=panel.right||r.bottom<=panel.top||r.top>=panel.bottom})})()"), true, `${viewport.name} interest labels unobstructed`);
    }
    await browser.evaluate("document.querySelector('nav[aria-label=\"Choose your way through the portfolio\"]').scrollIntoView({behavior:'instant',block:'start'})");
    await new Promise(resolve => setTimeout(resolve, 150));
    await verifyLayout(browser, `${viewport.name} exploration paths`);
    await browser.evaluate("document.querySelector('.project-explore').click()");
    await browser.poll("document.querySelector('.project-dialog').open", 'responsive dialog');
    assert.equal(await browser.evaluate("document.querySelector('.project-dialog').scrollWidth<=document.querySelector('.project-dialog').clientWidth+1"), true, 'walkthrough has no horizontal overflow');
    await browser.key('Escape', 'Escape', 27);
  }
  console.log('PASS: three exploration paths, floating depth and pointer tilt, keyboard dial, guided project workflows, dialog focus restoration, six viewport layouts and motion-off behavior.');
});
