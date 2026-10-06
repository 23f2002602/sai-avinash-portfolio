import assert from 'node:assert/strict';
import { poses, coffeeStages, viewports, allowPendingAssets, withBrowser, verifyAssets, verifyLayout, verifyCoffeeArt, verifyCoffeeMarkers, verifyCoffeeLayers, seekStory, seekCoffee } from './verify-story.mjs';

// Verification only. The shared harness writes captures into a unique tmp folder.
async function verifyAvatar(browser, selector, index, expectedPose, label) {
  const query = "document.querySelectorAll(" + JSON.stringify(selector) + ")[" + index + "]";
  await browser.poll(`(() => { const image=${query}; return image instanceof SVGImageElement && !!image.href.baseVal; })()`, label + ' avatar image exists');
  const image = await browser.evaluate(`(() => {
    const image=${query},layer=image.closest('[data-story-layer],.coffee-art-layer'),r=image.getBoundingClientRect(),parent=layer.getBoundingClientRect();
    const src=image instanceof HTMLImageElement ? image.currentSrc || image.src : image instanceof SVGImageElement ? image.href.baseVal : null;
    return {tag:image.tagName.toLowerCase(),pose:image.dataset.pose,path:src ? new URL(src,location.href).pathname : null,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,parent:parent.toJSON(),opacity:Number(getComputedStyle(layer).opacity)};
  })()`);
  assert.equal(image.pose,expectedPose,label+' correct pose');
  assert.equal(image.path,'/avinash-3d/'+expectedPose+'.webp',label+' approved character raster asset even when props are pending');
  assert.equal(image.tag,'image',label+' SVG image embeds a character raster');
  assert.ok(image.width>20 && image.height>20 && image.opacity>.95,label+' visible avatar');
  assert.ok(image.left>=image.parent.left-2 && image.right<=image.parent.right+2 && image.top>=image.parent.top-2 && image.bottom<=image.parent.bottom+2,label+' complete avatar fits layer');
  assert.ok(image.left>=-1 && image.right<=(await browser.evaluate('innerWidth'))+1,label+' fits horizontally');
  // Short windows stack story panels in normal page flow.
  if (await browser.evaluate('innerHeight>599')) assert.ok(image.top>=-2 && image.bottom<=(await browser.evaluate('innerHeight'))+2,label+' complete avatar fits viewport');
  await verifyLayout(browser,label);
}

async function verifyCoffeeFrame(browser,index,label) {
  await verifyCoffeeArt(browser,index);
  await verifyCoffeeMarkers(browser); await verifyCoffeeLayers(browser);
  const frame=await browser.evaluate(`(() => {
    const layer=document.querySelectorAll('.coffee-art-layer')[${index}],art=layer.querySelector('.coffee-process-art') || layer.querySelector('[data-artwork-pending]');
    const rect=art.getBoundingClientRect(),parent=layer.getBoundingClientRect(),style=getComputedStyle(art);
    return {rect:rect.toJSON(),parent:parent.toJSON(),opacity:Number(getComputedStyle(layer).opacity),fit:style.objectFit,image:art instanceof HTMLImageElement,width:innerWidth,height:innerHeight};
  })()`);
  assert.ok(frame.rect.width>20 && frame.rect.height>20 && frame.opacity>.95,label+' active raster or pending frame has visible reserved space');
  assert.ok(frame.rect.left>=frame.parent.left-2 && frame.rect.right<=frame.parent.right+2 && frame.rect.top>=frame.parent.top-2 && frame.rect.bottom<=frame.parent.bottom+2,label+' complete coffee art fits its persistent layer');
  assert.ok(frame.rect.left>=-1 && frame.rect.right<=frame.width+1,label+' coffee frame fits horizontally');
  if (frame.image) assert.equal(frame.fit,'contain',label+' raster preserves the complete artwork');
  // Mobile and short desktop artwork is above the content in normal page flow.
  if (frame.width>760 && frame.height>599) assert.ok(frame.rect.top>=-2 && frame.rect.bottom<=frame.height+2,label+' pinned coffee artwork fits viewport');
  await verifyLayout(browser,label);
}

await withBrowser(async browser => {
  await verifyAssets(browser);
  const storyPoses=['hold','open','sip','enjoy','wave'];
  const seen=new Set();
  assert.equal(await browser.evaluate("document.querySelectorAll('[data-story-layer] .mini-me[data-pose]').length"),5,'each story layer has one avatar');
  for (const viewport of viewports) {
    console.log('Checking avatars: '+viewport.name);
    await browser.viewport(viewport);
    for (let index=0;index<storyPoses.length;index++) {
      await seekStory(browser,index);
      await verifyAvatar(browser,'[data-story-layer] .mini-me[data-pose]',index,storyPoses[index],viewport.name+' story '+(index+1));
      seen.add(storyPoses[index]);
      if (viewport.name==='desktop') await browser.screenshot('avatar-story-'+storyPoses[index]);
    }
    // Coffee has six persistent raster frames; only grind/enjoy use character masters.
    assert.equal(await browser.evaluate("document.querySelectorAll('.coffee-art-layer .mini-me').length"),0,'coffee no longer embeds mini-me SVG avatars');
    for (let index=0;index<coffeeStages.length;index++) {
      await seekCoffee(browser,index);
      await verifyCoffeeFrame(browser,index,viewport.name+' coffee '+coffeeStages[index]);
      if (index===1) seen.add('grind');
      if (index===5) seen.add('coffee');
    }
    await browser.screenshot('avatar-coffee-'+viewport.name);
  }
  assert.deepEqual([...seen].sort(),[...poses].sort(),'all seven poses exercised in browser');
  await browser.viewport(viewports[2]); await browser.media(true);
  await seekStory(browser,2,true,true);
  await verifyAvatar(browser,'[data-story-layer][data-active=true] .mini-me[data-pose]',0,'sip','reduced-motion story');
  await seekCoffee(browser,1,true,true);
  await verifyCoffeeFrame(browser,1,'reduced-motion coffee grind');
  await seekCoffee(browser,5,true,true);
  await verifyCoffeeFrame(browser,5,'reduced-motion coffee enjoy');
  assert.equal(await browser.evaluate("document.querySelector('.coffee-art-button').disabled"),true,'reduced motion disables coffee replay');
  assert.deepEqual(await browser.evaluate("[...document.querySelectorAll('.mini-me,.coffee-art-stack')].flatMap(el=>el.getAnimations({subtree:true})).filter(animation=>animation.playState==='running' && animation.effect?.getTiming().iterations===Infinity).map(animation=>animation.animationName || 'infinite animation')"),[],'reduced motion stops character and coffee animation');
  console.log('PASS: seven character poses, six persistent coffee raster frames, six stable markers, six responsive viewports and reduced-motion keyboard navigation. Seven 1536x2048 character masters decoded. ' + (allowPendingAssets ? 'Six /theme-3d props and eleven 4K /interests-3d masters remain pending.' : 'Six themed props and eleven 4K interest masters decoded.') + ' No public assets written.');
});
