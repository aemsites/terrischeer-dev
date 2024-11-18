import { createOptimizedPicture } from '../../scripts/aem.js';
import { createElement } from '../../scripts/blocks-utils.js';

function addLink(link, optimizedPic) {
  if (link) {
    const aHref = createElement('a', '');
    aHref.href = link.href;
    aHref.append(optimizedPic);
    return aHref;
  }
  return optimizedPic;
}

export default async function decorate(block) {
  const [desktopPic, mobilePic, imageLink] = block.querySelectorAll(':scope > div');
  block.textContent = '';
  const link = imageLink.querySelector('a');
  const desktopImg = desktopPic.querySelector('picture > img');
  if (desktopImg) {
    const optimizedDesktopPic = createOptimizedPicture(desktopImg.src, 'desktop quote image', false, [{ width: '300' }]);
    optimizedDesktopPic.classList.add('desktop-image');
    const imageContent = addLink(link, optimizedDesktopPic);
    block.append(imageContent);
  }
  const mobileImg = mobilePic.querySelector('picture > img');
  if (mobileImg) {
    const optimizedMobilePic = createOptimizedPicture(mobileImg.src, 'mobile quote image', false, [{ width: '300' }]);
    optimizedMobilePic.classList.add('mobile-image');
    const imageContent = addLink(link, optimizedMobilePic);
    block.append(imageContent);
  }
}
