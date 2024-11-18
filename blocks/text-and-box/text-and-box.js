import { createElement } from '../../scripts/blocks-utils.js';

export default async function decorate(block) {
  const [title, text, boxIconTitle, boxText] = block.querySelectorAll(':scope > div > div');
  const content = createElement('div', '');
  const boxPanel = createElement('div', 'box-panel');
  boxIconTitle.classList.add('box-head');
  content.append(title);
  content.append(text);
  boxPanel.append(boxIconTitle);
  boxPanel.append(boxText);
  content.append(boxPanel);
  block.replaceChildren(...content.children);
}
