import assert from 'node:assert/strict';
import { poses, viewports, allowPendingAssets, withBrowser, verifyAssets, verifyLayout, seekStory, seekCoffee } from './verify-story.mjs';

// Verification only. The shared harness writes captures into a unique tmp folder.
async function verifyAvatar(browser, selector, index, expectedPose, label, svg = false) {
  const query = "document.querySelectorAll(" + JSON.stringify(selector) + ")[" + index + "]";
  await browser.poll(`(() => { const image=${query}; return image instanceof HTMLImageElement ? image.complete && image.naturalWidth>0 : image instanceof SVGImageElement ? !!image.href.baseVal : ${allowPendingAssets} && image instanceof SVGGElement; })()`, label + ' avatar loads');
  const image = await browser.evaluate(`(() => {
    const image=${query},layer=image.closest('[data-story-layer],.coffee-art-layer'),r=image.getBoundingClientRect(),parent=layer.getBoundingClientRect();
    const src=image instanceof HTMLImageElement ? image.currentSrc || image.src : image instanceof SVGImageElement ? image.href.baseVal : null;
    return {tag:image.tagName.toLowerCase(),pose:image.dataset.pose,path:src ? new URL(src,location.href).pathname : null,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,parent:parent.toJSON(),opacity:Number(getComputedStyle(layer).opacity)};
  })()`);
  assert.equal(image.pose,expectedPose,label+' correct pose');
  if (!allowPendingAssets) {
    assert.equal(image.path,'/avinash-3d/'+expectedPose+'.webp',label+' approved raster asset');
    assert.ok((svg ? ['image'] : ['img','image']).includes(image.tag),label+' raster image element');
  } else assert.ok(['img','image','g'].includes(image.tag),label+' image or SVG rig');
  assert.ok(image.width>20 && image.height>20 && image.opacity>.95,label+' visible avatar');
  assert.ok(image.left>=image.parent.left-2 && image.right<=image.parent.right+2 && image.top>=image.parent.top-2 && image.bottom<=image.parent.bottom+2,label+' complete avatar fits layer');
  assert.ok(image.left>=-1 && image.right<=(await browser.evaluate('innerWidth'))+1,label+' fits horizontally');
  // Mobile coffee artwork is in normal flow below the sticky chapter navigation.
  if (await browser.evaluate('innerHeight>599 && ' + (!svg ? 'true' : 'innerWidth>760'))) assert.ok(image.top>=-2 && image.bottom<=(await browser.evaluate('innerHeight'))+2,label+' complete avatar fits viewport');
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
    // Other coffee stages depict beans/kettle/milk/spoon; these stages use avatars.
    for (const [index,pose] of [[1,'grind'],[5,'coffee']]) {
      await seekCoffee(browser,index);
      await verifyAvatar(browser,'.coffee-art-layer[data-active=true] .mini-me[data-pose]',0,pose,viewport.name+' coffee '+(index+1),true);
      seen.add(pose);
    }
    await browser.screenshot('avatar-coffee-'+viewport.name);
  }
  assert.deepEqual([...seen].sort(),[...poses].sort(),'all seven poses exercised in browser');
  await browser.viewport(viewports[2]); await browser.media(true);
  await seekStory(browser,2,true,true);
  await verifyAvatar(browser,'[data-story-layer][data-active=true] .mini-me[data-pose]',0,'sip','reduced-motion story');
  await seekCoffee(browser,1,true,true);
  await verifyAvatar(browser,'.coffee-art-layer[data-active=true] .mini-me[data-pose]',0,'grind','reduced-motion coffee',true);
  assert.deepEqual(await browser.evaluate("[...document.querySelectorAll('.mini-me')].flatMap(el=>el.getAnimations({subtree:true})).filter(animation=>animation.playState==='running' && animation.effect?.getTiming().iterations===Infinity).map(animation=>animation.animationName || 'infinite animation')"),[],'reduced motion stops avatar animation');
  console.log('PASS: seven avatar poses, story and coffee layouts, six responsive viewports and reduced-motion keyboard navigation. ' + (allowPendingAssets ? '3D raster assets remain pending.' : 'Seven 1536x2048 WebP masters decoded.') + ' No public assets written.');
});
