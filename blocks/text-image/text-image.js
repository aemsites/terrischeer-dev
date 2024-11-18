export default function decorate(block) {
  const [mobileImage, desktopImage] = block.querySelectorAll('picture');
  const aElement = block.querySelector('a.button');
  const pElements = block.querySelectorAll('p:not(.button-container):not(:has(picture))');

  if ((!mobileImage && !desktopImage) || !aElement) {
    return;
  }
  mobileImage?.classList?.add('mobile-image');
  desktopImage?.classList?.add('desktop-image');
  pElements.forEach((pElement) => {
    pElement.classList.add('content');
  });
  [mobileImage, desktopImage].forEach((pictureElement) => {
    pictureElement.parentElement.replaceWith(pictureElement);
  });
  aElement.className = 'button';
}
