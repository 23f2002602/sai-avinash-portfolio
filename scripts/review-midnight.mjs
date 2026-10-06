import { withBrowser, viewports, seekCoffee, verifyLayout } from './verify-story.mjs';

await withBrowser(async browser => {
  for (const viewport of viewports) {
    await browser.viewport(viewport);
    await browser.screenshot(`hero-${viewport.name}`);
    for (const id of ['curiosity', 'about', 'experience']) {
      await browser.evaluate(`document.getElementById(${JSON.stringify(id)})?.scrollIntoView({behavior:'instant',block:'start'})`);
      await browser.evaluate('document.querySelectorAll("img").forEach(img=>img.loading="eager")');
      await browser.evaluate('Promise.all([...document.images].map(img=>img.decode().catch(()=>{})))');
      await new Promise(resolve => setTimeout(resolve, 650));
      await verifyLayout(browser, `${viewport.name} ${id}`);
      await browser.screenshot(`${id}-${viewport.name}`);
    }
    for (let index = 0; index < 6; index++) {
      await seekCoffee(browser, index);
      await verifyLayout(browser, `${viewport.name} coffee ${index}`);
      await browser.screenshot(`coffee-${index}-${viewport.name}`);
    }
  }
});
