import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { createElement } from '../../scripts/blocks-utils.js';

function decorateFooterLogos(block) {
  const footerLogo = block.querySelector('.footer-logo');
  const footerLogoDiv = createElement('div', 'sponsors-logo');
  const logoUls = footerLogo.querySelectorAll('ul');
  [...logoUls].forEach((ul, index) => {
    let logoGroup = '';
    if (index === 0) {
      logoGroup = createElement('div', 'logo-left');
    } else if (index === 1) {
      logoGroup = createElement('div', 'logo-right');
    }
    [...ul.children].forEach((li) => {
      const aLink = li.querySelector('a');
      if (aLink) {
        aLink.target = '_blank';
        logoGroup.appendChild(aLink);
      } else {
        const title = createElement('p', '');
        title.textContent = li.textContent;
        logoGroup.appendChild(title);
      }
    });
    footerLogoDiv.appendChild(logoGroup);
  });
  footerLogo.replaceChildren(footerLogoDiv);
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  // load footer as fragment
  block.textContent = '';
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta.footer || '/footer';
  const fragment = await loadFragment(footerPath);
  decorateFooterLogos(fragment);
  const footer = createElement('div', '');
  while (fragment.firstElementChild) footer.append(fragment.firstElementChild);
  block.append(footer);
}
