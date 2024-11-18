export default async function decorate(block) {
  // Setting background image
  const bgImage = block.querySelector('.brochure-list > div:first-child picture img');
  block.style.backgroundImage = `url(${bgImage.src})`;
  block.querySelector('.brochure-list > div:first-child').remove();

  // Ensuring links open in a new tab
  block.querySelectorAll('a').forEach((button) => {
    button.target = '_blank';
  });
}
