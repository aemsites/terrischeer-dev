import { moveInstrumentation } from '../../scripts/scripts.js';
import { createElement } from '../../scripts/blocks-utils.js';
import { fetchPlaceholders } from '../../scripts/aem.js';

function addEvent(faqTitle, placeholders) {
  faqTitle.addEventListener('click', () => {
    const faqItem = faqTitle.closest('.faq-item');
    faqItem.classList.toggle('visible');
    const faqToggle = faqTitle.querySelector('.faq-title-right');
    if (faqToggle) {
      faqToggle.textContent = faqItem.classList.contains('visible')
        ? `${placeholders.hidedetail}` : `${placeholders.showdetail}`;
    }
  });
}

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();
  const faqPanel = createElement('div', 'faq-panel');
  [...block.children].forEach((row, index) => {
    // decorate faq item label
    const label = row.children[0];
    const faqTitle = createElement('div', 'faq-title');
    const faqTitleLeft = createElement('div', 'faq-title-left');
    const toggle = createElement('div', 'faq-title-right');
    const anchorId = row.children[2]?.textContent || `faq-${index}`;
    toggle.textContent = `${placeholders.showdetail}`;
    faqTitleLeft.append(...label.childNodes);
    faqTitle.append(faqTitleLeft);
    faqTitle.append(toggle);
    addEvent(faqTitle, placeholders);
    // decorate faq item body
    const contentWrapper = row.children[1];
    contentWrapper.className = 'faq-content-wrapper';
    const contentPanel = createElement('div', 'faq-content-panel');
    const content = createElement('div', 'faq-content');
    contentPanel.append(contentWrapper);
    content.append(contentPanel);
    const faqItem = createElement('div', 'faq-item');
    faqItem.id = anchorId;
    // open the faq item when anchor id matches
    if (window.location.hash.substring(1) === anchorId) {
      faqItem.classList.add('visible');
      toggle.textContent = `${placeholders.hidedetail}`;
    }
    moveInstrumentation(row, faqItem);
    faqItem.append(faqTitle, content);
    faqPanel.append(faqItem);
  });
  block.replaceChildren(faqPanel);
}
