import { createElement } from '../../scripts/blocks-utils.js';

export default async function decorate(block) {
  const [leftBoxContent, rightBoxContent] = block.querySelectorAll(':scope > div');
  const content = createElement('div', '');
  const leftBoxPanel = createElement('div', 'left-box-panel');
  const rightBoxPanel = createElement('div', 'right-box-panel');
  const combinedPlusMobile = createElement('div', 'combined-plus-mobile');
  const combinedPlusDesktop = createElement('div', 'combined-plus-desktop');
  leftBoxPanel.append(leftBoxContent);
  leftBoxPanel.append(combinedPlusMobile);
  const [leftBoxTitle, leftBoxText] = leftBoxPanel.querySelectorAll(':scope > div > div');
  leftBoxTitle.classList.add('left-box-title');
  leftBoxText.classList.add('left-box-text');
  rightBoxPanel.append(rightBoxContent);
  const [rightBoxTitle, rightBoxText] = rightBoxPanel.querySelectorAll(':scope > div > div');
  rightBoxTitle.classList.add('right-box-title');
  rightBoxText.classList.add('right-box-text');
  content.append(combinedPlusDesktop);
  content.append(leftBoxPanel);
  content.append(rightBoxPanel);
  block.replaceChildren(...content.children);
}
